// Node-only storage, shared by the application and offline provisioning tool.
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const fields = new Set(['googleClientId', 'googleClientSecret', 'stripePublishableKey', 'stripeSecretKey', 'stripeWebhookSecret', 'metaPixelId']);
class CredentialStoreError extends Error {
  constructor(message) { super(message); this.name = 'CredentialStoreError'; }
}
function encryptionKey(raw = process.env.OAUTH_ENCRYPTION_KEY) {
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) throw new CredentialStoreError('OAUTH_ENCRYPTION_KEY must contain 32 random bytes encoded as 64 hex characters.');
  return Buffer.from(raw, 'hex');
}
function storePath() {
  const configured = process.env.CREDENTIALS_FILE;
  if (configured && path.isAbsolute(configured)) return configured;
  if (configured || process.env.NODE_ENV === 'production') throw new CredentialStoreError('CREDENTIALS_FILE must be an absolute path on persistent private storage.');
  return path.join(process.cwd(), 'secrets', 'oauth.enc.json');
}
function validateKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new CredentialStoreError('Credential data is invalid.');
  const result = {};
  for (const [name, item] of Object.entries(value)) {
    if (!fields.has(name) || (item !== undefined && (typeof item !== 'string' || item.length > 16384))) throw new CredentialStoreError('Credential data contains unsupported fields or values.');
    if (item !== undefined) result[name] = item;
  }
  return result;
}
function encryptKeys(value, key = encryptionKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from('chia-charged-credentials:v2'));
  const data = Buffer.concat([cipher.update(JSON.stringify(validateKeys(value)), 'utf8'), cipher.final()]);
  return JSON.stringify({ version: 2, iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') });
}
function decryptKeys(payload, key = encryptionKey()) {
  try {
    const value = JSON.parse(payload);
    if (value.version !== 2) throw new CredentialStoreError('Credential file requires the offline migration tool.');
    if (!/^[a-f0-9]{24}$/.test(value.iv) || !/^[a-f0-9]{32}$/.test(value.authTag) || typeof value.data !== 'string' || !/^(?:[a-f0-9]{2})+$/.test(value.data)) throw new Error('Invalid envelope');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(value.iv, 'hex'));
    decipher.setAAD(Buffer.from('chia-charged-credentials:v2'));
    decipher.setAuthTag(Buffer.from(value.authTag, 'hex'));
    return validateKeys(JSON.parse(Buffer.concat([decipher.update(Buffer.from(value.data, 'hex')), decipher.final()]).toString('utf8')));
  } catch (error) {
    if (error instanceof CredentialStoreError) throw error;
    throw new CredentialStoreError('Credential file cannot be decrypted or is corrupted. Check deployment configuration.');
  }
}
function readKeys() {
  const key = encryptionKey(); const file = storePath();
  try {
    if (fs.lstatSync(file).isSymbolicLink()) throw new Error('Symbolic link');
    // Private storage is mounted at runtime; never bundle its contents.
    return decryptKeys(fs.readFileSync(/* turbopackIgnore: true */ file, 'utf8'), key);
  } catch (error) {
    if (error.code === 'ENOENT' && process.env.NODE_ENV !== 'production') return null;
    if (error instanceof CredentialStoreError) throw error;
    throw new CredentialStoreError('Credential file is missing or unreadable. Initialize or migrate private storage before starting production.');
  }
}
function atomicWrite(file, value, key) {
  const temp = `${file}.${crypto.randomUUID()}.tmp`;
  let fd;
  try {
    fd = fs.openSync(temp, 'wx', 0o600);
    fs.writeFileSync(fd, encryptKeys(value, key)); fs.fsyncSync(fd); fs.closeSync(fd); fd = undefined;
    fs.renameSync(temp, file);
  } finally {
    if (fd !== undefined) fs.closeSync(fd);
    if (fs.existsSync(temp)) fs.unlinkSync(temp);
  }
}
function mergeKeys(updates) {
  validateKeys(updates);
  const key = encryptionKey(); const file = storePath();
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  let lock;
  // Lock the entire read/merge/write, including across worker processes.
  try { lock = fs.openSync(`${file}.lock`, 'wx', 0o600); }
  catch { throw new CredentialStoreError('Credential storage is busy or unavailable. Retry after checking storage.'); }
  try { atomicWrite(file, { ...(readKeys() ?? {}), ...updates }, key); }
  catch (error) {
    if (error instanceof CredentialStoreError) throw error;
    throw new CredentialStoreError('Credential settings could not be saved.');
  } finally { fs.closeSync(lock); fs.unlinkSync(`${file}.lock`); }
}
function createStore(file, value, key = encryptionKey()) {
  if (!path.isAbsolute(file)) throw new CredentialStoreError('Destination must be absolute.');
  const encrypted = encryptKeys(value, key);
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const fd = fs.openSync(file, 'wx', 0o600);
  try { fs.writeFileSync(fd, encrypted); fs.fsyncSync(fd); }
  finally { fs.closeSync(fd); }
}
module.exports = { CredentialStoreError, encryptionKey, storePath, validateKeys, encryptKeys, decryptKeys, readKeys, mergeKeys, createStore };
