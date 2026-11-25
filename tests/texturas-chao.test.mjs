import test from 'node:test';
import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';

const MATS = ['asphalt', 'asphalt-normal', 'paving', 'paving-normal', 'earth', 'earth-normal', 'grass', 'grass-normal'];
// Texturas novas (ambientCG): limite de peso. grass/grass-normal seguem as antigas, mantidas até verificação visual.
const NEW = ['asphalt', 'asphalt-normal', 'paving', 'paving-normal', 'earth', 'earth-normal'];

test('texturas de chão: todos os WebP existem, não estão vazios e cabem no peso (<= 200 KB cada)', async () => {
  for (const m of MATS) {
    const size = (await stat(new URL(`../assets/materials/${m}.webp`, import.meta.url))).size;
    assert.ok(size > 1000, `${m}.webp com ${size} bytes`);
    if (NEW.includes(m)) assert.ok(size <= 200 * 1024, `${m}.webp (nova) com ${size} bytes`);
    const head = (await readFile(new URL(`../assets/materials/${m}.webp`, import.meta.url))).subarray(0, 12).toString('ascii');
    assert.ok(head.startsWith('RIFF') && head.includes('WEBP'), `${m}.webp é WebP`);
  }
});

test('texturas de chão: rota no servidor para a calçada nova (paving) e para os mapas de chão', async () => {
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  for (const m of ['paving', 'paving-normal', 'asphalt', 'earth', 'grass']) {
    assert.ok(server.includes(`'/assets/materials/${m}.webp'`), `rota de ${m}.webp`);
  }
});

test('texturas de chão: a calçada usa a textura CC0 (paving) em repetição de 4 m, com fallback procedural nos testes', async () => {
  const src = await readFile(new URL('../src/roads.js', import.meta.url), 'utf8');
  assert.match(src, /paving\.webp/, 'calçada carrega paving.webp');
  assert.match(src, /t\.repeat\.set\(\.75, \.75\)/, 'repetição 0,75 (uv 1 por 3 m → 1 por 4 m)');
  assert.match(src, /typeof document !== 'undefined'/, 'fallback procedural em Node');
});
