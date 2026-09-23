import 'server-only'
import { createServerPb } from '@/lib/pb'

// Request-local service client. Callers must validate identity, input and ownership.
// Never export this module from a server-action module or import it in client code.
export async function createServicePb() {
  const email = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD
  if (!email || !password) throw new Error('Backend service credentials are not configured.')
  const pb = createServerPb()
  await pb.collection('_superusers').authWithPassword(email, password)
  return pb
}
