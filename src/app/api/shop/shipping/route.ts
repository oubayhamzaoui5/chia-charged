import { NextResponse } from 'next/server'
import { getShippingPolicy } from '@/lib/shipping.server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json({ policy: await getShippingPolicy() }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ message: 'Shipping is temporarily unavailable. Please try again.' }, {
      status: 503, headers: { 'Cache-Control': 'no-store' },
    })
  }
}
