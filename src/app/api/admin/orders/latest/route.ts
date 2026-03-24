import { NextResponse } from 'next/server'

import { requireAdmin } from '@/lib/auth'
import { createServerPb } from '@/lib/pb'

export async function GET() {
  try {
    const session = await requireAdmin()
    const pb = createServerPb()
    pb.authStore.save(session.token, {
      id: session.user.id,
      email: session.user.email,
      role: session.user.role,
    } as any)

    const res = await pb.collection('orders').getList(1, 1, {
      sort: '-created',
      fields: 'id,created,total,currency,firstName,lastName',
      requestKey: null,
    })

    const item = res.items[0]
    if (!item) {
      return NextResponse.json({ order: null }, { headers: { 'Cache-Control': 'no-store' } })
    }

    const firstName = typeof item.firstName === 'string' ? item.firstName : ''
    const lastName = typeof item.lastName === 'string' ? item.lastName : ''

    return NextResponse.json(
      {
        order: {
          id: String(item.id ?? ''),
          created: String(item.created ?? ''),
          total: Number(item.total ?? 0),
          currency: typeof item.currency === 'string' ? item.currency : 'DT',
          customerName: `${firstName} ${lastName}`.trim() || 'Client',
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }
}
