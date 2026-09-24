migrate((app) => {
  const collection = app.findCollectionByNameOrId('store_settings');
  collection.fields.add(new JSONField({ name: 'socialLinks', maxSize: 10000 }));
  app.save(collection);
  const record = app.findRecordById('store_settings', 'storeconfig0001');
  record.set('socialLinks', { instagram: '', facebook: '', tiktok: '' });
  app.save(record);
}, () => { throw new Error('Forward-only migration: preserve owner social links.'); });
