// Keep existing debt visible and reject new or increased diagnostics.
const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
function normalizeKey(key) {
  const normalized = [...key];
  const file = key[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // React diagnostics embed absolute source paths. Compare the same finding
  // consistently across Windows development, Linux CI and hoster checkouts.
  normalized[3] = key[3].replaceAll('\\', '/').replace(new RegExp(`^.*?/${file}:(\\d+):(\\d+)$`, 'gm'), `${key[0]}:$1:$2`);
  return normalized;
}
function addDiagnostic(counts, key, count = 1) {
  key = normalizeKey(key);
  const hash = crypto.createHash('sha256').update(JSON.stringify(key)).digest('hex');
  counts[hash] = { key, count: (counts[hash]?.count || 0) + count };
}
function diagnostics(results) {
  const counts = {};
  for (const result of results) {
    const source = fs.readFileSync(result.filePath, 'utf8').split(/\r?\n/);
    for (const message of result.messages) {
      if (message.fatal) throw new Error(`${result.filePath}: ${message.message}`);
      addDiagnostic(counts, [path.relative(root, result.filePath).replaceAll('\\', '/'), message.ruleId,
        message.severity, message.message, (source[message.line - 1] || '').trim()]);
    }
  }
  return counts;
}
async function main() {
  const baseline = {};
  for (const item of Object.values(JSON.parse(fs.readFileSync(path.join(root, 'docs/lint-baseline.json'), 'utf8')))) {
    addDiagnostic(baseline, item.key, item.count);
  }
  const results = await new ESLint({ cwd: root }).lintFiles(['.']);
  const current = diagnostics(results);
  let added = 0;
  for (const [hash, item] of Object.entries(current)) {
    const increase = item.count - (baseline[hash]?.count || 0);
    if (increase > 0) { added += increase; console.error(item.key.join(' | ')); }
  }
  const total = Object.values(current).reduce((sum, item) => sum + item.count, 0);
  console.log(`Existing lint diagnostics: ${total}; new diagnostics: ${added}. Full output: npm run lint:full`);
  process.exitCode = added ? 1 : 0;
}
module.exports = { diagnostics, normalizeKey };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
