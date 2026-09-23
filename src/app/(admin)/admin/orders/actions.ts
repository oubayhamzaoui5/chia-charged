'use server'

import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { assertPocketBaseId } from '@/lib/admin/validation'
import { createServicePb } from '@/lib/pb-service.server'
import { getOAuthKeys } from '@/lib/oauth-keys'

function refreshOrders() {
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function archiveOrderAction(orderId: string) {
  assertPocketBaseId(orderId, 'order id')
  const session = await requireAdmin()
  const pb = await createServicePb()
  await pb.send('/api/chia-orders/archive', { method: 'POST', body: { orderId, actorId: session.user.id } })
  refreshOrders()
  return { ok: true }
}

export async function updateOrderStatusAction(orderId: string, nextStatus: string, tracking?: { carrier?: string; number?: string }) {
  assertPocketBaseId(orderId, 'order id')
  if (nextStatus !== 'delivering' && nextStatus !== 'delivered') throw new Error('Invalid fulfillment transition.')
  const session = await requireAdmin()
  const pb = await createServicePb()
  const result = await pb.send<{ status: 'delivering' | 'delivered' }>('/api/chia-orders/transition', {
    method: 'POST',
    body: { orderId, actorId: session.user.id, nextStatus, trackingCarrier: tracking?.carrier?.trim(), trackingNumber: tracking?.number?.trim() },
  })
  refreshOrders()
  return { ok: true, status: result.status }
}

type StripeRefund = { id?: string; status?: string; amount?: number; error?: { message?: string } }

export async function refundOrderAction(orderId: string) {
  assertPocketBaseId(orderId, 'order id')
  const session = await requireAdmin()
  const pb = await createServicePb()
  const order = await pb.collection('orders').getOne(orderId, {
    fields: 'id,paymentMode,paymentStatus,paymentAmountCents,stripePaymentIntentId,refundId', requestKey: null,
  })
  if (String(order.paymentMode) !== 'stripe' || !String(order.stripePaymentIntentId || '').startsWith('pi_')) throw new Error('This order has no refundable Stripe payment.')
  if (String(order.paymentStatus) === 'refunded') return { ok: true, status: 'refunded' as const }
  if (String(order.paymentStatus) !== 'paid') throw new Error('Only paid orders can be refunded.')
  const keys = getOAuthKeys()
  if (!keys?.stripeSecretKey) throw new Error('Stripe is not configured.')

  const existingRefundId = String(order.refundId || '')
  let response: Response
  if (existingRefundId) {
    response = await fetch(`https://api.stripe.com/v1/refunds/${encodeURIComponent(existingRefundId)}`, {
      headers: { Authorization: `Bearer ${keys.stripeSecretKey}` }, cache: 'no-store',
    })
  } else {
    const body = new URLSearchParams({ payment_intent: String(order.stripePaymentIntentId), reason: 'requested_by_customer', 'metadata[orderId]': orderId })
    response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST', headers: { Authorization: `Bearer ${keys.stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `refund-${orderId}` }, body,
    })
  }
  const refund = await response.json() as StripeRefund
  if (!response.ok || !refund.id) throw new Error(refund.error?.message || 'Stripe refund failed.')
  const status = refund.status === 'succeeded' ? 'succeeded' : 'pending'
  const amountCents = Number(refund.amount)
  await pb.send('/api/chia-orders/refund-record', {
    method: 'POST', body: { orderId, actorId: session.user.id, refundId: refund.id, refundStatus: status, amountCents },
  })
  refreshOrders()
  return { ok: true, status: status === 'succeeded' ? 'refunded' as const : 'pending' as const }
}
