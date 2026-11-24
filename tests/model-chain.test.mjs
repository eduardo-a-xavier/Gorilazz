import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const exists = async name => { try { return (await stat(new URL(`../${name}`, import.meta.url))).size > 0; } catch { return false; } };

test('cadeias dos modelos novos: v3 primeiro, depois o anterior (banda, cards, guitarra) e o piloto em v5', async () => {
  const scene = await read('src/scene.js');
  const cards = await read('src/member-viewer.js');
  const pilot = await read('src/pilot-rig.js');
  const bandOrder = ['gorillaz-phase7-web-v3', 'gorillaz-phase7-web-v2', 'gorillaz-phase7-web.glb', 'gorillaz-phase7-v2.glb', 'gorillaz-phase7.glb'];
  let at = -1;
  for (const name of bandOrder) { const i = scene.indexOf(name, at + 1); assert.ok(i > at, `banda: ${name} fora de ordem ou ausente`); at = i; }
  assert.ok(cards.indexOf('gorillaz-phase7-web-v3') < cards.indexOf('gorillaz-phase7-web-v2'), 'cards: v3 antes de v2');
  assert.ok(scene.indexOf('noodle-guitar-v3') < scene.indexOf('noodle-guitar-v2'), 'guitarra: v3 antes de v2');
  assert.match(pilot, /PILOT_MODEL_URL = '\.\/assets\/models\/driver-pilot-v6\.glb'/);
  assert.match(pilot, /PILOT_V4_URL = '\.\/assets\/models\/driver-pilot-v4\.glb'/);
});

test('cada GLB usado pelo app existe no repositório e tem rota no servidor', async () => {
  const server = await read('server.mjs');
  const sources = (await Promise.all(['src/scene.js', 'src/member-viewer.js', 'src/pilot-rig.js'].map(read))).join('\n');
  const used = [...new Set([...sources.matchAll(/assets\/models\/([\w.-]+\.glb)/g)].map(m => m[1]))];
  assert.ok(used.includes('gorillaz-phase7-web-v3.glb') && used.includes('driver-pilot-v5.glb') && used.includes('noodle-guitar-v3.glb'), 'modelos novos referenciados');
  for (const name of used) {
    assert.ok(await exists(`assets/models/${name}`), `${name} existe`);
    assert.ok(server.includes(`'/assets/models/${name}'`), `${name} tem rota no server.mjs`);
  }
});
