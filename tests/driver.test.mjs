import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { createDriver, createDriverReaction } from '../src/scene.js';

test('motorista procedural preserva encaixes, orçamento e materiais sem texturas', () => {
  const palette = new Map();
  const material = color => {
    if (!palette.has(color)) palette.set(color,new THREE.MeshStandardMaterial({color}));
    return palette.get(color);
  };
  const {driver,driverHead,driverArms} = createDriver(material);
  assert.deepEqual(driver.position.toArray(),[-.54,.12,.42]);
  assert.deepEqual(driver.scale.toArray(),[1.22,1.22,1.22]);
  assert.deepEqual(driverHead.position.toArray(),[0,2.24,.02]);
  assert.deepEqual(driverArms.position.toArray(),[0,1.62,-.5]);
  let triangles = 0, meshes = 0;
  driver.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count)/3;
    assert.ok(Object.values(object.material).every(value => !value?.isTexture));
  });
  assert.ok(triangles > 0 && triangles <= 3000);
  assert.ok(meshes <= 17);
  assert.ok(palette.size <= 5);
});

test('reação termina em 0,8 segundo e não acumula ao receber novo gatilho', () => {
  const reaction = createDriverReaction();
  assert.equal(reaction.sample(0,0,false),0);
  assert.equal(reaction.trigger(1,0,false),true);
  assert.ok(reaction.sample(1.4,0,false) > .99);
  assert.equal(reaction.trigger(1.4,0,false),false);
  assert.equal(reaction.sample(1.81,0,false),0);
  assert.equal(reaction.trigger(2,0,false),true);
  reaction.cancel();
  assert.equal(reaction.sample(2.4,0,false),0);
});

test('movimento e preferência reduzida bloqueiam e cancelam a reação', () => {
  for (const speed of [.06,-.06,5]) {
    const reaction = createDriverReaction();
    assert.equal(reaction.trigger(0,speed,false),false);
    assert.equal(reaction.trigger(1,0,false),true);
    assert.equal(reaction.sample(1.2,speed,false),0);
    assert.equal(reaction.sample(1.4,0,false),0);
  }
  const reaction = createDriverReaction();
  assert.equal(reaction.trigger(0,0,true),false);
  assert.equal(reaction.trigger(1,0,false),true);
  assert.equal(reaction.sample(1.2,0,true),0);
  assert.equal(reaction.sample(1.4,0,false),0);
});
