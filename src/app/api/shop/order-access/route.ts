import { NextRequest, NextResponse } from 'next/server'
import { createServicePb } from '@/lib/pb-service.server'
import { setGuestOrderCookie, validGuestToken } from '@/lib/guest-order-access.server'
import { getClientIp, rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer' }
  try {
    const limit = await rateLimit(`order-access:${getClientIp(request)}`, 20, 60_000)
    if (!limit.allowed) return NextResponse.json({ message: 'Too many attempts. Try again shortly.' }, { status: 429, headers })
    if (Number(request.headers.get('content-length') || 0) > 512) return new NextResponse(null, { status: 413, headers })
    const text = await request.text()
    if (text.length > 512) return new NextResponse(null, { status: 413, headers })
    const { id, token } = JSON.parse(text)
    if (typeof id !== 'string' || !/^[a-zA-Z0-9]{15}$/.test(id) || typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Invalid link')
    const pb = await createServicePb()
    const order = await pb.collection('orders').getOne(id, { requestKey: null })
    if (!validGuestToken(token, order, 'email')) throw new Error('Invalid link')
    return setGuestOrderCookie(NextResponse.json({ url: `/checkout/confirmation?id=${id}&recovery=1` }, { headers }), id, token)
  } catch {
    return NextResponse.json({ message: 'This order link is invalid or expired. Contact support for help.' }, { status: 400, headers })
  }
}
