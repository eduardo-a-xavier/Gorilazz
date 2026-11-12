import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { createFrequencyGarden } from '../src/environment.js';
import { VISUAL_LANDMARKS } from '../src/world-data.js';

test('escultura original permanece dentro do volume de colisão e dispensa texturas externas', () => {
  const garden = createFrequencyGarden();
  const bounds = new THREE.Box3().setFromObject(garden);
  const radius = VISUAL_LANDMARKS.diorama.radius;
  for (const x of [bounds.min.x, bounds.max.x]) for (const z of [bounds.min.z, bounds.max.z]) {
    assert.ok(Math.hypot(x,z) < radius);
  }
  assert.ok(bounds.min.y >= 0);
  assert.ok(bounds.max.y < 8);
  let triangles = 0;
  garden.traverse(object => {
    if (!object.isMesh) return;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
    assert.ok(Object.values(object.material).every(value => !value?.isTexture));
  });
  assert.ok(triangles > 0 && triangles <= 1500);
});
