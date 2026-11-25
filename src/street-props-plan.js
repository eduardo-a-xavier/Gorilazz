// Plano determinístico de props urbanos (árvores, bancos, canteiros, postes, pedras e carros estacionados) em calçadas, praças e avenidas.
// Lógica pura, sem Three.js, para ser testada em Node. A geração visual fica em street-props.js.
import { roadGap, nearestRoad, ROADS, NODES, ERA_GATES, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, TREE_LOCATIONS, WORLD_BOUNDS, behind } from './world-data.js';
import { ARCADE_SPOT } from './arcade.js';

export const PROP_CLEARANCE = 0.9; // m: folga mínima entre a borda do asfalto e a base do prop de calçada
export const CAR_CLEARANCE = 1.2;  // m: folga mínima dos carros estacionados à faixa central de rodagem
export const CAR_HALF_WIDTH = 1.09;
export const CAR_HALF_LENGTH = 2.40;
export const BENCH_HALF_LENGTH = 0.86;
export const BENCH_HALF_DEPTH = 0.30;
// Raio da base de cada tipo (m), usado na folga e no espaçamento.
export const PROP_RADIUS = { tree: 1.4, bench: 0.9, planter: 0.8, lamp: 0.3, rock: 0.9, car: 1.35, barrier: 0.65 };
// Teto por tipo: o cenário ganha densidade sem virar floresta nem atrapalhar a leitura da rua.
export const PROP_LIMITS = { tree: 70, bench: 12, planter: 60, lamp: 110, rock: 60, car: 36, barrier: 12 };
const STEP = 5;              // m entre candidatos da grade
const MIN_SPACING = 6;       // m entre dois props quaisquer
const LAMP_SPACING = 16;     // m entre postes (poucos e espaçados, como numa avenida)
const STAGE_RING = [4.5, 11]; // m: anel ao redor de cada palco (Russel, Noodle, 2-D e Murdoc)

const NODE_DEGREE = NODES.map((_, id) => ROADS.filter(road => road.from === id || road.to === id).length);
const NODE_RADIUS = NODES.map((_, id) => {
  const maxHalf = Math.max(...ROADS.filter(road => road.from === id || road.to === id).map(road => road.width)) / 2;
  return NODE_DEGREE[id] >= 4 ? Math.max(maxHalf + 4.5, 9.5) : NODE_DEGREE[id] === 3 ? maxHalf + 3.5 : maxHalf + 2.5;
});

function roadDist(road, x, z) {
  let best = Infinity;
  for (let i = 1; i < road.samples.length; i++) {
    const a = road.samples[i - 1], b = road.samples[i], dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}

// Cantos das 4 rodas/para-choques do carro estacionado no espaço do mundo.
export function carFootprintCorners(car) {
  const s = car.scale ?? 1;
  const hw = CAR_HALF_WIDTH * s;
  const hl = (car.variant === 1 ? 2.40 : 2.20) * s;
  const cos = Math.cos(car.rot), sin = Math.sin(car.rot);
  return [
    { x: car.x - hw * cos - hl * sin, z: car.z + hw * sin - hl * cos },
    { x: car.x + hw * cos - hl * sin, z: car.z - hw * sin - hl * cos },
    { x: car.x + hw * cos + hl * sin, z: car.z - hw * sin + hl * cos },
    { x: car.x - hw * cos + hl * sin, z: car.z + hw * sin + hl * cos },
  ];
}

// Cantos da base do banco no espaço do mundo.
export function benchFootprintCorners(bench) {
  const s = bench.scale ?? 0.92;
  const hw = BENCH_HALF_LENGTH * s;
  const hd = BENCH_HALF_DEPTH * s;
  const cos = Math.cos(bench.rot), sin = Math.sin(bench.rot);
  return [
    { x: bench.x - hw * cos - hd * sin, z: bench.z + hw * sin - hd * cos },
    { x: bench.x + hw * cos - hd * sin, z: bench.z - hw * sin - hd * cos },
    { x: bench.x + hw * cos + hd * sin, z: bench.z - hw * sin + hd * cos },
    { x: bench.x - hw * cos + hd * sin, z: bench.z + hw * sin + hd * cos },
  ];
}

// Verifica se um ponto cai sobre o pátio de vagas pintadas (studio-ground) ou faixas pintadas de praça/tablado.
export function inParkingOrPaintedLines(point) {
  // Pátio de vagas de Kong Studios (studio-ground: x in [-18, 18], z in [-23, 13], com vagas pintadas em [-16..-11] e [11..16])
  if (point.x >= -18.5 && point.x <= 18.5 && point.z >= -23.5 && point.z <= 13.5) return true;
  // Deck/passarela de madeira costeira (coast-ground: x in [124.5, 132.5], z in [-30.5, 18.5])
  if (point.x >= 124.5 && point.x <= 132.5 && point.z >= -30.5 && point.z <= 18.5) return true;
  return false;
}

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export const excludeTreesNear = (plan, reserved) => plan.filter(item => item.kind !== 'tree' || reserved.every(point => dist(item, point) >= 4.5));

// Quão perto de um palco o ponto está (m) e, se estiver no anel, o palco de referência.
function stageRing(point) {
  for (const stage of MEMBER_LOCATIONS) { const d = dist(point, stage); if (d >= STAGE_RING[0] && d <= STAGE_RING[1]) return true; }
  return false;
}

// Folga e colisões: o prop precisa ficar fora do asfalto, de prédios, histórias, árvores existentes e do fliperama.
function fits(point, kind, placed) {
  const r = PROP_RADIUS[kind];
  const gap = roadGap(point);
  const minClear = kind === 'car' ? CAR_CLEARANCE : PROP_CLEARANCE;
  if (!Number.isFinite(gap) || gap < minClear + r) return false;
  if (OBSTACLES.some(o => dist(o, point) < o.radius + r + (kind === 'bench' || kind === 'car' ? 0.3 : 1.5))) return false;
  if (DISCOVERIES.some(d => dist(d, point) < (kind === 'car' ? 10 : 9))) return false;
  if (TREE_LOCATIONS.some(t => dist(t, point) < (kind === 'car' ? 4 : 5))) return false;
  if (dist(ARCADE_SPOT, point) < (kind === 'car' ? 6 : 5)) return false;
  if (MEMBER_LOCATIONS.some(m => dist(m, point) < (kind === 'car' ? 9 : kind === 'bench' ? 6.2 : 3.5))) return false;
  if (kind === 'car' && ERA_GATES.some(g => dist(g, point) < 10)) return false;
  const spacing = kind === 'lamp' ? LAMP_SPACING : kind === 'car' ? 6.2 : kind === 'bench' ? 4.2 : MIN_SPACING;
  if (placed.some(p => dist(p, point) < (kind === 'car' && p.kind !== 'car' ? 3.6 : p.kind === 'lamp' || kind === 'lamp' ? LAMP_SPACING : Math.max(spacing, p.kind === 'car' ? 6.2 : 4.2)))) return false;
  return true;
}

function kindFor(point, pick) {
  const gap = roadGap(point);
  // Sem árvores no anel do palco: copas tapavam a visão frontal dos integrantes ao chegar (câmera normal).
  if (stageRing(point)) return pick() < .6 ? 'rock' : 'planter';
  if (gap < 3.2) return pick() < .55 ? 'lamp' : 'rock';
  if (gap < 6.5) return pick() < .5 ? 'planter' : 'tree';
  return 'tree';
}

// Bancos curados (10 unidades): limpa o tablado dos palcos (< 6.8 m) e posiciona os bancos nas praças/calçadas (>= 0.6 m da borda do asfalto, fora de vagas/faixas e tablados).
function planCuratedBenches(placed, counts) {
  for (let i = placed.length - 1; i >= 0; i--) {
    const item = placed[i];
    if ((item.kind === 'rock' || item.kind === 'planter') && MEMBER_LOCATIONS.some(stage => dist(item, stage) < 6.8)) {
      counts[item.kind]--;
      placed.splice(i, 1);
    }
  }
  const curatedBenches = [
    // Praça Kong Studios (recuados para a praça/calçada em frente ao edifício das estrelas, fora das linhas de vaga do studio-ground e de degraus laterais)
    { x: 18.9, z: -9.6, rot: -1.571 },
    { x: 18.9, z: -13.2, rot: -1.571 },
    // Praça do Palco Russel (recuados no gramado/praça fora do tablado do palco e virados de frente para o palco em 59,-102.6)
    { x: 50.2, z: -94.2, rot: 2.333 },
    { x: 55.8, z: -92.4, rot: 2.58 },
    // Praça do Palco 2-D (alinhados na borda externa da praça, voltados para o palco)
    { x: -69.12, z: -82.82, rot: 0.785 },
    { x: -55.68, z: -82.82, rot: -0.785 },
    // Praça do Palco Murdoc
    { x: -49.31, z: -133.71, rot: -0.393 },
    { x: -45.5, z: -134.8, rot: -0.72 },
    // Praça do Palco Noodle
    { x: 28.08, z: -111.58, rot: 2.356 },
    { x: 28.08, z: -125.02, rot: 0.785 },
  ];
  for (const cand of curatedBenches) {
    if (counts.bench >= PROP_LIMITS.bench) break;
    if (OBSTACLES.some(o => dist(o, cand) < o.radius + PROP_RADIUS.bench + 0.1)) continue;
    if (DISCOVERIES.some(d => dist(d, cand) < 9.05)) continue;
    // Se uma pedra ou arbusto ocupava o ponto exato do banco curado, substitui sem afetar árvores
    for (let i = placed.length - 1; i >= 0; i--) {
      const p = placed[i];
      if ((p.kind === 'rock' || p.kind === 'planter') && dist(p, cand) < 3.6) {
        counts[p.kind]--;
        placed.splice(i, 1);
      }
    }
    const bench = { x: +cand.x.toFixed(2), z: +cand.z.toFixed(2), y: 0, kind: 'bench', rot: +cand.rot.toFixed(3), scale: 0.92, variant: 0 };
    const corners = [bench, ...benchFootprintCorners(bench)];
    if (!corners.every(c => roadGap(c) >= 0.6 && !inParkingOrPaintedLines(c))) continue;
    counts.bench++;
    placed.push(bench);
  }
}

// Carros estacionados (25 a 36) nas laterais das avenidas: 100% sobre o ASFALTO (rodas dentro do asfalto, encostados ao meio-fio sem subir na calçada), paralelos ao eixo da via e fora da faixa central do passeio.
function planParkedCars(placed, counts, pick) {
  for (const road of ROADS) {
    if (road.kind === 'lane') continue;
    const half = road.width / 2;
    const offset = half - CAR_HALF_WIDTH - 0.25; // centro a 1.34 m da borda interna do meio-fio -> roda externa a ~0.25 m do meio-fio, 100% no asfalto
    for (let i = 5; i < road.samples.length - 5; i += 2) {
      if (counts.car >= 32) return;
      const prev = road.samples[i - 1], curr = road.samples[i], next = road.samples[i + 1];
      const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
      const tx = dx / len, tz = dz / len, nx = dz / len, nz = -dx / len;
      for (const side of (i % 2 === 0 ? [1, -1] : [-1, 1])) {
        if (counts.car >= 32) return;
        const p = { x: curr.x + nx * side * offset, z: curr.z + nz * side * offset };
        const heading = Math.atan2(tx * side, tz * side);
        const variant = counts.car % 3 === 0 ? 1 : 0; // 0 = car-01-sedan, 1 = car-02-van
        const cand = {
          x: +p.x.toFixed(2),
          z: +p.z.toFixed(2),
          y: -0.085,
          kind: 'car',
          rot: +heading.toFixed(3),
          scale: 1.0,
          variant,
        };
        if (NODES.some((n, id) => dist(n, cand) < NODE_RADIUS[id] + 8.0)) continue;
        if (OBSTACLES.some(o => dist(o, cand) < o.radius + PROP_RADIUS.car + 0.3)) continue;
        if (DISCOVERIES.some(d => dist(d, cand) < 10)) continue;
        if (MEMBER_LOCATIONS.some(m => dist(m, cand) < 10)) continue;
        if (ERA_GATES.some(g => dist(g, cand) < 10.2)) continue;
        if (dist(ARCADE_SPOT, cand) < 6) continue;
        if (placed.some(other => dist(other, cand) < (other.kind === 'car' ? 6.8 : 2.6))) continue;
        const corners = [cand, ...carFootprintCorners(cand)];
        const allOnAsphalt = corners.every(c => {
          const g = roadGap(c);
          const dThis = roadDist(road, c.x, c.z) - half;
          return g <= -0.15 && g >= -2.65 && Math.abs(g - dThis) < 0.06 && ROADS.every(r => r === road || roadDist(r, c.x, c.z) >= r.width / 2 + 1.8);
        });
        if (!allOnAsphalt) continue;
        cand.colorIdx = Math.floor(pick() * 5);
        counts.car++;
        placed.push(cand);
      }
    }
  }
}

// Barreiras viárias (barrier-01-road.glb) posicionadas nas calçadas externas perto de áreas de obra e bordas, fora da pista (folga >= 0.90m).
function planRoadBarriers(placed, counts) {
  for (let z = -165; z <= -25 && counts.barrier < 6; z += 18) {
    for (let x = -95; x <= 95 && counts.barrier < 6; x += 18) {
      const cand = { x, z };
      const gap = roadGap(cand);
      if (gap < 2.2 || gap > 5.0 || !fits(cand, 'barrier', placed)) continue;
      const road = nearestRoad(cand);
      const rot = Math.atan2(road.x - cand.x, road.z - cand.z);
      counts.barrier++;
      placed.push({ x: +cand.x.toFixed(2), z: +cand.z.toFixed(2), kind: 'barrier', rot: +rot.toFixed(3), scale: 1.0, variant: 0 });
    }
  }
}

// Grade com leve variação determinística; cada ponto aceito entra na lista e nos limites por tipo.
export function planStreetProps(seed = 2026) {
  const pick = rng(seed);
  const carPick = rng(seed ^ 0x5A5A5A5A);
  const counts = { tree: 0, bench: 0, planter: 0, lamp: 0, rock: 0, car: 0, barrier: 0 };
  const placed = [];
  const accept = point => {
    const gap = roadGap(point);
    if ((!Number.isFinite(gap) || gap > 16) && !stageRing(point)) return; // longe da rua, só anel de palco
    const kind = kindFor(point, pick);
    if (counts[kind] >= PROP_LIMITS[kind] || !fits(point, kind, placed)) return;
    counts[kind]++;
    const rot = +(pick() * Math.PI * 2).toFixed(3);
    const scale = +(kind === 'tree' ? (.85 + pick() * .40) : (.9 + pick() * .25)).toFixed(3);
    const variant = kind === 'tree' || kind === 'rock' ? counts[kind] % 3 : kind === 'planter' ? counts[kind] % 2 : 0;
    placed.push({ x: +point.x.toFixed(2), z: +point.z.toFixed(2), kind, rot, scale, variant });
  };
  // 1) Primeiro o anel de cada palco (candidatos em círculos), preservando a sequência PRNG original da grade.
  for (const stage of MEMBER_LOCATIONS) for (let r = STAGE_RING[0] + .5; r <= STAGE_RING[1] - .5; r += 1.5) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    accept({ x: stage.x + Math.cos(a) * r, z: stage.z + Math.sin(a) * r });
  }
  // 2) Grade geral do mapa (árvores, arbustos, pedras e postes)
  for (let z = WORLD_BOUNDS.minZ + STEP; z < WORLD_BOUNDS.maxZ; z += STEP) {
    for (let x = WORLD_BOUNDS.minX + STEP; x < WORLD_BOUNDS.maxX; x += STEP) {
      accept({ x: x + (pick() - .5) * 2.4, z: z + (pick() - .5) * 2.4 });
    }
  }
  // 3) Bancos curados e alinhados nas praças/palcos (8 a 12 unidades em escala real)
  planCuratedBenches(placed, counts);
  // 4) Carros estacionados nas laterais das avenidas (25 a 36 unidades a >= 1.2 m da pista)
  planParkedCars(placed, counts, carPick);
  // 5) Barreiras viárias nas laterais de calçada
  planRoadBarriers(placed, counts);
  return placed;
}
