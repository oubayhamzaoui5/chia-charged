/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("visits")

  collection.indexes = [
    "CREATE INDEX idx_visits_created ON visits (created DESC)",
    "CREATE INDEX idx_visits_visitorid ON visits (visitorId)",
    "CREATE INDEX idx_visits_created_visitorid ON visits (created, visitorId)",
  ]

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("visits")
  collection.indexes = []
  return app.save(collection)
})
