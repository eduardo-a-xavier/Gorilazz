// Plano determinístico de props urbanos (árvores, bancos, canteiros, postes, pedras e carros estacionados) em calçadas, praças e avenidas.
// Lógica pura, sem Three.js, para ser testada em Node. A geração visual fica em street-props.js.
import { roadGap, nearestRoad, ROADS, ERA_GATES, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, TREE_LOCATIONS, WORLD_BOUNDS, behind } from './world-data.js';
import { ARCADE_SPOT } from './arcade.js';

export const PROP_CLEARANCE = 0.9; // m: folga mínima entre a borda do asfalto e a base do prop
export const CAR_CLEARANCE = 1.2;  // m: folga mínima dos carros estacionados à faixa de rodagem
// Raio da base de cada tipo (m), usado na folga e no espaçamento.
export const PROP_RADIUS = { tree: 1.4, bench: 0.9, planter: 0.8, lamp: 0.3, rock: 0.9, car: 1.35, barrier: 0.65 };
// Teto por tipo: o cenário ganha densidade sem virar floresta nem atrapalhar a leitura da rua.
export const PROP_LIMITS = { tree: 70, bench: 12, planter: 60, lamp: 110, rock: 60, car: 36, barrier: 12 };
const STEP = 5;              // m entre candidatos da grade
const MIN_SPACING = 6;       // m entre dois props quaisquer
const LAMP_SPACING = 16;     // m entre postes (poucos e espaçados, como numa avenida)
const STAGE_RING = [4.5, 11]; // m: anel ao redor de cada palco (Russel, Noodle, 2-D e Murdoc)

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

// Bancos curados (8 a 12): limpa o tablado dos palcos (< 6.2 m) e converte até 8 props laterais dos anéis e praças em bancos alinhados.
function planCuratedBenches(placed, counts) {
  for (let i = placed.length - 1; i >= 0; i--) {
    const item = placed[i];
    if ((item.kind === 'rock' || item.kind === 'planter') && MEMBER_LOCATIONS.some(stage => dist(item, stage) < 6.2)) {
      counts[item.kind]--;
      placed.splice(i, 1);
    }
  }
  for (const stage of MEMBER_LOCATIONS) {
    let stageBenches = 0;
    for (const item of placed) {
      if (counts.bench >= PROP_LIMITS.bench || stageBenches >= 2) break;
      if (item.kind !== 'rock' && item.kind !== 'planter') continue;
      const d = dist(item, stage);
      if (d >= 6.4 && d <= 10.5) {
        counts[item.kind]--;
        item.kind = 'bench';
        item.rot = +Math.atan2(stage.x - item.x, stage.z - item.z).toFixed(3);
        item.scale = 0.92;
        item.variant = 0;
        counts.bench++;
        stageBenches++;
      }
    }
  }
  const plazaBenches = [
    { x: -13.5, z: -10.5 }, { x: 13.5, z: -10.5 }, { x: -13.5, z: -16.5 }, { x: 13.5, z: -16.5 },
    { x: 58.0, z: -116.0 }, { x: -72.0, z: -96.0 }, { x: 24.0, z: -48.0 }, { x: -24.0, z: -48.0 },
  ];
  for (const cand of plazaBenches) {
    if (counts.bench >= 10) break;
    if (!fits(cand, 'bench', placed)) continue;
    const road = nearestRoad(cand);
    const rot = Math.atan2(road.x - cand.x, road.z - cand.z);
    counts.bench++;
    placed.push({ x: +cand.x.toFixed(2), z: +cand.z.toFixed(2), kind: 'bench', rot: +rot.toFixed(3), scale: 0.92, variant: 0 });
  }
}

// Carros estacionados (25 a 36) nas laterais/recuos das avenidas: alinhados paralelamente ao meio-fio, a >= 1.2 m da pista.
function planParkedCars(placed, counts, pick) {
  for (const road of ROADS) {
    if (road.kind === 'lane') continue;
    const half = road.width / 2;
    for (let i = 4; i < road.samples.length - 4; i += 3) {
      if (counts.car >= PROP_LIMITS.car) return;
      const prev = road.samples[i - 1], curr = road.samples[i], next = road.samples[i + 1];
      const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
      const tx = dx / len, tz = dz / len, nx = dz / len, nz = -dx / len;
      for (const extra of [0.15, 0.75, 1.45]) {
        const offset = half + CAR_CLEARANCE + PROP_RADIUS.car + extra;
        for (const side of (i % 2 === 0 ? [1, -1] : [-1, 1])) {
          if (counts.car >= PROP_LIMITS.car) return;
          const p = { x: curr.x + nx * side * offset, z: curr.z + nz * side * offset };
          if (!fits(p, 'car', placed)) continue;
          const heading = Math.atan2(tx * side, tz * side);
          const variant = counts.car % 3 === 0 ? 1 : 0; // 0 = car-01-sedan, 1 = car-02-van
          const colorIdx = Math.floor(pick() * 5);
          counts.car++;
          placed.push({
            x: +p.x.toFixed(2),
            z: +p.z.toFixed(2),
            kind: 'car',
            rot: +heading.toFixed(3),
            scale: 1.0,
            variant,
            colorIdx,
          });
          break;
        }
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
