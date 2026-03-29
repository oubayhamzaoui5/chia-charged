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

function assertSuperAdminEmail(email?: string) {
  if ((email ?? '').trim().toLowerCase() !== 'admin@admin.com') {
    throw new Error('Only admin@admin.com can perform this action.')
  }
}

function normalizeUsername(email: string) {
  const local = email.split('@')[0] || 'admin'
  return `${local.toLowerCase().replace(/[^a-z0-9._-]/g, '')}-${Date.now().toString().slice(-6)}`
}

export async function createAdminUserAction(input: {
  email: string
  name: string
  surname: string
  password: string
}): Promise<{
  id: string
  email: string
  surname: string
  name: string
  phone: string
  username: string
  role: 'admin'
  isActive: boolean
  verified: boolean
  created: string
}> {
  const session = await requireAdmin()
  assertSuperAdminEmail(session.user.email)

  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()
  const surname = input.surname.trim()
  const password = input.password.trim()

  if (!email || !name || !surname || !password) {
    throw new Error('Email, name, surname and password are required.')
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const pb = createServerPb()
  pb.authStore.save(session.token, session.user as any)

  const created = await pb.collection('users').create({
    email,
    name,
    surname,
    password,
    passwordConfirm: password,
    username: normalizeUsername(email),
    role: 'admin',
    isActive: true,
    verified: true,
  })

  return {
    id: String(created.id),
    email: String(created.email ?? email),
    surname: String(created.surname ?? surname),
    name: String(created.name ?? name),
    phone: String(created.phone ?? ''),
    username: String(created.username ?? ''),
    role: 'admin',
    isActive: created.isActive !== false,
    verified: Boolean(created.verified),
    created: String(created.created ?? ''),
  }
}

export async function resetAdminPasswordAction(userId: string, newPassword: string): Promise<void> {
  assertPocketBaseId(userId, 'user id')
  const session = await requireAdmin()
  assertSuperAdminEmail(session.user.email)

  const password = newPassword.trim()
  if (!password) {
    throw new Error('New password is required.')
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }

  const pb = createServerPb()
  pb.authStore.save(session.token, session.user as any)

  const user = await pb.collection('users').getOne(userId, {
    fields: 'id,role',
    requestKey: null,
  })

  if (String(user.role ?? '') !== 'admin') {
    throw new Error('Password reset is only allowed for admin users.')
  }

  await pb.collection('users').update(userId, {
    password,
    passwordConfirm: password,
  })
}
