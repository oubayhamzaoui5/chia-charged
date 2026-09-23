// Add bundled starter articles to an existing database without overwriting edits.
const fs = require('node:fs');
const path = require('node:path');
const PocketBase = require('pocketbase/cjs');
const posts = require('../backend/pb_hooks/blog-seed/posts.json');
async function main() {
  const url = process.env.POCKETBASE_URL;
  if (!url || !process.env.PB_ADMIN_EMAIL || !process.env.PB_ADMIN_PASSWORD) throw new Error('Set POCKETBASE_URL, PB_ADMIN_EMAIL and PB_ADMIN_PASSWORD explicitly.');
  const pb = new PocketBase(url);
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  let created = 0;
  for (const post of posts) {
    const existing = await pb.collection('posts').getList(1, 1, { filter: pb.filter('slug = {:slug} || title = {:title}', { slug: post.slug, title: post.title }) });
    if (existing.totalItems) continue;
    const form = new FormData();
    for (const field of ['title', 'slug', 'excerpt', 'content', 'published']) form.set(field, String(post[field]));
    form.set('coverImage', new Blob([fs.readFileSync(path.join(__dirname, '../backend/pb_hooks/blog-seed', post.coverImage))], { type: 'image/webp' }), post.coverImage);
    await pb.collection('posts').create(form);
    created++;
  }
  console.log(`Starter blog: ${created} created; ${posts.length - created} existing posts preserved.`);
}
main().catch(() => { console.error('Blog installation failed. Check backend access and configuration; existing posts were not overwritten.'); process.exitCode = 1; });
