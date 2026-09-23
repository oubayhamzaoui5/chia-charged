import { getAppOrigin } from '@/lib/url-policy'
import { authCookieOptions } from '@/lib/auth/cookie-options'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerPb } from '@/lib/pb'


export async function GET(req: NextRequest) {
  const APP_URL = getAppOrigin()
  const CALLBACK_URL = `${APP_URL}/api/auth/oauth/callback`
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const storedState = cookieStore.get('oauth_state')?.value
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value

  cookieStore.set('oauth_state', '', authCookieOptions(0))
  cookieStore.set('oauth_code_verifier', '', authCookieOptions(0))

  const fail = (reason: string) => {
    const url = new URL('/', APP_URL)
    url.searchParams.set('auth_error', reason)
    return NextResponse.redirect(url)
  }

  if (!code || !state || !storedState || !codeVerifier) return fail('oauth_missing_params')
  if (state !== storedState) return fail('oauth_state_mismatch')

  try {
    const pb = createServerPb()

    const authData = await pb
      .collection('users')
      .authWithOAuth2Code('google', code, codeVerifier, CALLBACK_URL)

    if (!authData?.record) return fail('oauth_no_record')

    const record = authData.record
    if (record.isActive === false) return fail('account_inactive')
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
        canManageAdmins: record.canManageAdmins === true,
        verified: record.verified ?? true,
        avatar: record.avatar || undefined,
      },
    })

    cookieStore.set('pb_auth', authCookie, authCookieOptions())

    return NextResponse.redirect(new URL('/', APP_URL))
  } catch (err) {
    console.error('OAuth callback error:', err)
    return fail('oauth_failed')
  }
}
