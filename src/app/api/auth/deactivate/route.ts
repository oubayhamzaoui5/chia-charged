import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { authCookieOptions } from '@/lib/auth/cookie-options'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'
import { createServicePb } from '@/lib/pb-service.server'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
    if (session.user.role === 'admin') return NextResponse.json({ message: 'Administrator accounts must be managed by another authorized administrator.' }, { status: 400 })
    const body = await request.json()
    const password = typeof body.password === 'string' ? body.password : ''
    if (!password) return NextResponse.json({ message: 'Current password is required.' }, { status: 400 })
    const verifier = createServerPb()
    const verified = await verifier.collection('users').authWithPassword(session.user.email, password)
    if (verified.record.id !== session.user.id) return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 })
    const service = await createServicePb()
    await service.collection('users').update(session.user.id, { isActive: false })
    const cookieStore = await cookies()
    cookieStore.set('pb_auth', '', authCookieOptions(0))
    return NextResponse.json({ ok: true })
  } catch (error: unknown) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 0
    if (status === 400) return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 400 })
    return NextResponse.json({ message: 'Could not deactivate account.' }, { status: 500 })
  }
}
