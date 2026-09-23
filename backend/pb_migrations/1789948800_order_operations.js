/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const orders = app.findCollectionByNameOrId('orders')
  orders.fields.add(new TextField({ name: 'trackingCarrier', max: 100 }))
  orders.fields.add(new TextField({ name: 'trackingNumber', max: 200 }))
  orders.fields.add(new DateField({ name: 'shippedAt' }))
  orders.fields.add(new DateField({ name: 'deliveredAt' }))
  orders.fields.add(new DateField({ name: 'cancelledAt' }))
  orders.fields.add(new TextField({ name: 'refundStatus', max: 32 }))
  orders.fields.add(new TextField({ name: 'refundId', hidden: true, max: 255 }))
  orders.fields.add(new NumberField({ name: 'refundedAmountCents', onlyInt: true, min: 0 }))
  orders.fields.add(new DateField({ name: 'refundedAt' }))
  orders.fields.add(new DateField({ name: 'restockedAt' }))
  orders.fields.add(new DateField({ name: 'archivedAt' }))
  orders.indexes.push('CREATE INDEX `idx_orders_archived_created` ON `orders` (`archivedAt`, `created`)')

  const immutable = ['status', 'fulfillmentStatus', 'trackingCarrier', 'trackingNumber', 'shippedAt', 'deliveredAt', 'cancelledAt', 'refundStatus', 'refundId', 'refundedAmountCents', 'refundedAt', 'restockedAt', 'archivedAt']
    .map((name) => `(@request.body.${name}:isset = false || @request.body.${name} = ${name})`).join(' && ')
  orders.updateRule = `(${orders.updateRule}) && ${immutable}`
  orders.deleteRule = null
  app.save(orders)

  const activeAdmin = '@request.auth.id != "" && @request.auth.isActive = true && @request.auth.role = "admin"'
  const events = new Collection({
    name: 'order_events', type: 'base', listRule: activeAdmin, viewRule: activeAdmin,
    createRule: null, updateRule: null, deleteRule: null,
    fields: [
      { name: 'orderId', type: 'text', required: true, max: 15 },
      { name: 'actorId', type: 'text', max: 15 },
      { name: 'type', type: 'text', required: true, max: 64 },
      { name: 'fromStatus', type: 'text', max: 32 },
      { name: 'toStatus', type: 'text', max: 32 },
      { name: 'metadata', type: 'json', maxSize: 8192 },
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ],
    indexes: ['CREATE INDEX `idx_order_events_order_created` ON `order_events` (`orderId`, `created`)'],
  })
  app.save(events)
}, () => {
  throw new Error('Order operations migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
