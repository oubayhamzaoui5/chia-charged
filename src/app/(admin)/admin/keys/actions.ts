'use server'

import PocketBase from 'pocketbase'
import { requireAdmin } from '@/lib/auth'
import { getOAuthKeys, saveOAuthKeys, deleteOAuthKeys, mergeOAuthKeys } from '@/lib/oauth-keys'

const PB_URL =
  process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL =
  process.env.PB_ADMIN_EMAIL ?? process.env.POCKETBASE_ADMIN_EMAIL ?? ''
const PB_ADMIN_PASSWORD =
  process.env.PB_ADMIN_PASSWORD ?? process.env.POCKETBASE_ADMIN_PASSWORD ?? ''

async function getAdminPb(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL)
  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
  return pb
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

  const id = clientId.trim()
  const secret = clientSecret.trim()

  if (!id || !secret) {
    return { success: false, error: 'Both Client ID and Client Secret are required.' }
  }

  mergeOAuthKeys({ googleClientId: id, googleClientSecret: secret })

  try {
    const pb = await getAdminPb()
    await pb.settings.update({
      googleAuth: {
        enabled: true,
        clientId: id,
        clientSecret: secret,
      },
    })
  } catch (err) {
    console.error('Failed to apply Google OAuth to PocketBase:', err)
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
    const pb = await getAdminPb()
    await pb.settings.update({ googleAuth: { enabled: false } })
    deleteOAuthKeys()
  } catch (err) {
    console.error('Failed to disable Google OAuth:', err)
    return { success: false, error: 'Failed to disable Google OAuth.' }
  }

  return { success: true }
}

export async function saveStripeKeysAction(
  publishableKey: string,
  secretKey: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  const pk = publishableKey.trim()
  const sk = secretKey.trim()
  if (!pk || !sk) return { success: false, error: 'Both keys are required.' }
  mergeOAuthKeys({ stripePublishableKey: pk, stripeSecretKey: sk })
  return { success: true }
}

export async function deleteStripeKeysAction(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  mergeOAuthKeys({ stripePublishableKey: undefined, stripeSecretKey: undefined })
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
  const id = pixelId.trim()
  if (!id) return { success: false, error: 'Pixel ID is required.' }
  if (!/^\d{10,20}$/.test(id)) return { success: false, error: 'Invalid Pixel ID format (should be 10–20 digits).' }
  mergeOAuthKeys({ metaPixelId: id })
  return { success: true }
}

export async function deleteMetaPixelAction(): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()
  mergeOAuthKeys({ metaPixelId: undefined })
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
