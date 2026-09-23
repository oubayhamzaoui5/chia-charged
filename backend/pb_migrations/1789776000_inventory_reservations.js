/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'checkoutKeyHash', hidden: true, max: 64 }))
  orders.fields.add(new TextField({ name: 'checkoutFingerprint', hidden: true, max: 64 }))
  orders.fields.add(new TextField({ name: 'stripeCheckoutUrl', hidden: true, max: 2048 }))
  orders.fields.add(new TextField({ name: 'reservationStatus', max: 32 }))
  orders.fields.add(new TextField({ name: 'reservationReleaseReason', max: 64 }))
  orders.fields.add(new DateField({ name: 'reservationExpiresAt' }))
  orders.fields.add(new DateField({ name: 'inventoryReleasedAt' }))
  orders.fields.add(new DateField({ name: 'inventoryConsumedAt' }))
  orders.indexes.push("CREATE UNIQUE INDEX `idx_orders_checkout_key` ON `orders` (`checkoutKeyHash`) WHERE `checkoutKeyHash` != ''")
  orders.indexes.push("CREATE INDEX `idx_orders_reservation_expiry` ON `orders` (`reservationStatus`, `reservationExpiresAt`)")

  const admin = '@request.auth.id != "" && @request.auth.role = "admin"'
  const immutableFields = [
    'paymentStatus', 'stripeSessionId', 'stripePaymentIntentId', 'stripeEventId',
    'paymentAmountCents', 'paymentCurrency', 'checkoutExpiresAt', 'paidAt',
    'items', 'total', 'currency', 'shippingCents', 'shippingPolicyVersion',
    'subtotalCents', 'discountCents', 'itemsTotalCents', 'taxCents', 'totalCents',
    'pricingVersion', 'addressSnapshot', 'taxProvider', 'taxStatus',
    'checkoutKeyHash', 'checkoutFingerprint', 'stripeCheckoutUrl',
    'reservationStatus', 'reservationReleaseReason', 'reservationExpiresAt',
    'inventoryReleasedAt', 'inventoryConsumedAt',
  ].map(name => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${admin}) && ${immutableFields}`
  app.save(orders)

  const cart = app.findCollectionByNameOrId('cart_items')
  const rows = app.findRecordsByFilter('cart_items', '', 'created', 0, 0)
  const primaryByPair = {}
  for (const row of rows) {
    const pair = `${row.getString('user')}:${row.getString('product')}`
    const primary = primaryByPair[pair]
    if (!primary) {
      primaryByPair[pair] = row
      continue
    }
    primary.set('quantity', Math.min(99, Math.max(1, primary.getInt('quantity')) + Math.max(1, row.getInt('quantity'))))
    app.save(primary)
    app.delete(row)
  }
  cart.indexes.push('CREATE UNIQUE INDEX `idx_cart_user_product` ON `cart_items` (`user`, `product`)')
  app.save(cart)
}, () => {
  throw new Error('Inventory reservation migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
