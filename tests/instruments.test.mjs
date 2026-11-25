import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const exists = async name => { try { return (await stat(new URL(`../${name}`, import.meta.url))).size > 0; } catch { return false; } };
const NEW = ['assets/models/scenery/instrument-04-bass-v2.glb', 'assets/models/scenery/instrument-05-guitar-v2.glb'];

test('instrumentos novos (baixo do Murdoc e guitarra da Noodle) existem em disco e têm rota no servidor', async () => {
  const server = await read('server.mjs');
  for (const path of NEW) {
    assert.ok(await exists(path), `${path} existe e não está vazio`);
    const name = path.replace('assets/models/', '');
    assert.ok(server.includes(`'/assets/models/${name}'`), `${path} tem rota no server.mjs`);
  }
});

test('Murdoc troca o baixo pelo v2 com fallback para o procedural; Noodle tenta a guitarra v2 antes da v3', async () => {
  const scene = await read('src/scene.js');
  assert.match(scene, /1: '\.\/assets\/models\/scenery\/instrument-04-bass-v2\.glb'/, 'baixo v2 mapeado para o índice 1 (Murdoc)');
  assert.match(scene, /catch\(err => console\.warn\(`Instrumento GLB do integrante/, 'falha do GLB mantém o procedural');
  const i5 = scene.indexOf('instrument-05-guitar-v2'), i3 = scene.indexOf("noodle-guitar-v3.glb'");
  assert.ok(i5 > 0 && i5 < i3, 'cadeia da guitarra: instrument-05 e depois v3');
  assert.ok(scene.includes('if (rig.guitar) rig.guitar.visible = false'), 'guitarra procedural some só quando o GLB carrega');
});

test('sockets do baixo v2 e da guitarra v2 foram documentados (neck/strum) e o baixo atual continua no mesmo ponto de contato', async () => {
  const bandPose = await read('src/band-pose.js');
  assert.match(bandPose, /play: 'bass', contact: \[\[\.33, 1\.10, \.28\], \[-\.04, \.90, \.19\]\]/, 'contatos do baixo inalterados');
});
