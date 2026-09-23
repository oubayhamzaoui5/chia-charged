const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const PocketBase = require('pocketbase/cjs');
const directory = path.resolve(__dirname, '../backend/pb_hooks/blog-seed');
const posts = require('../backend/pb_hooks/blog-seed/posts.json');

test('fresh installation publishes original blog posts with portable cover files', async () => {
  const pb = new PocketBase(process.env.SHIPPING_TEST_URL);
  const records = await pb.collection('posts').getFullList();
  assert.equal(records.length, 3);
  for (const original of posts) {
    const record = records.find(item => item.slug === original.slug);
    assert.equal(record.title, original.title);
    assert.equal(record.content, original.content);
    assert.equal(record.published, true);
    const response = await fetch(pb.files.getURL(record, record.coverImage));
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(directory, original.coverImage)));
  }
});

test('repeat seeding preserves edits, unpublished posts and legacy slugs', () => {
  const module = { exports: {} };
  vm.runInNewContext(fs.readFileSync(path.join(directory, '../blog-seed.js'), 'utf8'), { module, require });
  let checked = 0;
  module.exports({
    findCollectionByNameOrId: () => ({}),
    findRecordsByFilter(collection, filter, sort, limit, offset, params) {
      assert.equal(collection, 'posts');
      assert.equal(filter, 'slug = {:slug} || title = {:title}');
      assert.equal(params.slug, posts[checked].slug);
      assert.equal(params.title, posts[checked++].title);
      return [{ published: false, content: 'Owner edit' }];
    },
    save: () => assert.fail('Existing post must never be overwritten'),
  }, directory);
  assert.equal(checked, 3);
});
