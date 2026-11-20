import test from 'node:test';
import assert from 'node:assert/strict';
import { numericShortcutIndex } from '../src/input.js';

test('atalhos numéricos selecionam somente paradas existentes', () => {
  assert.equal(numericShortcutIndex('1', 9), 0);
  assert.equal(numericShortcutIndex('9', 9), 8);
  assert.equal(numericShortcutIndex('0', 9), -1);
  assert.equal(numericShortcutIndex('a', 9), -1);
  assert.equal(numericShortcutIndex('9', 8), -1);
});
