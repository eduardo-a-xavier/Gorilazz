import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.module.min.js';
import { GLTFLoader } from '../src/vendor/GLTFLoader.js';
import { CITY_LOTS, roadGap } from '../src/world-data.js';
import { createFaunaFlock, stepFaunaFlock, installFauna, FAUNA_TUNING, PIGEON_GLB_URL } from '../src/fauna.js';

test('fauna: aves ficam em calçadas, praças e telhados baixos, nunca sobre o asfalto', () => {
  const flock = createFaunaFlock();
  assert.equal(flock.length, FAUNA_TUNING.maxCount);
  const perches = new Set(flock.map(b => b.perch));
  assert.ok(perches.has('plaza') && perches.has('sidewalk') && perches.has('roof'));
  for (const bird of flock) {
    if (bird.perch !== 'roof') {
      assert.ok(roadGap({ x: bird.home.x, z: bird.home.z }) >= 1, `ave no chão invadiu o asfalto (${bird.home.x.toFixed(1)}, ${bird.home.z.toFixed(1)})`);
    } else {
      assert.ok(bird.home.y >= 6.4, 'ave de telhado fica acima de 2 andares');
    }
  }
});

test('fauna: idle anima bicada/olhar dentro do raio de ativação, foge quando o carro aproxima e retorna ao pouso', () => {
  const flock = createFaunaFlock();
  const target = flock.find(b => b.perch === 'plaza' || b.perch === 'sidewalk');
  assert.ok(target);

  // Longe de todas as aves: nenhuma entra em fuga e aves fora do raio ficam inativas.
  const farStats = stepFaunaFlock(flock, { x: 999, z: 999, speed: 0 }, .016, 1.2, false);
  assert.equal(farStats.fleeingCount, 0);
  assert.equal(farStats.activeCount, 0);

  // Perto mas fora do raio de fuga: anima idle (bicar / girar cabeça).
  const idleCar = { x: target.home.x + 22, z: target.home.z, speed: 0 };
  let pitched = false, turned = false;
  for (let k = 0; k < 40; k++) {
    stepFaunaFlock(flock, idleCar, .05, k * .15, false);
    if (Math.abs(target.pitch) > .1) pitched = true;
    if (Math.abs(target.yaw - target.baseYaw) > .08) turned = true;
  }
  assert.ok(pitched && turned, 'ave em idle deve bicar e olhar para os lados');
  assert.equal(target.state, 'idle');

  // Carro se aproxima da ave (< fleeRadius): entra em fuga, sobe e se afasta do carro.
  const approachCar = { x: target.home.x + 4, z: target.home.z + 2, speed: 10 };
  const initialDist = Math.hypot(target.x - approachCar.x, target.z - approachCar.z);
  const fleeStats = stepFaunaFlock(flock, approachCar, .1, 2.0, false);
  assert.equal(target.state, 'flee');
  assert.ok(fleeStats.fleeingCount >= 1);
  for (let k = 0; k < 15; k++) stepFaunaFlock(flock, approachCar, .1, 2.1 + k * .1, false);
  const afterDist = Math.hypot(target.x - approachCar.x, target.z - approachCar.z);
  assert.ok(afterDist > initialDist + 3, `ave não se afastou (${initialDist.toFixed(2)} -> ${afterDist.toFixed(2)} m)`);
  assert.ok(target.y > target.home.y + 2, `ave não levantou voo (y=${target.y.toFixed(2)})`);

  // Carro vai embora: após o tempo de voo a ave retorna ao pouso e volta para idle.
  for (let k = 0; k < 80; k++) stepFaunaFlock(flock, { x: 500, z: 500, speed: 0 }, .1, 4 + k * .1, false);
  assert.equal(target.state, 'idle');
  assert.ok(Math.hypot(target.x - target.home.x, target.y - target.home.y, target.z - target.home.z) < .3);
});

test('installFauna usa apenas 2 InstancedMesh (corpos e asas) para manter alto FPS', () => {
  const scene = new THREE.Scene();
  const fauna = installFauna(scene, 32);
  const instanced = scene.children.filter(c => c.isInstancedMesh);
  assert.equal(instanced.length, 2);
  assert.equal(fauna.bodies.count, 32);
  assert.equal(fauna.wings.count, 32);
});

test('prédios seguem gradiente orgânico (núcleo central mais alto que as bordas) e preservam telões do Ato 4', () => {
  const core = CITY_LOTS.filter(l => !l.landmark && Math.hypot((l.x + 14) / 118, (l.z + 82) / 110) < .48);
  const edge = CITY_LOTS.filter(l => !l.landmark && Math.hypot((l.x + 14) / 118, (l.z + 82) / 110) > .82);
  const avg = list => list.reduce((s, l) => s + l.floors, 0) / list.length;
  assert.ok(core.length > 10 && edge.length > 10);
  assert.ok(avg(core) > avg(edge) + 1.2, `média central (${avg(core).toFixed(2)}) deve superar as bordas (${avg(edge).toFixed(2)})`);
  for (const lot of CITY_LOTS) {
    assert.ok(lot.floors >= 2 && lot.floors <= 10, `gabarito fora da escala coerente: ${lot.floors}`);
    if (lot.screen) assert.ok(lot.floors >= 4, 'prédios com telão do Ato 4 mantêm >= 4 andares');
  }
});

test('mapa completo na tecla M ignora campos de texto, fecha com Escape e HUD mantém faixa e troca rápida', async () => {
  const appSource = await readFile(new URL('../src/app.js', import.meta.url), 'utf8');
  const htmlSource = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(htmlSource, /id="full-map-overlay"/);
  assert.match(htmlSource, /id="road-radio-track"/);
  assert.match(appSource, /if\s*\(event\.target\.closest\('input,select,textarea,\[contenteditable\]'\)\)\s*return;/);
  assert.match(appSource, /if\s*\(key\s*===\s*'m'\)\s*\{\s*event\.preventDefault\(\);\s*toggleFullMap\(\);/);
  assert.match(appSource, /map:\s*\(\)\s*=>\s*toggleFullMap\(false\)/, 'o Esc fecha o mapa pela pilha de prioridade (src/escape-stack.js)');
  assert.ok(!appSource.includes("'#road-radio-prev','#road-radio-next'"), 'botões prev/next da Kong FM permanecem visíveis na barra principal da HUD');
});

test('pombo parado para de bicar e vira a cabeça para o carro que se aproxima (alerta antes da fuga)', () => {
  const birds = createFaunaFlock(6);
  const bird = birds[0];
  bird.home = { x: 0, y: 0, z: 0 }; bird.x = 0; bird.z = 0; bird.state = 'idle'; bird.baseYaw = 0; bird.phase = 0;
  // Carro a ~1,4× o raio de gatilho: ainda não assusta, mas o pombo já alerta.
  const trigger = FAUNA_TUNING.fleeRadius;
  const actor = { x: trigger * 1.4, z: 0, speed: 0 };
  let minPitch = 0;
  for (let i = 0; i < 60; i++) { stepFaunaFlock([bird], actor, .016, i * .016, false, actor); minPitch = Math.min(minPitch, bird.pitch); }
  assert.equal(bird.state, 'idle', 'ainda não voa');
  assert.ok(Math.abs(bird.yaw - Math.atan2(-actor.x, 0)) < .25 || bird.yaw > 1 || bird.yaw < -1, `cabeça virada para o carro (yaw ${bird.yaw.toFixed(2)})`);
  assert.ok(minPitch > -.25, `bicada reduzida em alerta (pitch mín. ${minPitch.toFixed(2)}; sem alerta chega a -0.58)`);
});

test('loadPigeonModel substitui a geometria de corpos e asas pelo pigeon-01-animated.glb mantendo 2 InstancedMesh e fallback', async () => {
  assert.equal(PIGEON_GLB_URL, './assets/models/scenery/pigeon-01-animated.glb');
  const scene = new THREE.Scene();
  const fauna = installFauna(scene, 16);
  const diskLoader = {
    async loadAsync(url) {
      const bytes = await readFile(new URL(`../${url.replace('./', '')}`, import.meta.url));
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
    },
  };
  const ok = await fauna.loadPigeonModel(diskLoader);
  assert.equal(ok, true);
  assert.equal(fauna.bodies.userData.glbLoaded, true);
  assert.equal(scene.children.filter(c => c.isInstancedMesh).length, 2);
});
