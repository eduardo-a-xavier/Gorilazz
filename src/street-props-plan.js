// Plano determinístico de props urbanos (árvores, bancos, canteiros e postes) em calçadas e praças.
// Lógica pura, sem Three.js, para ser testada em Node. A geração visual fica em street-props.js.
import { roadGap, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, TREE_LOCATIONS, WORLD_BOUNDS } from './world-data.js';
import { ARCADE_SPOT } from './arcade.js';

export const PROP_CLEARANCE = 0.9; // m: folga mínima entre a borda do asfalto e a base do prop
// Raio da base de cada tipo (m), usado na folga e no espaçamento.
export const PROP_RADIUS = { tree: 1.4, bench: 0.9, planter: 0.8, lamp: 0.3 };
// Teto por tipo: o cenário ganha densidade sem virar floresta nem atrapalhar a leitura da rua.
export const PROP_LIMITS = { tree: 70, bench: 60, planter: 60, lamp: 110 };
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
  if (!Number.isFinite(gap) || gap < PROP_CLEARANCE + r) return false;
  if (OBSTACLES.some(o => dist(o, point) < o.radius + r + 1.5)) return false;
  if (DISCOVERIES.some(d => dist(d, point) < 9)) return false;
  if (TREE_LOCATIONS.some(t => dist(t, point) < 5)) return false;
  if (dist(ARCADE_SPOT, point) < 5) return false;
  if (MEMBER_LOCATIONS.some(m => dist(m, point) < 3.5)) return false;
  const spacing = kind === 'lamp' ? LAMP_SPACING : MIN_SPACING;
  if (placed.some(p => dist(p, point) < (p.kind === 'lamp' || kind === 'lamp' ? LAMP_SPACING : spacing))) return false;
  return true;
}

// Escolhe o tipo pela posição: postes e bancos na beira da calçada, canteiros e árvores mais afastados e nos palcos.
function kindFor(point, pick) {
  const gap = roadGap(point);
  // Sem árvores no anel do palco: copas tapavam a visão frontal dos integrantes ao chegar (câmera normal).
  if (stageRing(point)) return pick() < .6 ? 'bench' : 'planter';
  if (gap < 3.2) return pick() < .55 ? 'lamp' : 'bench';
  if (gap < 6.5) return pick() < .5 ? 'planter' : 'tree';
  return 'tree';
}

// Grade com leve variação determinística; cada ponto aceito entra na lista e nos limites por tipo.
export function planStreetProps(seed = 2026) {
  const pick = rng(seed);
  const counts = { tree: 0, bench: 0, planter: 0, lamp: 0 };
  const placed = [];
  const accept = point => {
    const gap = roadGap(point);
    if ((!Number.isFinite(gap) || gap > 16) && !stageRing(point)) return; // longe da rua, só anel de palco
    const kind = kindFor(point, pick);
    if (counts[kind] >= PROP_LIMITS[kind] || !fits(point, kind, placed)) return;
    counts[kind]++;
    placed.push({ x: +point.x.toFixed(2), z: +point.z.toFixed(2), kind, rot: +(pick() * Math.PI * 2).toFixed(3), scale: +(.9 + pick() * .25).toFixed(3) });
  };
  // Primeiro o anel de cada palco (candidatos em círculos), para os integrantes ficarem cercados mesmo com a grade do mundo.
  for (const stage of MEMBER_LOCATIONS) for (let r = STAGE_RING[0] + .5; r <= STAGE_RING[1] - .5; r += 1.5) for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
    accept({ x: stage.x + Math.cos(a) * r, z: stage.z + Math.sin(a) * r });
  }
  for (let z = WORLD_BOUNDS.minZ + STEP; z < WORLD_BOUNDS.maxZ; z += STEP) {
    for (let x = WORLD_BOUNDS.minX + STEP; x < WORLD_BOUNDS.maxX; x += STEP) {
      accept({ x: x + (pick() - .5) * 2.4, z: z + (pick() - .5) * 2.4 });
    }
  }
  return placed;
}
