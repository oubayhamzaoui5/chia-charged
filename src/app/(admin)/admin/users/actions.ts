'use server'

import { requireAdmin, requireAdminManager } from '@/lib/auth'
import { createServicePb } from '@/lib/pb-service.server'
import { assertPocketBaseId } from '@/lib/admin/validation'
import { randomBytes } from 'node:crypto'

export async function toggleUserActiveAction(userId: string, isActive: boolean): Promise<void> {
  assertPocketBaseId(userId, 'user id')
  await requireAdmin()
  const pb = await createServicePb()
  const target = await pb.collection('users').getOne(userId, { fields: 'id,role', requestKey: null })
  if (String(target.role) !== 'customer') throw new Error('Use admin account management for administrators.')
  await pb.collection('users').update(userId, { isActive })
}

function normalizeUsername(email: string) {
  const local = email.split('@')[0] || 'admin'
  return `${local.toLowerCase().replace(/[^a-z0-9._-]/g, '')}-${Date.now().toString().slice(-6)}`
}

export async function createAdminUserAction(input: {
  email: string
  name: string
  surname: string
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
  invitationSent: boolean
}> {
  await requireAdminManager()

  const email = input.email.trim().toLowerCase()
  const name = input.name.trim()
  const surname = input.surname.trim()
  if (!email || !name || !surname) throw new Error('Email, name and surname are required.')
  const pb = await createServicePb()
  const password = randomBytes(32).toString('base64url')

  const created = await pb.collection('users').create({
    email,
    name,
    surname,
    password,
    passwordConfirm: password,
    username: normalizeUsername(email),
    role: 'admin',
    isActive: true,
    verified: false,
    canManageAdmins: false,
  })

  let invitationSent = true
  try {
    await pb.collection('users').requestPasswordReset(email)
  } catch {
    invitationSent = false
  }

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
    invitationSent,
  }
}

export async function sendAdminPasswordResetAction(userId: string): Promise<void> {
  assertPocketBaseId(userId, 'user id')
  await requireAdminManager()
  const pb = await createServicePb()

  const user = await pb.collection('users').getOne(userId, {
    fields: 'id,role,email,isActive',
    requestKey: null,
  })

  if (String(user.role ?? '') !== 'admin') {
    throw new Error('Password reset is only allowed for admin users.')
  }

  if (user.isActive === false) throw new Error('Activate this administrator before sending a reset link.')
  await pb.collection('users').requestPasswordReset(String(user.email))
}
