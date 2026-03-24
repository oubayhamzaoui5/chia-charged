import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import PocketBase from 'pocketbase'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'

type SyncBody = {
  token?: string
  user?: {
    id?: string
    email?: string
    phone?: string
    surname?: string
    name?: string
    username?: string
    role?: string
    isActive?: boolean
    verified?: boolean
    avatar?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SyncBody
    if (!body?.token || !body?.user?.id) {
      return NextResponse.json({ message: 'Invalid sync payload' }, { status: 400 })
    }

    const isHttpsRequest =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.nextUrl.protocol === 'https:' ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') === true

    const pb = new PocketBase(PB_URL)
    pb.authStore.save(body.token, body.user as any)

    const refreshed = await pb.collection('users').authRefresh()
    const record = refreshed.record
    if (!record) {
      return NextResponse.json({ message: 'Invalid auth record' }, { status: 401 })
    }

    const authCookie = JSON.stringify({
      token: refreshed.token || body.token,
      record: {
        id: record.id,
        email: record.email,
        phone: record.phone,
        surname: record.surname,
        name: record.name,
        username: record.username,
        role: record.role || 'customer',
        isActive: record.isActive !== false,
        verified: record.verified || false,
        avatar: record.avatar || undefined,
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('pb_auth', authCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttpsRequest,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.json({
      user: {
        id: record.id,
        email: record.email,
        phone: record.phone,
        surname: record.surname,
        name: record.name,
        username: record.username,
        role: record.role || 'customer',
        isActive: record.isActive !== false,
        verified: record.verified || false,
        avatar: record.avatar || undefined,
      },
    })
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    console.error('Auth sync error:', error)
    return NextResponse.json({ message: 'Auth sync failed' }, { status: 500 })
  }
}
