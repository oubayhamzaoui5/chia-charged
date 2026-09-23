const { test } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');
const { NextRequest } = require('next/server');

const base = process.env.SHIPPING_TEST_URL;
const webhookSecret = 'whsec_payment_fixture';
const cache = new Map();
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const mocks = {
    'server-only': {},
    '@/lib/oauth-keys': { getOAuthKeys: () => ({ stripeSecretKey: 'sk_test_payment', stripeWebhookSecret: webhookSecret }) },
    '@/lib/push/admin-order-push': { sendAdminOrderPushNotification: async () => {} },
  };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const importer = name => name in mocks ? mocks[name] : name === 'pocketbase' ? PocketBase : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name);
  new Function('require', 'module', 'exports', source)(importer, module, module.exports);
  return module.exports;
}
function signedRequest(event, timestamp = Math.floor(Date.now() / 1000), secret = webhookSecret) {
  const body = JSON.stringify(event);
  const signature = crypto.createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  return new NextRequest(`${base}/api/shop/stripe/webhook`, { method: 'POST', body, headers: {
    'content-type': 'application/json', 'stripe-signature': `t=${timestamp},v1=${signature}`,
  } });
}
function event(type, order, changes = {}) {
  return { id: `evt_${crypto.randomBytes(8).toString('hex')}`, type, livemode: false, data: { object: {
    id: order.stripeSessionId, mode: 'payment', payment_status: 'paid', amount_subtotal: 3750, amount_total: 4590,
    automatic_tax: { enabled: true, status: 'complete' },
    total_details: { amount_discount: 0, amount_shipping: 500, amount_tax: 340 },
    shipping_details: { name: 'Tax Buyer', phone: '+1 555 0100', address: { line1: '100 Test Street', line2: 'Suite 2', city: 'Los Angeles', state: 'CA', postal_code: '90210', country: 'US' } },
    currency: 'usd', client_reference_id: order.id, metadata: { orderId: order.id }, payment_intent: 'pi_payment_fixture', ...changes,
  } } };
}

test('Stripe webhook requires fresh signatures and exact payment binding', async t => {
  const root = new PocketBase(base); root.autoCancellation(false);
  await root.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const webhook = load('src/app/api/shop/stripe/webhook/route.ts');
  const createOrder = suffix => root.collection('orders').create({
    items: [], total: 42.5, currency: 'USD', status: 'on hold', paymentMode: 'stripe', paymentStatus: 'pending',
    fulfillmentStatus: 'on hold', itemsTotalCents: 3750, shippingCents: 500, taxCents: 0, totalCents: 4250,
    paymentAmountCents: 4250, paymentCurrency: 'USD', stripeSessionId: `cs_test_${suffix}`,
    reservationStatus: 'reserved', reservationExpiresAt: '2030-01-01 00:00:00.000Z',
    taxProvider: 'stripe_tax', taxStatus: 'pending', addressSnapshot: { email: 'tax@example.test' },
  });

  await t.test('missing, invalid and stale signatures are rejected', async () => {
    const body = JSON.stringify({});
    assert.equal((await webhook.POST(new NextRequest(`${base}/webhook`, { method: 'POST', body }))).status, 400);
    assert.equal((await webhook.POST(signedRequest({}, Math.floor(Date.now() / 1000), 'wrong'))).status, 400);
    assert.equal((await webhook.POST(signedRequest({}, Math.floor(Date.now() / 1000) - 301))).status, 400);
  });

  await t.test('wrong order, amount, currency, mode and unpaid completion never mark paid', async () => {
    const order = await createOrder('mismatch');
    for (const changes of [
      { client_reference_id: 'wrong' }, { amount_total: 1 }, { amount_subtotal: 1 }, { currency: 'eur' }, { mode: 'subscription' },
      { automatic_tax: { enabled: false, status: null } },
      { total_details: { amount_discount: 0, amount_shipping: 1, amount_tax: 340 } },
      { shipping_details: { address: { line1: '', city: '', state: '', postal_code: '', country: 'US' } } },
    ]) assert.equal((await webhook.POST(signedRequest(event('checkout.session.completed', order, changes)))).status, 400);
    const pending = await webhook.POST(signedRequest(event('checkout.session.completed', order, { payment_status: 'unpaid' })));
    assert.equal(pending.status, 200); assert.equal((await pending.json()).paymentPending, true);
    assert.equal((await root.collection('orders').getOne(order.id)).paymentStatus, 'pending');
  });

  await t.test('valid payment marks only payment status and replay is idempotent', async () => {
    const order = await createOrder('paid');
    const paidEvent = event('checkout.session.completed', order);
    assert.equal((await webhook.POST(signedRequest(paidEvent))).status, 200);
    const saved = await root.collection('orders').getOne(order.id);
    assert.equal(saved.paymentStatus, 'paid'); assert.equal(saved.fulfillmentStatus, 'on hold');
    assert.equal(saved.taxStatus, 'complete'); assert.equal(saved.taxCents, 340); assert.equal(saved.totalCents, 4590);
    assert.equal(saved.paymentAmountCents, 4590); assert.equal(saved.total, 45.9); assert.equal(saved.addressSnapshot.providerVerified, true);
    assert.equal(saved.stripePaymentIntentId, 'pi_payment_fixture'); assert.ok(saved.paidAt);
    const replay = await webhook.POST(signedRequest(paidEvent));
    assert.equal(replay.status, 200); assert.equal((await replay.json()).duplicate, true);
  });

  await t.test('expired and failed sessions remain unpaid', async () => {
    for (const [type, expected, suffix] of [
      ['checkout.session.expired', 'expired', 'expired'],
      ['checkout.session.async_payment_failed', 'failed', 'failed'],
    ]) {
      const order = await createOrder(suffix);
      assert.equal((await webhook.POST(signedRequest(event(type, order)))).status, 200);
      assert.equal((await root.collection('orders').getOne(order.id)).paymentStatus, expected);
    }
  });
});
