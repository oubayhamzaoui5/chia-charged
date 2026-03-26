import { NextResponse } from 'next/server'
import { getOAuthKeys } from '@/lib/oauth-keys'

export async function GET() {
  const keys = getOAuthKeys()
  if (keys?.stripePublishableKey && keys?.stripeSecretKey) {
    return NextResponse.json({ configured: true, publishableKey: keys.stripePublishableKey })
  }
  return NextResponse.json({ configured: false, publishableKey: null })
}
