import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { createRegionalGrounds } from '../src/environment.js';

test('acabamentos regionais cabem no terreno existente, abaixo das ruas e sem texturas', () => {
  const group = createRegionalGrounds();
  assert.deepEqual(group.children.map(mesh => mesh.name),['studio-ground','coast-ground','lookout-ground']);
  let triangles = 0;
  for (const mesh of group.children) {
    const bounds = new THREE.Box3().setFromObject(mesh);
    assert.ok(bounds.min.x >= -140 && bounds.max.x <= 140);
    assert.ok(bounds.min.z >= -200 && bounds.max.z <= 50);
    assert.ok(bounds.min.y >= -.13 && bounds.max.y < -.095);
    assert.ok(mesh.geometry.attributes.color);
    assert.equal(mesh.material.map,null);
    assert.equal(mesh.castShadow,false);
    const normals = mesh.geometry.attributes.normal;
    for (let i=0;i<normals.count;i++) assert.ok(normals.getY(i) > .99);
    triangles += mesh.geometry.attributes.position.count/3;
  }
  assert.ok(triangles <= 1000);
  assert.equal(new Set(group.children.map(mesh => mesh.material)).size,1);
});
