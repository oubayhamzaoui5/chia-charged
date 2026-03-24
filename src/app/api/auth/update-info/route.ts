import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || !session.token) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const surname = typeof body.surname === 'string' ? body.surname.trim() : undefined
    const name = typeof body.name === 'string' ? body.name.trim() : undefined
    const phone = typeof body.phone === 'string' ? body.phone.trim() : undefined

    if (!surname && !name && !phone) {
      return NextResponse.json({ message: 'Aucune donnée à mettre à jour.' }, { status: 400 })
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)

    const payload: Record<string, string> = {}
    if (surname !== undefined) payload.surname = surname
    if (name !== undefined) payload.name = name
    if (phone !== undefined) payload.phone = phone

    const updatedRecord = await pb.collection('users').update(session.user.id, payload)

    let finalToken = session.token
    let finalRecord = updatedRecord
    try {
      const refreshed = await pb.collection('users').authRefresh()
      finalToken = refreshed.token || session.token
      finalRecord = refreshed.record ?? updatedRecord
    } catch {
      // keep existing token
    }

    const isHttps =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.nextUrl.protocol === 'https:' ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') === true

    const cookieStore = await cookies()
    cookieStore.set(
      'pb_auth',
      JSON.stringify({
        token: finalToken,
        record: {
          id: finalRecord.id,
          email: finalRecord.email,
          phone: finalRecord.phone,
          surname: finalRecord.surname,
          name: finalRecord.name,
          username: finalRecord.username,
          role: finalRecord.role || 'customer',
          isActive: finalRecord.isActive !== false,
          verified: finalRecord.verified || false,
          avatar: finalRecord.avatar || undefined,
        },
      }),
      { httpOnly: true, secure: process.env.NODE_ENV === 'production' && isHttps, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' }
    )

    return NextResponse.json({
      user: {
        id: finalRecord.id,
        email: finalRecord.email,
        phone: finalRecord.phone,
        surname: finalRecord.surname,
        name: finalRecord.name,
      },
    })
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 })
    }
    const msg =
      error?.data?.data
        ? Object.values(error.data.data as Record<string, { message?: string }>)
            .map((v) => v?.message)
            .filter(Boolean)
            .join(', ')
        : error?.message || 'Impossible de mettre à jour le profil.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
