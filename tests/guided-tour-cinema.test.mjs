import test from 'node:test';
import assert from 'node:assert/strict';
import { duckTarget, easeDuck, DUCK_LEVEL, DUCK_INNER_M, DUCK_OUTER_M } from '../src/guided-tour.js';

test('ducking do Kong FM nos palcos: 1 longe, DUCK_LEVEL colado, transição monótona', () => {
  assert.equal(duckTarget(Infinity), 1);
  assert.equal(duckTarget(DUCK_OUTER_M + 5), 1);
  assert.equal(duckTarget(DUCK_INNER_M - 2), DUCK_LEVEL);
  let prev = Infinity;
  for (let d = DUCK_OUTER_M; d >= DUCK_INNER_M; d -= 0.5) {
    const v = duckTarget(d);
    assert.ok(v <= prev + 1e-9, `monótono em ${d}`);
    prev = v;
  }
});

test('easeDuck aproxima do alvo sem passar dele e sem degrau', () => {
  let v = 1;
  for (let i = 0; i < 300; i++) { v = easeDuck(v, DUCK_LEVEL, 1 / 60); assert.ok(v >= DUCK_LEVEL - 1e-9 && v <= 1 + 1e-9); }
  assert.ok(Math.abs(v - DUCK_LEVEL) < 0.01, `converge (${v.toFixed(3)})`);
  assert.equal(easeDuck(0.5, 0.5, 1 / 60), 0.5);
});
