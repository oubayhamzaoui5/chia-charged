import { createHash, randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createServicePb } from '@/lib/pb-service.server'
import { getStoreSettings } from '@/lib/store-settings.server'
import { getAppOrigin } from '@/lib/url-policy'
import { rateLimit, getClientIp } from '@/lib/rate-limit'
import { isTrackedPath } from '@/lib/visit-path'

export async function POST(request: NextRequest) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    if (request.headers.get('origin') !== getAppOrigin()) return new NextResponse(null, { status: 403, headers })
    if (request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return new NextResponse(null, { status: 204, headers })
    if (!(await rateLimit(`visit:${getClientIp(request)}`, 60, 60000)).allowed) return new NextResponse(null, { status: 429, headers })
    if (Number(request.headers.get('content-length') || 0) > 512) return new NextResponse(null, { status: 413, headers })
    const raw = await request.text()
    if (Buffer.byteLength(raw) > 512) return new NextResponse(null, { status: 413, headers })
    const payload = JSON.parse(raw)
    const path = payload?.path
    if (!isTrackedPath(path)) return new NextResponse(null, { status: 400, headers })
    if (!(await getStoreSettings()).analyticsEnabled) return new NextResponse(null, { status: 204, headers })
    const supplied = request.cookies.get('vid')?.value || ''
    const id = /^[a-f0-9-]{36}$/.test(supplied) ? supplied : randomUUID()
    const visitorId = createHash('sha256').update(id).digest('hex')
    const visitKey = createHash('sha256').update(`${visitorId}:${new Date().toISOString().slice(0, 10)}`).digest('hex')
    const pb = await createServicePb()
    await pb.send('/api/chia-visits/record', { method: 'POST', body: { path, visitorId, visitKey } })
    const response = NextResponse.json({ ok: true }, { headers })
    if (id !== supplied) response.cookies.set('vid', id, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 90 * 86400 })
    return response
  } catch (error) {
    if (error instanceof SyntaxError) return new NextResponse(null, { status: 400, headers })
    console.error('Visit recording unavailable.')
    return new NextResponse(null, { status: 503, headers })
  }
}
