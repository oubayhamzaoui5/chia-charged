import 'server-only'

import {
  getSession,
  requireAdmin,
  requireAuth,
  isAdmin,
  isAuthenticated,
  type Session,
} from '@/lib/auth/server'

export async function auth(): Promise<Session | null> {
  return getSession()
}

export { requireAuth, requireAdmin, isAdmin, isAuthenticated }
export type { Session }
