'use server'

import { authCookieOptions } from '@/lib/auth/cookie-options'

import { requireAdmin } from '@/lib/auth'
import { createServicePb } from '@/lib/pb-service.server'
import { STORE_SETTINGS_ID, storeSettingsSchema } from '@/lib/store-settings'
import { revalidatePath } from 'next/cache'

export async function saveStoreSettingsAction(input: unknown) {
  await requireAdmin()
  const parsed = storeSettingsSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: parsed.error.issues[0]?.message ?? 'Invalid settings.' }
  try {
    const pb = await createServicePb()
    await pb.collection('store_settings').update(STORE_SETTINGS_ID, parsed.data)
    revalidatePath('/policies', 'layout')
    return { success: true, message: 'Store settings saved.' }
  } catch { return { success: false, message: 'Could not save settings. Please retry.' } }
}
import { createServerPb } from '@/lib/pb'
import { cookies } from 'next/headers'
import { randomUUID } from 'node:crypto'
import { parseShippingRate, SHIPPING_RECORD_ID, type ShippingPolicy } from '@/lib/shipping'

export async function saveShippingRateAction(rate: string): Promise<{ success: boolean; message: string; policy?: ShippingPolicy }> {
  await requireAdmin()
  let rateCents: number
  try { rateCents = parseShippingRate(rate) } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Invalid shipping rate.' }
  }
  try {
    const email = process.env.PB_ADMIN_EMAIL
    const password = process.env.PB_ADMIN_PASSWORD
    if (!email || !password) throw new Error('Missing backend credentials')
    const pb = createServerPb()
    await pb.collection('_superusers').authWithPassword(email, password)
    const version = randomUUID()
    await pb.collection('shipping_settings').update(SHIPPING_RECORD_ID, { rateCents, version })
    return { success: true, message: 'US shipping rate saved.', policy: { rateCents, version, currency: 'USD', country: 'US' } }
  } catch {
    return { success: false, message: 'Shipping could not be saved. Please try again.' }
  }
}

function getErrorMessage(error: unknown): string {
  if (!error || typeof error !== 'object') return 'Failed to update password.'

  const maybe = error as {
    message?: unknown
    response?: {
      message?: unknown
      data?: Record<string, { message?: string }>
    }
  }

  const fieldErrors = maybe.response?.data
  if (fieldErrors && typeof fieldErrors === 'object') {
    for (const [, detail] of Object.entries(fieldErrors)) {
      if (detail?.message) return detail.message
    }
  }

  if (typeof maybe.response?.message === 'string' && maybe.response.message.trim()) {
    return maybe.response.message
  }

  if (typeof maybe.message === 'string' && maybe.message.trim()) {
    return maybe.message
  }

  return 'Failed to update password.'
}

export async function updateAdminPasswordAction(input: {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}): Promise<{ success: boolean; error?: string }> {
  const currentPassword = input.currentPassword.trim()
  const newPassword = input.newPassword.trim()
  const confirmPassword = input.confirmPassword.trim()

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { success: false, error: 'All password fields are required.' }
  }

  if (newPassword.length < 8) {
    return { success: false, error: 'New password must be at least 8 characters.' }
  }

  if (newPassword !== confirmPassword) {
    return { success: false, error: 'New password and confirmation do not match.' }
  }

  const session = await requireAdmin()
  const pb = createServerPb()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pb.authStore.save(session.token, session.user as any)

  try {
    await pb.collection('users').update(session.user.id, {
      oldPassword: currentPassword,
      password: newPassword,
      passwordConfirm: confirmPassword,
    })

    // Re-authenticate with the new password and refresh auth cookie
    // so the admin stays logged in after password rotation.
    const loginPb = createServerPb()
    const authData = await loginPb.collection('users').authWithPassword(session.user.email, newPassword)

    if (authData?.token && authData?.record) {
      const cookieStore = await cookies()
      const authCookie = JSON.stringify({
        token: authData.token,
        record: {
          id: authData.record.id,
          email: authData.record.email,
          phone: authData.record.phone,
          surname: authData.record.surname,
          name: authData.record.name,
          username: authData.record.username,
          role: authData.record.role || 'customer',
          isActive: authData.record.isActive !== false,
          verified: authData.record.verified || false,
          avatar: authData.record.avatar || undefined,
        },
      })

      cookieStore.set('pb_auth', authCookie, authCookieOptions())
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
