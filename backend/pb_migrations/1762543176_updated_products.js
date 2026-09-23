/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update collection data
  unmarshal({
    "indexes": [
      "CREATE UNIQUE INDEX `idx_0xAVqugmU0` ON `products` (`sku`)",
      "CREATE UNIQUE INDEX `idx_2uQ3YfKd2I` ON `products` (`slug`)"
    ]
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_4092854851")

  // update collection data
  unmarshal({
    "indexes": []
  }, collection)

  return app.save(collection)
})
