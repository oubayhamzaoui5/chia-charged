const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');
const { NextRequest } = require('next/server');
const store = require('../src/lib/credential-store.cjs');
const base = process.env.SHIPPING_TEST_URL;
assert.match(base || '', /^http:\/\/127\.0\.0\.1:\d+$/);
const file = process.env.CREDENTIALS_FILE;
const key = process.env.OAUTH_ENCRYPTION_KEY;
const cache = new Map(); let adminAllowed = true; const cookies = [];
let stripePayload;
let stripeSession = 0;
function load(relative) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const mocks = { 'server-only': {}, '@/lib/auth': { requireAdmin: async () => {
    if (!adminAllowed) throw new Error('Forbidden'); return { user: { role: 'admin' } };
  } }, '@/lib/auth/server': { getSession: async () => null },
    'next/headers': { cookies: async () => ({ set: (...args) => cookies.push(args), get: () => undefined }) },
  };
  const importer = name => name in mocks ? mocks[name] : name === 'pocketbase' ? PocketBase : name.startsWith('@/') ?
    (name.endsWith('.cjs') ? require(path.resolve('src', name.slice(2))) : load(`src/${name.slice(2)}.ts`)) : require(name);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'fetch', code)(importer, module, module.exports, async (url, init) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions'); stripePayload = new URLSearchParams(init.body);
    return Response.json({ id: `cs_test_credentials_${++stripeSession}`, url: 'https://checkout.stripe.com/fixture', expires_at: 1893456000 });
  });
  return module.exports;
}
async function withEnv(changes, fn) {
  const old = {};
  for (const [name, value] of Object.entries(changes)) { old[name] = process.env[name]; if (value === undefined) delete process.env[name]; else process.env[name] = value; }
  try { return await fn(); }
  finally { for (const [name, value] of Object.entries(old)) { if (value === undefined) delete process.env[name]; else process.env[name] = value; } }
}
test('credentials, provider isolation, startup and transport', async t => {
  const pb = new PocketBase(base); pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const keys = load('src/lib/oauth-keys.ts');
  const actions = load('src/app/(admin)/admin/keys/actions.ts');
  const original = { googleClientId: 'google-fixture-client', googleClientSecret: 'google-fixture-secret', stripePublishableKey: 'pk_test_fixture', stripeSecretKey: 'sk_test_fixture', stripeWebhookSecret: 'whsec_fixture', metaPixelId: '123456789012345' };
  await t.test('required key, authenticated encryption, no plaintext and fresh nonces', async () => {
    await withEnv({ OAUTH_ENCRYPTION_KEY: undefined }, () => assert.throws(() => keys.getOAuthKeys(), /OAUTH_ENCRYPTION_KEY/));
    await withEnv({ OAUTH_ENCRYPTION_KEY: 'weak' }, () => assert.throws(() => keys.mergeOAuthKeys(original), /OAUTH_ENCRYPTION_KEY/));
    keys.mergeOAuthKeys(original);
    const first = fs.readFileSync(file, 'utf8'); assert.equal(first.includes(original.stripeSecretKey), false);
    assert.deepEqual(keys.getOAuthKeys(), original);
    keys.mergeOAuthKeys({}); assert.notEqual(first, fs.readFileSync(file, 'utf8'));
    await withEnv({ OAUTH_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex') }, () => assert.throws(() => keys.getOAuthKeys(), /cannot be decrypted/));
  });
  await t.test('corruption and concurrent-write lock never overwrite existing credentials', async () => {
    const valid = fs.readFileSync(file, 'utf8');
    const damaged = JSON.parse(valid); damaged.authTag = '0'.repeat(32); fs.writeFileSync(file, JSON.stringify(damaged));
    const corrupted = fs.readFileSync(file, 'utf8');
    assert.throws(() => keys.mergeOAuthKeys({ metaPixelId: '111111111111' }), /cannot be decrypted/);
    assert.equal(fs.readFileSync(file, 'utf8'), corrupted);
    fs.writeFileSync(file, valid); fs.writeFileSync(`${file}.lock`, 'fixture');
    try { assert.throws(() => keys.mergeOAuthKeys({ metaPixelId: '111111111111' }), /busy/); }
    finally { fs.unlinkSync(`${file}.lock`); }
    assert.equal(fs.readFileSync(file, 'utf8'), valid);
  });
  await t.test('offline legacy migration and key rotation preserve source and all providers', async () => {
    const legacyKey = 'synthetic-legacy-passphrase';
    const iv = crypto.randomBytes(12); const cipher = crypto.createCipheriv('aes-256-gcm', crypto.createHash('sha256').update(legacyKey).digest(), iv);
    const data = Buffer.concat([cipher.update(JSON.stringify(original)), cipher.final()]);
    const source = `${file}.legacy`; const target = `${file}.migrated`; const rotated = `${file}.rotated`;
    const legacy = JSON.stringify({ iv: iv.toString('hex'), authTag: cipher.getAuthTag().toString('hex'), data: data.toString('hex') }); fs.writeFileSync(source, legacy);
    assert.throws(() => store.decryptKeys(legacy), /offline migration/);
    const run = (from, to, env) => spawnSync(process.execPath, ['scripts/provision-credentials.cjs', 'migrate', from, to], { encoding: 'utf8', windowsHide: true, env: { ...process.env, ...env } });
    const migrated = run(source, target, { LEGACY_OAUTH_ENCRYPTION_KEY: legacyKey }); assert.equal(migrated.status, 0, migrated.stderr);
    assert.equal(fs.readFileSync(source, 'utf8'), legacy);
    assert.deepEqual(store.decryptKeys(fs.readFileSync(target, 'utf8')), original);
    assert.throws(() => store.decryptKeys(fs.readFileSync(target, 'utf8'), crypto.createHash('sha256').update(legacyKey).digest()));
    assert.notEqual(run(source, target, { LEGACY_OAUTH_ENCRYPTION_KEY: legacyKey }).status, 0);
    assert.notEqual(run(source, source, { LEGACY_OAUTH_ENCRYPTION_KEY: legacyKey }).status, 0);
    const nextKey = crypto.randomBytes(32).toString('hex');
    assert.equal(run(target, rotated, { PREVIOUS_OAUTH_ENCRYPTION_KEY: key, OAUTH_ENCRYPTION_KEY: nextKey }).status, 0);
    assert.deepEqual(store.decryptKeys(fs.readFileSync(rotated, 'utf8'), Buffer.from(nextKey, 'hex')), original);
    assert.ok(!migrated.stdout.includes(legacyKey) && !migrated.stdout.includes(original.stripeSecretKey));
  });
  await t.test('Google save/remove updates real PocketBase provider without removing Stripe or Meta', async () => {
    // Preserve another configured OAuth provider when Google is changed.
    await pb.collections.update('users', { oauth2: { enabled: true, providers: [{ name: 'github', clientId: 'github-fixture', clientSecret: 'github-secret' }] } });
    const result = await actions.saveKeysAction('google-new-client', 'google-new-secret'); assert.deepEqual(result, { success: true });
    let providers = (await pb.collections.getOne('users')).oauth2.providers;
    assert.equal(providers.find(p => p.name === 'google').clientId, 'google-new-client');
    // REST hides provider secrets; test-only backend probe returns only a boolean.
    assert.equal((await pb.send('/__test/provider-preserved', { method: 'GET' })).preserved, true);
    assert.deepEqual(await actions.deleteKeysAction(), { success: true });
    assert.equal(keys.getOAuthKeys().googleClientId, undefined);
    assert.equal(keys.getOAuthKeys().stripeSecretKey, original.stripeSecretKey);
    assert.equal(keys.getOAuthKeys().stripeWebhookSecret, original.stripeWebhookSecret);
    assert.equal(keys.getOAuthKeys().metaPixelId, original.metaPixelId);
    providers = (await pb.collections.getOne('users')).oauth2.providers;
    assert.equal(providers.some(p => p.name === 'google'), false); assert.equal(providers.length, 1);
    assert.equal((await pb.send('/__test/provider-preserved', { method: 'GET' })).preserved, true);
  });
  await t.test('provider actions enforce admin, redact status, validate Stripe mode, and isolate deletion', async () => {
    adminAllowed = false;
    for (const action of [() => actions.saveStripeKeysAction('pk_test_fixture', 'sk_test_fixture'), () => actions.deleteKeysAction(), () => actions.deleteStripeKeysAction(), () => actions.getStripeKeysStatusAction()]) await assert.rejects(action(), /Forbidden/);
    adminAllowed = true;
    assert.equal((await actions.saveStripeKeysAction('pk_test_fixture', 'sk_live_fixture')).success, false);
    const status = await actions.getStripeKeysStatusAction(); assert.ok(!JSON.stringify(status).includes(original.stripeSecretKey));
    keys.mergeOAuthKeys(original); await actions.deleteStripeKeysAction();
    const remaining = keys.getOAuthKeys(); assert.equal(remaining.stripeSecretKey, undefined); assert.equal(remaining.stripeWebhookSecret, undefined);
    assert.equal(remaining.googleClientSecret, original.googleClientSecret); assert.equal(remaining.metaPixelId, original.metaPixelId);
    await actions.deleteMetaPixelAction(); assert.equal(keys.getOAuthKeys().googleClientSecret, original.googleClientSecret);
  });
  await t.test('missing or damaged Stripe configuration never creates a fallback order', async () => {
    const checkout = load('src/app/api/shop/stripe/checkout/route.ts'); const config = load('src/app/api/shop/stripe/config/route.ts');
    const before = (await pb.collection('orders').getList(1, 1)).totalItems;
    const request = () => new NextRequest(`${base}/checkout`, { method: 'POST', body: '{}' });
    assert.equal((await checkout.POST(request())).status, 503); assert.equal((await config.GET()).status, 503);
    const valid = fs.readFileSync(file, 'utf8'); fs.writeFileSync(file, 'broken');
    assert.equal((await config.GET()).status, 503);
    const response = await checkout.POST(request()); assert.ok(response.status >= 500); assert.ok(!(await response.text()).includes(original.stripeSecretKey));
    fs.writeFileSync(file, valid);
    assert.equal((await pb.collection('orders').getList(1, 1)).totalItems, before);
  });
  const policy = load('src/lib/url-policy.ts');
  await t.test('production requires HTTPS public origins, explicit backend and readable encrypted store', async () => {
    const runtime = load('src/lib/runtime-config.server.ts');
    await withEnv({ NODE_ENV: 'production', APP_URL: 'https://shop.example.test', NEXT_PUBLIC_SITE_URL: 'https://shop.example.test', NEXT_PUBLIC_PB_URL: 'https://db.example.test', POCKETBASE_URL: base }, async () => {
      assert.doesNotThrow(() => runtime.validateRuntimeConfiguration());
      for (const [name, value] of [['OAUTH_ENCRYPTION_KEY', undefined], ['CREDENTIALS_FILE', undefined], ['CREDENTIALS_FILE', `${file}.missing`], ['PB_ADMIN_PASSWORD', undefined], ['POCKETBASE_URL', undefined], ['POCKETBASE_URL', 'http://198.51.100.1:8090'], ['NEXT_PUBLIC_PB_URL', 'http://db.example.test'], ['APP_URL', 'http://localhost:3000'], ['APP_URL', 'https://user:secret@shop.example.test'], ['APP_URL', 'https://shop.example.test/path'], ['NEXT_PUBLIC_SITE_URL', 'https://different.example.test'], ['TRUST_PROXY_HEADERS', 'maybe']]) {
        await withEnv({ [name]: value }, () => assert.throws(() => runtime.validateRuntimeConfiguration(), undefined, name));
      }
    });
  });
  await t.test('redirects ignore Host and forwarded headers; auth cookies stay Secure in production', async () => {
    keys.mergeOAuthKeys(original);
    const product = await pb.collection('products').create({ name: 'Fixture product', sku: 'CONFIG', slug: 'config-product', price: 10, stock: 100, isActive: true, inView: true, currency: 'USD' });
    const checkout = load('src/app/api/shop/stripe/checkout/route.ts');
    const sync = load('src/app/api/auth/sync/route.ts');
    const user = await pb.collection('users').create({ email: 'cookie@example.test', password: 'Cookie-Test-123!', passwordConfirm: 'Cookie-Test-123!', role: 'customer', isActive: true });
    const customer = new PocketBase(base); const auth = await customer.collection('users').authWithPassword(user.email, 'Cookie-Test-123!');
    await withEnv({ NODE_ENV: 'production', APP_URL: 'https://shop.example.test', NEXT_PUBLIC_SITE_URL: 'https://shop.example.test', NEXT_PUBLIC_PB_URL: 'https://db.example.test' }, async () => {
      const headers = { 'Content-Type': 'application/json', 'Idempotency-Key': `credentials-${Date.now()}-${Math.random().toString(36).slice(2)}`, host: 'attacker.example', 'x-forwarded-host': 'attacker.example', 'x-forwarded-proto': 'http' };
      const response = await checkout.POST(new NextRequest('http://attacker.example/checkout', { method: 'POST', headers, body: JSON.stringify({ firstName: 'Test', lastName: 'Buyer', email: 'buyer@example.test', address: 'Fixture address', city: 'Fixture', country: 'US', state: 'CA', postalCode: '90210', shippingVersion: 'initial-us-rate', items: [{ productId: product.id, quantity: 1 }] }) }));
      assert.equal(response.status, 200); assert.ok(stripePayload.get('success_url').startsWith('https://shop.example.test/'));
      assert.match(response.headers.get('set-cookie'), /Secure/);
      assert.equal((await sync.POST(new NextRequest('http://attacker.example/sync', { method: 'POST', headers, body: JSON.stringify({ token: auth.token, user: { id: user.id, role: 'admin' } }) }))).status, 200);
      const saved = cookies.find(c => c[0] === 'pb_auth'); assert.equal(saved[2].secure, true); assert.equal(saved[2].httpOnly, true); assert.equal(saved[2].sameSite, 'lax');
      assert.equal(JSON.parse(saved[1]).record.role, 'customer');
    });
    const limiter = load('src/lib/rate-limit.ts'); const req = new Request(base, { headers: { 'x-forwarded-for': '203.0.113.4' } });
    await withEnv({ TRUST_PROXY_HEADERS: undefined }, () => assert.equal(limiter.getClientIp(req), 'unknown'));
    await withEnv({ TRUST_PROXY_HEADERS: 'true' }, () => assert.equal(limiter.getClientIp(req), '203.0.113.4'));
  });
});
