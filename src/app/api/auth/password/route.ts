import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session?.user?.id || !session.token) {
      return NextResponse.json({ message: 'Non authentifié.' }, { status: 401 })
    }

    const body = await request.json()
    const oldPassword = typeof body.oldPassword === 'string' ? body.oldPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    const confirmPassword = typeof body.confirmPassword === 'string' ? body.confirmPassword : ''

    if (!oldPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ message: 'Tous les champs sont obligatoires.' }, { status: 400 })
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ message: 'Le nouveau mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ message: 'Les mots de passe ne correspondent pas.' }, { status: 400 })
    }

    const pb = createServerPb()
    pb.authStore.save(session.token, session.user as any)

    await pb.collection('users').update(session.user.id, {
      oldPassword,
      password: newPassword,
      passwordConfirm: confirmPassword,
    })

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    if (error?.status === 401) {
      return NextResponse.json({ message: 'Mot de passe actuel incorrect.' }, { status: 400 })
    }
    const msg =
      error?.data?.data
        ? Object.values(error.data.data as Record<string, { message?: string }>)
            .map((v) => v?.message)
            .filter(Boolean)
            .join(', ')
        : error?.message || 'Impossible de changer le mot de passe.'
    return NextResponse.json({ message: msg }, { status: 500 })
  }
}
