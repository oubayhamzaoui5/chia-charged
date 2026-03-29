import { Suspense } from 'react'
import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'
import AdminsClient from './admins.client'
import type { AdminUser } from '../users/page'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Chia Charged | Admin Accounts',
  robots: 'noindex, nofollow',
}

async function getAdmins(): Promise<AdminUser[]> {
  const session = await requireAdmin()
  const pb = createServerPb()
  pb.authStore.save(session.token, session.user as any)

  const res = await pb.collection('users').getFullList({
    filter: 'role = "admin"',
    sort: '-created',
    fields: 'id,email,surname,name,phone,username,role,isActive,verified,created',
    requestKey: null,
  })

  return res.map((r: any) => ({
    id: String(r.id),
    email: String(r.email ?? ''),
    surname: String(r.surname ?? ''),
    name: String(r.name ?? ''),
    phone: String(r.phone ?? ''),
    username: String(r.username ?? ''),
    role: 'admin' as const,
    isActive: r.isActive !== false,
    verified: Boolean(r.verified),
    created: String(r.created ?? ''),
  }))
}

export default async function AdminAccountsPage() {
  const session = await requireAdmin()
  const admins = await getAdmins()
  const canManageAdmins = session.user.email.trim().toLowerCase() === 'admin@admin.com'

  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <AdminsClient initialAdmins={admins} canManageAdmins={canManageAdmins} />
    </Suspense>
  )
}
