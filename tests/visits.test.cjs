const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');
const { NextRequest } = require('next/server');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  new Function('require', 'module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(name => name in mocks ? mocks[name] : require(name), module, module.exports);
  return module.exports;
}
test('visitor tracking respects activation/privacy, hides private paths, and deduplicates concurrent writes', async () => {
  const pb = new PocketBase(process.env.SHIPPING_TEST_URL); pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const guest = new PocketBase(process.env.SHIPPING_TEST_URL);
  await assert.rejects(guest.send('/api/chia-visits/record', { method: 'POST', body: {} }));
  const route = load('src/app/api/track-visit/route.ts', {
    '@/lib/pb-service.server': { createServicePb: async () => pb },
    '@/lib/store-settings.server': { getStoreSettings: () => pb.collection('store_settings').getOne('storeconfig0001') },
    '@/lib/url-policy': { getAppOrigin: () => 'https://store.example.test' },
    '@/lib/rate-limit': { getClientIp: () => 'test', rateLimit: async () => ({ allowed: true }) },
    '@/lib/visit-path': load('src/lib/visit-path.ts'),
  });
  const request = (routePath = '/', headers = {}) => new NextRequest('https://store.example.test/api/track-visit', { method: 'POST', headers: { origin: 'https://store.example.test', ...headers }, body: JSON.stringify({ path: routePath }) });
  assert.equal((await route.POST(request())).status, 204);
  for (const body of ['null', '[]', '42', '{}', '{']) {
    const invalid = new NextRequest('https://store.example.test/api/track-visit', { method: 'POST', headers: { origin: 'https://store.example.test' }, body });
    assert.equal((await route.POST(invalid)).status, 400);
  }
  assert.equal((await pb.collection('visits').getList(1, 1)).totalItems, 0);
  await pb.collection('store_settings').update('storeconfig0001', { analyticsEnabled: true });
  assert.equal((await route.POST(request('/', { origin: 'https://other.example.test' }))).status, 403);
  for (const privatePath of ['/admin', '/account', '/checkout/confirmation?id=secret', '/order-access', '/?token=secret']) assert.equal((await route.POST(request(privatePath))).status, 400);
  for (const header of ['dnt', 'sec-gpc']) assert.equal((await route.POST(request('/', { [header]: '1' }))).status, 204);
  const first = await route.POST(request());
  assert.equal(first.status, 200);
  const cookie = first.headers.get('set-cookie').split(';')[0];
  assert.ok(first.headers.get('set-cookie').includes('HttpOnly'));
  await Promise.all(Array.from({ length: 5 }, () => route.POST(request('/about', { cookie }))));
  const records = await pb.collection('visits').getFullList();
  assert.equal(records.length, 1);
  assert.match(records[0].visitorId, /^[a-f0-9]{64}$/);
  await assert.rejects(guest.collection('visits').getOne(records[0].id));
});
