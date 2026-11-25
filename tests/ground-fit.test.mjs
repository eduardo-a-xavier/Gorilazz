import test from 'node:test';
import assert from 'node:assert/strict';
import { groundOffsetY, GROUND_Y } from '../src/ground-fit.js';

test('árvores e arbustos: a base da malha cai em GROUND_Y para qualquer escala e altura de origem', () => {
  for (const minY of [-1, -0.4, 0, 0.12, -2.5]) for (const scale of [0.85, 1, 1.25, 1.5]) {
    const y = groundOffsetY(minY, scale);
    assert.ok(Math.abs((y + minY * scale) - GROUND_Y) < 1e-9, `base em ${GROUND_Y} (minY ${minY}, escala ${scale})`);
  }
  assert.equal(GROUND_Y, -0.06);
});
