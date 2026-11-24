import * as THREE from './vendor/three.module.min.js';

// Cadeia de carregamento: v5 (mão fechada e lisa) -> v4 (malha suavizada) -> v2 -> original.
export const PILOT_MODEL_URL = './assets/models/driver-pilot-v6.glb';
export const PILOT_V5_URL = './assets/models/driver-pilot-v5.glb';
export const PILOT_V4_URL = './assets/models/driver-pilot-v4.glb';
export const PILOT_V2_URL = './assets/models/driver-pilot-v2.glb';
export const PILOT_FALLBACK_URL = './assets/models/driver-pilot.glb';

// Esqueleto do piloto GLB: restauramos a pose base animada antes do AnimationMixer avançar o
// Driving_Loop (pois o PropertyMixer do Three.js só regrava o quaternion quando o canal muda de
// valor), capturamos a nova pose base e somamos as rotações reativas de direção e aceno nos ossos reais.
const AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0), AZ = new THREE.Vector3(0, 0, 1);
const BONES = { head: 'Head', spine: 'spine_02', armL: 'upperarm_l', armR: 'upperarm_r', foreL: 'lowerarm_l', foreR: 'lowerarm_r', handL: 'hand_l', handR: 'hand_r' };
// Em primeira pessoa, mantemos visíveis apenas os triângulos dos braços, punhos e luvas/dedos
// (gloves_mesh* + mangas em Sphere005_Retopology004_2 + mãos/dedos em Sphere005_Retopology004_3),
// removendo cabeça, gola, tronco e pernas do índice de desenho em 1ª pessoa.
const isPilotArmMesh = object =>
  /^gloves(_mesh(_\d+)?)?$/.test(object.name) ||
  /^gloves$/.test(object.parent?.name) ||
  /^Sphere\.?005_Retopology\.?004_[23]$/.test(object.name);
const ARM_BONE_RE = /^(upperarm|lowerarm|hand|thumb|index|middle|ring|pinky)_/i;
const HAND_BONE_RE = /^(hand|thumb|index|middle|ring|pinky)_/i;

function buildArmOnlyIndex(mesh, splitHand = false) {
  const index = mesh.geometry?.index, sIdx = mesh.geometry?.attributes?.skinIndex, sW = mesh.geometry?.attributes?.skinWeight;
  const bones = mesh.skeleton?.bones;
  if (!index || !sIdx || !sW || !bones) return { attr: index, sleeveCount: index?.count ?? 0, handCount: 0 };
  const classify = v => {
    let armW = 0, handW = 0;
    for (let k = 0; k < 4; k++) {
      const w = sW.getComponent(v, k);
      if (w <= .01) continue;
      const name = bones[sIdx.getComponent(v, k)]?.name || '';
      if (ARM_BONE_RE.test(name)) armW += w;
      if (HAND_BONE_RE.test(name)) handW += w;
    }
    return { isArm: armW >= .45, isHand: handW >= .35 };
  };
  const sleeve = [], hand = [];
  for (let i = 0; i < index.count; i += 3) {
    const a = index.getX(i), b = index.getX(i + 1), c = index.getX(i + 2);
    const ca = classify(a), cb = classify(b), cc = classify(c);
    if (!ca.isArm || !cb.isArm || !cc.isArm) continue;
    if (splitHand && ca.isHand && cb.isHand && cc.isHand) hand.push(a, b, c);
    else sleeve.push(a, b, c);
  }
  return {
    attr: new THREE.Uint16BufferAttribute([...sleeve, ...hand], 1),
    sleeveCount: sleeve.length,
    handCount: hand.length,
  };
}

/**
 * Sombreamento suave das mãos e mangas: vértices de mesma posição (costuras de UV e arestas duras do low-poly)
 * passam a dividir a mesma normal, ponderada pelo ângulo de cada face. Não muda a topologia nem o esqueleto.
 */
export function smoothNormals(geometry) {
  const pos = geometry?.attributes?.position, index = geometry?.index;
  if (!pos || !index) return false;
  const key = i => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const acc = new Map(), keys = new Array(pos.count);
  for (let i = 0; i < pos.count; i++) { keys[i] = key(i); if (!acc.has(keys[i])) acc.set(keys[i], [0, 0, 0]); }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3(), n = new THREE.Vector3();
  for (let t = 0; t < index.count; t += 3) {
    const ia = index.getX(t), ib = index.getX(t + 1), ic = index.getX(t + 2);
    a.fromBufferAttribute(pos, ia); b.fromBufferAttribute(pos, ib); c.fromBufferAttribute(pos, ic);
    n.crossVectors(e1.subVectors(b, a), e2.subVectors(c, a));
    if (n.lengthSq() < 1e-14) continue;
    n.normalize();
    for (const [i, p, q1, q2] of [[ia, a, b, c], [ib, b, c, a], [ic, c, a, b]]) {
      e1.subVectors(q1, p).normalize(); e2.subVectors(q2, p).normalize();
      const w = Math.acos(THREE.MathUtils.clamp(e1.dot(e2), -1, 1)), s = acc.get(keys[i]);
      s[0] += n.x * w; s[1] += n.y * w; s[2] += n.z * w;
    }
  }
  const normals = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const s = acc.get(keys[i]), len = Math.hypot(s[0], s[1], s[2]) || 1;
    normals[i * 3] = s[0] / len; normals[i * 3 + 1] = s[1] / len; normals[i * 3 + 2] = s[2] / len;
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return true;
}

const v = () => new THREE.Vector3(), q = () => new THREE.Quaternion();
const sPos = v(), ePos = v(), wPos = v(), dirV = v(), toE = v(), hint = v(), aimFrom = v(), aimTo = v(), goal = v();
const qWorld = q(), qDelta = q(), qParent = q(), qCar = q(), wrist = v();
const PALM = .015; // distância pulso → aro do volante (m, escala do carro)

/** Gira `bone` para que o vetor `from` (mundo) passe a apontar para `to` (mundo), mantendo o resto da hierarquia. */
function aim(bone, from, to) {
  if (from.lengthSq() < 1e-10 || to.lengthSq() < 1e-10) return;
  qDelta.setFromUnitVectors(from.normalize(), to.normalize());
  bone.getWorldQuaternion(qWorld).premultiply(qDelta);
  bone.parent.getWorldQuaternion(qParent);
  bone.quaternion.copy(qParent.invert().multiply(qWorld));
  bone.updateMatrixWorld(true);
}

/**
 * Cinemática inversa de dois ossos (braço→antebraço→mão) em espaço de mundo.
 * `target` é onde o pulso deve ficar; `outward` (+1 direita, −1 esquerda) empurra o cotovelo para baixo e para fora.
 */
export function solveArm(upper, fore, hand, target, outward, carQuaternion) {
  upper.getWorldPosition(sPos); fore.getWorldPosition(ePos); hand.getWorldPosition(wPos);
  const l1 = sPos.distanceTo(ePos), l2 = ePos.distanceTo(wPos);
  dirV.subVectors(target, sPos);
  const d = THREE.MathUtils.clamp(dirV.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  dirV.normalize();
  goal.copy(sPos).addScaledVector(dirV, d);
  const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), bend = Math.sqrt(Math.max(0, l1 * l1 - along * along));
  hint.set(outward * .55, -.7, .25).applyQuaternion(carQuaternion);
  hint.addScaledVector(dirV, -hint.dot(dirV)).normalize();
  toE.copy(sPos).addScaledVector(dirV, along).addScaledVector(hint, bend);
  // Braço: aponta para o cotovelo calculado. Antebraço: do cotovelo (já movido) para o pulso-alvo.
  aim(upper, aimFrom.subVectors(ePos, sPos), aimTo.subVectors(toE, sPos));
  fore.getWorldPosition(ePos); hand.getWorldPosition(wPos);
  aim(fore, aimFrom.subVectors(wPos, ePos), aimTo.subVectors(goal, ePos));
}

export function createPilotRig(pilot, animations = [], { preposed = false } = {}) {
  const clip = THREE.AnimationClip.findByName(animations ?? [], 'Driving_Loop');
  const mixer = clip ? new THREE.AnimationMixer(pilot) : null;
  if (mixer) {
    mixer.clipAction(clip).play();
    // Primeiro quadro já na carga: sem T-pose com movimento reduzido ou antes do primeiro tick.
    mixer.setTime(0);
  }
  const entries = {};
  for (const [key, name] of Object.entries(BONES)) {
    const bone = pilot.getObjectByName(name);
    if (bone) entries[key] = { bone, base: bone.quaternion.clone() };
  }
  // O piloto v5 tem falanges ponderadas: os braços de bloco da cabine não movem esses dedos.
  const fingers = [];
  for (const side of ['l', 'r']) {
    for (const name of ['index', 'middle', 'ring', 'pinky', 'thumb']) {
      for (const joint of [1, 2, 3]) {
        const bone = pilot.getObjectByName(`${name}_0${joint}_${side}`);
        if (bone) fingers.push({ bone, base: bone.quaternion.clone(), thumb: name === 'thumb', joint });
      }
    }
  }
  const list = [...Object.values(entries), ...fingers], turn = new THREE.Quaternion();
  const hidden = [], jacket = [], trimmedMeshes = [];
  // Acabamento fosco unificado para mangas e luvas do piloto v2 (2.806 tris, pulsos soldados).
  const armMat = (color, emissive, emissiveIntensity = .18, roughness = .78) =>
    new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity, roughness, metalness: .02 });
  const sleeveMat = armMat('#4d7699', '#22384d', .2);
  const cuffMat = armMat('#f0a9c8', '#f2559c', .15, .72);
  const gauntletMat = armMat('#38546e', '#192938', .18);
  const gloveMat = armMat('#e6ddc6', '#57503f', .16);
  pilot.traverse(object => {
    if (!object.isMesh) return;
    if (isPilotArmMesh(object)) {
      jacket.push(object);
      smoothNormals(object.geometry); // normais soldadas: sombreamento suave
      if (/^gloves_mesh_1$/.test(object.name)) object.material = cuffMat;
      else if (/^gloves_mesh_2$/.test(object.name)) object.material = gauntletMat;
      else if (/^gloves_mesh$/.test(object.name)) object.material = gloveMat;
      else if (/^Sphere\.?005_Retopology\.?004_2$/.test(object.name)) {
        object.material = sleeveMat;
        object.userData.fullIndex = object.geometry.index;
        object.userData.armData = buildArmOnlyIndex(object, false);
        trimmedMeshes.push(object);
      } else if (/^Sphere\.?005_Retopology\.?004_3$/.test(object.name)) {
        object.userData.thirdPersonMaterial = object.material;
        object.userData.fullIndex = object.geometry.index;
        object.userData.armData = buildArmOnlyIndex(object, true);
        trimmedMeshes.push(object);
      }
    } else hidden.push(object);
  });
  let inside = false;
  function add(entry, axis, angle) {
    if (!entry || !angle) return;
    entry.bone.quaternion.multiply(turn.setFromAxisAngle(axis, angle));
  }
  function reachSide(side, upper, fore, hand, target, car) {
    dirV.copy(target); car.localToWorld(dirV);
    fore.bone.getWorldPosition(ePos); wrist.copy(dirV).sub(ePos).normalize().multiplyScalar(-PALM).add(dirV);
    solveArm(upper.bone, fore.bone, hand.bone, wrist, side, qCar);
  }
  return {
    mixer, entries, clip, hidden, jacket,
    /** Primeira pessoa: some o corpo/cabeça e ficam apenas os dois braços completos (mangas, punhos e luvas) com alto contraste. */
    setFirstPerson(value) {
      const next = Boolean(value);
      if (next !== inside) {
        inside = next;
        for (const mesh of hidden) mesh.visible = !inside;
        for (const mesh of trimmedMeshes) {
          const { attr, sleeveCount, handCount } = mesh.userData.armData;
          mesh.geometry.clearGroups();
          if (inside) {
            mesh.geometry.setIndex(attr);
            if (mesh.userData.thirdPersonMaterial) {
              mesh.geometry.addGroup(0, sleeveCount, 0);
              mesh.geometry.addGroup(sleeveCount, handCount, 1);
              mesh.material = [sleeveMat, gloveMat];
            }
          } else {
            mesh.geometry.setIndex(mesh.userData.fullIndex);
            if (mesh.userData.thirdPersonMaterial) mesh.material = mesh.userData.thirdPersonMaterial;
          }
        }
        pilot.position.set(-0.6213, inside ? 0.34 : 0.208, inside ? 0.18 : 0.4471);
      } else {
        for (const mesh of hidden) mesh.visible = !inside;
      }
    },
    /** `dt` vem zerado em movimento reduzido. `yaw` e `steering` seguem o veículo; `greeting` vai de 0 a 1. */
    update(dt, { yaw = 0, steering = 0, greeting = 0 } = {}) {
      for (const entry of list) entry.bone.quaternion.copy(entry.base);
      if (mixer) {
        mixer.update(dt);
        for (const entry of list) entry.base.copy(entry.bone.quaternion);
      }
      add(entries.head, AY, yaw * .5 + .2 * greeting); add(entries.head, AX, .14 * greeting);
      add(entries.spine, AY, yaw * .12);
      // Flexão discreta e estável no espaço local das falanges, sem torcer o punho.
      if (inside && !preposed) for (const finger of fingers) {
        const angle = finger.thumb ? (finger.joint === 1 ? .18 : .16) : (finger.joint === 1 ? .14 : .28);
        add(finger, AX, angle);
      }
      if (!inside) { add(entries.armL, AZ, -steering * .25); add(entries.armR, AZ, -steering * .25); }
    },
    /**
     * Primeira pessoa: leva os pulsos do piloto até as mãos da cabine (aro do volante, ou tecla do rádio).
     * `hands.left/right` são Vector3 em espaço do carro; `car` é o Object3D pai do piloto.
     * Chamar depois de update() e de car.updateMatrixWorld().
     */
    reach(hands, car) {
      const { armL, foreL, handL, armR, foreR, handR } = entries;
      if (!armL || !foreL || !handL || !armR || !foreR || !handR) return false;
      if (inside) {
        const radioReach = THREE.MathUtils.clamp((hands.right.x + .32) / .42, 0, 1);
        pilot.position.set(-0.6213 + radioReach * .22, 0.34 - radioReach * .03, 0.18 - radioReach * .12);
      }
      pilot.updateMatrixWorld(true);
      car.getWorldQuaternion(qCar);
      reachSide(-1, armL, foreL, handL, hands.left, car);
      reachSide(1, armR, foreR, handR, hands.right, car);
      return true;
    },
  };
}
