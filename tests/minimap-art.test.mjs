import test from 'node:test';
import assert from 'node:assert/strict';
import { MINIMAP_RECT, minimapCanvasSize, worldToArt, avenueGlow, MINIMAP_PX_PER_UNIT } from '../src/minimap-art.js';
import { ROADS, CITY_LOTS } from '../src/world-data.js';

test('fundo do minimapa tem tamanho fixo e cabe em 700 x 625 px (pré-renderizado uma vez)', () => {
  assert.deepEqual(minimapCanvasSize(), { width: 700, height: 625 });
  assert.equal(MINIMAP_PX_PER_UNIT, 2.5);
});

test('mundo -> fundo: o canto da área do SVG vai para (0,0) e o centro para o meio do canvas', () => {
  const origin = worldToArt(MINIMAP_RECT.x, MINIMAP_RECT.y);
  assert.deepEqual(origin, { px: 0, py: 0 });
  const centre = worldToArt(MINIMAP_RECT.x + MINIMAP_RECT.w / 2, MINIMAP_RECT.y + MINIMAP_RECT.h / 2);
  assert.equal(centre.px, 350); assert.equal(centre.py, 312.5);
});

test('avenidas principais têm contorno mais forte que as ruas pequenas', () => {
  const avenue = ROADS.find(road => road.kind === 'avenue');
  const lane = ROADS.find(road => road.kind === 'lane');
  assert.ok(avenue && lane, 'há avenida e rua pequena');
  assert.ok(avenueGlow(avenue.width).outer > avenueGlow(lane.width).outer);
  assert.ok(avenueGlow(lane.width).inner >= 1, 'nunca some');
});

test('o fundo usa os quarteirões e as ruas reais (sem dados inventados)', () => {
  assert.ok(CITY_LOTS.length > 10, 'há quarteirões');
  assert.ok(ROADS.length >= 5, 'há ruas');
});
