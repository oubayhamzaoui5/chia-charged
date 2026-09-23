/// <reference path="../pb_data/types.d.ts" />

// Changing account activity rotates PocketBase's signing key for that record,
// invalidating every previously issued auth token immediately.
onRecordUpdateRequest((e) => {
  const before = e.record.original().getBool('isActive')
  const after = e.record.getBool('isActive')
  if (before !== after) e.record.refreshTokenKey()
  e.next()
}, 'users')
