import { NextRequest, NextResponse } from 'next/server'
import PocketBase from 'pocketbase'

const PB_URL =
  process.env.POCKETBASE_URL ??
  process.env.NEXT_PUBLIC_PB_URL ??
  'http://127.0.0.1:8090'
const PB_ADMIN_EMAIL =
  process.env.PB_ADMIN_EMAIL ?? process.env.POCKETBASE_ADMIN_EMAIL ?? ''
const PB_ADMIN_PASSWORD =
  process.env.PB_ADMIN_PASSWORD ?? process.env.POCKETBASE_ADMIN_PASSWORD ?? ''

async function getAdminPb(): Promise<PocketBase> {
  const pb = new PocketBase(PB_URL)
  pb.autoCancellation(false)
  await pb.collection('_superusers').authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD)
  return pb
}

async function ensureVisitsCollection(pb: PocketBase): Promise<void> {
  try {
    await (pb as unknown as { collections: { getOne: (name: string) => Promise<unknown> } }).collections.getOne('visits')
  } catch {
    await (pb as unknown as {
      collections: {
        create: (data: Record<string, unknown>) => Promise<unknown>
      }
    }).collections.create({
      name: 'visits',
      type: 'base',
      fields: [
        { name: 'path', type: 'text', required: false, max: 500 },
      ],
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const path =
      typeof body.path === 'string' ? body.path.slice(0, 500) : '/'

    const pb = await getAdminPb()

    try {
      await pb.collection('visits').create({ path }, { requestKey: null })
    } catch (e: unknown) {
      const status = e && typeof e === 'object' && 'status' in e
        ? (e as { status: number }).status
        : null
      if (status === 404) {
        await ensureVisitsCollection(pb)
        await pb.collection('visits').create({ path }, { requestKey: null })
      } else {
        throw e
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[track-visit]', err)
    // Always return 200 — tracking failures are silent
    return NextResponse.json({ ok: false })
  }
}
