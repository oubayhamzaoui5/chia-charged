const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const moduleValue = { exports: {} };
const source = fs.readFileSync(path.join(__dirname, '../src/lib/product-nutrition.ts'), 'utf8');
new Function('exports', ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(moduleValue.exports);
const { normalizeProductNutrition, DEFAULT_PRODUCT_NUTRITION } = moduleValue.exports;

test('missing or malformed nutrition never borrows legacy product facts', () => {
  for (const input of [undefined, null, '', '{invalid', [], {}]) {
    const facts = normalizeProductNutrition(input);
    assert.equal(facts.calories, '');
    assert.equal(facts.servingSize, '');
    assert.deepEqual(facts.rows, []);
  }
});
test('saved label survives normalization; partial fields remain unpublished', () => {
  assert.deepEqual(normalizeProductNutrition(JSON.stringify(DEFAULT_PRODUCT_NUTRITION)), DEFAULT_PRODUCT_NUTRITION);
  const partial = normalizeProductNutrition({ calories: '100' });
  assert.equal(partial.calories, '100');
  assert.equal(partial.servingSize, '');
  assert.deepEqual(partial.rows, []);
});
