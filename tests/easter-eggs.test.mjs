import test from 'node:test';
import assert from 'node:assert/strict';
import { EASTER_EGG_POSITIONS, isMurdocHead, LUNAR_MURDOC, followLunarCamera, configureLunarMaterial } from '../src/easter-eggs.js';
import { roadGap, MEMBER_LOCATIONS, DISCOVERIES, ERA_GATES } from '../src/world-data.js';
import * as THREE from '../src/vendor/three.module.min.js';
import { excludeTreesNear, planStreetProps } from '../src/street-props-plan.js';
import { readFileSync } from 'node:fs';

test('easter eggs ficam fora da pista e afastados de palcos e pontos de interesse', () => {
  for (const item of EASTER_EGG_POSITIONS) {
    assert.ok(roadGap(item) >= item.radius + .9, `${item.id}: folga da pista`);
    for (const stage of MEMBER_LOCATIONS) assert.ok(Math.hypot(item.x - stage.x, item.z - stage.z) >= 16 + item.radius, `${item.id}: palco`);
    for (const point of [...DISCOVERIES, ...ERA_GATES]) assert.ok(Math.hypot(item.x - point.x, item.z - point.z) >= 15 + item.radius, `${item.id}: descoberta ou portal`);
  }
});

test('material lunar não recebe névoa nem disputa profundidade com o mundo', () => {
  const material = configureLunarMaterial(new THREE.MeshStandardMaterial());
  assert.equal(material.fog, false); assert.equal(material.depthTest, false); assert.equal(material.depthWrite, false);
});

test('Murdoc lunar acompanha a câmera sem mudar direção nem alocar posição', () => {
  const anchor = new THREE.Group(), camera = new THREE.PerspectiveCamera(), position = anchor.position;
  const moon = new THREE.Group(); moon.position.set(LUNAR_MURDOC.x, LUNAR_MURDOC.y, LUNAR_MURDOC.z); anchor.add(moon);
  for (const xyz of [[0, 0, 0], [40, 15, -90]]) {
    camera.position.set(...xyz); followLunarCamera(anchor, camera); anchor.updateMatrixWorld(true);
    assert.equal(anchor.position, position);
    assert.ok(moon.getWorldPosition(new THREE.Vector3()).sub(camera.position).distanceTo(moon.position) < 1e-9);
  }
  const elevation = Math.atan2(LUNAR_MURDOC.y, Math.hypot(LUNAR_MURDOC.x, LUNAR_MURDOC.z)) * 180 / Math.PI;
  const angularSize = 2 * Math.atan2(LUNAR_MURDOC.disk / 2, Math.hypot(LUNAR_MURDOC.x, LUNAR_MURDOC.y, LUNAR_MURDOC.z)) * 180 / Math.PI;
  assert.ok(elevation >= 8 && elevation <= 10);
  assert.ok(angularSize >= 18 && angularSize <= 25);
});

test('identifica a cabeça do GLB e sua forma normalizada pelo carregador', () => {
  const glb = readFileSync(new URL('../assets/models/gorillaz-phase7-web-v3.glb', import.meta.url));
  const data = JSON.parse(glb.subarray(20, 20 + glb.readUInt32LE(12)).toString('utf8'));
  const head = data.nodes.find(node => node.name === 'murdoc_Murdoc_Head.smd');
  assert.ok(head && Number.isInteger(head.mesh));
  assert.ok(isMurdocHead({ isMesh: true, name: head.name }));
  assert.ok(isMurdocHead({ isMesh: true, name: 'murdoc_Murdoc_Headsmd' }));
  assert.equal(isMurdocHead({ isMesh: true, name: 'murdoc_Murdoc_Hair' }), false);
});

test('árvores são afastadas do cartaz Save sem remover outros tipos', () => {
  const save = EASTER_EGG_POSITIONS.find(item => item.id === 'save');
  const plan = planStreetProps();
  assert.ok(plan.some(item => item.kind === 'tree' && Math.hypot(item.x - save.x, item.z - save.z) < 4.5));
  const filtered = excludeTreesNear(plan, [save]);
  assert.ok(filtered.every(item => item.kind !== 'tree' || Math.hypot(item.x - save.x, item.z - save.z) >= 4.5));
  assert.equal(filtered.filter(item => item.kind !== 'tree').length, plan.filter(item => item.kind !== 'tree').length);
});
