import test from 'node:test';
import assert from 'node:assert/strict';
import { buildStops, orderTour, createStopProgress, speedCap, takeOver, TOUR_TOTAL, PROGRESS_KEY, SLOW_ZONE_M, ARRIVE_M } from '../src/guided-tour.js';
import { ERA_GATES, CITY_ERAS, DISCOVERIES, roadGap, nearestRoad, WORLD_BOUNDS } from '../src/world-data.js';
import { tracks } from '../src/content.js';
import { planPath, navigationInput, CRUISE_SPEED_MS } from '../src/navigation.js';
import { createVehicle, stepVehicle, haltVehicle } from '../src/driving.js';
import { distance } from '../src/world-data.js';

const eraTracks = ['clint', 'melancholy', 'revolving', 'saturnz'];
const stops = buildStops({ gates: ERA_GATES, cityEras: CITY_ERAS, eraTracks, discoveries: DISCOVERIES, tracks });

class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

test('são exatamente 9 paradas: 4 eras da estrada e 5 pontos de história, com ids únicos', () => {
  assert.equal(stops.length, TOUR_TOTAL);
  assert.equal(TOUR_TOTAL, 9);
  assert.equal(stops.filter(stop => stop.kind === 'era').length, 4);
  assert.equal(stops.filter(stop => stop.kind === 'historia').length, 5);
  assert.equal(new Set(stops.map(stop => stop.id)).size, 9);
});

test('título, ano e resumo vêm do conteúdo existente (nenhum texto novo)', () => {
  for (const [index, gate] of ERA_GATES.entries()) {
    const era = CITY_ERAS[gate.era];
    const stop = stops.find(item => item.id === `era-${era.id}`);
    assert.equal(stop.title, era.title); assert.equal(stop.year, era.years); assert.equal(stop.summary, era.summary);
    assert.ok(index >= 0);
  }
  for (const point of DISCOVERIES) {
    const stop = stops.find(item => item.id === point.id);
    assert.equal(stop.title, point.title); assert.equal(stop.year, point.label); assert.equal(stop.summary, point.text);
  }
  for (const stop of stops) {
    assert.ok(stop.title && stop.year && stop.summary, `parada ${stop.id} sem texto`);
    assert.ok(stop.trackIndex >= 0 && stop.trackIndex < tracks.length, `faixa inválida em ${stop.id}`);
  }
});

test('a ordem do passeio visita as 9 paradas uma única vez, de forma determinística', () => {
  const start = { x: -18, z: -25 };
  const order = orderTour(stops, start);
  assert.equal(order.length, 9);
  assert.equal(new Set(order.map(stop => stop.id)).size, 9);
  assert.deepEqual(orderTour(stops, start).map(stop => stop.id), order.map(stop => stop.id));
  assert.equal(order[0].id, stops.reduce((best, stop) => Math.hypot(stop.x - start.x, stop.z - start.z) < Math.hypot(best.x - start.x, best.z - start.z) ? stop : best).id, 'começa pela parada mais próxima');
});

test('o trajeto automático segue a malha de estradas: nenhum ponto sai da pista ou atravessa prédio', () => {
  const order = orderTour(stops, { x: -18, z: -25 });
  let total = 0;
  for (let i = 0; i < order.length; i++) {
    const from = i === 0 ? { x: -18, z: -25 } : order[i - 1];
    const target = nearestRoad(order[i]);
    const path = planPath(from, { x: target.x, z: target.z, title: order[i].title });
    assert.ok(path.points.length > 2, `trecho ${i} sem caminho`);
    for (const point of path.points) {
      assert.ok(roadGap(point) <= 1.5, `ponto fora da pista no trecho ${i}: folga ${roadGap(point).toFixed(2)}`);
      assert.ok(point.x >= WORLD_BOUNDS.minX && point.x <= WORLD_BOUNDS.maxX && point.z >= WORLD_BOUNDS.minZ && point.z <= WORLD_BOUNDS.maxZ, 'fora do mundo');
    }
    total += path.points.length;
  }
  assert.ok(total > 50);
});

test('progresso: a primeira visita conta, a repetida não; ids desconhecidos são ignorados', () => {
  const storage = new MemoryStorage();
  const progress = createStopProgress(storage, stops.map(stop => stop.id));
  assert.equal(progress.count, 0);
  assert.equal(progress.visit(stops[0].id), true);
  assert.equal(progress.visit(stops[0].id), false, 'visita repetida não soma');
  assert.equal(progress.visit('nao-existe'), false);
  assert.equal(progress.count, 1);
  assert.equal(progress.total, 9);
  assert.equal(progress.has(stops[0].id), true);
});

test('progresso persiste no localStorage e volta igual numa nova sessão', () => {
  const storage = new MemoryStorage();
  const first = createStopProgress(storage, stops.map(stop => stop.id));
  first.visit(stops[2].id); first.visit(stops[5].id);
  const again = createStopProgress(storage, stops.map(stop => stop.id));
  assert.equal(again.count, 2);
  assert.ok(again.has(stops[2].id) && again.has(stops[5].id));
  assert.ok(storage.getItem(PROGRESS_KEY).includes(stops[2].id));
});

test('dados corrompidos ou de outra versão viram progresso zero, sem quebrar o jogo', () => {
  const broken = new MemoryStorage(); broken.setItem(PROGRESS_KEY, '{quebrado');
  assert.equal(createStopProgress(broken, stops.map(stop => stop.id)).count, 0);
  const old = new MemoryStorage(); old.setItem(PROGRESS_KEY, JSON.stringify({ version: 9, visited: [stops[0].id] }));
  assert.equal(createStopProgress(old, stops.map(stop => stop.id)).count, 0);
  assert.equal(createStopProgress(null, stops.map(stop => stop.id)).count, 0, 'sem localStorage');
});

test('chega a 9/9 e marca como completo; o toast depende de a visita ser nova', () => {
  const progress = createStopProgress(new MemoryStorage(), stops.map(stop => stop.id));
  let newVisits = 0;
  for (const stop of stops) if (progress.visit(stop.id)) newVisits++;
  assert.equal(newVisits, 9);
  assert.equal(progress.count, 9);
  assert.equal(progress.complete, true);
  assert.equal(progress.visit(stops[0].id), false, 'depois de 9/9 nada conta de novo');
});

test('velocidade: livre longe das paradas, reduzida na zona de chegada e mínima ao chegar', () => {
  assert.equal(speedCap(SLOW_ZONE_M + 10), Infinity);
  assert.ok(speedCap(SLOW_ZONE_M - 1) < 16.51);
  assert.equal(speedCap(ARRIVE_M - 1), 1.5);
  let previous = Infinity;
  for (let d = SLOW_ZONE_M; d >= 0; d -= 1) { const cap = speedCap(d); assert.ok(cap <= previous + 1e-9, `velocidade sobe ao chegar em ${d} m`); previous = cap; }
});

test('passeio guiado completo (9/9 paradas, >= 600 amostras): Catmull-Rom + look-ahead, cruzeiro ~55-65 km/h nas retas, esterço gradual e 0 amostras fora do asfalto', () => {
  assert.ok(CRUISE_SPEED_MS * 3.6 >= 55 && CRUISE_SPEED_MS * 3.6 <= 65, 'velocidade de cruzeiro alvo entre 55 e 65 km/h');
  const vehicle = createVehicle();
  const order = orderTour(stops, vehicle);
  const progress = createStopProgress(new MemoryStorage(), stops.map(s => s.id));
  let totalTicks = 0, sampleCount = 0, offAsphalt = 0, maxSpeedKmh = 0, maxSteerDelta = 0, prevSteering = 0;

  for (let i = 0; i < order.length; i++) {
    const stop = order[i];
    const roadPt = nearestRoad(stop);
    const target = { x: roadPt.x, z: roadPt.z, title: stop.title };
    const dest = planPath(vehicle, target);
    // Gira parado apenas se o próximo trecho apontar fortemente para trás (> 1.85 rad)
    let aimIdx = dest.index;
    while (aimIdx < dest.points.length - 1 && distance(vehicle, dest.points[aimIdx]) < 8) aimIdx++;
    const nextPt = dest.points[aimIdx];
    const targetHeading = Math.atan2(-(nextPt.x - vehicle.x), -(nextPt.z - vehicle.z));
    let align = Math.abs(Math.atan2(Math.sin(targetHeading - vehicle.heading), Math.cos(targetHeading - vehicle.heading))) > 1.85 ? targetHeading : null;

    let arrived = false;
    for (let tick = 0; tick < 120 * 90; tick++) {
      totalTicks++;
      if (align !== null) {
        if (Math.abs(vehicle.speed) > .3) stepVehicle(vehicle, { throttle: false, brake: true, steer: 0 }, 1 / 120);
        else {
          const diff = Math.atan2(Math.sin(align - vehicle.heading), Math.cos(align - vehicle.heading));
          if (Math.abs(diff) < .03) { vehicle.heading = align; align = null; }
          else vehicle.heading += Math.sign(diff) * Math.min(Math.abs(diff), 1.6 / 120);
          stepVehicle(vehicle, { throttle: false, brake: true, steer: 0 }, 1 / 120);
        }
      } else {
        const d = distance(vehicle, target);
        if (d < ARRIVE_M) { arrived = true; progress.visit(stop.id); haltVehicle(vehicle); prevSteering = 0; break; }
        let nav = navigationInput(vehicle, dest);
        if (nav.arrived) { arrived = true; progress.visit(stop.id); haltVehicle(vehicle); prevSteering = 0; break; }
        if (Math.abs(vehicle.speed) > speedCap(d)) nav = { ...nav, throttle: false, brake: true };
        stepVehicle(vehicle, nav, 1 / 120);
        maxSteerDelta = Math.max(maxSteerDelta, Math.abs(vehicle.steering - prevSteering));
        prevSteering = vehicle.steering;
      }
      maxSpeedKmh = Math.max(maxSpeedKmh, vehicle.speed * 3.6);
      if (totalTicks % 15 === 0) {
        sampleCount++;
        if (vehicle.surface !== 'asfalto' || roadGap(vehicle) > .01) offAsphalt++;
      }
    }
    assert.ok(arrived, `não chegou à parada ${i + 1}: ${stop.id}`);
  }
  assert.equal(progress.count, 9, '9/9 paradas visitadas');
  assert.ok(sampleCount >= 600, `amostras coletadas (${sampleCount}) devem ser >= 600`);
  assert.equal(offAsphalt, 0, `${offAsphalt} amostras fora do asfalto`);
  assert.ok(maxSpeedKmh >= 50 && maxSpeedKmh <= 65, `velocidade máxima de cruzeiro (${maxSpeedKmh.toFixed(1)} km/h) na faixa de cruzeiro`);
  assert.ok(maxSteerDelta < .03, `esterço das rodas dianteiras gradual (${maxSteerDelta.toFixed(4)} rad/tick)`);
});

test('assumir o volante: WASD e setas encerram o passeio sem apagar o progresso; outras teclas não', () => {
  const tour = { active: true, index: 3 };
  for (const key of ['w', 'A', 's', 'd', 'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight']) {
    const next = takeOver(tour, key);
    assert.equal(next.active, false, `tecla ${key} deve assumir o volante`);
    assert.equal(next.takenOverAt, 3, 'a parada atual é guardada');
  }
  assert.equal(takeOver(tour, 'Enter').active, true, 'Enter não assume o volante');
  assert.equal(takeOver({ active: false, index: 1 }, 'w').active, false, 'sem passeio, nada muda');
});

import { stopIdFor } from '../src/guided-tour.js';

test('contagem pela tecla E: história conta pelo id do ponto; portal de era conta como era-<id>; o resto não conta', () => {
  assert.equal(stopIdFor({ type: 'discovery', id: DISCOVERIES[0].id }), DISCOVERIES[0].id);
  assert.equal(stopIdFor({ type: 'archive', id: 'explosao' }), 'era-explosao');
  assert.equal(stopIdFor({ type: 'member', id: 'x' }), null, 'integrante não é parada');
  assert.equal(stopIdFor(null), null);
  for (const hit of [{ type: 'discovery', id: DISCOVERIES[0].id }, { type: 'archive', id: 'plastic' }]) {
    assert.ok(stops.some(stop => stop.id === stopIdFor(hit)), 'o id existe nas 9 paradas');
  }
});

test('as 9 paradas contam uma única vez cada, por E ou pelo passeio, mesmo com repetição', () => {
  const progress = createStopProgress(new MemoryStorage(), stops.map(stop => stop.id));
  const hits = [...DISCOVERIES.map(point => ({ type: 'discovery', id: point.id })), ...ERA_GATES.map(gate => ({ type: 'archive', id: CITY_ERAS[gate.era].id }))];
  let fresh = 0;
  for (const hit of [...hits, ...hits]) if (progress.visit(stopIdFor(hit))) fresh++;
  assert.equal(fresh, 9, 'cada parada soma uma vez');
  assert.equal(progress.count, 9);
  assert.equal(progress.complete, true);
});

import { localTrackFor } from '../src/guided-tour.js';

test('o player local da Kong FM acompanha o passeio: era plástico toca Maré de plástico (1); as demais, Concreto (0)', () => {
  assert.equal(localTrackFor({ id: 'era-plastic' }), 1);
  for (const stop of stops.filter(stop => stop.id !== 'era-plastic')) assert.equal(localTrackFor(stop), 0, stop.id);
  assert.equal(localTrackFor(undefined), 0);
});

import { clampFrameDelta, MAX_FRAME_DELTA_S } from '../src/frame-timing.js';
test('delta do quadro é limitado a 50 ms: uma pausa do navegador não vira salto de física', () => {
  assert.equal(MAX_FRAME_DELTA_S, .05);
  assert.equal(clampFrameDelta(1 / 60), 1 / 60, 'quadro normal passa inteiro');
  assert.equal(clampFrameDelta(2.4), .05, 'pausa longa vira 50 ms');
  assert.equal(clampFrameDelta(-1), 0, 'tempo negativo vira 0');
  assert.equal(clampFrameDelta(NaN), 0, 'valor inválido vira 0');
});

import { TOAST_MS } from '../src/guided-tour.js';
test('toasts e dicas somem em 2,5 s (sem ficar na tela por 4 ou 6 s)', () => {
  assert.equal(TOAST_MS, 2500);
});

import { createRadioDuck } from '../src/radio-duck.js';
function fakeRadio(playing) {
  const calls = [];
  return { calls, isPlaying: () => playing, pause() { calls.push('pause'); playing = false; }, play() { calls.push('play'); playing = true; } };
}
test('Teclado do 2-D: pausa o rádio ao começar e devolve o som ao sair, uma única vez', () => {
  const radio = fakeRadio(true); const duck = createRadioDuck(radio);
  assert.equal(duck.begin(), true); assert.deepEqual(radio.calls, ['pause']);
  assert.equal(duck.begin(), false, 'começar de novo não pausa de novo');
  assert.equal(duck.end(), true); assert.deepEqual(radio.calls, ['pause', 'play']);
  assert.equal(duck.end(), false, 'sair de novo não religa de novo');
});
test('rádio já pausado pelo usuário não é religado ao sair do minigame', () => {
  const radio = fakeRadio(false); const duck = createRadioDuck(radio);
  assert.equal(duck.begin(), false); assert.equal(duck.end(), false);
  assert.deepEqual(radio.calls, [], 'nenhuma chamada no rádio');
});

import { PLATE_STYLE, isClosedSign, CLOSED_SIGN_NEON } from '../src/sign-style.js';
test('placas: moldura metálica escura, Anton em alto contraste e anisotropia 8', () => {
  assert.ok(PLATE_STYLE.font.startsWith('"Anton"'), 'tipografia Anton');
  assert.equal(PLATE_STYLE.anisotropy, 8);
  assert.notEqual(PLATE_STYLE.frame, PLATE_STYLE.panel, 'moldura se distingue do painel');
  const lum = hex => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255); return .2126 * v[0] + .7152 * v[1] + .0722 * v[2]; };
  assert.ok(lum(PLATE_STYLE.ink) - lum(PLATE_STYLE.panel) > .6, 'alto contraste: texto claro sobre painel escuro');
});
test('letreiros SEM SINAL e FECHADO recebem o brilho extra; os demais não', () => {
  assert.equal(isClosedSign('SEM SINAL'), true);
  assert.equal(isClosedSign('FECHADO'), true);
  assert.equal(isClosedSign('Rua Song Machine'), false);
  assert.match(CLOSED_SIGN_NEON, /^#/);
});
