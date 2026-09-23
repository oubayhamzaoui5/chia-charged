const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');
const { NextRequest } = require('next/server');

const base = process.env.SHIPPING_TEST_URL;
assert.match(base || '', /^http:\/\/127\.0\.0\.1:\d+$/, 'Run via npm run test:shipping to create an isolated backend');
let adminAllowed = false;
let stripeRequest;
let stripeSession = 0;
const modules = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (modules.has(filename)) return modules.get(filename).exports;
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} }; modules.set(filename, module);
  const mocks = {
    'server-only': {},
    'next/server': require('next/server'),
    'next/headers': { cookies: async () => { throw new Error('Unexpected cookie access'); } },
    '@/lib/auth': { requireAdmin: async () => { if (!adminAllowed) throw new Error('Forbidden'); return { user: { role: 'admin' } }; } },
    '@/lib/auth/server': { getSession: async () => null },
    '@/lib/oauth-keys': { CredentialStoreError: require('../src/lib/credential-store.cjs').CredentialStoreError, getOAuthKeys: () => ({ stripeSecretKey: 'sk_test_dummy' }) },
    '@/lib/push/admin-order-push': { sendAdminOrderPushNotification: async () => {} },
    '@/lib/rate-limit': { rateLimit: async () => ({ allowed: true }), getClientIp: () => 'test' },
  };
  const importer = name => name in mocks ? mocks[name] : name === 'pocketbase' ? PocketBase : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name);
  const providerFetch = async (url, init) => {
    if (/\/v1\/checkout\/sessions\/cs_[A-Za-z0-9_]+\/expire$/.test(url)) return Response.json({ status: 'expired' });
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions');
    stripeRequest = new URLSearchParams(init.body);
    return Response.json({ id: `cs_test_shipping_${++stripeSession}`, url: 'https://checkout.stripe.com/test-dummy', expires_at: 1893456000 });
  };
  new Function('require', 'module', 'exports', 'fetch', source)(importer, module, module.exports, providerFetch);
  return module.exports;
}

test('US shipping uses persisted admin policy at both checkout boundaries', async t => {
  const pb = new PocketBase(base); pb.autoCancellation(false);
  const superuser = new PocketBase(base);
  await superuser.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const model = load('src/lib/shipping.ts');
  const shipping = load('src/lib/shipping.server.ts');
  const action = load('src/app/(admin)/admin/settings/actions.ts');
  const stripe = load('src/app/api/shop/stripe/checkout/route.ts');
  const cancelCheckout = load('src/app/api/shop/orders/[id]/cancel/route.ts');
  const cod = load('src/app/api/shop/orders/route.ts');
  const endpoint = load('src/app/api/shop/shipping/route.ts');
  const product = await superuser.collection('products').create({ sku: 'SHIPPING-TEST', slug: 'shipping-test', name: 'Synthetic product', price: 100, stock: 100, isActive: true, inView: true, currency: 'USD' });
  const makeRequest = (policy, changes = {}) => {
    const body = { firstName: 'Test', lastName: 'Buyer', email: 'buyer@example.test', address: 'Test address', city: 'Test city',
      country: 'US', state: 'CA', postalCode: '90210', shippingVersion: policy.version,
      items: [{ productId: product.id, quantity: 1 }], ...changes };
    const request = new Request(`${base}/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `shipping-${Date.now()}-${Math.random().toString(36).slice(2)}` }, body: JSON.stringify(body) });
    request.nextUrl = new URL(request.url); return request;
  };

  await t.test('migration preserves $5 US rate and public reads omit credentials', async () => {
    const response = await endpoint.GET(); assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).policy, { rateCents: 500, version: 'initial-us-rate', country: 'US', currency: 'USD' });
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
  await t.test('direct anonymous and customer settings writes are denied', async () => {
    await assert.rejects(pb.collection('shipping_settings').update(model.SHIPPING_RECORD_ID, { rateCents: 1 }), e => e.status === 403);
    const user = await pb.collection('users').create({ email: 'customer@example.test', password: 'Customer-Test-132!', passwordConfirm: 'Customer-Test-132!', role: 'customer', isActive: true });
    const customer = new PocketBase(base); await customer.collection('users').authWithPassword('customer@example.test', 'Customer-Test-132!');
    assert.ok(user.id);
    await assert.rejects(customer.collection('shipping_settings').update(model.SHIPPING_RECORD_ID, { rateCents: 1 }), e => e.status === 403);
  });
  await t.test('dashboard action requires admin and validates monetary input', async () => {
    await assert.rejects(action.saveShippingRateAction('8.25'), /Forbidden/);
    adminAllowed = true;
    for (const value of ['', '-1', '1.234', 'Infinity', '1e2', '10000', true, null]) {
      assert.equal((await action.saveShippingRateAction(value)).success, false, String(value));
    }
    const result = await action.saveShippingRateAction('8.25');
    assert.equal(result.success, true); assert.equal((await shipping.getShippingPolicy()).rateCents, 825);
  });
  await t.test('non-US, missing country and invalid address fail before an order is written', async () => {
    const policy = await shipping.getShippingPolicy();
    const before = (await superuser.collection('orders').getList(1, 1)).totalItems;
    assert.equal((await cod.POST()).status, 410);
    for (const route of [stripe]) {
      for (const changes of [{ country: 'CA' }, { country: '' }, { state: '' }, { postalCode: 'invalid' }]) {
        assert.equal((await route.POST(makeRequest(policy, changes))).status, 400);
      }
    }
    assert.equal((await superuser.collection('orders').getList(1, 1)).totalItems, before);
  });
  await t.test('browser shipping and total tampering cannot alter either saved order', async () => {
    const policy = await shipping.getShippingPolicy();
    for (const route of [stripe]) {
      const response = await route.POST(makeRequest(policy, { shipping: -99, total: 1, currency: 'FAKE' }));
      assert.ok(response.ok, await response.clone().text());
      const order = await superuser.collection('orders').getOne((await response.json()).orderId);
      assert.equal(order.total, 108.25); assert.equal(order.shippingCents, 825);
      assert.equal(order.country, 'US'); assert.equal(order.state, 'CA'); assert.equal(order.currency, 'USD');
      assert.equal(order.shippingPolicyVersion, policy.version);
    }
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '10000');
    assert.equal(stripeRequest.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '825');
    assert.equal(stripeRequest.get('automatic_tax[enabled]'), 'true');
  });
  await t.test('rate changes require review and preserve already created orders', async () => {
    const old = await shipping.getShippingPolicy();
    const existing = await superuser.collection('orders').getFullList();
    assert.equal((await action.saveShippingRateAction('12.50')).success, true);
    for (const route of [stripe]) {
      const response = await route.POST(makeRequest(old)); assert.equal(response.status, 409);
      assert.equal((await response.json()).policy.rateCents, 1250);
    }
    assert.equal((await superuser.collection('orders').getFullList()).length, existing.length);
    for (const order of existing) assert.equal((await superuser.collection('orders').getOne(order.id)).shippingCents, 825);
    const current = await shipping.getShippingPolicy();
    assert.equal((await stripe.POST(makeRequest(current))).status, 200);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '10000');
    assert.equal(stripeRequest.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '1250');
  });
  await t.test('zero rate means free shipping', async () => {
    assert.equal((await action.saveShippingRateAction('0.00')).success, true);
    const current = await shipping.getShippingPolicy();
    const response = await stripe.POST(makeRequest(current)); assert.equal(response.status, 200);
    const order = await superuser.collection('orders').getOne((await response.json()).orderId);
    assert.equal(order.shippingCents, 0); assert.equal(order.total, 100);
  });
  await t.test('customer cancellation expires Stripe session and restores stock', async () => {
    const current = await shipping.getShippingPolicy();
    const stockBefore = (await superuser.collection('products').getOne(product.id)).stock;
    const checkout = await stripe.POST(makeRequest(current)); assert.equal(checkout.status, 200);
    const { orderId } = await checkout.json();
    assert.equal((await superuser.collection('products').getOne(product.id)).stock, stockBefore - 1);
    const cookie = checkout.headers.get('set-cookie').split(';')[0];
    const cancelled = await cancelCheckout.POST(new NextRequest(`${base}/api/shop/orders/${orderId}/cancel`, { method: 'POST', headers: { cookie } }), { params: Promise.resolve({ id: orderId }) });
    assert.equal(cancelled.status, 200, await cancelled.clone().text());
    assert.equal((await superuser.collection('products').getOne(product.id)).stock, stockBefore);
    const order = await superuser.collection('orders').getOne(orderId);
    assert.equal(order.paymentStatus, 'expired'); assert.equal(order.reservationStatus, 'released');
  });
  await t.test('missing settings fails closed at both endpoints', async () => {
    await superuser.collection('shipping_settings').delete(model.SHIPPING_RECORD_ID);
    assert.equal((await endpoint.GET()).status, 503);
    assert.equal((await stripe.POST(makeRequest({ version: 'missing' }))).status, 503);
  });
});
