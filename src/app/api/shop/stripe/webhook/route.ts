import { createHmac, timingSafeEqual } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getOAuthKeys } from '@/lib/oauth-keys'
import { createServicePb } from '@/lib/pb-service.server'
import { sendAdminOrderPushNotification } from '@/lib/push/admin-order-push'

export const runtime = 'nodejs'
const MAX_BODY_BYTES = 1024 * 1024
const SIGNATURE_TOLERANCE_SECONDS = 300

type StripeSession = {
  id?: unknown
  mode?: unknown
  payment_status?: unknown
  amount_subtotal?: unknown
  amount_total?: unknown
  currency?: unknown
  client_reference_id?: unknown
  payment_intent?: unknown
  metadata?: { orderId?: unknown }
  automatic_tax?: { enabled?: unknown; status?: unknown }
  total_details?: { amount_discount?: unknown; amount_shipping?: unknown; amount_tax?: unknown }
  shipping_details?: {
    name?: unknown
    phone?: unknown
    address?: { line1?: unknown; line2?: unknown; city?: unknown; state?: unknown; postal_code?: unknown; country?: unknown }
  }
}
type StripeEvent = {
  id?: unknown
  type?: unknown
  livemode?: unknown
  data?: { object?: StripeSession }
}

function verifySignature(payload: Buffer, header: string, secret: string) {
  const entries = header.split(',').map(part => part.trim().split('=', 2))
  const timestampText = entries.find(([key]) => key === 't')?.[1]
  const signatures = entries.filter(([key]) => key === 'v1').map(([, value]) => value)
  const timestamp = Number(timestampText)
  const now = Math.floor(Date.now() / 1000)
  if (!Number.isInteger(timestamp) || Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS || signatures.length === 0) return false
  const expected = createHmac('sha256', secret).update(`${timestamp}.${payload.toString('utf8')}`).digest()
  return signatures.some(candidate => {
    if (!/^[a-f0-9]{64}$/i.test(candidate)) return false
    const supplied = Buffer.from(candidate, 'hex')
    return supplied.length === expected.length && timingSafeEqual(supplied, expected)
  })
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function validId(value: string, prefix: string) {
  return value.startsWith(prefix) && /^[A-Za-z0-9_]+$/.test(value)
}

export async function POST(req: NextRequest) {
  let keys
  try { keys = getOAuthKeys() }
  catch { return NextResponse.json({ error: 'Payment configuration unavailable.' }, { status: 503 }) }
  const stripeSecretKey = keys?.stripeSecretKey
  const webhookSecret = keys?.stripeWebhookSecret
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe webhook is not configured.' }, { status: 503 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 })
  const declaredLength = Number(req.headers.get('content-length') || 0)
  if (declaredLength > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  const rawBody = Buffer.from(await req.arrayBuffer())
  if (rawBody.length > MAX_BODY_BYTES) return NextResponse.json({ error: 'Payload too large.' }, { status: 413 })
  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid or stale Stripe signature.' }, { status: 400 })
  }

  let event: StripeEvent
  try { event = JSON.parse(rawBody.toString('utf8')) as StripeEvent }
  catch { return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 }) }

  const eventId = stringValue(event.id)
  const eventType = stringValue(event.type)
  const session = event.data?.object
  const sessionId = stringValue(session?.id)
  if (!validId(eventId, 'evt_')) {
    return NextResponse.json({ error: 'Invalid Stripe event.' }, { status: 400 })
  }
  const expectsLive = stripeSecretKey.startsWith('sk_live_')
  if (event.livemode !== expectsLive) return NextResponse.json({ error: 'Stripe mode mismatch.' }, { status: 400 })

  if (!['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(eventType)) {
    return NextResponse.json({ received: true })
  }
  if (!validId(sessionId, 'cs_')) return NextResponse.json({ error: 'Invalid Stripe session.' }, { status: 400 })

  try {
    const pb = await createServicePb()
    const order = await pb.collection('orders').getFirstListItem(`stripeSessionId = "${sessionId}"`, { requestKey: null })
    if (stringValue(order.stripeEventId) === eventId) return NextResponse.json({ received: true, duplicate: true })
    const orderId = stringValue(order.id)
    if (!orderId || stringValue(session?.metadata?.orderId) !== orderId || stringValue(session?.client_reference_id) !== orderId) {
      return NextResponse.json({ error: 'Stripe session does not match order.' }, { status: 400 })
    }

    if (eventType === 'checkout.session.completed' || eventType === 'checkout.session.async_payment_succeeded') {
      const expectedSubtotal = Number(order.itemsTotalCents)
      const expectedShipping = Number(order.shippingCents)
      const subtotal = Number(session?.amount_subtotal)
      const shipping = Number(session?.total_details?.amount_shipping)
      const discount = Number(session?.total_details?.amount_discount)
      const tax = Number(session?.total_details?.amount_tax)
      const amount = Number(session?.amount_total)
      const currency = stringValue(session?.currency).toUpperCase()
      const automaticTaxComplete = session?.automatic_tax?.enabled === true && session?.automatic_tax?.status === 'complete'
      const amountsAreValid = [expectedSubtotal, expectedShipping, subtotal, shipping, discount, tax, amount]
        .every(value => Number.isSafeInteger(value) && value >= 0)
      if (session?.mode !== 'payment' || !automaticTaxComplete || !amountsAreValid ||
          subtotal !== expectedSubtotal || shipping !== expectedShipping || discount !== 0 ||
          amount !== subtotal + shipping + tax || currency !== stringValue(order.paymentCurrency).toUpperCase()) {
        return NextResponse.json({ error: 'Stripe payment does not match order.' }, { status: 400 })
      }
      if (session?.payment_status !== 'paid') return NextResponse.json({ received: true, paymentPending: true })
      const paymentIntent = stringValue(session?.payment_intent)
      if (paymentIntent && !validId(paymentIntent, 'pi_')) return NextResponse.json({ error: 'Invalid payment reference.' }, { status: 400 })
      const stripeAddress = session?.shipping_details?.address
      const line1 = stringValue(stripeAddress?.line1)
      const line2 = stringValue(stripeAddress?.line2)
      const city = stringValue(stripeAddress?.city)
      const state = stringValue(stripeAddress?.state).toUpperCase()
      const postalCode = stringValue(stripeAddress?.postal_code)
      const country = stringValue(stripeAddress?.country).toUpperCase()
      if (!line1 || !city || !/^[A-Z]{2}$/.test(state) || !/^\d{5}(?:-\d{4})?$/.test(postalCode) || country !== 'US') {
        return NextResponse.json({ error: 'Stripe shipping address is invalid.' }, { status: 400 })
      }
      const existingSnapshot = order.addressSnapshot && typeof order.addressSnapshot === 'object' ? order.addressSnapshot : {}
      const finalized = await pb.send<{ duplicate?: boolean }>('/api/chia-checkout/finalize', {
        method: 'POST',
        body: {
        orderId,
        stripeSessionId: sessionId,
        paymentAmountCents: amount,
        taxCents: tax,
        totalCents: amount,
        total: amount / 100,
        taxStatus: 'complete',
        stripePaymentIntentId: paymentIntent,
        stripeEventId: eventId,
        paidAt: new Date().toISOString(),
        address: [line1, line2].filter(Boolean).join(', '),
        city,
        state,
        postalCode,
        country,
        addressSnapshot: { ...existingSnapshot, address: line1, address2: line2, city, state, postalCode, country, providerVerified: true },
        },
        requestKey: null,
      })
      if (!finalized.duplicate) {
        void sendAdminOrderPushNotification({
          id: orderId,
          total: amount / 100,
          currency: stringValue(order.currency) || 'USD',
          customerName: stringValue(order.userName) || 'Customer',
        })
      }
    } else if (stringValue(order.paymentStatus) === 'pending') {
      await pb.send('/api/chia-checkout/release', {
        method: 'POST',
        body: {
          orderId,
          reason: eventType === 'checkout.session.expired' ? 'stripe_expired' : 'stripe_payment_failed',
          paymentStatus: eventType === 'checkout.session.expired' ? 'expired' : 'failed',
          stripeEventId: eventId,
        },
        requestKey: null,
      })
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 404) {
      return NextResponse.json({ error: 'Unknown Stripe checkout session.' }, { status: 400 })
    }
    const status = typeof error === 'object' && error !== null && 'status' in error ? error.status : undefined
    console.error('Stripe webhook processing failed', { eventId, status })
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}
