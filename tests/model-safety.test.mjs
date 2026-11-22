import test from 'node:test';
import assert from 'node:assert/strict';
import { loadModelSafely, repairMaterials } from '../src/model-safety.js';

const quiet = { warn() {} };
const noWait = async () => {};

test('GLB que falha uma vez carrega na segunda tentativa, sem derrubar o carro', async () => {
  let calls = 0;
  const loader = { loadAsync: async url => { calls++; if (calls === 1) throw new Error("Couldn't load texture blob"); return { scene: url }; } };
  const gltf = await loadModelSafely(loader, './assets/models/gorillaz-geep.glb', { sleep: noWait, log: quiet });
  assert.equal(calls, 2);
  assert.equal(gltf.scene, './assets/models/gorillaz-geep.glb');
});

test('falha persistente é reportada depois da única tentativa extra (sem loop infinito)', async () => {
  let calls = 0;
  const loader = { loadAsync: async () => { calls++; throw new Error('textura'); } };
  await assert.rejects(loadModelSafely(loader, 'x.glb', { sleep: noWait, log: quiet }), /textura/);
  assert.equal(calls, 2);
});

test('textura sem imagem vira cor sólida: o material continua visível', () => {
  const broken = { image: null }, working = { image: {} };
  const material = { map: broken, normalMap: working, needsUpdate: false };
  const mesh = { isMesh: true, material };
  const root = { traverse: fn => fn(mesh) };
  assert.equal(repairMaterials(root), 1);
  assert.equal(material.map, null, 'a textura quebrada sai');
  assert.equal(material.normalMap, working, 'a textura boa fica');
  assert.equal(material.needsUpdate, true);
});

test('material compartilhado é contado uma vez e objetos sem material são ignorados', () => {
  const shared = { map: { image: null } };
  const root = { traverse: fn => { fn({ isMesh: true, material: shared }); fn({ isMesh: true, material: shared }); fn({ isMesh: false }); } };
  assert.equal(repairMaterials(root), 1);
});
