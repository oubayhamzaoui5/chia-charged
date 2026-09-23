/* eslint-disable @typescript-eslint/no-require-imports */
const HASH_RE = /^[a-f0-9]{64}$/
const ID_RE = /^[a-zA-Z0-9]{15}$/

function apiError(status, message) { return new ApiError(status, message) }
function body(e) { return e.requestInfo().body || {} }
function items(order) {
  try {
    const normalized = JSON.parse(order.getString('items'))
    return Array.isArray(normalized) ? normalized : []
  } catch {
    const value = order.get('items')
    return Array.isArray(value) ? value : []
  }
}
function release(txApp, order, reason, eventId) {
  if (order.getString('reservationStatus') !== 'reserved') return false
  for (const item of items(order)) {
    const productId = String(item.productId || '')
    const quantity = Number(item.quantity)
    if (!ID_RE.test(productId) || !Number.isSafeInteger(quantity) || quantity < 1) throw apiError(500, 'Stored reservation is invalid.')
    const product = txApp.findRecordById('products', productId)
    product.set('stock', Math.max(0, product.getInt('stock')) + quantity)
    txApp.save(product)
  }
  order.set('reservationStatus', 'released')
  order.set('reservationReleaseReason', String(reason || 'released').slice(0, 64))
  order.set('inventoryReleasedAt', new Date().toISOString())
  if (eventId) order.set('stripeEventId', eventId)
  txApp.save(order)
  return true
}
function releaseExpired() {
  const now = new Date().toISOString().replace('T', ' ')
  const expired = $app.findRecordsByFilter('orders', `reservationStatus = 'reserved' && reservationExpiresAt != '' && reservationExpiresAt <= '${now}'`, 'reservationExpiresAt', 100, 0)
  for (const candidate of expired) {
    try {
      $app.runInTransaction((txApp) => {
        const inv = require(`${__hooks}/inventory_helpers.js`)
        const order = txApp.findRecordById('orders', candidate.id)
        inv.release(txApp, order, 'expired', '')
        if (order.getString('paymentStatus') === 'pending') {
          order.set('paymentStatus', 'expired')
          order.set('taxStatus', 'cancelled')
          txApp.save(order)
        }
      })
    } catch (error) { console.error('[inventory-expiry]', candidate.id, error) }
  }
  return expired.length
}

module.exports = { HASH_RE, ID_RE, apiError, body, items, release, releaseExpired }
