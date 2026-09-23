module.exports = {
  body(e) {
    const info = e.requestInfo()
    return info && info.body && typeof info.body === 'object' ? info.body : {}
  },
  error(status, message) {
    return new BadRequestError(message, { status })
  },
  event(app, orderId, actorId, type, fromStatus, toStatus, metadata) {
    const record = new Record(app.findCollectionByNameOrId('order_events'))
    record.set('orderId', orderId)
    record.set('actorId', actorId)
    record.set('type', type)
    record.set('fromStatus', fromStatus)
    record.set('toStatus', toStatus)
    record.set('metadata', metadata || {})
    app.save(record)
  },
}
