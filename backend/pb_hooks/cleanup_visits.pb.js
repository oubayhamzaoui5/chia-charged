// Visit records live in the main database. Delete in bounded daily batches.
cronAdd('cleanup-old-visits', '0 3 * * *', () => {
  try {
    $app.db().newQuery("DELETE FROM visits WHERE id IN (SELECT id FROM visits WHERE created < datetime('now', '-90 days') ORDER BY created LIMIT 10000)").execute()
  } catch (error) { console.error('[cleanup-visits]', error) }
})
