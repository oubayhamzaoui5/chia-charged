migrate((app) => {
  const collection = new Collection({ name: 'store_settings', type: 'base', listRule: '', viewRule: '',
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: 'firstOrderDiscountEnabled', type: 'bool' },
      { name: 'firstOrderDiscountPercent', type: 'number', min: 1, max: 99, onlyInt: true },
      { name: 'businessName', type: 'text', max: 200 },
      { name: 'supportEmail', type: 'email' },
      { name: 'businessAddress', type: 'text', max: 1000 },
      ...['shippingPolicy', 'returnPolicy', 'privacyPolicy', 'terms'].map(name => ({ name, type: 'text', max: 20000 })),
    ],
  })
  app.save(collection)
  const record = new Record(collection)
  record.set('id', 'storeconfig0001')
  record.set('firstOrderDiscountEnabled', false)
  record.set('firstOrderDiscountPercent', 10)
  app.save(record)
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new NumberField({ name: 'firstOrderDiscountPercent', min: 0, max: 99, onlyInt: true }))
  app.save(orders)
}, () => { throw new Error('Forward-only migration. Apply a corrective migration to preserve store configuration.') })
