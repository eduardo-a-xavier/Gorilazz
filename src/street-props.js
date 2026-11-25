// Props urbanos instanciados: árvores (3 variações GLB), bancos alinhados nas praças (GLB), arbustos (2 variações GLB),
// rochas (3 variações GLB), postes (GLB) e carros estacionados (sedan/van GLB) em calçadas, praças e avenidas.
// Um InstancedMesh por variação: poucos draw calls, carregamento lazy após entrar no 3D e fallback automático às primitivas.
// Posições vêm de street-props-plan.js (folga >= 0,90 m da pista para props e >= 1,20 m para carros, fora de prédios e histórias).
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { planStreetProps, excludeTreesNear } from './street-props-plan.js';
import { loadModelSafely, repairMaterials } from './model-safety.js';
import { groundOffsetY } from './ground-fit.js';

const COLOR = {
  trunk: '#5b4a3a',
  crown: '#3d6339',
  wood: '#7d5f41',
  concrete: '#9e9888',
  shrub: '#43693b',
  rock: '#635f59',
  pole: '#3c4744',
  head: '#ffd27a',
  carTints: ['#d8b968', '#5c7c99', '#8c4f49', '#56785e', '#7e768c'],
};

export const SCENERY_GLB_URLS = Object.freeze({
  trees: [
    './assets/models/scenery/tree-01-broadleaf.glb',
    './assets/models/scenery/tree-02-windswept.glb',
    './assets/models/scenery/tree-03-sage.glb',
  ],
  bushes: [
    './assets/models/scenery/bush-01-mound.glb',
    './assets/models/scenery/bush-02-spreading.glb',
  ],
  rocks: [
    './assets/models/scenery/rock-01-slate.glb',
    './assets/models/scenery/rock-02-ochre.glb',
    './assets/models/scenery/rock-03-split.glb',
  ],
  bench: './assets/models/scenery/bench-01-slatted.glb',
  lamp: './assets/models/scenery/lamp-01-crooked.glb',
  cars: [
    './assets/models/scenery/car-01-sedan.glb',
    './assets/models/scenery/car-02-van.glb',
  ],
  barrier: './assets/models/scenery/barrier-01-road.glb',
});

function part(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, flatShading: true, ...options });
}

function place(geometry, material, items, group, { castShadow = false, colorPalette = null, ground = false } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const dummy = new THREE.Object3D();
  const c = new THREE.Color();
  // Árvores e arbustos: base assentada em GROUND_Y (ground-fit.js), sem flutuar nem afundar.
  if (ground) { geometry.computeBoundingBox(); }
  const baseMinY = ground ? geometry.boundingBox.min.y : 0;
  items.forEach((item, i) => {
    dummy.position.set(item.x, ground ? groundOffsetY(baseMinY, item.scale) : (item.y ?? 0), item.z); dummy.rotation.set(0, item.rot, 0); dummy.scale.setScalar(item.scale); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    if (colorPalette) mesh.setColorAt(i, c.set(colorPalette[(item.colorIdx ?? i) % colorPalette.length]));
  });
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.userData.fullMatrices = mesh.instanceMatrix.array.slice();
  if (mesh.instanceColor) mesh.userData.fullColors = mesh.instanceColor.array.slice();
  mesh.computeBoundingSphere();
  mesh.castShadow = castShadow; mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

// Compacta instâncias próximas sem alterar os planos de colocação nem colidíveis.
export function limitStreetProps(group, x, z, radius = Infinity) {
  const r2 = radius * radius;
  for (const mesh of group.children) {
    const source = mesh.userData.fullMatrices;
    if (!source) continue;
    const target = mesh.instanceMatrix.array;
    const srcColors = mesh.userData.fullColors;
    const tgtColors = mesh.instanceColor?.array;
    let count = 0;
    for (let offset = 0, idx = 0; offset < source.length; offset += 16, idx++) {
      const dx = source[offset + 12] - x, dz = source[offset + 14] - z;
      if (dx * dx + dz * dz <= r2) {
        target.set(source.subarray(offset, offset + 16), count * 16);
        if (srcColors && tgtColors) tgtColors.set(srcColors.subarray(idx * 3, idx * 3 + 3), count * 3);
        count++;
      }
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
}

// Geometria simples, nomeada pela parte: uma caixa ou cilindro transladado na altura certa (usada apenas como fallback se o GLB não carregar).
function box(w, h, d, x = 0, y = 0, z = 0) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }

// Extrai geometria e material do GLB de cenário, aplicando multiplicador de cor/saturação para harmonizar os tons pastel com a névoa escura dos bairros.
export function extractSceneryMesh(gltf, { tint = '#b5c4b1', roughness = .86, flatShading = false } = {}) {
  repairMaterials(gltf.scene);
  gltf.scene.updateMatrixWorld(true);
  let found = null;
  gltf.scene.traverse(obj => { if (!found && obj.isMesh && obj.geometry) found = obj; });
  if (!found) throw new Error('GLB de cenário sem malha');
  const geometry = found.geometry.clone().applyMatrix4(found.matrixWorld);
  const hasVertexColors = Boolean(geometry.attributes.color);
  const material = new THREE.MeshStandardMaterial({
    color: tint,
    vertexColors: hasVertexColors,
    roughness,
    metalness: .04,
    flatShading,
    emissive: '#000000',
    emissiveIntensity: 0,
  });
  return { geometry, material };
}

export function installStreetProps(scene, seed = 2026, reserved = []) {
  const plan = excludeTreesNear(planStreetProps(seed), reserved);
  const by = kind => plan.filter(item => item.kind === kind);
  const group = new THREE.Group(); group.name = 'street-props';
  scene.add(group);

  const trees = by('tree'), benches = by('bench'), planters = by('planter'), rocks = by('rock'), lamps = by('lamp'), cars = by('car'), barriers = by('barrier');
  const fallbackRegistries = { tree: [], bench: [], planter: [], rock: [], lamp: [], car: [], barrier: [] };
  let activeRadius = Infinity, lastCullX = 0, lastCullZ = 0;

  function addFallback(kind, mesh) {
    fallbackRegistries[kind].push(mesh);
    return mesh;
  }
  function removeFallback(kind) {
    for (const m of fallbackRegistries[kind]) {
      group.remove(m);
      m.geometry?.dispose?.();
    }
    fallbackRegistries[kind].length = 0;
  }

  // Fallback inicial ultraleve (substituído automaticamente pelos GLBs em loadSceneryModels() logo ao entrar no 3D).
  if (trees.length) {
    const trunk = new THREE.CylinderGeometry(.16, .22, 2.2, 6); trunk.translate(0, 1.1, 0);
    const crown = new THREE.IcosahedronGeometry(1.1, 0); crown.translate(0, 2.9, 0);
    addFallback('tree', place(trunk, part(COLOR.trunk), trees, group)).name = 'street-tree-trunks';
    addFallback('tree', place(crown, part(COLOR.crown), trees, group)).name = 'street-tree-crowns';
  }
  if (benches.length) {
    const seat = [box(1.6, .10, .52, 0, .45, 0), box(1.6, .48, .10, 0, .78, -.22), box(.12, .45, .52, -.70, .225, 0), box(.12, .45, .52, .70, .225, 0)];
    addFallback('bench', place(mergeBoxes(seat), part(COLOR.wood), benches, group)).name = 'street-benches';
  }
  if (planters.length) {
    const shrub = new THREE.IcosahedronGeometry(.72, 1); shrub.translate(0, .58, 0);
    addFallback('planter', place(shrub, part(COLOR.shrub), planters, group)).name = 'street-planter-shrubs';
  }
  if (rocks.length) {
    const rockGeo = new THREE.DodecahedronGeometry(.75, 0); rockGeo.scale(1.2, .75, 1.0); rockGeo.translate(0, .42, 0);
    addFallback('rock', place(rockGeo, part(COLOR.rock), rocks, group)).name = 'street-rocks';
  }
  if (lamps.length) {
    const pole = new THREE.CylinderGeometry(.05, .07, 4.2, 6); pole.translate(0, 2.1, 0);
    addFallback('lamp', place(pole, part(COLOR.pole), lamps, group)).name = 'street-lamp-poles';
    addFallback('lamp', place(box(.34, .12, .34, 0, 4.2, 0), part(COLOR.head, { emissive: COLOR.head, emissiveIntensity: .9 }), lamps, group)).name = 'street-lamp-heads';
  }
  if (cars.length) {
    const carBody = mergeBoxes([box(2.1, .75, 4.3, 0, .55, 0), box(1.85, .58, 2.2, 0, 1.15, -.15)]);
    addFallback('car', place(carBody, part('#ffffff'), cars, group, { colorPalette: COLOR.carTints })).name = 'street-cars-fallback';
  }
  if (barriers.length) {
    addFallback('barrier', place(box(2.1, .95, .45, 0, .48, 0), part('#d98c3b'), barriers, group)).name = 'street-barriers-fallback';
  }

  let loadingPromise = null;
  // Carregamento LAZY dos modelos GLB de cenário (árvores, bancos, arbustos, pedras, postes e carros estacionados).
  function loadSceneryModels(loader = new GLTFLoader()) {
    if (loadingPromise) return loadingPromise;
    const syncCull = () => { if (Number.isFinite(activeRadius)) limitStreetProps(group, lastCullX, lastCullZ, activeRadius); };

    // 1) Árvores (tree-01, tree-02, tree-03) — tons escurecidos/saturados para combinar com a névoa dos bairros
    const treeTints = ['#7f9c7a', '#739478', '#869e7d'];
    const treesJob = trees.length ? Promise.all(SCENERY_GLB_URLS.trees.map((url, idx) =>
      loadModelSafely(loader, url).then(gltf => ({ idx, ...extractSceneryMesh(gltf, { tint: treeTints[idx], roughness: .86 }) }))
    )).then(variants => {
      removeFallback('tree');
      for (const { idx, geometry, material } of variants) {
        const sub = trees.filter((_, i) => i % variants.length === idx);
        if (sub.length) place(geometry, material, sub, group, { castShadow: true, ground: true }).name = `street-trees-glb-${idx + 1}`;
      }
      group.userData.treesGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Árvores GLB indisponíveis; mantendo fallback:', err.message)) : Promise.resolve();

    // 2) Bancos (bench-01-slatted.glb) — escala real (~1.6 m comprimento, assento ~0.45 m)
    const benchJob = benches.length ? loadModelSafely(loader, SCENERY_GLB_URLS.bench).then(gltf => {
      const { geometry, material } = extractSceneryMesh(gltf, { tint: '#9e8870', roughness: .84 });
      removeFallback('bench');
      place(geometry, material, benches, group, { castShadow: true }).name = 'street-benches-glb';
      group.userData.benchesGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Banco GLB indisponível; mantendo fallback:', err.message)) : Promise.resolve();

    // 3) Arbustos (bush-01, bush-02)
    const bushTints = ['#76946e', '#6d8c6c'];
    const bushJob = planters.length ? Promise.all(SCENERY_GLB_URLS.bushes.map((url, idx) =>
      loadModelSafely(loader, url).then(gltf => ({ idx, ...extractSceneryMesh(gltf, { tint: bushTints[idx], roughness: .88 }) }))
    )).then(variants => {
      removeFallback('planter');
      for (const { idx, geometry, material } of variants) {
        const sub = planters.filter((_, i) => i % variants.length === idx);
        if (sub.length) place(geometry, material, sub, group, { ground: true }).name = `street-bushes-glb-${idx + 1}`;
      }
      group.userData.bushesGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Arbustos GLB indisponíveis; mantendo fallback:', err.message)) : Promise.resolve();

    // 4) Pedras (rock-01, rock-02, rock-03)
    const rockTints = ['#7e8287', '#8c7d6b', '#75797d'];
    const rockJob = rocks.length ? Promise.all(SCENERY_GLB_URLS.rocks.map((url, idx) =>
      loadModelSafely(loader, url).then(gltf => ({ idx, ...extractSceneryMesh(gltf, { tint: rockTints[idx], roughness: .92, flatShading: true }) }))
    )).then(variants => {
      removeFallback('rock');
      for (const { idx, geometry, material } of variants) {
        const sub = rocks.filter((_, i) => i % variants.length === idx);
        if (sub.length) place(geometry, material, sub, group).name = `street-rocks-glb-${idx + 1}`;
      }
      group.userData.rocksGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Rochas GLB indisponíveis; mantendo fallback:', err.message)) : Promise.resolve();

    // 5) Postes (lamp-01-crooked.glb)
    const lampJob = lamps.length ? loadModelSafely(loader, SCENERY_GLB_URLS.lamp).then(gltf => {
      const { geometry, material } = extractSceneryMesh(gltf, { tint: '#8e9691', roughness: .78 });
      removeFallback('lamp');
      place(geometry, material, lamps, group).name = 'street-lamps-glb';
      place(box(.34, .12, .34, .65, 4.45, 0), part(COLOR.head, { emissive: COLOR.head, emissiveIntensity: .9 }), lamps, group).name = 'street-lamp-heads';
      group.userData.lampsGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Poste GLB indisponível; mantendo fallback:', err.message)) : Promise.resolve();

    // 6) Carros estacionados (car-01-sedan.glb, car-02-van.glb) com variação de 5 tons por instância
    const carsJob = cars.length ? Promise.all(SCENERY_GLB_URLS.cars.map((url, idx) =>
      loadModelSafely(loader, url).then(gltf => ({ idx, ...extractSceneryMesh(gltf, { tint: '#ffffff', roughness: .72 }) }))
    )).then(variants => {
      removeFallback('car');
      for (const { idx, geometry, material } of variants) {
        const sub = cars.filter(c => (c.variant ?? 0) === idx);
        if (sub.length) place(geometry, material, sub, group, { castShadow: true, colorPalette: COLOR.carTints }).name = `street-cars-glb-${idx + 1}`;
      }
      group.userData.carsGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Carros GLB indisponíveis; mantendo fallback:', err.message)) : Promise.resolve();

    // 7) Barreiras viárias (barrier-01-road.glb)
    const barrierJob = barriers.length ? loadModelSafely(loader, SCENERY_GLB_URLS.barrier).then(gltf => {
      const { geometry, material } = extractSceneryMesh(gltf, { tint: '#d4be96', roughness: .82 });
      removeFallback('barrier');
      place(geometry, material, barriers, group).name = 'street-barriers-glb';
      group.userData.barriersGlbLoaded = true;
      syncCull();
    }).catch(err => console.warn('Barreira GLB indisponível; mantendo fallback:', err.message)) : Promise.resolve().then(() => { group.userData.barriersGlbLoaded = true; });

    loadingPromise = Promise.allSettled([treesJob, benchJob, bushJob, rockJob, lampJob, carsJob, barrierJob]);
    return loadingPromise;
  }

  return {
    group,
    count: plan.length,
    counts: { tree: trees.length, bench: benches.length, planter: planters.length, rock: rocks.length, lamp: lamps.length, car: cars.length, barrier: barriers.length },
    loadSceneryModels,
    setCullState(x, z, r) { lastCullX = x; lastCullZ = z; activeRadius = r; },
  };
}

// Une caixas num só BufferGeometry (todas já transladadas).
function mergeBoxes(geometries) {
  const merged = new THREE.BufferGeometry();
  const positions = [], normals = [], indices = [];
  let offset = 0;
  for (const g of geometries) {
    const p = g.attributes.position, n = g.attributes.normal, idx = g.index;
    for (let i = 0; i < p.count; i++) { positions.push(p.getX(i), p.getY(i), p.getZ(i)); normals.push(n.getX(i), n.getY(i), n.getZ(i)); }
    for (let i = 0; i < idx.count; i++) indices.push(idx.getX(i) + offset);
    offset += p.count;
  }
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  merged.setIndex(indices);
  return merged;
}

