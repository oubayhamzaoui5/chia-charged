// Keep existing debt visible and reject new or increased diagnostics.
const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
function diagnostics(results) {
  const counts = {};
  for (const result of results) {
    const source = fs.readFileSync(result.filePath, 'utf8').split(/\r?\n/);
    for (const message of result.messages) {
      if (message.fatal) throw new Error(`${result.filePath}: ${message.message}`);
      const key = JSON.stringify([path.relative(root, result.filePath).replaceAll('\\', '/'), message.ruleId,
        message.severity, message.message, (source[message.line - 1] || '').trim()]);
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      counts[hash] = { key: JSON.parse(key), count: (counts[hash]?.count || 0) + 1 };
    }
  }
  return counts;
}
async function main() {
  const baseline = JSON.parse(fs.readFileSync(path.join(root, 'docs/lint-baseline.json'), 'utf8'));
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
module.exports = { diagnostics };
if (require.main === module) main().catch(error => { console.error(error); process.exitCode = 1; });
