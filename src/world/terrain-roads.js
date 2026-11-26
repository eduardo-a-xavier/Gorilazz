// Terreno base, malha viária, colinas de contorno, pedras de costa, placas de rua, cidade e lavagem de eras no solo.
import * as THREE from '../vendor/three.module.min.js';
import { CITY_ERAS, eraAt } from '../world-data.js';
import { buildRoads } from '../roads.js';
import { installCity } from '../city.js';
import { ROAD_SIGN_SCALE } from '../discovery-scale.js';
import { eraBillboardCredits } from '../content.js';

export function installTerrainAndRoads({ scene, surfaces, material, box }) {
  const ground = box(scene, [280, 5, 250], [0, -2.8, -75], '#34433f');
  ground.material = surfaces.get('grass', 90, 80);
  ground.castShadow = false;

  // Tudo o que é estático entra em `city` e é fundido por material mais abaixo.
  const city = new THREE.Group();
  scene.add(city);
  buildRoads(city, surfaces, material);

  // The hills sit beyond the drivable boundary; the road surface stays level.
  for (let i = 0; i < 23; i++) {
    const angle = i * Math.PI * 2 / 23;
    const hill = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), material(i % 2 ? '#5f7666' : '#71867a'));
    hill.position.set(Math.cos(angle) * 235, -6, -75 + Math.sin(angle) * 205);
    hill.scale.set(33 + i % 4 * 6, 14 + i % 5 * 4, 24 + i % 3 * 5);
    hill.rotation.y = angle;
    city.add(hill);
  }

  // Visible boundary stones mark the coast and recovery area.
  for (let i = 0; i < 32; i++) {
    const x = i < 16 ? -134 + i * 17.8 : (i % 2 ? -134 : 134);
    const z = i < 16 ? (i % 2 ? -194 : 44) : -185 + (i - 16) * 14;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3, 0), surfaces.get('earth', 2));
    rock.position.set(x, -.4, z);
    rock.scale.y = .55;
    city.add(rock);
  }

  function sign(text, at, color = '#f2559c') {
    const signGroup = new THREE.Group(); signGroup.position.set(at.x, 0, at.z); signGroup.rotation.y = at.heading || 0;
    signGroup.scale.setScalar(ROAD_SIGN_SCALE); city.add(signGroup);
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const context = canvas.getContext('2d'); context.fillStyle = '#141414'; context.fillRect(0, 0, 768, 256);
    context.strokeStyle = color; context.lineWidth = 16; context.strokeRect(8, 8, 752, 240);
    context.fillStyle = '#e2d8c0'; context.font = 'bold 52px monospace'; context.textAlign = 'center';
    text.split('|').forEach((line, index, lines) => context.fillText(line, 384, lines.length === 1 ? 136 : 92 + index * 66, 700));
    context.fillStyle = color; context.font = 'bold 20px monospace';
    context.fillText(eraBillboardCredits.explosao, 384, 224, 700);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    box(signGroup, [8.16, 2.81, .16], [0, 4.1, 0], '#23282b');
    const art = new THREE.MeshStandardMaterial({ map: texture, roughness: .7 });
    for (const turn of [0, Math.PI]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.65), art);
      face.position.set(0, 4.1, turn ? -.085 : .085); face.rotation.y = turn; face.receiveShadow = true; signGroup.add(face);
    }
    for (const dx of [-2.6, 2.6]) box(signGroup, [.18, 3.5, .18], [dx, 1.5, 0], '#777487');
    return { canvas, context, texture };
  }

  installCity(scene, surfaces);
  sign('MURAIS ←|MOINHO →', { x: 9.5, z: -40.5, heading: 1.2 }, '#7fa6ff');

  return { ground, city, sign };
}

export function installEraGroundWash(scene) {
  // Cor de bairro no chão: cada época tinge o terreno do seu território com transição suave nas divisas.
  const size = 96, tint = document.createElement('canvas'); tint.width = tint.height = size;
  const context = tint.getContext('2d');
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    context.fillStyle = CITY_ERAS[eraAt({ x: -140 + i / (size - 1) * 280, z: -200 + j / (size - 1) * 250 })].color;
    context.fillRect(i, j, 1, 1);
  }
  const soft = document.createElement('canvas'); soft.width = soft.height = size * 2;
  const blur = soft.getContext('2d');
  blur.filter = 'blur(7px) saturate(45%)';
  blur.drawImage(tint, 0, 0, size * 2, size * 2);
  blur.filter = 'none';
  blur.globalAlpha = .5;
  blur.drawImage(tint, 0, 0, size * 2, size * 2);
  const map = new THREE.CanvasTexture(soft); map.colorSpace = THREE.SRGBColorSpace;
  const wash = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 250),
    new THREE.MeshStandardMaterial({ map, transparent: true, opacity: .22, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }),
  );
  wash.rotation.x = -Math.PI / 2; wash.position.set(0, -.295, -75); wash.receiveShadow = true; wash.renderOrder = 1;
  scene.add(wash);
  return wash;
}
