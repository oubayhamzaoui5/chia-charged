const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeKey } = require('../scripts/check-lint.cjs');

test('lint fingerprints ignore checkout paths but retain actual diagnostic changes', () => {
  const key = message => ['src/example.tsx', 'react-hooks/set-state-in-effect', 2, message, 'setValue(value)'];
  const windows = normalizeKey(key('Error: effect\nC:\\Users\\owner\\app\\src\\example.tsx:12:3\nsetValue(value)'));
  const linux = normalizeKey(key('Error: effect\n/home/runner/app/src/example.tsx:12:3\nsetValue(value)'));
  assert.deepEqual(windows, linux);
  assert.notDeepEqual(windows, normalizeKey(key('Different error\n/home/runner/app/src/example.tsx:12:3\nsetValue(value)')));
  assert.notDeepEqual(windows, normalizeKey(['src/example.tsx', 'different-rule', 2, windows[3], windows[4]]));
});
