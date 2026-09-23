'use server'

import { requireAdmin } from '@/lib/auth'
import { createServicePb } from '@/lib/pb-service.server'
import { getOAuthKeys, mergeOAuthKeys } from '@/lib/oauth-keys'

async function configureGoogle(clientId?: string, clientSecret?: string) {
  const pb = await createServicePb()
  const users = await pb.collections.getOne('users')
  const oauth2 = users.oauth2 ?? { enabled: false, providers: [] }
  const providers = (oauth2.providers ?? []).filter((provider: { name: string }) => provider.name !== 'google')
  if (clientId && clientSecret) providers.push({ name: 'google', clientId, clientSecret })
  await pb.collections.update('users', { oauth2: { ...oauth2, enabled: providers.length > 0, providers } })
}

function maskId(id: string): string {
  if (id.length <= 12) return '••••••••••••'
  return `${id.slice(0, 8)}••••${id.slice(-4)}`
}

export async function getKeysStatusAction(): Promise<{
  configured: boolean
  clientIdMasked: string | null
}> {
  await requireAdmin()
  const keys = getOAuthKeys()
  if (!keys?.googleClientId) return { configured: false, clientIdMasked: null }
  return { configured: true, clientIdMasked: maskId(keys.googleClientId) }
}

export async function saveKeysAction(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const id = typeof clientId === 'string' ? clientId.trim() : ''
  const secret = typeof clientSecret === 'string' ? clientSecret.trim() : ''

  if (!id || !secret) {
    return { success: false, error: 'Both Client ID and Client Secret are required.' }
  }

  try { mergeOAuthKeys({ googleClientId: id, googleClientSecret: secret }) }
  catch { return { success: false, error: 'Credential storage is unavailable. Check server configuration.' } }

  try {
    await configureGoogle(id, secret)
  } catch {
    return {
      success: true,
      error:
        'Keys saved and encrypted, but could not be applied to PocketBase automatically. ' +
        'Configure the Google provider in the PocketBase admin panel manually.',
    }
  }

  return { success: true }
}

export async function deleteKeysAction(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  try {
    // Verify local storage before changing provider settings.
    getOAuthKeys()
    await configureGoogle()
    mergeOAuthKeys({ googleClientId: undefined, googleClientSecret: undefined })
  } catch {
    return { success: false, error: 'Failed to disable Google OAuth.' }
  }

  return { success: true }
}

export async function saveStripeKeysAction(
  publishableKey: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const pk = typeof publishableKey === 'string' ? publishableKey.trim() : ''
  const sk = typeof secretKey === 'string' ? secretKey.trim() : ''
  if (!/^pk_(test|live)_[A-Za-z0-9]+$/.test(pk) || !/^sk_(test|live)_[A-Za-z0-9]+$/.test(sk) || pk.split('_')[1] !== sk.split('_')[1]) return { success: false, error: 'Provide matching Stripe publishable and secret keys from the same mode.' }
  try { mergeOAuthKeys({ stripePublishableKey: pk, stripeSecretKey: sk }) }
  catch { return { success: false, error: 'Credential storage is unavailable. Check server configuration.' } }
  return { success: true }
}

export async function deleteStripeKeysAction(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try { mergeOAuthKeys({ stripePublishableKey: undefined, stripeSecretKey: undefined, stripeWebhookSecret: undefined }) }
  catch { return { success: false, error: 'Credential storage is unavailable. Check server configuration.' } }
  return { success: true }
}

export async function getStripeKeysStatusAction(): Promise<{
  configured: boolean
  publishableKeyMasked: string | null
}> {
  await requireAdmin()
  const keys = getOAuthKeys()
  if (!keys?.stripePublishableKey || !keys?.stripeSecretKey) {
    return { configured: false, publishableKeyMasked: null }
  }
  const pk = keys.stripePublishableKey
  const masked = pk.length > 12 ? `${pk.slice(0, 8)}••••${pk.slice(-4)}` : '••••••••••••'
  return { configured: true, publishableKeyMasked: masked }
}

export async function saveMetaPixelAction(
  pixelId: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const id = typeof pixelId === 'string' ? pixelId.trim() : ''
  if (!id) return { success: false, error: 'Pixel ID is required.' }
  if (!/^\d{10,20}$/.test(id)) return { success: false, error: 'Invalid Pixel ID format (should be 10–20 digits).' }
  try { mergeOAuthKeys({ metaPixelId: id }) }
  catch { return { success: false, error: 'Credential storage is unavailable. Check server configuration.' } }
  return { success: true }
}

export async function deleteMetaPixelAction(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  try { mergeOAuthKeys({ metaPixelId: undefined }) }
  catch { return { success: false, error: 'Credential storage is unavailable. Check server configuration.' } }
  return { success: true }
}

export async function getMetaPixelStatusAction(): Promise<{
  configured: boolean
  pixelIdMasked: string | null
}> {
  await requireAdmin()
  const keys = getOAuthKeys()
  if (!keys?.metaPixelId) return { configured: false, pixelIdMasked: null }
  return { configured: true, pixelIdMasked: maskId(keys.metaPixelId) }
}

/** Used by public page server components — no admin auth required */
export async function getMetaPixelIdPublicAction(): Promise<string | null> {
  return getOAuthKeys()?.metaPixelId ?? null
}
