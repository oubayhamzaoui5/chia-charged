import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL = process.env.PB_ADMIN_EMAIL ?? ''
const PB_ADMIN_PASSWORD = process.env.PB_ADMIN_PASSWORD ?? ''

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const path = typeof body.path === 'string' ? body.path.slice(0, 500) : '/'
    const visitorId = typeof body.visitorId === 'string' ? body.visitorId.slice(0, 64) : ''

    const pb = new PocketBase(PB_URL)
    pb.autoCancellation(false)
    await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)

    await pb.collection('visits').create({ path, visitorId }, { requestKey: null })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track-visit]', err)
    return NextResponse.json({ ok: false })
  }
}
