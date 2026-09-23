import 'server-only'
import { readKeys, mergeKeys } from '@/lib/credential-store.cjs'
export type { OAuthKeys } from '@/lib/credential-store.cjs'
export { CredentialStoreError } from '@/lib/credential-store.cjs'

export const getOAuthKeys = readKeys
export const mergeOAuthKeys = mergeKeys
