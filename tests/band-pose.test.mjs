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
  assert.ok(mesh); assert.equal(mesh.skeleton.bones.length, 6); assert.ok(rig.vertices >= 2);
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

// Olhar (inclinação da cabeça) de cada integrante em SPECS: 2-D olha para as teclas, Russel para a bateria, Noodle para a pista.
const GAZE_PITCH = [.18, .06, .08, .3]; // Murdoc olha um pouco para baixo, para a pista (SPECS.gaze)
test('quatro integrantes conectam mãos aos sockets dos instrumentos e animam cabeça e braços em loop contínuo', () => {
  const material = color => new THREE.MeshStandardMaterial({ color });
  const armTips = [
    [.225, .66, .04],
    [.235, .65, .03],
    [.245, .69, .04],
    [.59, .66, .05],
  ];
  for (let index = 0; index < 4; index++) {
    const [hx, hy, hz] = armTips[index];
    const visual = new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, .85, 0,
      0, 1.32, 0,
      hx * .7, .88, .01,
      hx, hy, hz,
      -hx * .7, .88, .01,
      -hx, hy, hz,
    ], 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(Array(6).fill([0, 0, 1]).flat(), 3));
    visual.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial()));
    const rig = rigBand(visual, index, material);
    const mesh = visual.children.find(child => child.isSkinnedMesh);
    const head = mesh.skeleton.bones.find(b => b.name === 'head');
    assert.ok(head, `integrante ${index} possui osso de cabeça`);
    assert.equal(head.rotation.x, GAZE_PITCH[index], 'cabeça começa no olhar do integrante (SPECS.gaze)');
    const point = i => mesh.getVertexPosition(i, new THREE.Vector3());
    const restRight = point(3), restLeft = point(5), restHead = point(1);
    rig.pose(.45, false);
    assert.ok(Math.abs(head.rotation.x) > .005 || Math.abs(head.rotation.y) > .005, `cabeça do integrante ${index} balança no ritmo`);
    assert.ok(point(1).distanceTo(restHead) > 1e-4, `vértice da cabeça do integrante ${index} acompanha o ritmo`);
    assert.ok(point(3).distanceTo(restRight) > .001 || point(5).distanceTo(restLeft) > .001, `mãos do integrante ${index} tocam o instrumento`);
    if (index === 3) assert.equal(rig.sticks.length, 2, 'Russel segura duas baquetas conectadas às mãos');
    rig.pose(.9, true);
    assert.equal(head.rotation.x, GAZE_PITCH[index], 'parado, a cabeça volta ao olhar do integrante');
    assert.ok(point(3).distanceTo(restRight) < 1e-6 && point(5).distanceTo(restLeft) < 1e-6);
  }
});
