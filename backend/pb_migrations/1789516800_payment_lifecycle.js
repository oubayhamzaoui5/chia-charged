/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'paymentStatus', max: 32 }))
  orders.fields.add(new TextField({ name: 'fulfillmentStatus', max: 32 }))
  orders.fields.add(new TextField({ name: 'stripeSessionId', hidden: true, max: 255 }))
  orders.fields.add(new TextField({ name: 'stripePaymentIntentId', hidden: true, max: 255 }))
  orders.fields.add(new TextField({ name: 'stripeEventId', hidden: true, max: 255 }))
  orders.fields.add(new NumberField({ name: 'paymentAmountCents', onlyInt: true, min: 0 }))
  orders.fields.add(new TextField({ name: 'paymentCurrency', max: 3 }))
  orders.fields.add(new DateField({ name: 'checkoutExpiresAt' }))
  orders.fields.add(new DateField({ name: 'paidAt' }))
  orders.indexes.push("CREATE UNIQUE INDEX `idx_orders_stripe_session` ON `orders` (`stripeSessionId`) WHERE `stripeSessionId` != ''")
  orders.indexes.push("CREATE UNIQUE INDEX `idx_orders_stripe_event` ON `orders` (`stripeEventId`) WHERE `stripeEventId` != ''")
  const admin = '@request.auth.id != "" && @request.auth.role = "admin"'
  const immutablePaymentFields = [
    'paymentStatus', 'stripeSessionId', 'stripePaymentIntentId', 'stripeEventId',
    'paymentAmountCents', 'paymentCurrency', 'checkoutExpiresAt', 'paidAt',
  ].map(name => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${admin}) && ${immutablePaymentFields}`
  app.save(orders)

  // Historical status did not prove provider payment. Preserve it for fulfillment
  // while forcing explicit reconciliation before old orders count as paid.
  const legacy = app.findRecordsByFilter('orders', '', '', 0, 0)
  for (const record of legacy) {
    const previous = record.getString('status') || 'on hold'
    record.set('paymentStatus', 'legacy_unverified')
    record.set('fulfillmentStatus', previous)
    record.set('paymentCurrency', (record.getString('currency') || 'USD').toUpperCase())
    record.set('paymentAmountCents', Math.max(0, Math.round(record.getFloat('total') * 100)))
    app.save(record)
  }
}, () => {
  throw new Error('Payment lifecycle migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
