/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3907243821")

  // remove field
  collection.fields.removeById("relation4047749037")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3907243821")

  // add field
  collection.fields.addAt(2, new Field({
    "cascadeDelete": false,
    "collectionId": "pbc_4090891256",
    "hidden": false,
    "id": "relation4047749037",
    "maxSelect": 1,
    "minSelect": 0,
    "name": "variant",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "relation"
  }))

  return app.save(collection)
})
