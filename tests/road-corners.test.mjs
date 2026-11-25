import test from 'node:test';
import assert from 'node:assert/strict';
import { cornerBlocks, CORNER_RC } from '../src/roads.js';
import { NODES, ROADS } from '../src/world-data.js';
import { NODE_RADIUS, gap } from '../src/roads.js';

// Menor ângulo interno (graus) de um polígono fechado [x, z].
function minAngle(poly) {
  let min = 180;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[(i - 1 + poly.length) % poly.length], c = poly[i], n = poly[(i + 1) % poly.length];
    const ux = p[0] - c[0], uz = p[1] - c[1], vx = n[0] - c[0], vz = n[1] - c[1];
    const lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
    if (lu < 1e-6 || lv < 1e-6) continue;
    const ang = Math.acos(Math.max(-1, Math.min(1, (ux * vx + uz * vz) / (lu * lv)))) * 180 / Math.PI;
    min = Math.min(min, ang);
  }
  return min;
}

test('quinas da calçada: contorno contínuo (arco de raio fixo) dentro do anel e fora das vias', () => {
  let blocks = 0;
  for (let id = 0; id < NODES.length; id++) {
    const rIn = NODE_RADIUS[id];
    for (const poly of cornerBlocks(id)) {
      blocks++;
      assert.ok(poly.length >= 6, `nó ${id}: contorno com vértices suficientes`);
      for (const [x, z] of poly) {
        const r = Math.hypot(x - NODES[id].x, z - NODES[id].z);
        assert.ok(r <= rIn + 1e-6, `nó ${id}: vértice fora do anel (${r.toFixed(2)} > ${rIn})`);
        const beyond = Math.min(...ROADS.map(road => gap(road, x, z) - road.width / 2));
        assert.ok(beyond >= -0.25, `nó ${id}: vértice dentro de uma via (${beyond.toFixed(2)} m)`);
      }
    }
  }
  assert.ok(blocks >= 5, `quinas geradas: ${blocks}`);
});

test('quinas da calçada: sem vértices de ângulo agudo no contorno (menor ângulo interno >= 60°)', () => {
  for (let id = 0; id < NODES.length; id++) for (const poly of cornerBlocks(id)) {
    const m = minAngle(poly);
    assert.ok(m >= 60, `nó ${id}: vértice agudo de ${m.toFixed(1)}°`);
  }
});

test('arco de concordância tem raio fixo', () => {
  assert.equal(CORNER_RC, 4);
});
