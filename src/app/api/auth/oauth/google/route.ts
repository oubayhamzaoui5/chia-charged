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

export async function GET(_req: NextRequest) {
  try {
    const pb = new PocketBase(PB_URL)
    const methods = await pb.collection('users').listAuthMethods()
    const provider = (methods.oauth2?.providers ?? []).find(
      (p: { name: string }) => p.name === 'google'
    ) as { name: string; state: string; codeVerifier: string; authUrl: string } | undefined

    if (!provider) {
      const url = new URL('/', APP_URL)
      url.searchParams.set('auth_error', 'google_not_configured')
      return NextResponse.redirect(url)
    }

    const cookieStore = await cookies()
    const cookieOpts = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 10 * 60,
      path: '/',
    }
    cookieStore.set('oauth_state', provider.state, cookieOpts)
    cookieStore.set('oauth_code_verifier', provider.codeVerifier, cookieOpts)

    // PocketBase appends redirect_uri itself — authUrl already ends with it
    // but we must supply our callback as the redirect_uri query param
    const authUrl = new URL(provider.authUrl)
    authUrl.searchParams.set('redirect_uri', CALLBACK_URL)

    return NextResponse.redirect(authUrl.toString())
  } catch (err) {
    console.error('Google OAuth init error:', err)
    const url = new URL('/', APP_URL)
    url.searchParams.set('auth_error', 'oauth_init_failed')
    return NextResponse.redirect(url)
  }
}
