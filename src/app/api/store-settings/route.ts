import { NextResponse } from 'next/server'
import { getStoreSettings } from '@/lib/store-settings.server'

export async function GET() {
  try { return NextResponse.json(await getStoreSettings(), { headers: { 'Cache-Control': 'no-store' } }) }
  catch { return NextResponse.json({ message: 'Store settings unavailable.' }, { status: 503 }) }
}
