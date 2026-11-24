import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

test('URLs de recursos publicados respeitam o subcaminho', () => {
  const files = ['index.html', 'assets/art/manifest.json'];
  function visit(dir) {
    for (const entry of readdirSync(dir, { withFileTypes:true })) {
      if (entry.name === 'vendor') continue;
      const file = join(dir, entry.name);
      if (entry.isDirectory()) visit(file);
      else if (/\.(?:js|css|html|json)$/.test(entry.name)) files.push(file);
    }
  }
  visit('src');
  const rootPath = /(?:["'`(=]\s*)\/(?:assets|src|favicon|manifest)(?:\/|\.|["'`])/g;
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    assert.deepEqual([...text.matchAll(rootPath)].map(m => m[0]), [], `${file} contém caminho absoluto`);
  }
});

test('montagem Pages inclui todas as capas locais consumidas', () => {
  const content = readFileSync('src/content.js', 'utf8');
  const server = readFileSync('server.mjs', 'utf8');
  const published = new Set([...server.matchAll(/\['\/[^']*',\s*\['([^']+)'/g)].map(m => m[1]));
  const covers = new Set([...content.matchAll(/\.\/(assets\/covers\/[^']+)/g)].map(m => m[1]));
  assert.ok(covers.size >= 8);
  for (const file of covers) {
    assert.ok(existsSync(file), `${file} não existe`);
    assert.ok(published.has(file), `${file} ausente da lista do Pages`);
  }
});
