import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_PROP_SCALE, NON_DISCOVERY_PROP_SCALE, ROAD_SIGN_SCALE, DISCOVERY_PROP_REACH, MAX_ROAD_HALF_WIDTH } from '../src/discovery-scale.js';
import { DISCOVERIES, MEMBER_LOCATIONS, VISUAL_LANDMARKS, nearestRoad, roadGap } from '../src/world-data.js';
import { rankByProximity } from '../src/discoveries.js';

test('a escala dos painéis, bancas e totens é de 1,5x a 2x', () => {
  assert.ok(DISCOVERY_PROP_SCALE >= 1.5 && DISCOVERY_PROP_SCALE <= 2);
  assert.equal(NON_DISCOVERY_PROP_SCALE, 1.5);
  assert.equal(ROAD_SIGN_SCALE, 1.5);
});

test('painel ampliado não invade o asfalto em nenhum ponto de história (folga para a pista)', () => {
  for (const point of DISCOVERIES) {
    const clearance = nearestRoad(point).distance - MAX_ROAD_HALF_WIDTH;
    assert.ok(clearance > DISCOVERY_PROP_REACH, `${point.id}: folga ${clearance.toFixed(1)} m não cobre o alcance ${DISCOVERY_PROP_REACH} m`);
  }
});

test('bancas/palcos e totem direcional a 1,5x permanecem fora do asfalto', () => {
  for (const m of MEMBER_LOCATIONS) {
    const c = Math.cos(m.facing), s = Math.sin(m.facing);
    for (const u of [-4.4 * NON_DISCOVERY_PROP_SCALE, 0, 4.4 * NON_DISCOVERY_PROP_SCALE]) {
      for (const v of [-3.8 * NON_DISCOVERY_PROP_SCALE, 2.4 * NON_DISCOVERY_PROP_SCALE]) {
        const gap = roadGap({ x: m.x + u * c + v * s, z: m.z - u * s + v * c });
        assert.ok(gap > 1.0, `palco em (${m.x},${m.z}) invadiu pista: folga ${gap.toFixed(2)} m`);
      }
    }
  }
  const hw = 4.08 * ROAD_SIGN_SCALE, c = Math.cos(1.2), s = Math.sin(1.2);
  for (const u of [-hw, 0, hw]) {
    const gap = roadGap({ x: 9.5 + u * c, z: -40.5 - u * s });
    assert.ok(gap > 2.0, `totem direcional invadiu asfalto: folga ${gap.toFixed(2)} m`);
  }
  for (const [key, pt] of Object.entries(VISUAL_LANDMARKS)) {
    assert.ok(roadGap(pt) > 8, `jardim ${key} sem folga`);
  }
});

test('rankByProximity ordena as descobertas não encontradas pela menor distância ao veículo', () => {
  const ranked = rankByProximity(DISCOVERIES[0], DISCOVERIES, new Set());
  assert.equal(ranked.length, DISCOVERIES.length);
  assert.equal(ranked[0].id, 'beginning');
  assert.equal(ranked[0].rank, 1);
  assert.equal(ranked[0].distance, 0);
  for (let i = 1; i < ranked.length; i++) assert.ok(ranked[i].distance >= ranked[i - 1].distance);
  const afterFirst = rankByProximity(DISCOVERIES[0], DISCOVERIES, new Set(['beginning']));
  assert.equal(afterFirst.length, DISCOVERIES.length - 1);
  assert.notEqual(afterFirst[0].id, 'beginning');
});
