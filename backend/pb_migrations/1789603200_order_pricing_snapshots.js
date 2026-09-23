/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const products = app.findCollectionByNameOrId('products')
  const nonUsd = app.findRecordsByFilter('products', '', '', 0, 0)
    .filter(record => record.getString('currency') !== 'USD')
  if (nonUsd.length > 0) {
    throw new Error(`Found ${nonUsd.length} products without canonical USD currency. Review and update them before applying this migration.`)
  }
  const currency = products.fields.getByName('currency')
  currency.required = true
  currency.pattern = '^USD$'
  app.save(products)

  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new NumberField({ name: 'subtotalCents', onlyInt: true, min: 0 }))
  orders.fields.add(new NumberField({ name: 'discountCents', onlyInt: true, min: 0 }))
  orders.fields.add(new NumberField({ name: 'itemsTotalCents', onlyInt: true, min: 0 }))
  orders.fields.add(new NumberField({ name: 'taxCents', onlyInt: true, min: 0 }))
  orders.fields.add(new NumberField({ name: 'totalCents', onlyInt: true, min: 0 }))
  orders.fields.add(new TextField({ name: 'pricingVersion', max: 64 }))
  orders.fields.add(new JSONField({ name: 'addressSnapshot', maxSize: 16384 }))

  const admin = '@request.auth.id != "" && @request.auth.role = "admin"'
  const immutableFields = [
    'paymentStatus', 'stripeSessionId', 'stripePaymentIntentId', 'stripeEventId',
    'paymentAmountCents', 'paymentCurrency', 'checkoutExpiresAt', 'paidAt',
    'items', 'total', 'currency', 'shippingCents', 'shippingPolicyVersion',
    'subtotalCents', 'discountCents', 'itemsTotalCents', 'taxCents', 'totalCents', 'pricingVersion', 'addressSnapshot',
  ].map(name => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${admin}) && ${immutableFields}`
  app.save(orders)
}, () => {
  throw new Error('Pricing snapshot migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
