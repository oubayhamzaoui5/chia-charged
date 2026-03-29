import { Suspense } from 'react'
import UsersClient from './users.client'
import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Chia Charged | Admin Customers',
  robots: 'noindex, nofollow',
}

export type AdminUser = {
  id: string
  email: string
  surname: string
  name: string
  phone: string
  username: string
  role: 'admin' | 'customer'
  isActive: boolean
  verified: boolean
  created: string
}

async function getUsers(): Promise<AdminUser[]> {
  const session = await requireAdmin()
  const pb = createServerPb()
  pb.authStore.save(session.token, session.user as any)

  const res = await pb.collection('users').getFullList({
    filter: 'role = "customer"',
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
    role: r.role === 'admin' ? 'admin' : 'customer',
    isActive: r.isActive !== false,
    verified: Boolean(r.verified),
    created: String(r.created ?? ''),
  }))
}

export default async function AdminUsersPage() {
  const users = await getUsers()
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading...</div>}>
      <UsersClient initialUsers={users} />
    </Suspense>
  )
}
