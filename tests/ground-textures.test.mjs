import test from 'node:test';
import assert from 'node:assert/strict';
import { slabPixels, toneJitter } from '../src/ground-textures.js';

test('ladrilho de calçada: 256 px, placas com rejunte mais escuro e repetível sem costura', () => {
  const size = 256, data = slabPixels(size, 4, 3);
  assert.equal(data.length, size * size * 4);
  const at = (x, y) => data[(y * size + x) * 4];
  const joint = at(1, 30), slab = at(30, 30);
  assert.ok(joint < slab * 0.85, 'rejunte mais escuro que a placa');
  assert.deepEqual(slabPixels(size, 4, 3), data, 'mesma entrada, mesma textura');
  // Repetição sem costura: os rejuntes caem em múltiplos do tamanho da placa, então a textura é periódica.
  for (const x of [0, 64, 128, 192]) assert.ok(at(x, 30) < slab * 0.85, `rejunte em x=${x}`);
});

test('variação de tom: determinística e dentro de ±5%', () => {
  for (let i = 0; i < 500; i++) {
    const x = Math.sin(i) * 120, z = Math.cos(i * 1.7) * 90;
    const k = toneJitter(x, z);
    assert.ok(k >= 0.95 - 1e-9 && k <= 1.05 + 1e-9, `fator ${k}`);
    assert.equal(toneJitter(x, z), k);
  }
});
