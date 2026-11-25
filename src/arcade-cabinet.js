// Máquina de fliperama 3D em Kong Studios (ponto de destaque). Geometria procedural, sem assets externos.
// Dimensões em metros: visível da câmera de 3ª pessoa (~50 m) graças ao corpo maior, ao feixe de luz e ao anel no chão.
// Sem PointLight: cada luz extra encarece o shader de todos os materiais; o brilho vem de materiais emissivos.
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { ARCADE_SPOT, ARCADE_PAD_RADIUS } from './arcade.js';
import { NON_DISCOVERY_PROP_SCALE } from './discovery-scale.js';
import { nearestRoad } from './world-data.js';
import { loadModelSafely, repairMaterials } from './model-safety.js';

export const ARCADE_GLB_URL = './assets/models/scenery/arcade-01-kong.glb';

function canvasTexture(width, height, draw) {
  if (typeof document === 'undefined') return new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  draw(canvas.getContext('2d'), width, height);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}
function marqueeTexture() {
  return canvasTexture(768, 288, (ctx, w, h) => {
    ctx.fillStyle = '#0b1214'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#c4dc9d'; ctx.lineWidth = 14; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = '#ffcc4d'; ctx.font = 'bold 118px Impact, Anton, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('KONG ARCADE', w / 2, h / 2 + 6);
  });
}
function screenTexture() {
  return canvasTexture(384, 288, (ctx, w, h) => {
    ctx.fillStyle = '#0b1214'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1b3a55';
    for (let y = 0; y < 6; y++) for (let x = 0; x < 9; x++) if ((x + y) % 2 === 0) ctx.fillRect(22 + x * 38, 26 + y * 36, 32, 26);
    ctx.fillStyle = '#c4dc9d'; ctx.beginPath(); ctx.arc(120, 196, 13, 0, Math.PI * 2); ctx.fill();   // carrinho
    ctx.fillStyle = '#7fa6ff'; ctx.beginPath(); ctx.arc(236, 100, 12, 0, Math.PI * 2); ctx.fill();  // fantasma azul
    ctx.fillStyle = '#f5a9c6'; ctx.beginPath(); ctx.arc(290, 206, 12, 0, Math.PI * 2); ctx.fill();  // fantasma rosa
    ctx.fillStyle = '#ffcc4d'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'center';
    ctx.fillText('APERTE E', w / 2, h - 16);
  });
}

export function installArcadeCabinet(scene) {
  const group = new THREE.Group();
  group.name = 'arcade-cabinet';
  group.position.set(ARCADE_SPOT.x, 0, ARCADE_SPOT.z);
  group.scale.setScalar(NON_DISCOVERY_PROP_SCALE);
  // Frente (+z) voltada para a via mais próxima: a máquina fica paralela à calçada, de costas para o prédio.
  const road = nearestRoad(ARCADE_SPOT);
  group.rotation.y = Math.atan2(road.x - ARCADE_SPOT.x, road.z - ARCADE_SPOT.z);
  const body = new THREE.MeshStandardMaterial({ color: '#1b2a35', roughness: .7 });
  const trim = new THREE.MeshStandardMaterial({ color: '#4d7699', roughness: .5 });
  const fallbackMeshes = [];
  const add = (geometry, material, position, rotation = [0, 0, 0]) => {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(...position); mesh.rotation.set(...rotation); group.add(mesh); fallbackMeshes.push(mesh); return mesh;
  };
  const screenTex = screenTexture();
  add(new THREE.BoxGeometry(1.8, 3.6, 1.3), body, [0, 1.8, 0]);                                  // corpo
  add(new THREE.BoxGeometry(2.0, .14, 1.5), trim, [0, 3.67, 0]);                                  // topo
  add(new THREE.BoxGeometry(1.8, .72, .2), new THREE.MeshBasicMaterial({ map: marqueeTexture(), toneMapped: false }), [0, 4.1, .66]); // marquise
  add(new THREE.BoxGeometry(1.4, 1.05, .06), new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false }), [0, 2.65, .68], [-.25, 0, 0]); // tela
  add(new THREE.BoxGeometry(1.6, .4, .62), trim, [0, 1.9, .82], [.42, 0, 0]);                     // painel de controle
  add(new THREE.BoxGeometry(2.0, .2, 1.5), body, [0, .1, 0]);                                    // base
  // Feixe de luz e anel no chão: destaque visível de longe, sem sombra e sem custo de luz.
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, .9, 16, 20, 1, true), new THREE.MeshBasicMaterial({ color: '#ffcc4d', transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  beam.position.y = 8; beam.name = 'arcade-beam'; group.add(beam);
  // Base de piso e anel rosa iguais aos dos pontos de história (scene.js): ficam em escala de mundo, fora do grupo escalado.
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(ARCADE_PAD_RADIUS, ARCADE_PAD_RADIUS + .2, .14, 40), new THREE.MeshStandardMaterial({ color: '#687463', roughness: 1 }));
  pad.position.set(ARCADE_SPOT.x, -.11, ARCADE_SPOT.z); pad.receiveShadow = true; pad.name = 'arcade-pad'; scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(ARCADE_PAD_RADIUS - .8, .035, 6, 40), new THREE.MeshBasicMaterial({ color: '#f5a9c6', transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
  ring.rotation.x = Math.PI / 2; ring.position.set(ARCADE_SPOT.x, .01, ARCADE_SPOT.z); ring.name = 'arcade-ring'; scene.add(ring);
  group.traverse(node => { if (node.isMesh && node !== beam) { node.castShadow = true; node.receiveShadow = true; } });
  scene.add(group);

  let glbLoaded = false;
  group.userData.loadArcadeModel = (loader = new GLTFLoader()) => {
    if (glbLoaded) return Promise.resolve(true);
    return loadModelSafely(loader, ARCADE_GLB_URL).then(gltf => {
      repairMaterials(gltf.scene);
      gltf.scene.traverse(obj => {
        if (!obj.isMesh) return;
        obj.castShadow = true; obj.receiveShadow = true;
        if (obj.name === 'screen' || /Screen_ReplaceWithGameTexture/i.test(obj.material?.name || '')) {
          obj.material = new THREE.MeshBasicMaterial({ map: screenTex, toneMapped: false });
        } else if (obj.geometry) {
          obj.material = new THREE.MeshStandardMaterial({
            color: '#f2c13a', // acabamento amarelo/preto Kong Arcade sobre as cores de vértice
            vertexColors: Boolean(obj.geometry.attributes.color),
            roughness: .68,
            metalness: .08,
            emissive: '#000000',
            emissiveIntensity: 0,
          });
        }
      });
      for (const m of fallbackMeshes) { group.remove(m); m.geometry?.dispose?.(); }
      fallbackMeshes.length = 0;
      group.add(gltf.scene);
      group.userData.glbLoaded = true;
      glbLoaded = true;
      return true;
    }).catch(err => {
      console.warn('Gabinete Kong Arcade GLB indisponível; mantendo procedural:', err.message);
      return false;
    });
  };
  return group;
}
