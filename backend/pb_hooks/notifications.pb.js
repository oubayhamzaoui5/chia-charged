/* eslint-disable @typescript-eslint/no-require-imports -- PocketBase hooks use its CommonJS loader. */
cronAdd('chia_notification_delivery', '* * * * *', () => { require(__hooks + '/notification_helpers.js').run($app) })
routerAdd('POST', '/api/chia-notifications/run', e => e.json(200, require(__hooks + '/notification_helpers.js').run($app)), $apis.requireSuperuserAuth())
routerAdd('POST', '/api/chia-support/submit', e => {
  const body = e.requestInfo().body
  let id = ''
  $app.runInTransaction(tx => {
    const record = new Record(tx.findCollectionByNameOrId('support_messages'))
    for (const field of ['name', 'email', 'purpose', 'subject', 'message', 'requestHash']) record.set(field, body[field])
    record.set('status', 'new'); tx.save(record); id = record.id
    require(__hooks + '/notification_helpers.js').enqueue(tx, 'support_message', 'support:' + id, '', 'Support: ' + record.getString('subject'), 'From: ' + record.getString('name') + ' <' + record.getString('email') + '>\n\n' + record.getString('message'))
  })
  return e.json(201, { id })
}, $apis.requireSuperuserAuth())
