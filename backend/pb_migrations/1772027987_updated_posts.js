/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1125843985")

  // remove field
  collection.fields.removeById("text1829049001")

  // add field
  collection.fields.addAt(6, new Field({
    "hidden": false,
    "id": "file1829049001",
    "maxSelect": 1,
    "maxSize": 0,
    "mimeTypes": [],
    "name": "coverImage",
    "presentable": false,
    "protected": false,
    "required": false,
    "system": false,
    "thumbs": [],
    "type": "file"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1125843985")

  // add field
  collection.fields.addAt(4, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1829049001",
    "max": 0,
    "min": 0,
    "name": "coverImage",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // remove field
  collection.fields.removeById("file1829049001")

  return app.save(collection)
})
