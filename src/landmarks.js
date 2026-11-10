import * as THREE from './vendor/three.module.min.js';
import { REGIONS, OBSTACLES, DISCOVERIES, MEMBER_LOCATIONS, roadGap, distance } from './world-data.js';
import { letteringTexture } from './materials.js';

// Referências autorais ao universo da banda, feitas só com geometria simples:
//   · a ilha rosa de Plastic Beach no mar, vista do bairro do Ato 2;
//   · o cemitério de Clint Eastwood perto de Kong, com um fantasma azul que flutua;
//   · os helicópteros de El Mañana rondando o moinho flutuante.
// São interpretações geométricas, não reproduções da arte original. Nada aqui tem colisão.

const PLASTIC = ['#ff5f8f', '#38c2b5', '#ffcc4d', '#6aa2ff', '#f4efe2', '#9dff8a'];

/** Ponto livre mais próximo de `near`: longe de ruas, prédios, árvores, histórias e integrantes. */
export function freeSpot(near, clearance) {
  let best = null;
  for (let dz = -60; dz <= 60; dz += 4) for (let dx = -60; dx <= 60; dx += 4) {
    const point = { x: near.x + dx, z: near.z + dz };
    if (roadGap(point) < clearance + 3.5) continue;
    if (OBSTACLES.some(o => distance(o, point) < o.radius + clearance + 1)) continue;
    if (DISCOVERIES.some(d => distance(d, point) < clearance + 12) || MEMBER_LOCATIONS.some(m => distance(m, point) < clearance + 8)) continue;
    if (REGIONS.some(r => distance(r, point) < 17 + clearance)) continue;
    const score = Math.hypot(dx, dz);
    if (!best || score < best.score) best = { ...point, score };
  }
  return best;
}

export function installLandmarks(scene, material, bake) {
  const solid = (parent, geometry, color, position, { scale = [1, 1, 1], rotation = [0, 0, 0], glow = false, shadow = true } = {}) => {
    const mesh = new THREE.Mesh(geometry, material(color, glow)); mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation);
    mesh.castShadow = shadow; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const cube = new THREE.BoxGeometry(1, 1, 1), blob = new THREE.IcosahedronGeometry(1, 1), tube = new THREE.CylinderGeometry(1, 1, 1, 14), cone = new THREE.ConeGeometry(1, 1, 8);
  const animated = [];

  // ---------------------------------------------------------------- Plastic Beach
  const beach = new THREE.Group(); beach.position.set(198, -5.6, -36); beach.name = 'plastic-beach'; scene.add(beach);
  const pinks = ['#f08fb4', '#e77aa4', '#f7b3cc', '#ec86ad'];
  [[0, 0, 0, 24, 15, 21], [-12, -1, 8, 15, 9, 14], [13, -1, -7, 16, 10, 13], [5, 0, 13, 13, 8, 12], [-8, 0, -12, 14, 9, 12], [0, 9, -2, 13, 12, 12], [-3, 17, 0, 8, 8, 8]]
    .forEach(([x, y, z, w, h, d], i) => solid(beach, blob, pinks[i % pinks.length], [x, y, z], { scale: [w, h, d], rotation: [0, i * 1.1, 0], shadow: false }));
  // Lixo plástico encalhado na base e boiando ao redor.
  for (let i = 0; i < 46; i++) {
    const angle = i * 2.399, reach = 17 + (i * 7 % 13), size = .9 + (i % 4) * .5;
    solid(beach, i % 3 ? cube : tube, PLASTIC[i % PLASTIC.length], [Math.cos(angle) * reach, .5 + (i % 5) * .25, Math.sin(angle) * reach * .9], { scale: [size, size * .7, size * 1.2], rotation: [i * .3, i * .7, i * .2], shadow: false });
  }
  // Estúdio branco em terraços, com janelas acesas, e a torre com o farol.
  [[-3, 24.5, 0, 11, 3, 9], [-1, 27.4, -1, 8, 2.8, 7], [1, 30, -1, 5.5, 2.4, 5]].forEach(([x, y, z, w, h, d]) => {
    solid(beach, cube, '#f4efe2', [x, y, z], { scale: [w, h, d] });
    solid(beach, cube, '#ffd98a', [x, y + .1, z + d / 2 + .03], { scale: [w * .8, h * .42, .08], glow: true, shadow: false });
  });
  solid(beach, tube, '#f4efe2', [6, 33, -4], { scale: [1.5, 18, 1.5] });
  solid(beach, tube, '#ff5f8f', [6, 39, -4], { scale: [1.62, 1.6, 1.62] });
  solid(beach, tube, '#2a3036', [6, 42.6, -4], { scale: [2.1, .5, 2.1] });
  const beacon = solid(beach, blob, '#fff4c7', [6, 43.8, -4], { scale: [1.1, 1.1, 1.1], glow: true, shadow: false });
  solid(beach, cone, '#2a3036', [6, 45.6, -4], { scale: [1.7, 1.6, 1.7] });
  // Palmeiras de plástico: tronco e copa em cones.
  for (const [x, z, lean] of [[-9, 6, .2], [-12, 1, -.25], [9, 8, .15]]) {
    solid(beach, tube, '#8b6a45', [x, 21.5, z], { scale: [.35, 6, .35], rotation: [0, 0, lean] });
    for (let k = 0; k < 6; k++) solid(beach, cone, k % 2 ? '#38c2b5' : '#2f9e8f', [x - lean * 3 + Math.cos(k * 1.05) * 1.6, 24.3, z + Math.sin(k * 1.05) * 1.6], { scale: [.55, 3.6, .55], rotation: [Math.sin(k * 1.05) * 1.25, 0, -Math.cos(k * 1.05) * 1.25], shadow: false });
  }
  const board = new THREE.Mesh(new THREE.PlaneGeometry(15, 3.2), new THREE.MeshStandardMaterial({ map: letteringTexture('PLASTIC BEACH|PONTO NEMO · 2010', { height: 220, background: '#f4efe2', color: '#d2447e', accent: '#38c2b5' }), roughness: .8 }));
  board.position.set(-4, 16.5, 20.4); board.rotation.y = -Math.PI / 2 + 1.3; beach.add(board);
  beach.rotation.y = .5;
  bake(beach, [beacon]);
  animated.push((t, reduced) => { if (!reduced) { beacon.scale.setScalar(1.1 + Math.sin(t * 2.2) * .35); beach.position.y = -5.6 + Math.sin(t * .4) * .12; } });

  // ---------------------------------------------------------------- cemitério de Clint Eastwood
  const plot = freeSpot({ x: -38, z: -46 }, 8);
  if (plot) {
    const yard = new THREE.Group(); yard.position.set(plot.x, 0, plot.z); yard.name = 'graveyard'; scene.add(yard);
    solid(yard, tube, '#3a4138', [0, -.2, 0], { scale: [8, .12, 8], shadow: false });
    for (let i = 0; i < 11; i++) {
      const angle = i * 2.2, reach = 2 + (i * 5 % 9) * .55, x = Math.cos(angle) * reach, z = Math.sin(angle) * reach, tall = 1.1 + (i % 3) * .35, tilt = ((i * 37) % 9 - 4) * .035;
      if (i % 4 === 3) { solid(yard, cube, '#8f9089', [x, tall / 2 + .2, z], { scale: [.22, tall + .5, .22], rotation: [0, angle, tilt] }); solid(yard, cube, '#8f9089', [x, tall + .15, z], { scale: [.9, .22, .22], rotation: [0, angle, tilt] }); }
      else { solid(yard, cube, i % 2 ? '#9a9b93' : '#7f827c', [x, tall / 2, z], { scale: [.95, tall, .24], rotation: [0, angle, tilt] }); solid(yard, tube, i % 2 ? '#9a9b93' : '#7f827c', [x, tall, z], { scale: [.475, .24, .475] }).rotation.set(Math.PI / 2, angle, 0, 'YXZ'); }
    }
    // Árvore seca e cerca baixa.
    solid(yard, tube, '#2b2622', [-4.6, 2.6, -3.4], { scale: [.38, 5.2, .38], rotation: [0, 0, .12] });
    for (const [lift, yaw, roll, length] of [[4.4, 0, .9, 2.8], [3.6, 2.1, -1, 2.3], [5, 4, .7, 2], [4.8, 1, -.6, 1.7]]) solid(yard, tube, '#2b2622', [-4.6 + Math.cos(yaw) * .9, lift, -3.4 + Math.sin(yaw) * .9], { scale: [.14, length, .14], rotation: [roll * Math.sin(yaw), yaw, roll * Math.cos(yaw)] });
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; if (i % 11 === 0) continue; solid(yard, cube, '#2a2f2c', [Math.cos(a) * 7.6, .55, Math.sin(a) * 7.6], { scale: [.1, 1.1, .1], shadow: false }); solid(yard, cube, '#2a2f2c', [Math.cos(a) * 7.6, .95, Math.sin(a) * 7.6], { scale: [2.2, .07, .07], rotation: [0, -a + Math.PI / 2, 0], shadow: false }); }
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.6, .9), new THREE.MeshStandardMaterial({ map: letteringTexture('CLINT EASTWOOD / 2001', { height: 128, accent: '#6fe3ff' }), roughness: .9 }));
    plaque.position.set(0, 1.1, 7.9); yard.add(plaque);
    // Fantasma azul: corpo translúcido que sobe e desce sobre as lápides.
    const ghost = new THREE.Group(); ghost.position.set(.6, 3.2, .4);
    const spirit = new THREE.MeshStandardMaterial({ color: '#7fd9ff', emissive: '#3fb8ff', emissiveIntensity: 1.5, transparent: true, opacity: .62, roughness: .4, depthWrite: false });
    const part = (geometry, position, scale, rotation = [0, 0, 0]) => { const mesh = new THREE.Mesh(geometry, spirit); mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation); ghost.add(mesh); };
    part(blob, [0, .9, 0], [.95, 1.05, .9]); part(cone, [0, -.6, 0], [.85, 2.2, .8], [Math.PI, 0, 0]);
    for (const side of [-1, 1]) part(blob, [side * 1.05, .55, .1], [.5, .22, .22], [0, 0, side * .5]);
    for (const side of [-1, 1]) { const eye = new THREE.Mesh(blob, material('#10202a')); eye.position.set(side * .32, 1.05, .78); eye.scale.set(.16, .22, .08); ghost.add(eye); }
    yard.add(ghost); bake(yard, [ghost, plaque]);
    animated.push((t, reduced) => { ghost.position.y = 3.2 + (reduced ? 0 : Math.sin(t * 1.3) * .45); ghost.rotation.y = reduced ? 0 : Math.sin(t * .5) * .6; spirit.opacity = reduced ? .62 : .5 + Math.sin(t * 2.1) * .14; });
  }

  // ---------------------------------------------------------------- helicópteros de El Mañana
  const centre = { x: 80, y: 31, z: -163 };
  for (const phase of [0, Math.PI]) {
    const copter = new THREE.Group(); copter.name = 'helicopter'; scene.add(copter);
    solid(copter, blob, '#1c2224', [0, 0, 0], { scale: [1.1, 1, 2.3] });
    solid(copter, cube, '#1c2224', [0, .2, 2.9], { scale: [.3, .35, 3.6] });
    solid(copter, cube, '#1c2224', [0, .9, 4.5], { scale: [.12, 1.3, .6] });
    solid(copter, blob, '#3a5560', [0, .15, -1.25], { scale: [.85, .7, 1] });
    for (const side of [-1, 1]) { solid(copter, cube, '#2a3036', [side * .9, -1.15, 0], { scale: [.12, .12, 3.2] }); solid(copter, cube, '#2a3036', [side * .7, -.75, .6], { scale: [.08, .8, .08], rotation: [0, 0, side * .35] }); }
    const light = solid(copter, blob, '#ff2a2a', [0, -.95, -.6], { scale: [.2, .2, .2], glow: true, shadow: false });
    const rotor = new THREE.Group(); rotor.position.y = 1.25; copter.add(rotor);
    const tail = new THREE.Group(); tail.position.set(.25, .9, 4.5); copter.add(tail);
    bake(copter, [light, rotor, tail]);
    for (const turn of [0, Math.PI / 2]) solid(rotor, cube, '#2a3036', [0, 0, 0], { scale: [7.4, .06, .34], rotation: [0, turn, 0], shadow: false });
    solid(tail, cube, '#2a3036', [0, 0, 0], { scale: [.05, 1.5, .16], shadow: false });
    animated.push((t, reduced) => {
      const angle = phase + (reduced ? .6 : t * .32), reach = 36 + Math.sin(angle * 2) * 5;
      copter.position.set(centre.x + Math.cos(angle) * reach, centre.y + Math.sin(angle * 1.7 + phase) * 3, centre.z + Math.sin(angle) * reach);
      // Nariz (−z local) segue a tangente da órbita, com leve inclinação para dentro.
      copter.rotation.set(-.12, Math.PI - angle, reduced ? 0 : .2, 'YXZ');
      if (!reduced) { rotor.rotation.y = t * 28; tail.rotation.x = t * 34; light.visible = Math.sin(t * 6 + phase) > 0; }
    });
  }
  return { update(t, reduced) { for (const step of animated) step(t, reduced); } };
}
