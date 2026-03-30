import { NextRequest, NextResponse } from 'next/server'
import { createServerPb } from '@/lib/pb'
import { getOAuthKeys } from '@/lib/oauth-keys'
import { sendAdminOrderPushNotification } from '@/lib/push/admin-order-push'

export const runtime = 'nodejs'

async function getRawBody(req: NextRequest): Promise<Buffer> {
  const reader = req.body?.getReader()
  if (!reader) return Buffer.alloc(0)
  const chunks: Uint8Array[] = []
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    if (value) chunks.push(value)
  }
  return Buffer.concat(chunks)
}

async function getAdminPb() {
  const pb = createServerPb()
  const email = process.env.PB_ADMIN_EMAIL
  const password = process.env.PB_ADMIN_PASSWORD
  if (!email || !password) throw new Error('PB admin credentials not configured')
  await pb.collection('_superusers').authWithPassword(email, password)
  return pb
}

export async function POST(req: NextRequest) {
  const keys = getOAuthKeys()
  const stripeSecretKey = keys?.stripeSecretKey

  if (!stripeSecretKey) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 400 })
  }

  const sig = req.headers.get('stripe-signature')
  const webhookSecret = getOAuthKeys()?.stripeWebhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET
  const rawBody = await getRawBody(req)

  let event: any

  if (webhookSecret && sig) {
    try {
      const crypto = await import('crypto')
      const timestamp = sig.split(',').find(p => p.startsWith('t='))?.slice(2)
      const v1 = sig.split(',').find(p => p.startsWith('v1='))?.slice(3)
      if (!timestamp || !v1) throw new Error('Invalid signature header')

      const payload = `${timestamp}.${rawBody.toString('utf8')}`
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')

      if (expected !== v1) throw new Error('Signature mismatch')
      event = JSON.parse(rawBody.toString('utf8'))
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook signature failed: ${err.message}` }, { status: 400 })
    }
  } else {
    try {
      event = JSON.parse(rawBody.toString('utf8'))
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.orderId ?? session.client_reference_id

    if (!orderId) {
      return NextResponse.json({ error: 'No orderId in session' }, { status: 400 })
    }

    try {
      const pb = await getAdminPb()
      const order = await pb.collection('orders').getOne(orderId, { requestKey: null })
      await pb.collection('orders').update(orderId, { status: 'paid' }, { requestKey: null })

      // Reduce stock for each ordered item
      const orderItems: Array<{ productId: string; quantity: number }> =
        Array.isArray(order.items) ? order.items : []
      const productIds = orderItems
        .map((i) => i.productId)
        .filter((id) => typeof id === 'string' && /^[a-zA-Z0-9]{15}$/.test(id))
      if (productIds.length > 0) {
        const productFilter = productIds.map((id) => `id = '${id}'`).join(' || ')
        const products = await pb.collection('products').getFullList({
          filter: productFilter,
          fields: 'id,stock',
          requestKey: null,
        })
        const stockMap = new Map(products.map((p: any) => [p.id as string, p.stock as number]))
        for (const item of orderItems) {
          const currentStock = stockMap.get(item.productId)
          if (typeof currentStock === 'number') {
            const newStock = Math.max(0, currentStock - (item.quantity || 1))
            await pb.collection('products').update(item.productId, { stock: newStock }, { requestKey: null })
          }
        }
      }

      void sendAdminOrderPushNotification({
        id: orderId,
        total: Number(order.total ?? 0),
        currency: typeof order.currency === 'string' ? order.currency : 'USD',
        customerName: typeof order.userName === 'string' ? order.userName : 'Customer',
      })
    } catch (err: any) {
      console.error('Webhook: failed to update order', orderId, err)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
