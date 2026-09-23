const { test } = require('node:test')
const assert = require('node:assert/strict')
const crypto = require('node:crypto')
const PocketBase = require('pocketbase/cjs')

const base = process.env.SHIPPING_TEST_URL
const hash = value => crypto.createHash('sha256').update(value).digest('hex')
const orderFor = (productId, quantity = 1) => ({
  items: [{ productId, quantity, name: 'Reserved item', unitPriceCents: 100 }],
  total: 1, currency: 'USD', paymentStatus: 'pending', paymentCurrency: 'USD', paymentAmountCents: 100,
  itemsTotalCents: 100, shippingCents: 0, taxCents: 0, totalCents: 100, taxStatus: 'pending',
})
const reserve = (pb, productId, key, fingerprint = hash(`fingerprint:${key}`)) => pb.send('/api/chia-checkout/reserve', {
  method: 'POST', requestKey: null,
  body: { checkoutKeyHash: hash(key), checkoutFingerprint: fingerprint, order: orderFor(productId) },
})

test('inventory, checkout and cart writes are atomic and retry-safe', async t => {
  const root = new PocketBase(base); root.autoCancellation(false)
  await root.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD)

  await t.test('two buyers cannot reserve the final unit; retries have one effect', async () => {
    const product = await root.collection('products').create({ name: 'Last unit', sku: 'LAST-1', slug: `last-${Date.now()}`, price: 1, currency: 'USD', stock: 1, isActive: true, inView: true })
    const attempts = await Promise.allSettled([reserve(root, product.id, 'buyer-a'), reserve(root, product.id, 'buyer-b')])
    assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1)
    assert.equal(attempts.filter(result => result.status === 'rejected' && result.reason.status === 409).length, 1)
    const winner = attempts.find(result => result.status === 'fulfilled').value
    const winnerKey = attempts[0].status === 'fulfilled' ? 'buyer-a' : 'buyer-b'
    assert.equal((await root.collection('products').getOne(product.id)).stock, 0)
    assert.equal((await reserve(root, product.id, winnerKey)).orderId, winner.orderId)
    assert.equal((await root.collection('products').getOne(product.id)).stock, 0)
    await assert.rejects(reserve(root, product.id, winnerKey, hash('different')), error => error.status === 409)
    assert.equal((await root.collection('orders').getList(1, 50, { filter: `checkoutKeyHash = '${hash(winnerKey)}'` })).totalItems, 1)

    assert.equal((await root.send('/api/chia-checkout/release', { method: 'POST', body: { orderId: winner.orderId, reason: 'test' } })).released, true)
    assert.equal((await root.send('/api/chia-checkout/release', { method: 'POST', body: { orderId: winner.orderId, reason: 'test-again' } })).released, false)
    assert.equal((await root.collection('products').getOne(product.id)).stock, 1)
  })

  await t.test('payment finalization consumes once and cannot release sold stock', async () => {
    const product = await root.collection('products').create({ name: 'Paid unit', sku: 'PAID-1', slug: `paid-${Date.now()}`, price: 1, currency: 'USD', stock: 1, isActive: true, inView: true })
    const email = `paid-${Date.now()}@example.test`
    const user = await root.collection('users').create({ email, password: 'Paid-Test-Password-132!', passwordConfirm: 'Paid-Test-Password-132!', role: 'customer', isActive: true })
    await root.collection('cart_items').create({ user: user.id, product: product.id, quantity: 2 })
    const key = 'paid-attempt'
    const held = await root.send('/api/chia-checkout/reserve', { method: 'POST', body: {
      checkoutKeyHash: hash(key), checkoutFingerprint: hash(`fingerprint:${key}`), order: { ...orderFor(product.id), user: user.id },
    } })
    await root.send('/api/chia-checkout/attach-session', { method: 'POST', body: {
      orderId: held.orderId, checkoutKeyHash: hash(key), stripeSessionId: 'cs_test_inventory', stripeCheckoutUrl: 'https://checkout.stripe.com/inventory', checkoutExpiresAt: '2030-01-01 00:00:00.000Z',
    } })
    const payment = { method: 'POST', body: { orderId: held.orderId, stripeSessionId: 'cs_test_inventory', stripeEventId: 'evt_inventory_paid', paymentAmountCents: 100, taxCents: 0, totalCents: 100, total: 1, paidAt: new Date().toISOString() } }
    assert.equal((await root.send('/api/chia-checkout/finalize', payment)).duplicate, false)
    assert.equal((await root.send('/api/chia-checkout/finalize', payment)).duplicate, true)
    assert.equal((await root.send('/api/chia-checkout/release', { method: 'POST', body: { orderId: held.orderId, reason: 'late-failure' } })).released, false)
    const saved = await root.collection('orders').getOne(held.orderId)
    assert.equal(saved.reservationStatus, 'consumed')
    assert.equal(saved.paymentStatus, 'paid')
    assert.equal((await root.collection('products').getOne(product.id)).stock, 0)
    const cart = await root.collection('cart_items').getFirstListItem(`user = '${user.id}' && product = '${product.id}'`)
    assert.equal(cart.quantity, 1)
  })

  await t.test('expired reservations restore stock exactly once', async () => {
    const product = await root.collection('products').create({ name: 'Expired unit', sku: 'EXP-1', slug: `expired-${Date.now()}`, price: 1, currency: 'USD', stock: 1, isActive: true, inView: true })
    const held = await reserve(root, product.id, 'expired-attempt')
    await root.collection('orders').update(held.orderId, { reservationExpiresAt: '2000-01-01 00:00:00.000Z' })
    await root.send('/api/chia-checkout/release-expired', { method: 'POST' })
    await root.send('/api/chia-checkout/release-expired', { method: 'POST' })
    assert.equal((await root.collection('products').getOne(product.id)).stock, 1)
    assert.equal((await root.collection('orders').getOne(held.orderId)).reservationStatus, 'released')
  })

  await t.test('concurrent adds produce one cart row with combined quantity', async () => {
    const product = await root.collection('products').create({ name: 'Cart unit', sku: 'CART-1', slug: `cart-${Date.now()}`, price: 1, currency: 'USD', stock: 20, isActive: true, inView: true })
    const email = `cart-${Date.now()}@example.test`
    const user = await root.collection('users').create({ email, password: 'Cart-Test-Password-132!', passwordConfirm: 'Cart-Test-Password-132!', role: 'customer', isActive: true })
    const customer = new PocketBase(base); customer.autoCancellation(false)
    await customer.collection('users').authWithPassword(email, 'Cart-Test-Password-132!')
    await Promise.all([
      customer.send('/api/chia-cart/add', { method: 'POST', body: { productId: product.id, quantity: 1 }, requestKey: null }),
      customer.send('/api/chia-cart/add', { method: 'POST', body: { productId: product.id, quantity: 2 }, requestKey: null }),
    ])
    const rows = await root.collection('cart_items').getFullList({ filter: `user = '${user.id}' && product = '${product.id}'` })
    assert.equal(rows.length, 1)
    assert.equal(rows[0].quantity, 3)
    await customer.send('/api/chia-cart/merge', { method: 'POST', body: { items: [
      { productId: product.id, quantity: 2 }, { productId: product.id, quantity: 3 },
    ] } })
    const merged = await root.collection('cart_items').getFullList({ filter: `user = '${user.id}' && product = '${product.id}'` })
    assert.equal(merged.length, 1)
    assert.equal(merged[0].quantity, 8)
  })
})
