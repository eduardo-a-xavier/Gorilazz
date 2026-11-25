import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { CITY_LOTS, REGIONS, ROADS, distance, roadGap } from './world-data.js';
import { loadModelSafely, repairMaterials } from './model-safety.js';

export const PIGEON_GLB_URL = './assets/models/scenery/pigeon-01-animated.glb';

// Fauna urbana procedural (pombos e passarinhos) com InstancedMesh (2 draw calls no total:
// corpos e asas) e raio de ativação barato. Ficam em calçadas, praças e beirais de telhados
// baixos; bicam e olham ao redor em idle, levantam voo e se afastam quando o carro ou jogador
// chega perto e retornam ao pouso quando o caminho esvazia.

export const FAUNA_TUNING = Object.freeze({
  activationRadius: 58,
  fleeRadius: 13.5,
  safeRadius: 19,
  maxCount: 56,
});

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gera os pontos de pouso em praças, calçadas (fora da faixa de rolamento) e telhados baixos. */
export function createFaunaFlock(count = FAUNA_TUNING.maxCount) {
  const rng = seeded(20261126), birds = [];
  const addBird = (x, y, z, perch) => {
    if (birds.length >= count) return;
    const phase = rng() * Math.PI * 2, baseYaw = rng() * Math.PI * 2;
    const scale = (.86 + rng() * .32) * (perch === 'roof' ? 1.08 : 1);
    birds.push({
      id: birds.length,
      perch,
      home: { x, y, z },
      x, y, z,
      vx: 0, vy: 0, vz: 0,
      baseYaw, yaw: baseYaw, pitch: 0, roll: 0,
      wingAngle: 0,
      scale,
      phase,
      state: 'idle',
      timer: 0,
      active: true,
      paletteIndex: birds.length % 6,
    });
  };

  // 1) Bando próximo à saída de Kong Studios e nas 3 praças (sempre fora do asfalto).
  const plazaClusters = [
    { x: -9.5, z: -14.5, r: 2.4, n: 6 },
    { x: 9.2, z: -18.5, r: 2.2, n: 5 },
    { x: REGIONS[0].x - 11.5, z: REGIONS[0].z + 8.5, r: 2.8, n: 5 },
    { x: REGIONS[1].x + 10.5, z: REGIONS[1].z - 9.5, r: 2.8, n: 5 },
    { x: REGIONS[2].x - 10.0, z: REGIONS[2].z + 9.0, r: 2.8, n: 5 },
  ];
  for (const cluster of plazaClusters) {
    for (let k = 0; k < cluster.n; k++) {
      const a = (k / cluster.n) * Math.PI * 2 + rng() * .5, d = .6 + rng() * cluster.r;
      const x = cluster.x + Math.cos(a) * d, z = cluster.z + Math.sin(a) * d;
      if (roadGap({ x, z }) >= 1.1) addBird(x, 0, z, 'plaza');
    }
  }

  // 2) Calçadas ao longo das ruas principais (folga de 1,3 m a 3,2 m da borda do asfalto).
  for (let r = 0; r < ROADS.length && birds.length < count - 14; r++) {
    const road = ROADS[r];
    for (const sampleIndex of [18, 42, 64]) {
      const a = road.samples[sampleIndex], b = road.samples[Math.min(road.samples.length - 1, sampleIndex + 1)];
      const len = Math.hypot(b.x - a.x, b.z - a.z) || 1, nx = (b.z - a.z) / len, nz = -(b.x - a.x) / len;
      const side = (r + sampleIndex) % 2 ? 1 : -1;
      const offset = road.width / 2 + 1.8 + rng() * 1.1;
      const cx = a.x + nx * side * offset, cz = a.z + nz * side * offset;
      if (roadGap({ x: cx, z: cz }) < 1.2) continue;
      const flockSize = 2 + (r % 2);
      for (let k = 0; k < flockSize && birds.length < count - 14; k++) {
        const bx = cx + (rng() - .5) * 1.6, bz = cz + (rng() - .5) * 1.6;
        if (roadGap({ x: bx, z: bz }) >= 1.1) addBird(bx, 0, bz, 'sidewalk');
      }
    }
  }

  // 3) Beirais de telhados baixos (2 a 4 andares) voltados para a rua.
  const lowLots = CITY_LOTS.filter(lot => !lot.landmark && lot.floors >= 2 && lot.floors <= 4);
  for (let i = 0; i < lowLots.length && birds.length < count; i += 2) {
    const lot = lowLots[i], c = Math.cos(lot.rotation), s = Math.sin(lot.rotation);
    const roofY = lot.floors * 3.2 + .52;
    for (const u of [-lot.w * .25, lot.w * .25]) {
      if (birds.length >= count) break;
      const v = lot.d / 2 - .35;
      addBird(lot.x + u * c + v * s, roofY, lot.z - u * s + v * c, 'roof');
    }
  }
  return birds;
}

/**
 * Atualiza o estado das aves por quadro.
 * `actor` é o veículo/jogador ({ x, z, speed }); `focus` é um segundo ponto opcional (câmera).
 */
// Suavização 0→1 entre duas distâncias (sem dependência externa).
const THREE_SMOOTH = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
export function stepFaunaFlock(birds, actor, dt = .016, t = 0, reduced = false, focus = actor) {
  const { activationRadius, fleeRadius, safeRadius } = FAUNA_TUNING;
  const speedBonus = Math.min(4.5, Math.abs(actor?.speed || 0) * .22);
  const triggerDist = fleeRadius + speedBonus;
  let activeCount = 0, fleeingCount = 0;

  for (const bird of birds) {
    const distActor = Math.hypot(bird.x - (actor?.x ?? 999), bird.z - (actor?.z ?? 999));
    const distFocus = focus ? Math.hypot(bird.x - focus.x, bird.z - focus.z) : distActor;
    const near = Math.min(distActor, distFocus) <= activationRadius || bird.state !== 'idle';
    bird.active = near;
    if (!near) continue;
    activeCount++;

    // Gatilho de fuga: carro ou jogador se aproxima de aves no chão/calçada/praça ou telhado baixo.
    const verticalGap = bird.home.y;
    const canStartle = verticalGap < 8.5 && distActor < triggerDist * (verticalGap > 1 ? .72 : 1);
    if (canStartle && bird.state !== 'flee') {
      const awayX = bird.x - actor.x, awayZ = bird.z - actor.z, len = Math.hypot(awayX, awayZ) || 1;
      const scatter = ((bird.id % 5) - 2) * .28;
      const cos = Math.cos(scatter), sin = Math.sin(scatter);
      const dx = (awayX / len) * cos - (awayZ / len) * sin;
      const dz = (awayX / len) * sin + (awayZ / len) * cos;
      const speed = 7.8 + (bird.id % 4) * .85;
      bird.state = 'flee';
      bird.timer = 0;
      bird.vx = dx * speed;
      bird.vz = dz * speed;
      bird.vy = 4.4 + (bird.id % 3) * .75;
      bird.yaw = Math.atan2(-bird.vx, -bird.vz);
    }

    if (bird.state === 'idle') {
      bird.x = bird.home.x;
      bird.z = bird.home.z;
      if (reduced) {
        bird.y = bird.home.y;
        bird.pitch = 0;
        bird.roll = 0;
        bird.yaw = bird.baseYaw;
        bird.wingAngle = 0;
      } else {
        // Ciclo de bicar (inclina o corpo para a frente) alternado com olhar para os lados e pequenos pulos.
        // Alerta: ao se aproximar (antes do gatilho de fuga), o pombo para de bicar e vira a cabeça para o carro.
        const alert = THREE_SMOOTH(triggerDist * 1.9, triggerDist * 1.15, distActor);
        const cycle = Math.sin(t * 2.4 + bird.phase);
        const peckWave = (cycle > .45 ? Math.sin((cycle - .45) / .55 * Math.PI) : 0) * (1 - alert);
        const hopWave = cycle < -.65 ? Math.sin((-cycle - .65) / .35 * Math.PI) : 0;
        const toActor = actor ? Math.atan2(-(actor.x - bird.x), -(actor.z - bird.z)) : bird.baseYaw;
        const idleYaw = bird.baseYaw + Math.sin(t * 1.35 + bird.phase * 1.7) * (1 - peckWave) * .48;
        bird.pitch = -peckWave * .58;
        bird.y = bird.home.y + hopWave * .08 * (1 - alert);
        bird.yaw = alert > 0 ? idleYaw + (toActor - idleYaw) * alert : idleYaw;
        bird.roll = Math.sin(t * 3.1 + bird.phase) * .04;
        bird.wingAngle = peckWave * .08;
      }
    } else if (bird.state === 'flee') {
      fleeingCount++;
      bird.timer += dt;
      const step = reduced ? Math.max(dt, .016) : dt;
      bird.x += bird.vx * step;
      bird.z += bird.vz * step;
      bird.y += bird.vy * step;
      // Sobe até ~6–9 m acima do pouso e depois nivela em voo circular suave.
      const ceiling = bird.home.y + 6.5 + (bird.id % 3) * 1.2;
      if (bird.y >= ceiling) {
        bird.y = ceiling;
        bird.vy = Math.sin(t * 3 + bird.phase) * .4;
      } else {
        bird.vy = Math.max(.6, bird.vy - 1.2 * step);
      }
      // Curva leve no ar para não sair da ilha.
      const turn = .9 * step * (bird.id % 2 ? 1 : -1);
      const c = Math.cos(turn), s = Math.sin(turn);
      const vx = bird.vx * c - bird.vz * s, vz = bird.vx * s + bird.vz * c;
      bird.vx = vx; bird.vz = vz;
      bird.yaw = Math.atan2(-bird.vx, -bird.vz);
      bird.pitch = .22;
      bird.roll = (bird.id % 2 ? -.18 : .18);
      bird.wingAngle = reduced ? .35 : Math.sin(t * 28 + bird.phase) * .78;
      if (bird.timer > 2.2 && distActor > safeRadius) {
        bird.state = 'return';
        bird.timer = 0;
      }
    } else if (bird.state === 'return') {
      fleeingCount++;
      bird.timer += dt;
      const step = reduced ? Math.max(dt, .016) : dt;
      const dx = bird.home.x - bird.x, dy = bird.home.y - bird.y, dz = bird.home.z - bird.z;
      const distHome = Math.hypot(dx, dy, dz);
      if (distHome < .28) {
        bird.state = 'idle';
        bird.x = bird.home.x; bird.y = bird.home.y; bird.z = bird.home.z;
        bird.vx = bird.vy = bird.vz = 0;
        bird.pitch = bird.roll = bird.wingAngle = 0;
      } else {
        const speed = Math.min(8.2, Math.max(2.6, distHome * 1.4));
        bird.vx = (dx / distHome) * speed;
        bird.vy = (dy / distHome) * speed;
        bird.vz = (dz / distHome) * speed;
        bird.x += bird.vx * step;
        bird.y += bird.vy * step;
        bird.z += bird.vz * step;
        bird.yaw = Math.atan2(-bird.vx, -bird.vz);
        bird.pitch = -.12;
        bird.roll = 0;
        bird.wingAngle = reduced ? .2 : Math.sin(t * 22 + bird.phase) * .55;
      }
    }
  }
  return { activeCount, fleeingCount };
}

function createBirdGeometries() {
  // Corpo compacto orientado para -Z (frente), com peito, cabeça, bico e cauda fundidos numa única malha.
  const torso = new THREE.ConeGeometry(.14, .44, 7);
  torso.rotateX(-Math.PI / 2 - .22);
  torso.translate(0, .18, .02);
  const head = new THREE.IcosahedronGeometry(.095, 1);
  head.translate(0, .30, -.16);
  const neck = new THREE.CylinderGeometry(.075,.105,.16,7); neck.translate(0,.235,-.105);
  const beak = new THREE.ConeGeometry(.032, .11, 5);
  beak.rotateX(-Math.PI / 2);
  beak.translate(0, .29, -.27);
  const tail = new THREE.BoxGeometry(.14, .025, .18);
  tail.rotateX(.24);
  tail.translate(0, .14, .25);
  const bodyGeometry = mergeGeometries([torso, neck, head, beak, tail].map(g => g.index ? g.toNonIndexed() : g));

  // Par de asas simétricas com pivô no dorso: escalar/inclinar anima o bater de asas no voo.
  const wingL = new THREE.BoxGeometry(.32, .022, .18).toNonIndexed();
  wingL.rotateZ(-.12);
  wingL.translate(-.18, 0, -.02);
  const wingR = new THREE.BoxGeometry(.32, .022, .18).toNonIndexed();
  wingR.rotateZ(.12);
  wingR.translate(.18, 0, -.02);
  const wingGeometry = mergeGeometries([wingL, wingR]);
  return { bodyGeometry, wingGeometry };
}

const PALETTE = ['#8b99a8', '#6f7f8e', '#a9b4c0', '#c7bfb0', '#5e6d7a', '#dfd7c6'];

export function installFauna(scene, count = FAUNA_TUNING.maxCount) {
  const flock = createFaunaFlock(count);
  const { bodyGeometry, wingGeometry } = createBirdGeometries();
  const bodyMat = new THREE.MeshStandardMaterial({ roughness: .82, metalness: .04 });
  const wingMat = new THREE.MeshStandardMaterial({ roughness: .78, metalness: .05 });
  const bodies = new THREE.InstancedMesh(bodyGeometry, bodyMat, flock.length);
  const wings = new THREE.InstancedMesh(wingGeometry, wingMat, flock.length);
  bodies.name = 'fauna-bodies';
  wings.name = 'fauna-wings';
  bodies.castShadow = false; bodies.receiveShadow = true;
  wings.castShadow = false; wings.receiveShadow = true;
  // Evita culling prematuro quando as aves se espalham pela cidade.
  bodies.frustumCulled = false;
  wings.frustumCulled = false;

  const color = new THREE.Color();
  const dummy = new THREE.Object3D();
  const wingDummy = new THREE.Object3D();

  function syncInstance(bird) {
    dummy.position.set(bird.x, bird.y, bird.z);
    dummy.rotation.set(bird.pitch, bird.yaw, bird.roll, 'YXZ');
    dummy.scale.setScalar(bird.scale);
    dummy.updateMatrix();
    bodies.setMatrixAt(bird.id, dummy.matrix);

    const flying = bird.state !== 'idle';
    const spread = flying ? 1 + Math.abs(bird.wingAngle) * .45 : .42;
    const flapY = flying ? 1 + bird.wingAngle * 1.6 : 1;
    wingDummy.position.set(bird.x, bird.y + .22 * bird.scale + (flying ? bird.wingAngle * .08 : 0), bird.z);
    wingDummy.rotation.set(bird.pitch + (flying ? bird.wingAngle * .55 : 0), bird.yaw, bird.roll, 'YXZ');
    wingDummy.scale.set(bird.scale * spread, bird.scale * flapY, bird.scale);
    wingDummy.updateMatrix();
    wings.setMatrixAt(bird.id, wingDummy.matrix);
  }

  for (const bird of flock) {
    color.set(PALETTE[bird.paletteIndex]);
    bodies.setColorAt(bird.id, color);
    wings.setColorAt(bird.id, color.clone().offsetHSL(0, 0, -.06));
    syncInstance(bird);
  }
  bodies.instanceMatrix.needsUpdate = true;
  wings.instanceMatrix.needsUpdate = true;
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  if (wings.instanceColor) wings.instanceColor.needsUpdate = true;
  scene.add(bodies, wings);

  let pigeonLoaded = false;
  function loadPigeonModel(loader = new GLTFLoader()) {
    if (pigeonLoaded) return Promise.resolve(true);
    return loadModelSafely(loader, PIGEON_GLB_URL).then(gltf => {
      repairMaterials(gltf.scene);
      gltf.scene.updateMatrixWorld(true);
      const bodyParts = [], wingParts = [];
      gltf.scene.traverse(obj => {
        if (!obj.isMesh || !obj.geometry) return;
        const g = (obj.geometry.index ? obj.geometry.toNonIndexed() : obj.geometry.clone()).applyMatrix4(obj.matrixWorld);
        // O GLB do pombo aponta para +Z; giramos 180° em Y para alinhar com -Z de syncInstance
        g.rotateY(Math.PI);
        if (/^wing_/i.test(obj.name)) {
          g.translate(0, -.22, 0);
          wingParts.push(g);
        } else {
          bodyParts.push(g);
        }
      });
      if (!bodyParts.length || !wingParts.length) throw new Error('Malhas do pombo incompletas');
      const newBodyGeo = mergeGeometries(bodyParts);
      const newWingGeo = mergeGeometries(wingParts);
      bodies.geometry.dispose();
      wings.geometry.dispose();
      bodies.geometry = newBodyGeo;
      wings.geometry = newWingGeo;
      if (newBodyGeo.attributes.color) { bodyMat.vertexColors = true; bodyMat.needsUpdate = true; }
      if (newWingGeo.attributes.color) { wingMat.vertexColors = true; wingMat.needsUpdate = true; }
      bodies.userData.glbLoaded = true;
      pigeonLoaded = true;
      return true;
    }).catch(err => {
      console.warn('Pombo GLB indisponível; mantendo procedural:', err.message);
      return false;
    });
  }

  return {
    flock,
    bodies,
    wings,
    loadPigeonModel,
    update(vehicle, cameraPosition, dt, t, reduced) {
      const stats = stepFaunaFlock(flock, vehicle, dt, t, reduced, cameraPosition);
      if (stats.activeCount > 0) {
        for (const bird of flock) if (bird.active) syncInstance(bird);
        bodies.instanceMatrix.needsUpdate = true;
        wings.instanceMatrix.needsUpdate = true;
      }
      return stats;
    },
  };
}
