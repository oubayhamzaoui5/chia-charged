import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

const schema = z.object({ email: z.string().trim().email('Invalid email address.') })

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
    const { email } = schema.parse(await request.json())
    const normalizedEmail = email.toLowerCase()
    if (normalizedEmail.endsWith('@placeholder.local')) return NextResponse.json({ message: 'Use a deliverable email address.' }, { status: 400 })
    if (normalizedEmail === session.user.email.toLowerCase()) return NextResponse.json({ message: 'This is already your email address.' }, { status: 400 })
    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)
    await pb.collection('users').requestEmailChange(normalizedEmail)
    return NextResponse.json({ requestedEmail: normalizedEmail })
  } catch (error: any) {
    if (error instanceof z.ZodError) return NextResponse.json({ message: error.issues[0]?.message }, { status: 400 })
    if (error?.status === 401) return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
    const detail = error?.data?.data
    const message = detail ? Object.values(detail as Record<string, { message?: string }>).map((v) => v.message).filter(Boolean).join(', ') : ''
    return NextResponse.json({ message: message || 'Could not send email change confirmation.' }, { status: error?.status === 400 ? 400 : 500 })
  }
}
