import test from 'node:test';
import assert from 'node:assert/strict';
import { TRACK_RADIUS, STOP_COUNT, routePose, wrapProgress, nearestDestination, circularDistance } from '../src/route.js';
const near = (first, second, tolerance = 1e-9) => assert.ok(Math.abs(first - second) < tolerance, `${first} ≈ ${second}`);

test('o circuito fecha sem salto em qualquer volta', () => {
  for (const progress of [-2, -.01, 0, .25, .5, .75, .999, 1, 2]) {
    const current = routePose(progress); const nextLap = routePose(progress + 1);
    near(current.x, nextLap.x); near(current.z, nextLap.z);
    near(Math.hypot(current.x, current.z + TRACK_RADIUS), TRACK_RADIUS);
  }
});
test('a frente do jipe aponta na tangente da curva', () => {
  for (const progress of [0, .125, .25, .5, .75, .999]) {
    const current = routePose(progress); const next = routePose(progress + 1e-6);
    const length = Math.hypot(next.x - current.x, next.z - current.z);
    near((next.x - current.x) / length, -Math.sin(current.heading), 1e-5);
    near((next.z - current.z) / length, -Math.cos(current.heading), 1e-5);
  }
});
test('o deslocamento lateral mantém o arco do circuito', () => {
  for (const lateral of [-11, -7, 0, 7, 11]) {
    const at = routePose(.3, lateral);
    near(Math.hypot(at.x, at.z + TRACK_RADIUS), TRACK_RADIUS + lateral);
  }
});
test('as nove paradas ocupam posições diferentes', () => {
  const positions = Array.from({ length: STOP_COUNT }, (_, index) => {
    const at = routePose(index / STOP_COUNT); return `${at.x.toFixed(6)},${at.z.toFixed(6)}`;
  });
  assert.equal(positions.length, 9); assert.equal(new Set(positions).size, 9);
});
test('o caminho mais curto pode atravessar a emenda nos dois sentidos', () => {
  near(nearestDestination(.98, .02), 1.02);
  near(nearestDestination(.02, .98), -.02);
  near(nearestDestination(2.98, .02), 3.02);
  near(nearestDestination(.1, .3), .3);
});
test('progresso e encontros são periódicos inclusive em marcha à ré', () => {
  near(wrapProgress(-.01), .99); near(wrapProgress(2.01), .01);
  near(circularDistance(.99, .01), .02);
  near(circularDistance(-.01, 2.01), .02);
});
