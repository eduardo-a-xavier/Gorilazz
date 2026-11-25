import * as THREE from './vendor/three.module.min.js';
import { nearestRoad } from './world-data.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { loadModelSafely } from './model-safety.js';

export const EASTER_EGG_POSITIONS = [
  { id: 'moose', x: 58, z: -38, radius: 4 },
  { id: 'trailer', x: -77, z: -41, radius: 4 },
  { id: 'reject', x: -101, z: -110, radius: 2 },
  { id: 'save', x: 106, z: -110, radius: 2 },
  { id: 'pazuzu', x: -98, z: -122, radius: 2 },
  { id: 'zombies', x: -5, z: -85, radius: 2 },
];

export const isMurdocHead = object => object.isMesh && /^murdocmurdochead(?:smd)?$/i.test(object.name.replace(/[^a-z0-9]/gi, ''));
export const LUNAR_MURDOC = Object.freeze({ x: 90, y: 44, z: -165, height: 59, disk: 70 });
export function followLunarCamera(anchor, camera) { anchor.position.copy(camera.position); }
export function configureLunarMaterial(material) { material.fog = false; material.depthTest = false; material.depthWrite = false; return material; }

export function installEasterEggs(scene) {
  const dark = new THREE.MeshStandardMaterial({ color: '#40302a', roughness: 1 });
  const antler = new THREE.MeshStandardMaterial({ color: '#b4a081', roughness: 1 });
  const van = new THREE.MeshStandardMaterial({ color: '#a6987d', roughness: .9 });
  const trim = new THREE.MeshStandardMaterial({ color: '#302b30', roughness: .9 });
  const glow = new THREE.MeshBasicMaterial({ color: '#76d677' });
  const purpleGlow = new THREE.MeshBasicMaterial({ color: '#9062b8' });
  const add = (group, geometry, material, x, y, z) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z); group.add(mesh); return mesh;
  };
  const moose = new THREE.Group(); moose.name = 'easter-moose'; moose.position.set(58, 0, -38); moose.rotation.y = -.5;
  add(moose, new THREE.BoxGeometry(2.8, 1.5, 1.1), dark, 0, 2.2, 0);
  add(moose, new THREE.BoxGeometry(1.15, 1.2, 1), dark, 1.5, 2.8, 0);
  add(moose, new THREE.BoxGeometry(.8, .65, .8), dark, 2.1, 2.6, 0);
  for (const x of [-.9, .9]) for (const z of [-.38, .38]) add(moose, new THREE.BoxGeometry(.25, 1.5, .25), dark, x, .75, z);
  for (const side of [-1, 1]) {
    add(moose, new THREE.BoxGeometry(.18, 1.3, .18), antler, 1.45, 3.8, side * .45).rotation.z = side * .15;
    add(moose, new THREE.BoxGeometry(.18, .2, 1.15), antler, 1.45, 4.3, side * .95);
    for (const z of [.6, 1, 1.4]) add(moose, new THREE.BoxGeometry(.14, .5, .14), antler, 1.45, 4.55, side * z);
  }
  scene.add(moose); // alce de caixas: fallback se o GLB não carregar
  // Alce GLB (moose-01.glb, origem nos pés, +X = cabeça): mesma posição, rotação e gatilho do alce de caixas; base em y = -0,06 (como as árvores).
  loadModelSafely(new GLTFLoader(), './assets/models/scenery/moose-01.glb').then(gltf => {
    const model = gltf.scene; model.name = 'easter-moose-glb';
    model.position.set(58, -0.06, -38); model.rotation.y = -.5;
    model.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.remove(moose); scene.add(model);
  }).catch(err => console.warn('Alce GLB indisponível; mantendo o alce de caixas:', err.message));
  const trailer = new THREE.Group(); trailer.name = 'easter-trailer'; trailer.position.set(-77, 0, -41); trailer.rotation.y = .4;
  add(trailer, new THREE.BoxGeometry(5.8, 2.5, 2.5), van, 0, 1.85, 0);
  add(trailer, new THREE.BoxGeometry(5.85, .24, 2.55), trim, 0, 2.65, 0);
  for (const x of [-1.9, 1.9]) for (const z of [-1.2, 1.2]) {
    const wheel = add(trailer, new THREE.CylinderGeometry(.45, .45, .25, 10), trim, x, .5, z); wheel.rotation.x = Math.PI / 2;
  }
  for (const x of [-1.6, 0, 1.6]) for (const side of [-1, 1]) add(trailer, new THREE.BoxGeometry(1, .65, .04), x === 0 ? purpleGlow : glow, x, 2.1, side * 1.26);
  const spill = new THREE.MeshBasicMaterial({ color: '#78c97f', transparent: true, opacity: .12, depthWrite: false });
  for (const side of [-1, 1]) { const light = add(trailer, new THREE.PlaneGeometry(5, 1.3), spill, 0, .025, side * 1.9); light.rotation.x = -Math.PI / 2; }
  // A placa é licença criativa do projeto, não uma referência oficial confirmada.
  const plateCanvas = document.createElement('canvas'); plateCanvas.width = 256; plateCanvas.height = 64;
  const ctx = plateCanvas.getContext('2d'); ctx.fillStyle = '#ddd2a0'; ctx.fillRect(0, 0, 256, 64); ctx.fillStyle = '#161719'; ctx.font = 'bold 34px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('M1-N4-STY', 128, 44);
  const plate = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(plateCanvas) });
  add(trailer, new THREE.PlaneGeometry(1.3, .33), plate, 0, 1, 1.28);
  // Saneamento de veículos: o furgão do Easter egg estava sobre a área de grama/terra do cemitério, então a malha não entra mais na cena.
  // O gatilho (EASTER_EGG_POSITIONS, id 'trailer') continua no mesmo lugar e raio.
  void trailer;
  const atlas = document.createElement('canvas'); atlas.width = 1024; atlas.height = 512;
  const paint = atlas.getContext('2d');
  // O aviso de zumbis é uma criação autoral inspirada no universo fictício.
  const labels = [['REJECT', 'FALSE ICONS'], ['SAVE US', 'FROM HIM'], ['PAZUZU'], ['AVISO: ZUMBIS', 'DO KONG STUDIOS']];
  labels.forEach((lines, i) => {
    const x = (i % 2) * 512, y = Math.floor(i / 2) * 256;
    paint.fillStyle = i === 2 ? '#1c1a20' : '#302c2a'; paint.fillRect(x, y, 512, 256);
    paint.strokeStyle = i % 2 ? '#99d46b' : '#e59c93'; paint.lineWidth = 8; paint.strokeRect(x + 10, y + 10, 492, 236);
    paint.fillStyle = '#eee1c7'; paint.textAlign = 'center'; paint.font = 'bold 48px sans-serif';
    lines.forEach((line, j) => paint.fillText(line, x + 256, y + 105 + j * 64, 475));
    if (i === 2) {
      paint.fillStyle = '#b8d495'; paint.beginPath();
      paint.moveTo(x + 256, y + 128); paint.lineTo(x + 232, y + 152); paint.lineTo(x + 165, y + 125);
      paint.lineTo(x + 194, y + 177); paint.lineTo(x + 228, y + 180); paint.lineTo(x + 216, y + 225);
      paint.lineTo(x + 256, y + 205); paint.lineTo(x + 296, y + 225); paint.lineTo(x + 284, y + 180);
      paint.lineTo(x + 318, y + 177); paint.lineTo(x + 347, y + 125); paint.lineTo(x + 280, y + 152); paint.closePath(); paint.fill();
    }
  });
  const atlasTexture = new THREE.CanvasTexture(atlas); atlasTexture.colorSpace = THREE.SRGBColorSpace;
  const posterMaterial = new THREE.MeshBasicMaterial({ map: atlasTexture });
  EASTER_EGG_POSITIONS.slice(2).forEach((spot, i) => {
    const group = new THREE.Group(); group.name = `easter-${spot.id}`; group.position.set(spot.x, 0, spot.z);
    const road = nearestRoad(spot); group.rotation.y = Math.atan2(road.x - spot.x, road.z - spot.z);
    add(group, new THREE.BoxGeometry(3.2, 2.9, .16), trim, 0, 1.45, 0);
    const geometry = new THREE.PlaneGeometry(3, 2); const uv = geometry.attributes.uv;
    for (let n = 0; n < uv.count; n++) uv.setXY(n, (uv.getX(n) + i % 2) / 2, (uv.getY(n) + (1 - Math.floor(i / 2))) / 2);
    add(group, geometry, posterMaterial, 0, 1.8, .1); scene.add(group);
  });
}
