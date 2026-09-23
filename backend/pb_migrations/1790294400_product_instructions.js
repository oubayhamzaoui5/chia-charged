migrate((app) => {
  const collection = app.findCollectionByNameOrId('store_settings')
  for (const name of ['storageInstructions', 'preparationInstructions']) {
    collection.fields.add(new TextField({ name, max: 2000 }))
  }
  app.save(collection)
}, () => { throw new Error('Forward-only migration: preserve product instructions.') })
