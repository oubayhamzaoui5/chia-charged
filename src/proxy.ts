import { NextRequest, NextResponse } from 'next/server'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next()

  // Only track storefront page visits
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.\w+$/.test(pathname) // static files
  ) {
    return response
  }

  // Get or create a persistent visitor ID via cookie
  let visitorId = request.cookies.get('vid')?.value ?? ''
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    response.cookies.set('vid', visitorId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
  }

  // Only record one visit per visitor per day to keep the table small.
  // We store today's UTC date in a short-lived cookie; if it already
  // matches we skip the write entirely.
  const today = new Date().toISOString().slice(0, 10) // e.g. "2026-03-30"
  const trackedDate = request.cookies.get('vid_d')?.value ?? ''

  if (trackedDate !== today) {
    response.cookies.set('vid_d', today, {
      maxAge: 60 * 60 * 48, // 48 h — covers midnight roll-over safely
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    // Write directly to PocketBase REST API — no SDK, fire and forget
    fetch(`${PB_URL}/api/collections/visits/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: pathname, visitorId }),
    }).catch(() => {})
  }

  return response
}

export const config = {
  matcher: ['/((?!api|admin|_next|favicon\\.ico|.*\\..*).*)'],
}
