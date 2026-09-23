const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const { once } = require('node:events');
const PocketBase = require('pocketbase/cjs');
const credentials = require('../src/lib/credential-store.cjs');

test('offline backup restores settings, catalog files, permissions and encrypted credentials', { timeout: 60000 }, async () => {
  const root = path.resolve(__dirname, '..');
  const binary = process.env.PB_TEST_BINARY || path.join(root, '.local-tools/pocketbase', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chia-restore-'));
  const original = path.join(directory, 'original');
  const restored = path.join(directory, 'restored');
  const password = crypto.randomBytes(24).toString('hex');
  const key = crypto.randomBytes(32);
  const flags = data => [`--dir=${data}`, `--migrationsDir=${path.join(root, 'backend/pb_migrations')}`, `--hooksDir=${path.join(root, 'backend/pb_hooks')}`];
  let server;
  async function stop() {
    if (!server || server.exitCode !== null) return;
    const exited = once(server, 'exit');
    server.kill();
    await exited;
    server = undefined;
  }
  async function start(data) {
    const socket = net.createServer();
    socket.listen(0, '127.0.0.1');
    await once(socket, 'listening');
    const port = socket.address().port;
    await new Promise(resolve => socket.close(resolve));
    server = spawn(binary, ['serve', '--automigrate=false', `--http=127.0.0.1:${port}`, ...flags(data)], {
      stdio: 'ignore', windowsHide: true, env: { ...process.env, CHIA_MAIL_ENABLED: 'false', CHIA_PUBLIC_APP_URL: '' },
    });
    server.on('error', () => {});
    const pb = new PocketBase(`http://127.0.0.1:${port}`);
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        await pb.health.check();
        await pb.collection('_superusers').authWithPassword('restore@example.test', password);
        return pb;
      } catch { await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    throw new Error('Isolated restore backend did not start');
  }
  try {
    for (const args of [['migrate', 'up'], ['superuser', 'upsert', 'restore@example.test', password]]) {
      const result = spawnSync(binary, [...args, ...flags(original)], { encoding: 'utf8', windowsHide: true });
      assert.equal(result.status, 0, 'Disposable backend initialization must succeed');
    }
    const pb = await start(original);
    await pb.collection('store_settings').update('storeconfig0001', { businessName: 'Restore fixture', analyticsEnabled: false });
    const form = new FormData();
    for (const [name, value] of Object.entries({ sku: 'RESTORE', slug: 'restore', name: 'Restore product', price: 15, stock: 7, isActive: true, inView: true, currency: 'USD' })) form.set(name, String(value));
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=', 'base64');
    form.set('images', new Blob([png], { type: 'image/png' }), 'restore.png');
    const product = await pb.collection('products').create(form);
    const storeFile = path.join(directory, 'credentials.json');
    credentials.createStore(storeFile, { stripeSecretKey: 'synthetic-restore-fixture' }, key);
    await stop();
    // Complete offline copy only after the database process has exited.
    fs.cpSync(original, restored, { recursive: true });
    const restoredStore = path.join(directory, 'restored-credentials.json');
    fs.copyFileSync(storeFile, restoredStore);
    const recovered = await start(restored);
    assert.equal((await recovered.collection('store_settings').getOne('storeconfig0001')).businessName, 'Restore fixture');
    const saved = await recovered.collection('products').getOne(product.id);
    assert.equal(saved.stock, 7);
    assert.equal(saved.price, 15);
    const response = await fetch(recovered.files.getURL(saved, saved.images[0]));
    assert.equal(response.status, 200);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
    const guest = new PocketBase(recovered.baseURL);
    await assert.rejects(guest.collection('products').update(product.id, { stock: 999 }));
    assert.equal(credentials.decryptKeys(fs.readFileSync(restoredStore, 'utf8'), key).stripeSecretKey, 'synthetic-restore-fixture');
    assert.throws(() => credentials.decryptKeys(fs.readFileSync(restoredStore, 'utf8'), crypto.randomBytes(32)));
  } finally {
    await stop();
    if (path.dirname(directory) === path.resolve(os.tmpdir()) && path.basename(directory).startsWith('chia-restore-')) fs.rmSync(directory, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  }
});
