// Offline only: never loads .env.local, logs keys, contacts providers or replaces source files.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const store = require('../src/lib/credential-store.cjs');
function main(args) {
  const [mode, source, destination] = args;
  if (mode === 'init' && source && args.length === 2) {
    store.createStore(path.resolve(source), {});
  } else if (mode === 'migrate' && source && destination && args.length === 3) {
    const from = path.resolve(source); const to = path.resolve(destination);
    if (from.toLowerCase() === to.toLowerCase()) throw new Error('Source and destination must differ.');
    const payload = fs.readFileSync(from, 'utf8'); const envelope = JSON.parse(payload);
    let keys;
    if (envelope.version === 2) {
      if (!process.env.PREVIOUS_OAUTH_ENCRYPTION_KEY) throw new Error('Previous key required.');
      keys = store.decryptKeys(payload, store.encryptionKey(process.env.PREVIOUS_OAUTH_ENCRYPTION_KEY));
    } else {
      if (!process.env.LEGACY_OAUTH_ENCRYPTION_KEY) throw new Error('Legacy key required.');
      const key = crypto.createHash('sha256').update(process.env.LEGACY_OAUTH_ENCRYPTION_KEY).digest();
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(envelope.iv, 'hex'));
      decipher.setAuthTag(Buffer.from(envelope.authTag, 'hex'));
      keys = store.validateKeys(JSON.parse(Buffer.concat([decipher.update(Buffer.from(envelope.data, 'hex')), decipher.final()]).toString('utf8')));
    }
    store.createStore(to, keys);
    store.decryptKeys(fs.readFileSync(to, 'utf8'));
  } else throw new Error('Invalid arguments.');
  process.stdout.write('Encrypted credential file prepared and verified. Existing source unchanged.\n');
}
try { main(process.argv.slice(2)); }
catch { process.stderr.write('Credential provisioning failed. Usage: init DESTINATION | migrate SOURCE DESTINATION. Check secure environment keys, input and destination permissions. No key values are logged.\n'); process.exitCode = 1; }
