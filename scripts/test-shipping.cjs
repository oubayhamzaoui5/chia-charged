// Disposable integration environment. Never reads .env.local or existing PocketBase data.
const { spawn, spawnSync } = require('node:child_process');
const { mkdtempSync, rmSync, cpSync, copyFileSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');

(async () => {
  const app = path.resolve(__dirname, '..');
  const binary = process.env.PB_TEST_BINARY || path.resolve(app, '.local-tools/pocketbase', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
  const migrations = path.resolve(app, 'backend/pb_migrations');
  const data = mkdtempSync(path.join(tmpdir(), 'chia-shipping-'));
  const hooks = path.join(data, 'test-hooks');
  cpSync(path.resolve(app, 'backend/pb_hooks'), hooks, { recursive: true });
  if (process.argv.includes('tests/credentials.test.cjs')) copyFileSync(path.join(app, 'tests/fixtures/provider-check.pb.js'), path.join(hooks, 'provider-check.pb.js'));
  const flags = [`--dir=${data}`, `--migrationsDir=${migrations}`, `--hooksDir=${hooks}`];
  let server;
  try {
    for (const args of [['migrate', 'up'], ['superuser', 'upsert', 'shipping-test@example.test', 'Shipping-Test-Only-132!']]) {
      const result = spawnSync(binary, [...args, ...flags], { encoding: 'utf8', windowsHide: true });
      if (result.status !== 0) throw new Error(result.stderr || result.stdout || String(result.error));
    }
    const port = await new Promise((resolve, reject) => {
      const socket = net.createServer(); socket.on('error', reject);
      socket.listen(0, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)); });
    });
    const url = `http://127.0.0.1:${port}`;
    server = spawn(binary, ['serve', '--automigrate=false', `--http=127.0.0.1:${port}`, ...flags], { stdio: 'ignore', windowsHide: true });
    server.on('error', () => {});
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      try { if ((await fetch(`${url}/api/health`)).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Disposable PocketBase failed to start');
    const child = spawn(process.execPath, ['--test', ...(process.argv.slice(2).length ? process.argv.slice(2) : ['tests/shipping.test.cjs'])], {
      cwd: app, stdio: 'inherit', windowsHide: true,
      env: { ...process.env, POCKETBASE_URL: url, NEXT_PUBLIC_PB_URL: url, SHIPPING_TEST_URL: url,
        OAUTH_ENCRYPTION_KEY: crypto.randomBytes(32).toString('hex'), CREDENTIALS_FILE: path.join(data, 'credentials.json'),
        PB_ADMIN_EMAIL: 'shipping-test@example.test', PB_ADMIN_PASSWORD: 'Shipping-Test-Only-132!', APP_URL: url },
    });
    process.exitCode = await new Promise(resolve => { child.on('exit', code => resolve(code ?? 1)); child.on('error', () => resolve(1)); });
  } finally {
    if (server && server.exitCode === null) {
      server.kill();
      await new Promise(resolve => server.once('exit', resolve));
    }
    // Verify the exact generated directory before recursive cleanup.
    if (path.dirname(data) === path.resolve(tmpdir()) && path.basename(data).startsWith('chia-shipping-')) {
      rmSync(data, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
