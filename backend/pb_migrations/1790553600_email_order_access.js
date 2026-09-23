migrate(app => {
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'emailAccessHash', hidden: true, max: 64 }))
  orders.fields.add(new DateField({ name: 'emailAccessExpires', hidden: true }))
  app.save(orders)
}, () => { throw new Error('Forward-only migration: preserve guest access.') })
