routerAdd('POST', '/api/chia-visits/record', e => {
  const body = e.requestInfo().body
  if (!/^[a-f0-9]{64}$/.test(String(body.visitorId || '')) || !/^[a-f0-9]{64}$/.test(String(body.visitKey || '')) || !/^(\/|\/about|\/contact|\/blog|\/blog\/[a-zA-Z0-9-]+|\/product\/[a-zA-Z0-9-]+|\/policies\/(shipping|returns|privacy|terms))$/.test(String(body.path || ''))) throw new BadRequestError('Invalid visit.')
  $app.runInTransaction(tx => {
    if (!tx.findRecordById('store_settings', 'storeconfig0001').getBool('analyticsEnabled')) return
    if (tx.findRecordsByFilter('visits', 'visitKey = {:key}', '', 1, 0, { key: body.visitKey }).length) return
    const record = new Record(tx.findCollectionByNameOrId('visits'))
    for (const field of ['path', 'visitorId', 'visitKey']) record.set(field, body[field])
    tx.save(record)
  })
  return e.json(200, { ok: true })
}, $apis.requireSuperuserAuth())
