import { createHash } from 'node:crypto'
import { getAppOrigin } from '@/lib/url-policy'
import { NextRequest, NextResponse } from 'next/server'
import { getOAuthKeys, CredentialStoreError } from '@/lib/oauth-keys'
import { getSession } from '@/lib/auth/server'
import { createServicePb } from '@/lib/pb-service.server'
import { createGuestOrderAccess, setGuestOrderCookie } from '@/lib/guest-order-access.server'
import { quoteShipping, ShippingError } from '@/lib/shipping.server'
import { quoteCheckout, CheckoutQuoteError } from '@/lib/checkout-quote.server'
import { getStoreSettings } from '@/lib/store-settings.server'

export const runtime = 'nodejs'
const MAX_CHECKOUT_BODY_BYTES = 64 * 1024
const FOOD_TAX_CODE = 'txcd_40060003'
const SHIPPING_TAX_CODE = 'txcd_92010001'
const ATTEMPT_RE = /^[A-Za-z0-9_-]{16,128}$/
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
function asText(v: unknown) { return typeof v === 'string' ? v.trim() : '' }

type ReservationResponse = { orderId: string; reservationStatus: string; stripeSessionId?: string; stripeCheckoutUrl?: string }

export async function POST(req: NextRequest) {
  let orderId = ''
  let orderStore: Awaited<ReturnType<typeof createServicePb>> | undefined
  let providerRequestStarted = false
  try {
    const appUrl = getAppOrigin()
    const keys = getOAuthKeys()
    const stripeSecretKey = keys?.stripeSecretKey
    if (!stripeSecretKey) return NextResponse.json({ message: 'Card payments are not configured.' }, { status: 503 })
    const attemptKey = req.headers.get('idempotency-key')?.trim() ?? ''
    if (!ATTEMPT_RE.test(attemptKey)) return NextResponse.json({ message: 'Invalid checkout attempt.' }, { status: 400 })
    const checkoutKeyHash = sha256(attemptKey)
    const declaredLength = Number(req.headers.get('content-length') || 0)
    if (declaredLength > MAX_CHECKOUT_BODY_BYTES) return NextResponse.json({ message: 'Checkout request is too large.' }, { status: 413 })
    const rawBody = await req.text()
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_CHECKOUT_BODY_BYTES) return NextResponse.json({ message: 'Checkout request is too large.' }, { status: 413 })
    let body: Record<string, unknown>
    try { body = JSON.parse(rawBody) as Record<string, unknown> }
    catch { return NextResponse.json({ message: 'Invalid checkout request.' }, { status: 400 }) }

    const session = await getSession()
    const user = session?.user ?? null
    const guestAccess = user?.id ? undefined : createGuestOrderAccess(checkoutKeyHash)
    const firstName = asText(body.firstName)
    const lastName = asText(body.lastName)
    const email = asText(body.email)
    const phone = asText(body.phone)
    const country = asText(body.country).toUpperCase()
    const address = asText(body.address)
    const address2 = asText(body.address2)
    const city = asText(body.city)
    const state = asText(body.state).toUpperCase()
    const postalCode = asText(body.postalCode)
    const notes = asText(body.notes)
    const shippingPolicy = await quoteShipping(country, body.shippingVersion)
    if (!firstName || firstName.length > 100 || !lastName || lastName.length > 100 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || phone.length > 32 ||
        address.length < 2 || address.length > 200 || address2.length > 200 || city.length < 2 || city.length > 100 ||
        !/^[A-Z]{2}$/.test(state) || !/^\d{5}$/.test(postalCode) || notes.length > 1000) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
    }

    const pb = await createServicePb()
    orderStore = pb
    const settings = await getStoreSettings()
    let firstOrderPercent = 0
    if (settings.firstOrderDiscountEnabled && user?.id) {
      const account = await pb.collection('users').getOne(user.id)
      if (account.verified && account.isActive && String(account.email).toLowerCase() === email.toLowerCase()) {
        const previous = await pb.collection('orders').getList(1, 1, {
          filter: pb.filter('(user = {:user} || email = {:email}) && (paymentStatus = "paid" || paymentStatus = "refunded")', { user: user.id, email: account.email }),
          fields: 'id', requestKey: null,
        })
        if (previous.totalItems === 0) firstOrderPercent = settings.firstOrderDiscountPercent
      }
    }
    const quote = await quoteCheckout(body.items, shippingPolicy.rateCents, firstOrderPercent)
    const appliedFirstOrderPercent = quote.items.some(item => item.discount.type === 'first-order') ? firstOrderPercent : 0
    const order = {
      guestAccessHash: guestAccess?.guestAccessHash, guestAccessExpires: guestAccess?.guestAccessExpires,
      user: user?.id ?? null, isGuest: !user?.id, firstName, lastName, email, phone,
      address: [address, address2].filter(Boolean).join(', '), city, postalCode, notes, country, state,
      paymentMode: 'stripe', status: 'on hold', paymentStatus: 'pending', fulfillmentStatus: 'on hold',
      paymentAmountCents: quote.totalCents, paymentCurrency: 'USD', items: quote.items, total: quote.totalCents / 100,
      subtotalCents: quote.subtotalCents, discountCents: quote.discountCents, itemsTotalCents: quote.itemsTotalCents,
      shippingCents: quote.shippingCents, taxCents: quote.taxCents, totalCents: quote.totalCents,
      taxProvider: 'stripe_tax', taxStatus: 'pending', pricingVersion: quote.pricingVersion,
      shippingPolicyVersion: shippingPolicy.version, currency: quote.currency,
      firstOrderDiscountPercent: appliedFirstOrderPercent,
      addressSnapshot: { firstName, lastName, email, phone, address, address2, city, state, postalCode, country },
      userName: `${firstName} ${lastName}`.trim(), location: `${city}, ${state}, ${country}`,
    }
    const checkoutFingerprint = sha256(JSON.stringify({ ...order, guestAccessHash: undefined, guestAccessExpires: undefined }))
    const reservation = await pb.send<ReservationResponse>('/api/chia-checkout/reserve', {
      method: 'POST', body: { checkoutKeyHash, checkoutFingerprint, order }, requestKey: null,
    })
    orderId = reservation.orderId
    if (reservation.stripeSessionId && reservation.stripeCheckoutUrl) {
      return setGuestOrderCookie(NextResponse.json({ url: reservation.stripeCheckoutUrl, orderId }), orderId, guestAccess?.token)
    }

    const expiresAtSeconds = Math.floor(Date.now() / 1000) + 30 * 60
    const params: Record<string, string> = {
      mode: 'payment', success_url: `${appUrl}/checkout/confirmation?id=${orderId}`, cancel_url: `${appUrl}/checkout?cancelled=1&orderId=${orderId}`,
      expires_at: String(expiresAtSeconds), 'automatic_tax[enabled]': 'true',
      'shipping_address_collection[allowed_countries][0]': 'US',
      'shipping_options[0][shipping_rate_data][type]': 'fixed_amount',
      'shipping_options[0][shipping_rate_data][fixed_amount][amount]': String(quote.shippingCents),
      'shipping_options[0][shipping_rate_data][fixed_amount][currency]': 'usd',
      'shipping_options[0][shipping_rate_data][display_name]': quote.shippingCents === 0 ? 'Free shipping' : 'US shipping',
      'shipping_options[0][shipping_rate_data][tax_behavior]': 'exclusive',
      'shipping_options[0][shipping_rate_data][tax_code]': SHIPPING_TAX_CODE,
      'metadata[orderId]': orderId, 'payment_intent_data[metadata][orderId]': orderId, client_reference_id: orderId,
    }
    quote.items.forEach((item, index) => {
      params[`line_items[${index}][price_data][currency]`] = 'usd'
      params[`line_items[${index}][price_data][unit_amount]`] = String(item.unitPriceCents)
      params[`line_items[${index}][price_data][tax_behavior]`] = 'exclusive'
      params[`line_items[${index}][price_data][product_data][name]`] = item.name
      params[`line_items[${index}][price_data][product_data][tax_code]`] = FOOD_TAX_CODE
      params[`line_items[${index}][price_data][product_data][metadata][productId]`] = item.productId
      params[`line_items[${index}][quantity]`] = String(item.quantity)
    })
    params.customer_email = email
    providerRequestStarted = true
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': `checkout-${checkoutKeyHash}` },
      body: new URLSearchParams(params).toString(),
    })
    const stripeData = await stripeRes.json()
    if (!stripeRes.ok || typeof stripeData.id !== 'string' || !stripeData.id.startsWith('cs_') || typeof stripeData.url !== 'string') {
      await pb.send('/api/chia-checkout/release', { method: 'POST', body: { orderId, reason: 'provider_error', paymentStatus: 'checkout_failed' }, requestKey: null })
      console.error('Stripe checkout session creation failed', { status: stripeRes.status, orderId })
      return NextResponse.json({ message: 'Payment provider error. Please try again.', resetCheckoutAttempt: true }, { status: 502 })
    }
    const checkoutExpiresAt = Number.isInteger(stripeData.expires_at)
      ? new Date(stripeData.expires_at * 1000).toISOString()
      : new Date(expiresAtSeconds * 1000).toISOString()
    await pb.send('/api/chia-checkout/attach-session', {
      method: 'POST', body: { orderId, checkoutKeyHash, stripeSessionId: stripeData.id, stripeCheckoutUrl: stripeData.url, checkoutExpiresAt }, requestKey: null,
    })
    return setGuestOrderCookie(NextResponse.json({ url: stripeData.url, orderId }), orderId, guestAccess?.token)
  } catch (err: unknown) {
    if (orderId && orderStore && !providerRequestStarted) {
      try { await orderStore.send('/api/chia-checkout/release', { method: 'POST', body: { orderId, reason: 'checkout_error', paymentStatus: 'checkout_failed' }, requestKey: null }) }
      catch { /* Preserve original error. */ }
    }
    if (err instanceof CredentialStoreError) return NextResponse.json({ message: 'Payment configuration unavailable.' }, { status: 503 })
    if (err instanceof ShippingError) return NextResponse.json({ message: err.message, policy: err.policy }, { status: err.status })
    if (err instanceof CheckoutQuoteError) return NextResponse.json({ message: err.message }, { status: err.status })
    const status = typeof err === 'object' && err !== null && 'status' in err ? Number(err.status) : 500
    if (status === 409) return NextResponse.json({ message: 'Checkout attempt ended or an item sold out.', resetCheckoutAttempt: true }, { status: 409 })
    console.error('Stripe checkout failed', { orderId, status })
    return NextResponse.json({ message: 'Checkout failed.' }, { status: 500 })
  }
}
