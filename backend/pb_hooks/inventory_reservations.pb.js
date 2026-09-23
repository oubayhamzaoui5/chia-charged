/* eslint-disable @typescript-eslint/no-require-imports */
routerAdd('POST', '/api/chia-checkout/reserve', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const keyHash = String(body.checkoutKeyHash || '')
  const fingerprint = String(body.checkoutFingerprint || '')
  const orderData = body.order && typeof body.order === 'object' ? body.order : null
  if (!inv.HASH_RE.test(keyHash) || !inv.HASH_RE.test(fingerprint) || !orderData || !Array.isArray(orderData.items) || orderData.items.length < 1 || orderData.items.length > 100) {
    throw inv.apiError(400, 'Invalid reservation request.')
  }

  let response
  $app.runInTransaction((txApp) => {
    let existing = null
    try { existing = txApp.findFirstRecordByFilter('orders', `checkoutKeyHash = '${keyHash}'`) } catch {}
    if (existing) {
      if (existing.getString('checkoutFingerprint') !== fingerprint) throw inv.apiError(409, 'Checkout key was reused with different data.')
      if (existing.getString('reservationStatus') === 'released') throw inv.apiError(409, 'Checkout attempt has ended.')
      response = {
        orderId: existing.id,
        reservationStatus: existing.getString('reservationStatus'),
        stripeSessionId: existing.getString('stripeSessionId'),
        stripeCheckoutUrl: existing.getString('stripeCheckoutUrl'),
      }
      return
    }

    if (Number(orderData.firstOrderDiscountPercent) > 0) {
      const settings = txApp.findRecordById('store_settings', 'storeconfig0001')
      if (!settings.getBool('firstOrderDiscountEnabled') || settings.getInt('firstOrderDiscountPercent') !== Number(orderData.firstOrderDiscountPercent)) {
        throw inv.apiError(409, 'Discount settings changed. Retry checkout.')
      }
      const userId = String(orderData.user || '')
      if (!inv.ID_RE.test(userId)) throw inv.apiError(400, 'Verified account required for discount.')
      const account = txApp.findRecordById('users', userId)
      if (!account.getBool('verified') || !account.getBool('isActive') || account.getString('email').toLowerCase() !== String(orderData.email).toLowerCase()) {
        throw inv.apiError(400, 'Verified account email required for discount.')
      }
      const prior = txApp.findRecordsByFilter('orders',
        '(user = {:user} || email = {:email}) && (paymentStatus = "paid" || paymentStatus = "refunded" || (firstOrderDiscountPercent > 0 && reservationStatus = "reserved"))',
        '', 1, 0, { user: userId, email: account.getString('email') })
      if (prior.length) throw inv.apiError(409, 'First-order offer already used or reserved by another checkout.')
    }

    const normalized = []
    const seen = {}
    for (const item of orderData.items) {
      const productId = String(item.productId || '')
      const quantity = Number(item.quantity)
      if (!inv.ID_RE.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99 || seen[productId]) {
        throw inv.apiError(400, 'Invalid reservation items.')
      }
      seen[productId] = true
      normalized.push({ productId, quantity })
    }
    normalized.sort((a, b) => a.productId.localeCompare(b.productId))
    for (const item of normalized) {
      const product = txApp.findRecordById('products', item.productId)
      const stock = Math.max(0, product.getInt('stock'))
      if (product.getBool('isActive') === false || stock < item.quantity) throw inv.apiError(409, 'One or more products are unavailable.')
      product.set('stock', stock - item.quantity)
      txApp.save(product)
    }

    const record = new Record(txApp.findCollectionByNameOrId('orders'))
    const fields = [
      'guestAccessHash', 'guestAccessExpires', 'user', 'isGuest', 'firstName', 'lastName', 'email', 'phone',
      'address', 'city', 'postalCode', 'notes', 'country', 'state', 'paymentMode', 'status', 'paymentStatus',
      'fulfillmentStatus', 'paymentAmountCents', 'paymentCurrency', 'items', 'total', 'subtotalCents',
      'discountCents', 'itemsTotalCents', 'shippingCents', 'taxCents', 'totalCents', 'taxProvider', 'taxStatus',
      'pricingVersion', 'shippingPolicyVersion', 'currency', 'addressSnapshot', 'userName', 'location',
      'firstOrderDiscountPercent',
    ]
    for (const field of fields) {
      if (Object.prototype.hasOwnProperty.call(orderData, field)) record.set(field, orderData[field])
    }
    const expiry = new Date(Date.now() + 35 * 60 * 1000).toISOString()
    record.set('checkoutKeyHash', keyHash)
    record.set('checkoutFingerprint', fingerprint)
    record.set('reservationStatus', 'reserved')
    record.set('reservationExpiresAt', expiry)
    txApp.save(record)
    response = { orderId: record.id, reservationStatus: 'reserved', stripeSessionId: '', stripeCheckoutUrl: '' }
  })
  return e.json(200, response)
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-checkout/attach-session', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const orderId = String(body.orderId || '')
  const keyHash = String(body.checkoutKeyHash || '')
  const sessionId = String(body.stripeSessionId || '')
  const checkoutUrl = String(body.stripeCheckoutUrl || '')
  const expiresAt = String(body.checkoutExpiresAt || '')
  if (!inv.ID_RE.test(orderId) || !inv.HASH_RE.test(keyHash) || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !/^https:\/\//.test(checkoutUrl)) {
    throw inv.apiError(400, 'Invalid checkout session.')
  }
  $app.runInTransaction((txApp) => {
    const order = txApp.findRecordById('orders', orderId)
    if (order.getString('checkoutKeyHash') !== keyHash || order.getString('reservationStatus') !== 'reserved') throw inv.apiError(409, 'Reservation is unavailable.')
    const current = order.getString('stripeSessionId')
    if (current && current !== sessionId) throw inv.apiError(409, 'Different checkout session already attached.')
    order.set('stripeSessionId', sessionId)
    order.set('stripeCheckoutUrl', checkoutUrl.slice(0, 2048))
    if (expiresAt) {
      order.set('checkoutExpiresAt', expiresAt)
      order.set('reservationExpiresAt', expiresAt)
    }
    txApp.save(order)
  })
  return e.json(200, { attached: true })
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-checkout/release', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const orderId = String(body.orderId || '')
  if (!inv.ID_RE.test(orderId)) throw inv.apiError(400, 'Invalid order.')
  let released = false
  $app.runInTransaction((txApp) => {
    const order = txApp.findRecordById('orders', orderId)
    released = inv.release(txApp, order, body.reason, String(body.stripeEventId || ''))
    if (released && order.getString('paymentStatus') === 'pending') {
      order.set('paymentStatus', body.paymentStatus === 'expired' ? 'expired' : body.paymentStatus === 'failed' ? 'failed' : 'checkout_failed')
      order.set('taxStatus', 'cancelled')
      txApp.save(order)
    }
  })
  return e.json(200, { released })
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-checkout/finalize', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const orderId = String(body.orderId || '')
  const sessionId = String(body.stripeSessionId || '')
  const eventId = String(body.stripeEventId || '')
  if (!inv.ID_RE.test(orderId) || !/^cs_[A-Za-z0-9_]+$/.test(sessionId) || !/^evt_[A-Za-z0-9_]+$/.test(eventId)) throw inv.apiError(400, 'Invalid payment finalization.')
  let duplicate = false
  $app.runInTransaction((txApp) => {
    const order = txApp.findRecordById('orders', orderId)
    if (order.getString('stripeSessionId') !== sessionId) throw inv.apiError(409, 'Payment session mismatch.')
    if (order.getString('stripeEventId') === eventId && order.getString('paymentStatus') === 'paid') { duplicate = true; return }
    if (order.getString('reservationStatus') !== 'reserved') throw inv.apiError(409, 'Inventory reservation is unavailable.')
    const fields = ['paymentAmountCents', 'taxCents', 'totalCents', 'total', 'stripePaymentIntentId', 'paidAt', 'address', 'city', 'state', 'postalCode', 'country', 'addressSnapshot']
    for (const field of fields) if (Object.prototype.hasOwnProperty.call(body, field)) order.set(field, body[field])
    order.set('paymentStatus', 'paid')
    order.set('taxStatus', 'complete')
    order.set('stripeEventId', eventId)
    order.set('reservationStatus', 'consumed')
    order.set('inventoryConsumedAt', new Date().toISOString())
    txApp.save(order)
    require(__hooks + '/notification_helpers.js').order(txApp, order, 'receipt')

    const userId = order.getString('user')
    if (inv.ID_RE.test(userId)) {
      for (const purchased of inv.items(order)) {
        const productId = String(purchased.productId || '')
        const purchasedQuantity = Number(purchased.quantity)
        if (!inv.ID_RE.test(productId) || !Number.isSafeInteger(purchasedQuantity) || purchasedQuantity < 1) continue
        let cartItem = null
        try { cartItem = txApp.findFirstRecordByFilter('cart_items', `user = '${userId}' && product = '${productId}'`) } catch {}
        if (!cartItem) continue
        const remaining = Math.max(0, cartItem.getInt('quantity') - purchasedQuantity)
        if (remaining === 0) txApp.delete(cartItem)
        else { cartItem.set('quantity', remaining); txApp.save(cartItem) }
      }
    }
  })
  return e.json(200, { duplicate })
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-checkout/release-expired', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  return e.json(200, { checked: inv.releaseExpired() })
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-cart/add', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const productId = String(body.productId || '')
  const quantity = Number(body.quantity)
  const userId = e.auth ? e.auth.id : ''
  if (!inv.ID_RE.test(userId) || !inv.ID_RE.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw inv.apiError(400, 'Invalid cart item.')
  let result
  $app.runInTransaction((txApp) => {
    const product = txApp.findRecordById('products', productId)
    if (product.getBool('isActive') === false) throw inv.apiError(409, 'Product is unavailable.')
    let item = null
    try { item = txApp.findFirstRecordByFilter('cart_items', `user = '${userId}' && product = '${productId}'`) } catch {}
    if (!item) {
      item = new Record(txApp.findCollectionByNameOrId('cart_items'))
      item.set('user', userId)
      item.set('product', productId)
      item.set('quantity', quantity)
    } else {
      item.set('quantity', Math.min(99, Math.max(1, item.getInt('quantity')) + quantity))
    }
    txApp.save(item)
    result = { id: item.id, quantity: item.getInt('quantity') }
  })
  return e.json(200, result)
}, $apis.requireAuth('users'))

routerAdd('POST', '/api/chia-cart/merge', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const body = inv.body(e)
  const userId = e.auth ? e.auth.id : ''
  if (!inv.ID_RE.test(userId) || !Array.isArray(body.items) || body.items.length > 50) throw inv.apiError(400, 'Invalid guest cart.')
  const quantities = {}
  for (const raw of body.items) {
    const productId = String(raw.productId || '')
    const quantity = Number(raw.quantity)
    if (!inv.ID_RE.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw inv.apiError(400, 'Invalid guest cart item.')
    quantities[productId] = Math.min(99, (quantities[productId] || 0) + quantity)
  }
  $app.runInTransaction((txApp) => {
    for (const productId of Object.keys(quantities).sort()) {
      const product = txApp.findRecordById('products', productId)
      if (product.getBool('isActive') === false) continue
      let item = null
      try { item = txApp.findFirstRecordByFilter('cart_items', `user = '${userId}' && product = '${productId}'`) } catch {}
      if (!item) {
        item = new Record(txApp.findCollectionByNameOrId('cart_items'))
        item.set('user', userId)
        item.set('product', productId)
        item.set('quantity', quantities[productId])
      } else {
        item.set('quantity', Math.min(99, Math.max(1, item.getInt('quantity')) + quantities[productId]))
      }
      txApp.save(item)
    }
  })
  return e.json(200, { merged: true })
}, $apis.requireAuth('users'))

cronAdd('release-expired-inventory', '*/5 * * * *', () => {
  try {
    const inv = require(`${__hooks}/inventory_helpers.js`)
    inv.releaseExpired()
  } catch (error) { console.error('[inventory-expiry]', error) }
})
