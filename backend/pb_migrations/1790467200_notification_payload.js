migrate(app => {
  const collection = app.findCollectionByNameOrId('notification_jobs')
  collection.fields.getByName('payload').maxSize = 65536
  app.save(collection)
}, () => { throw new Error('Forward-only migration: retain notification payloads.') })
