import test from 'node:test';
import assert from 'node:assert/strict';
import { createVehicle, stepVehicle, haltVehicle, recoverVehicle, MAX_REVERSE_SPEED_KMH } from '../src/driving.js';
import { createJournal, nearbyInteraction } from '../src/discoveries.js';
import { DISCOVERIES, ROADS, NODES, OBSTACLES, WORLD_BOUNDS, MEMBER_LOCATIONS, nearestRoad, distance } from '../src/world-data.js';
import { planPath, navigationInput } from '../src/navigation.js';

function drive(vehicle, input, seconds, dt = 1 / 120) {
  for (let elapsed = 0; elapsed < seconds - dt / 2; elapsed += dt) stepVehicle(vehicle, input, dt);
  return vehicle;
}

test('ré atinge no máximo 15 km/h em diferentes passos e desacelera ao soltar', () => {
  assert.equal(MAX_REVERSE_SPEED_KMH, 15);
  for (const dt of [1 / 30, 1 / 60, 1 / 120]) {
    const vehicle = createVehicle(); vehicle.reverseReady = true;
    // Keep the vehicle at the open starting point to measure acceleration without hitting map boundaries.
    for (let t = 0; t < 5; t += dt) {
      vehicle.x = 0; vehicle.z = 0;
      stepVehicle(vehicle, {brake: true}, dt);
      assert.ok(Math.abs(vehicle.speed) * 3.6 <= 15 + 1e-9);
    }
    assert.ok(Math.abs(vehicle.speed * 3.6 + 15) < 1e-9);
    const speed = Math.abs(vehicle.speed); stepVehicle(vehicle, {}, dt);
    assert.ok(Math.abs(vehicle.speed) < speed);
  }
});
test('acelerar ganha velocidade; soltar preserva inércia e frear para', () => {
  const vehicle = createVehicle(); drive(vehicle, { throttle: true }, 1.5);
  assert.ok(vehicle.speed > 5 && vehicle.speed < 12);
  const speed = vehicle.speed, z = vehicle.z; drive(vehicle, {}, .5);
  assert.ok(vehicle.speed > 0 && vehicle.speed < speed); assert.ok(vehicle.z < z);
  drive(vehicle, { brake: true }, 3); assert.equal(vehicle.speed, 0);
});
test('frear continuamente não engata ré; soltar e pressionar novamente engata', () => {
  const vehicle = createVehicle(); drive(vehicle, { throttle: true }, 1);
  drive(vehicle, { brake: true }, 3); assert.equal(vehicle.speed, 0);
  drive(vehicle, {}, .1); drive(vehicle, { brake: true }, 1);
  assert.ok(vehicle.speed < -1 && vehicle.speed >= -6);
  haltVehicle(vehicle); assert.equal(vehicle.reverseReady, false); assert.equal(vehicle.speed, 0);
});
test('freio tem prioridade sobre acelerador e os limites de velocidade são respeitados', () => {
  const vehicle = createVehicle(); vehicle.speed = 12;
  drive(vehicle, { throttle: true, brake: true }, .5); assert.ok(vehicle.speed < 7);
  vehicle.speed = 30; stepVehicle(vehicle, { throttle: true }, 1 / 120); assert.ok(vehicle.speed <= 30);
  vehicle.speed = -6; vehicle.reverseReady = true; stepVehicle(vehicle, { brake: true }, 1 / 120); assert.ok(vehicle.speed >= -6);
});
test('direção muda a trajetória nos dois sentidos e não gira o carro parado', () => {
  const left = drive(createVehicle(), { throttle: true, steer: 1 }, 2);
  const right = drive(createVehicle(), { throttle: true, steer: -1 }, 2);
  assert.ok(left.x < -2); assert.ok(right.x > 2); assert.ok(left.heading > 0); assert.ok(right.heading < 0);
  const parked = drive(createVehicle(), { steer: 1 }, 1); assert.equal(parked.heading, 0);
});
test('integração mantém comportamento próximo em taxas diferentes de quadros', () => {
  const slow = drive(createVehicle(), { throttle: true, steer: -.3 }, 2, 1 / 30);
  const fast = drive(createVehicle(), { throttle: true, steer: -.3 }, 2, 1 / 120);
  assert.ok(distance(slow, fast) < .5); assert.ok(Math.abs(slow.speed - fast.speed) < .1);
});
test('colisões e limites impedem atravessar prédios ou sair da ilha', () => {
  const vehicle = createVehicle(); const obstacle = OBSTACLES[0];
  vehicle.x = obstacle.x; vehicle.z = obstacle.z + obstacle.radius + 2.35; vehicle.speed = 10;
  stepVehicle(vehicle, {}, 1 / 120); assert.equal(vehicle.speed, 0); assert.ok(distance(vehicle, obstacle) >= obstacle.radius + 2.3);
  vehicle.x = WORLD_BOUNDS.maxX - 3.01; vehicle.z = 0; vehicle.heading = -Math.PI / 2; vehicle.speed = 10;
  stepVehicle(vehicle, {}, 1 / 120); assert.equal(vehicle.speed, 0); assert.ok(vehicle.x <= WORLD_BOUNDS.maxX - 3);
  recoverVehicle(vehicle); assert.ok(nearestRoad(vehicle).distance < .001); assert.equal(vehicle.speed, 0);
});
test('peças das descobertas e o cemitério são sólidos sem bloquear ruas nem a chegada', async () => {
  const { DISCOVERY_SOLIDS, GRAVEYARD, roadGap, behind } = await import('../src/world-data.js');
  assert.equal(DISCOVERY_SOLIDS.length, DISCOVERIES.length * 3);
  // Disposição: histórias e integrantes ficam recuados da rua, fora da calçada, e olham para ela.
  for (const point of DISCOVERIES) assert.ok(Math.abs(roadGap(point) - 9.5) < .3);
  for (const point of MEMBER_LOCATIONS) {
    assert.ok(Math.abs(roadGap(point) - 8.5) < .3);
    assert.ok(roadGap(behind(point, -3)) < roadGap(point), 'a frente do integrante aponta para a rua');
  }
  // O ponto de chegada de cada história continua livre para o carro parar nele.
  for (const point of DISCOVERIES) assert.ok(!OBSTACLES.some(o => distance(o, point) < o.radius + 2.3));
  for (const solid of [...DISCOVERY_SOLIDS, { ...GRAVEYARD, radius: 7.4 }]) {
    assert.ok(OBSTACLES.some(o => o.x === solid.x && o.z === solid.z && o.radius === solid.radius));
    assert.ok(roadGap(solid) > solid.radius + 2.3, 'o colisor não invade o asfalto');
  }
  // De frente para o mural, o carro para antes da parede e a história continua ao alcance.
  const story = DISCOVERIES[0], wall = behind(story, 3.6);
  const vehicle = createVehicle(); Object.assign(vehicle, { ...behind(story, -9), heading: story.facing, speed: 20 });
  drive(vehicle, { throttle: true }, 3);
  assert.equal(vehicle.speed, 0); assert.ok(distance(vehicle, wall) >= 1.1 + 2.2);
  assert.equal(nearbyInteraction(vehicle)?.id, story.id);
  // Por trás da parede a ficha não abre.
  Object.assign(vehicle, behind(story, 8));
  assert.notEqual(nearbyInteraction(vehicle)?.id, DISCOVERIES[0].id);
});
test('ruas compartilham cruzamentos, têm desvios e deixam os integrantes fora da pista', () => {
  for (const road of ROADS) {
    assert.ok(distance(road.samples[0], NODES[road.from]) < 1e-8);
    assert.ok(distance(road.samples.at(-1), NODES[road.to]) < 1e-8);
    assert.ok(road.length > distance(NODES[road.from], NODES[road.to]));
  }
  for (const point of MEMBER_LOCATIONS) assert.ok(nearestRoad(point).distance > 8);
  assert.ok(ROADS.length >= NODES.length); // Connected loops offer alternate routes.
});
test('diário persiste descobertas válidas sem duplicação e ignora dados inválidos', () => {
  const saved = new Map(); const storage = { getItem: k => saved.get(k), setItem: (k, v) => saved.set(k, v) };
  const first = createJournal(storage); assert.equal(first.discover(DISCOVERIES[2].id), true);
  assert.equal(first.discover(DISCOVERIES[2].id), false); assert.equal(first.discover('invalid'), false);
  const second = createJournal(storage); assert.deepEqual([...second.known], [DISCOVERIES[2].id]);
  second.reset(); assert.equal(createJournal(storage).known.size, 0);
  assert.equal(createJournal({ getItem: () => '{broken' }).known.size, 0);
});
test('diário funciona quando acesso ao armazenamento é bloqueado', () => {
  const journal = createJournal({ getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } });
  journal.discover(DISCOVERIES[4].id); assert.equal(journal.known.size, 1); journal.reset(); assert.equal(journal.known.size, 0);
});
test('encontros dependem de distância no mundo e não atravessam prédios', () => {
  const vehicle = createVehicle(); assert.equal(nearbyInteraction(vehicle), null);
  Object.assign(vehicle, { x: DISCOVERIES[0].x, z: DISCOVERIES[0].z + 5 });
  assert.equal(nearbyInteraction(vehicle)?.id, DISCOVERIES[0].id);
  Object.assign(vehicle, { x: MEMBER_LOCATIONS[0].x, z: MEMBER_LOCATIONS[0].z + 5 });
  assert.equal(nearbyInteraction(vehicle)?.type, 'member');
});
for (const target of DISCOVERIES) test(`passeio chega a ${target.id} e freia sem prender em obstáculos`, () => {
  const vehicle = createVehicle(), navigation = planPath(vehicle, target); let arrived = false;
  for (let i = 0; i < 120 * 90; i++) {
    const input = navigationInput(vehicle, navigation);
    if (input.arrived) { arrived = true; break; }
    stepVehicle(vehicle, input, 1 / 120);
  }
  assert.ok(arrived); assert.ok(distance(vehicle, target) < 8); assert.ok(Math.abs(vehicle.speed) < 1);
  assert.equal(nearbyInteraction(vehicle)?.id, target.id);
});
test('os quatro portais podem ser percorridos em sequência pela malha viária', async () => {
  const { archiveStops } = await import('../src/discoveries.js');
  const vehicle = createVehicle();
  assert.deepEqual(archiveStops.map(stop => stop.era.act), [1, 2, 3, 4]);
  for (const stop of archiveStops) {
    const path = planPath(vehicle, stop);
    let arrived = false;
    for (let tick = 0; tick < 120 * 90; tick++) {
      const input = navigationInput(vehicle, path);
      if (input.arrived) { arrived = true; break; }
      stepVehicle(vehicle, input, 1 / 120);
    }
    assert.ok(arrived, stop.title);
    assert.ok(distance(vehicle,stop) < 8);
    assert.equal(nearbyInteraction(vehicle), null);
  }
});
