// Mede a camera de viagem ao dirigir por todas as ruas (11 ruas x 2 sentidos x 3 deslocamentos laterais x 2 velocidades, 60 Hz).
// Uso: node docs/gestao/evidencias/camera-fase3/measure-camera.mjs [legacy|novo] [saida.json]
//   legacy = compute() + lerp de posicao (pipeline anterior a Fase 3)
//   novo   = compute() + follow() (pipeline atual de src/scene.js)
// Os primeiros 30 quadros de cada percurso (arrancada do carro parado) nao entram nas metricas.
import { writeFileSync } from 'node:fs';
import * as THREE from '../../../../src/vendor/three.module.min.js';
import { ROADS, CITY_LOTS } from '../../../../src/world-data.js';
import { createTravelCamera } from '../../../../src/scene.js';
import { createLegacyCamera } from './legacy-camera.mjs';

const mode = process.argv[2] ?? 'novo', out = process.argv[3];
const JUMP = .30;          // m por quadro (18 m/s) de variacao da distancia camera-carro = "salto"
const FRAME = 1 / 60, WARMUP = 30, PIVOT_Y = 2.4;

function trajectory(road, reverse, speed, offset = 0) {
  const pts = reverse ? [...road.samples].reverse() : road.samples, steps = [];
  let heading = null, i = 0, acc = 0;
  const seg = k => Math.hypot(pts[k + 1].x - pts[k].x, pts[k + 1].z - pts[k].z);
  while (i < pts.length - 1) {
    const a = pts[i], b = pts[i + 1], len = seg(i), f = Math.min(1, acc / len);
    const tl = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = -(b.z - a.z) / tl, nz = (b.x - a.x) / tl;
    const x = a.x + (b.x - a.x) * f + nx * offset, z = a.z + (b.z - a.z) * f + nz * offset;
    const target = Math.atan2(-(b.x - a.x), -(b.z - a.z));
    if (heading === null) heading = target;
    const d = Math.atan2(Math.sin(target - heading), Math.cos(target - heading));
    heading += Math.max(-1.6 * FRAME, Math.min(1.6 * FRAME, d));
    steps.push({ x, z, heading });
    acc += speed * FRAME;
    while (i < pts.length - 1 && acc >= seg(i)) { acc -= seg(i); i++; }
  }
  return steps;
}

// Footprint real dos predios (sem margem) para contar quadros com camera dentro do volume.
const lots = CITY_LOTS.map(l => ({ x: l.x, z: l.z, cos: Math.cos(l.rotation), sin: Math.sin(l.rotation), hw: l.w / 2, hd: l.d / 2, top: l.floors * 3.2 + 1.5 }));
const inside = p => lots.some(l => p.y < l.top && Math.abs((p.x - l.x) * l.cos - (p.z - l.z) * l.sin) < l.hw && Math.abs((p.x - l.x) * l.sin + (p.z - l.z) * l.cos) < l.hd);
// Caixa do carro (3,6 x 3,6 x 7 m) em torno do pivo para medir a menor folga.
function carGap(p, s) {
  const c = Math.cos(s.heading), sn = Math.sin(s.heading), dx = p.x - s.x, dz = p.z - s.z;
  const lx = dx * c - dz * sn, lz = dx * sn + dz * c;
  return Math.hypot(Math.max(0, Math.abs(lx) - 1.8), Math.max(0, p.y - 3.6), Math.max(0, Math.abs(lz) - 3.5));
}
// Linha de visao pivo->camera atravessando um predio (camera atras da parede).
function occluded(p, s) {
  for (let k = 3; k <= 30; k++) { const f = k / 32, q = { x: s.x + (p.x - s.x) * f, y: PIVOT_Y + (p.y - PIVOT_Y) * f, z: s.z + (p.z - s.z) * f }; if (inside(q)) return true; }
  return false;
}

const total = { occluded: 0, frames: 0, jump: 0, flips: 0, clip: 0, maxJump: 0, minGap: Infinity, minDist: Infinity, maxRate: 0, runs: 0 };
const worst = [];
for (const offset of [-5, 0, 5]) for (const speed of [12, 28]) for (const reverse of [false, true]) for (const road of ROADS) {
  const cam = mode === 'legacy' ? createLegacyCamera() : createTravelCamera();
  const position = new THREE.Vector3(), target = new THREE.Vector3(), desired = new THREE.Vector3(), look = new THREE.Vector3();
  const steps = trajectory(road, reverse, speed, offset);
  let prevD = null, prevDelta = 0, prevRel = null, ready = false, runJump = 0;
  steps.forEach((s, n) => {
    const vehicle = { x: s.x, z: s.z, heading: s.heading, speed };
    const state = cam.compute(vehicle, { dt: FRAME, t: n * FRAME, desiredCamera: desired, look });
    const blend = 1 - Math.exp(-FRAME * 4);
    if (!ready) { position.copy(desired); target.copy(look); ready = true; cam.follow?.(position, target, { desiredCamera: desired, look, pivot: s, dt: FRAME, blend, snap: true }); }
    else if (mode === 'novo' && cam.follow) cam.follow(position, target, { desiredCamera: desired, look, pivot: s, dt: FRAME, blend });
    else { position.lerp(desired, blend); target.lerp(look, blend); }
    const d = Math.hypot(position.x - s.x, position.y - PIVOT_Y, position.z - s.z);
    const rel = new THREE.Vector3(position.x - s.x, position.y, position.z - s.z);
    if (n >= WARMUP) {
      total.frames++;
      if (prevD !== null) {
        const delta = d - prevD, jump = Math.abs(delta);
        if (jump > JUMP) { total.jump++; runJump++; if (process.env.DEBUG && jump > +process.env.DEBUG) console.log('JUMP', road.id, offset, speed, reverse, n, jump.toFixed(2), 'reach', state.reach.toFixed(2), 'smooth', state.smoothReach.toFixed(2)); }
        if (jump > total.maxJump) total.maxJump = jump;
        if (jump > .06 && Math.abs(prevDelta) > .06 && Math.sign(delta) !== Math.sign(prevDelta)) total.flips++;
        if (jump > .06) prevDelta = delta;
        total.maxRate = Math.max(total.maxRate, rel.distanceTo(prevRel) / FRAME);
      }
      if (inside(position)) total.clip++;
      if (occluded(position, s)) total.occluded++;
      total.minGap = Math.min(total.minGap, carGap(position, s)); total.minDist = Math.min(total.minDist, d);
    }
    prevD = d; prevRel = rel;
  });
  total.runs++;
  worst.push({ road: road.id, offset, reverse, speed, jumps: runJump });
}
const result = { mode, threshold_m_per_frame: JUMP, ...total, minGap: +total.minGap.toFixed(2), minDist: +total.minDist.toFixed(2), maxJump: +total.maxJump.toFixed(3), maxRate: +total.maxRate.toFixed(1), worst: worst.sort((a, b) => b.jumps - a.jumps).slice(0, 4) };
console.log(JSON.stringify(result, null, 1));
if (out) writeFileSync(out, JSON.stringify(result, null, 2));
