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
  [0, 1, [[-8, -23]]], [1, 2, [[-35, -43]]], [2, 3, [[-95, -84]]],
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
  return { id, from, to, samples, length, width: 12 };
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
export const OBSTACLES = [
  ...BUILDINGS, ...MEMBER_LOCATIONS.map(p=>({...p,radius:1.5})), {x:80,z:-163,radius:13},
  ...Object.values(VISUAL_LANDMARKS), ...TREE_LOCATIONS.map(p=>({...p,radius:.35})),
];
