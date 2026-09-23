const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const PocketBase = require('pocketbase/cjs');
const crypto = require('node:crypto');

test('receipt uses saved cent amounts for discounted lines and payment breakdown', () => {
  const helper = require('../backend/pb_hooks/notification_helpers.js');
  const fields = { paymentAmountCents: 2367, subtotalCents: 2000, discountCents: 200, itemsTotalCents: 1800, shippingCents: 500, taxCents: 67, email: 'buyer@example.test', items: [{ name: 'Pudding', quantity: 2, unitPriceCents: 900, lineSubtotalCents: 1800 }] };
  let result;
  helper.order.call({ enqueue: (...args) => { result = args; } }, {}, { id: 'a'.repeat(15), getInt: key => fields[key] || 0, getString: key => fields[key] || '', get: key => fields[key] }, 'receipt');
  for (const expected of ['2 × Pudding — USD 9.00 each; USD 18.00', 'Subtotal: USD 20.00', 'Discount: -USD 2.00', 'Shipping: USD 5.00', 'Tax: USD 0.67', 'Total paid: USD 23.67']) assert.ok(result[5].includes(expected));
});

test('support outbox is atomic, private, and remains blocked without delivery setup', async () => {
  const pb = new PocketBase(process.env.SHIPPING_TEST_URL); pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const guest = new PocketBase(process.env.SHIPPING_TEST_URL);
  await assert.rejects(guest.send('/api/chia-notifications/run', { method: 'POST' }));
  await assert.rejects(guest.send('/api/chia-support/submit', { method: 'POST', body: {} }));
  const result = await pb.send('/api/chia-support/submit', { method: 'POST', body: { name: 'Test sender', email: 'sender@example.test', purpose: 'general', subject: 'Question', message: '<script>hello</script>' } });
  const jobs = await pb.collection('notification_jobs').getFullList({ filter: `dedupeKey = 'support:${result.id}'` });
  assert.equal(jobs.length, 1);
  await pb.send('/api/chia-notifications/run', { method: 'POST' });
  const job = await pb.collection('notification_jobs').getOne(jobs[0].id);
  assert.equal(job.status, 'blocked_configuration');
  assert.equal(job.attempts, 0);
  await assert.rejects(guest.collection('notification_jobs').getOne(job.id));
  await assert.rejects(guest.collection('support_messages').getOne(result.id));
});

test('worker marks accepted mail, escapes content, bounds retries and isolates uncertain delivery', () => {
  const source = fs.readFileSync(path.join(__dirname, '../backend/pb_hooks/notification_helpers.js'), 'utf8');
  function run({ failSend = false, failSave = false, attempts = 0, guest = false } = {}) {
    const data = { status: 'queued', recipient: 'buyer@example.test', kind: 'receipt', attempts, payload: { subject: 'Receipt\r\nHeader', text: '<script>&hello' } };
    const job = { id: 'job', get: key => data[key], getString: key => data[key] || '', getInt: key => data[key] || 0, set: (key, value) => { data[key] = value; } };
    const orderData = {};
    const order = { id: 'a'.repeat(15), getString: key => orderData[key] || '', set: (key, value) => { orderData[key] = value; } };
    if (guest) data.payload.orderId = order.id;
    let mail, saves = 0;
    const app = {
      findRecordsByFilter: (_, filter) => filter.startsWith('status = "processing"') ? [] : [job],
      findRecordById: collection => collection === 'orders' ? order : job,
      runInTransaction: fn => fn(app),
      save: () => { saves++; if (failSave && saves === 3) throw Error('Database unavailable'); },
      settings: () => ({ smtp: { enabled: true }, meta: { senderAddress: 'store@example.test', senderName: 'Store' } }),
      newMailClient: () => ({ send: message => { if (failSend) throw Error('SMTP failure'); mail = message; } }),
    };
    const sandbox = { module: { exports: {} }, $os: { getenv: key => key === 'CHIA_PUBLIC_APP_URL' ? 'https://store.example.test' : 'true' }, $security: { sha256: value => crypto.createHash('sha256').update(value).digest('hex'), randomString: () => crypto.randomBytes(32).toString('hex') }, MailerMessage: function (value) { Object.assign(this, value); }, Date };
    vm.runInNewContext(source, sandbox);
    sandbox.module.exports.run(app);
    return { data, mail, orderData };
  }
  const accepted = run();
  assert.equal(accepted.data.status, 'sent');
  assert.ok(accepted.mail.html.includes('&lt;script&gt;&amp;hello'));
  assert.ok(!accepted.mail.subject.includes('\n'));
  assert.equal(run({ failSend: true }).data.status, 'retry');
  assert.equal(run({ failSend: true, attempts: 4 }).data.status, 'failed');
  assert.equal(run({ failSave: true }).data.status, 'uncertain');
  const guest = run({ guest: true });
  assert.equal(guest.data.status, 'sent');
  assert.match(guest.mail.text, /https:\/\/store.example.test\/order-access#id=a{15}&token=[a-f0-9]{64}/);
  assert.equal(guest.orderData.emailAccessHash, crypto.createHash('sha256').update(guest.data.payload.guestToken).digest('hex'));
  assert.ok(Date.parse(guest.orderData.emailAccessExpires) > Date.now());
});

test('email order access rejects forged, expired, mismatched and account-owned tokens', async () => {
  const ts = require('typescript');
  const server = require('next/server');
  function load(relative, mocks) {
    const moduleValue = { exports: {} };
    const source = fs.readFileSync(path.join(__dirname, '..', relative), 'utf8');
    new Function('require', 'module', 'exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(name => name in mocks ? mocks[name] : require(name), moduleValue, moduleValue.exports);
    return moduleValue.exports;
  }
  const access = load('src/lib/guest-order-access.server.ts', { 'server-only': {} });
  const token = crypto.randomBytes(32).toString('hex');
  const pb = new PocketBase(process.env.SHIPPING_TEST_URL); pb.autoCancellation(false);
  await pb.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const order = await pb.collection('orders').create({ email: 'guest@example.test', isGuest: true, paymentStatus: 'paid', emailAccessHash: crypto.createHash('sha256').update(token).digest('hex'), emailAccessExpires: new Date(Date.now() + 60000).toISOString() });
  const saved = await pb.collection('orders').getOne(order.id);
  assert.equal(saved.emailAccessHash.length, 64);
  assert.equal(access.validGuestToken(token, saved, 'email'), true);
  assert.equal(access.validGuestToken(token, { ...saved, user: 'account' }, 'email'), false);
  assert.equal(access.validGuestToken(token, { ...saved, emailAccessExpires: new Date(0).toISOString() }, 'email'), false);
  const route = load('src/app/api/shop/order-access/route.ts', { 'next/server': server, '@/lib/pb-service.server': { createServicePb: async () => pb }, '@/lib/guest-order-access.server': access, '@/lib/rate-limit': { getClientIp: () => 'test', rateLimit: async () => ({ allowed: true }) } });
  const request = (id, value) => new server.NextRequest('http://localhost/api/shop/order-access', { method: 'POST', body: JSON.stringify({ id, token: value }) });
  assert.equal((await route.POST(request(order.id, '0'.repeat(64)))).status, 400);
  assert.equal((await route.POST(request('x'.repeat(15), token))).status, 400);
  const response = await route.POST(request(order.id, token));
  assert.equal(response.status, 200);
  assert.ok(response.headers.get('set-cookie').includes('HttpOnly'));
  assert.ok(response.headers.get('set-cookie').includes(`/api/shop/orders/${order.id}`));
  assert.equal((await response.json()).url, `/checkout/confirmation?id=${order.id}&recovery=1`);
  await pb.collection('orders').update(order.id, { emailAccessExpires: new Date(0).toISOString() });
  assert.equal((await route.POST(request(order.id, token))).status, 400);
});
