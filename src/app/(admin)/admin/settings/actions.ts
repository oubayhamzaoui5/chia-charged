'use server'

import PocketBase from 'pocketbase'
import { requireAdmin } from '@/lib/auth'
import { getOAuthKeys, saveOAuthKeys, deleteOAuthKeys } from '@/lib/oauth-keys'

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

export async function getGoogleKeysStatusAction(): Promise<{
  configured: boolean
  clientIdMasked: string | null
}> {
  await requireAdmin()
  const keys = getOAuthKeys()
  if (!keys) return { configured: false, clientIdMasked: null }
  return { configured: true, clientIdMasked: maskId(keys.googleClientId) }
}

export async function saveGoogleKeysAction(
  clientId: string,
  clientSecret: string
): Promise<{ success: boolean; error?: string }> {
  await requireAdmin()

  const id = clientId.trim()
  const secret = clientSecret.trim()

  if (!id || !secret) {
    return { success: false, error: 'Both Client ID and Client Secret are required.' }
  }

  saveOAuthKeys({ googleClientId: id, googleClientSecret: secret })

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
        'Keys saved locally but could not be applied to PocketBase automatically. ' +
        'You may need to configure the Google provider in the PocketBase admin panel.',
    }
  }

  return { success: true }
}

export async function disableGoogleAction(): Promise<{ success: boolean; error?: string }> {
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
