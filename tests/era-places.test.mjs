import test from 'node:test';
import assert from 'node:assert/strict';
import { ERA_DISCOVERY, discoveryIndexForEra, eraNavState } from '../src/era-places.js';
import { eras } from '../src/content.js';
import { DISCOVERIES } from '../src/world-data.js';

test('cada uma das 8 eras aponta para uma parada real da viagem', () => {
  assert.equal(ERA_DISCOVERY.length, eras.length, 'uma parada por era');
  for (let i = 0; i < eras.length; i++) {
    const point = DISCOVERIES[discoveryIndexForEra(i)];
    assert.ok(point, `era ${i} sem parada`);
    assert.ok(point.title, `parada da era ${i} tem título`);
  }
});

test('a era 2005 (Demon Days) leva à parada do mirante, e não à de Kong Studios', () => {
  const point = DISCOVERIES[discoveryIndexForEra(1)];
  assert.equal(point.id, 'demon-days');
  assert.notEqual(point.id, DISCOVERIES[0].id);
});

test('índice fora da lista cai na primeira parada, sem quebrar', () => {
  assert.equal(discoveryIndexForEra(99), 0);
  assert.equal(discoveryIndexForEra(-1), 0);
});

test('paginação: anterior desabilitada na primeira era, próxima na última', () => {
  assert.deepEqual(eraNavState(0, 8), { prev: false, next: true });
  assert.deepEqual(eraNavState(7, 8), { prev: true, next: false });
  assert.deepEqual(eraNavState(3, 8), { prev: true, next: true });
});
