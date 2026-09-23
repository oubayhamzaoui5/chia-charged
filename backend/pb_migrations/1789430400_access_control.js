/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const admin = '@request.auth.id != "" && @request.auth.role = "admin"'
  const owner = '@request.auth.id != "" && user = @request.auth.id'
  const published = 'isActive = true && (inView = true || (isVariant = true && parent.isActive = true && parent.inView = true))'
  function rules(name, list, view, create, update, del) {
    const c = app.findCollectionByNameOrId(name)
    c.listRule = list; c.viewRule = view; c.createRule = create
    c.updateRule = update; c.deleteRule = del
    app.save(c)
  }
  const self = '@request.auth.id != "" && id = @request.auth.id'
  rules('users', `(${admin}) || (${self})`, `(${admin}) || (${self})`,
    `(${admin}) || ((@request.body.role:isset = false || @request.body.role = "customer") && (@request.body.verif:isset = false || @request.body.verif = false) && (@request.body.verified:isset = false || @request.body.verified = false))`,
    `(${admin}) || ((${self}) && (@request.body.role:isset = false || @request.body.role = role) && (@request.body.verif:isset = false || @request.body.verif = verif) && (@request.body.verified:isset = false || @request.body.verified = verified))`, admin)
  for (const name of ['adresses', 'cart_items', 'wishlists']) {
    rules(name, `(${admin}) || (${owner})`, `(${admin}) || (${owner})`,
      `(${admin}) || (${owner})`,
      `(${admin}) || ((${owner}) && (@request.body.user:isset = false || @request.body.user = @request.auth.id))`, `(${admin}) || (${owner})`)
  }
  rules('orders', `(${admin}) || (${owner})`, `(${admin}) || (${owner})`, null, admin, admin)
  for (const name of ['inventory', 'locations', 'transfers', 'transfer_items']) {
    rules(name, admin, admin, admin, admin, admin)
  }
  rules('products', `(${admin}) || (${published})`, `(${admin}) || (${published})`, admin, admin, admin)
  rules('categories', `(${admin}) || activeAll = true`, `(${admin}) || activeAll = true`, admin, admin, admin)
  rules('posts', `(${admin}) || published = true`, `(${admin}) || published = true`, admin, admin, admin)
  rules('variables', '', '', admin, admin, admin)
  const featured = 'product.isActive = true && product.inView = true'
  rules('vedettes', `(${admin}) || (${featured})`, `(${admin}) || (${featured})`, admin, admin, admin)
  rules('shipping_settings', '', '', null, null, null)
  // Backend endpoints own analytics intake and subscription ownership checks.
  rules('visits', admin, admin, null, null, null)
  rules('admin_push_subscriptions', null, null, null, null, null)
  const products = app.findCollectionByNameOrId('products')
  products.fields.getByName('costPrice').hidden = true
  // Only inert raster formats may be uploaded to public image fields.
  for (const [name, field] of [['products', 'images'], ['categories', 'coverImage'], ['posts', 'coverImage'], ['variables', 'image']]) {
    const c = name === 'products' ? products : app.findCollectionByNameOrId(name)
    c.fields.getByName(field).protected = true
    c.fields.getByName(field).mimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
    app.save(c)
  }
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'guestAccessHash', hidden: true, max: 64 }))
  orders.fields.add(new DateField({ name: 'guestAccessExpires' }))
  app.save(orders)
}, () => {
  // An automatic down migration must never reinstate unrestricted business access.
  throw new Error('Security migration is forward-only. Restore a reviewed backup in isolation or apply a reviewed corrective migration.')
})
