import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectSyntaxTargets } from '../scripts/check-syntax.mjs';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

test('npm run check cobre server.mjs e todos os arquivos JS/MJS de src/ (exceto vendor)', () => {
  const targets = new Set(collectSyntaxTargets(root));
  assert.ok(targets.has('server.mjs'), 'server.mjs deve ser checado');
  assert.ok(targets.has('src/discoveries-lore.js'), 'src/discoveries-lore.js deve ser checado');
  const expected = [];
  function walk(relDir) {
    for (const entry of readdirSync(path.join(root, relDir), { withFileTypes: true })) {
      if (entry.name === 'vendor') continue;
      const rel = path.posix.join(relDir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(?:js|mjs)$/.test(entry.name)) expected.push(rel);
    }
  }
  walk('src');
  const missing = expected.filter(f => !targets.has(f));
  assert.deepEqual(missing, [], `arquivos fora do check: ${missing.join(', ')}`);
});
