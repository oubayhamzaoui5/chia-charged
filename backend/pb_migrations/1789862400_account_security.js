/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const users = app.findCollectionByNameOrId('users')
  users.fields.add(new BoolField({ name: 'isActive' }))
  users.fields.add(new BoolField({ name: 'canManageAdmins' }))
  app.save(users)

  // Existing accounts were implicitly active. Existing admins retain management access.
  for (const record of app.findRecordsByFilter('users', '', 'created', 0, 0)) {
    record.set('isActive', true)
    if (record.getString('role') === 'admin') record.set('canManageAdmins', true)
    app.save(record)
  }

  const activeAdmin = '@request.auth.id != "" && @request.auth.isActive = true && @request.auth.role = "admin"'
  const activeSelf = '@request.auth.id != "" && @request.auth.isActive = true && id = @request.auth.id'
  users.listRule = `(${activeAdmin}) || (${activeSelf})`
  users.viewRule = `(${activeAdmin}) || (${activeSelf})`
  users.createRule = '(@request.auth.id = "") && (@request.body.role:isset = false || @request.body.role = "customer") && (@request.body.isActive:isset = false || @request.body.isActive = true) && (@request.body.canManageAdmins:isset = false || @request.body.canManageAdmins = false) && (@request.body.verif:isset = false || @request.body.verif = false) && (@request.body.verified:isset = false || @request.body.verified = false)'
  users.updateRule = `(${activeSelf}) && (@request.body.role:isset = false || @request.body.role = role) && (@request.body.isActive:isset = false || @request.body.isActive = isActive) && (@request.body.canManageAdmins:isset = false || @request.body.canManageAdmins = canManageAdmins) && (@request.body.verif:isset = false || @request.body.verif = verif) && (@request.body.verified:isset = false || @request.body.verified = verified)`
  users.deleteRule = null
  app.save(users)

  const addresses = app.findCollectionByNameOrId('adresses')
  addresses.fields.add(new TextField({ name: 'address2', max: 200 }))
  addresses.fields.add(new TextField({ name: 'state', max: 2 }))
  addresses.fields.add(new TextField({ name: 'country', max: 2 }))
  app.save(addresses)

  const owner = '@request.auth.id != "" && @request.auth.isActive = true && user = @request.auth.id'
  function rules(name, list, view, create, update, del) {
    const collection = app.findCollectionByNameOrId(name)
    collection.listRule = list
    collection.viewRule = view
    collection.createRule = create
    collection.updateRule = update
    collection.deleteRule = del
    app.save(collection)
  }

  for (const name of ['adresses', 'cart_items', 'wishlists']) {
    rules(name, `(${activeAdmin}) || (${owner})`, `(${activeAdmin}) || (${owner})`,
      `(${activeAdmin}) || (${owner})`,
      `(${activeAdmin}) || ((${owner}) && (@request.body.user:isset = false || @request.body.user = @request.auth.id))`,
      `(${activeAdmin}) || (${owner})`)
  }
  for (const name of ['inventory', 'locations', 'transfers', 'transfer_items']) {
    rules(name, activeAdmin, activeAdmin, activeAdmin, activeAdmin, activeAdmin)
  }
  for (const name of ['products', 'categories', 'posts', 'vedettes']) {
    const collection = app.findCollectionByNameOrId(name)
    collection.createRule = activeAdmin
    collection.updateRule = activeAdmin
    collection.deleteRule = activeAdmin
    // Keep existing public list/view expressions, but inactive admin tokens lose the admin branch.
    collection.listRule = collection.listRule.replace(/@request\.auth\.id != "" && @request\.auth\.role = "admin"/g, activeAdmin)
    collection.viewRule = collection.viewRule.replace(/@request\.auth\.id != "" && @request\.auth\.role = "admin"/g, activeAdmin)
    app.save(collection)
  }
  rules('variables', '', '', activeAdmin, activeAdmin, activeAdmin)
  rules('visits', activeAdmin, activeAdmin, null, null, null)

  const orders = app.findCollectionByNameOrId('orders')
  orders.listRule = `(${activeAdmin}) || (${owner})`
  orders.viewRule = `(${activeAdmin}) || (${owner})`
  const immutableFields = [
    'paymentStatus', 'stripeSessionId', 'stripePaymentIntentId', 'stripeEventId',
    'paymentAmountCents', 'paymentCurrency', 'checkoutExpiresAt', 'paidAt',
    'items', 'total', 'currency', 'shippingCents', 'shippingPolicyVersion',
    'subtotalCents', 'discountCents', 'itemsTotalCents', 'taxCents', 'totalCents',
    'pricingVersion', 'addressSnapshot', 'taxProvider', 'taxStatus',
    'checkoutKeyHash', 'checkoutFingerprint', 'stripeCheckoutUrl',
    'reservationStatus', 'reservationReleaseReason', 'reservationExpiresAt',
    'inventoryReleasedAt', 'inventoryConsumedAt',
  ].map((name) => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${activeAdmin}) && ${immutableFields}`
  orders.deleteRule = activeAdmin
  app.save(orders)
}, () => {
  throw new Error('Account security migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
