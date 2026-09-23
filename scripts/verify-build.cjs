// Compiles using synthetic configuration, never production credentials or services.
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const store = require('../src/lib/credential-store.cjs');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'chia-build-check-'));
const file = path.join(dir, 'credentials.json');
const key = crypto.randomBytes(32).toString('hex');
const root = path.resolve(__dirname, '..');
const env = { ...process.env };
for (const filename of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const candidate = path.join(root, filename);
  if (fs.existsSync(candidate)) for (const line of fs.readFileSync(candidate, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match) env[match[1]] = '';
  }
}
try {
  store.createStore(file, {}, Buffer.from(key, 'hex'));
  const result = spawnSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], {
    cwd: root, stdio: 'inherit', windowsHide: true,
    env: { ...env, NODE_ENV: 'production', APP_URL: 'https://shop.example.test', NEXT_PUBLIC_SITE_URL: 'https://shop.example.test',
      NEXT_PUBLIC_PB_URL: 'https://db.example.test', POCKETBASE_URL: 'http://127.0.0.1:1',
      PB_ADMIN_EMAIL: 'build@example.test', PB_ADMIN_PASSWORD: 'Synthetic-Build-Only',
      CREDENTIALS_FILE: file, OAUTH_ENCRYPTION_KEY: key, TRUST_PROXY_HEADERS: 'false', NEXT_TELEMETRY_DISABLED: '1' },
  });
  process.exitCode = result.status ?? 1;
} finally {
  if (path.dirname(dir) === path.resolve(os.tmpdir()) && path.basename(dir).startsWith('chia-build-check-')) fs.rmSync(dir, { recursive: true, force: true });
}
