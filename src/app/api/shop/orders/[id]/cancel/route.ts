import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/server'
import { createServicePb } from '@/lib/pb-service.server'
import { hasGuestOrderAccess } from '@/lib/guest-order-access.server'
import { getOAuthKeys } from '@/lib/oauth-keys'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[A-Za-z0-9]{15}$/.test(id)) return NextResponse.json({ message: 'Invalid order.' }, { status: 400 })
  try {
    const session = await getSession()
    const pb = await createServicePb()
    const order = await pb.collection('orders').getOne(id, { requestKey: null })
    const ownsOrder = Boolean(order.user && session?.user?.id === order.user)
    if (!ownsOrder && session?.user?.role !== 'admin' && !hasGuestOrderAccess(request, order)) {
      return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    }
    if (String(order.paymentStatus) === 'paid') return NextResponse.json({ message: 'Payment already completed.' }, { status: 409 })
    if (String(order.reservationStatus) !== 'reserved') return NextResponse.json({ cancelled: true })
    const stripeSessionId = String(order.stripeSessionId || '')
    const stripeSecretKey = getOAuthKeys()?.stripeSecretKey
    if (!stripeSecretKey || !/^cs_[A-Za-z0-9_]+$/.test(stripeSessionId)) {
      return NextResponse.json({ message: 'Cancellation is still processing.' }, { status: 409 })
    }
    const expired = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(stripeSessionId)}/expire`, {
      method: 'POST', headers: { Authorization: `Bearer ${stripeSecretKey}` },
    })
    if (!expired.ok) return NextResponse.json({ message: 'Cancellation is still processing.' }, { status: 409 })
    await pb.send('/api/chia-checkout/release', {
      method: 'POST', body: { orderId: id, reason: 'customer_cancelled', paymentStatus: 'expired' }, requestKey: null,
    })
    return NextResponse.json({ cancelled: true })
  } catch (error) {
    const status = typeof error === 'object' && error !== null && 'status' in error ? Number(error.status) : 500
    if (status === 404) return NextResponse.json({ message: 'Order not found.' }, { status: 404 })
    return NextResponse.json({ message: 'Cancellation is still processing.' }, { status: 500 })
  }
}
