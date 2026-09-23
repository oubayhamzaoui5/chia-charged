const { test } = require('node:test')
const assert = require('node:assert/strict')
const PocketBase = require('pocketbase/cjs')

const base = process.env.SHIPPING_TEST_URL

test('fulfillment, refund, restock, archive and audit operations are transactional', async () => {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const root = new PocketBase(base); root.autoCancellation(false)
  await root.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD)
  const actor = await root.collection('users').create({ email: `operator-${stamp}@example.test`, password: 'Operator-Test-132!', passwordConfirm: 'Operator-Test-132!', role: 'admin', isActive: true })
  const product = await root.collection('products').create({ name: 'Operations unit', sku: `OPS-${stamp}`, slug: `operations-${stamp}`, price: 1, currency: 'USD', stock: 3, isActive: true, inView: true })
  const makeOrder = () => root.collection('orders').create({ items: [{ productId: product.id, name: product.name, quantity: 2, unitPrice: 1 }], total: 2, totalCents: 200, paymentAmountCents: 200, currency: 'USD', paymentCurrency: 'USD', paymentMode: 'stripe', paymentStatus: 'paid', stripePaymentIntentId: `pi_ops_${Date.now()}`, status: 'on hold', fulfillmentStatus: 'on hold', reservationStatus: 'consumed' })

  const shipped = await makeOrder()
  await assert.rejects(root.send('/api/chia-orders/transition', { method: 'POST', body: { orderId: shipped.id, actorId: actor.id, nextStatus: 'delivered' } }), e => e.status === 400)
  await root.send('/api/chia-orders/transition', { method: 'POST', body: { orderId: shipped.id, actorId: actor.id, nextStatus: 'delivering', trackingCarrier: 'UPS', trackingNumber: '1ZTEST123' } })
  await root.send('/api/chia-orders/transition', { method: 'POST', body: { orderId: shipped.id, actorId: actor.id, nextStatus: 'delivered' } })
  const delivered = await root.collection('orders').getOne(shipped.id)
  assert.equal(delivered.fulfillmentStatus, 'delivered')
  assert.equal(delivered.trackingCarrier, 'UPS')
  assert.equal(delivered.trackingNumber, '1ZTEST123')
  assert.ok(delivered.shippedAt && delivered.deliveredAt)

  const refundOrder = await makeOrder()
  const refundBody = { orderId: refundOrder.id, actorId: actor.id, refundId: 're_ops_test', amountCents: 200 }
  await root.send('/api/chia-orders/refund-record', { method: 'POST', body: { ...refundBody, refundStatus: 'pending' } })
  assert.equal((await root.collection('orders').getOne(refundOrder.id)).paymentStatus, 'paid')
  await root.send('/api/chia-orders/refund-record', { method: 'POST', body: { ...refundBody, refundStatus: 'succeeded' } })
  assert.equal((await root.collection('products').getOne(product.id)).stock, 5)
  await root.send('/api/chia-orders/refund-record', { method: 'POST', body: { ...refundBody, refundStatus: 'succeeded' } })
  assert.equal((await root.collection('products').getOne(product.id)).stock, 5)
  const refunded = await root.collection('orders').getOne(refundOrder.id)
  assert.equal(refunded.paymentStatus, 'refunded')
  assert.equal(refunded.fulfillmentStatus, 'cancelled')
  assert.ok(refunded.restockedAt)

  await root.send('/api/chia-orders/archive', { method: 'POST', body: { orderId: refundOrder.id, actorId: actor.id } })
  assert.ok((await root.collection('orders').getOne(refundOrder.id)).archivedAt)
  const events = await root.collection('order_events').getFullList({ filter: `orderId = '${refundOrder.id}'`, sort: 'created' })
  assert.deepEqual(events.map(e => e.type), ['refund_pending', 'refund_succeeded', 'archived'])
  const notifications = await root.collection('notification_jobs').getFullList()
  assert.equal(notifications.filter(job => job.dedupeKey === `shipment:${shipped.id}`).length, 1)
  assert.equal(notifications.filter(job => job.dedupeKey === `refund:${refundOrder.id}`).length, 1)
  assert.ok(notifications.find(job => job.dedupeKey === `refund:${refundOrder.id}`).payload.text.includes('USD 2.00'))
})
