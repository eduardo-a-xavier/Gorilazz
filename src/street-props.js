// Props urbanos instanciados: árvores, bancos, canteiros e postes em calçadas e praças.
// Um InstancedMesh por parte (tronco, copa, assento, poste, luminária): poucos draw calls e sem PointLight.
// Posições vêm de street-props-plan.js (folga >= 0,90 m da pista, fora de prédios e histórias).
import * as THREE from './vendor/three.module.min.js';
import { planStreetProps } from './street-props-plan.js';

const COLOR = { trunk: '#5b4a3a', crown: '#4f7a4a', wood: '#8a6a4a', concrete: '#b9b3a2', shrub: '#5d8a52', pole: '#3c4744', head: '#ffd27a' };

function part(color, options = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: 0, flatShading: true, ...options });
}
function place(geometry, material, items, group) {
  const mesh = new THREE.InstancedMesh(geometry, material, items.length);
  const dummy = new THREE.Object3D();
  items.forEach((item, i) => {
    dummy.position.set(item.x, 0, item.z); dummy.rotation.set(0, item.rot, 0); dummy.scale.setScalar(item.scale); dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.castShadow = false; mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}
// Geometria simples, nomeada pela parte: uma caixa ou cilindro transladado na altura certa.
function box(w, h, d, x = 0, y = 0, z = 0) { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; }

export function installStreetProps(scene, seed = 2026) {
  const plan = planStreetProps(seed);
  const by = kind => plan.filter(item => item.kind === kind);
  const group = new THREE.Group(); group.name = 'street-props';
  scene.add(group);

  // Árvore: tronco + copa baixa-poligonal (2 draw calls para todas as árvores).
  const trees = by('tree');
  if (trees.length) {
    const trunk = new THREE.CylinderGeometry(.16, .22, 2.2, 6); trunk.translate(0, 1.1, 0);
    const crown = new THREE.IcosahedronGeometry(1.1, 0); crown.translate(0, 2.9, 0);
    place(trunk, part(COLOR.trunk), trees, group).name = 'street-tree-trunks';
    place(crown, part(COLOR.crown), trees, group).name = 'street-tree-crowns';
  }

  // Banco: assento, encosto e duas pernas numa só geometria (1 draw call).
  const benches = by('bench');
  if (benches.length) {
    const seat = [box(1.5, .12, .5, 0, .46, 0), box(1.5, .5, .1, 0, .8, -.22), box(.1, .46, .5, -.65, .23, 0), box(.1, .46, .5, .65, .23, 0)];
    const geometry = mergeBoxes(seat);
    place(geometry, part(COLOR.wood), benches, group).name = 'street-benches';
  }

  // Canteiro: caixa de concreto com arbusto por cima.
  const planters = by('planter');
  if (planters.length) {
    place(box(1.2, .5, .9, 0, .25, 0), part(COLOR.concrete), planters, group).name = 'street-planter-boxes';
    const shrub = new THREE.IcosahedronGeometry(.55, 0); shrub.translate(0, .8, 0);
    place(shrub, part(COLOR.shrub), planters, group).name = 'street-planter-shrubs';
  }

  // Poste: haste fina e luminária com cabeça emissiva quente (sem PointLight; o brilho é o próprio material).
  const lamps = by('lamp');
  if (lamps.length) {
    const pole = new THREE.CylinderGeometry(.05, .07, 4.2, 6); pole.translate(0, 2.1, 0);
    place(pole, part(COLOR.pole), lamps, group).name = 'street-lamp-poles';
    place(box(.34, .12, .34, 0, 4.2, 0), part(COLOR.head, { emissive: COLOR.head, emissiveIntensity: .9 }), lamps, group).name = 'street-lamp-heads';
  }
  return { count: plan.length, counts: { tree: trees.length, bench: benches.length, planter: planters.length, lamp: lamps.length } };
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
