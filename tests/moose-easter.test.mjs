import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { roadGap, DISCOVERIES } from '../src/world-data.js';

const GLB = new URL('../assets/models/scenery/moose-01.glb', import.meta.url);
const POS = { x: 58, z: -38 };

test('alce GLB: arquivo existe, é GLB binário e fica abaixo de 300 KB', async () => {
  const bytes = await readFile(GLB);
  assert.equal(bytes.subarray(0, 4).toString('ascii'), 'glTF', 'cabeçalho GLB');
  assert.ok((await stat(GLB)).size < 300 * 1024, 'menos de 300 KB');
});

test('alce GLB: rota no servidor com MIME de GLB (servido sob /Gorilazz/ pelo mesmo mapa)', async () => {
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.match(server, /\['\/assets\/models\/scenery\/moose-01\.glb', \['assets\/models\/scenery\/moose-01\.glb', 'model\/gltf-binary'\]\]/);
});

test('alce GLB: origem nos pés (min y = 0) e cabeça em +X, com altura de ~2,6 m', async () => {
  const bytes = await readFile(GLB);
  const jl = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jl).toString('utf8'));
  const vec = json.accessors.filter(a => a.type === 'VEC3' && a.min && a.max);
  const minY = Math.min(...vec.map(a => a.min[1])), maxY = Math.max(...vec.map(a => a.max[1]));
  const maxX = Math.max(...vec.map(a => a.max[0]));
  assert.ok(Math.abs(minY) < 1e-3, `base em y=0 (min ${minY})`);
  assert.ok(maxY > 2.5 && maxY < 2.7, `altura ${maxY}`);
  assert.ok(maxX > 1.5, 'cabeça em +X');
});

test('alce: fallback de caixas mantido; GLB na posição, rotação e gatilho do alce atual; base em y = -0,06', async () => {
  const src = await readFile(new URL('../src/easter-eggs.js', import.meta.url), 'utf8');
  assert.match(src, /moose\.position\.set\(58, 0, -38\)/, 'alce de caixas (fallback) na posição original');
  assert.match(src, /loadModelSafely\(new GLTFLoader\(\), '\.\/assets\/models\/scenery\/moose-01\.glb'\)/, 'carrega o GLB com loadModelSafely');
  assert.match(src, /model\.position\.set\(58, -0\.06, -38\); model\.rotation\.y = -\.5;/, 'posição, base e rotação do GLB');
  assert.match(src, /catch\(err => console\.warn\('Alce GLB indisponível; mantendo o alce de caixas/, 'fallback mantém o alce de caixas');
  assert.match(src, /scene\.remove\(moose\); scene\.add\(model\);/, 'troca o alce de caixas pelo GLB quando carrega');
});

test('alce: não invade rua (borda do asfalto a mais de 0,9 m) nem os 9 pontos (mais de 9 m)', () => {
  assert.ok(roadGap(POS) >= 0.9 + 1.5, `distância à borda do asfalto ${roadGap(POS).toFixed(2)} m`);
  for (const d of DISCOVERIES) assert.ok(Math.hypot(d.x - POS.x, d.z - POS.z) > 9, `ponto ${d.id} perto do alce`);
});
