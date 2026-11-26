import { PLATE_STYLE } from './sign-style.js';
import * as THREE from './vendor/three.module.min.js';
import { ROADS, NODES, CITY_LOTS, DISCOVERIES, MEMBER_LOCATIONS, ERA_GATES, VISUAL_LANDMARKS } from './world-data.js';
import { ARCADE_SPOT } from './arcade.js';
import { createSlabTexture } from './ground-textures.js';

// Malha viária desenhada como rua de verdade: asfalto, rotatórias limpas nos cruzamentos de grau >= 3,
// emendas contínuas nos nós de grau 2, calçada elevada com meio-fio, tampas e saia até abaixo do chão,
// faixas de borda, eixo duplo amarelo nas avenidas, faixas de pedestre, postes, placas e estêncis.

export const LEVEL = { asphalt: -.09, junction: -.082, paint: -.07, walk: .07, skirt: -.32 };
export const WALK = { studio: 2.4, avenue: 2.4, lane: 1.5 };
export const NODE_DEGREE = NODES.map((_, id) => ROADS.filter(road => road.from === id || road.to === id).length);
// Raio do cruzamento: nas rotatórias (grau >= 3) o disco de asfalto termina na borda externa da calçada de cada via
// (meia-via + largura da calçada do tipo da via), para não passar das faixas de pedestre nem sobrepor a calçada.
export const NODE_RADIUS = NODES.map((_, id) => {
  const incident = ROADS.filter(road => road.from === id || road.to === id);
  const maxHalf = Math.max(...incident.map(road => road.width)) / 2;
  // Rotatória (grau >= 3): disco até a borda externa da calçada de cada via + 1 m (cobre a sobreposição das vias); piso de 9,5 m.
  if (NODE_DEGREE[id] >= 3) return Math.max(9.5, Math.max(...incident.map(road => road.width / 2 + WALK[road.kind])) + 1.2);
  return maxHalf + 2.5;
});

function sheet() { return { positions: [], uvs: [], indices: [] }; }
function triangle(target, a, b, c, uv = [0, 0, 1, 0, 1, 1]) {
  const n = target.positions.length / 3;
  target.positions.push(...a, ...b, ...c); target.uvs.push(...uv); target.indices.push(n, n + 1, n + 2);
}
function quad(target, a, b, c, d, uv = [0, 0, 1, 0, 1, 1, 0, 1]) {
  const n = target.positions.length / 3;
  target.positions.push(...a, ...b, ...c, ...d); target.uvs.push(...uv); target.indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
}
function toMesh(target, material, name = '') {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(target.positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(target.uvs, 2));
  geometry.setIndex(target.indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.name = name; mesh.receiveShadow = true; return mesh;
}
export function gap(road, x, z) {
  let best = Infinity;
  for (let i = 1; i < road.samples.length; i++) {
    const a = road.samples[i - 1], b = road.samples[i], dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}
export const inJunction = (x, z, pad = 0) => NODES.some((node, id) => Math.hypot(x - node.x, z - node.z) < NODE_RADIUS[id] - 1e-4 + pad);
export const inRoundabout = (x, z, pad = 0) => NODES.some((node, id) => NODE_DEGREE[id] >= 3 && Math.hypot(x - node.x, z - node.z) < NODE_RADIUS[id] - 1e-4 + pad);
export const onAsphalt = (x, z, except = null, pad = 0) => ROADS.some(road => road !== except && gap(road, x, z) < road.width / 2 + pad);

function atlas(rows, height, paint) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = height * rows.length;
  const context = canvas.getContext('2d'); context.textAlign = 'center'; context.textBaseline = 'middle';
  rows.forEach((text, i) => paint(context, text, i * height, height));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

// Quinas de calçada entre duas vias vizinhas de um cruzamento: um contorno contínuo, não células.
// Região além dos dois meios-fios (cunha convexa), com canto arredondado por arco de raio fixo (CORNER_RC),
// tangente às duas vias, recortada pelo anel do cruzamento. Sai como polígono convexo (fan).
export const CORNER_FILL = false;
export const CORNER_RC = 4, CORNER_ARC_SEGMENTS = 14, CORNER_MAX_GAP = 2.62, CORNER_MIN_GAP = 1.2;
const RIM_SEGMENTS = 96;
function clipConvex(subject, clip) {
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const A = clip[i], B = clip[(i + 1) % clip.length], input = out; out = [];
    const side = p => (B[0] - A[0]) * (p[1] - A[1]) - (B[1] - A[1]) * (p[0] - A[0]);
    for (let k = 0; k < input.length; k++) {
      const P = input[k], Q = input[(k + 1) % input.length], sp = side(P), sq = side(Q);
      if (sp >= 0) out.push(P);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
    }
  }
  return out;
}
// Arredonda vértices agudos (< 90°) com arco tangente aos dois lados: o recorte do meio-fio no anel fica suave, sem dentes.
export const CORNER_VERTEX_R = 2.5;
function roundCorners(poly, r) {
  const out = [];
  const n = poly.length;
  for (let i = 0; i < n; i++) {
    const P = poly[(i - 1 + n) % n], V = poly[i], N = poly[(i + 1) % n];
    const ux = P[0] - V[0], uz = P[1] - V[1], vx = N[0] - V[0], vz = N[1] - V[1];
    const lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
    if (lu < 1e-6 || lv < 1e-6) { out.push(V); continue; }
    const cos = (ux * vx + uz * vz) / (lu * lv), theta = Math.acos(Math.max(-1, Math.min(1, cos)));
    if (theta >= Math.PI / 2 - 1e-6) { out.push(V); continue; }
    const d = Math.min(r / Math.tan(theta / 2), lu / 2, lv / 2), rr = d * Math.tan(theta / 2);
    const T1 = [V[0] + ux / lu * d, V[1] + uz / lu * d], T2 = [V[0] + vx / lv * d, V[1] + vz / lv * d];
    const bx = ux / lu + vx / lv, bz = uz / lu + vz / lv, bl = Math.hypot(bx, bz) || 1;
    const dc = rr / Math.sin(theta / 2), Cc = [V[0] + bx / bl * dc, V[1] + bz / bl * dc];
    const a1 = Math.atan2(T1[1] - Cc[1], T1[0] - Cc[0]);
    let sw = Math.atan2(T2[1] - Cc[1], T2[0] - Cc[0]) - a1; while (sw > Math.PI) sw -= 2 * Math.PI; while (sw < -Math.PI) sw += 2 * Math.PI;
    for (let k = 0; k <= 6; k++) { const a = a1 + sw * k / 6; out.push([Cc[0] + Math.cos(a) * rr, Cc[1] + Math.sin(a) * rr]); }
  }
  return out;
}
export function cornerBlocks(id) {
  const node = NODES[id], rIn = NODE_RADIUS[id];
  const arms = ROADS.filter(road => road.from === id || road.to === id).map(road => {
    const pts = road.from === id ? road.samples : road.samples.slice().reverse();
    const p = pts.find(q => Math.hypot(q.x - node.x, q.z - node.z) > rIn + 2) ?? pts[pts.length - 1];
    const dx = p.x - node.x, dz = p.z - node.z, L = Math.hypot(dx, dz) || 1;
    return { e: [dx / L, dz / L], h: road.width / 2, angle: Math.atan2(dz, dx) };
  }).sort((u, v) => u.angle - v.angle);
  const rim = Array.from({ length: RIM_SEGMENTS }, (_, i) => { const t = i / RIM_SEGMENTS * Math.PI * 2; return [node.x + Math.cos(t) * rIn, node.z + Math.sin(t) * rIn]; });
  const blocks = [];
  if (arms.length < 2) return blocks;
  for (let k = 0; k < arms.length; k++) {
    const A = arms[k], B = arms[(k + 1) % arms.length];
    let gap = B.angle - A.angle; if (gap <= 0) gap += Math.PI * 2;
    if (arms.length === 2 && k === 1) break;
    if (gap < CORNER_MIN_GAP || gap > CORNER_MAX_GAP) continue;
    // Normais dos meios-fios voltadas uma para a outra.
    let nA = [-A.e[1], A.e[0]], nB = [-B.e[1], B.e[0]];
    if (nA[0] * B.e[0] + nA[1] * B.e[1] < 0) nA = [-nA[0], -nA[1]];
    if (nB[0] * A.e[0] + nB[1] * A.e[1] < 0) nB = [-nB[0], -nB[1]];
    // X = interseção das duas linhas de meio-fio: nA*hA + eA*t = nB*hB + eB*u.
    const ra = [nB[0] * B.h - nA[0] * A.h, nB[1] * B.h - nA[1] * A.h];
    const bx = -B.e[0], bz = -B.e[1];
    const det = A.e[0] * bz - A.e[1] * bx;
    if (Math.abs(det) < 1e-6) continue;
    const t = (ra[0] * bz - ra[1] * bx) / det, u = (A.e[0] * ra[1] - A.e[1] * ra[0]) / det;
    if (t <= 0 || u <= 0) continue;
    const X = [node.x + nA[0] * A.h + A.e[0] * t, node.z + nA[1] * A.h + A.e[1] * t];
    const beta = Math.acos(Math.max(-1, Math.min(1, A.e[0] * B.e[0] + A.e[1] * B.e[1])));
    const d = CORNER_RC / Math.tan(beta / 2);
    let bisX = A.e[0] + B.e[0], bisZ = A.e[1] + B.e[1]; const bl = Math.hypot(bisX, bisZ) || 1; bisX /= bl; bisZ /= bl;
    const C = [X[0] + bisX * CORNER_RC / Math.sin(beta / 2), X[1] + bisZ * CORNER_RC / Math.sin(beta / 2)];
    const TA = [X[0] + A.e[0] * d, X[1] + A.e[1] * d], TB = [X[0] + B.e[0] * d, X[1] + B.e[1] * d];
    const a1 = Math.atan2(TA[1] - C[1], TA[0] - C[0]);
    let a2 = Math.atan2(TB[1] - C[1], TB[0] - C[0]); let sweep = a2 - a1; while (sweep > Math.PI) sweep -= 2 * Math.PI; while (sweep < -Math.PI) sweep += 2 * Math.PI;
    const poly = [[TA[0] + A.e[0] * 60, TA[1] + A.e[1] * 60], TA];
    for (let i = 0; i <= CORNER_ARC_SEGMENTS; i++) { const a = a1 + sweep * i / CORNER_ARC_SEGMENTS; poly.push([C[0] + Math.cos(a) * CORNER_RC, C[1] + Math.sin(a) * CORNER_RC]); }
    poly.push([TB[0] + B.e[0] * 60, TB[1] + B.e[1] * 60], [C[0] + bisX * 80, C[1] + bisZ * 80]);
    const clipped = roundCorners(clipConvex(poly, rim), CORNER_VERTEX_R);
    if (clipped.length >= 3) blocks.push(clipped);
  }
  return blocks;
}

export function buildRoads(group, surfaces, material) {
  const radius = NODE_RADIUS;
  // Quadro de referência por amostra: posição, tangente, normal e distância percorrida.
  const frames = ROADS.map(road => { let along = 0; return road.samples.map((point, i) => {
    const previous = road.samples[Math.max(0, i - 1)], next = road.samples[Math.min(road.samples.length - 1, i + 1)];
    const dx = next.x - previous.x, dz = next.z - previous.z, length = Math.hypot(dx, dz) || 1;
    if (i) along += Math.hypot(point.x - previous.x, point.z - previous.z);
    return { x: point.x, z: point.z, tx: dx / length, tz: dz / length, nx: dz / length, nz: -dx / length, along };
  }); });
  const at = (frame, offset, y) => [frame.x + frame.nx * offset, y, frame.z + frame.nz * offset];
  const between = (a, b, offset) => [(a.x + b.x) / 2 + (a.nx + b.nx) / 2 * offset, (a.z + b.z) / 2 + (a.nz + b.nz) / 2 * offset];
  function strip(target, road, from, to, y, keep) {
    const lo = Math.min(from, to), hi = Math.max(from, to);
    const list = frames[road.id];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1]; if (!keep(a, b, i)) continue;
      quad(target, at(a, hi, y), at(a, lo, y), at(b, lo, y), at(b, hi, y), [hi / 3, a.along / 3, lo / 3, a.along / 3, lo / 3, b.along / 3, hi / 3, b.along / 3]);
    }
  }
  // Barra reta a partir de uma amostra: faixas de pedestre e linhas de retenção, validando os 4 cantos no asfalto da própria rua.
  function bar(target, road, frame, from, to, length, y = LEVEL.paint) {
    const lo = Math.min(from, to), hi = Math.max(from, to), half = road.width / 2;
    const a = at(frame, hi, y), b = at(frame, lo, y), shift = ([x, h, z]) => [x + frame.tx * length, h, z + frame.tz * length];
    const c = shift(b), d = shift(a);
    const corners = [a, b, c, d];
    if (!corners.every(([x, , z]) => gap(road, x, z) <= half - .1 && !inJunction(x, z) && !onAsphalt(x, z, road, .1))) return;
    quad(target, a, b, c, d);
  }

  const asphalt = sheet(), pavement = sheet(), white = sheet(), yellow = sheet();
  // Segmentos mantidos da calçada de cada braço (chave `${road.id}:${side}`), usados para fechar a ponta no disco.
  const keptSidewalk = new Map();
  for (const road of ROADS) {
    const half = road.width / 2, walk = WALK[road.kind], list = frames[road.id];
    // Recorta os segmentos internos aos discos de cruzamento para evitar sobreposição sob os nós.
    const keepAsphalt = (a, b) => {
      const corners = [at(a, -half, 0), at(a, half, 0), at(b, half, 0), at(b, -half, 0)];
      return !NODES.some((node, id) => corners.every(([x, , z]) => Math.hypot(x - node.x, z - node.z) < radius[id] - .15));
    };
    strip(asphalt, road, -half, half, LEVEL.asphalt, keepAsphalt);
    // Calçada, meio-fio, tampas e saia externa: testa centro e todos os 4 cantos contra cruzamentos e outras pistas.
    for (const side of [-1, 1]) {
      const keep = (a, b) => {
        const pts = [
          between(a, b, side * (half + walk / 2)),
          [a.x + a.nx * side * half, a.z + a.nz * side * half],
          [a.x + a.nx * side * (half + walk), a.z + a.nz * side * (half + walk)],
          [b.x + b.nx * side * (half + walk), b.z + b.nz * side * (half + walk)],
          [b.x + b.nx * side * half, b.z + b.nz * side * half],
        ];
        return pts.every(([x, z]) => !inJunction(x, z, .1) && !onAsphalt(x, z, road, .15));
      };
      const kept = Array.from({ length: list.length - 1 }, (_, i) => keep(list[i], list[i + 1]));
      keptSidewalk.set(`${road.id}:${side}`, kept);
      strip(pavement, road, side * half, side * (half + walk), LEVEL.walk, (_a, _b, i) => kept[i]);
      const outer = side * (half + walk), inner = side * half;
      for (let i = 0; i < list.length - 1; i++) {
        if (!kept[i]) continue;
        const a = list[i], b = list[i + 1];
        // Meio-fio interno (do asfalto até o topo da calçada).
        quad(pavement, at(a, inner, LEVEL.asphalt), at(a, inner, LEVEL.walk), at(b, inner, LEVEL.walk), at(b, inner, LEVEL.asphalt));
        // Saia vertical externa (do topo da calçada até y = -0.32, abaixo do terreno em -0.30).
        quad(pavement, at(a, outer, LEVEL.walk), at(a, outer, LEVEL.skirt), at(b, outer, LEVEL.skirt), at(b, outer, LEVEL.walk));
        // Tampas verticais nas extremidades onde a calçada encontra outra rua ou rotatória.
        if (i === 0 || !kept[i - 1]) {
          quad(pavement, at(a, inner, LEVEL.skirt), at(a, outer, LEVEL.skirt), at(a, outer, LEVEL.walk), at(a, inner, LEVEL.walk));
        }
        if (i === list.length - 2 || !kept[i + 1]) {
          quad(pavement, at(b, inner, LEVEL.walk), at(b, outer, LEVEL.walk), at(b, outer, LEVEL.skirt), at(b, inner, LEVEL.skirt));
        }
      }
    }
    // Pintura: some dentro das rotatórias (grau >= 3) e onde duas ruas se sobrepõem. Nos nós de grau 2 passa contínua.
    const painted = offset => (a, b) => {
      const pts = [between(a, b, offset), [a.x + a.nx * offset, a.z + a.nz * offset], [b.x + b.nx * offset, b.z + b.nz * offset]];
      return pts.every(([x, z]) => !inRoundabout(x, z, .6) && !onAsphalt(x, z, road, .25));
    };
    const dashed = (offset, on, cycle) => (a, b) => a.along % cycle < on && painted(offset)(a, b);
    for (const side of [-1, 1]) strip(white, road, side * (half - .55), side * (half - .37), LEVEL.paint, painted(side * (half - .45)));
    if (road.kind === 'lane') strip(white, road, -.08, .08, LEVEL.paint, dashed(0, 3, 7.5));
    else {
      for (const side of [-1, 1]) {
        strip(yellow, road, side * .13, side * .27, LEVEL.paint, painted(0));
        strip(white, road, side * half / 2 - .07, side * half / 2 + .07, LEVEL.paint, dashed(side * half / 2, 3.2, 9));
      }
    }
    // Faixa de pedestres e linha de retenção apenas na chegada a cruzamentos reais (grau >= 3).
    for (const [node, order] of [[road.from, list], [road.to, list.slice().reverse()]]) {
      if (NODE_DEGREE[node] < 3) continue;
      const start = order.findIndex(frame => Math.hypot(frame.x - NODES[node].x, frame.z - NODES[node].z) > radius[node] + 1.2);
      const frame = order[start]; if (!frame || onAsphalt(frame.x, frame.z, road, 1.5)) continue;
      const away = order === list ? 1 : -1, facing = { ...frame, tx: frame.tx * away, tz: frame.tz * away, nx: frame.nx * away, nz: frame.nz * away };
      for (let offset = -half + 1.1; offset < half - 1.3; offset += 1.15) bar(white, road, facing, offset, offset + .6, 2.8);
      const stopFrame = order.find((entry, idx) => idx > start && Math.hypot(entry.x - frame.x, entry.z - frame.z) >= 3.6);
      if (stopFrame) {
        const stopFacing = { ...stopFrame, tx: stopFrame.tx * away, tz: stopFrame.tz * away, nx: stopFrame.nx * away, nz: stopFrame.nz * away };
        bar(white, road, stopFacing, -half + .85, half - .85, .4);
      }
    }
  }
  // Cruzamentos e emendas: disco de asfalto em todos os nós; pintura de rotatória apenas em nós com degree >= 3.
  NODES.forEach((node, id) => {
    const steps = 72, ring = WALK.avenue, rIn = radius[id], rOut = rIn + ring, isRoundabout = NODE_DEGREE[id] >= 3;
    // Lajes de quina desativadas (ver CORNER_FILL): entravam no miolo da rotatória e apareciam como leques inclinados.
    if (CORNER_FILL) for (const poly of cornerBlocks(id)) for (let k = 1; k + 1 < poly.length; k++) {
      // Fan convexo a partir do primeiro vértice, com normal +Y (orientação conferida no plano xz).
      let b1 = poly[k], b2 = poly[k + 1];
      const area2 = (b1[0] - poly[0][0]) * (b2[1] - poly[0][1]) - (b1[1] - poly[0][1]) * (b2[0] - poly[0][0]);
      if (Math.abs(area2) < 1e-7) continue; // triângulo degenerado (pontos repetidos ou colineares)
      if (area2 > 0) [b1, b2] = [b2, b1];
      triangle(pavement, [poly[0][0], LEVEL.walk, poly[0][1]], [b1[0], LEVEL.walk, b1[1]], [b2[0], LEVEL.walk, b2[1]]);
    }
    const point = (angle, r, y) => [node.x + Math.cos(angle) * r, y, node.z + Math.sin(angle) * r];
    const keptRing = Array.from({ length: steps }, (_, i) => {
      const a0 = i / steps * Math.PI * 2, a1 = (i + 1) / steps * Math.PI * 2, mid = (a0 + a1) / 2;
      const pts = [point(mid, rIn + ring / 2, 0), point(a0, rIn, 0), point(a0, rOut, 0), point(a1, rOut, 0), point(a1, rIn, 0)];
      return pts.every(([x, , z]) => !onAsphalt(x, z, null, .15) && !NODES.some((other, oid) => oid !== id && Math.hypot(x - other.x, z - other.z) < radius[oid]));
    });
    // Chanfro de cada braço: a faixa de calçada entre a ponta mantida do braço e o disco (raio rIn) fica no topo +0,07,
    // com meio-fio da corda até o asfalto. Sem isso sobra um recorte reto onde o anel some na faixa do braço.
    for (const road of ROADS) {
      if (road.from !== id && road.to !== id) continue;
      const list = frames[road.id], half = road.width / 2, walk = WALK[road.kind], fromNode = road.from === id;
      for (const side of [-1, 1]) {
        const kept = keptSidewalk.get(`${road.id}:${side}`);
        if (!kept) continue;
        // Primeiro segmento mantido contando do nó (em `from` começa no índice 0; em `to`, no fim da lista).
        const i = fromNode ? kept.indexOf(true) : kept.lastIndexOf(true);
        if (i < 0) continue;
        const frame = fromNode ? list[i] : list[i + 1];
        // Cruzamento da linha de meio-fio (offset fixo) com o círculo do disco, andando do braço em direção ao nó.
        const step = fromNode ? -1 : 1, frameIndex = fromNode ? i : i + 1;
        const crossing = offset => {
          let prev = at(list[frameIndex], offset, LEVEL.walk), dPrev = Math.hypot(prev[0] - node.x, prev[2] - node.z);
          for (let j = frameIndex + step; j >= 0 && j < list.length; j += step) {
            const p = at(list[j], offset, LEVEL.walk), d = Math.hypot(p[0] - node.x, p[2] - node.z);
            if (d <= rIn) {
              const t = (dPrev - rIn) / (dPrev - d || 1), qx = prev[0] + (p[0] - prev[0]) * t - node.x, qz = prev[2] + (p[2] - prev[2]) * t - node.z, L = Math.hypot(qx, qz) || 1;
              return [node.x + qx / L * rIn, LEVEL.walk, node.z + qz / L * rIn]; // sobre o arco do disco, não na corda
            }
            prev = p; dPrev = d;
          }
          return null;
        };
        const innerEnd = at(frame, side * half, LEVEL.walk), outerEnd = at(frame, side * (half + walk), LEVEL.walk);
        const innerRim = crossing(side * half), outerRim = crossing(side * (half + walk));
        if (!innerRim || !outerRim) continue;
        const corners = [innerRim, outerRim, outerEnd, innerEnd];
        // Não cobre asfalto de outra via.
        if (corners.some(([x, , z]) => onAsphalt(x, z, road, .15))) continue;
        // Topo com normal +Y: a ordem dos vértices é invertida quando o sentido sai para baixo.
        const ny = (outerRim[2] - innerRim[2]) * (outerEnd[0] - innerRim[0]) - (outerRim[0] - innerRim[0]) * (outerEnd[2] - innerRim[2]);
        if (ny < 0) quad(pavement, innerRim, innerEnd, outerEnd, outerRim); else quad(pavement, innerRim, outerRim, outerEnd, innerEnd);
        // Meio-fio da corda do disco: do asfalto (-0,082) até o topo (+0,07).
        quad(pavement, [innerRim[0], LEVEL.junction, innerRim[2]], [outerRim[0], LEVEL.junction, outerRim[2]], outerRim, innerRim);
      }
    }
    for (let i = 0; i < steps; i++) {
      const a0 = i / steps * Math.PI * 2, a1 = (i + 1) / steps * Math.PI * 2;
      const rim1 = point(a1, rIn, LEVEL.junction), rim0 = point(a0, rIn, LEVEL.junction);
      triangle(asphalt, [node.x, LEVEL.junction, node.z], rim1, rim0, [node.x / 3, node.z / 3, rim1[0] / 3, rim1[2] / 3, rim0[0] / 3, rim0[2] / 3]);
      if (isRoundabout) {
        // Mini-rotatória pintada com normal +Y: apenas nos cruzamentos de 3 ou mais vias.
        quad(yellow, point(a0, 2.1, LEVEL.paint), point(a1, 2.1, LEVEL.paint), point(a1, 2.5, LEVEL.paint), point(a0, 2.5, LEVEL.paint));
        if (i % 6 < 3) quad(white, point(a0, rIn - .9, LEVEL.paint), point(a1, rIn - .9, LEVEL.paint), point(a1, rIn - .7, LEVEL.paint), point(a0, rIn - .7, LEVEL.paint));
      }
      if (!keptRing[i]) continue;
      // Topo do anel de calçada com normal +Y.
      quad(pavement, point(a0, rIn, LEVEL.walk), point(a1, rIn, LEVEL.walk), point(a1, rOut, LEVEL.walk), point(a0, rOut, LEVEL.walk));
      // Meio-fio interno do anel.
      quad(pavement, point(a0, rIn, LEVEL.junction), point(a0, rIn, LEVEL.walk), point(a1, rIn, LEVEL.walk), point(a1, rIn, LEVEL.junction));
      // Saia vertical externa do anel até y = -0.32.
      quad(pavement, point(a0, rOut, LEVEL.walk), point(a0, rOut, LEVEL.skirt), point(a1, rOut, LEVEL.skirt), point(a1, rOut, LEVEL.walk));
      // Tampas radiais onde o anel abre para a chegada de uma via.
      if (!keptRing[(i - 1 + steps) % steps]) {
        quad(pavement, point(a0, rIn, LEVEL.skirt), point(a0, rOut, LEVEL.skirt), point(a0, rOut, LEVEL.walk), point(a0, rIn, LEVEL.walk));
      }
      if (!keptRing[(i + 1) % steps]) {
        quad(pavement, point(a1, rIn, LEVEL.walk), point(a1, rOut, LEVEL.walk), point(a1, rOut, LEVEL.skirt), point(a1, rIn, LEVEL.skirt));
      }
    }
  });
  // Asfalto em repetição de 4 m: o uv do traçado é 1 unidade a cada 3 m, então a textura repete 0,75.
  const road = surfaces.get('asphalt', .75); road.side = THREE.DoubleSide;
  const paint = color => new THREE.MeshStandardMaterial({ color, roughness: .75, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  // Calçada de ladrilho com rejunte (textura procedural, sem arquivo): uv de 3 m por repetição, como em strip().
  // Calçada: textura CC0 (ambientCG PavingStones130) em repetição de 4 m; uv do traçado é 1 unidade por 3 m, então repete 0,75.
  // Nos testes (Node, sem document) usa a textura procedural de ladrilho.
  const concrete = new THREE.MeshStandardMaterial({ color: '#ffffff', map: createSlabTexture(THREE), roughness: .92, side: THREE.DoubleSide });
  if (typeof document !== 'undefined') {
    const loader = new THREE.TextureLoader();
    const tune = t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(.75, .75); t.anisotropy = 8; return t; }; // anisotropia 8
    concrete.map = tune(loader.load('./assets/materials/paving.webp', () => { concrete.needsUpdate = true; })); concrete.map.colorSpace = THREE.SRGBColorSpace;
    concrete.normalMap = tune(loader.load('./assets/materials/paving-normal.webp')); concrete.normalScale.set(.35, .35);
    concrete.roughness = .9;
  }
  group.add(
    toMesh(asphalt, road, 'road-asphalt'),
    toMesh(pavement, concrete, 'road-pavement'),
    toMesh(white, paint('#ece8da'), 'road-white'),
    toMesh(yellow, paint('#e2b23c'), 'road-yellow'),
  );

  // Nomes das ruas: pintados no asfalto (lidos por quem dirige) e em placas nas esquinas.
  const stencil = atlas(ROADS.map(item => item.short), 96, (context, text, y, height) => {
    context.fillStyle = '#f1ecdc'; context.font = 'bold 74px "Arial Narrow", "Arial Black", Arial, sans-serif'; context.fillText(text, 256, y + height / 2 + 4, 490);
  });
  // Placa padrão: moldura metálica escura, painel escuro e Anton em alto contraste (sign-style.js).
  const plates = atlas(ROADS.map(item => item.name), 96, (context, text, y, height) => {
    context.fillStyle = PLATE_STYLE.frame; context.fillRect(0, y, 512, height);
    context.fillStyle = PLATE_STYLE.panel; context.fillRect(8, y + 8, 496, height - 16);
    context.strokeStyle = PLATE_STYLE.frame; context.lineWidth = 3; context.strokeRect(12, y + 12, 488, height - 24);
    context.fillStyle = PLATE_STYLE.frame; for (const [rx, ry] of [[22, 22], [490, 22], [22, height - 22], [490, height - 22]]) { context.beginPath(); context.arc(rx, y + ry, 4, 0, Math.PI * 2); context.fill(); }
    context.font = `50px ${PLATE_STYLE.font}`; context.fillStyle = PLATE_STYLE.shadow; context.fillText(text.toUpperCase(), 258, y + height / 2 + 4, 462);
    context.fillStyle = PLATE_STYLE.ink; context.fillText(text.toUpperCase(), 256, y + height / 2 + 2, 462);
  });
  const stencilMaterial = new THREE.MeshStandardMaterial({ map: stencil, alphaTest: .35, roughness: .8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plates, emissiveMap: plates, emissive: '#ffffff', emissiveIntensity: .25, roughness: .6 });
  const pole = material('#3c4744'), lampGlow = material('#f1d49e', true), names = sheet();
  const prop = (size, position, surface, shadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface); mesh.position.set(...position); mesh.castShadow = shadow; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  // Zonas livres de placas de rua e postes/filetes para não obstruir elementos interativos, painéis, portais ou palcos.
  const FIXTURE_KEEP_CLEAR = [
    { x: ARCADE_SPOT.x, z: ARCADE_SPOT.z, radius: 11.5 },
    { x: 9.5, z: -40.5, radius: 6.0 }, // Totem direcional MURAIS / MOINHO
    ...DISCOVERIES.map(d => ({ x: d.x, z: d.z, radius: 12.5 })),
    ...MEMBER_LOCATIONS.map(m => ({ x: m.x, z: m.z, radius: 12.0 })),
    ...ERA_GATES.map(g => ({ x: g.x, z: g.z, radius: 12.5 })),
    ...Object.values(VISUAL_LANDMARKS).map(v => ({ x: v.x, z: v.z, radius: 11.5 })),
  ];
  const placedFixtures = [];
  const isFixtureClear = (x, z, padJunction = 0, padAsphalt = .3) => {
    if (inJunction(x, z, padJunction) || onAsphalt(x, z, null, padAsphalt)) return false;
    if (CITY_LOTS.some(l => l.shop && Math.hypot(x - l.x, z - l.z) < Math.hypot(l.w, l.d) / 2 + 2.8)) return false;
    if (FIXTURE_KEEP_CLEAR.some(zone => Math.hypot(x - zone.x, z - zone.z) < zone.radius)) return false;
    if (placedFixtures.some(p => Math.hypot(x - p.x, z - p.z) < 2.2)) return false;
    return true;
  };
  for (const item of ROADS) {
    const half = item.width / 2, walk = WALK[item.kind], list = frames[item.id], row = [0, 1 - (item.id + 1) / ROADS.length, 1, 1 - item.id / ROADS.length];
    // Um nome por sentido, no terço da rua, na pista da direita de quem vem, com os 4 cantos validados dentro do próprio asfalto.
    for (const [targetRatio, direction] of [[.3, 1], [.7, -1]]) {
      const baseIndex = Math.round(list.length * targetRatio);
      const lane = item.kind === 'lane' ? half * .42 : half * .5, width = Math.min(half - 2.1, 5.8), depth = 3.0;
      for (const delta of [0, -2, 2, -4, 4, -6, 6]) {
        const index = baseIndex + delta;
        if (index < 4 || index >= list.length - 4) continue;
        const frame = list[index], tx = frame.tx * direction, tz = frame.tz * direction, rx = -frame.nx * direction, rz = -frame.nz * direction;
        const cx = frame.x + rx * lane, cz = frame.z + rz * lane;
        const corner = (across, forward) => [cx + rx * across * width / 2 + tx * forward * depth / 2, LEVEL.paint + .004, cz + rz * across * width / 2 + tz * forward * depth / 2];
        const corners = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
        if (!corners.every(([x, , z]) => gap(item, x, z) <= half - .15 && !inJunction(x, z, 1.5) && !onAsphalt(x, z, item, .5))) continue;
        quad(names, corners[0], corners[1], corners[2], corners[3], [row[0], row[1], row[2], row[1], row[2], row[3], row[0], row[3]]);
        break;
      }
    }
    // Placa de rua em cada ponta, na calçada da direita (ou oposta se obstruída), afastada de lojas e elementos interativos.
    for (const [order, direction] of [[list, 1], [list.slice().reverse(), -1]]) {
      const node = direction > 0 ? item.from : item.to;
      const offset = half + walk - .5;
      const findSpot = (sideSign, limit) => {
        for (let i = 0; i < Math.min(order.length, limit); i++) {
          const entry = order[i];
          if (Math.hypot(entry.x - NODES[node].x, entry.z - NODES[node].z) <= radius[node] + 7) continue;
          const px = entry.x + entry.nx * sideSign * offset, pz = entry.z + entry.nz * sideSign * offset;
          if (isFixtureClear(px, pz, 0, .3)) return { frame: entry, x: px, z: pz };
        }
        return null;
      };
      const halfOrder = Math.ceil(order.length * .5);
      const spot = findSpot(-direction, halfOrder) || findSpot(direction, halfOrder) || findSpot(-direction, order.length) || findSpot(direction, order.length);
      if (!spot) continue;
      const { frame, x, z } = spot;
      placedFixtures.push({ x, z });
      prop([.14, 4.2, .14], [x, 2.1, z], pole);
      const heading = Math.atan2(frame.tx, frame.tz);
      for (const turn of [0, Math.PI]) {
        const plate = new THREE.Mesh(new THREE.PlaneGeometry(3.3, .62), plateMaterial), uv = plate.geometry.attributes.uv;
        for (let k = 0; k < uv.count; k++) uv.setY(k, row[1] + uv.getY(k) * (row[3] - row[1]));
        plate.rotation.y = heading + Math.PI / 2 + turn; plate.position.set(x + Math.sin(heading + Math.PI / 2 + turn) * .03, 3.85, z + Math.cos(heading + Math.PI / 2 + turn) * .03); group.add(plate);
      }
    }
    // Postes alternados nas avenidas; a cabeça emissiva alimenta o bloom.
    if (item.kind === 'lane') continue;
    let next = 14, side = item.id % 2 ? 1 : -1;
    for (const frame of list) {
      if (frame.along < next) continue; next += 34; side = -side;
      let chosenSide = side;
      let x = frame.x + frame.nx * chosenSide * (half + walk - .45), z = frame.z + frame.nz * chosenSide * (half + walk - .45);
      if (!isFixtureClear(x, z, 1, .5)) {
        chosenSide = -side;
        x = frame.x + frame.nx * chosenSide * (half + walk - .45);
        z = frame.z + frame.nz * chosenSide * (half + walk - .45);
        if (!isFixtureClear(x, z, 1, .5)) continue;
      }
      placedFixtures.push({ x, z });
      const inward = Math.atan2(-frame.nx * chosenSide, -frame.nz * chosenSide);
      prop([.18, 6.4, .18], [x, 3.2, z], pole);
      prop([.12, .12, 2.2], [x + Math.sin(inward) * 1, 6.4, z + Math.cos(inward) * 1], pole, false).rotation.y = inward;
      prop([.42, .14, .9], [x + Math.sin(inward) * 1.9, 6.3, z + Math.cos(inward) * 1.9], lampGlow, false).rotation.y = inward;
    }
  }
  group.add(toMesh(names, stencilMaterial, 'road-names'));
}
