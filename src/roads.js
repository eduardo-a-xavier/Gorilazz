import * as THREE from './vendor/three.module.min.js';
import { ROADS, NODES } from './world-data.js';

// Malha viária desenhada como rua de verdade: asfalto, rotatórias limpas nos cruzamentos,
// calçada elevada com meio-fio contínuo, faixas de borda, eixo duplo amarelo nas avenidas,
// divisão de pistas, faixas de pedestre, postes, placas de rua e nomes pintados no asfalto.
// Os nomes das ruas vêm de `road.name` / `road.short` (faixas e discos do Gorillaz).

const LEVEL = { asphalt: -.09, junction: -.082, paint: -.07, walk: .07 };
const WALK = { studio: 2.4, avenue: 2.4, lane: 1.5 };

function sheet() { return { positions: [], uvs: [], indices: [] }; }
function quad(target, a, b, c, d, uv = [0, 0, 1, 0, 1, 1, 0, 1]) {
  const n = target.positions.length / 3;
  target.positions.push(...a, ...b, ...c, ...d); target.uvs.push(...uv); target.indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
}
function toMesh(target, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(target.positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(target.uvs, 2));
  geometry.setIndex(target.indices); geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, material); mesh.receiveShadow = true; return mesh;
}
function gap(road, x, z) {
  let best = Infinity;
  for (let i = 1; i < road.samples.length; i++) {
    const a = road.samples[i - 1], b = road.samples[i], dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    best = Math.min(best, Math.hypot(x - a.x - dx * t, z - a.z - dz * t));
  }
  return best;
}
function atlas(rows, height, paint) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = height * rows.length;
  const context = canvas.getContext('2d'); context.textAlign = 'center'; context.textBaseline = 'middle';
  rows.forEach((text, i) => paint(context, text, i * height, height));
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; return texture;
}

export function buildRoads(group, surfaces, material) {
  const radius = NODES.map((_, id) => Math.max(...ROADS.filter(road => road.from === id || road.to === id).map(road => road.width)) / 2 + 2.5);
  const inJunction = (x, z, pad = 0) => NODES.some((node, id) => Math.hypot(x - node.x, z - node.z) < radius[id] + pad);
  const onAsphalt = (x, z, except, pad = 0) => ROADS.some(road => road !== except && gap(road, x, z) < road.width / 2 + pad);
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
    const list = frames[road.id];
    for (let i = 0; i < list.length - 1; i++) {
      const a = list[i], b = list[i + 1]; if (!keep(a, b, i)) continue;
      quad(target, at(a, from, y), at(a, to, y), at(b, to, y), at(b, from, y), [from / 3, a.along / 3, to / 3, a.along / 3, to / 3, b.along / 3, from / 3, b.along / 3]);
    }
  }
  // Barra reta a partir de uma amostra: faixas de pedestre e linhas de retenção.
  function bar(target, frame, from, to, length, y = LEVEL.paint) {
    const a = at(frame, from, y), b = at(frame, to, y), shift = ([x, h, z]) => [x + frame.tx * length, h, z + frame.tz * length];
    quad(target, a, b, shift(b), shift(a));
  }

  const asphalt = sheet(), pavement = sheet(), white = sheet(), yellow = sheet();
  for (const road of ROADS) {
    const half = road.width / 2, walk = WALK[road.kind], list = frames[road.id];
    strip(asphalt, road, -half, half, LEVEL.asphalt, () => true);
    // Calçada e meio-fio: só onde não há outra rua nem rotatória por baixo.
    for (const side of [-1, 1]) {
      const keep = (a, b) => { const [x, z] = between(a, b, side * (half + walk / 2)); return !inJunction(x, z) && !onAsphalt(x, z, road, .2); };
      strip(pavement, road, side * half, side * (half + walk), LEVEL.walk, keep);
      for (let i = 0; i < list.length - 1; i++) if (keep(list[i], list[i + 1])) quad(pavement, at(list[i], side * half, LEVEL.asphalt), at(list[i], side * half, LEVEL.walk), at(list[i + 1], side * half, LEVEL.walk), at(list[i + 1], side * half, LEVEL.asphalt));
    }
    // Pintura: some dentro das rotatórias e onde duas ruas se sobrepõem.
    const painted = offset => (a, b) => { const [x, z] = between(a, b, offset); return !inJunction(x, z, .6) && !onAsphalt(x, z, road, .3); };
    const dashed = (offset, on, cycle) => (a, b) => a.along % cycle < on && painted(offset)(a, b);
    for (const side of [-1, 1]) strip(white, road, side * (half - .55), side * (half - .37), LEVEL.paint, painted(side * (half - .45)));
    if (road.kind === 'lane') strip(white, road, -.08, .08, LEVEL.paint, dashed(0, 3, 7.5));
    else {
      for (const side of [-1, 1]) {
        strip(yellow, road, side * .13, side * .27, LEVEL.paint, painted(0));
        strip(white, road, side * half / 2 - .07, side * half / 2 + .07, LEVEL.paint, dashed(side * half / 2, 3.2, 9));
      }
    }
    // Faixa de pedestres e linha de retenção em cada chegada a um cruzamento.
    for (const [node, order] of [[road.from, list], [road.to, list.slice().reverse()]]) {
      const start = order.findIndex(frame => Math.hypot(frame.x - NODES[node].x, frame.z - NODES[node].z) > radius[node] + 1);
      const frame = order[start]; if (!frame || onAsphalt(frame.x, frame.z, road, 1.5)) continue;
      const away = order === list ? 1 : -1, facing = { ...frame, tx: frame.tx * away, tz: frame.tz * away };
      for (let offset = -half + 1; offset < half - 1.2; offset += 1.15) bar(white, facing, offset, offset + .6, 3);
      bar(white, { ...facing, x: facing.x + facing.tx * 4, z: facing.z + facing.tz * 4 }, -half + .7, half - .7, .4);
    }
  }
  // Rotatórias: disco de asfalto e anel de calçada aberto nas chegadas das ruas.
  NODES.forEach((node, id) => {
    const steps = 72, ring = WALK.avenue;
    for (let i = 0; i < steps; i++) {
      const a0 = i / steps * Math.PI * 2, a1 = (i + 1) / steps * Math.PI * 2, mid = (a0 + a1) / 2;
      const point = (angle, r, y) => [node.x + Math.cos(angle) * r, y, node.z + Math.sin(angle) * r];
      const rim1 = point(a1, radius[id], LEVEL.junction), rim0 = point(a0, radius[id], LEVEL.junction);
      quad(asphalt, [node.x, LEVEL.junction, node.z], rim1, rim0, [node.x, LEVEL.junction, node.z], [node.x / 3, node.z / 3, rim1[0] / 3, rim1[2] / 3, rim0[0] / 3, rim0[2] / 3, node.x / 3, node.z / 3]);
      // Mini-rotatória pintada: orienta o giro sem criar obstáculo para o passeio guiado.
      quad(yellow, point(a0, 2.1, LEVEL.paint), point(a0, 2.5, LEVEL.paint), point(a1, 2.5, LEVEL.paint), point(a1, 2.1, LEVEL.paint));
      if (i % 6 < 3) quad(white, point(a0, radius[id] - .9, LEVEL.paint), point(a0, radius[id] - .7, LEVEL.paint), point(a1, radius[id] - .7, LEVEL.paint), point(a1, radius[id] - .9, LEVEL.paint));
      const [, , mz] = point(mid, radius[id] + ring / 2, 0), mx = node.x + Math.cos(mid) * (radius[id] + ring / 2);
      if (onAsphalt(mx, mz, null, .2)) continue;
      quad(pavement, point(a0, radius[id], LEVEL.walk), point(a0, radius[id] + ring, LEVEL.walk), point(a1, radius[id] + ring, LEVEL.walk), point(a1, radius[id], LEVEL.walk));
      quad(pavement, point(a0, radius[id], LEVEL.junction), point(a0, radius[id], LEVEL.walk), point(a1, radius[id], LEVEL.walk), point(a1, radius[id], LEVEL.junction));
    }
  });
  const road = surfaces.get('asphalt'); road.side = THREE.DoubleSide;
  const paint = color => new THREE.MeshStandardMaterial({ color, roughness: .75, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const concrete = new THREE.MeshStandardMaterial({ color: '#b9b4a6', roughness: .95, side: THREE.DoubleSide });
  group.add(toMesh(asphalt, road), toMesh(pavement, concrete), toMesh(white, paint('#ece8da')), toMesh(yellow, paint('#e2b23c')));

  // Nomes das ruas: pintados no asfalto (lidos por quem dirige) e em placas nas esquinas.
  const stencil = atlas(ROADS.map(item => item.short), 96, (context, text, y, height) => {
    context.fillStyle = '#f1ecdc'; context.font = 'bold 74px "Arial Narrow", "Arial Black", Arial, sans-serif'; context.fillText(text, 256, y + height / 2 + 4, 490);
  });
  const plates = atlas(ROADS.map(item => item.name), 96, (context, text, y, height) => {
    context.fillStyle = '#1d5b46'; context.fillRect(0, y, 512, height);
    context.strokeStyle = '#f1ecdc'; context.lineWidth = 6; context.strokeRect(7, y + 7, 498, height - 14);
    context.fillStyle = '#f1ecdc'; context.font = 'bold 46px Arial, sans-serif'; context.fillText(text.toUpperCase(), 256, y + height / 2 + 2, 470);
  });
  const stencilMaterial = new THREE.MeshStandardMaterial({ map: stencil, alphaTest: .35, roughness: .8, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
  const plateMaterial = new THREE.MeshStandardMaterial({ map: plates, emissiveMap: plates, emissive: '#ffffff', emissiveIntensity: .25, roughness: .6 });
  const pole = material('#3c4744'), lampGlow = material('#f1d49e', true), names = sheet();
  const prop = (size, position, surface, shadow = true) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), surface); mesh.position.set(...position); mesh.castShadow = shadow; mesh.receiveShadow = true; group.add(mesh); return mesh;
  };
  for (const item of ROADS) {
    const half = item.width / 2, walk = WALK[item.kind], list = frames[item.id], row = [0, 1 - (item.id + 1) / ROADS.length, 1, 1 - item.id / ROADS.length];
    // Um nome por sentido, no terço da rua, na pista da direita de quem vem.
    for (const [index, direction] of [[Math.round(list.length * .3), 1], [Math.round(list.length * .7), -1]]) {
      const frame = list[index], tx = frame.tx * direction, tz = frame.tz * direction, rx = -frame.nx * direction, rz = -frame.nz * direction;
      const lane = item.kind === 'lane' ? half / 2 : half * .52, width = Math.min(half - 1.6, 6.4), depth = 3.4;
      const cx = frame.x + rx * lane, cz = frame.z + rz * lane; if (inJunction(cx, cz, 4) || onAsphalt(cx, cz, item, 2)) continue;
      const corner = (across, forward) => [cx + rx * across * width / 2 + tx * forward * depth / 2, LEVEL.paint + .004, cz + rz * across * width / 2 + tz * forward * depth / 2];
      quad(names, corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1), [row[0], row[1], row[2], row[1], row[2], row[3], row[0], row[3]]);
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
  group.add(toMesh(names, stencilMaterial));
}
