import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.module.min.js';
import { GLTFLoader } from '../src/vendor/GLTFLoader.js';
import { planStreetProps, PROP_CLEARANCE, CAR_CLEARANCE, PROP_RADIUS, PROP_LIMITS } from '../src/street-props-plan.js';
import { installStreetProps, SCENERY_GLB_URLS } from '../src/street-props.js';
import { roadGap, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, ERA_GATES } from '../src/world-data.js';
import { ARCADE_SPOT } from '../src/arcade.js';

const plan = planStreetProps(2026);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('o plano é determinístico e cabe nos limites por tipo', () => {
  assert.deepEqual(planStreetProps(2026), plan);
  const counts = {};
  for (const item of plan) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  for (const kind of Object.keys(PROP_LIMITS)) assert.ok((counts[kind] ?? 0) <= PROP_LIMITS[kind], `${kind} acima do limite`);
  assert.ok(plan.length >= 100, `densidade: ${plan.length} props`);
  for (const kind of ['tree', 'bench', 'planter', 'lamp', 'rock', 'car']) assert.ok((counts[kind] ?? 0) > 0, `${kind} ausente`);
  assert.ok(counts.bench >= 8 && counts.bench <= 12, `bancos curados (${counts.bench}) devem ficar entre 8 e 12`);
  assert.ok(counts.car >= 25 && counts.car <= 40, `carros estacionados (${counts.car}) devem ficar entre 25 e 40`);
});

test('nenhum prop invade a pista: folga >= 0,90 m para props e >= 1,20 m para carros estacionados', () => {
  for (const item of plan) {
    const folga = roadGap(item) - PROP_RADIUS[item.kind];
    const minClear = item.kind === 'car' ? CAR_CLEARANCE : PROP_CLEARANCE;
    assert.ok(folga >= minClear - 1e-6, `${item.kind} em ${item.x},${item.z} com folga ${folga.toFixed(2)} m`);
  }
});

test('props ficam fora de prédios e lotes, das histórias, dos palcos, portais e do fliperama', () => {
  for (const item of plan) {
    for (const o of OBSTACLES) assert.ok(dist(o, item) >= o.radius + PROP_RADIUS[item.kind], `${item.kind} encosta em obstáculo`);
    for (const d of DISCOVERIES) assert.ok(dist(d, item) >= (item.kind === 'car' ? 10 : 9), 'prop perto demais de uma história');
    for (const m of MEMBER_LOCATIONS) assert.ok(dist(m, item) >= (item.kind === 'car' ? 9 : 3.5), 'prop sobre o palco');
    if (item.kind === 'car') for (const g of ERA_GATES) assert.ok(dist(g, item) >= 10, 'carro perto demais de portal de era');
    assert.ok(dist(ARCADE_SPOT, item) >= 5, 'prop sobre a máquina do fliperama');
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
  assert.equal(props.group.userData.benchesGlbLoaded, true);
  assert.equal(props.group.userData.bushesGlbLoaded, true);
  assert.equal(props.group.userData.rocksGlbLoaded, true);
  assert.equal(props.group.userData.lampsGlbLoaded, true);
  assert.equal(props.group.userData.carsGlbLoaded, true);
  const names = props.group.children.map(c => c.name);
  assert.ok(names.includes('street-trees-glb-1') && names.includes('street-benches-glb') && names.includes('street-cars-glb-1'));
  assert.ok(!names.includes('street-tree-crowns'), 'primitivas de árvore removidas após carga do GLB');

  // Teste de fallback: se o loader falhar, as primitivas continuam intactas
  const failScene = new THREE.Scene();
  const failProps = installStreetProps(failScene);
  await failProps.loadSceneryModels({ loadAsync: () => Promise.reject(new Error('404 simulado')) });
  const failNames = failProps.group.children.map(c => c.name);
  assert.ok(failNames.includes('street-tree-crowns') && failNames.includes('street-benches'));
});
