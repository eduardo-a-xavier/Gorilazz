// Plano determinístico de props urbanos (árvores, bancos, canteiros, postes, pedras e carros estacionados) em calçadas, praças e avenidas.
// Lógica pura, sem Three.js, para ser testada em Node. A geração visual fica em street-props.js.
import { roadGap, nearestRoad, ROADS, NODES, ERA_GATES, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, TREE_LOCATIONS, WORLD_BOUNDS, behind } from './world-data.js';
import { ARCADE_SPOT } from './arcade.js';

export const PROP_CLEARANCE = 0.9; // m: folga mínima entre a borda do asfalto e a base do prop de calçada
export const CAR_CLEARANCE = 1.2;  // m: folga mínima dos carros estacionados à faixa central de rodagem
// Escala dos carros estacionados: o Geep mede ~6,6 m x 3,9 m x 4,0 m no jogo; o sedan (4,4 m) ganha 1,5x (~6,6 m, mesmo comprimento do Geep) e a van 1,65x (altura ~2,9 m).
export const CAR_SCALE = { sedan: 1.5, van: 1.65 };
export const CAR_HALF_WIDTH = 1.09;
export const CAR_HALF_LENGTH = 2.40;
export const BENCH_HALF_LENGTH = 0.86;
export const BENCH_HALF_DEPTH = 0.30;
// Raio da base de cada tipo (m), usado na folga e no espaçamento.
export const PROP_RADIUS = { tree: 1.4, bench: 0.9, planter: 0.8, lamp: 0.3, rock: 0.9, car: 3.0, barrier: 0.65 };
// Teto por tipo: o cenário ganha densidade sem virar floresta nem atrapalhar a leitura da rua.
// Saneamento da banca: bancos e pedras removidos do plano (limite 0); árvores, arbustos, postes e carros permanecem.
export const PROP_LIMITS = { tree: 70, bench: 0, planter: 60, lamp: 110, rock: 0, car: 8, barrier: 12 };
const STEP = 5;              // m entre candidatos da grade
const MIN_SPACING = 6;       // m entre dois props quaisquer
const LAMP_SPACING = 16;     // m entre postes (poucos e espaçados, como numa avenida)
const STAGE_RING = [4.5, 11]; // m: anel ao redor de cada palco (Russel, Noodle, 2-D e Murdoc)

export const NODE_DEGREE = NODES.map((_, id) => ROADS.filter(road => road.from === id || road.to === id).length);
export const NODE_RADIUS = NODES.map((_, id) => {
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
  const hl = (car.variant === 1 ? CAR_HALF_LENGTH : 2.20) * s;
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

// Frente do palco (direção do público) e eixo lateral, em coordenadas do mundo.
export const STAGE_DECK_FRONT = 3.6; // m: borda frontal do tablado a partir do centro (2,4 x escala 1,5)
export const STAGE_DECK_HALF_WIDTH = 6.0;
export const stageFrame = stage => ({ fx: Math.sin(stage.heading), fz: Math.cos(stage.heading), sx: Math.cos(stage.heading), sz: -Math.sin(stage.heading) });
export const benchFacing = (bench, target) => Math.atan2(target.x - bench.x, target.z - bench.z);
export const BENCH_DOOR_CLEARANCE = 3.0; // m além do colisor do lote: a porta fica a mais de 2 m do banco
export const BENCH_FREE = 2.4;           // m entre o centro do banco e qualquer outro prop (>= 1,5 m livres ao redor)

function benchSpotOk(cand, placed) {
  const bench = { x: cand.x, z: cand.z, rot: cand.rot, scale: 0.92 };
  const corners = [bench, ...benchFootprintCorners(bench)];
  if (!corners.every(c => Number.isFinite(roadGap(c)) && roadGap(c) >= 0.6 && !inParkingOrPaintedLines(c))) return false;
  if (OBSTACLES.some(o => dist(o, cand) < o.radius + PROP_RADIUS.bench + BENCH_DOOR_CLEARANCE)) return false;
  if (DISCOVERIES.some(d => dist(d, cand) < 9.05)) return false;
  if (ERA_GATES.some(g => dist(g, cand) < 6)) return false;
  if (dist(ARCADE_SPOT, cand) < 6) return false;
  if (placed.some(p => (p.kind === 'tree' || p.kind === 'bench' || p.kind === 'barrier' || p.kind === 'car') && dist(p, cand) < BENCH_FREE + (p.kind === 'car' ? 2.2 : 0))) return false;
  return true;
}

// Bancos curados (6 a 10): só virados para o palco (4 a 9 m do tablado, de frente para quem toca) ou alinhados à rua sobre calçada limpa, sem porta, vaga ou obstáculo por perto.
function planCuratedBenches(placed, counts) {
  const byStage = [];
  for (const stage of MEMBER_LOCATIONS) {
    const f = stageFrame(stage), chosen = [];
    // O palco fica ~8 m da pista e de frente para ela: só cabe plateia nas laterais frontais do tablado (3 a 9 m do tablado, à frente da linha do palco).
    for (const dx of [7.2, 8, 8.8, 9.4]) for (const zp of [4.6, 5.4, 6.2, 3.8, 7]) for (const sgn of [1, -1]) {
      if (chosen.length >= 2) break;
      const lx = dx * sgn;
      const cand = { x: +(stage.x + f.fx * zp + f.sx * lx).toFixed(2), z: +(stage.z + f.fz * zp + f.sz * lx).toFixed(2), dx: sgn };
      cand.rot = +benchFacing(cand, stage).toFixed(3);
      if (chosen.some(c => dist(c, cand) < 4.2 || c.dx === sgn)) continue;
      if (benchSpotOk(cand, placed)) chosen.push(cand);
    }
    byStage.push(chosen);
  }
  // Até 2 bancos em calçada limpa de avenida (alinhados ao meio-fio, virados para a rua), longe de cruzamentos e palcos.
  const sidewalk = [];
  for (const road of ROADS) {
    if (road.kind === 'lane') continue;
    const half = road.width / 2;
    for (let i = 8; i < road.samples.length - 8 && sidewalk.length < 2; i += 2) {
      const prev = road.samples[i - 1], curr = road.samples[i], next = road.samples[i + 1];
      const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
      const nx = dz / len, nz = -dx / len;
      for (const side of [1, -1]) {
        const off = half + 1.35, cand = { x: +(curr.x + nx * side * off).toFixed(2), z: +(curr.z + nz * side * off).toFixed(2), y: 0.07 };
        cand.rot = +Math.atan2(-nx * side, -nz * side).toFixed(3); // assento voltado para a rua
        if (NODES.some((n, id) => dist(n, cand) < NODE_RADIUS[id] + 9)) continue;
        if (MEMBER_LOCATIONS.some(m => dist(m, cand) < 16) || sidewalk.some(c => dist(c, cand) < 40)) continue;
        const bench = { ...cand, scale: 0.92 };
        if (![bench, ...benchFootprintCorners(bench)].every(c => roadGap(c) >= 0.6 && roadGap(c) <= 2.2)) continue;
        if (benchSpotOk(cand, placed) && !placed.some(p => dist(p, cand) < 3)) { sidewalk.push(cand); break; }
      }
    }
  }
  for (const cand of [...byStage.flat(), ...sidewalk]) {
    if (counts.bench >= PROP_LIMITS.bench) break;
    for (let i = placed.length - 1; i >= 0; i--) {
      const p = placed[i];
      if ((p.kind === 'rock' || p.kind === 'planter' || p.kind === 'lamp') && dist(p, cand) < BENCH_FREE) { counts[p.kind]--; placed.splice(i, 1); }
    }
    counts.bench++;
    placed.push({ x: cand.x, z: cand.z, y: cand.y ?? 0, kind: 'bench', rot: cand.rot, scale: 0.92, variant: 0, ...(cand.y ? { sidewalk: true } : { stage: true }) });
  }
}

// Vagas pintadas de Kong Studios (studio-ground, ver environment.js): separadores a cada 5 m em z; fundos em x = -16 e x = +15,65.
export const BAY_Z = [-18.35, -13.35, -8.35, -3.35, 1.65, 6.65];
export const BAY_BACK_X = { left: -15.8, right: 15.5 };
export const BAY_INNER_X = { left: -7.2, right: 7.2 };
export const CROSSWALK_CLEARANCE = 6; // m: nenhum carro a menos disso de faixa de pedestre/retenção
// Amostras do trecho de faixa de pedestre e retenção de cada chegada a cruzamento (grau >= 3), como em roads.js.
export function crosswalkPoints() {
  const pts = [];
  for (const road of ROADS) for (const [node, order] of [[road.from, road.samples], [road.to, road.samples.slice().reverse()]]) {
    if (NODE_DEGREE[node] < 3) continue;
    const start = order.findIndex(f => Math.hypot(f.x - NODES[node].x, f.z - NODES[node].z) > NODE_RADIUS[node] + 1.2);
    if (start < 0) continue;
    for (let i = start; i < order.length && Math.hypot(order[i].x - order[start].x, order[i].z - order[start].z) < 5; i++) pts.push({ x: order[i].x, z: order[i].z });
  }
  return pts;
}
// Trecho reto em torno de um índice de amostra: variação de rumo pequena numa janela de +-w amostras.
function straightAt(road, i, w = 6) {
  const hd = k => { const a = road.samples[k], b = road.samples[k + 1]; return Math.atan2(b.x - a.x, b.z - a.z); };
  const ref = hd(i);
  for (let k = i - w; k <= i + w; k++) { const d = Math.abs(Math.atan2(Math.sin(hd(k) - ref), Math.cos(hd(k) - ref))); if (d > 0.05) return false; }
  return true;
}

const CROSSWALKS = crosswalkPoints();
export const CAR_GATE_CLEARANCE = 8, CAR_DISCOVERY_CLEARANCE = 8, CAR_ARCADE_CLEARANCE = 6;
function carOk(cand) {
  if (OBSTACLES.some(o => dist(o, cand) < o.radius + 3.6)) return false;
  if (DISCOVERIES.some(d => dist(d, cand) < CAR_DISCOVERY_CLEARANCE)) return false;
  if (MEMBER_LOCATIONS.some(m => dist(m, cand) < 12)) return false;
  if (ERA_GATES.some(g => dist(g, cand) < CAR_GATE_CLEARANCE)) return false;
  if (dist(ARCADE_SPOT, cand) < CAR_ARCADE_CLEARANCE) return false;
  if (TREE_LOCATIONS.some(t => dist(t, cand) < 6)) return false;
  if ([cand, ...carFootprintCorners(cand)].some(c => CROSSWALKS.some(q => dist(q, c) < CROSSWALK_CLEARANCE))) return false;
  if (NODES.some((n, id) => NODE_DEGREE[id] >= 3 && dist(n, cand) < NODE_RADIUS[id] + 14)) return false;
  return true;
}

// 6 a 8 carros na escala do Geep: 6 dentro das vagas pintadas do estacionamento do studio-ground e até 2 em recuos retos e longos de avenida, longe de faixas, esquinas, curvas e portais.
function planParkedCars(placed, counts, pick) {
  const clear = cand => {
    for (let i = placed.length - 1; i >= 0; i--) {
      const p = placed[i];
      if (p.kind === 'tree') { if (dist(p, cand) < 5) return false; continue; }
      if (p.kind === 'car' || p.kind === 'bench') { if (dist(p, cand) < 4.9) return false; continue; }
      if (dist(p, cand) < 4.4 + (PROP_RADIUS[p.kind] ?? 1)) { counts[p.kind]--; placed.splice(i, 1); }
    }
    return true;
  };
  const order = [0, 1].flatMap(par => ['right', 'left'].flatMap(col => BAY_Z.map((_, idx) => [col, idx]).filter(([, idx]) => idx % 2 === par)));
  let bayCars = 0;
  for (const [col, idx] of order) {
    if (bayCars >= 6) break;
    const type = (bayCars % 3 === 1) ? 'van' : 'sedan', variant = type === 'van' ? 1 : 0, scale = CAR_SCALE[type];
    const hl = (variant ? CAR_HALF_LENGTH : 2.20) * scale;
    const left = col === 'left';
    const x = left ? BAY_BACK_X.left + 0.3 + hl : BAY_BACK_X.right - 0.3 - hl;
    const cand = { x: +x.toFixed(2), z: BAY_Z[idx], y: -0.12, kind: 'car', rot: +(left ? -Math.PI / 2 : Math.PI / 2).toFixed(3), scale, variant, bay: true };
    if (!carOk(cand) || !clear(cand)) continue;
    cand.colorIdx = Math.floor(pick() * 5); counts.car++; bayCars++; placed.push(cand);
  }
  for (const road of ROADS) {
    if (road.kind === 'lane' || counts.car >= 8) continue;
    const half = road.width / 2;
    for (let i = 10; i < road.samples.length - 10 && counts.car < 8; i++) {
      if (!straightAt(road, i)) continue;
      const prev = road.samples[i - 1], curr = road.samples[i], next = road.samples[i + 1];
      const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
      const tx = dx / len, tz = dz / len, nx = dz / len, nz = -dx / len;
      const side = i % 2 ? 1 : -1, type = counts.car % 2 ? 'van' : 'sedan', scale = CAR_SCALE[type], variant = type === 'van' ? 1 : 0;
      const offset = half - CAR_HALF_WIDTH * scale - 0.3;
      const cand = { x: +(curr.x + nx * side * offset).toFixed(2), z: +(curr.z + nz * side * offset).toFixed(2), y: -0.085, kind: 'car', rot: +Math.atan2(tx * side, tz * side).toFixed(3), scale, variant };
      const corners = [cand, ...carFootprintCorners(cand)];
      if (!corners.every(c => { const g = roadGap(c); return g <= -0.15 && g >= -3.6 && ROADS.every(r => r === road || roadDist(r, c.x, c.z) >= r.width / 2 + 2); })) continue;
      if (placed.some(o => o.kind === 'car' && dist(o, cand) < 45)) continue;
      if (inParkingOrPaintedLines(cand) || NODES.some((n, id) => dist(n, cand) < NODE_RADIUS[id] + 14)) continue;
      if (!carOk(cand) || !clear(cand)) continue;
      cand.colorIdx = Math.floor(pick() * 5); counts.car++; placed.push(cand);
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
  // 3) Bancos curados: virados para o palco ou em calçada limpa (6 a 10 unidades)
  planCuratedBenches(placed, counts);
  // 4) Carros estacionados (6 a 8) em vagas pintadas e recuos retos
  planParkedCars(placed, counts, carPick);
  // 5) Barreiras viárias nas laterais de calçada
  planRoadBarriers(placed, counts);
  return placed;
}
