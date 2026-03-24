import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

const updateProfileSchema = z.object({
  email: z.string().trim().email('Email invalide'),
})

function extractPocketBaseMessage(error: any) {
  const data = error?.data?.data
  if (data && typeof data === 'object') {
    for (const field of Object.keys(data)) {
      const fieldMessage = data[field]?.message
      if (typeof fieldMessage === 'string' && fieldMessage.trim()) {
        return fieldMessage.trim()
      }
    }
  }

  if (typeof error?.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message.trim()
  }
  if (typeof error?.message === 'string' && error.message.trim()) {
    return error.message.trim()
  }
  return 'Impossible de mettre a jour le profil.'
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || !session.token) {
      return NextResponse.json({ message: 'Non authentifie' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateProfileSchema.parse(body)
    const normalizedEmail = parsed.email.toLowerCase()

    if (normalizedEmail.endsWith('@placeholder.local')) {
      return NextResponse.json(
        { message: 'Veuillez utiliser une adresse email valide.' },
        { status: 400 }
      )
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)

    const updatedRecord = await pb.collection('users').update(session.user.id, {
      email: normalizedEmail,
      emailVisibility: true,
    })

    let finalToken = session.token
    let finalRecord = updatedRecord
    try {
      const refreshed = await pb.collection('users').authRefresh()
      finalToken = refreshed.token || session.token
      finalRecord = refreshed.record ?? updatedRecord
    } catch {
      // Keep the updated record and existing token if refresh fails.
    }

    const isHttpsRequest =
      request.headers.get('x-forwarded-proto') === 'https' ||
      request.nextUrl.protocol === 'https:' ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') === true

    const authCookie = JSON.stringify({
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
    })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? 'Requete invalide' },
        { status: 400 }
      )
    }

    if (error?.status === 401) {
      return NextResponse.json({ message: 'Non authentifie' }, { status: 401 })
    }

    if (error?.status === 400) {
      return NextResponse.json({ message: extractPocketBaseMessage(error) }, { status: 400 })
    }

    console.error('Profile update error:', error)
    return NextResponse.json(
      { message: 'Impossible de mettre a jour le profil.' },
      { status: 500 }
    )
  }
}
