import test from 'node:test';
import assert from 'node:assert/strict';
import { planStreetProps, PROP_CLEARANCE, PROP_RADIUS, PROP_LIMITS } from '../src/street-props-plan.js';
import { roadGap, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS } from '../src/world-data.js';
import { ARCADE_SPOT } from '../src/arcade.js';

const plan = planStreetProps(2026);
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

test('o plano é determinístico e cabe nos limites por tipo', () => {
  assert.deepEqual(planStreetProps(2026), plan);
  const counts = {};
  for (const item of plan) counts[item.kind] = (counts[item.kind] ?? 0) + 1;
  for (const kind of Object.keys(PROP_LIMITS)) assert.ok((counts[kind] ?? 0) <= PROP_LIMITS[kind], `${kind} acima do limite`);
  assert.ok(plan.length >= 100, `densidade: ${plan.length} props`);
  for (const kind of ['tree', 'bench', 'planter', 'lamp']) assert.ok((counts[kind] ?? 0) > 0, `${kind} ausente`);
});

test('nenhum prop invade a pista: folga >= 0,90 m da borda do asfalto, considerando o raio da base', () => {
  for (const item of plan) {
    const folga = roadGap(item) - PROP_RADIUS[item.kind];
    assert.ok(folga >= PROP_CLEARANCE - 1e-6, `${item.kind} em ${item.x},${item.z} com folga ${folga.toFixed(2)} m`);
  }
});

test('props ficam fora de prédios e lotes, das histórias, dos palcos e do fliperama', () => {
  for (const item of plan) {
    for (const o of OBSTACLES) assert.ok(dist(o, item) >= o.radius + PROP_RADIUS[item.kind], `${item.kind} encosta em obstáculo`);
    for (const d of DISCOVERIES) assert.ok(dist(d, item) >= 9, 'prop perto demais de uma história');
    for (const m of MEMBER_LOCATIONS) assert.ok(dist(m, item) >= 3.5, 'prop sobre o palco');
    assert.ok(dist(ARCADE_SPOT, item) >= 5, 'prop sobre a máquina do fliperama');
  }
});

test('os palcos ganham props ao redor (anel de árvores, bancos e canteiros)', () => {
  for (const stage of MEMBER_LOCATIONS) {
    const near = plan.filter(item => dist(stage, item) >= 4.5 && dist(stage, item) <= 11);
    assert.ok(near.length >= 2, `palco em ${stage.x},${stage.z} com ${near.length} props no anel`);
  }
});
