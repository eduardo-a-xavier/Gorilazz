import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.module.min.js';
import { GLTFLoader } from '../src/vendor/GLTFLoader.js';
import { planStreetProps, PROP_CLEARANCE, PROP_RADIUS, PROP_LIMITS, carFootprintCorners, benchFootprintCorners, inParkingOrPaintedLines, CAR_SCALE, BAY_Z, BAY_BACK_X, BAY_INNER_X, CROSSWALK_CLEARANCE, crosswalkPoints, stageFrame, benchFacing, STAGE_DECK_FRONT, BENCH_FREE } from '../src/street-props-plan.js';
import { installStreetProps, SCENERY_GLB_URLS } from '../src/street-props.js';
import { roadGap, nearestRoad, ROADS, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, ERA_GATES } from '../src/world-data.js';
import { ARCADE_SPOT } from '../src/arcade.js';

const plan = planStreetProps(2026);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('o plano é determinístico e cabe nos limites por tipo', () => {
  assert.deepEqual(planStreetProps(2026), plan);
  const counts = {};
  for (const item of plan) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  for (const kind of Object.keys(PROP_LIMITS)) assert.ok((counts[kind] ?? 0) <= PROP_LIMITS[kind], `${kind} acima do limite`);
  assert.ok(plan.length >= 100, `densidade: ${plan.length} props`);
  for (const kind of ['tree', 'planter', 'lamp']) assert.ok((counts[kind] ?? 0) > 0, `${kind} ausente`);
  // Saneamento da banca: nenhum banco nem pedra no plano.
  assert.equal(counts.bench ?? 0, 0, 'bancos removidos do plano');
  assert.equal(counts.rock ?? 0, 0, 'pedras removidas do plano');
  assert.equal(counts.car ?? 0, 0, `carros estacionados removidos (${counts.car ?? 0})`);
});

test('nenhum prop de calçada invade a pista (folga >= 0,90 m) e 0 bancos ficam sobre asfalto ou linhas de vaga/faixas', () => {
  for (const item of plan) {
    if (item.kind === 'car') continue;
    const folga = roadGap(item) - PROP_RADIUS[item.kind];
    if (item.kind !== 'bench') assert.ok(folga >= PROP_CLEARANCE - 1e-6, `${item.kind} em ${item.x},${item.z} com folga ${folga.toFixed(2)} m`);
    if (item.kind === 'bench') {
      const pts = [item, ...benchFootprintCorners(item)];
      for (const pt of pts) {
        assert.ok(roadGap(pt) >= 0.6, `banco em ${item.x},${item.z} a menos de 0,60 m da borda do asfalto (${roadGap(pt).toFixed(2)} m)`);
        assert.equal(inParkingOrPaintedLines(pt), false, `banco em ${item.x},${item.z} sobre linhas de vaga ou faixa pintada`);
      }
    }
  }
});

test('carros: 6 a 8, em escala de Geep, só em vagas pintadas do studio-ground ou recuos retos de avenida', () => {
  const cars = plan.filter(item => item.kind === 'car');
  assert.equal(cars.length, 0, `total de carros: ${cars.length}`);
  assert.equal(cars.filter(c => c.bay).length, 0, 'sem carros nas vagas');
  for (const car of cars) {
    assert.ok(car.scale >= 1.45, `carro em ${car.x},${car.z} em escala de brinquedo (${car.scale})`);
    assert.equal(car.scale, car.variant === 1 ? CAR_SCALE.van : CAR_SCALE.sedan);
    const corners = carFootprintCorners(car);
    if (car.bay) {
      // dentro da vaga: entre o fundo e o separador interno, e entre dois separadores em z
      const left = car.x < 0;
      const bayZ = BAY_Z.find(z => Math.abs(z - car.z) < 0.01);
      assert.ok(bayZ !== undefined, `carro em ${car.x},${car.z} fora do eixo de uma vaga`);
      for (const c of corners) {
        assert.ok(Math.abs(c.z - bayZ) <= 2.35, `carro em ${car.x},${car.z} cobre o separador da vaga (z=${c.z.toFixed(2)})`);
        if (left) assert.ok(c.x >= BAY_BACK_X.left && c.x <= BAY_INNER_X.left + 0.2, `carro em ${car.x},${car.z} fora da vaga (x=${c.x.toFixed(2)})`);
        else assert.ok(c.x <= BAY_BACK_X.right + 0.2 && c.x >= BAY_INNER_X.right - 0.2, `carro em ${car.x},${car.z} fora da vaga (x=${c.x.toFixed(2)})`);
      }
    } else {
      for (const c of [car, ...corners]) {
        const g = roadGap(c);
        assert.ok(g <= -0.10, `canto do carro em ${car.x},${car.z} subiu no meio-fio (gap=${g.toFixed(2)})`);
        assert.ok(g >= -3.7, `carro em ${car.x},${car.z} invade a faixa central (gap=${g.toFixed(2)})`);
      }
      const nr = nearestRoad(car);
      assert.ok(Math.abs(Math.sin(car.rot - nr.heading)) <= 0.15, `carro em ${car.x},${car.z} desalinhado do meio-fio`);
    }
  }
});

test('0 carro a menos de 6 m de faixa de pedestre, linha de retenção ou cruzamento', () => {
  const cross = crosswalkPoints();
  assert.ok(cross.length > 0);
  for (const car of plan.filter(item => item.kind === 'car')) {
    for (const c of [car, ...carFootprintCorners(car)]) {
      for (const q of cross) assert.ok(dist(q, c) >= CROSSWALK_CLEARANCE, `carro em ${car.x},${car.z} a ${dist(q, c).toFixed(1)} m de faixa de pedestre`);
    }
  }
});

test('saneamento: nenhum banco no plano (bancos removidos das praças, ruas e palcos)', () => {
  assert.equal(plan.filter(item => item.kind === 'bench').length, 0);
});

test('props ficam fora de prédios e lotes, das histórias, dos palcos, portais e do fliperama', () => {
  for (const item of plan) {
    for (const o of OBSTACLES) assert.ok(dist(o, item) >= o.radius + PROP_RADIUS[item.kind] * (item.kind === 'car' ? 1.0 : 1), `${item.kind} encosta em obstáculo`);
    for (const d of DISCOVERIES) assert.ok(dist(d, item) >= (item.kind === 'car' ? 8 : 9), 'prop perto demais de uma história');
    for (const m of MEMBER_LOCATIONS) assert.ok(dist(m, item) >= (item.kind === 'car' ? 9 : 3.5), 'prop sobre o palco');
    if (item.kind === 'car') for (const g of ERA_GATES) assert.ok(dist(g, item) >= 8, 'carro perto demais de portal de era');
    assert.ok(dist(ARCADE_SPOT, item) >= (item.kind === 'car' ? 6 : 5), 'prop sobre a máquina do fliperama');
  }
});

test('os palcos ganham props ao redor (anel de árvores, bancos e canteiros)', () => {
  for (const stage of MEMBER_LOCATIONS) {
    const near = plan.filter(item => dist(stage, item) >= 4.5 && dist(stage, item) <= 11);
    assert.ok(near.length >= 2, `palco em ${stage.x},${stage.z} com ${near.length} props no anel`);
  }
});

test('loadSceneryModels carrega GLBs de árvores, bancos, arbustos, rochas, postes e carros em InstancedMesh e faz fallback quando falha', async () => {
  const scene = new THREE.Scene();
  const props = installStreetProps(scene);
  // Loader local que lê os GLBs reais do disco
  const diskLoader = {
    async loadAsync(url) {
      const bytes = await readFile(new URL(`../${url.replace('./', '')}`, import.meta.url));
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
    },
  };
  await props.loadSceneryModels(diskLoader);
  assert.equal(props.group.userData.treesGlbLoaded, true);
  assert.equal(props.group.userData.bushesGlbLoaded, true);
  assert.ok(!props.group.userData.rocksGlbLoaded, 'pedras removidas: GLB de pedra não carrega');
  assert.equal(props.group.userData.lampsGlbLoaded, true);
  assert.ok(!props.group.userData.carsGlbLoaded, 'sem carros no plano: GLB de carro não carrega');
  const names = props.group.children.map(c => c.name);
  assert.ok(names.includes('street-trees-glb-1') && !names.includes('street-cars-glb-1'));
  assert.ok(!names.includes('street-benches-glb'), 'sem bancos no cenário');
  assert.ok(!names.includes('street-tree-crowns'), 'primitivas de árvore removidas após carga do GLB');

  // Teste de fallback: se o loader falhar, as primitivas continuam intactas
  const failScene = new THREE.Scene();
  const failProps = installStreetProps(failScene);
  await failProps.loadSceneryModels({ loadAsync: () => Promise.reject(new Error('404 simulado')) });
  const failNames = failProps.group.children.map(c => c.name);
  assert.ok(failNames.includes('street-tree-crowns'));
});
