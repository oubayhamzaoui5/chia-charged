import { NextRequest, NextResponse } from 'next/server'

import { getSession } from '@/lib/auth/server'
import { removeAdminPushSubscription, saveAdminPushSubscription } from '@/lib/push/admin-order-push'

type JsonSubscription = {
  endpoint?: unknown
  keys?: {
    p256dh?: unknown
    auth?: unknown
  }
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { subscription?: JsonSubscription }
    const subscription = body.subscription

    const endpoint = asText(subscription?.endpoint)
    const p256dh = asText(subscription?.keys?.p256dh)
    const auth = asText(subscription?.keys?.auth)

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ message: 'Invalid subscription payload' }, { status: 400 })
    }

    await saveAdminPushSubscription({
      adminUserId: session.user.id,
      endpoint,
      p256dh,
      auth,
    })

    return NextResponse.json({ ok: true }, { status: 201 })
  } catch (error: any) {
    const message = error?.message || 'Unable to save push subscription'
    return NextResponse.json({ message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json()) as { endpoint?: unknown }
    const endpoint = asText(body.endpoint)

    if (!endpoint) {
      return NextResponse.json({ message: 'Endpoint is required' }, { status: 400 })
    }

    await removeAdminPushSubscription(endpoint)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }
}
