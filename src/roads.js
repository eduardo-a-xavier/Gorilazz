import { PLATE_STYLE } from './sign-style.js';
import * as THREE from './vendor/three.module.min.js';
import { ROADS, NODES } from './world-data.js';

// Malha viária desenhada como rua de verdade: asfalto, rotatórias limpas nos cruzamentos de grau >= 3,
// emendas contínuas nos nós de grau 2, calçada elevada com meio-fio, tampas e saia até abaixo do chão,
// faixas de borda, eixo duplo amarelo nas avenidas, faixas de pedestre, postes, placas e estêncis.

export const LEVEL = { asphalt: -.09, junction: -.082, paint: -.07, walk: .07, skirt: -.32 };
export const WALK = { studio: 2.4, avenue: 2.4, lane: 1.5 };
export const NODE_DEGREE = NODES.map((_, id) => ROADS.filter(road => road.from === id || road.to === id).length);
export const NODE_RADIUS = NODES.map((_, id) => {
  const maxHalf = Math.max(...ROADS.filter(road => road.from === id || road.to === id).map(road => road.width)) / 2;
  return NODE_DEGREE[id] >= 4 ? Math.max(maxHalf + 4.5, 9.5) : NODE_DEGREE[id] === 3 ? maxHalf + 3.5 : maxHalf + 2.5;
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
        return pts.every(([x, z]) => !inJunction(x, z) && !onAsphalt(x, z, road, .15));
      };
      const kept = Array.from({ length: list.length - 1 }, (_, i) => keep(list[i], list[i + 1]));
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
    const point = (angle, r, y) => [node.x + Math.cos(angle) * r, y, node.z + Math.sin(angle) * r];
    const keptRing = Array.from({ length: steps }, (_, i) => {
      const a0 = i / steps * Math.PI * 2, a1 = (i + 1) / steps * Math.PI * 2, mid = (a0 + a1) / 2;
      const pts = [point(mid, rIn + ring / 2, 0), point(a0, rIn, 0), point(a0, rOut, 0), point(a1, rOut, 0), point(a1, rIn, 0)];
      return pts.every(([x, , z]) => !onAsphalt(x, z, null, .15) && !NODES.some((other, oid) => oid !== id && Math.hypot(x - other.x, z - other.z) < radius[oid]));
    });
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
  const road = surfaces.get('asphalt'); road.side = THREE.DoubleSide;
  const paint = color => new THREE.MeshStandardMaterial({ color, roughness: .75, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#b9b4a6', roughness: .95, side: THREE.DoubleSide });
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
    // Placa de rua em cada ponta, na calçada da direita de quem entra na rua.
    for (const [order, direction] of [[list, 1], [list.slice().reverse(), -1]]) {
      const node = direction > 0 ? item.from : item.to;
      const frame = order.find(entry => Math.hypot(entry.x - NODES[node].x, entry.z - NODES[node].z) > radius[node] + 7); if (!frame) continue;
      const x = frame.x - frame.nx * direction * (half + walk - .5), z = frame.z - frame.nz * direction * (half + walk - .5);
      if (inJunction(x, z) || onAsphalt(x, z, null, .3)) continue;
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
      const x = frame.x + frame.nx * side * (half + walk - .45), z = frame.z + frame.nz * side * (half + walk - .45);
      if (inJunction(x, z, 1) || onAsphalt(x, z, null, .5)) continue;
      const inward = Math.atan2(-frame.nx * side, -frame.nz * side);
      prop([.18, 6.4, .18], [x, 3.2, z], pole);
      prop([.12, .12, 2.2], [x + Math.sin(inward) * 1, 6.4, z + Math.cos(inward) * 1], pole, false).rotation.y = inward;
      prop([.42, .14, .9], [x + Math.sin(inward) * 1.9, 6.3, z + Math.cos(inward) * 1.9], lampGlow, false).rotation.y = inward;
    }
  }
  group.add(toMesh(names, stencilMaterial, 'road-names'));
}
