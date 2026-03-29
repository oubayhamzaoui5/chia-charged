import crypto from 'crypto'
import fs from 'fs'
import path from 'path'

const SECRETS_FILE = path.join(process.cwd(), 'secrets', 'oauth.enc.json')
const ALGORITHM = 'aes-256-gcm'

export interface OAuthKeys {
  googleClientId: string
  googleClientSecret: string
  stripePublishableKey?: string
  stripeSecretKey?: string
  stripeWebhookSecret?: string
  metaPixelId?: string
}

function getEncryptionKey(): Buffer {
  const raw =
    process.env.OAUTH_ENCRYPTION_KEY ??
    'chia-charged-oauth-fallback-dev-key-do-not-use-in-prod'
  return crypto.createHash('sha256').update(raw).digest()
}

function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return JSON.stringify({
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    data: encrypted.toString('hex'),
  })
}

function decrypt(payload: string): string | null {
  try {
    const { iv, authTag, data } = JSON.parse(payload)
    const key = getEncryptionKey()
    const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, 'hex'))
    decipher.setAuthTag(Buffer.from(authTag, 'hex'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(data, 'hex')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

export function getOAuthKeys(): OAuthKeys | null {
  try {
    if (!fs.existsSync(SECRETS_FILE)) return null
    const raw = fs.readFileSync(SECRETS_FILE, 'utf8')
    const plaintext = decrypt(raw)
    if (!plaintext) return null
    return JSON.parse(plaintext) as OAuthKeys
  } catch {
    return null
  }
}

export function saveOAuthKeys(keys: OAuthKeys): void {
  const dir = path.dirname(SECRETS_FILE)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(SECRETS_FILE, encrypt(JSON.stringify(keys)), 'utf8')
}

export function deleteOAuthKeys(): void {
  if (fs.existsSync(SECRETS_FILE)) fs.unlinkSync(SECRETS_FILE)
}

export function mergeOAuthKeys(updates: Partial<OAuthKeys>): void {
  const existing = getOAuthKeys() ?? {}
  const merged = { ...existing, ...updates } as OAuthKeys
  saveOAuthKeys(merged)
}
