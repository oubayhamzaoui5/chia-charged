// Local-only demo environment. Never migrates existing backend data or reads its secrets.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const net = require('node:net');
const { spawn, spawnSync } = require('node:child_process');
const PocketBase = require('pocketbase/cjs');
const store = require('../src/lib/credential-store.cjs');
const root = path.resolve(__dirname, '..');
const home = path.join(root, '.local-preview');
fs.mkdirSync(home, { recursive: true });
const stateFile = path.join(home, 'status.json');
async function freePort(preferred) {
  return new Promise((resolve, reject) => {
    const socket = net.createServer();
    socket.once('error', () => {
      const fallback = net.createServer(); fallback.once('error', reject);
      fallback.listen(0, '127.0.0.1', () => { const port = fallback.address().port; fallback.close(() => resolve(port)); });
    });
    socket.listen(preferred, '127.0.0.1', () => { const port = socket.address().port; socket.close(() => resolve(port)); });
  });
}
async function main() {
  if (fs.existsSync(stateFile)) {
    const prior = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    try { if ((await fetch(`${prior.backend}/api/health`, { signal: AbortSignal.timeout(1500) })).ok) { console.log(`Preview already started: ${prior.url}`); return; } } catch {}
  }
  const dir = fs.mkdtempSync(path.join(home, 'run-'));
  const port = await freePort(3100); const pbPort = await freePort(8190);
  const url = `http://127.0.0.1:${port}`; const backend = `http://127.0.0.1:${pbPort}`;
  const key = crypto.randomBytes(32).toString('hex'); const password = crypto.randomBytes(24).toString('hex');
  const credentials = path.join(dir, 'credentials.json'); store.createStore(credentials, {}, Buffer.from(key, 'hex'));
  const binary = path.resolve(root, '.local-tools/pocketbase', process.platform === 'win32' ? 'pocketbase.exe' : 'pocketbase');
  const hooks = path.join(dir, 'hooks'); fs.cpSync(path.resolve(root, 'backend/pb_hooks'), hooks, { recursive: true });
  const flags = [`--dir=${path.join(dir, 'data')}`, `--migrationsDir=${path.resolve(root, 'backend/pb_migrations')}`, `--hooksDir=${hooks}`];
  for (const args of [['migrate', 'up'], ['superuser', 'upsert', 'service@preview.example.test', password]]) {
    const result = spawnSync(binary, [...args, ...flags], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error('Preview backend initialization failed.');
  }
  const pbLog = fs.openSync(path.join(dir, 'backend.log'), 'a');
  const pbProcess = spawn(binary, ['serve', '--automigrate=false', `--http=127.0.0.1:${pbPort}`, ...flags], { stdio: ['ignore', pbLog, pbLog], windowsHide: true });
  let web;
  const stop = () => { web?.kill(); pbProcess.kill(); };
  process.on('SIGINT', stop); process.on('SIGTERM', stop);
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try { if ((await fetch(`${backend}/api/health`)).ok) { ready = true; break; } } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!ready) throw new Error('Preview backend did not start.');
    const pb = new PocketBase(backend); pb.autoCancellation(false);
    await pb.collection('_superusers').authWithPassword('service@preview.example.test', password);
    const demoPassword = 'Preview-Only-123!';
    for (const role of ['admin', 'customer']) await pb.collection('users').create({ email: `${role}@preview.example.test`, password: demoPassword, passwordConfirm: demoPassword, role, name: 'Preview', surname: role, verified: true, isActive: true, canManageAdmins: role === 'admin' });
    const category = await pb.collection('categories').create({ name: 'Protein Pudding', slug: 'protein-pudding', activeAll: true });
    const nutritionFacts = { servingsPerContainer: '8 servings per container', servingSize: '1/4 cup (57g)', calories: '280', rows: [
      { label: 'Total Fat 14g', dailyValue: '18%', indent: 0, bold: true, dividerBefore: false }, { label: 'Saturated Fat 5g', dailyValue: '25%', indent: 1, bold: false, dividerBefore: false },
      { label: 'Trans Fat 0g', dailyValue: '', indent: 1, bold: false, dividerBefore: false }, { label: 'Cholesterol 60mg', dailyValue: '20%', indent: 0, bold: true, dividerBefore: false },
      { label: 'Sodium 55mg', dailyValue: '2%', indent: 0, bold: true, dividerBefore: false }, { label: 'Total Carbohydrate 16g', dailyValue: '6%', indent: 0, bold: true, dividerBefore: false },
      { label: 'Dietary Fiber 12g', dailyValue: '43%', indent: 1, bold: false, dividerBefore: false }, { label: 'Total Sugars 2g', dailyValue: '', indent: 1, bold: false, dividerBefore: false },
      { label: 'Includes 2g Added Sugars', dailyValue: '4%', indent: 2, bold: false, dividerBefore: false }, { label: 'Protein 22g', dailyValue: '', indent: 0, bold: true, dividerBefore: false },
      { label: 'Vitamin D 0mcg', dailyValue: '0%', indent: 0, bold: false, dividerBefore: true }, { label: 'Calcium 250mg', dailyValue: '20%', indent: 0, bold: false, dividerBefore: false },
      { label: 'Iron 2.3mg', dailyValue: '15%', indent: 0, bold: false, dividerBefore: false }, { label: 'Potassium 330mg', dailyValue: '8%', indent: 0, bold: false, dividerBefore: false },
    ], footnote: '*The % Daily Value tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.' };
    const allergenStatement = 'Contains milk. Produced in a facility with tree nuts, peanuts, soybeans, milk, eggs, wheat and sesame.';
    for (const [name, slug, sku, filename] of [
      ['Strawberries & Cream', 'strawberries-n-cream-cc-str-4', 'CC-STR-4', 'strawberry.webp'],
      ['Chocolate Chip', 'chocolate-chip-cc-chklt-4', 'CC-CHKLT-4', 'chocolate.webp'],
    ]) {
      const form = new FormData();
      const ingredients = name.includes('Chocolate')
        ? 'Chia Seed, Whey Protein Concentrate, Chocolate Chips (Chocolate, Cane Sugar, Cocoa Butter, Sunflower Lecithin), Medium Chain Coconut Oil Triglycerides, Natural Flavor, Cocoa Powder (Alkaline Process), Stevia Leaf Glycosides, Monk Fruit Extract.'
        : 'Chia Seed, Whey Protein Concentrate, Medium Chain Coconut Oil Triglycerides, Freeze Dried Strawberry Slices, Vanilla Flavor With Other Natural Flavors, Stevia Leaf Glycosides, Monk Fruit Extract.';
      for (const [key, value] of Object.entries({ name, slug, sku, price: 24, currency: 'USD', stock: 100, isActive: true, inView: true, category: category.id, description: 'Local preview sample product. Demo price and stock only.', ingredients, allergenStatement, nutritionFacts: JSON.stringify(nutritionFacts) })) form.append(key, String(value));
      form.append('images', new Blob([fs.readFileSync(path.join(root, 'public', filename))], { type: 'image/webp' }), filename);
      await pb.collection('products').create(form);
    }
    const env = { ...process.env };
    // Mask file-defined environment entries before Next loads them, then set isolated values.
    for (const filename of ['.env', '.env.local', '.env.development', '.env.development.local']) {
      const file = path.join(root, filename);
      if (fs.existsSync(file)) for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/); if (match) env[match[1]] = '';
      }
    }
    Object.assign(env, { NODE_ENV: 'development', APP_URL: url, NEXT_PUBLIC_SITE_URL: url, NEXT_PUBLIC_PB_URL: backend, POCKETBASE_URL: backend,
      PB_ADMIN_EMAIL: 'service@preview.example.test', PB_ADMIN_PASSWORD: password, OAUTH_ENCRYPTION_KEY: key, CREDENTIALS_FILE: credentials,
      TRUST_PROXY_HEADERS: 'false', WEB_PUSH_SUBJECT: '', WEB_PUSH_PUBLIC_KEY: '', WEB_PUSH_PRIVATE_KEY: '', STRIPE_WEBHOOK_SECRET: '',
      REDIS_HOST: '127.0.0.1', REDIS_PORT: '1', PB_ADMIN_TOKEN: '', NEXT_TELEMETRY_DISABLED: '1' });
    const webLog = fs.openSync(path.join(dir, 'website.log'), 'a');
    web = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--webpack', '--hostname', '127.0.0.1', '--port', String(port)], { cwd: root, env, windowsHide: true, stdio: ['ignore', webLog, webLog] });
    fs.writeFileSync(stateFile, JSON.stringify({ url, backend, directory: dir, launcherPid: process.pid, webPid: web.pid, backendPid: pbProcess.pid, admin: 'admin@preview.example.test', customer: 'customer@preview.example.test', password: demoPassword }, null, 2));
    console.log(`Local preview: ${url}`);
    web.on('exit', () => { pbProcess.kill(); });
    pbProcess.on('exit', () => { web?.kill(); });
  } catch (error) { stop(); throw error; }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
