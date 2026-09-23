// Loaded ONLY into the disposable integration backend, never release hooks.
routerAdd('GET', '/__test/provider-preserved', (e) => {
  const providers = e.app.findCollectionByNameOrId('users').oauth2.providers
  let preserved = false
  for (const provider of providers) {
    if (provider.name === 'github' && provider.clientSecret === 'github-secret') preserved = true
  }
  return e.json(200, { preserved })
}, $apis.requireSuperuserAuth())
