import 'server-only'
import { getAppOrigin, getPublicPbOrigin, getServerPbOrigin } from '@/lib/url-policy'
import { encryptionKey, readKeys, storePath } from '@/lib/credential-store.cjs'
export function validateRuntimeConfiguration() {
  getAppOrigin(); getPublicPbOrigin(); getServerPbOrigin()
  if (!process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) throw new Error('PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD are required server credentials.')
  if (process.env.TRUST_PROXY_HEADERS && !['true', 'false'].includes(process.env.TRUST_PROXY_HEADERS)) throw new Error('TRUST_PROXY_HEADERS must be true or false.')
  encryptionKey(); storePath(); readKeys()
}
