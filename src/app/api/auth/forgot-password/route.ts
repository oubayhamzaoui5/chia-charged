import { NextRequest, NextResponse } from 'next/server'
import { createServerPb } from '@/lib/pb'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`forgot-password:${ip}`, 3, 60 * 60 * 1000)
  if (!allowed) {
    // Return success to avoid email enumeration, but don't actually send
    return NextResponse.json({ ok: true })
  }

  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''

    if (!email) {
      return NextResponse.json({ message: 'Email requis.' }, { status: 400 })
    }

    const pb = createServerPb()
    await pb.collection('users').requestPasswordReset(email)

    return NextResponse.json({ ok: true })
  } catch {
    // Always return success to avoid email enumeration
    return NextResponse.json({ ok: true })
  }
}
