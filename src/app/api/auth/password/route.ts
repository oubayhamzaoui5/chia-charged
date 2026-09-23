import { authCookieOptions } from '@/lib/auth/cookie-options'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
    const body = await request.json()
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''
    if (!oldPassword || !newPassword || !confirmPassword) return NextResponse.json({ message: 'All fields are required.' }, { status: 400 })
    if (newPassword.length < 8) return NextResponse.json({ message: 'New password must contain at least 8 characters.' }, { status: 400 })
    if (newPassword !== confirmPassword) return NextResponse.json({ message: 'Passwords do not match.' }, { status: 400 })
    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)
    await pb.collection('users').update(session.user.id, { oldPassword, password: newPassword, passwordConfirm: confirmPassword })
    const fresh = createServerPb()
    const auth = await fresh.collection('users').authWithPassword(session.user.email, newPassword)
    const record = auth.record
    const cookieStore = await cookies()
    cookieStore.set('pb_auth', JSON.stringify({ token: auth.token, record: {
      id: record.id, email: record.email, phone: record.phone, surname: record.surname, name: record.name,
      username: record.username, role: record.role || 'customer', isActive: record.isActive !== false,
      canManageAdmins: record.canManageAdmins === true, verified: record.verified || false, avatar: record.avatar || undefined,
    } }), authCookieOptions())
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 400) return NextResponse.json({ message: 'Current password is incorrect or the new password is invalid.' }, { status: 400 })
    return NextResponse.json({ message: 'Could not change password.' }, { status: 500 })
  }
}
