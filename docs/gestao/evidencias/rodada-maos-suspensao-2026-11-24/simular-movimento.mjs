import { writeFile } from 'node:fs/promises';
import { createVehicleMotion, updateVehicleMotion } from '../../../../src/vehicle-motion.js';

const dt = 1 / 60, deg = 180 / Math.PI, clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const sequences = {
  arrancada: t => ({ acceleration: t < 2 ? 8.8 : 0, speed: Math.min(t * 8.8, 17.6), steering: 0, surface: 'asfalto', inside: true }),
  frenagem: t => ({ acceleration: t < 1.5 ? -12 : 0, speed: Math.max(0, 18 - t * 12), steering: 0, surface: 'asfalto', inside: true }),
  curva: t => ({ acceleration: 0, speed: 20, steering: t < 1 ? .5 * t : t < 3 ? .5 : 0, surface: 'asfalto', inside: true }),
  emenda: t => ({ acceleration: 0, speed: 12, steering: 0, surface: t > 1 && t < 2 ? 'terra' : 'asfalto', inside: true }),
  alternancia: t => ({ acceleration: t < 2 ? 5 : 0, speed: 10, steering: t < 1 ? .5 : t < 3 ? -.5 : 0, surface: 'asfalto', inside: t < 1 || t >= 2 }),
  passeio: t => ({ acceleration: t < 1 ? 6 : t < 3 ? 0 : t < 4 ? -10 : 0, speed: t < 1 ? t * 6 : t < 3 ? 6 : t < 4 ? 6 * (4 - t) : 0, steering: t < 1 || t >= 4 ? 0 : .25, surface: 'asfalto', inside: true }),
};

function summarize(rows) {
  const max = (key) => Math.max(...rows.map(row => Math.abs(row[key])));
  const differences = rows.slice(1).map((row, i) => (row.wheel - rows[i].wheel) * deg);
  return { maxPitchDeg: max('pitch') * deg, maxRollDeg: max('roll') * deg,
    verticalRmsM: Math.sqrt(rows.reduce((sum, r) => sum + r.y * r.y, 0) / rows.length),
    maxWheelStepDeg: Math.max(...differences.map(Math.abs)), maxTargetDifferenceDeg: Math.max(...rows.filter(r => r.inside).map(r => Math.abs(r.wheel - r.handTarget) * deg)) };
}

const output = { description: 'Simulação determinística das fórmulas, não medição dos ossos ou da geometria real; alvo de mão não é ângulo da articulação.', dt, scenarios: {} };
for (const [name, input] of Object.entries(sequences)) {
  const old = { wheel: 0, turn: 0, pitch: 0, roll: 0, y: 0 }, next = createVehicleMotion(), before = [], after = [];
  for (let i = 0; i <= 360; i++) {
    const t = i * dt, v = input(t), blend = 1 - Math.exp(-dt * 4), speedScale = Math.min(1, Math.abs(v.speed) / 8);
    old.wheel = clamp(v.steering * 1.9, -1.05, 1.05);
    if (v.inside) old.turn += (clamp(v.steering * 1.15, -.68, .68) - old.turn) * Math.min(1, dt * 7);
    old.y += (((Math.abs(v.speed) > .1 ? Math.sin(t * (v.surface === 'terra' ? 14 : 11)) * (v.surface === 'terra' ? .026 : .014) * speedScale : 0)) - old.y) * blend;
    old.roll += (-v.steering * v.speed * .008 - old.roll) * blend;
    old.pitch += (clamp(v.acceleration * -.006, -.06, .06) - old.pitch) * blend;
    updateVehicleMotion(next, v, dt);
    before.push({ t, wheel: old.wheel, handTarget: old.turn, pitch: old.pitch, roll: old.roll, y: old.y, inside: v.inside });
    after.push({ t, wheel: next.wheel, handTarget: next.wheel, pitch: next.pitch, roll: next.roll, y: next.height, inside: v.inside });
  }
  output.scenarios[name] = { before: { summary: summarize(before), frames: before }, after: { summary: summarize(after), frames: after } };
}
await writeFile(new URL('./simulacao-antes-depois.json', import.meta.url), JSON.stringify(output));
console.log(Object.fromEntries(Object.entries(output.scenarios).map(([name, s]) => [name, { before: s.before.summary, after: s.after.summary }])));
