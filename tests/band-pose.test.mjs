import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { rigBand } from '../src/band-pose.js';

test('rig articula o braço sem reescrever a malha nem mover o tronco', () => {
  const visual = new THREE.Group();
  visual.position.set(3, 2, -4); visual.scale.setScalar(4);
  const geometry = new THREE.BufferGeometry();
  // Torso, upper arm, elbow and hand along 2-D's original arm.
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, .9, 0, .15, .99, -.015, .1775, .87, .005, .225, .66, .04,
  ], 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array(4).fill([0, 0, 1]).flat(), 3));
  visual.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
  const material = color => new THREE.MeshStandardMaterial({color});
  const rig = rigBand(visual, 0, material);
  const mesh = visual.children.find(child => child.isSkinnedMesh);
  assert.ok(mesh); assert.equal(mesh.skeleton.bones.length, 5); assert.ok(rig.vertices >= 2);
  const original = Array.from(mesh.geometry.attributes.position.array);
  const weights = mesh.geometry.attributes.skinWeight;
  for (let i = 0; i < weights.count; i++) {
    assert.ok(Math.abs(weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i) - 1) < 1e-6);
  }
  const point = i => mesh.getVertexPosition(i, new THREE.Vector3());
  const torso = point(0), hand = point(3);
  rig.pose(.27, false);
  assert.ok(point(0).distanceTo(torso) < 1e-6);
  assert.ok(point(3).distanceTo(hand) > .001);
  assert.deepEqual(Array.from(mesh.geometry.attributes.position.array), original);
  rig.pose(0, true); const still = point(3);
  rig.pose(100, true); assert.ok(point(3).distanceTo(still) < 1e-6);
  // Moving the actor must not change the vertex position in its local bind space.
  visual.position.set(-5, 3, 7); visual.updateMatrixWorld(true);
  assert.ok(point(3).distanceTo(still) < 1e-5);
});
