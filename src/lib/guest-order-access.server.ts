import 'server-only'
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { NextRequest, NextResponse } from 'next/server'

const lifetimeSeconds = 60 * 60 * 24 * 7
const cookieName = (id: string) => `guest_order_${id}`
const hash = (token: string) => createHash('sha256').update(token).digest('hex')

export function createGuestOrderAccess(stableSeed?: string) {
  const secret = process.env.OAUTH_ENCRYPTION_KEY
  const token = stableSeed && secret
    ? createHmac('sha256', secret).update(`guest-order:${stableSeed}`).digest('hex')
    : randomBytes(32).toString('hex')
  return { token, guestAccessHash: hash(token), guestAccessExpires: new Date(Date.now() + lifetimeSeconds * 1000).toISOString() }
}

export function setGuestOrderCookie(response: NextResponse, id: string, token?: string) {
  response.headers.set('Cache-Control', 'private, no-store')
  if (token) response.cookies.set(cookieName(id), token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: `/api/shop/orders/${id}`, maxAge: lifetimeSeconds,
  })
  return response
}

export function hasGuestOrderAccess(request: NextRequest, record: Record<string, unknown>) {
  if (record.user) return false
  const token = request.cookies.get(cookieName(String(record.id)))?.value ?? ''
  return validGuestToken(token, record, 'guest') || validGuestToken(token, record, 'email')
}

export function validGuestToken(token: string, record: Record<string, unknown>, source: 'guest' | 'email') {
  if (record.user || !/^[a-f0-9]{64}$/.test(token)) return false
  const expected = String(record[`${source}AccessHash`] ?? '')
  const expires = Date.parse(String(record[`${source}AccessExpires`] ?? ''))
  if (!/^[a-f0-9]{64}$/.test(expected) || !Number.isFinite(expires) || expires <= Date.now()) return false
  return timingSafeEqual(Buffer.from(hash(token), 'hex'), Buffer.from(expected, 'hex'))
}
