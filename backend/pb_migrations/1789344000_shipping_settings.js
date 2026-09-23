/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const settings = new Collection({
    name: 'shipping_settings', type: 'base',
    listRule: '', viewRule: '', createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: 'rateCents', type: 'number', onlyInt: true, min: 0, max: 999999 },
      { name: 'version', type: 'text', required: true, max: 100 },
    ],
  })
  app.save(settings)
  const record = new Record(settings)
  record.set('id', 'shippingconfig1')
  // Preserve the existing US rate until an admin changes it.
  record.set('rateCents', 500)
  record.set('version', 'initial-us-rate')
  app.save(record)

  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new NumberField({ name: 'shippingCents', onlyInt: true, min: 0, max: 999999 }))
  orders.fields.add(new TextField({ name: 'shippingPolicyVersion', max: 100 }))
  orders.fields.add(new TextField({ name: 'country', max: 2 }))
  orders.fields.add(new TextField({ name: 'state', max: 100 }))
  return app.save(orders)
}, (app) => {
  const orders = app.findCollectionByNameOrId('orders')
  for (const name of ['shippingCents', 'shippingPolicyVersion', 'country', 'state']) {
    orders.fields.removeByName(name)
  }
  app.save(orders)
  return app.delete(app.findCollectionByNameOrId('shipping_settings'))
})
