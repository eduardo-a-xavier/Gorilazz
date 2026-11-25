import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { ROADS, NODES, CITY_LOTS, roadGap, accessPad, SIDEWALK_W } from '../src/world-data.js';
import { buildRoads, LEVEL, NODE_RADIUS, onAsphalt, CORNER_FILL } from '../src/roads.js';

function createRoadGroup() {
  const group = new THREE.Group();
  const surfaces = { get: () => new THREE.MeshStandardMaterial() };
  buildRoads(group, surfaces, color => new THREE.MeshStandardMaterial({ color }));
  return group;
}

test('calçada não invade pista nem o miolo do cruzamento: nenhum triângulo de calçada dentro de um disco de rotatória', () => {
  assert.equal(CORNER_FILL, false, 'lajes de quina desativadas (entravam no anel)');
  const pavement = createRoadGroup().getObjectByName('road-pavement');
  const pos = pavement.geometry.attributes.position, idx = pavement.geometry.index;
  let walk = 0, invaded = [];
  for (let t = 0; t < idx.count; t += 3) {
    const v = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
    if (!v.every(i => Math.abs(pos.getY(i) - LEVEL.walk) < 1e-5)) continue;
    walk++;
    const inside = v.every(i => NODES.some((n, id) => Math.hypot(pos.getX(i) - n.x, pos.getZ(i) - n.z) < NODE_RADIUS[id] - 0.05));
    if (inside) invaded.push(v.map(i => [pos.getX(i).toFixed(1), pos.getZ(i).toFixed(1)]));
  }
  assert.ok(walk > 0, 'há calçada');
  assert.equal(invaded.length, 0, `triângulos de calçada dentro de rotatória: ${invaded.length}`);
});

test('calçada: o acesso não entra no asfalto (todo ponto do trecho de acesso fica fora das vias)', () => {
  for (const lot of CITY_LOTS.filter(l => !l.landmark)) for (const doorX of [0, (lot.w - 3) / 2, -(lot.w - 3) / 2]) {
    const pad = accessPad(lot, doorX);
    if (!pad) continue;
    for (let k = 0; k <= 10; k++) {
      const t = pad.length * k / 10;
      const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
      const lu = pad.doorLocal.u + pad.dirLocal.u * t, lv = pad.doorLocal.v + pad.dirLocal.v * t;
      const p = { x: lot.x + lu * c + lv * s, z: lot.z - lu * s + lv * c };
      assert.ok(roadGap(p) >= -0.05, `acesso do prédio em ${lot.x},${lot.z} entra no asfalto (gap ${roadGap(p).toFixed(2)})`);
    }
  }
});

test('todo prédio tem acesso: a porta alcança a calçada, com trecho de acesso quando preciso', () => {
  for (const lot of CITY_LOTS.filter(l => !l.landmark)) for (const doorX of [0, (lot.w - 3) / 2, -(lot.w - 3) / 2]) {
    const pad = accessPad(lot, doorX);
    const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation), lz = lot.d / 2 + 0.6;
    const door = { x: lot.x + doorX * c + lz * s, z: lot.z - doorX * s + lz * c };
    const reachable = roadGap(door) <= SIDEWALK_W + 0.15 || (pad && pad.length >= roadGap(door) - SIDEWALK_W - 0.15);
    assert.ok(reachable, `prédio em ${lot.x},${lot.z} sem acesso (porta a ${roadGap(door).toFixed(2)} m da borda)`);
  }
});
