const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');
const { NextRequest } = require('next/server');
const base = process.env.SHIPPING_TEST_URL;
assert.match(base || '', /^http:\/\/127\.0\.0\.1:\d+$/);
let session = null;
let stripeSession = 0;
const cache = new Map();
function load(relative) {
  const file = path.resolve(relative);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file, module);
  const auth = { getSession: async () => session, requireAdmin: async () => {
    if (session?.user?.role !== 'admin') throw new Error('Forbidden'); return session;
  } };
  const mocks = { 'server-only': {}, '@/lib/auth/server': auth, '@/lib/auth': auth,
    '@/lib/oauth-keys': { CredentialStoreError: require('../src/lib/credential-store.cjs').CredentialStoreError, getOAuthKeys: () => ({ stripeSecretKey: 'sk_test_dummy' }) },
    '@/lib/rate-limit': { rateLimit: async () => ({ allowed: true }), getClientIp: () => 'test' },
  };
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const importer = name => name in mocks ? mocks[name] : name === 'pocketbase' ? PocketBase : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name);
  const localFetch = async (url, init) => {
    if (String(url) === 'https://api.stripe.com/v1/checkout/sessions') return Response.json({ id: `cs_test_access_${++stripeSession}`, url: 'https://checkout.stripe.com/test', expires_at: 1893456000 });
    assert.ok(String(url).startsWith(base + '/'), 'No external network allowed'); return fetch(url, init);
  };
  new Function('require', 'module', 'exports', 'fetch', source)(importer, module, module.exports, localFetch);
  return module.exports;
}
const denied = promise => assert.rejects(promise, e => [400, 403, 404].includes(e.status));
test('database and application access boundaries', async t => {
  const root = new PocketBase(base); root.autoCancellation(false);
  await root.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const anon = new PocketBase(base); anon.autoCancellation(false);
  const accounts = [];
  for (const [i, role] of ['customer', 'customer', 'admin', 'admin'].entries()) {
    const user = await root.collection('users').create({ email: `access-${i}@example.test`, password: 'Access-Test-132!', passwordConfirm: 'Access-Test-132!', role, isActive: true, canManageAdmins: role === 'admin' });
    const pb = new PocketBase(base); pb.autoCancellation(false);
    await pb.collection('users').authWithPassword(user.email, 'Access-Test-132!');
    accounts.push({ pb, user, token: pb.authStore.token });
  }
  const [a, b, admin, admin2] = accounts;
  const product = await root.collection('products').create({ name: 'Public product', sku: 'ACCESS-1', slug: 'access-1', price: 20, costPrice: 7, stock: 100, isActive: true, inView: true, currency: 'USD' });
  const hidden = await root.collection('products').create({ name: 'Private product', sku: 'ACCESS-2', slug: 'access-2', price: 20, stock: 100, isActive: true, inView: false, currency: 'USD' });
  const order = await root.collection('orders').create({ user: a.user.id, items: [], total: 20, status: 'paid', email: 'private@example.test' });
  await t.test('every business collection has explicit permissions; public writes only customer registration', async () => {
    const collections = await root.collections.getFullList();
    for (const c of collections.filter(c => !c.system && c.name !== '_superusers')) {
      for (const key of ['createRule', 'updateRule', 'deleteRule']) assert.notEqual(c[key], '', `${c.name}.${key}`);
    }
  });
  await t.test('registration cannot grant administrator role or verification; profile cannot promote itself', async () => {
    const input = { email: 'registration@example.test', password: 'Access-Test-132!', passwordConfirm: 'Access-Test-132!' };
    for (const extra of [{ role: 'admin' }, { verif: true }, { verified: true }]) await denied(anon.collection('users').create({ ...input, ...extra }));
    const registered = await anon.collection('users').create({ ...input, role: 'customer' });
    assert.equal(registered.role, 'customer');
    for (const extra of [{ role: 'admin' }, { 'role+': 'admin' }, { isActive: false }, { canManageAdmins: true }, { verif: true }, { verified: true }]) await denied(a.pb.collection('users').update(a.user.id, extra));
    await denied(admin.pb.collection('users').update(a.user.id, { role: 'admin' }));
    await denied(admin.pb.collection('users').create({ ...input, email: 'forged-admin@example.test', role: 'admin' }));
    assert.equal((await a.pb.collection('users').update(a.user.id, { name: 'Own profile' })).name, 'Own profile');
    await denied(a.pb.collection('users').getOne(b.user.id));
    await denied(anon.collection('users').getOne(a.user.id));
    assert.equal((await a.pb.collection('users').getFullList()).length, 1);
  });
  await t.test('deactivated tokens lose database access immediately', async () => {
    await root.collection('users').update(a.user.id, { isActive: false });
    assert.equal((await a.pb.collection('cart_items').getFullList()).length, 0);
    await denied(a.pb.collection('users').update(a.user.id, { name: 'Still active' }));
    await root.collection('users').update(a.user.id, { isActive: true });
    await a.pb.collection('users').authWithPassword(a.user.email, 'Access-Test-132!');
  });
  await t.test('catalog exposes published records and hides cost data; only admin changes price or deletes', async () => {
    assert.equal((await anon.collection('products').getOne(product.id)).costPrice, undefined);
    await denied(anon.collection('products').getList(1, 10, { filter: 'costPrice=7' }));
    assert.equal((await admin.pb.collection('products').getOne(product.id)).costPrice, 7);
    for (const pb of [anon, a.pb]) {
      await denied(pb.collection('products').getOne(hidden.id));
      await denied(pb.collection('products').update(product.id, { price: 1, stock: 999 }));
      await denied(pb.collection('products').delete(product.id));
      await denied(pb.collection('products').create({ name: 'Injected', sku: 'BAD', slug: 'bad' }));
    }
    assert.equal((await admin.pb.collection('products').update(product.id, { price: 21 })).price, 21);
  });
  await t.test('customer records cannot be read, written, deleted or reassigned across accounts', async () => {
    for (const name of ['adresses', 'cart_items', 'wishlists']) {
      const own = await a.pb.collection(name).create({ user: a.user.id, product: product.id, quantity: 1, address: 'Private street', city: 'Private city', postalCode: '90210' });
      assert.equal((await a.pb.collection(name).getOne(own.id)).user, a.user.id);
      assert.equal((await a.pb.collection(name).update(own.id, { quantity: 2, address: 'Updated street' })).id, own.id);
      await denied(a.pb.collection(name).update(own.id, { user: b.user.id }));
      await denied(a.pb.collection(name).update(own.id, { 'user+': b.user.id }));
      for (const pb of [anon, b.pb]) {
        await denied(pb.collection(name).getOne(own.id));
        await denied(pb.collection(name).update(own.id, { quantity: 10, address: 'Attack' }));
        await denied(pb.collection(name).delete(own.id));
        await denied(pb.collection(name).create({ user: a.user.id, product: product.id, quantity: 1 }));
        assert.equal((await pb.collection(name).getFullList()).length, 0);
      }
      await a.pb.collection(name).delete(own.id);
    }
  });
  await t.test('US saved address fields survive database round trips', async () => {
    const saved = await a.pb.collection('adresses').create({ user: a.user.id, address: '100 Main Street', address2: 'Suite 2', city: 'Austin', state: 'TX', country: 'US', postalCode: '78701', notes: 'Front desk' });
    const readBack = await a.pb.collection('adresses').getOne(saved.id);
    assert.deepEqual({ address: readBack.address, address2: readBack.address2, city: readBack.city, state: readBack.state, country: readBack.country, postalCode: readBack.postalCode, notes: readBack.notes }, { address: '100 Main Street', address2: 'Suite 2', city: 'Austin', state: 'TX', country: 'US', postalCode: '78701', notes: 'Front desk' });
    await a.pb.collection('adresses').delete(saved.id);
  });
  await t.test('orders cannot be fabricated or altered by customers; owner and admin can read', async () => {
    for (const pb of [anon, a.pb, b.pb]) {
      await denied(pb.collection('orders').create({ total: 1, status: 'paid', user: a.user.id }));
      await denied(pb.collection('orders').update(order.id, { total: 1, user: b.user.id }));
      await denied(pb.collection('orders').delete(order.id));
    }
    await denied(b.pb.collection('orders').getOne(order.id));
    await denied(anon.collection('orders').getOne(order.id));
    assert.equal((await a.pb.collection('orders').getOne(order.id)).id, order.id);
    assert.equal((await admin.pb.collection('orders').update(order.id, { notes: 'Authorized staff' })).notes, 'Authorized staff');
  });
  await t.test('internal collections and settings deny customer writes and data reads', async () => {
    for (const name of ['inventory', 'locations', 'transfers', 'transfer_items', 'visits', 'admin_push_subscriptions']) {
      const input = { name: 'Private fixture', product: product.id, quantity: 5, note: 'Private transfer', path: '/private-fixture', visitorId: 'private-visitor', adminUserId: admin.user.id, endpoint: `https://push.example.test/${name}`, p256dh: 'fixture-key', auth: 'fixture-auth' };
      const fixture = await root.collection(name).create(input);
      for (const pb of [anon, a.pb]) {
        try { assert.equal((await pb.collection(name).getFullList()).length, 0, name); }
        catch (e) { assert.equal(e.status, 403, name); }
        await denied(pb.collection(name).getOne(fixture.id));
        await denied(pb.collection(name).update(fixture.id, { name: 'Injected', quantity: 999 }));
        await denied(pb.collection(name).delete(fixture.id));
        await denied(pb.collection(name).create(input));
      }
      if (!['visits', 'admin_push_subscriptions'].includes(name)) {
        assert.equal((await admin.pb.collection(name).getOne(fixture.id)).id, fixture.id);
        await admin.pb.collection(name).update(fixture.id, { name: 'Staff update', quantity: 6 });
        await admin.pb.collection(name).delete(fixture.id);
      } else await root.collection(name).delete(fixture.id);
    }
    for (const pb of [anon, a.pb, admin.pb]) await denied(pb.collection('shipping_settings').update('shippingconfig1', { rateCents: 1 }));
    await admin.pb.collection('inventory').getList(1, 1);
  });
  await t.test('publication rules cover categories, posts, featured records and parent variants', async () => {
    for (const [name, flag, extra] of [
      ['categories', 'activeAll', { name: 'Fixture category', slug: 'fixture-category' }],
      ['posts', 'published', { title: 'Fixture article', slug: 'fixture-article', content: 'Fixture content' }],
    ]) {
      const record = await admin.pb.collection(name).create({ ...extra, [flag]: false });
      await denied(anon.collection(name).getOne(record.id));
      await admin.pb.collection(name).update(record.id, { [flag]: true });
      assert.equal((await anon.collection(name).getOne(record.id)).id, record.id);
      for (const pb of [anon, a.pb]) {
        await denied(pb.collection(name).create({ ...extra, slug: 'attack-' + name }));
        await denied(pb.collection(name).update(record.id, { [flag]: false }));
        await denied(pb.collection(name).delete(record.id));
      }
    }
    const variable = await admin.pb.collection('variables').create({ name: 'Fixture color', type: 'color', color: '#FFFFFF' });
    assert.equal((await anon.collection('variables').getOne(variable.id)).id, variable.id);
    await denied(a.pb.collection('variables').update(variable.id, { name: 'Attack' }));
    const feature = await admin.pb.collection('vedettes').create({ product: hidden.id });
    await denied(anon.collection('vedettes').getOne(feature.id));
    const variant = await admin.pb.collection('products').create({ price: 20, name: 'Public variant', sku: 'VARIANT', slug: 'fixture-variant', isVariant: true, parent: product.id, isActive: true, inView: false, currency: 'USD' });
    assert.equal((await anon.collection('products').getOne(variant.id)).id, variant.id);
    await admin.pb.collection('products').update(variant.id, { parent: hidden.id });
    await denied(anon.collection('products').getOne(variant.id));
  });
  const stripe = load('src/app/api/shop/stripe/checkout/route.ts');
  const cod = load('src/app/api/shop/orders/route.ts');
  const details = load('src/app/api/shop/orders/[id]/route.ts');
  const makeOrder = (productId = product.id) => new NextRequest(`${base}/api/shop/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': `access-${Date.now()}-${Math.random().toString(36).slice(2)}` }, body: JSON.stringify({
    firstName: 'Test', lastName: 'Buyer', email: 'buyer@example.test', address: 'Test street', city: 'Test city', country: 'US', state: 'CA', postalCode: '90210', shippingVersion: 'initial-us-rate',
    user: b.user.id, guestAccessHash: 'attacker', items: [{ productId, quantity: 1, name: 'Attacker name', sku: 'Attacker sku' }],
  }) });
  const read = (id, cookie = '') => details.GET(new NextRequest(`${base}/api/shop/orders/${id}`, { headers: { cookie } }), { params: Promise.resolve({ id }) });
  await t.test('guest receipts require scoped cookie, hide secrets, reject forged, cross-order and expired credentials', async () => {
    session = null;
    assert.equal((await cod.POST()).status, 410);
    for (const route of [stripe]) {
      const response = await route.POST(makeOrder()); assert.ok(response.ok, await response.clone().text());
      const id = (await response.json()).orderId;
      const cookie = response.headers.get('set-cookie').split(';')[0];
      assert.match(response.headers.get('set-cookie'), /HttpOnly/i);
      assert.match(response.headers.get('set-cookie'), /SameSite=lax/i);
      const saved = await root.collection('orders').getOne(id);
      assert.equal(saved.user, ''); assert.equal(saved.items[0].name, 'Public product');
      assert.match(saved.guestAccessHash, /^[a-f0-9]{64}$/);
      assert.ok(!cookie.includes(saved.guestAccessHash));
      assert.equal((await read(id)).status, 404);
      assert.equal((await read(id, `guest_order_${id}=${'a'.repeat(64)}`)).status, 404);
      assert.equal((await read(order.id, cookie)).status, 404);
      const receipt = await read(id, cookie); assert.equal(receipt.status, 200);
      assert.equal(receipt.headers.get('cache-control'), 'private, no-store');
      assert.equal(JSON.stringify(await receipt.json()).includes(saved.guestAccessHash), false);
      await root.collection('orders').update(id, { guestAccessExpires: '2000-01-01 00:00:00.000Z' });
      assert.equal((await read(id, cookie)).status, 404);
    }
  });
  await t.test('signed-in checkout binds verified account; other customer cannot view confirmation', async () => {
    session = a;
    const response = await stripe.POST(makeOrder()); assert.equal(response.status, 200);
    assert.equal(response.headers.get('set-cookie'), null);
    const id = (await response.json()).orderId;
    assert.equal((await root.collection('orders').getOne(id)).user, a.user.id);
    assert.equal((await read(id)).status, 200);
    session = b; assert.equal((await read(id)).status, 404);
    session = admin; assert.equal((await read(id)).status, 200);
    session = null;
    const oldGuest = await root.collection('orders').create({ items: [], total: 1 });
    assert.equal((await read(oldGuest.id)).status, 404);
  });
  await t.test('trusted checkout cannot purchase unpublished catalog records', async () => {
    session = null;
    const before = (await root.collection('orders').getList(1, 1)).totalItems;
    assert.ok(!(await stripe.POST(makeOrder(hidden.id))).ok);
    assert.equal((await root.collection('orders').getList(1, 1)).totalItems, before);
  });
  await t.test('administrator cannot forge provider-owned payment fields', async () => {
    const protectedOrder = await root.collection('orders').create({
      items: [], total: 20, currency: 'USD', paymentMode: 'stripe', paymentStatus: 'pending',
      paymentAmountCents: 2000, paymentCurrency: 'USD', fulfillmentStatus: 'on hold', status: 'on hold',
    });
    await denied(admin.pb.collection('orders').update(protectedOrder.id, { paymentStatus: 'paid' }));
    await denied(admin.pb.collection('orders').update(protectedOrder.id, { totalCents: 1, total: 0.01, items: [] }));
    await denied(admin.pb.collection('orders').update(protectedOrder.id, { status: 'delivering', fulfillmentStatus: 'delivering' }));
    await denied(admin.pb.collection('orders').delete(protectedOrder.id));
  });
  await t.test('dashboard statistics use authenticated admin and reject guest/customer calls', async () => {
    const stats = load('src/lib/services/stats.ts');
    for (const actor of [null, a]) {
      session = actor;
      for (const fn of Object.values(stats)) await assert.rejects(fn(), /Forbidden/);
    }
    session = admin;
    await root.collection('orders').create({
      items: [{ productId: product.id, name: 'Public product', quantity: 1, unitPrice: 25 }], total: 25,
      currency: 'USD', paymentMode: 'stripe', paymentStatus: 'paid', paymentAmountCents: 2500,
      paymentCurrency: 'USD', fulfillmentStatus: 'on hold', status: 'on hold',
    });
    assert.ok((await stats.fetchTodaySales()) > 0);
    assert.ok((await stats.fetchRecentPurchases()).length > 0);
    assert.ok((await stats.fetchBestSellingProducts()).length > 0);
  });
  await t.test('push subscription backend enforces administrator ownership', async () => {
    const push = load('src/lib/push/admin-order-push.ts');
    const input = { adminUserId: admin.user.id, endpoint: 'https://push.example.test/fixture', p256dh: 'test-key', auth: 'test-auth' };
    await push.saveAdminPushSubscription(input);
    await assert.rejects(push.saveAdminPushSubscription({ ...input, adminUserId: admin2.user.id }), /another administrator/);
    await push.removeAdminPushSubscription(input.endpoint, admin2.user.id);
    assert.equal((await root.collection('admin_push_subscriptions').getFullList()).length, 1);
    await push.removeAdminPushSubscription(input.endpoint, admin.user.id);
    assert.equal((await root.collection('admin_push_subscriptions').getFullList()).length, 0);
  });
  await t.test('public files require published records, including direct URLs; active content uploads rejected', async () => {
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9ZkAAAAASUVORK5CYII=', 'base64');
    const form = new FormData(); form.append('images', new Blob([png], { type: 'image/png' }), 'test.png');
    const uploaded = await admin.pb.collection('products').update(product.id, form);
    const url = `${base}/api/files/products/${product.id}/${uploaded.images[0]}`;
    const fileResponse = await fetch(url); assert.equal(fileResponse.status, 200, await fileResponse.text());
    session = null;
    const proxy = load('src/app/api/pb-files/[collection]/[recordId]/[filename]/route.ts');
    const params = { params: Promise.resolve({ collection: 'products', recordId: product.id, filename: uploaded.images[0] }) };
    assert.equal((await proxy.GET(new NextRequest(`${base}/api/pb-files/products/${product.id}/${uploaded.images[0]}`), params)).status, 200);
    await admin.pb.collection('products').update(product.id, { inView: false });
    assert.equal((await fetch(url)).status, 404);
    assert.equal((await proxy.GET(new NextRequest(`${base}/proxy?token=forged`), params)).status, 404);
    session = admin;
    assert.equal((await proxy.GET(new NextRequest(`${base}/proxy`), params)).status, 200);
    session = null;
    const svg = new FormData(); svg.append('images', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'], { type: 'image/svg+xml' }), 'attack.svg');
    await denied(admin.pb.collection('products').update(product.id, svg));
  });
});
