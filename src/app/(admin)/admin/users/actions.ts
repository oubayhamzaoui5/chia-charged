'use server'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import { assertPocketBaseId } from '@/lib/admin/validation'

export async function toggleUserActiveAction(userId: string, isActive: boolean): Promise<void> {
  assertPocketBaseId(userId, 'user id')
  const session = await requireAdmin()
  const pb = createServerPb()
  pb.authStore.save(session.token, session.user as any)

  await pb.collection('users').update(userId, { isActive })
}
