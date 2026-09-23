migrate((app) => {
  require(__hooks + '/blog-seed.js')(app, __hooks + '/blog-seed');
}, () => {
  throw new Error('Forward-only migration: preserve blog posts and subsequent admin edits.');
});
