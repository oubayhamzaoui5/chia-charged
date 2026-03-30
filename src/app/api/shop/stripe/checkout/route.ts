import { NextRequest, NextResponse } from 'next/server'
import { getOAuthKeys } from '@/lib/oauth-keys'
import { getSession } from '@/lib/auth/server'
import { createServerPb } from '@/lib/pb'
import { sendAdminOrderPushNotification } from '@/lib/push/admin-order-push'

const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

type Item = {
  productId?: unknown
  name?: unknown
  sku?: unknown
  quantity?: unknown
}

function asText(v: unknown) { return typeof v === 'string' ? v.trim() : '' }
function asNumber(v: unknown, fb = 0) { const n = Number(v); return Number.isFinite(n) ? n : fb }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const session = await getSession()
    const user = session?.user ?? null
    const token = session?.token ?? null

    const firstName = asText(body.firstName)
    const lastName = asText(body.lastName)
    const email = asText(body.email)
    const country = asText(body.country)
    const address = asText(body.address)
    const address2 = asText(body.address2)
    const city = asText(body.city)
    const state = asText(body.state)
    const postalCode = asText(body.postalCode)
    const notes = asText(body.notes)
    const shipping = asNumber(body.shipping, 5)

    if (!firstName || !lastName || !country || !address || !city) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 })
    }

    const rawItems = Array.isArray(body.items) ? (body.items as Item[]) : []
    const parsedItems = rawItems.map(item => ({
      productId: asText(item.productId),
      name: asText(item.name) || 'Product',
      sku: asText(item.sku),
      quantity: Math.max(1, Math.floor(asNumber(item.quantity, 1))),
    })).filter(item => item.quantity > 0)

    if (parsedItems.length === 0) {
      return NextResponse.json({ message: 'Cart is empty.' }, { status: 400 })
    }

    const pb = createServerPb()
    if (user?.id && token) pb.authStore.save(token, user as any)

    // Fetch real prices from PocketBase — never trust client-sent prices
    const productIds = [...new Set(parsedItems.map(i => i.productId).filter(id => /^[a-zA-Z0-9]{15}$/.test(id)))]
    if (productIds.length !== parsedItems.length) {
      return NextResponse.json({ message: 'Invalid product in cart.' }, { status: 400 })
    }

    const filter = productIds.map(id => `id = '${id}'`).join(' || ')
    const productRecords = await pb.collection('products').getFullList({
      filter,
      fields: 'id,name,sku,price,promoPrice,isActive,inView,stock',
      requestKey: null,
    })

    const productMap = new Map(productRecords.map(p => [p.id, p]))

    const items = parsedItems.map(item => {
      const product = productMap.get(item.productId)
      if (!product || product.isActive === false) {
        throw Object.assign(new Error(`Product unavailable: ${item.productId}`), { status: 400 })
      }
      const serverPrice =
        product.promoPrice != null && Number.isFinite(Number(product.promoPrice)) && Number(product.promoPrice) > 0
          ? Number(product.promoPrice)
          : Number(product.price)
      return {
        productId: item.productId,
        name: String(product.name) || item.name,
        sku: String(product.sku || item.sku),
        unitPrice: serverPrice,
        quantity: item.quantity,
      }
    })

    const subtotal = Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2))
    const total = Number((subtotal + shipping).toFixed(2))

    // Create order with paid status
    const created = await pb.collection('orders').create({
      user: user?.id ?? null,
      isGuest: !user?.id,
      firstName,
      lastName,
      email,
      phone: '',
      address: [address, address2].filter(Boolean).join(', '),
      city,
      postalCode,
      notes,
      country,
      state,
      paymentMode: 'stripe',
      status: 'paid',
      items,
      total,
      currency: 'USD',
      userName: `${firstName} ${lastName}`.trim(),
      location: `${city}, ${state ? state + ', ' : ''}${country}`.trim(),
    }, { requestKey: null })

    const orderId = String(created.id ?? '')

    // Try Stripe
    const keys = getOAuthKeys()
    const stripeSecretKey = keys?.stripeSecretKey

    if (stripeSecretKey) {
      const lineItemsParams: Record<string, string> = {
        'mode': 'payment',
        'success_url': `${APP_URL}/checkout/confirmation?id=${orderId}`,
        'cancel_url': `${APP_URL}/checkout?cancelled=1`,
        'line_items[0][price_data][currency]': 'usd',
        'line_items[0][price_data][product_data][name]': `Chia Charged Order #${orderId.slice(-6).toUpperCase()}`,
        'line_items[0][price_data][unit_amount]': String(Math.round(total * 100)),
        'line_items[0][quantity]': '1',
        'metadata[orderId]': orderId,
        'client_reference_id': orderId,
      }
      if (email) lineItemsParams['customer_email'] = email

      const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(lineItemsParams).toString(),
      })

      const stripeData = await stripeRes.json()
      if (!stripeRes.ok || !stripeData.url) {
        console.error('Stripe error:', stripeData)
        return NextResponse.json({ message: 'Payment provider error. Please try again.' }, { status: 500 })
      }

      return NextResponse.json({ url: stripeData.url, orderId })
    }

    // No Stripe keys — test mode, mark as pending directly
    await pb.collection('orders').update(orderId, { status: 'paid', paymentMode: 'test_mode' })

    // Reduce stock for each ordered item
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (product && typeof product.stock === 'number') {
        const newStock = Math.max(0, product.stock - item.quantity)
        await pb.collection('products').update(item.productId, { stock: newStock }, { requestKey: null })
      }
    }

    void sendAdminOrderPushNotification({ id: orderId, total, currency: 'USD', customerName: `${firstName} ${lastName}`.trim() || 'Customer' })

    return NextResponse.json({ testMode: true, orderId })
  } catch (err: any) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ message: err?.message || 'Checkout failed.' }, { status: 500 })
  }
}
