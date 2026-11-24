import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../src/vendor/three.module.min.js';
import { createPilotRig } from '../src/pilot-rig.js';

test('flexão das falanges do piloto é estável e limitada à primeira pessoa', () => {
 const pilot=new THREE.Group(), bone=new THREE.Bone(); bone.name='index_02_l'; pilot.add(bone);
 const rig=createPilotRig(pilot,[]); const base=bone.quaternion.clone();
 rig.setFirstPerson(true); rig.update(1/60); const grip=bone.quaternion.clone();
 assert.ok(base.angleTo(grip)>.27 && base.angleTo(grip)<.29);
 rig.update(1/60); assert.ok(grip.angleTo(bone.quaternion)<1e-7);
 rig.setFirstPerson(false); rig.update(1/60); assert.ok(base.angleTo(bone.quaternion)<1e-7);
});

 test('arco das mãos é limitado sem amplificar saltos do volante', async () => {
 const { handTurn, HAND_TURN_LIMIT } = await import('../src/cabin.js');
 assert.equal(handTurn(-2),-HAND_TURN_LIMIT); assert.equal(handTurn(2),HAND_TURN_LIMIT);
 for (let wheel=-1.05;wheel<1.05;wheel+=Math.PI/240) assert.ok(Math.abs(handTurn(wheel+Math.PI/240)-handTurn(wheel))<=Math.PI/240+1e-12);
 });

test('piloto pré-posado mantém pose original das falanges', () => {
 const pilot=new THREE.Group(), bone=new THREE.Bone(); bone.name='index_02_l'; pilot.add(bone);
 const rig=createPilotRig(pilot,[],{preposed:true}); const base=bone.quaternion.clone();
 rig.setFirstPerson(true); rig.update(1/60); assert.ok(base.angleTo(bone.quaternion)<1e-7);
});
