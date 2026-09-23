/// <reference path="../pb_data/types.d.ts" />
/* eslint-disable @typescript-eslint/no-require-imports */

routerAdd('POST', '/api/chia-orders/transition', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const ops = require(`${__hooks}/order_operations_helpers.js`)
  const body = ops.body(e)
  const orderId = String(body.orderId || '')
  const actorId = String(body.actorId || '')
  const next = String(body.nextStatus || '')
  if (!inv.ID_RE.test(orderId) || !inv.ID_RE.test(actorId)) throw ops.error(400, 'Invalid order transition.')
  $app.runInTransaction((tx) => {
    const order = tx.findRecordById('orders', orderId)
    const current = order.getString('fulfillmentStatus') || order.getString('status') || 'on hold'
    const allowed = (current === 'on hold' && next === 'delivering') || (current === 'delivering' && next === 'delivered')
    if (!allowed || order.getString('paymentStatus') !== 'paid') throw ops.error(409, 'This fulfillment transition is not allowed.')
    const metadata = {}
    if (next === 'delivering') {
      const carrier = String(body.trackingCarrier || '').trim()
      const tracking = String(body.trackingNumber || '').trim()
      if (carrier.length < 2 || carrier.length > 100 || tracking.length < 3 || tracking.length > 200) throw ops.error(400, 'Carrier and tracking number are required.')
      order.set('trackingCarrier', carrier)
      order.set('trackingNumber', tracking)
      order.set('shippedAt', new Date().toISOString())
      metadata.carrier = carrier
      metadata.trackingNumber = tracking
    } else order.set('deliveredAt', new Date().toISOString())
    order.set('status', next)
    order.set('fulfillmentStatus', next)
    tx.save(order)
    if (next === 'delivering') require(__hooks + '/notification_helpers.js').order(tx, order, 'shipment')
    ops.event(tx, orderId, actorId, 'fulfillment_changed', current, next, metadata)
  })
  return e.json(200, { ok: true, status: next })
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-orders/refund-record', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const ops = require(`${__hooks}/order_operations_helpers.js`)
  const body = ops.body(e)
  const orderId = String(body.orderId || '')
  const actorId = String(body.actorId || '')
  const refundId = String(body.refundId || '')
  const refundStatus = String(body.refundStatus || '')
  const amount = Number(body.amountCents)
  if (!inv.ID_RE.test(orderId) || !inv.ID_RE.test(actorId) || !/^re_[A-Za-z0-9_]+$/.test(refundId) || !['pending', 'succeeded'].includes(refundStatus) || !Number.isSafeInteger(amount) || amount < 1) throw ops.error(400, 'Invalid refund result.')
  let result
  $app.runInTransaction((tx) => {
    const order = tx.findRecordById('orders', orderId)
    if (order.getString('paymentStatus') === 'refunded') { result = { ok: true, duplicate: true, status: 'refunded' }; return }
    if (order.getString('paymentStatus') !== 'paid' || amount !== order.getInt('paymentAmountCents')) throw ops.error(409, 'Refund does not match paid order.')
    const current = order.getString('fulfillmentStatus') || 'on hold'
    order.set('refundId', refundId)
    order.set('refundStatus', refundStatus)
    order.set('refundedAmountCents', amount)
    if (refundStatus === 'pending') {
      tx.save(order)
      ops.event(tx, orderId, actorId, 'refund_pending', current, current, { refundId, amountCents: amount })
      result = { ok: true, duplicate: false, status: 'pending' }
      return
    }
    if (current === 'on hold' && !order.getString('restockedAt')) {
      for (const item of inv.items(order)) {
        const productId = String(item.productId || '')
        const quantity = Number(item.quantity)
        if (!inv.ID_RE.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1) continue
        const product = tx.findRecordById('products', productId)
        product.set('stock', Math.max(0, product.getInt('stock')) + quantity)
        tx.save(product)
      }
      order.set('restockedAt', new Date().toISOString())
    }
    order.set('paymentStatus', 'refunded')
    order.set('fulfillmentStatus', 'cancelled')
    order.set('status', 'cancelled')
    order.set('cancelledAt', new Date().toISOString())
    order.set('refundedAt', new Date().toISOString())
    tx.save(order)
    require(__hooks + '/notification_helpers.js').order(tx, order, 'refund')
    ops.event(tx, orderId, actorId, 'refund_succeeded', current, 'cancelled', { refundId, amountCents: amount, restocked: current === 'on hold' })
    result = { ok: true, duplicate: false, status: 'refunded' }
  })
  return e.json(200, result)
}, $apis.requireSuperuserAuth())

routerAdd('POST', '/api/chia-orders/archive', (e) => {
  const inv = require(`${__hooks}/inventory_helpers.js`)
  const ops = require(`${__hooks}/order_operations_helpers.js`)
  const body = ops.body(e)
  const orderId = String(body.orderId || '')
  const actorId = String(body.actorId || '')
  if (!inv.ID_RE.test(orderId) || !inv.ID_RE.test(actorId)) throw ops.error(400, 'Invalid archive request.')
  $app.runInTransaction((tx) => {
    const order = tx.findRecordById('orders', orderId)
    if (!order.getString('archivedAt')) {
      order.set('archivedAt', new Date().toISOString())
      tx.save(order)
      ops.event(tx, orderId, actorId, 'archived', order.getString('fulfillmentStatus'), order.getString('fulfillmentStatus'), {})
    }
  })
  return e.json(200, { ok: true })
}, $apis.requireSuperuserAuth())
