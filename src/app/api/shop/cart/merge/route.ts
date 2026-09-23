import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { getSession } from '@/lib/auth/server'
import { mergeGuestCart } from '@/lib/services/shop-user.service'

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ message: 'Not authenticated.' }, { status: 401 })
  try {
    const body = await request.json()
    await mergeGuestCart({ userId: session.user.id, token: session.token }, body?.items)
    return NextResponse.json({ merged: true })
  } catch (error) {
    if (error instanceof ZodError || (error instanceof Error && error.message.startsWith('Invalid guest cart'))) {
      return NextResponse.json({ message: 'Invalid guest cart.' }, { status: 400 })
    }
    return NextResponse.json({ message: 'Unable to merge cart.' }, { status: 500 })
  }
}
