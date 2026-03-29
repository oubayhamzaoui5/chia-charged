import { NextRequest, NextResponse } from 'next/server'
import { createServerPb } from '@/lib/pb'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await rateLimit(`confirm-reset:${ip}`, 5, 15 * 60 * 1000)
  if (!allowed) {
    return NextResponse.json(
      { message: 'Trop de tentatives. Réessayez dans 15 minutes.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const token = typeof body.token === 'string' ? body.token.trim() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const passwordConfirm = typeof body.passwordConfirm === 'string' ? body.passwordConfirm : ''

    if (!token || !password || !passwordConfirm) {
      return NextResponse.json({ message: 'Tous les champs sont obligatoires.' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }
    if (password !== passwordConfirm) {
      return NextResponse.json({ message: 'Les mots de passe ne correspondent pas.' }, { status: 400 })
    }

    const pb = createServerPb()
    await pb.collection('users').confirmPasswordReset(token, password, passwordConfirm)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    const msg =
      error?.data?.data
        ? Object.values(error.data.data as Record<string, { message?: string }>)
            .map((v) => v?.message)
            .filter(Boolean)
            .join(', ')
        : 'Lien invalide ou expiré. Veuillez recommencer.'
    return NextResponse.json({ message: msg }, { status: 400 })
  }
}
