import { createCabin } from './cabin.js';
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { CITY_LOTS, ERA_GATES, MEMBER_LOCATIONS, TREE_LOCATIONS } from './world-data.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { createSurfaceLibrary } from './materials.js';
import { updateEraArt } from './city.js';
import { createPilotRig, PILOT_MODEL_URL, PILOT_V5_URL, PILOT_V4_URL, PILOT_V2_URL, PILOT_FALLBACK_URL } from './pilot-rig.js';
import { loadModelSafely, repairMaterials } from './model-safety.js';
import { createVehicleMotion, updateVehicleMotion } from './vehicle-motion.js';
import { clampFrameDelta } from './frame-timing.js';
import { createCameraState } from './camera-state.js';
import { installLighting } from './world/lighting.js';
import { installTerrainAndRoads, installEraGroundWash } from './world/terrain-roads.js';
import { installWorldProps, FX_COUNT } from './world/props.js';
import { installStagesAndBand } from './world/stages.js';

// Funde as malhas estáticas de um grupo por material: uma chamada de desenho por material.
// Objetos em `keep` (animados ou com material trocado em execução) ficam intactos.
function bake(group, keep = []) {
  for (const object of keep) group.remove(object);
  group.updateMatrixWorld(true);
  const toLocal = new THREE.Matrix4().copy(group.matrixWorld).invert(), relative = new THREE.Matrix4(), batches = new Map();
  group.traverse(object => {
    if (!object.isMesh) return;
    const key = `${object.material.uuid}/${object.castShadow}/${object.receiveShadow}`;
    if (!batches.has(key)) batches.set(key, { object, geometries: [] });
    batches.get(key).geometries.push(object.geometry.clone().applyMatrix4(relative.multiplyMatrices(toLocal, object.matrixWorld)));
  });
  group.traverse(object => { if (object.isMesh) object.geometry.dispose(); }); group.clear();
  for (const { object, geometries } of batches.values()) {
    // mergeGeometries exige os mesmos atributos e o mesmo tipo de indexação em todas as peças.
    const indexed = geometries.every(geometry => geometry.index);
    const parts = indexed ? geometries : geometries.map(geometry => geometry.index ? geometry.toNonIndexed() : geometry);
    const shared = Object.keys(parts[0].attributes).filter(name => parts.every(part => part.attributes[name]));
    for (const part of parts) for (const name of Object.keys(part.attributes)) if (!shared.includes(name)) part.deleteAttribute(name);
    const mesh = new THREE.Mesh(mergeGeometries(parts), object.material);
    mesh.castShadow = object.castShadow; mesh.receiveShadow = object.receiveShadow; group.add(mesh);
    for (const geometry of new Set([...geometries, ...parts])) geometry.dispose();
  }
  for (const object of keep) group.add(object);
  return group;
}

export function createDriver(material) {
  const driver = new THREE.Group(); driver.position.set(-.54,.12,.42); driver.scale.setScalar(1.22); driver.name='driver';
  // Variante B: piloto de estrada original — modelagem mais realista com rosto definido, estrutura de braço separada, capô e detalhes de piloto.
  const smooth = new THREE.SphereGeometry(1,9,6), face = new THREE.SphereGeometry(1,12,9), round = new THREE.SphereGeometry(1,10,7), soft = new THREE.SphereGeometry(1,8,5), detail = new THREE.SphereGeometry(1,8,4), dot = new THREE.SphereGeometry(1,6,3);
  const capShell = new THREE.SphereGeometry(1,12,4,0,Math.PI*2,0,Math.PI/2), smile = new THREE.TorusGeometry(1,.15,5,8,Math.PI*.85), collar = new THREE.TorusGeometry(1,.22,5,8), neck = new THREE.CylinderGeometry(.9,1.1,1,8,1);
  const SKIN='#c65b62', CREAM='#f5e1a6', PINK='#e38d99', DARK='#1a1a2e', INK='#2d3436', PILOT_BLUE='#36bdb5';
  const part = (parent,geometry,size,at,color) => {
    const mesh = new THREE.Mesh(geometry,material(color)); mesh.scale.set(...size); mesh.position.set(...at);
    mesh.castShadow=mesh.receiveShadow=true; parent.add(mesh); return mesh;
  };
  // Tronco: peito e abdômen em duas peças, cinto amarelo-esverdeado, gola estruturada, pescoço mais grosso.
  part(driver,round,[.35,.38,.22],[0,1.65,.08],CREAM);
  part(driver,soft,[.32,.3,.16],[0,1.35,.06],CREAM);
  part(driver,detail,[.38,.06,.24],[0,1.25,.08],PINK);
  part(driver,neck,[.09,.22,.09],[0,2.05,.06],SKIN);
  part(driver,collar,[.14,.14,.14],[0,1.95,.06],PINK).rotation.x=Math.PI/2;
  // Placa estrutural do peito (estilo piloto)
  const chestPlate = part(driver,soft,[.28,.22,.1],[0,1.7,.04],DARK);
  chestPlate.rotation.z = Math.PI/8;
  // Ombrops estruturados
  const shoulderL = part(driver,soft,[.18,.12,.2],[-.25,1.2,.05],DARK);
  const shoulderR = part(driver,soft,[.18,.12,.2],[.25,1.2,.05],DARK);
  // Tronco segundo painel (detalhes laterais)
  part(driver,detail,[.1,.08,.16],[-.22,1.4,.02],PINK);
  part(driver,detail,[.1,.08,.16],[.22,1.4,.02],PINK);
  const driverHead = new THREE.Group(); driverHead.position.set(0,2.35,.05); driverHead.name='driver-head'; driver.add(driverHead);
  // Cabeça: estrutura oval frontal, queixo definido, cabelo liso lateral, capacete de piloto com viseira.
  part(driverHead,face,[.3,.32,.35],[0,0,0],SKIN);
  // Olhos definidos
  const eyeL = part(driverHead,dot,[.06,.06,.06],[-.12,.22,.28],INK);
  const eyeR = part(driverHead,dot,[.06,.06,.06],[.12,.22,.28],INK);
  part(driverHead,capShell,[.33,.3,.32],[0,0,.02],PINK);
  part(driverHead,dot,[.06,.06,.06],[-.12,.22,.28],INK);
  // Nariz perfilado
  part(driverHead,detail,[.08,.06,.05],[0,.18,.25],DARK);
  part(driverHead,soft,[.245,.19,.13],[0,-.005,.2],DARK);
  for (const side of [-1,1]) {
    part(driverHead,detail,[.035,.06,.035],[side*.25,-.015,0],SKIN);
    part(driverHead,detail,[.03,.075,.03],[side*.252,.03,-.1],DARK);
    part(driverHead,soft,[.062,.07,.03],[side*.1,-.02,-.228],CREAM);
    part(driverHead,detail,[.034,.043,.016],[side*.1,-.022,-.256],INK);
    part(driverHead,dot,[.01,.012,.006],[side*.1-.011,-.008,-.27],CREAM);
    part(driverHead,detail,[.07,.017,.022],[side*.1,.062,-.25],INK).rotation.z=side*.14;
    part(driverHead,dot,[.04,.026,.012],[side*.165,-.1,-.2],PINK);
    part(driver,soft,[.12,.11,.35],[side*.17,1.12,-.3],DARK);
    part(driver,soft,[.11,.3,.11],[side*.17,.8,-.62],DARK);
    part(driver,soft,[.1,.1,.1],[side*.29,1.8,.07],CREAM);
  }
  part(driverHead,detail,[.035,.045,.045],[0,-.055,-.269],SKIN);
  const mouth = part(driverHead,smile,[.08,.08,.05],[0,.1,.15],INK); mouth.rotation.z=-(Math.PI/2+Math.PI*.35);
  const upperArmL = new THREE.Group(); upperArmL.position.set(-.25,1.5,.6); driver.add(upperArmL);
  part(upperArmL,soft,[.14,.1,.18],[0,0,0],SKIN);
  // Cotovelo esquerdo
  const elbowL = part(upperArmL,detail,[.08,.06,.08],[0,.3,0],PINK);
  // Forearm esquerdo
  const forearmL = new THREE.Group(); forearmL.position.set(-.22,1.15,.4); upperArmL.add(forearmL);
  part(forearmL,soft,[.08,.07,.12],[0,0,0],CREAM);
  part(forearmL,detail,[.04,.03,.05],[0,.15,0],PINK);
  // Mão esquerda - garra leve no volante
  const handL = new THREE.Group(); handL.position.set(-.2,0,.1); forearmL.add(handL);
  part(handL,soft,[.06,.05,.08],[0,0,0],SKIN);
  part(handL,dot,[.025,.022,.03],[0,.02,0],INK);
  part(handL,detail,[.03,.02,.03],[0,.05,0],PINK);
  // Braço superior direito com articulação visível
  const upperArmR = new THREE.Group(); upperArmR.position.set(.25,1.5,.6); driver.add(upperArmR);
  part(upperArmR,soft,[.14,.1,.18],[0,0,0],SKIN);
  // Cotovelo direito
  const elbowR = part(upperArmR,detail,[.08,.06,.08],[0,.3,0],PINK);
  // Forearm direito
  const forearmR = new THREE.Group(); forearmR.position.set(.22,1.15,.4); upperArmR.add(forearmR);
  part(forearmR,soft,[.08,.07,.12],[0,0,0],CREAM);
  part(forearmR,detail,[.04,.03,.05],[0,.15,0],PINK);
  // Mão direita - garra leve no volante
  const handR = new THREE.Group(); handR.position.set(.2,0,.1); forearmR.add(handR);
  part(handR,soft,[.06,.05,.08],[0,0,0],SKIN);
  part(handR,dot,[.025,.022,.03],[0,.02,0],INK);
  part(handR,detail,[.03,.02,.03],[0,.05,0],PINK);
  bake(driverHead); bake(upperArmL); bake(forearmL); bake(upperArmR); bake(forearmR); bake(driverHead); bake(driver);
  return {driver,driverHead,upperArmL,forearmL,upperArmR,forearmR};
}

export function createDriverReaction() {
  let started = -Infinity;
  const cancel = () => { started=-Infinity; };
  return {
    cancel,
    trigger(now,speed,reduced) {
      if (reduced || Math.abs(speed) > .05) { cancel(); return false; }
      if (now-started < .8) return false;
      started=now; return true;
    },
    sample(now,speed,reduced) {
      if (reduced || Math.abs(speed) > .05) { cancel(); return 0; }
      const phase=(now-started)/.8;
      return phase>0 && phase<1 ? Math.sin(phase*Math.PI) : 0;
    },
  };
}

// Câmera de viagem. Só a malha principal (prédios e o ilhote do centro) bloqueia a vista: os
// portais ERA_GATES são vazados e seus postes (2,2 m) são decorativos, então não entram no raio
// da câmera. Prédios guardam `rw/rd` (meia-largura/profundidade reais) para a sonda do follow().
export function createCameraBlockers() {
  return [
    ...CITY_LOTS.map(lot => ({ x: lot.x, z: lot.z, cos: Math.cos(lot.rotation), sin: Math.sin(lot.rotation), halfW: lot.w / 2 + 1.2, halfD: lot.d / 2 + 1.2, rw: lot.w / 2, rd: lot.d / 2, top: lot.floors * 3.2 + 1.5 })),
    { x: -28, z: 6, cos: 1, sin: 0, halfW: 8, halfD: 8, rw: 8, rd: 8, top: 16 },
    // Copas das árvores (esfera de 2,2 m no tronco de 3,7 m, environment.js): a câmera não atravessa a folhagem.
    ...TREE_LOCATIONS.map(tree => ({ x: tree.x, z: tree.z, cos: 1, sin: 0, halfW: 3.4, halfD: 3.4, rw: 2.2, rd: 2.2, top: 6.1 })),
  ];
}
const DEFAULT_BLOCKERS = createCameraBlockers();

// Constantes da câmera: aproxima rápido (parede à frente), recua devagar, nunca oscila.
export function qualitySettings(mode, deviceRatio, birds, particles) {
  const name = ['auto','performance','ultra'].includes(mode) ? mode : 'auto';
  const performance = name === 'performance';
  return { name, pixelRatio: Math.min(deviceRatio, performance ? 1 : 1.5), shadows: !performance, far: performance ? 450 : 650,
    birds: performance ? Math.ceil(birds / 2) : birds, particles: performance ? Math.min(12, particles) : particles, dust: !performance };
}

// Inclinação progressiva do olhar ao parar ou segurar L (sem mexer no FOV).
export function advanceSkyLook(state, dt, speed, held, enabled = true) {
  const step = clampFrameDelta(dt);
  state.stopped = enabled && Math.abs(speed) < .12 ? state.stopped + step : 0;
  const target = enabled && (held || state.stopped >= 1.5) ? 1 : 0;
  state.amount += THREE.MathUtils.clamp(target - state.amount, -step, step);
  return state.amount * state.amount * (3 - 2 * state.amount);
}

export const TRAVEL_FOV = 60;
export const TRAVEL_LOOK_HEIGHT = 3;
export const CAMERA_TUNING = Object.freeze({
  pivotY: 2.4,          // altura do ponto que a câmera mira no carro
  minArm: 5,          // distância mínima pivô→câmera: o carro (6,8 m) e o piloto nunca ficam atrás dela
  probe: .9,            // raio da sonda além da parede real
  reachIn: 6, reachOut: 1.1,       // taxas (1/s) do braço ao encurtar / ao esticar
  reachInMax: 11, reachOutMax: 3,  // limites de velocidade (m/s) do braço
  pullIn: 5, pullOut: 1.2, pullInMax: 6, pullEmergencyMax: 24, // recuo de segurança do follow(): taxa (1/s) e teto de entrada (m/s)
});

// Alcance livre da câmera no ângulo dado: primeiro ponto do corredor (3 amostras) dentro de um
// prédio. Passo de .25 m com refino por bissecção: o alcance varia continuamente com a posição do
// carro, sem degraus de .75 m que faziam a câmera tremer rente às paredes.
export function clearReach(x, z, angle, radius, height, blockers = DEFAULT_BLOCKERS) {
  const sin = Math.sin(angle), cos = Math.cos(angle);
  const near = blockers.filter(lot => Math.hypot(lot.x - x, lot.z - z) < radius + Math.hypot(lot.halfW, lot.halfD) + 2);
  const blocked = reach => {
    const px = x + sin * reach, pz = z + cos * reach, py = 2 + (height - 2) * reach / radius;
    for (const lot of near) {
      if (py > lot.top) continue;
      for (const side of [0, -1, 1]) {
        const dx = px + cos * side - lot.x, dz = pz - sin * side - lot.z;
        if (Math.abs(dx * lot.cos - dz * lot.sin) < lot.halfW && Math.abs(dx * lot.sin + dz * lot.cos) < lot.halfD) return true;
      }
    }
    return false;
  };
  for (let reach = 5; reach <= radius; reach += .25) {
    if (!blocked(reach)) continue;
    let free = reach - .25, hit = reach;
    for (let i = 0; i < 5; i++) { const mid = (free + hit) / 2; if (blocked(mid)) hit = mid; else free = mid; }
    return Math.max(5, free);
  }
  return radius;
}

// Folga do segmento pivô→câmera contra os prédios reais + raio da sonda. Devolve o comprimento
// livre (≥ minArm). O trecho inicial dentro de uma parede vizinha ao carro é ignorado: só conta
// a entrada em um volume depois de o segmento ter ficado livre.
function armClearance(px, pz, qx, qy, qz, blockers, { pivotY, minArm, probe }) {
  const dx = qx - px, dy = qy - pivotY, dz = qz - pz, len = Math.hypot(dx, dy, dz);
  if (len <= minArm) return len;
  const ux = dx / len, uy = dy / len, uz = dz / len;
  const near = blockers.filter(b => Math.hypot(b.x - (px + dx / 2), b.z - (pz + dz / 2)) < len / 2 + Math.hypot(b.rw ?? b.halfW, b.rd ?? b.halfD) + probe + 1);
  const inside = s => {
    const x = px + ux * s, y = pivotY + uy * s, z = pz + uz * s;
    for (const b of near) {
      if (y > b.top) continue;
      const lx = x - b.x, lz = z - b.z;
      if (Math.abs(lx * b.cos - lz * b.sin) < (b.rw ?? b.halfW) + probe && Math.abs(lx * b.sin + lz * b.cos) < (b.rd ?? b.halfD) + probe) return true;
    }
    return false;
  };
  let was = inside(3);
  for (let s = 3.25; s <= len; s += .25) {
    const now = inside(s);
    if (now && !was) {
      let free = s - .25, hit = s;
      for (let i = 0; i < 5; i++) { const mid = (free + hit) / 2; if (inside(mid)) hit = mid; else free = mid; }
      return Math.max(minArm, free);
    }
    was = now;
  }
  return len;
}

export function createTravelCamera(blockers = DEFAULT_BLOCKERS) {
  const tune = CAMERA_TUNING;
  let smoothReach = null, smoothViewAngle = null, showcaseTurn = 0, raw = null, rawReady = false, pull = 0;
  const arm = new THREE.Vector3();
  function resync() { smoothReach = null; smoothViewAngle = null; showcaseTurn = 0; rawReady = false; pull = 0; }
  function compute(vehicle, { dt = .016, t = 0, zoom = 1, dragAngle = 0, dragElevation = 0, orbit = false, reduced = false, showcase = false, mobile = false, intro = false, overview = false, landmarkView = false, desiredCamera = new THREE.Vector3(), look = new THREE.Vector3() } = {}) {
    const { x, z, heading, speed = 0 } = vehicle;
    const radius = (mobile ? (showcase ? 46 : 7.5) : (showcase ? 40 : 6.5)) * zoom + (reduced ? 0 : Math.abs(speed) * .06);
    const travelHeading = heading;
    const angle = (orbit && !reduced ? t * .16 : showcase ? .48 : .16) + dragAngle;
    const opening = intro && showcase && !mobile && !overview && !landmarkView;
    const cameraAngle = angle + travelHeading, cameraHeight = (opening ? 8.5 : showcase ? 12 : 2.6) + dragElevation;
    // Dirigindo, a câmera só se aproxima; com a banda reunida, procura um ângulo livre com histerese de >= 4 m.
    let reach = clearReach(x, z, cameraAngle, radius, cameraHeight, blockers), viewAngle = cameraAngle;
    // Antecipação: o corredor também é medido onde o carro estará em ~.45 s; o braço encurta antes da parede, sem arrancos.
    if (!reduced && Math.abs(speed) > 2) reach = Math.min(reach, clearReach(x - Math.sin(travelHeading) * speed * .45, z - Math.cos(travelHeading) * speed * .45, cameraAngle, radius, cameraHeight, blockers));
    if (showcase) {
      if (reach >= radius) showcaseTurn = 0;
      else {
        if (showcaseTurn !== 0) {
          const kept = clearReach(x, z, cameraAngle + showcaseTurn, radius, cameraHeight, blockers);
          if (kept > reach) { reach = kept; viewAngle = cameraAngle + showcaseTurn; } else showcaseTurn = 0;
        }
        for (const turn of [.45, -.45, .9, -.9, 1.35, -1.35, 1.8, -1.8]) {
          const open = clearReach(x, z, cameraAngle + turn, radius, cameraHeight, blockers);
          if (open >= reach + 4) { reach = open; viewAngle = cameraAngle + turn; showcaseTurn = turn; if (open >= radius) break; }
        }
      }
    } else showcaseTurn = 0;
    if (reduced || smoothReach === null || smoothViewAngle === null) {
      smoothReach = reach;
      smoothViewAngle = viewAngle;
    } else {
      const delta = Math.atan2(Math.sin(viewAngle - smoothViewAngle), Math.cos(viewAngle - smoothViewAngle));
      smoothViewAngle += delta * (1 - Math.exp(-dt * 6));
      // Aproxima rápido e recua devagar, com teto de velocidade: sem avanço brusco ao resolver a colisão.
      const closing = reach < smoothReach, rate = closing ? tune.reachIn : tune.reachOut, cap = (closing ? tune.reachInMax : tune.reachOutMax) * dt;
      smoothReach += THREE.MathUtils.clamp((reach - smoothReach) * (1 - Math.exp(-dt * rate)), -cap, cap);
      smoothReach = Math.min(smoothReach, radius);
    }
    // Piso de altura perto do carro: 7,5 m (antes 5,8 m) deixa a linha de visada passar acima da copa das árvores (topo ~6,1 m).
    const effectiveHeight = showcase ? THREE.MathUtils.lerp(Math.min(7.5, cameraHeight), cameraHeight, THREE.MathUtils.clamp((smoothReach - 5) / Math.max(1, radius - 5), 0, 1)) : cameraHeight;
    desiredCamera.set(x + Math.sin(smoothViewAngle) * smoothReach, effectiveHeight, z + Math.cos(smoothViewAngle) * smoothReach);
    const ahead = showcase ? 1 : 2 + Math.min(Math.abs(speed) * .1, 3);
    const courtyardOffset = showcase ? (mobile ? -2 : -8) : 0;
    look.set(x + courtyardOffset * Math.cos(heading) - Math.sin(travelHeading) * ahead, TRAVEL_LOOK_HEIGHT, z - courtyardOffset * Math.sin(heading) - Math.cos(travelHeading) * ahead);
    if (opening) { desiredCamera.z -= 10; look.set(x - Math.cos(smoothViewAngle) * 7.5, TRAVEL_LOOK_HEIGHT, z + Math.sin(smoothViewAngle) * 7.5 + 15); }
    if (landmarkView) { desiredCamera.set(125 * zoom, 38 + dragElevation, -98); look.set(84, 16, -152); }
    if (overview) { desiredCamera.set(0, 290 * zoom, -74); look.set(0, 0, -75); }
    return { desiredCamera, look, reach, smoothReach, viewAngle, smoothViewAngle, effectiveHeight, radius };
  }
  /**
   * Segue o alvo e garante que a câmera de fato (a que atrasa em relação ao carro) não atravesse
   * paredes nem o carro. Muta `position` e `target`. O recuo de segurança aproxima rápido e volta
   * devagar; ele é aplicado só na saída, então não realimenta a posição suavizada (sem oscilação).
   */
  function follow(position, target, { desiredCamera, look, pivot, dt = .016, blend = 1, snap = false }) {
    if (!raw) raw = new THREE.Vector3();
    if (snap) { raw.copy(desiredCamera); target.copy(look); }
    else {
      if (!rawReady) raw.copy(position);
      raw.lerp(desiredCamera, blend); target.lerp(look, blend);
    }
    rawReady = true;
    const allowed = armClearance(pivot.x, pivot.z, raw.x, raw.y, raw.z, blockers, tune);
    arm.set(raw.x - pivot.x, raw.y - tune.pivotY, raw.z - pivot.z);
    const length = arm.length(), required = Math.max(0, length - allowed);
    if (snap) pull = required;
    else {
      const closing = required > pull, cap = (closing ? tune.pullInMax : tune.pullOut * 3) * dt;
      pull += THREE.MathUtils.clamp((required - pull) * (1 - Math.exp(-dt * (closing ? tune.pullIn : tune.pullOut))), -cap, cap);
      // Último recurso: se o recuo suave ainda deixaria a câmera dentro da parede real, acelera o recuo (até pullEmergencyMax).
      if (closing && pull < required) pull += Math.min(tune.pullEmergencyMax * dt, Math.max(0, length - armClearance(pivot.x, pivot.z, raw.x, raw.y, raw.z, blockers, { ...tune, probe: .15 }) - pull));
    }
    // Nunca fecha além de minArm: o carro e o piloto ficam sempre à frente da câmera.
    const finalLength = Math.max(Math.min(length, tune.minArm), length - pull);
    if (length > 1e-4) arm.multiplyScalar(finalLength / length); else arm.set(0, finalLength, 0);
    position.set(pivot.x + arm.x, tune.pivotY + arm.y, pivot.z + arm.z);
    return { pull, allowed, length: finalLength };
  }
  return { compute, follow, resync };
}

// Local credited Geep and Phase 7 models; original scenery and geometric fallbacks.
export function createWorld(container, onMember, {onLost = () => {}, onRestored = () => {}, onViewReset = () => {}, onFullscreen = () => {}, onExplore = () => {}, radio, onRadio, onSteer, cameraState = createCameraState({ showcase: false })} = {}) {
  // Perfil gráfico: automático por padrão; ?qualidade=leve ou ?qualidade=alta força um perfil.
  const requested = new URLSearchParams(location.search).get('qualidade');
  // O contêiner ainda não tem largura quando o mundo é criado (clientWidth = 0); sem o recurso à janela,
  // celulares caíam no perfil alto (bloom, sombras de 2048, teto de pixel 1,75 e meta de 60 quadros/s).
  const compact = (container.clientWidth || innerWidth) < 700;
  const light = requested === 'leve' || (requested !== 'alta' && compact);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  // Teto do renderer: 1,5 em qualquer tela (dpr alto não melhora o quadro e custa fill rate); o modo leve segue o mesmo teto.
  const maxRatio = Math.min(devicePixelRatio, 1.5), minRatio = Math.min(maxRatio, .7);
  let pixelRatio = maxRatio, qualityMode = 'auto';
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; // menos compressão de sombras que o ACES: mais contraste
  renderer.toneMappingExposure = 1.38; // clareza geral (faixa 1,35–1,42); mãos do cockpit conferidas em print
  renderer.info.autoReset = false;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Estrada 3D com carro, personagens e cenários musicais');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onLost(); });
  renderer.domElement.addEventListener('webglcontextrestored', () => onRestored());
  const scene = new THREE.Scene();
  const surfaces = createSurfaceLibrary();
  const lighting = installLighting({ scene, renderer, light });
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 650);
  let frameCount = 0;

  const materials = new Map();
  function material(color, glow = false) {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, ...(glow ? { emissive: color, emissiveIntensity: 1.6 } : {}) }));
    return materials.get(key);
  }
  function box(parent, size, at, color, glow = false) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material(color, glow));
    mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function sphere(parent, radius, at, color, scale = [1, 1, 1]) {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 10), material(color));
    mesh.position.set(...at); mesh.scale.set(...scale); mesh.castShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, top, bottom, height, at, color, sides = 12) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(top, bottom, height, sides), material(color));
    mesh.position.set(...at); mesh.castShadow = true; parent.add(mesh); return mesh;
  }

  // Modelos densos viram impostor (cartaz fotografado uma vez) à distância.
  const heavyCasters = [];
  const studioScene = new THREE.Scene(), studioCamera = new THREE.OrthographicCamera();
  studioScene.add(new THREE.HemisphereLight('#ffffff', '#8a8578', 1.9));
  const studioKey = new THREE.DirectionalLight('#ffffff', 2.2); studioKey.position.set(-.5, .8, 1); studioScene.add(studioKey);
  function photograph(object, facing) {
    const parent = object.parent; studioScene.add(object); object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object), size = bounds.getSize(new THREE.Vector3()), centre = bounds.getCenter(new THREE.Vector3());
    const width = Math.max(size.x, size.z) * 1.04, height = size.y * 1.04;
    Object.assign(studioCamera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2, near: .1, far: 400 });
    studioCamera.position.copy(centre).add(new THREE.Vector3(0, 0, facing * 200)); studioCamera.lookAt(centre); studioCamera.updateProjectionMatrix();
    studioKey.position.set(-.5 * facing, .8, facing);
    const pixels = 384, target = new THREE.WebGLRenderTarget(Math.max(64, Math.round(pixels * width / height)), pixels, { samples: 4 });
    target.texture.colorSpace = THREE.SRGBColorSpace;
    const previous = renderer.getRenderTarget(), colour = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
    renderer.setRenderTarget(target); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.render(studioScene, studioCamera);
    renderer.setRenderTarget(previous); renderer.setClearColor(colour, alpha);
    studioScene.remove(object); parent?.add(object);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: target.texture, alphaTest: .5 }));
    card.visible = false; card.userData.lift = centre.y - bounds.min.y; scene.add(card); return card;
  }
  function heavyCaster(object, at, facing = 1) {
    if (object.name === 'studio') return;
    const card = photograph(object, facing), meshes = [];
    object.traverse(child => { if (child.isMesh) meshes.push(child); });
    heavyCasters.push({ object, card, meshes, at, casting: true, far: false });
  }
  const cardTint = new THREE.Color();

  const { city } = installTerrainAndRoads({ scene, surfaces, material, box });
  const props = installWorldProps({ scene, renderer, surfaces, material, box, sphere, cylinder, bake, heavyCaster });
  const stages = installStagesAndBand({ scene, city, surfaces, material, box, sphere, cylinder, bake, heavyCaster });
  bake(city);
  installEraGroundWash(scene);

  const cabin = createCabin();
  const vehicleMotion = createVehicleMotion();
  let steeringPivot = null, steeringSign = 1; const steeringRest = new THREE.Quaternion(), steeringTurn = new THREE.Quaternion(), cabinFrame = new THREE.Quaternion(), cabinEuler = new THREE.Euler();
  const car = new THREE.Group(); scene.add(car);
  box(car, [3.5, .95, 6.8], [0, 1.15, 0], '#e2d8c0');
  box(car, [3.2, .6, 2], [0, 1.65, -2.1], '#e2d8c0');
  box(car, [2.9, 1.25, 3.2], [0, 2.1, .2], '#7fa6ff');
  box(car, [3.1, .2, 3.45], [0, 2.8, .2], '#e2d8c0');
  for (const x of [-1.48, 1.48]) {
    box(car, [.12, 1.25, .14], [x, 2.1, -.8], '#e2d8c0');
    box(car, [.12, 1.25, .14], [x, 2.1, 1.7], '#e2d8c0');
    box(car, [.35, .3, .7], [x * 1.18, 1.9, -.6], '#f2559c');
  }
  box(car, [3.65, .22, .3], [0, .9, 3.4], '#141414');
  box(car, [3.65, .22, .3], [0, .9, -3.4], '#141414');
  for (const x of [-1.15, 1.15]) {
    box(car, [.7, .28, .1], [x, 1.4, 3.45], '#f2559c', true);
    box(car, [.7, .28, .1], [x, 1.4, -3.45], '#fff4c7', true);
  }
  box(car, [1.1, .25, .1], [0, 1.05, 3.57], '#7fa6ff');
  const wheels = [];
  for (const x of [-1.77, 1.77]) for (const z of [-2.1, 2.15]) {
    const wheel = cylinder(car, .75, .75, .5, [x, .75, z], '#11131c'); wheel.rotation.z = Math.PI / 2; wheels.push(wheel);
    const hub = cylinder(car, .36, .36, .52, [x * 1.04, .75, z], '#f2559c'); hub.rotation.z = Math.PI / 2;
  }
  // Motorista: boneco autoral nas cores do site, sentado no banco esquerdo. Fora do carro vê-se
  // o corpo inteiro; em primeira pessoa ele some e ficam só os braços da cabine (cabin.js).
  let {driver,driverHead,upperArmL,upperArmR} = createDriver(material);
  // Motorista autoral em GLB v6; fallback v5, v4, v2 e original.
  // O GLB tem esqueleto (65 ossos) e o clipe Driving_Loop: o mixer anima o corpo e as rotações
  // reativas de direção/aceno são somadas nos ossos reais (src/pilot-rig.js) depois dele.
  let pilotRig = null;
  const pilotLoader = new GLTFLoader(); let pilotPreposed = true;
  loadModelSafely(pilotLoader, PILOT_MODEL_URL)
    .catch(() => { pilotPreposed = false; return loadModelSafely(pilotLoader, PILOT_V5_URL); })
    .catch(() => loadModelSafely(pilotLoader, PILOT_V4_URL))
    .catch(() => loadModelSafely(pilotLoader, PILOT_V2_URL))
    .catch(() => loadModelSafely(pilotLoader, PILOT_FALLBACK_URL))
    .then(gltf => {
      repairMaterials(gltf.scene);
      const pilot = gltf.scene.getObjectByName('driver');
      const head = pilot?.getObjectByName('driver-head');
      const armL = pilot?.getObjectByName('upperArmL');
      const armR = pilot?.getObjectByName('upperArmR');
      if (!pilot || !head || !armL || !armR) return;
      // SkinnedMesh usa a esfera de contorno da pose de repouso: sem isto o piloto some ao se mover.
      pilot.traverse(object => { if (object.isMesh) { object.frustumCulled = false; object.castShadow = true; object.receiveShadow = true; } });
      // Encaixe calibrado no Geep (driver_fit.json): banco esquerdo, olhando para a frente (−Z).
      pilot.position.set(-0.6213, 0.208, 0.4471); pilot.scale.setScalar(1.22); pilot.rotation.y = 0; pilot.name = 'driver';
      pilotRig = createPilotRig(pilot, gltf.animations, { preposed: pilotPreposed });
      pilot.visible = !cameraState.firstPerson;
      car.remove(driver); car.add(pilot); pilot.updateWorldMatrix(true, true);
      driver = pilot; driverHead = head; upperArmL = armL; upperArmR = armR;
      renderer.domElement.dataset.pilot = 'glb';
    }).catch(() => {});
  const driverReaction = createDriverReaction(); let driverYaw=0;
  car.add(driver, cabin.root);
  let modelWheels = [];
  const vehicleStatus = document.querySelector('#vehicle-status');
  function installVehicle(gltf, kind) {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model); const size = bounds.getSize(new THREE.Vector3());
    const scale = 6.6 / size.z; const center = bounds.getCenter(new THREE.Vector3());
    const vehicle = new THREE.Group();
    model.scale.setScalar(scale); model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    vehicle.add(model); vehicle.rotation.y = Math.PI;
    const wheelMeshes = []; const details = []; let steeringMesh = null; const seats = [];
    model.traverse(object => {
      if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      if (!object.isMesh) return;
      if (kind === 'geep' && object.name === 'Steering_Wheel') steeringMesh = object;
      if (kind === 'geep' && /^Seat_Driver/.test(object.name)) seats.push(object);
      if (kind === 'geep' ? /^Wheel(?:_\d+)?$/i.test(object.name) : /wheel-(front|back)-(left|right)/.test(object.name)) wheelMeshes.push(object);
      if (kind === 'geep' && /^Wheel_selection/i.test(object.name)) details.push(object);
    });
    // Normalize and reparent each wheel around its geometric axle, preserving
    // the imported model's transforms. Rim details follow the closest wheel.
    car.remove(driver, cabin.root);
    car.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
    car.clear(); car.add(vehicle); car.updateWorldMatrix(true, true); modelWheels = [];
    const wheelGroups = wheelMeshes.map(mesh => {
      const box = new THREE.Box3().setFromObject(mesh); const center = box.getCenter(new THREE.Vector3());
      const pivot = new THREE.Group(); pivot.position.copy(car.worldToLocal(center)); pivot.userData.baseY = pivot.position.y;
      const rolling = new THREE.Group(); pivot.add(rolling); pivot.userData.rolling = rolling;
      pivot.userData.radius = Math.max(.2, box.getSize(new THREE.Vector3()).y / 2);
      car.add(pivot); pivot.updateWorldMatrix(true, false);
      return { mesh, pivot };
    });
    for (const detail of details) {
      const center = car.worldToLocal(new THREE.Box3().setFromObject(detail).getCenter(new THREE.Vector3()));
      const closest = wheelGroups.reduce((best, item) => !best || item.pivot.position.distanceToSquared(center) < best.pivot.position.distanceToSquared(center) ? item : best, null);
      closest?.pivot.userData.rolling.attach(detail);
    }
    for (const {mesh, pivot} of wheelGroups) { pivot.userData.rolling.attach(mesh); modelWheels.push(pivot); }
    // Com as rodas já nos eixos, a carroceria (dezenas de peças) é fundida por material.
    // O volante do modelo ganha um eixo próprio e informa à cabine onde ficam aro, olhos e banco.
    steeringPivot = null;
    if (steeringMesh) {
      const bounds = new THREE.Box3().setFromObject(steeringMesh), centre = car.worldToLocal(bounds.getCenter(new THREE.Vector3())), extent = bounds.getSize(new THREE.Vector3());
      const toCar = car.getWorldQuaternion(new THREE.Quaternion()).invert(), pose = steeringMesh.getWorldQuaternion(new THREE.Quaternion()).premultiply(toCar);
      const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(pose); steeringSign = normal.z < 0 ? -1 : 1; normal.multiplyScalar(steeringSign);
      steeringPivot = new THREE.Group(); steeringPivot.position.copy(centre); steeringPivot.quaternion.copy(pose); steeringRest.copy(pose);
      car.add(steeringPivot); steeringPivot.updateWorldMatrix(true, false); steeringPivot.attach(steeringMesh);
      const seat = seats.map(mesh => new THREE.Box3().setFromObject(mesh)).find(box => car.worldToLocal(box.getCenter(new THREE.Vector3())).x * centre.x > 0);
      cabin.attach({ centre, normal, radius: Math.max(extent.x, extent.y, extent.z) / 2 - .02, seatTop: seat ? car.worldToLocal(new THREE.Vector3(seat.min.x, seat.max.y, seat.min.z)).y : undefined });
      if (!pilotRig) driver.position.set(cabin.eye.x, cabin.eye.y - 2.35 * driver.scale.y, cabin.eye.z - .02);
    }
    bake(vehicle); car.add(driver, cabin.root);
    vehicleStatus.textContent = kind === 'geep' ? 'GEEP / SHABAEV / CC BY 4.0' : 'SUV KENNEY / CC0 · VEÍCULO ALTERNATIVO';
    vehicleStatus.dataset.loaded = 'true'; vehicleStatus.dataset.model = kind; vehicleStatus.dataset.wheels = String(modelWheels.length);
  }
  async function loadVehicle() {
    const loader = new GLTFLoader();
    const safe = gltf => { repairMaterials(gltf.scene); return gltf; };
    try { installVehicle(safe(await loadModelSafely(loader, './assets/models/gorillaz-geep.glb')), 'geep'); }
    catch (error) {
      console.warn('Geep indisponível; tentando o SUV local:', error.message);
      try { installVehicle(safe(await loadModelSafely(loader, './assets/models/kenney-suv.glb')), 'kenney'); }
      catch (fallbackError) {
        console.warn('SUV indisponível; veículo geométrico mantido:', fallbackError.message);
        vehicleStatus.textContent = 'VEÍCULO GEOMÉTRICO / MODO ALTERNATIVO'; vehicleStatus.dataset.loaded = 'false';
      }
    }
  }
  loadVehicle();
  const { people, stageSpeakers } = stages;
  const { discoveryObjects, streetProps, fauna, arcadeCabinet } = props;
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  let dragging = null; let dragAngle = 0; let dragElevation = 0; let zoom = 1; let moved = false;
  renderer.domElement.style.cursor = 'grab';
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', 'Mundo aberto 3D. W e S aceleram e freiam; A e D viram. E explora lugares próximos. Arraste para olhar ao redor. As histórias também estão disponíveis no diário.');
  let yaw = 0, pitch = 0, smoothYaw = 0, smoothPitch = 0, interacting = false, steeringDrag = false;
  let sensitivity = 1, motion = 1, highlighted = null;
  function hitAt(event, objects) {
    const bounds = renderer.domElement.getBoundingClientRect();
    pointer.set((event.clientX-bounds.left)/bounds.width*2-1,1-(event.clientY-bounds.top)/bounds.height*2);
    raycaster.setFromCamera(pointer,camera);
    return raycaster.intersectObjects(objects,true)[0]?.object;
  }
  const live = { vehicle: null, showcase: true, nearby: null, reduced: false }; let hoverAt = 0;
  let driverHovered=false, driverPointerStart=null, driverDragged=false;
  function actionAt(event) {
    if (cameraState.firstPerson || cameraState.overview || !live.vehicle) return null;
    const slow = Math.abs(live.vehicle.speed) < 2;
    if (!live.reduced && Math.abs(live.vehicle.speed)<=.05 && driver.visible && hitAt(event,[driver])) return {type:'driver'};
    if (live.nearby?.type === 'discovery' && slow && hitAt(event, [discoveryObjects[live.nearby.index].group])) return { type: 'discovery' };
    const member = hitAt(event, people.filter(actor => actor.group.position.distanceTo(camera.position) < 60).map(actor => actor.group))?.userData.member;
    if (member === undefined) return null;
    const spot = MEMBER_LOCATIONS[member];
    return live.showcase || slow && Math.hypot(spot.x - live.vehicle.x, spot.z - live.vehicle.z) < 13 ? { type: 'member', index: member } : null;
  }
  function highlight(object) {
    if (highlighted) highlighted.material.color.set(0xffffff);
    highlighted = object;
    if (object) object.material.color.set(0xa2ff7c);
  }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    moved = false;
    driverPointerStart={x:event.clientX,y:event.clientY}; driverDragged=false; driverHovered=true; driverReaction.cancel();
    if (cameraState.firstPerson && interacting) return;
    steeringDrag = cameraState.firstPerson && Boolean(hitAt(event,[cabin.wheel]));
    dragging = {x:event.clientX, y:event.clientY, origin:event.clientX};
    renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.style.cursor = 'grabbing';
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (driverPointerStart && Math.hypot(event.clientX-driverPointerStart.x,event.clientY-driverPointerStart.y)>4) driverDragged=true;
    if (cameraState.firstPerson && interacting) {
      const hit = hitAt(event,cabin.controls); highlight(hit);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'default'; return;
    }
    if (!dragging) {
      // Mão de arrastar por padrão; o cursor de ação só aparece onde um clique faria algo agora.
      if (event.timeStamp - hoverAt > 100) {
        hoverAt = event.timeStamp; const action=actionAt(event), overDriver=event.buttons===0 && action?.type==='driver';
        if (overDriver && !driverHovered && event.pointerType==='mouse') driverReaction.trigger(performance.now()/1000,live.vehicle.speed,live.reduced);
        driverHovered=overDriver; renderer.domElement.style.cursor=action?'pointer':'grab';
      }
      return;
    }
    const dx = event.clientX - dragging.x; const dy = event.clientY - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    if (cameraState.firstPerson) {
      if (steeringDrag) onSteer(THREE.MathUtils.clamp((dragging.origin-event.clientX)/80,-1,1));
      else {
        yaw = THREE.MathUtils.clamp(yaw-dx*.005*sensitivity,-1.35,1.35);
        pitch = THREE.MathUtils.clamp(pitch-dy*.005*sensitivity,-.84,.48);
      }
      dragging.x = event.clientX; dragging.y = event.clientY; return;
    }
    dragAngle -= dx * .006; dragElevation = THREE.MathUtils.clamp(dragElevation + dy * .035, -3, 14);
    dragging = {x:event.clientX, y:event.clientY};
  });
  function release() { if (steeringDrag) onSteer(0); steeringDrag = false; dragging = null; renderer.domElement.style.cursor = 'grab'; }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) renderer.domElement.addEventListener(event, release);
  renderer.domElement.addEventListener('pointerleave', () => { driverHovered=false; });
  renderer.domElement.addEventListener('pointercancel', () => { driverPointerStart=null; driverDragged=true; driverReaction.cancel(); });
  renderer.domElement.addEventListener('click', event => {
    driverPointerStart=null;
    if (cameraState.firstPerson) {
      if (interacting) { const action = hitAt(event,cabin.controls)?.userData.action; if (action) { cabin.pressKey(action); onRadio(action); } }
      return;
    }
    if (moved) return;
    // Clicar na peça de uma descoberta próxima equivale ao botão Explorar (mesmas regras de distância e velocidade).
    const action=actionAt(event);
    if (action?.type==='driver') { if (!driverDragged) driverReaction.trigger(performance.now()/1000,live.vehicle.speed,live.reduced); return; }
    if (action?.type === 'discovery') { onExplore(); return; }
    const hit = hitAt(event, people.filter(actor => actor.group.position.distanceTo(camera.position) < 60).map(actor => actor.group));
    if (hit) onMember(hit.userData.member);
  });
  // Duplo clique alterna a tela cheia, menos enquanto se aperta as teclas do rádio na cabine.
  renderer.domElement.addEventListener('dblclick', event => { if (cameraState.firstPerson && interacting) return; event.preventDefault(); onFullscreen(); });
  renderer.domElement.addEventListener('keydown', event => {
    if (event.key === 'Home') { dragAngle = 0; dragElevation = 0; zoom = 1; cameraState.reset(); onViewReset(); event.preventDefault(); }
  });
  function resize() {
    const width = container.clientWidth; const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  let previousDistance = 0;
  let headYaw = 0; // giro de cabeça em 1ª pessoa (rad), controlado pelo passeio guiado
  const look = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  let poseView = null; // depuração de pose: null no uso normal
  let bandFinale = false; // encerramento do passeio com os 4 integrantes reunidos
  let previousTime = null; let initialized = false;
  const skyLook = { stopped: 0, amount: 0 }; let skyLookHeld = false;
  let impact = 0, intro = false; const upAxis = new THREE.Vector3(0, 1, 0);
  const travelCamera = createTravelCamera(DEFAULT_BLOCKERS);
  let pace = 0, paceCheck = null, raiseAfter = 0, raiseBackoff = 4, lastRaise = -Infinity, slowAtFloor = 0, slowWindows = 0, fastWindows = 0;
  function adapt(dt, t) {
    if (qualityMode !== 'auto') return;
    if (dt <= 0) return;
    if (paceCheck === null) paceCheck = t + 4;
    if (t < paceCheck) return;
    const budget = compact ? 1 / 30 : 1 / 60;
    pace = pace ? pace + (dt - pace) * .06 : dt;
    if (t - paceCheck < 3) return; paceCheck = t;
    slowWindows = pace > budget * 1.3 ? slowWindows + 1 : 0;
    fastWindows = pace < budget * 1.08 ? fastWindows + 1 : 0;
    let next = pixelRatio;
    if (slowWindows >= 2) {
      slowWindows = 0;
      next = Math.max(minRatio, pixelRatio * .85);
      if (t - lastRaise < 4) raiseBackoff = Math.min(60, raiseBackoff * 2);
      raiseAfter = t + raiseBackoff;
      slowAtFloor = next === pixelRatio ? slowAtFloor + 1 : 0;
      if (slowAtFloor >= 3 && lighting.hasPostFX()) lighting.disablePostFX();
    } else if (fastWindows >= 3 && pixelRatio < maxRatio && t > raiseAfter) { next = Math.min(maxRatio, pixelRatio * 1.1); lastRaise = t; slowAtFloor = 0; fastWindows = 0; }
    if (next !== pixelRatio) { pixelRatio = next; renderer.setPixelRatio(pixelRatio); pace = 0; renderer.domElement.dataset.pixelRatio = pixelRatio.toFixed(2); }
  }
  return {
    setQuality(mode) {
      const config = qualitySettings(mode, devicePixelRatio, fauna.flock.length, FX_COUNT);
      qualityMode = config.name; pixelRatio = config.pixelRatio;
      props.applyQuality(config, live.vehicle?.x ?? 0, live.vehicle?.z ?? 0);
      renderer.setPixelRatio(pixelRatio);
      renderer.shadowMap.enabled = config.shadows;
      camera.far = config.far; camera.updateProjectionMatrix();
      renderer.domElement.dataset.pixelRatio = pixelRatio.toFixed(2);
      pace = 0; paceCheck = null; slowWindows = fastWindows = 0;
    },
    // Usado por ?perf e pelos scripts de medição.
    // Depuração de pose: enquadra um integrante de perto (front = -1 usa a frente do modelo). clearPose volta à câmera normal.
    framePerson(index, { front = -1, distance = 3.2, height = 1.3, target = 1.05, angle = 0 } = {}) {
      const group = people[index].group; group.updateMatrixWorld(true);
      poseView = { eye: group.localToWorld(new THREE.Vector3(distance * Math.sin(angle), height, front * distance * Math.cos(angle))), target: group.localToWorld(new THREE.Vector3(0, target, 0)) };
    },
    // Depuração: caixa de um integrante no mundo (min/max) e a frente do modelo (direção no plano XZ).
    personBounds(index) {
      const group = people[index].group; group.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(group);
      const parts = []; group.traverse(object => { if (object.isMesh && parts.length < 40) { const b = new THREE.Box3().setFromObject(object); parts.push({ name: object.name, min: b.min.toArray().map(v => +v.toFixed(2)), max: b.max.toArray().map(v => +v.toFixed(2)) }); } });
      return { min: box.min.toArray(), max: box.max.toArray(), parts };
    },
    // Depuração: câmera em coordenadas explícitas (olho e alvo).
    frameAt(eye, target) { poseView = { eye: new THREE.Vector3(...eye), target: new THREE.Vector3(...target) }; },
    clearPose() { poseView = null; },
    setBandFinale(value) { bandFinale = Boolean(value); },
    // Depuração: câmera presa a um ponto do mundo, a `distance` na direção `dir` (x, z), olhando para ele.
    frameSpot({ x, z, dirX = 1, dirZ = 0, distance = 4, height = 2, target = 2, alpha = 1 }) { poseView = { eye: new THREE.Vector3(x + dirX * distance, height, z + dirZ * distance), target: new THREE.Vector3(x, target, z), alpha }; },
    // Mãos de um integrante em coordenadas de mundo (depuração de pose).
    handsOf(index) { const rig = people[index]?.rig; if (!rig) return null; rig.visual.updateMatrixWorld(true); return rig.hands().map(hand => rig.visual.localToWorld(hand)); },
    debug: { renderer, scene, camera, vehicleMotion, cabin, streetProps, fauna, arcadeCabinet, stageSpeakers, get steeringPivot() { return steeringPivot; }, get pilotRig() { return pilotRig; }, setSize(width, height) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } },
    setOverview(value) { cameraState.setMode(value ? 'world' : 'follow'); travelCamera.resync(); },
    // Abertura: câmera mais baixa e deslocada, para o Geep e a banda ficarem no terço direito e o título respirar.
    setIntro(value) {
      intro = value;
      if (!value) {
        props.loadSceneryLazy();
        stages.loadStageSpeakers();
      }
    },
    captureView() { return { camera: cameraState.save(), firstPerson: cameraState.firstPerson, overview: cameraState.overview, landmarkView: cameraState.landmarkView, yaw, pitch, smoothYaw, smoothPitch, dragAngle, dragElevation, zoom, skyStopped: skyLook.stopped, skyAmount: skyLook.amount }; },
    restoreView(view) {
      if (!view) return;
      if (view.camera) cameraState.restore(view.camera);
      else cameraState.setMode(view.firstPerson ? 'cockpit' : view.overview ? 'world' : view.landmarkView ? 'windmill' : 'follow');
      ({ yaw, pitch, smoothYaw, smoothPitch, dragAngle, dragElevation, zoom } = view);
      skyLook.stopped = view.skyStopped ?? 0; skyLook.amount = view.skyAmount ?? 0; skyLookHeld = false;
      interacting = false; highlight(null); release(); initialized = false; travelCamera.resync();
    },
    syncCameraState() { if (!cameraState.firstPerson) { interacting = false; highlight(null); release(); } travelCamera.resync(); },
    setSkyLook(value) { skyLookHeld = Boolean(value); },
    setInteraction(value) { interacting = cameraState.firstPerson && value; highlight(null); release(); },
    recenter() { yaw = pitch = 0; },
    configureLook(gain, intensity) { sensitivity = gain; motion = intensity; },
    setHeadYaw(value) { headYaw = Math.max(-.62, Math.min(.62, Number(value) || 0)); },
    setFirstPerson(value) { interacting = false; yaw = pitch = smoothYaw = smoothPitch = 0; highlight(null); release(); cameraState.setMode(value ? 'cockpit' : 'follow'); initialized = false; travelCamera.resync(); },
    focusWindmill(value) { cameraState.setMode(value ? 'windmill' : 'follow'); travelCamera.resync(); },
    zoomBy(amount) { zoom = THREE.MathUtils.clamp(zoom + amount, .7, 1.6); },
    resetCamera() { dragAngle = 0; dragElevation = 0; zoom = 1; cameraState.reset(); travelCamera.resync(); },
    update(vehicle, time, orbit, reduced, showcase, known, nearby) {
      const firstPerson = cameraState.firstPerson, overview = cameraState.overview, landmarkView = cameraState.landmarkView;
      live.vehicle = vehicle; live.showcase = showcase; live.nearby = nearby; live.reduced = reduced;
      const { x, z, heading } = vehicle; const t = time / 1000;
      const dt = previousTime === null ? .016 : clampFrameDelta((time - previousTime) / 1000); previousTime = time;
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 4);
      lighting.update(vehicle, dt, t, blend, reduced, { overview, landmarkView });
      adapt(dt, t);
      updateVehicleMotion(vehicleMotion, vehicle, dt, reduced);
      car.position.set(x, vehicleMotion.height, z);
      car.rotation.y = heading;
      car.rotation.z = vehicleMotion.roll;
      car.rotation.x = vehicleMotion.pitch;
      const travelled = vehicle.distanceTravelled - previousDistance;
      modelWheels.forEach(wheel => {
        wheel.userData.rolling.rotation.x -= travelled / wheel.userData.radius;
        wheel.rotation.y = wheel.position.z < 0 ? vehicle.steering : 0;
        wheel.position.y = wheel.userData.baseY - (vehicleMotion.height + wheel.position.x * vehicleMotion.roll - wheel.position.z * vehicleMotion.pitch);
      });
      if (!modelWheels.length) wheels.forEach(wheel => { wheel.rotation.x -= travelled / .75; });
      previousDistance = vehicle.distanceTravelled;
      driverYaw = THREE.MathUtils.lerp(driverYaw, vehicle.steering * .9, blend);
      if (dragging) driverReaction.cancel();
      const greeting = driverReaction.sample(time / 1000, vehicle.speed, reduced);
      if (pilotRig) pilotRig.update(reduced ? 0 : dt, { yaw: driverYaw, steering: vehicle.steering, greeting });
      else {
        upperArmL.rotation.z = upperArmR.rotation.z = vehicle.steering * 1.1;
        driverHead.rotation.set(-.12 * greeting, driverYaw + .24 * greeting, 0);
      }
      const mobile = container.clientWidth < 700;
      travelCamera.compute(vehicle, { dt, t, zoom, dragAngle, dragElevation, orbit, reduced, showcase, mobile, intro, overview, landmarkView, desiredCamera, look });
      const skyAmount = advanceSkyLook(skyLook, dt, vehicle.speed, skyLookHeld, !firstPerson && !overview && !landmarkView && !showcase && !intro);
      if (skyAmount > 0) look.y += Math.hypot(look.x - desiredCamera.x, look.z - desiredCamera.z) * Math.tan(10 * Math.PI / 180) * skyAmount;
      cabin.root.visible = firstPerson; driver.visible = pilotRig ? true : !firstPerson;
      if (pilotRig) { pilotRig.setFirstPerson(firstPerson); cabin.setBoxArmsVisible(!firstPerson); }
      if (steeringPivot) steeringPivot.quaternion.copy(steeringRest).multiply(steeringTurn.setFromAxisAngle(upAxis, vehicleMotion.wheel * steeringSign));
      if (firstPerson) {
        car.updateMatrixWorld(true);
        desiredCamera.copy(cabin.eye).applyMatrix4(car.matrixWorld);
        cabinFrame.setFromEuler(cabinEuler.set(car.rotation.x * motion, heading, car.rotation.z * motion, car.rotation.order));
        smoothYaw = THREE.MathUtils.lerp(smoothYaw, interacting ? -.63 : yaw + headYaw, blend);
        smoothPitch = THREE.MathUtils.lerp(smoothPitch, interacting ? -.54 : pitch - .33, blend);
        look.set(-Math.sin(smoothYaw) * Math.cos(smoothPitch), Math.sin(smoothPitch), -Math.cos(smoothYaw) * Math.cos(smoothPitch)).applyQuaternion(cabinFrame).add(desiredCamera);
        cabin.update(vehicle, radio.read(), { interacting, dt, t, reduced, turn: vehicleMotion.wheel });
        if (pilotRig) pilotRig.reach(cabin.hands, car);
      }
      const targetFov = firstPerson ? (camera.aspect < 1 ? 88 : 75) : overview || landmarkView ? 46 : TRAVEL_FOV;
      camera.near = firstPerson ? .08 : overview ? Math.max(.5, Math.min(20, (camera.position.y - 50) * .1)) : .5;
      camera.fov = THREE.MathUtils.lerp(camera.fov, targetFov, blend); camera.updateProjectionMatrix();
      updateEraArt(vehicle);
      stages.updateStageArt(vehicle);
      props.updateFrame({ vehicle, camera, dt, t, reduced, showcase, known, nearby, qualityMode, frameCount });
      if (!firstPerson && !overview && !landmarkView) { travelCamera.follow(camera.position, cameraTarget, { desiredCamera, look, pivot: vehicle, dt, blend, snap: !initialized || reduced }); initialized = true; }
      else if (!initialized || reduced || firstPerson) { camera.position.copy(desiredCamera); cameraTarget.copy(look); initialized = true; }
      else { camera.position.lerp(desiredCamera, blend); cameraTarget.lerp(look, blend); }
      camera.lookAt(cameraTarget);
      if (poseView) {
        const alpha = poseView.alpha ?? 1;
        if (alpha >= 1) { camera.position.copy(poseView.eye); camera.lookAt(poseView.target); }
        else { camera.position.lerp(poseView.eye, alpha); cameraTarget.lerp(poseView.target, alpha); camera.lookAt(cameraTarget); }
      }
      if (impact > .01) { camera.rotateZ(Math.sin(t * 58) * impact * .022); camera.rotateX(Math.sin(t * 47) * impact * .012); impact *= Math.exp(-5 * dt); }
      stages.updateLunar(camera);
      if (frameCount++ % (lighting.lightProfile && overview ? 4 : 2) === 0) lighting.aimSun(x, z);
      cardTint.copy(lighting.sunlight.color).lerp(lighting.skylight.color, .45);
      for (const entry of heavyCasters) {
        const casting = Math.hypot(entry.at.x - x, entry.at.z - z) < 55 && !(lighting.lightProfile && overview);
        if (casting !== entry.casting) { entry.casting = casting; for (const mesh of entry.meshes) mesh.castShadow = casting; }
        const range = Math.hypot(entry.at.x - camera.position.x, entry.at.z - camera.position.z);
        const far = !overview && range > (entry.far ? 78 : 88);
        if (far !== entry.far) { entry.far = far; entry.object.visible = !far; entry.card.visible = far; }
        if (far) {
          entry.card.position.set(entry.at.x, (entry.at.y || 0) + entry.card.userData.lift, entry.at.z);
          entry.card.rotation.y = Math.atan2(camera.position.x - entry.at.x, camera.position.z - entry.at.z);
          entry.card.material.color.copy(cardTint);
        }
      }
      stages.updatePeople({ vehicle, camera, dt, t, reduced, showcase, bandFinale, onImpact: v => { impact = v; } });
      renderer.info.reset();
      if (firstPerson) { const showDriver = driver.visible; driver.visible = false; cabin.renderMirror(renderer, scene); driver.visible = showDriver; }
      lighting.renderFrame(camera);
      renderer.domElement.dataset.triangles = String(renderer.info.render.triangles);
      renderer.domElement.dataset.drawCalls = String(renderer.info.render.calls);
    },
  };
}

