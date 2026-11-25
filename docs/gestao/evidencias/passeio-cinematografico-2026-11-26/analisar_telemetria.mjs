// Analisa a telemetria do passeio (telemetria-<modo>.json): paradas, amostras fora do asfalto e colisões com carros/calçadas.
// Uso: node analisar_telemetria.mjs <modo>   (ex.: 3a). Grava metricas-<modo>.json ao lado.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = pathToFileURL('E:/Gorilazz-Relatorio/').href;
const { roadGap } = await import(new URL('src/world-data.js', root));
const { planStreetProps, carFootprintCorners } = await import(new URL('src/street-props-plan.js', root));
const mode = process.argv[2] || '3a';
const suffix = process.argv[3] || ''; const tel = JSON.parse(readFileSync(join(here, `telemetria-${mode}${suffix}.json`), 'utf8'));
const GEEP_HL = 3.3, GEEP_HW = 1.97; // meia-comprimento e meia-largura do Geep (6,6 x 3,9 m)
const corners = (x, z, h) => {
  const f = [-Math.sin(h), -Math.cos(h)], l = [Math.cos(h), -Math.sin(h)];
  return [[1, 1], [1, -1], [-1, -1], [-1, 1]].map(([a, b]) => ({ x: x + f[0] * GEEP_HL * a + l[0] * GEEP_HW * b, z: z + f[1] * GEEP_HL * a + l[1] * GEEP_HW * b }));
};
// Separação por eixos (SAT) entre dois quadriláteros convexos.
function overlap(P, Q) {
  for (const poly of [P, Q]) for (let i = 0; i < 4; i++) {
    const a = poly[i], b = poly[(i + 1) % 4], nx = b.z - a.z, nz = a.x - b.x;
    const pr = poly2 => poly2.map(p => p.x * nx + p.z * nz);
    const pa = pr(P), qa = pr(Q);
    if (Math.max(...pa) < Math.min(...qa) || Math.max(...qa) < Math.min(...pa)) return false;
  }
  return true;
}
const cars = planStreetProps(2026).filter(item => item.kind === 'car');
const carPolys = cars.map(c => ({ c, poly: carFootprintCorners(c) }));
const moving = tel.samples.filter(s => s.x !== undefined);
let offAsphalt = 0, sidewalkTouch = 0, carHits = 0, maxSpeed = 0; const carHitList = [], sidewalkList = [];
for (const s of moving) {
  maxSpeed = Math.max(maxSpeed, Math.abs(s.speed));
  const gapC = roadGap({ x: s.x, z: s.z });
  if (Math.abs(s.speed) > 0.3 && gapC > 0) offAsphalt++;
  const g = corners(s.x, s.z, s.heading);
  if (g.some(p => roadGap(p) > 0.3)) { sidewalkTouch++; if (sidewalkList.length < 5) sidewalkList.push({ t: s.t, x: s.x, z: s.z }); }
  for (const { c, poly } of carPolys) if (Math.hypot(c.x - s.x, c.z - s.z) < 10 && overlap(g, poly)) { carHits++; if (carHitList.length < 5) carHitList.push({ t: s.t, car: [c.x, c.z] }); break; }
}
const reached = [...new Set(tel.samples.filter(s => s.hold && s.order).map(s => s.order[s.index]))];
const legs = tel.events.filter(e => e.event === 'leg');
const metrics = {
  mode, samples: tel.samples.length, durationS: tel.duration_s, consoleErrors: tel.console_errors.length,
  stopsReached: reached.length, stopsTotal: 9, stopsReachedIds: reached, legEvents: legs.length,
  offAsphaltSamplesMoving: offAsphalt, geepCornerOnSidewalkSamples: sidewalkTouch, parkedCarCollisionSamples: carHits,
  maxSpeedMs: Number(maxSpeed.toFixed(2)), maxSpeedKmh: Number((maxSpeed * 3.6).toFixed(1)),
  examplesCarHits: carHitList, examplesSidewalk: sidewalkList,
  notes: 'offAsphalt: centro do Geep fora do asfalto em movimento (roadGap > 0). sidewalk: algum canto do Geep sobre calçada (roadGap > 0,3). Colisão: SAT entre o retângulo do Geep e os carros estacionados de planStreetProps.',
};
writeFileSync(join(here, `metricas-${mode}${suffix}.json`), JSON.stringify(metrics, null, 2));
console.log(JSON.stringify(metrics, null, 2).slice(0, 1500));
