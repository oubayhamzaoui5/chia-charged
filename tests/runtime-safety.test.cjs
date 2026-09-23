const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

function limiter(mode, evaluate) {
  const output = { exports: {} };
  class Redis {
    on() {}
    eval(...args) { return evaluate(...args); }
  }
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../src/lib/rate-limit.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports: output.exports, require: name => name === 'ioredis' ? Redis : require(name), process: { env: { NODE_ENV: mode } }, console: { error() {} }, Date, Map });
  return output.exports;
}

test('rate limits use one atomic counter/expiry operation and enforce threshold', async () => {
  let count = 0;
  const module = limiter('production', async (script, keys, key, window) => {
    assert.equal(keys, 1); assert.equal(key, 'rl:buyer'); assert.equal(window, 60000);
    assert.ok(script.includes('INCR') && script.includes('PEXPIRE') && script.includes('PTTL'));
    return [++count, 60000];
  });
  const results = await Promise.all(Array.from({ length: 8 }, () => module.rateLimit('buyer', 3, 60000)));
  assert.equal(results.filter(result => result.allowed).length, 3);
  assert.equal(results.at(-1).remaining, 0);
});

test('Redis outages deny production requests and keep preview limits effective', async () => {
  const unavailable = () => Promise.reject(Error('Redis unavailable'));
  const production = limiter('production', unavailable);
  assert.equal((await production.rateLimit('login', 2, 60000)).allowed, false);
  const preview = limiter('development', unavailable);
  assert.equal((await preview.rateLimit('login', 2, 60000)).allowed, true);
  assert.equal((await preview.rateLimit('login', 2, 60000)).allowed, true);
  assert.equal((await preview.rateLimit('login', 2, 60000)).allowed, false);
  assert.equal((await preview.rateLimit('different', 2, 60000)).allowed, true);
  await assert.rejects(preview.rateLimit('bad', 0, 60000));
});

test('visit retention uses the supplied backend handle and bounds deletion', () => {
  let callback, sql, executed = false;
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../backend/pb_hooks/cleanup_visits.pb.js'), 'utf8'), {
    cronAdd: (id, schedule, fn) => { assert.equal(schedule, '0 3 * * *'); callback = fn; },
    $app: { db: () => ({ newQuery: value => { sql = value; return { execute: () => { executed = true; } }; } }) },
    console: { error: error => { throw error; } },
  });
  callback();
  assert.equal(executed, true);
  assert.match(sql, /-90 days/);
  assert.match(sql, /LIMIT 10000/);
});
