/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const admin = '@request.auth.id != "" && @request.auth.isActive = true && @request.auth.role = "admin"'
  const commonDates = [
    { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
    { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
  ]
  app.save(new Collection({ name: 'support_messages', type: 'base', listRule: admin, viewRule: admin, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'name', type: 'text', required: true, max: 120 },
    { name: 'email', type: 'email', required: true },
    { name: 'purpose', type: 'text', required: true, max: 32 },
    { name: 'subject', type: 'text', max: 200 },
    { name: 'message', type: 'text', required: true, max: 5000 },
    { name: 'status', type: 'text', required: true, max: 32 },
    { name: 'requestHash', type: 'text', hidden: true, max: 64 },
    ...commonDates,
  ], indexes: ['CREATE INDEX `idx_support_status_created` ON `support_messages` (`status`, `created`)'] }))
  app.save(new Collection({ name: 'notification_jobs', type: 'base', listRule: admin, viewRule: admin, createRule: null, updateRule: null, deleteRule: null, fields: [
    { name: 'kind', type: 'text', required: true, max: 64 },
    { name: 'dedupeKey', type: 'text', required: true, max: 255 },
    { name: 'recipient', type: 'email' },
    { name: 'payload', type: 'json', maxSize: 16384 },
    { name: 'status', type: 'text', required: true, max: 32 },
    { name: 'attempts', type: 'number', onlyInt: true, min: 0 },
    { name: 'lastError', type: 'text', max: 2000 },
    { name: 'nextAttemptAt', type: 'date' },
    { name: 'sentAt', type: 'date' },
    ...commonDates,
  ], indexes: [
    'CREATE UNIQUE INDEX `idx_notification_dedupe` ON `notification_jobs` (`dedupeKey`)',
    'CREATE INDEX `idx_notification_status_next` ON `notification_jobs` (`status`, `nextAttemptAt`)',
  ] }))
}, () => {
  throw new Error('Support notification migration is forward-only. Restore a reviewed backup or apply a corrective migration.')
})
