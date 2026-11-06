// Coordinates are shared by physics, map, navigation and scenery.
export const WORLD_BOUNDS = { minX: -135, maxX: 135, minZ: -195, maxZ: 45 };
export const REGIONS = [
  { id: 'kong', name: 'Kong Studios', x: 0, z: -5, color: '#d2e2a8', track: 0 },
  { id: 'murals', name: 'Bairro dos murais', x: -80, z: -88, color: '#7fa6ff', track: 1 },
  { id: 'windmill', name: 'Mirante do moinho', x: 72, z: -123, color: '#f5a9c6', track: 2 },
];
export const NODES = [
  { x: 0, z: 0 }, { x: 0, z: -52 }, { x: -73, z: -62 },
  { x: -83, z: -110 }, { x: -8, z: -157 }, { x: 72, z: -126 },
  { x: 80, z: -50 }, { x: 27, z: -91 },
];
const connections = [
  [0, 1, [[-2, -24]]], [1, 2, [[-37, -54]]], [2, 3, [[-83, -84]]],
  [3, 4, [[-57, -144]]], [4, 5, [[36, -161]]], [5, 6, [[96, -91]]],
  [6, 0, [[69, -9], [30, 8]]], [1, 7, [[3, -78]]], [7, 5, [[49, -101]]],
  [3, 7, [[-42, -103]]], [7, 6, [[55, -73]]],
];
function interpolate(points, t) {
  const scaled = t * (points.length - 1); const i = Math.min(points.length - 2, Math.floor(scaled)); const u = scaled - i;
  const p0 = points[Math.max(0, i - 1)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(points.length - 1, i + 2)];
  const axis = key => .5 * ((2 * p1[key]) + (-p0[key] + p2[key]) * u + (2 * p0[key] - 5 * p1[key] + 4 * p2[key] - p3[key]) * u * u + (-p0[key] + 3 * p1[key] - 3 * p2[key] + p3[key]) * u * u * u);
  return { x: axis('x'), z: axis('z') };
}
export const ROADS = connections.map(([from, to, controls], id) => {
  const points = [NODES[from], ...controls.map(([x, z]) => ({ x, z })), NODES[to]];
  const samples = Array.from({ length: 81 }, (_, i) => interpolate(points, i / 80));
  const length = samples.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - samples[i].x, p.z - samples[i].z), 0);
  const kind = id === 0 ? 'studio' : id < 7 ? 'avenue' : 'lane';
  return { id, from, to, samples, length, kind, width: { studio: 13, avenue: 15, lane: 10 }[kind] };
});
export const MEMBER_LOCATIONS = [
  { x: -68, z: -73, heading: -.5 }, { x: -55, z: -131, heading: 1 },
  { x: 42, z: -110, heading: -1 }, { x: 62, z: -98, heading: .5 },
];
export const DISCOVERIES = [
  { id: 'beginning', x: -16, z: -25, title: 'Duas mentes, um universo', label: 'O COMEÇO / 1998', kind: 'MURAL', region: 0, track: 0, chapter: 1,
    text: 'Em Londres, em 1998, Damon Albarn e Jamie Hewlett criaram Gorillaz. Música e desenho passaram a contar uma história juntos: uma banda virtual com integrantes, personalidades e um mundo próprio.',
    detail: 'O primeiro álbum, Gorillaz, chegou em 2001. Clint Eastwood e Tomorrow Comes Today apresentam o encontro entre hip-hop, dub, rock e animação.', source: 'https://www.gorillaz.com/' },
  { id: 'voices', x: -105, z: -85, title: 'Quatro rostos. Muitas histórias.', label: 'BAIRRO DOS MURAIS', kind: 'ARQUIVO', region: 1, track: 1, chapter: 2,
    text: '2-D canta e toca teclados; Murdoc toca baixo; Noodle, guitarra; Russel, bateria. Suas histórias e personalidades se desenvolvem nos clipes e nas diferentes eras visuais da banda.',
    detail: 'Explore o bairro e os caminhos próximos para encontrar os quatro integrantes. Cada ficha apresenta uma sugestão de música para continuar a viagem.', source: 'https://www.gorillaz.com/' },
  { id: 'genres', x: -47, z: -120, title: 'Um som sem fronteiras', label: 'FREQUÊNCIA LIVRE', kind: 'RÁDIO', region: 1, track: 3, chapter: 3,
    text: 'Gorillaz cruza rock, hip-hop, eletrônico e dub. As colaborações mudam de disco para disco, ampliando as vozes e as referências que participam desse universo.',
    detail: 'O rádio desta experiência é um recorte do repertório. Experimente DARE, depois compare com Tomorrow Comes Today: o contraste também faz parte da identidade da banda.', source: 'https://www.gorillaz.com/' },
  { id: 'demon-days', x: 69, z: -140, title: 'A paisagem de Demon Days', label: 'MIRANTE / 2005', kind: 'MIRANTE', region: 2, track: 2, chapter: 4,
    text: 'Lançado em 2005, Demon Days inclui Feel Good Inc. e DARE. O moinho é uma das imagens marcantes do clipe de Feel Good Inc., em contraste com a torre e a cidade.',
    detail: 'O moinho deste mapa é uma interpretação geométrica autoral. Observe a paisagem e abra o clipe pelo rádio para conhecer a referência visual.', source: 'https://www.youtube.com/watch?v=HyHNuVaZJ-k' },
  { id: 'live', x: 19, z: -105, title: 'Quando o desenho encontra o palco', label: 'PÁTIO DE ENSAIO', kind: 'PALCO', region: 2, track: 4, chapter: 5,
    text: 'Nos shows, músicos reais e convidados dão vida ao repertório. Projeções e imagens dos personagens conectam a apresentação ao universo visual da banda, em formatos que variam entre turnês.',
    detail: 'A música pode continuar além desta descoberta. Escolha uma faixa no rádio ou procure os integrantes próximos ao pátio. Você decide a ordem do passeio.', source: 'https://www.gorillaz.com/' },
];
export const BUILDINGS = [
  { x: -28, z: 6, radius: 10, height: 16 }, { x: -44, z: -17, radius: 8, height: 23 },
  { x: -112, z: -48, radius: 8, height: 17 }, { x: -112, z: -119, radius: 8, height: 22 },
  { x: -65, z: -36, radius: 7, height: 13 }, { x: -43, z: -81, radius: 7, height: 11 },
  { x: 46, z: -48, radius: 8, height: 16 }, { x: 112, z: -54, radius: 7, height: 19 },
  { x: 8, z: -126, radius: 7, height: 9 },
];
export const VISUAL_LANDMARKS = {
  sculpture: { x: -18, y: .9, z: -6, radius: 2.7 },
  diorama: { x: 97, y: 2.4, z: -144, radius: 2.8 },
};
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function nearestRoad(point) {
  let best = { distance: Infinity, x: 0, z: 0, heading: 0 };
  for (const road of ROADS) for (let i = 1; i < road.samples.length; i++) {
    const a = road.samples[i - 1], b = road.samples[i]; const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    const x = a.x + dx * t, z = a.z + dz * t; const d = Math.hypot(point.x - x, point.z - z);
    if (d < best.distance) best = { distance: d, x, z, heading: Math.atan2(-dx, -dz), road: road.id };
  }
  return best;
}
export function regionAt(point) {
  return REGIONS.reduce((best, region, i) => distance(point, region) < distance(point, REGIONS[best]) ? i : best, 0);
}
export function clearPath(a, b) {
  const dx = b.x - a.x, dz = b.z - a.z;
  return !OBSTACLES.some(o => {
    const t = Math.max(0, Math.min(1, ((o.x - a.x) * dx + (o.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    return Math.hypot(a.x + dx * t - o.x, a.z + dz * t - o.z) < o.radius;
  });
}
export const TREE_LOCATIONS = Array.from({length:70},(_,i)=>({x:Math.sin(i*23.71)*126,z:-75+Math.cos(i*16.37)*112})).filter(at =>
  nearestRoad(at).distance >= 15 && !DISCOVERIES.some(p=>distance(p,at)<15) &&
  !BUILDINGS.some(p=>distance(p,at)<p.radius+4) && !Object.values(VISUAL_LANDMARKS).some(p=>distance(p,at)<9)
);

// ---------------------------------------------------------------------------
// Cidade: lotes gerados ao longo das ruas. Física, mapa e cenário usam os mesmos dados.
function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Menor folga entre um ponto e a borda de qualquer rua (negativo = sobre o asfalto). */
export function roadGap(point) {
  let gap = Infinity;
  for (const road of ROADS) for (let i = 1; i < road.samples.length; i++) {
    const a = road.samples[i - 1], b = road.samples[i]; const dx = b.x - a.x, dz = b.z - a.z;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / (dx * dx + dz * dz || 1)));
    gap = Math.min(gap, Math.hypot(point.x - a.x - dx * t, point.z - a.z - dz * t) - road.width / 2);
  }
  return gap;
}
function lotCorners(lot, pad = 0) {
  const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation); const hw = lot.w / 2 + pad, hd = lot.d / 2 + pad;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd]].map(([u, v]) => ({ x: lot.x + u * c + v * s, z: lot.z - u * s + v * c }));
}
function distanceToLot(point, lot) {
  const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation); const dx = point.x - lot.x, dz = point.z - lot.z;
  const u = dx * c - dz * s, v = dx * s + dz * c;
  return Math.hypot(Math.max(0, Math.abs(u) - lot.w / 2), Math.max(0, Math.abs(v) - lot.d / 2));
}
function lotsOverlap(a, b, gap) {
  const A = lotCorners(a, gap / 2), B = lotCorners(b, gap / 2);
  for (const poly of [A, B]) for (let i = 0; i < 4; i++) {
    const p = poly[i], q = poly[(i + 1) % 4]; const nx = q.z - p.z, nz = p.x - q.x;
    const project = pts => pts.map(k => k.x * nx + k.z * nz);
    const pa = project(A), pb = project(B);
    if (Math.max(...pa) < Math.min(...pb) || Math.max(...pb) < Math.min(...pa)) return false;
  }
  return true;
}
const CITY_KEEP_OPEN = [
  ...REGIONS.map(r => ({ x: r.x, z: r.z, radius: r.id === 'windmill' ? 50 : 21 })),
  ...DISCOVERIES.map(d => ({ x: d.x, z: d.z, radius: 15 })),
  ...MEMBER_LOCATIONS.map(m => ({ x: m.x, z: m.z, radius: 11 })),
  ...Object.values(VISUAL_LANDMARKS).map(p => ({ x: p.x, z: p.z, radius: 10 })),
  ...NODES.map(n => ({ x: n.x, z: n.z, radius: 13 })),
  ...BUILDINGS.map(b => ({ x: b.x, z: b.z, radius: b.radius * 1.05 + 2.5 })),
  ...TREE_LOCATIONS.map(t => ({ x: t.x, z: t.z, radius: 3.2 })),
  { x: 80, z: -163, radius: 20 },
];
/** 0 = campo aberto, 1 = centro urbano. */
export function urbanity(point) {
  const murals = 1 - distance(point, REGIONS[1]) / 95, kong = 1 - distance(point, REGIONS[0]) / 85;
  const windmill = distance(point, REGIONS[2]) < 70 ? -.6 : 0;
  return Math.max(0, Math.min(1, Math.max(murals * 1.15, kong * .9, .22) + windmill));
}
// Bairros por época: a cidade conta a história da banda em quatro atos (1998–2026).
export const CITY_ERAS = [
  { id: 'explosao', act: 1, title: 'A explosão', years: '2000–2006', color: '#e0a43a', anchor: { x: -35, z: 8 },
    albums: 'Gorillaz (2001) · Demon Days (2005)', summary: 'Tijolo, caixas-d\'água e grafite: a Londres decadente de Kong Studios.' },
  { id: 'plastic', act: 2, title: 'O auge ambicioso', years: '2007–2011', color: '#7fd6cf', anchor: { x: 95, z: -45 },
    albums: 'Plastic Beach (2010) · The Fall (2010)', summary: 'Fachadas pastel, lixo plástico colorido e clima de ilha à beira-mar.' },
  { id: 'hiato', act: 3, title: 'A briga e o hiato', years: '2012–2016', color: '#9aa0a6', anchor: { x: 0, z: -135 },
    albums: 'DoYaThing (2012) · pausa até 2016', summary: 'Prédios fechados, janelas tapadas e andaimes: a cidade em pausa.' },
  { id: 'reinvencao', act: 4, title: 'A reinvenção', years: '2017–2026', color: '#f2559c', anchor: { x: -90, z: -110 },
    albums: 'Humanz · The Now Now · Song Machine · Cracker Island · The Mountain', summary: 'Torres de vidro, telões de LED e neon: o Gorillaz do streaming e da realidade aumentada.' },
];
export function eraAt(point) {
  return CITY_ERAS.reduce((best, era, i) => distance(point, era.anchor) < distance(point, CITY_ERAS[best].anchor) ? i : best, 0);
}
const ERA_STYLES = [
  rng => rng() < .6 ? 'brick' : 'plaster',
  rng => rng() < .8 ? 'pastel' : 'plaster',
  rng => rng() < .75 ? 'abandoned' : 'concrete',
  rng => rng() < .6 ? 'glass' : 'concrete',
];
function buildCity() {
  const rng = seeded(19022005), lots = [];
  const fits = lot => {
    const corners = lotCorners(lot);
    const probes = [...corners, { x: lot.x, z: lot.z }];
    if (probes.some(p => p.x < WORLD_BOUNDS.minX + 5 || p.x > WORLD_BOUNDS.maxX - 5 || p.z < WORLD_BOUNDS.minZ + 5 || p.z > WORLD_BOUNDS.maxZ - 5)) return false;
    if (probes.some(p => roadGap(p) < 3)) return false;
    if (CITY_KEEP_OPEN.some(zone => distanceToLot(zone, lot) < zone.radius)) return false;
    if (lotObstacles(lot).some(o => roadGap(o) - o.radius - 2.4 < 0)) return false;
    return !lots.some(other => lotsOverlap(lot, other, .5));
  };
  const describe = (lot, urban, row) => {
    const era = eraAt(lot), style = ERA_STYLES[era](rng);
    let floors = 2 + Math.floor(rng() * 2) + Math.round(urban * 3) + row;
    if (era === 1) floors = Math.min(floors, 4);
    if (era === 3) floors += 2 + Math.floor(rng() * 3) + (rng() < .35 ? 5 : 0);
    return { ...lot, era, style, floors, tint: Math.floor(rng() * 5), shop: row === 0 && rng() < .35 + urban * .4,
      seed: Math.floor(rng() * 1e9), mural: era === 0 ? rng() < .55 : era === 3 && rng() < .25,
      tank: era < 2 && rng() < .6, escape: era === 0 ? style === 'brick' && rng() < .75 : era === 2 && rng() < .4,
      junk: era === 1, scaffold: era === 2 && rng() < .5, screen: era === 3 && rng() < .65, neon: era === 3 };
  };
  for (const road of ROADS) {
    const cumulative = [0]; for (let i = 1; i < road.samples.length; i++) cumulative.push(cumulative[i - 1] + distance(road.samples[i], road.samples[i - 1]));
    const at = along => {
      let i = 1; while (i < cumulative.length - 1 && cumulative[i] < along) i++;
      const a = road.samples[i - 1], b = road.samples[i]; const t = (along - cumulative[i - 1]) / (cumulative[i] - cumulative[i - 1] || 1);
      const len = distance(a, b) || 1; return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, tx: (b.x - a.x) / len, tz: (b.z - a.z) / len };
    };
    for (const side of [-1, 1]) {
      let along = 4 + rng() * 6;
      while (along < road.length - 6) {
        const w = 7 + rng() * 5.5, d = 7.5 + rng() * 4;
        const p = at(along + w / 2); const nx = p.tz * side, nz = -p.tx * side;
        const urban = urbanity(p);
        if (rng() > .55 + urban * .8) { along += w + 3; continue; }
        const offset = road.width / 2 + 4 + d / 2;
        // A frente (+z local) aponta para a rua.
        const front = { x: -nx, z: -nz };
        const lot = { x: p.x + nx * offset, z: p.z + nz * offset, rotation: Math.atan2(front.x, front.z), w, d, road: road.id };
        if (!fits(lot)) {
          // Tenta um lote menor antes de desistir do trecho.
          const small = { ...lot, w: w * .72, d: d * .8 }; const off2 = road.width / 2 + 4 + small.d / 2;
          Object.assign(small, { x: p.x + nx * off2, z: p.z + nz * off2 });
          if (fits(small)) { lots.push(describe(small, urban, 0)); along += small.w + .8 + rng() * 2; } else along += 3;
          continue;
        }
        {
          lots.push(describe(lot, urban, 0));
          // Segunda fileira nos bairros densos: prédios mais altos ao fundo.
          if (urban > .45 && rng() < .75) {
            const d2 = 8 + rng() * 4, back = { ...lot, d: d2, w: w * (.8 + rng() * .4), x: lot.x + nx * (d / 2 + 2.5 + d2 / 2), z: lot.z + nz * (d / 2 + 2.5 + d2 / 2) };
            if (fits(back)) lots.push(describe(back, urban, 1));
          }
        }
        along += w + .6 + rng() * 2.4;
      }
    }
  }
  // Miolo dos quarteirões: preenche as áreas urbanas, alinhado à rua mais próxima.
  for (let gz = WORLD_BOUNDS.minZ + 8; gz < WORLD_BOUNDS.maxZ - 6; gz += 8) {
    for (let gx = WORLD_BOUNDS.minX + 8; gx < WORLD_BOUNDS.maxX - 6; gx += 8) {
      const p = { x: gx + (rng() - .5) * 4, z: gz + (rng() - .5) * 4 }; const urban = urbanity(p);
      if (urban < .36 || rng() > .35 + urban) continue;
      const road = nearestRoad(p); const front = { x: road.x - p.x, z: road.z - p.z };
      const lot = { ...p, rotation: Math.atan2(front.x, front.z), w: 7 + rng() * 4, d: 7 + rng() * 4, road: road.road };
      if (fits(lot)) lots.push(describe(lot, urban, 1));
    }
  }
  // Os prédios-marco existentes recebem o mesmo acabamento, mantendo posição e altura.
  BUILDINGS.forEach((b, i) => {
    if (!i) return;
    const road = nearestRoad(b); const size = b.radius * 1.35;
    const front = { x: road.x - b.x, z: road.z - b.z };
    const era = eraAt(b), lrng = seeded(i * 7919);
    lots.push({ x: b.x, z: b.z, rotation: Math.atan2(front.x, front.z), w: size, d: size, landmark: true, era,
      style: ERA_STYLES[era](lrng), floors: Math.max(3, Math.round(b.height / 3.2)), tint: i % 5, shop: i % 2 === 0,
      seed: i * 7919, mural: era === 0 || (era === 3 && i % 2 === 1), tank: era < 2, escape: era === 0 || (era === 2 && i % 2 === 0),
      junk: era === 1, scaffold: era === 2, screen: era === 3, neon: era === 3 });
  });
  return lots;
}
export const CITY_LOTS = buildCity();
/** Um portal de entrada por bairro, sobre a rua mais próxima do centro da época. */
export const ERA_GATES = CITY_ERAS.map((era, index) => {
  let best = null;
  for (const road of ROADS) for (let i = 4; i < road.samples.length - 4; i++) {
    const p = road.samples[i];
    if (eraAt(p) !== index || NODES.some(n => distance(n, p) < 16) || DISCOVERIES.some(d => distance(d, p) < 30) || MEMBER_LOCATIONS.some(m => distance(m, p) < 16)) continue;
    const score = distance(p, era.anchor);
    if (!best || score < best.score) { const q = road.samples[i + 1]; best = { x: p.x, z: p.z, heading: Math.atan2(q.x - p.x, q.z - p.z), width: road.width, score, era: index }; }
  }
  return best;
}).filter(Boolean);
const gatePoles = ERA_GATES.flatMap(g => [-1, 1].map(s => ({ x: g.x + Math.cos(g.heading) * s * (g.width / 2 + 3), z: g.z - Math.sin(g.heading) * s * (g.width / 2 + 3), radius: .3 })));
function lotObstacles(lot) {
  const along = lot.w >= lot.d; const long = Math.max(lot.w, lot.d), short = Math.min(lot.w, lot.d);
  const n = Math.max(1, Math.ceil(long / short * 1.6));
  const radius = short / 2;
  const c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
  return Array.from({ length: n }, (_, i) => {
    const k = (i + .5) / n - .5; const u = along ? k * long : 0, v = along ? 0 : k * long;
    return { x: lot.x + u * c + v * s, z: lot.z - u * s + v * c, radius };
  });
}

export const OBSTACLES = [
  ...BUILDINGS, {x:80,z:-163,radius:13},
  ...Object.values(VISUAL_LANDMARKS), ...TREE_LOCATIONS.map(p=>({...p,radius:.35})),
  ...CITY_LOTS.filter(l => !l.landmark).flatMap(lotObstacles), ...gatePoles,
];
