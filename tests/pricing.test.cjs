const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const PocketBase = require('pocketbase/cjs');

const base = process.env.SHIPPING_TEST_URL;
const cache = new Map();
let stripeSession = 0;
let stripeRequest;
let currentSession = null;
function load(relative) {
  const filename = path.resolve(relative);
  if (cache.has(filename)) return cache.get(filename).exports;
  const module = { exports: {} }; cache.set(filename, module);
  const mocks = {
    'server-only': {},
    'next/server': require('next/server'),
    'next/headers': { cookies: async () => { throw new Error('Unexpected cookie access'); } },
    '@/lib/auth/server': { getSession: async () => currentSession },
    '@/lib/oauth-keys': { CredentialStoreError: require('../src/lib/credential-store.cjs').CredentialStoreError, getOAuthKeys: () => ({ stripeSecretKey: 'sk_test_pricing' }) },
  };
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true,
  } }).outputText;
  const importer = name => name in mocks ? mocks[name] : name === 'pocketbase' ? PocketBase : name.startsWith('@/') ? load(`src/${name.slice(2)}.ts`) : require(name);
  const providerFetch = async (url, init) => {
    assert.equal(url, 'https://api.stripe.com/v1/checkout/sessions'); stripeRequest = new URLSearchParams(init.body);
    return Response.json({ id: `cs_test_pricing_${++stripeSession}`, url: 'https://checkout.stripe.com/pricing', expires_at: 1893456000 });
  };
  new Function('require', 'module', 'exports', 'fetch', source)(importer, module, module.exports, providerFetch);
  return module.exports;
}
function request(productId, quantity = 2, changes = {}) {
  const body = { firstName: 'Price', lastName: 'Tester', email: 'price@example.test', phone: '+1 555 0100',
    address: '100 Test Street', address2: 'Suite 2', city: 'Los Angeles', country: 'US', state: 'CA', postalCode: '90210',
    shippingVersion: 'initial-us-rate', items: [{ productId, quantity, name: 'Forged name', unitPrice: 0.01 }],
    currency: 'EUR', subtotal: 0.01, total: 0.01, tax: -100, ...changes };
  return new Request(`${base}/checkout`, { method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': `pricing-${Date.now()}-${Math.random().toString(36).slice(2)}` }, body: JSON.stringify(body) });
}

test('server-owned USD quote and immutable order snapshot', async t => {
  const root = new PocketBase(base); root.autoCancellation(false);
  await root.collection('_superusers').authWithPassword(process.env.PB_ADMIN_EMAIL, process.env.PB_ADMIN_PASSWORD);
  const checkout = load('src/app/api/shop/stripe/checkout/route.ts');
  const productById = load('src/app/api/shop/products/id/[id]/route.ts');
  const shopUsers = load('src/lib/services/shop-user.service.ts');
  const category = await root.collection('categories').create({ name: 'Pricing category', slug: 'pricing-category', promo: 25, activeAll: true });
  const product = await root.collection('products').create({ name: 'Catalog name', sku: 'PRICE-1', slug: 'price-1', price: 10, promoPrice: 8,
    currency: 'USD', stock: 5, isActive: true, inView: true, category: category.id });
  const user = await root.collection('users').create({ email: 'pricing-cart@example.test', password: 'Pricing-Test-123!', passwordConfirm: 'Pricing-Test-123!', role: 'customer', isActive: true });
  const customer = new PocketBase(base); const auth = await customer.collection('users').authWithPassword(user.email, 'Pricing-Test-123!');
  await customer.collection('cart_items').create({ user: user.id, product: product.id, quantity: 1 });

  await t.test('category promotion, shipping, tax and Stripe total reconcile in integer cents', async () => {
    const displayed = await productById.GET({}, { params: Promise.resolve({ id: product.id }) });
    assert.equal((await displayed.json()).product.promoPrice, 7.5);
    assert.equal((await shopUsers.getCartItems({ userId: user.id, token: auth.token }))[0].product.promoPrice, 7.5);
    const response = await checkout.POST(request(product.id)); assert.equal(response.status, 200, await response.clone().text());
    const saved = await root.collection('orders').getOne((await response.json()).orderId);
    assert.equal(saved.subtotalCents, 2000); assert.equal(saved.discountCents, 500); assert.equal(saved.itemsTotalCents, 1500);
    assert.equal(saved.shippingCents, 500); assert.equal(saved.taxCents, 0); assert.equal(saved.totalCents, 2000);
    assert.equal(saved.total, 20); assert.equal(saved.currency, 'USD'); assert.equal(saved.pricingVersion, 'usd-v1');
    assert.equal(saved.items[0].name, 'Catalog name'); assert.equal(saved.items[0].sku, 'PRICE-1');
    assert.equal(saved.items[0].baseUnitPriceCents, 1000); assert.equal(saved.items[0].unitPriceCents, 750);
    assert.deepEqual(saved.items[0].discount, { type: 'category', amountCents: 250, categoryId: category.id, percent: 25 });
    assert.equal(saved.addressSnapshot.address2, 'Suite 2'); assert.equal(saved.addressSnapshot.email, 'price@example.test');
    assert.equal(saved.taxProvider, 'stripe_tax'); assert.equal(saved.taxStatus, 'pending');
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '750');
    assert.equal(stripeRequest.get('line_items[0][quantity]'), '2');
    assert.equal(stripeRequest.get('line_items[0][price_data][product_data][tax_code]'), 'txcd_40060003');
    assert.equal(stripeRequest.get('shipping_options[0][shipping_rate_data][fixed_amount][amount]'), '500');
    assert.equal(stripeRequest.get('shipping_options[0][shipping_rate_data][tax_code]'), 'txcd_92010001');
    assert.equal(stripeRequest.get('automatic_tax[enabled]'), 'true');
  });

  await t.test('invalid quantities, duplicates, stock excess and oversized carts create no orders', async () => {
    const before = (await root.collection('orders').getList(1, 1)).totalItems;
    for (const items of [
      [{ productId: product.id, quantity: 0 }], [{ productId: product.id, quantity: 1.5 }],
      [{ productId: product.id, quantity: '2' }], [{ productId: product.id, quantity: 100 }],
      [{ productId: product.id, quantity: 1 }, { productId: product.id, quantity: 1 }],
      [{ productId: product.id, quantity: 6 }],
      Array.from({ length: 51 }, (_, index) => ({ productId: String(index).padStart(15, 'a'), quantity: 1 })),
    ]) assert.ok(!(await checkout.POST(request(product.id, 1, { items }))).ok);
    assert.equal((await root.collection('orders').getList(1, 1)).totalItems, before);
  });

  await t.test('first-order discount reaches Stripe, cannot stack, and respects activation and paid history', async () => {
    const settings = root.collection('store_settings');
    const seeded = await settings.getOne('storeconfig0001');
    assert.equal(seeded.socialProof.testimonials.length, 3);
    assert.equal(seeded.socialProof.averageRating, 4.8);
    const { socialProofSchema } = load('src/lib/social-proof.ts');
    assert.equal(socialProofSchema.safeParse(seeded.socialProof).success, true);
    assert.equal(socialProofSchema.safeParse({ ...seeded.socialProof, averageRating: 6 }).success, false);
    assert.equal(socialProofSchema.safeParse({ ...seeded.socialProof, testimonials: [{ ...seeded.socialProof.testimonials[0], avatar: 'javascript:alert(1)' }] }).success, false);
    const changedProof = { ...seeded.socialProof, enabled: false, averageRating: 4.2 };
    await settings.update('storeconfig0001', { socialProof: changedProof });
    assert.deepEqual((await settings.getOne('storeconfig0001')).socialProof, changedProof);
    await assert.rejects(customer.collection('store_settings').update('storeconfig0001', { socialProof: seeded.socialProof }));
    const instructions = await settings.update('storeconfig0001', { storageInstructions: 'Follow package storage instructions.', preparationInstructions: 'Follow package preparation instructions.' });
    assert.equal(instructions.storageInstructions, 'Follow package storage instructions.');
    assert.equal(instructions.preparationInstructions, 'Follow package preparation instructions.');
    await assert.rejects(settings.update('storeconfig0001', { storageInstructions: 'x'.repeat(2001) }));
    const first = await root.collection('users').create({ email: 'first@example.test', password: 'First-Test-123!', passwordConfirm: 'First-Test-123!', role: 'customer', verified: true, isActive: true });
    currentSession = { user: first };
    const item = await root.collection('products').create({ name: 'First discount', sku: 'FIRST-1', slug: 'first-discount', price: 10.01, currency: 'USD', stock: 50, isActive: true, inView: true });
    await settings.update('storeconfig0001', { firstOrderDiscountEnabled: true, firstOrderDiscountPercent: 15 });
    await assert.rejects(customer.collection('store_settings').update('storeconfig0001', { firstOrderDiscountPercent: 99 }));
    await assert.rejects(settings.update('storeconfig0001', { firstOrderDiscountPercent: 100 }));
    currentSession = null;
    let guestResponse = await checkout.POST(request(item.id, 1));
    assert.equal(guestResponse.status, 200);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '1001');
    currentSession = { user: first };
    let response = await checkout.POST(request(item.id, 2, { email: first.email }));
    assert.equal(response.status, 200, await response.clone().text());
    const id = (await response.json()).orderId;
    const order = await root.collection('orders').getOne(id);
    assert.equal(order.firstOrderDiscountPercent, 15);
    assert.equal(order.itemsTotalCents, 1702);
    assert.equal(order.discountCents, 300);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '851');
    response = await checkout.POST(request(item.id, 1, { email: first.email }));
    assert.equal(response.status, 409);
    await root.send('/api/chia-checkout/release', { method: 'POST', body: { orderId: id, reason: 'test' } });
    const simultaneous = await Promise.all([1, 2].map(() => checkout.POST(request(item.id, 1, { email: first.email }))));
    assert.deepEqual(simultaneous.map(result => result.status).sort(), [200, 409]);
    const winner = simultaneous.find(result => result.status === 200);
    await root.send('/api/chia-checkout/release', { method: 'POST', body: { orderId: (await winner.json()).orderId, reason: 'test' } });
    await settings.update('storeconfig0001', { firstOrderDiscountEnabled: false });
    response = await checkout.POST(request(item.id, 1, { email: first.email }));
    assert.equal(response.status, 200);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '1001');
    await settings.update('storeconfig0001', { firstOrderDiscountEnabled: true });
    await root.collection('products').update(item.id, { promoPrice: 9 });
    response = await checkout.POST(request(item.id, 1, { email: first.email }));
    assert.equal(response.status, 200);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '900');
    await root.collection('products').update(item.id, { promoPrice: 0 });
    await root.collection('orders').update(id, { paymentStatus: 'paid' });
    response = await checkout.POST(request(item.id, 1, { email: first.email }));
    assert.equal(response.status, 200);
    assert.equal(stripeRequest.get('line_items[0][price_data][unit_amount]'), '1001');
    currentSession = null;
    await settings.update('storeconfig0001', { firstOrderDiscountEnabled: false });
  });

  await t.test('catalog rejects non-USD products instead of relabeling them', async () => {
    await assert.rejects(root.collection('products').create({ name: 'Euro product', sku: 'EUR-1', slug: 'eur-1', price: 10,
      currency: 'EUR', stock: 5, isActive: true, inView: true }), error => error.status === 400);
  });
});
