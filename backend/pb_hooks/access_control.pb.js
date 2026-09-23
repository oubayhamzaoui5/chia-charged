/// <reference path="../pb_data/types.d.ts" />
onRecordEnrich((e) => {
  const auth = e.requestInfo && e.requestInfo.auth
  const superuser = auth && auth.collection().name === '_superusers'
  if (superuser && e.record.collection().name === 'orders') e.record.unhide('guestAccessHash')
  if (superuser && e.record.collection().name === 'orders') { e.record.unhide('emailAccessHash'); e.record.unhide('emailAccessExpires') }
  if ((superuser || (auth && auth.getString('role') === 'admin')) && e.record.collection().name === 'products') e.record.unhide('costPrice')
  e.next()
}, 'products', 'orders')

// File authorization uses PocketBase protected file fields and collection view rules.
