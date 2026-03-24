import 'server-only'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'

export async function getAdminPbForAction() {
  const session = await requireAdmin()
  const pb = createServerPb()
  pb.authStore.save(session.token, {
    id: session.user.id,
    role: session.user.role,
    email: session.user.email,
  } as any)

  return { pb, session }
}
