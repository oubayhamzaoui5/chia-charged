'use server'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import { cookies } from 'next/headers'

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

      cookieStore.set('pb_auth', authCookie, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      })
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: getErrorMessage(error) }
  }
}
