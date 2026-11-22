import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import * as THREE from '../src/vendor/three.module.min.js';
import { GLTFLoader } from '../src/vendor/GLTFLoader.js';
import { createDriver, createDriverReaction } from '../src/scene.js';
import { createPilotRig, PILOT_MODEL_URL, PILOT_V2_URL, PILOT_FALLBACK_URL } from '../src/pilot-rig.js';

test('motorista procedural preserva encaixes, orçamento e materiais sem texturas', () => {
  const palette = new Map();
  const material = color => {
    if (!palette.has(color)) palette.set(color, new THREE.MeshStandardMaterial({ color }));
    return palette.get(color);
  };
  const { driver, driverHead, upperArmL, upperArmR } = createDriver(material);
  assert.deepEqual(driver.position.toArray(), [-.54, .12, .42]);
  assert.deepEqual(driver.scale.toArray(), [1.22, 1.22, 1.22]);
  assert.deepEqual(driverHead.position.toArray(), [0, 2.35, .05]);
  assert.ok(upperArmL && upperArmR, 'braços do motorista precisam existir para girar com o volante');
  let triangles = 0, meshes = 0;
  driver.traverse(object => {
    if (!object.isMesh) return;
    meshes++;
    triangles += (object.geometry.index?.count ?? object.geometry.attributes.position.count) / 3;
    assert.ok(Object.values(object.material).every(value => !value?.isTexture));
  });
  assert.ok(triangles > 0 && triangles <= 3000);
  assert.ok(meshes <= 17);
  assert.ok(palette.size <= 5);
});

test('reação termina em 0,8 segundo e não acumula ao receber novo gatilho', () => {
  const reaction = createDriverReaction();
  assert.equal(reaction.sample(0, 0, false), 0);
  assert.equal(reaction.trigger(1, 0, false), true);
  assert.ok(reaction.sample(1.4, 0, false) > .99);
  assert.equal(reaction.trigger(1.4, 0, false), false);
  assert.equal(reaction.sample(1.81, 0, false), 0);
  assert.equal(reaction.trigger(2, 0, false), true);
  reaction.cancel();
  assert.equal(reaction.sample(2.4, 0, false), 0);
});

test('movimento e preferência reduzida bloqueiam e cancelam a reação', () => {
  for (const speed of [.06, -.06, 5]) {
    const reaction = createDriverReaction();
    assert.equal(reaction.trigger(0, speed, false), false);
    assert.equal(reaction.trigger(1, 0, false), true);
    assert.equal(reaction.sample(1.2, speed, false), 0);
    assert.equal(reaction.sample(1.4, 0, false), 0);
  }
  const reaction = createDriverReaction();
  assert.equal(reaction.trigger(0, 0, true), false);
  assert.equal(reaction.trigger(1, 0, false), true);
  assert.equal(reaction.sample(1.2, 0, true), 0);
  assert.equal(reaction.sample(1.4, 0, false), 0);
});

// ---------------------------------------------------------------------------
// Piloto GLB real (assets/models/driver-pilot.glb): validação binária e encaixe no Geep.
async function readPilot() {
  const bytes = await readFile(new URL('../assets/models/driver-pilot.glb', import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'comprimento do cabeçalho confere com o arquivo');
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4E4F534A, 'primeiro chunk é JSON');
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trim());
  const binHeader = 20 + jsonLength;
  assert.equal(bytes.readUInt32LE(binHeader + 4), 0x004E4942, 'segundo chunk é BIN');
  assert.ok(binHeader + 8 + bytes.readUInt32LE(binHeader) <= bytes.length);
  return { bytes, json };
}
function trianglesOf(json) {
  return json.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + json.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0);
}

test('driver-pilot.glb: estrutura binária, orçamento, esqueleto, clipe e nós do contrato', async () => {
  const { bytes, json } = await readPilot();
  assert.equal(bytes.length, 188920);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'db07755496a3426af1349b99dea99644918daf573b8c7b45608571fed9784200');
  assert.ok(json.meshes.length >= 1);
  const triangles = trianglesOf(json);
  assert.ok(triangles > 0 && triangles <= 2500, `${triangles} triângulos`);
  assert.equal(json.skins?.length, 1);
  assert.equal(json.skins[0].joints.length, 65);
  const clip = json.animations?.find(animation => animation.name === 'Driving_Loop');
  assert.ok(clip, 'clipe Driving_Loop presente');
  const names = new Set(json.nodes.map(node => node.name));
  for (const required of ['driver', 'driver-head', 'upperArmL', 'upperArmR', 'Head', 'spine_02', 'upperarm_l', 'upperarm_r']) assert.ok(names.has(required), `nó ${required}`);
  const joints = new Set(json.skins[0].joints.map(index => json.nodes[index].name));
  for (const bone of ['Head', 'spine_02', 'upperarm_l', 'upperarm_r']) assert.ok(joints.has(bone), `junta ${bone}`);
  assert.ok(clip.channels.every(channel => json.nodes[channel.target.node]));
});

test('driver-pilot.glb: nenhuma imagem ou buffer externo ao arquivo', async () => {
  const { json } = await readPilot();
  for (const image of json.images ?? []) assert.ok(!image.uri || image.uri.startsWith('data:'), `imagem externa: ${image.uri}`);
  for (const buffer of json.buffers ?? []) assert.ok(!buffer.uri || buffer.uri.startsWith('data:'), `buffer externo: ${buffer.uri}`);
  assert.equal((json.images ?? []).length, 0);
});

test('DRIVER-CREDITS.txt: Quaternius CC0, acessórios autorais e métricas conferem com o GLB', async () => {
  const { bytes, json } = await readPilot();
  const credits = await readFile(new URL('../assets/models/DRIVER-CREDITS.txt', import.meta.url), 'utf8');
  assert.match(credits, /Quaternius/); assert.match(credits, /CC0 1\.0/); assert.match(credits, /https:\/\/quaternius\.com\//);
  for (const item of ['jaqueta', 'viseira', 'luvas', 'Kong FM']) assert.ok(credits.includes(item), item);
  assert.ok(credits.includes(createHash('sha256').update(bytes).digest('hex')), 'SHA-256 do arquivo distribuído');
  assert.ok(credits.includes(`${json.meshes.length} malhas`));
  assert.ok(credits.includes(trianglesOf(json).toLocaleString('pt-BR')));
  assert.ok(credits.includes('195 canais'));
  assert.ok(credits.includes(`${bytes.length.toLocaleString('pt-BR')} bytes`));
});

test('driver-pilot.glb animado: o Driving_Loop leva as mãos ao volante calibrado do Geep e createPilotRig não acumula rotação aditiva', async () => {
  const bytes = await readFile(new URL('../assets/models/driver-pilot.glb', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(buffer, '', resolve, reject));
  const pilot = gltf.scene.getObjectByName('driver');
  pilot.position.set(-0.6213, 0.208, 0.4471); pilot.scale.setScalar(1.22);
  const rig = createPilotRig(pilot, gltf.animations);
  pilot.updateMatrixWorld(true);
  const at = name => pilot.getObjectByName(name).getWorldPosition(new THREE.Vector3());
  // Aros 10h e 2h do volante medidos em driver_fit.json; tolerância de 15 cm para a mão (osso do punho).
  assert.ok(at('hand_l').distanceTo(new THREE.Vector3(-0.8536, 2.2251, -0.3051)) < .15);
  assert.ok(at('hand_r').distanceTo(new THREE.Vector3(-0.389, 2.2251, -0.3051)) < .15);
  assert.ok(Math.abs(at('Head').x + 0.6209) < .05 && Math.abs(at('Head').y - 2.3872) < .05, 'cabeça no pivô medido');
  // Raycast no piloto inteiro (driver-head é um nó vazio): o raio de frente acerta uma malha skinned.
  pilot.traverse(object => { if (object.isMesh) object.frustumCulled = false; });
  const hits = new THREE.Raycaster(new THREE.Vector3(-0.62, 2.0, 10), new THREE.Vector3(0, 0, -1)).intersectObjects([pilot], true);
  assert.ok(hits.length > 0 && hits[0].object.isSkinnedMesh);
  // Rotação aditiva via createPilotRig não acumula quando voltamos ao volante reto (inclusive com dt=0 / reduced motion).
  const arm = pilot.getObjectByName('upperarm_l'), rest = arm.quaternion.clone();
  rig.update(0, { yaw: .4, steering: 1, greeting: .8 });
  assert.ok(arm.quaternion.angleTo(rest) > .1);
  rig.update(0, { yaw: 0, steering: 0, greeting: 0 });
  assert.deepEqual(arm.quaternion.toArray(), rest.toArray());
});

test('installVehicle preserva a posição calibrada do piloto GLB quando o Geep carrega depois (if (!pilotRig))', async () => {
  const source = await readFile(new URL('../src/scene.js', import.meta.url), 'utf8');
  assert.match(source, /if\s*\(!pilotRig\)\s*driver\.position\.set\(cabin\.eye\.x/);
});

test('1ª pessoa usa jaqueta e luvas do driver-pilot.glb no volante via IK e oculta rosto e braços de bloco', async () => {
  const bytes = await readFile(new URL('../assets/models/driver-pilot.glb', import.meta.url));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(buffer, '', resolve, reject));
  const car = new THREE.Group();
  const pilot = gltf.scene.getObjectByName('driver');
  pilot.position.set(-0.6213, 0.208, 0.4471); pilot.scale.setScalar(1.22);
  car.add(pilot); car.updateMatrixWorld(true);
  const rig = createPilotRig(pilot, gltf.animations);
  rig.setFirstPerson(true);
  assert.ok(rig.hidden.length >= 4 && rig.hidden.every(mesh => mesh.visible === false), 'malhas da cabeça/corpo base ocultas em 1ª pessoa');
  assert.ok(rig.jacket.length >= 2 && rig.jacket.every(mesh => mesh.visible === true), 'jaqueta e luvas do piloto permanecem visíveis em 1ª pessoa');
  const handsStraight = { left: new THREE.Vector3(-0.88, 2.28, -0.24), right: new THREE.Vector3(-0.37, 2.28, -0.24) };
  assert.equal(rig.reach(handsStraight, car), true);
  const handL = pilot.getObjectByName('hand_l').getWorldPosition(new THREE.Vector3());
  const handR = pilot.getObjectByName('hand_r').getWorldPosition(new THREE.Vector3());
  assert.ok(handL.distanceTo(handsStraight.left) < .2, `mão esquerda próxima ao aro (${handL.distanceTo(handsStraight.left).toFixed(3)} m)`);
  assert.ok(handR.distanceTo(handsStraight.right) < .2, `mão direita próxima ao aro (${handR.distanceTo(handsStraight.right).toFixed(3)} m)`);
  // Ao esterçar o volante, as mãos acompanham o giro em direções opostas em Y.
  const handsTurn = { left: new THREE.Vector3(-0.82, 2.08, -0.24), right: new THREE.Vector3(-0.43, 2.48, -0.24) };
  rig.reach(handsTurn, car);
  const handLTurn = pilot.getObjectByName('hand_l').getWorldPosition(new THREE.Vector3());
  const handRTurn = pilot.getObjectByName('hand_r').getWorldPosition(new THREE.Vector3());
  assert.ok(handLTurn.y < handL.y - .05 && handRTurn.y > handR.y + .05, 'braços acompanham o esterço do volante em 1ª pessoa');
});

test('driver-pilot-v2.glb: modelo com mãos menos facetadas (2.806 tris, pulsos soldados) carrega com fallback ao v1 e encaixa no volante', async () => {
  // Cadeia: v4 (atual) -> v2 -> original. O v4 é verificado abaixo; o v2 segue íntegro como fallback.
  assert.equal(PILOT_MODEL_URL, './assets/models/driver-pilot-v4.glb');
  assert.equal(PILOT_V2_URL, './assets/models/driver-pilot-v2.glb');
  assert.equal(PILOT_FALLBACK_URL, './assets/models/driver-pilot.glb');
  const v4 = await readFile(new URL('../assets/models/driver-pilot-v4.glb', import.meta.url));
  assert.equal(v4.length, 250440);
  assert.equal(createHash('sha256').update(v4).digest('hex'), '044f53931cbd9436f636723a67672412ad21b279e2dd5feee33c76a551a79169');
  const v4json = JSON.parse(v4.toString('utf8', 20, 20 + v4.readUInt32LE(12)).trim());
  assert.equal(v4json.meshes.length, 6); assert.equal(v4json.skins[0].joints.length, 65); assert.ok(v4json.animations.some(a => a.name === 'Driving_Loop'));
  const bytes = await readFile(new URL('../assets/models/driver-pilot-v2.glb', import.meta.url));
  assert.equal(bytes.length, 243068);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), 'a956e63c7c978bc7121503d155306ff5ffd7aca9b1f899f07f7bb4efddf399ea');
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength).trim());
  assert.equal(json.meshes.length, 6);
  assert.equal(trianglesOf(json), 2806);
  assert.equal(json.skins?.[0]?.joints?.length, 65);
  assert.ok(json.animations?.some(a => a.name === 'Driving_Loop'));
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(buffer, '', resolve, reject));
  const car = new THREE.Group();
  const pilot = gltf.scene.getObjectByName('driver');
  pilot.position.set(-0.6213, 0.208, 0.4471); pilot.scale.setScalar(1.22);
  car.add(pilot); car.updateMatrixWorld(true);
  const rig = createPilotRig(pilot, gltf.animations);
  rig.setFirstPerson(true);
  assert.equal(rig.jacket.length, 5);
  const handsStraight = { left: new THREE.Vector3(-0.88, 2.28, -0.24), right: new THREE.Vector3(-0.37, 2.28, -0.24) };
  assert.equal(rig.reach(handsStraight, car), true);
  const handL = pilot.getObjectByName('hand_l').getWorldPosition(new THREE.Vector3());
  const handR = pilot.getObjectByName('hand_r').getWorldPosition(new THREE.Vector3());
  assert.ok(handL.distanceTo(handsStraight.left) < .2);
  assert.ok(handR.distanceTo(handsStraight.right) < .2);
});
