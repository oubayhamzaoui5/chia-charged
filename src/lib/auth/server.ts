import { cookies } from 'next/headers'
import { createServerPb } from '@/lib/pb'
import { cache } from 'react'
import { redirect } from 'next/navigation'

export type User = {
  id: string
  email: string
  phone?: string
  surname: string
  name: string
  username: string
  role: 'admin' | 'customer'
  isActive: boolean
  verified: boolean
  avatar?: string
}

export type Session = {
  user: User
  token: string
}

function isPbUnauthorizedError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const candidate = error as { status?: unknown; response?: { code?: unknown } }
  return candidate.status === 401 || candidate.response?.code === 401
}

/**
 * Get current session from cookies (cached per request)
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('pb_auth')

  if (!authCookie) {
    return null
  }

  try {
    const authData = JSON.parse(authCookie.value)
    
    if (!authData.token || !authData.record) {
      return null
    }

    const pb = createServerPb()
    pb.authStore.save(authData.token, authData.record)

    if (!pb.authStore.isValid) {
      return null
    }

    // Validate token against PocketBase and always use fresh user data.
    const refreshed = await pb.collection('users').authRefresh()
    const record = refreshed.record ?? authData.record

    const user: User = {
      id: record.id,
      email: record.email,
      phone: record.phone || '',
      surname: record.surname || '',
      name: record.name || '',
      username: record.username || '',
      role: record.role || 'customer',
      isActive: record.isActive !== false,
      verified: record.verified || false,
      avatar: record.avatar || undefined,
    }

    // Check if user is active
    if (!user.isActive) {
      return null
    }

    return {
      user,
      token: refreshed.token || authData.token,
    }
  } catch (e) {
    // Expired/invalid tokens are expected and should not pollute the dev overlay.
    if (isPbUnauthorizedError(e)) {
      return null
    }

    console.error('Session validation error:', e)
    return null
  }
})

/**
 * Require authentication - use in server components
 */
export async function requireAuth(): Promise<Session> {
  const session = await getSession()
  
  if (!session) {
    redirect('/connexion')
  }

  return session
}

/**
 * Require admin role - use in admin pages
 */
export async function requireAdmin(): Promise<Session> {
  const session = await requireAuth()
  
  if (session.user.role !== 'admin') {
    redirect('/connexion')
  }

  return session
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession()
  return session !== null
}

/**
 * Check if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession()
  return session?.user.role === 'admin'
}
