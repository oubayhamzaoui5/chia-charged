import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import PocketBase from 'pocketbase'

const PB_URL =
  process.env.POCKETBASE_URL ?? process.env.NEXT_PUBLIC_PB_URL ?? 'http://127.0.0.1:8090'
const APP_URL =
  process.env.APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  'http://localhost:3000'
const CALLBACK_URL = `${APP_URL}/api/auth/oauth/callback`

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value

  cookieStore.delete('oauth_state')
  cookieStore.delete('oauth_code_verifier')

  const fail = (reason: string) => {
    const url = new URL('/', APP_URL)
    url.searchParams.set('auth_error', reason)
    return NextResponse.redirect(url)
  }

  if (!code || !state || !storedState || !codeVerifier) return fail('oauth_missing_params')
  if (state !== storedState) return fail('oauth_state_mismatch')

  try {
    const pb = new PocketBase(PB_URL)

    const authData = await pb
      .collection('users')
      .authWithOAuth2Code('google', code, codeVerifier, CALLBACK_URL)

    if (!authData?.record) return fail('oauth_no_record')

    const record = authData.record
    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' ||
      process.env.NEXT_PUBLIC_SITE_URL?.startsWith('https://') === true

    const authCookie = JSON.stringify({
      token: authData.token,
      record: {
        id: record.id,
        email: record.email ?? '',
        phone: record.phone ?? null,
        surname: record.surname ?? record.name ?? '',
        name: record.name ?? '',
        username: record.username ?? '',
        role: record.role || 'customer',
        isActive: record.isActive !== false,
        verified: record.verified ?? true,
        avatar: record.avatar || undefined,
      },
    })

    cookieStore.set('pb_auth', authCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' && isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return NextResponse.redirect(new URL('/', APP_URL))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return fail('oauth_failed')
  }
}
