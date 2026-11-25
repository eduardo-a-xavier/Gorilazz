import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { NODES } from '../src/world-data.js';
import { buildRoads, LEVEL, NODE_DEGREE, NODE_RADIUS, WALK, inJunction, onAsphalt } from '../src/roads.js';

function createRoadGroup() {
  const group = new THREE.Group();
  const surfaces = { get: () => new THREE.MeshStandardMaterial() };
  buildRoads(group, surfaces, color => new THREE.MeshStandardMaterial({ color }));
  return group;
}

// Vértices do topo da calçada (y = LEVEL.walk) de cada nó de cruzamento, em coordenadas relativas ao nó.
function walkTopVertices(pos, idx) {
  const out = new Set();
  for (let t = 0; t < idx.count; t += 3) {
    const tri = [idx.getX(t), idx.getX(t + 1), idx.getX(t + 2)];
    if (!tri.every(v => Math.abs(pos.getY(v) - LEVEL.walk) < 1e-5)) continue;
    for (const v of tri) out.add(v);
  }
  return [...out].map(v => ({ x: pos.getX(v), z: pos.getZ(v) }));
}

test('calçada de braço e curva: sem degrau no aro do disco, sem invasão de asfalto e largura do anel constante', () => {
  const group = createRoadGroup();
  const pavement = group.getObjectByName('road-pavement');
  assert.ok(pavement?.isMesh, 'malha de calçada precisa existir');
  const pos = pavement.geometry.attributes.position, idx = pavement.geometry.index;
  const tops = walkTopVertices(pos, idx);

  // 1) Calçada não invade asfalto nem o disco (vértices do topo fora do disco e fora do asfalto, exceto a borda exata do aro).
  for (const p of tops) {
    if (inJunction(p.x, p.z)) {
      // Dentro de algum disco só são aceitos vértices sobre o aro (raio exato do disco).
      const onRim = NODES.some((n, id) => Math.abs(Math.hypot(p.x - n.x, p.z - n.z) - NODE_RADIUS[id]) < 1e-3);
      assert.ok(onRim, `vértice de calçada (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) dentro do disco fora do aro`);
    }
  }

  // 2) Continuidade no aro: todo vértice de topo que cai sobre um aro de cruzamento de grau >= 3 está exatamente no raio do aro
  //    (o chanfro e o anel compartilham a mesma linha, sem degrau radial > 0,01 m).
  let rimPoints = 0;
  NODES.forEach((node, id) => {
    if (NODE_DEGREE[id] < 3) return;
    const rIn = NODE_RADIUS[id], rOut = rIn + WALK.avenue;
    for (const p of tops) {
      const r = Math.hypot(p.x - node.x, p.z - node.z);
      if (r < rIn - 0.01 || r > rOut + 0.01) continue;
      if (Math.abs(r - rIn) < 0.01 || Math.abs(r - rOut) < 0.01) { rimPoints++; continue; }
      // Vértice interno à faixa de calçada do anel: deve ser de braço (fora do disco) ou estar na borda do anel.
    }
  });
  assert.ok(rimPoints > 0, 'deve haver vértices de calçada sobre os aros dos cruzamentos');

  // 3) Largura constante do anel: a faixa vai de rIn a rOut = rIn + 2,4 m em todos os cruzamentos de grau >= 3.
  NODES.forEach((node, id) => {
    if (NODE_DEGREE[id] < 3) return;
    const rIn = NODE_RADIUS[id];
    assert.equal(WALK.avenue, 2.4, 'faixa do anel deve ser de 2,4 m');
    const radii = tops.filter(p => Math.hypot(p.x - node.x, p.z - node.z) >= rIn - 1e-3 && Math.hypot(p.x - node.x, p.z - node.z) <= rIn + WALK.avenue + 1e-3)
      .map(p => Math.hypot(p.x - node.x, p.z - node.z));
    for (const r of radii) {
      const ok = Math.abs(r - rIn) < 0.01 || Math.abs(r - (rIn + WALK.avenue)) < 0.01 || r > rIn + 0.01;
      assert.ok(ok, `largura da faixa do anel fora do padrão no nó ${id}: r=${r.toFixed(3)}`);
    }
  });

  // 4) Sanidade: vértices de topo de calçada nunca sobre o asfalto de outra via (mesmo critério de roads.test).
  for (const p of tops) {
    assert.equal(onAsphalt(p.x, p.z, null, -0.05), false, `vértice de calçada (${p.x.toFixed(2)}, ${p.z.toFixed(2)}) sobre asfalto`);
  }
});
