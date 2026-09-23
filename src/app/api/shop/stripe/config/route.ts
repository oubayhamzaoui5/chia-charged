import { NextResponse } from 'next/server'
import { getOAuthKeys } from '@/lib/oauth-keys'

export async function GET() {
  try {
    const keys = getOAuthKeys()
    if (!keys?.stripeSecretKey || !keys?.stripePublishableKey) return NextResponse.json({ configured: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
    return NextResponse.json({ configured: true, publishableKey: keys.stripePublishableKey }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ message: 'Payment configuration unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
