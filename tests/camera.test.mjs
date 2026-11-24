import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ERA_GATES, ROADS, CITY_LOTS, TREE_LOCATIONS } from '../src/world-data.js';
import * as THREE from '../src/vendor/three.module.min.js';
import { createCameraBlockers, clearReach, createTravelCamera, CAMERA_TUNING, TRAVEL_FOV, TRAVEL_LOOK_HEIGHT } from '../src/scene.js';

test('câmera de viagem usa enquadramento moderado', () => {
  const result = createTravelCamera().compute({ x: 0, z: 0, heading: 0, speed: 0 }, { reduced: true });
  assert.equal(TRAVEL_FOV, 60);
  assert.equal(TRAVEL_LOOK_HEIGHT, 7);
  assert.equal(result.look.y, TRAVEL_LOOK_HEIGHT);
});

// Percorre uma rua a velocidade constante e devolve, por quadro, a câmera final (compute + follow).
function drive(road, { speed = 28, offset = 0, reverse = false, dt = 1 / 60 } = {}) {
  const pts = reverse ? [...road.samples].reverse() : road.samples;
  const cam = createTravelCamera(), position = new THREE.Vector3(), target = new THREE.Vector3(), desired = new THREE.Vector3(), look = new THREE.Vector3();
  const frames = []; let heading = null, i = 0, acc = 0, n = 0;
  const seg = k => Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].z - pts[k].z);
  while (i < pts.length - 1) {
    const a = pts[i], b = pts[i + 1], f = Math.min(1, acc / seg(i)), len = seg(i) || 1;
    const x = a.x + (b.x - a.x) * f - (b.z - a.z) / len * offset, z = a.z + (b.z - a.z) * f + (b.x - a.x) / len * offset;
    const aim = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    if (heading === null) heading = aim;
    heading += THREE.MathUtils.clamp(Math.atan2(Math.sin(aim - heading), Math.cos(aim - heading)), -1.6 * dt, 1.6 * dt);
    const pivot = { x, z, heading, speed };
    const state = cam.compute(pivot, { dt, t: n * dt, desiredCamera: desired, look });
    cam.follow(position, target, { desiredCamera: desired, look, pivot, dt, blend: 1 - Math.exp(-dt * 4), snap: n === 0 });
    frames.push({ pivot, state, position: position.clone() });
    n++; acc += speed * dt; while (i < pts.length - 1 && acc >= seg(i)) { acc -= seg(i); i++; }
  }
  return frames;
}
const inLot = p => CITY_LOTS.some(l => { const c = Math.cos(l.rotation), s = Math.sin(l.rotation); return p.y < l.floors * 3.2 + 1.5 && Math.abs((p.x - l.x) * c - (p.z - l.z) * s) < l.w / 2 && Math.abs((p.x - l.x) * s + (p.z - l.z) * c) < l.d / 2; });

test('câmera: só a malha principal (prédios) bloqueia; postes decorativos dos portais ficam de fora', () => {
  const blockers = createCameraBlockers();
  // Copas das árvores entram como bloqueadores finos (2,2 m de raio): são o único tipo pequeno, de propósito.
  assert.equal(blockers.length, CITY_LOTS.length + 1 + TREE_LOCATIONS.length);
  const solid = blockers.slice(0, CITY_LOTS.length + 1);
  for (const b of solid) assert.ok(Math.min(b.rw, b.rd) * 2 >= 5, `bloqueador pequeno (${(b.rw * 2).toFixed(1)}x${(b.rd * 2).toFixed(1)} m) entrou no raio da câmera`);
});

test('clearReach varia de forma contínua: sem degraus de .75 m ao aproximar-se de uma parede', () => {
  // Parede única na linha de visão: ao andar 5 cm, o alcance muda ~5 cm (antes mudava em degraus de .75 m).
  const wall = [{ x: 0, z: -30, cos: 1, sin: 0, halfW: 20, halfD: 6, rw: 18.8, rd: 4.8, top: 40 }];
  let worst = 0, prev = null, seen = 0;
  for (let step = 0; step < 300; step++) {
    const z = -step * .05;
    const reach = clearReach(0, z, Math.PI, 24, 11.8, wall);
    if (reach < 24) seen++;
    if (prev !== null) worst = Math.max(worst, Math.abs(reach - prev));
    prev = reach;
  }
  assert.ok(seen > 20, 'a parede nunca bloqueou');
  assert.ok(worst < .2, `alcance saltou ${worst.toFixed(2)} m em 5 cm de deslocamento`);
});

test('braço da câmera aproxima rápido e recua devagar, com teto de velocidade', () => {
  const cam = createTravelCamera(), blockers = [{ x: 0, z: -40, cos: 1, sin: 0, halfW: 12, halfD: 12, rw: 10.8, rd: 10.8, top: 40 }];
  const wall = createTravelCamera(blockers), desired = new THREE.Vector3(), look = new THREE.Vector3(), dt = 1 / 60;
  const reaches = [];
  for (let n = 0; n < 240; n++) {
    // Carro parado em (0, -1); a parede só existe entre os quadros 30 e 120.
    const near = n >= 30 && n < 120, cam2 = near ? wall : cam;
    reaches.push(cam2.compute({ x: 0, z: -1 - (near ? 0 : 0), heading: Math.PI, speed: 0 }, { dt, t: n * dt, desiredCamera: desired, look }).smoothReach);
  }
  let maxIn = 0, maxOut = 0;
  for (let n = 1; n < reaches.length; n++) { const d = reaches[n] - reaches[n - 1]; if (d < 0) maxIn = Math.max(maxIn, -d); else maxOut = Math.max(maxOut, d); }
  assert.ok(maxIn <= CAMERA_TUNING.reachInMax * dt + 1e-6 && maxOut <= CAMERA_TUNING.reachOutMax * dt + 1e-6, `in=${maxIn} out=${maxOut}`);
  assert.ok(reaches.every(r => r >= 9.5));
});

test('follow(): perto de prédios, em 3 deslocamentos laterais e 2 velocidades, a câmera nunca entra no prédio nem salta', () => {
  let jumps = 0, clipped = 0, minGap = Infinity, frames = 0;
  for (const offset of [-5, 0, 5]) for (const speed of [12, 28]) for (const road of ROADS) {
    const run = drive(road, { speed, offset });
    run.forEach((f, n) => {
      if (n < 30) return;
      frames++; const prev = run[n - 1];
      const dist = q => Math.hypot(q.position.x - q.pivot.x, q.position.y - CAMERA_TUNING.pivotY, q.position.z - q.pivot.z);
      if (Math.abs(dist(f) - dist(prev)) > .5) jumps++;
      if (inLot(f.position)) clipped++;
      // Folga até a caixa do carro (3,6 x 3,6 x 7 m): nunca atravessa o carro/piloto.
      const c = Math.cos(f.pivot.heading), s = Math.sin(f.pivot.heading), dx = f.position.x - f.pivot.x, dz = f.position.z - f.pivot.z;
      minGap = Math.min(minGap, Math.hypot(Math.max(0, Math.abs(dx * c - dz * s) - 1.8), Math.max(0, f.position.y - 3.6), Math.max(0, Math.abs(dx * s + dz * c) - 3.5)));
    });
  }
  assert.ok(frames > 10000);
  assert.equal(clipped, 0, `${clipped} quadros com a câmera dentro de um prédio`);
  assert.equal(jumps, 0, `${jumps} quadros com salto > .5 m/quadro`);
  assert.ok(minGap > 4, `a câmera chegou a ${minGap.toFixed(2)} m da caixa do carro`);
});

test('follow(): encostado numa parede a câmera converge sem oscilar e recua só depois que a parede some', () => {
  const lot = { x: 0, z: -14, cos: 1, sin: 0, halfW: 5, halfD: 5, rw: 4, rd: 4, top: 40 };
  const cam = createTravelCamera([lot]), position = new THREE.Vector3(), target = new THREE.Vector3(), desired = new THREE.Vector3(), look = new THREE.Vector3(), dt = 1 / 60;
  const pivot = { x: 0, z: 0, heading: Math.PI, speed: 0 };
  const dist = [];
  for (let n = 0; n < 300; n++) {
    cam.compute(pivot, { dt, t: n * dt, desiredCamera: desired, look });
    cam.follow(position, target, { desiredCamera: desired, look, pivot, dt, blend: 1 - Math.exp(-dt * 4), snap: n === 0 });
    dist.push(Math.hypot(position.x, position.y - CAMERA_TUNING.pivotY, position.z));
  }
  let flips = 0;
  for (let n = 2; n < dist.length; n++) if (Math.sign(dist[n] - dist[n - 1]) * Math.sign(dist[n - 1] - dist[n - 2]) < 0 && Math.abs(dist[n] - dist[n - 1]) > .01) flips++;
  assert.equal(flips, 0, 'a distância da câmera oscilou parada diante da parede');
  assert.ok(dist.every(d => d >= CAMERA_TUNING.minArm - 1e-6), 'câmera abaixo da distância mínima');
});


test('atravessar o centro dos 4 ERA_GATES mantém reach === radius sem parede invisível no vão', () => {
  const blockers = createCameraBlockers();
  assert.equal(ERA_GATES.length, 4);
  for (const gate of ERA_GATES) {
    const radius = 24, height = 11.8;
    for (const offset of [-6, -3, 0, 3, 6]) {
      const x = gate.x + Math.sin(gate.heading) * offset;
      const z = gate.z + Math.cos(gate.heading) * offset;
      const reach = clearReach(x, z, gate.heading + .16, radius, height, blockers);
      assert.equal(reach, radius, `portal do Ato ${gate.era + 1} bloqueou a câmera no centro da pista (offset=${offset})`);
    }
  }
});

test('manobra de ré curta não produz flip de 180° nem salto brusco na posição da câmera', () => {
  const cam = createTravelCamera();
  const vehicle = { x: 0, z: -15, heading: 0, speed: 6 };
  const forward = cam.compute(vehicle, { dt: 1 / 60, t: 1 });
  const prevPos = forward.desiredCamera.clone();

  // Passa por parada e entra em ré curta (-0.5 m/s e -3 m/s).
  for (const speed of [0, -.15, -.35, -1.5, -3.5]) {
    vehicle.speed = speed;
    vehicle.z += speed * (1 / 60);
    const step = cam.compute(vehicle, { dt: 1 / 60, t: 1.02 });
    const jump = step.desiredCamera.distanceTo(prevPos);
    assert.ok(jump < 1.2, `salto brusco na câmera durante ré (speed=${speed}, jump=${jump.toFixed(2)}m)`);
    const angleDiff = Math.abs(Math.atan2(Math.sin(step.smoothViewAngle - forward.smoothViewAngle), Math.cos(step.smoothViewAngle - forward.smoothViewAngle)));
    assert.ok(angleDiff < .2, `flip angular indevido na ré (${angleDiff.toFixed(3)} rad)`);
    prevPos.copy(step.desiredCamera);
  }
});

test('contornar quarteirões e obstáculos suaviza smoothReach e escala effectiveHeight sem mergulho abrupto', () => {
  const cam = createTravelCamera();
  const road = ROADS[1];
  let prev = null;
  for (let i = 0; i < road.samples.length - 1; i++) {
    const a = road.samples[i], b = road.samples[i + 1];
    const heading = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    const state = cam.compute({ x: a.x, z: a.z, heading, speed: 10 }, { dt: 1 / 30, t: i / 30 });
    assert.ok(state.smoothReach >= 9.5 && state.smoothReach <= state.radius + 1e-6);
    assert.ok(state.effectiveHeight >= 5.8 && state.effectiveHeight <= 12.5);
    if (prev) {
      const stepDist = state.desiredCamera.distanceTo(prev);
      assert.ok(stepDist < 12, `transição de câmera saltou ${stepDist.toFixed(2)}m ao contornar quarteirão`);
    }
    prev = state.desiredCamera.clone();
  }
});

test('installVehicle remove driver e cabin.root antes de descartar geometrias do carro temporário', async () => {
  const source = await readFile(new URL('../src/scene.js', import.meta.url), 'utf8');
  const removeIdx = source.indexOf('car.remove(driver, cabin.root)');
  const disposeIdx = source.indexOf('car.traverse(object => { if (object.isMesh) object.geometry.dispose(); })');
  assert.ok(removeIdx > 0 && disposeIdx > removeIdx, 'car.remove(driver, cabin.root) deve preceder car.traverse(...dispose())');
});

test('vista aérea aumenta camera.near para evitar z-fighting no chão e mantém plaza abaixo de regional-grounds', async () => {
  const source = await readFile(new URL('../src/scene.js', import.meta.url), 'utf8');
  assert.match(source, /camera\.near\s*=\s*firstPerson\s*\?[^;]*overview\s*\?[^;]*Math\.min\(20/);
  assert.match(source, /cylinder\(city,\s*17,\s*17,\s*\.06,\s*\[region\.x,\s*-\.20,\s*region\.z\]/);
});
