// Disposable SMTP integration only. Never copied to release hooks.
routerAdd('POST', '/__test/receipt', e => {
  const order = e.app.findRecordById('orders', e.requestInfo().body.id)
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- PocketBase embedded runtime uses CommonJS.
  require(__hooks + '/notification_helpers.js').order(e.app, order, 'receipt')
  return e.json(200, { ok: true })
}, $apis.requireSuperuserAuth())
