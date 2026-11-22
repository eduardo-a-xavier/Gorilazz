import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { ROADS, NODES } from '../src/world-data.js';
import { buildRoads, LEVEL, NODE_DEGREE, NODE_RADIUS, gap, inJunction, onAsphalt } from '../src/roads.js';

function createRoadGroup() {
  const group = new THREE.Group();
  const surfaces = { get: () => new THREE.MeshStandardMaterial() };
  const material = color => new THREE.MeshStandardMaterial({ color });
  buildRoads(group, surfaces, material);
  return group;
}

test('zero quads de calçada invadem asfalto de outra rua ou discos de cruzamento e saias descem a -0.32', () => {
  const group = createRoadGroup();
  const pavement = group.getObjectByName('road-pavement');
  assert.ok(pavement?.isMesh, 'malha de calçada precisa existir');
  const pos = pavement.geometry.attributes.position;
  const idx = pavement.geometry.index;
  let walkQuads = 0, skirtVertices = 0;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(pos.getY(i) - LEVEL.skirt) < 1e-5) skirtVertices++;
  }
  assert.ok(skirtVertices > 0, 'calçadas e rotatórias precisam ter saia vertical até y = -0.32');

  // Inspeciona todos os triângulos horizontais do topo da calçada (y === LEVEL.walk).
  for (let t = 0; t < idx.count; t += 3) {
    const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2);
    const ya = pos.getY(a), yb = pos.getY(b), yc = pos.getY(c);
    if (Math.abs(ya - LEVEL.walk) < 1e-5 && Math.abs(yb - LEVEL.walk) < 1e-5 && Math.abs(yc - LEVEL.walk) < 1e-5) {
      walkQuads++;
      for (const v of [a, b, c]) {
        const x = pos.getX(v), z = pos.getZ(v);
        assert.equal(inJunction(x, z), false, `vértice de calçada (${x.toFixed(2)}, ${z.toFixed(2)}) invadiu cruzamento`);
        assert.equal(onAsphalt(x, z, null, -.05), false, `vértice de calçada (${x.toFixed(2)}, ${z.toFixed(2)}) invadiu asfalto`);
      }
    }
  }
  assert.ok(walkQuads > 200);
});

test('zero sobreposições de asfalto entre ruas diferentes fora dos discos de cruzamento', () => {
  assert.equal(LEVEL.asphalt, -.09);
  const frames = ROADS.map(road => road.samples.map((point, i) => {
    const previous = road.samples[Math.max(0, i - 1)], next = road.samples[Math.min(road.samples.length - 1, i + 1)];
    const dx = next.x - previous.x, dz = next.z - previous.z, length = Math.hypot(dx, dz) || 1;
    return { x: point.x, z: point.z, nx: dz / length, nz: -dx / length };
  }));
  const at = (frame, offset) => [frame.x + frame.nx * offset, frame.z + frame.nz * offset];
  for (const r1 of ROADS) {
    const list = frames[r1.id], half = r1.width / 2;
    for (const f of list) {
      for (const [px, pz] of [at(f, -half), [f.x, f.z], at(f, half)]) {
        if (inJunction(px, pz)) continue;
        for (const r2 of ROADS) {
          if (r1.id === r2.id) continue;
          assert.ok(gap(r2, px, pz) >= r2.width / 2, `sobreposição fora de cruzamento: ${r1.short} vs ${r2.short} em (${px.toFixed(2)}, ${pz.toFixed(2)})`);
        }
      }
    }
  }
});

test('100% dos triângulos horizontais de asfalto, calçada e pintura têm normal +Y (y > 0.99)', () => {
  const group = createRoadGroup();
  for (const name of ['road-asphalt', 'road-pavement', 'road-white', 'road-yellow', 'road-names']) {
    const mesh = group.getObjectByName(name);
    assert.ok(mesh?.isMesh, `malha ${name} precisa existir`);
    const pos = mesh.geometry.attributes.position;
    const norm = mesh.geometry.attributes.normal;
    const idx = mesh.geometry.index;
    let horizontal = 0;
    for (let t = 0; t < idx.count; t += 3) {
      const a = idx.getX(t), b = idx.getX(t + 1), c = idx.getX(t + 2);
      const ya = pos.getY(a), yb = pos.getY(b), yc = pos.getY(c);
      if (Math.abs(ya - yb) < 1e-5 && Math.abs(yb - yc) < 1e-5) {
        horizontal++;
        for (const v of [a, b, c]) {
          assert.ok(norm.getY(v) > .99, `${name}: normal Y invertida ou inclinada (${norm.getY(v)})`);
        }
      }
    }
    assert.ok(horizontal > 0, `${name} deve conter triângulos horizontais`);
  }
});

test('nós de grau 2 não recebem pintura amarela de rotatória e estêncis ficam dentro do asfalto', () => {
  assert.deepEqual(NODE_DEGREE, [2, 3, 2, 3, 2, 3, 3, 4]);
  const group = createRoadGroup();
  const yellow = group.getObjectByName('road-yellow');
  const yPos = yellow.geometry.attributes.position;
  for (const [id, node] of NODES.entries()) {
    if (NODE_DEGREE[id] !== 2) continue;
    for (let i = 0; i < yPos.count; i++) {
      const d = Math.hypot(yPos.getX(i) - node.x, yPos.getZ(i) - node.z);
      assert.ok(!(d >= 2.05 && d <= 2.55), `nó de grau 2 (${id}) recebeu anel amarelo de rotatória`);
    }
  }
  const names = group.getObjectByName('road-names');
  const nPos = names.geometry.attributes.position;
  assert.ok(nPos.count >= ROADS.length * 4, 'estêncis das ruas devem ser gerados');
  for (let i = 0; i < nPos.count; i++) {
    const x = nPos.getX(i), z = nPos.getZ(i);
    assert.ok(ROADS.some(road => gap(road, x, z) <= road.width / 2), `canto de estêncil (${x.toFixed(2)}, ${z.toFixed(2)}) fora do asfalto`);
  }
  assert.equal(NODE_RADIUS.length, NODES.length);
});
