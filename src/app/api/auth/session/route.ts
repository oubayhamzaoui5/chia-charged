import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'

export async function GET() {
  try {
    const session = await getSession()

    if (!session) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      )
    }

    return NextResponse.json({ user: session.user })
  } catch (error) {
    console.error('Session error:', error)
    return NextResponse.json(
      { message: 'Session check failed' },
      { status: 500 }
    )
  }
}