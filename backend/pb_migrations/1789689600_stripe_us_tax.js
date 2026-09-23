/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'taxProvider', max: 32 }))
  orders.fields.add(new TextField({ name: 'taxStatus', max: 32 }))

  const admin = '@request.auth.id != "" && @request.auth.role = "admin"'
  const immutableFields = [
    'paymentStatus', 'stripeSessionId', 'stripePaymentIntentId', 'stripeEventId',
    'paymentAmountCents', 'paymentCurrency', 'checkoutExpiresAt', 'paidAt',
    'items', 'total', 'currency', 'shippingCents', 'shippingPolicyVersion',
    'subtotalCents', 'discountCents', 'itemsTotalCents', 'taxCents', 'totalCents',
    'pricingVersion', 'addressSnapshot', 'taxProvider', 'taxStatus',
  ].map(name => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${admin}) && ${immutableFields}`
  app.save(orders)
}, () => {
  throw new Error('US tax migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
