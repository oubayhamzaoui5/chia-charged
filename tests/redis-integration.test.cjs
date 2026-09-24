const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const crypto = require('node:crypto');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const vm = require('node:vm');
const ts = require('typescript');
const Redis = require('ioredis');

test('real Redis enforces concurrent limits, repairs expiry, fails closed and recovers', { timeout: 30000 }, async () => {
  assert.ok(process.env.REDIS_TEST_BINARY, 'Set REDIS_TEST_BINARY to an installed redis-server executable.');
  const listener = net.createServer();
  listener.listen(0, '127.0.0.1'); await once(listener, 'listening');
  const port = listener.address().port;
  await new Promise(resolve => listener.close(resolve));
  const password = crypto.randomBytes(24).toString('hex');
  const url = `redis://:${password}@127.0.0.1:${port}`;
  const clients = [];
  let server;
  async function start() {
    server = spawn(process.env.REDIS_TEST_BINARY, ['--bind', '127.0.0.1', '--port', String(port), '--save', '', '--appendonly', 'no', '--protected-mode', 'yes', '--requirepass', password], { stdio: 'ignore', windowsHide: true });
    server.on('error', () => {});
    const probe = new Redis(url, { lazyConnect: true, retryStrategy: () => null, connectTimeout: 1000 });
    probe.on('error', () => {});
    for (let attempt = 0; attempt < 50; attempt++) {
      try { await probe.connect(); await probe.ping(); probe.disconnect(); return; }
      catch { probe.disconnect(); await new Promise(resolve => setTimeout(resolve, 100)); }
    }
    throw new Error('Disposable Redis did not start');
  }
  async function stop() {
    if (server && server.exitCode === null) { const exited = once(server, 'exit'); server.kill(); await exited; }
    server = undefined;
  }
  try {
    await start();
    const module = { exports: {} };
    const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/rate-limit.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true } }).outputText;
    function RedisClient(...args) { const client = new Redis(...args); clients.push(client); return client; }
    vm.runInNewContext(source, { exports: module.exports, require: name => name === 'ioredis' ? RedisClient : require(name), process: { env: { NODE_ENV: 'production', REDIS_URL: url } }, console: { error() {} }, Date, Map });
    const limiter = module.exports.rateLimit;
    const results = await Promise.all(Array.from({ length: 20 }, () => limiter('concurrent', 5, 10000)));
    assert.equal(results.filter(result => result.allowed).length, 5);
    await clients[0].set('rl:missing-expiry', '1');
    assert.equal((await limiter('missing-expiry', 5, 10000)).allowed, true);
    assert.ok(await clients[0].pttl('rl:missing-expiry') > 0);
    assert.equal((await limiter('expires', 1, 100)).allowed, true);
    assert.equal((await limiter('expires', 1, 100)).allowed, false);
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.equal((await limiter('expires', 1, 100)).allowed, true);
    await stop();
    const started = Date.now();
    assert.equal((await limiter('outage', 5, 10000)).allowed, false);
    assert.ok(Date.now() - started < 5000, 'Outage requests must have bounded latency');
    await start();
    let recovered = false;
    for (let attempt = 0; attempt < 20; attempt++) {
      if ((await limiter('recovery', 100, 10000)).allowed) { recovered = true; break; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    assert.equal(recovered, true);
  } finally {
    for (const client of clients) client.disconnect();
    await stop();
  }
});
