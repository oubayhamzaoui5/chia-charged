// Shared by the install migration. Never updates existing editorial content.
module.exports = function seedBlog(app, directory) {
  const posts = require(directory + '/posts.json');
  const collection = app.findCollectionByNameOrId('posts');
  for (const post of posts) {
    const existing = app.findRecordsByFilter('posts', 'slug = {:slug} || title = {:title}', '', 1, 0, { slug: post.slug, title: post.title });
    if (existing.length) continue;
    const record = new Record(collection);
    for (const field of ['title', 'slug', 'excerpt', 'content', 'published']) record.set(field, post[field]);
    record.set('coverImage', $filesystem.fileFromPath(directory + '/' + post.coverImage));
    app.save(record);
  }
};
