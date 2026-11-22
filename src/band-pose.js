import * as THREE from './vendor/three.module.min.js';

// Rig leve dos braços sobre as malhas Phase 7 existentes. Pesos são calculados uma vez;
// ombros e cotovelos animam SkinnedMesh na GPU, sem reescrever vértices a cada quadro.
// As máscaras são aproximadas: não substituem pesos revisados em ferramenta de autoria.
// Coordenadas no espaço local já normalizado por bake(visual).

// `contact` (opcional): [lado +x, lado −x] onde cada mão toca o instrumento (y e z na altura/profundidade do kit).
// Sem `contact`, a mão vai para a pose de POSES. O kit é montado a partir de `hand` (repouso), então ele não muda.
const SPECS = [
  { shoulder: [.13, 1.08, -.03], hand: [.225, .66, .04], radius: .062, play: 'keys', contact: [[.22, .89, .18], [-.22, .89, .18]], lean: -.04, gaze: [.18, 0] },   // 2-D: teclas na cintura; tronco inclinado para o público; olha para as teclas
  { shoulder: [.15, 1.08, -.02], hand: [.235, .65, .03], radius: .068, play: 'bass', contact: [[.33, 1.10, .28], [-.04, .90, .19]], lean: -.03, gaze: [.06, .1] },   // Murdoc: mão da escala no braço do baixo, mão do corpo no corpo do instrumento, tronco leve, olhar para a pista
  { shoulder: [.14, 1.10, -.03], hand: [.245, .69, .04], radius: .062, play: 'guitar', contact: [[.33, 1.10, .28], [-.04, .90, .19]], lean: -.03, gaze: [.08, .12] }, // Noodle: sockets da guitarra v2 (socket_hand_neck_R e socket_hand_strum_L); olhar para a pista
  { shoulder: [.24, 1.07, -.05], hand: [.59, .66, .05], radius: .115, play: 'drums', contact: [[.3, .93, .2], [-.3, .93, .2]], lean: -.05, gaze: [.3, 0] },   // Russel: caixa na altura da cintura; olha para a bateria
];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const dir = (x, y, z) => new THREE.Vector3(x, y, z).normalize();

// Direções do braço e do antebraço por modo de tocar; `s` é o lado (+1/−1 em x), `beat` anima.
const POSES = {
  keys: (s, beat) => ({ upper: dir(s * .22, -.82, .5), fore: dir(-s * .08, -.12 + .1 * Math.sin(beat * 6 + s * 1.3), 1) }),
  drums: (s, beat) => ({ upper: dir(s * .5, -.62, .6), fore: dir(-s * .12, .12 + .42 * Math.sin(beat * 7.5 + (s > 0 ? 0 : Math.PI * .5)), 1) }),
  // Mão da escala (lado +x) no braço do instrumento; a outra dedilha diante da barriga.
  guitar: (s, beat) => s > 0 ? { upper: dir(.58, -.5, .64), fore: dir(.3, .5 + .03 * Math.sin(beat * 2), .8) } : { upper: dir(-.32, -.86, .4), fore: dir(.78, -.08 + .13 * Math.sin(beat * 9), .6) },
  bass: (s, beat) => s > 0 ? { upper: dir(.62, -.55, .56), fore: dir(.36, .38 + .03 * Math.sin(beat * 2), .86) } : { upper: dir(-.3, -.88, .38), fore: dir(.8, -.16 + .1 * Math.sin(beat * 5), .58) },
};

export function rigBand(visual, index, material) {
  const spec = SPECS[index], meshes = []; visual.traverse(object => { if (object.isMesh) meshes.push(object); });
  const sides = [1, -1].map(s => {
    const shoulder = new THREE.Vector3(s * spec.shoulder[0], spec.shoulder[1], spec.shoulder[2]), hand = new THREE.Vector3(s * spec.hand[0], spec.hand[1], spec.hand[2]);
    const rest = hand.clone().sub(shoulder), length = rest.length(); rest.normalize();
    return { s, shoulder, rest, length, elbow: shoulder.clone().addScaledVector(rest, length / 2), upper: new THREE.Quaternion(), fore: new THREE.Quaternion(), hand: new THREE.Vector3(), foreDir: new THREE.Vector3(), elbowNow: new THREE.Vector3() };
  });
  // Preserve the original positions and textures. Each mesh owns its bind-space skeleton.
  const skins = meshes.map(mesh => {
    const geometry = mesh.geometry.clone(), position = geometry.attributes.position;
    const indices = new Uint16Array(position.count * 4), weights = new Float32Array(position.count * 4);
    const v = new THREE.Vector3(), offset = new THREE.Vector3();
    let influenced = 0;
    for (let i = 0; i < position.count; i++) {
      weights[i * 4] = 1;
      v.fromBufferAttribute(position, i); const sideIndex = v.x >= 0 ? 0 : 1, side = sides[sideIndex];
      // Cabeça e pescoço seguem o osso `head` (índice 5): acima do ombro, ou perto do eixo na faixa do ombro.
      const sy = spec.shoulder[1], band = smooth(sy - .12, sy + .14, v.y) * (1 - smooth(spec.shoulder[0] * .8, spec.shoulder[0] * 1.3, Math.abs(v.x)));
      const headW = Math.max(band, smooth(sy + .1, sy + .24, v.y));
      if (headW > .01) { indices[i * 4 + 3] = 5; weights[i * 4] = 1 - headW; weights[i * 4 + 3] = headW; continue; }
      offset.subVectors(v, side.shoulder); const along = offset.dot(side.rest), t = along / side.length;
      if (t < 0 || t > 1.3) continue;
      const away = offset.addScaledVector(side.rest, -along).length(), limit = spec.radius * (t > .8 ? 1.35 : 1);
      if (away > limit) continue;
      const arm = smooth(0, .22, t) * (1 - smooth(limit * .8, limit, away));
      if (arm < .01) continue;
      const fore = smooth(.42, .58, t), start = i * 4;
      indices[start + 1] = 1 + sideIndex * 2; indices[start + 2] = 2 + sideIndex * 2;
      weights[start] = 1 - arm; weights[start + 1] = arm * (1 - fore); weights[start + 2] = arm * fore;
      influenced++;
    }
    geometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(indices, 4));
    geometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weights, 4));
    const skin = new THREE.SkinnedMesh(geometry, mesh.material);
    skin.name = mesh.name; skin.userData = {...mesh.userData, rig: 'phase7-arms-v1'};
    skin.position.copy(mesh.position); skin.quaternion.copy(mesh.quaternion); skin.scale.copy(mesh.scale);
    skin.castShadow = mesh.castShadow; skin.receiveShadow = mesh.receiveShadow;
    const base = new THREE.Bone(); base.name = 'body'; base.rotation.x = spec.lean ?? 0; skin.add(base); // inclinação do tronco: gira o corpo e os braços em torno dos pés
    const bones = [base], joints = sides.map((side, i) => {
      const upper = new THREE.Bone(), fore = new THREE.Bone();
      upper.name = `${i === 0 ? 'left' : 'right'}_upper_arm`;
      fore.name = `${i === 0 ? 'left' : 'right'}_forearm`;
      upper.position.copy(side.shoulder); fore.position.copy(side.elbow).sub(side.shoulder);
      base.add(upper); upper.add(fore); bones.push(upper, fore);
      return {upper, fore};
    });
    // Osso da cabeça/pescoço (índice 5): balanço no ritmo sem tocar nos braços nem no tronco.
    const headBone = new THREE.Bone(); headBone.name = 'head'; headBone.position.set(0, spec.shoulder[1] + .04, spec.shoulder[2]); base.add(headBone); bones.push(headBone);
    mesh.parent.add(skin); mesh.removeFromParent();
    skin.updateMatrixWorld(true); skin.bind(new THREE.Skeleton(bones));
    skin.normalizeSkinWeights();
    geometry.computeBoundingSphere();
    // Arm motion remains inside this conservative bound; CPU raycasting uses the posed bones.
    skin.boundingSphere = geometry.boundingSphere.clone();
    skin.boundingSphere.radius += Math.max(...sides.map(side => side.length));
    mesh.geometry.dispose();
    return { skin, joints, head: headBone, influenced };
  });
  const sticks = [], axisZ = new THREE.Vector3(0, 0, 1);
  const inverse = new THREE.Quaternion();
  // Sockets: ponto de contato de cada mão no instrumento (a pose de repouso de POSES) e o lado do cotovelo.
  // Cada quadro resolve uma IK de dois ossos até socket + pequeno movimento de tocar, então a mão encosta
  // no instrumento no ponto do toque em vez de oscilar solta no ar.
  // Mãos de contato são dadas no espaço do corpo (sem a inclinação do tronco): o inverso da inclinação leva o ponto para dentro do osso.
  const Rinv = new THREE.Quaternion().setFromEuler(new THREE.Euler(spec.lean ?? 0, 0, 0)).invert(), gaze = spec.gaze ?? [0, 0];
  const sockets = sides.map(side => {
    const t = POSES[spec.play](side.s, 0), half = side.length / 2;
    const elbow = side.shoulder.clone().addScaledVector(t.upper, half);
    const hand = spec.contact ? new THREE.Vector3(...spec.contact[side.s > 0 ? 0 : 1]).applyQuaternion(Rinv) : elbow.clone().addScaledVector(t.fore, half);
    const line = hand.clone().sub(side.shoulder).normalize(), e = elbow.clone().sub(side.shoulder);
    const pole = e.addScaledVector(line, -e.dot(line));
    return { hand, pole: pole.lengthSq() > 1e-8 ? pole.normalize() : new THREE.Vector3(side.s * .5, -1, 0).normalize() };
  });
  const neck = sockets[0].hand.clone().sub(sockets[1].hand).normalize();  // braço da guitarra/baixo (mão da escala → corpo)
  const offset = new THREE.Vector3(), aimAt = new THREE.Vector3(), poleNow = new THREE.Vector3(), upperDir = new THREE.Vector3(), foreAim = new THREE.Vector3();
  // Movimento de tocar por instrumento, somado ao socket. `beat` é o tempo em segundos (sem custo de alocação).
  function motion(s, beat) {
    switch (spec.play) {
      case 'keys': { const tap = Math.max(0, Math.sin(beat * 6 + s * 1.3)); return offset.set(Math.sin(beat * .9 + s) * .035, -.03 * tap * tap, 0); }
      case 'drums': {
        // Baqueta sobe e desce (contato no ponto mais baixo) e as mãos alternam entre caixa e surdo.
        const lift = .5 + .5 * Math.sin(beat * 7.5 + (s > 0 ? 0 : Math.PI * .5));
        return offset.set(Math.sin(beat * 1.7 + (s > 0 ? 0 : Math.PI)) * .07, .12 * lift * lift, -.03 * lift);
      }
      default: // guitar / bass
        return s > 0 ? offset.copy(neck).multiplyScalar(.05 * Math.sin(beat * .8)) : offset.set(.008 * Math.sin(beat * 2), .035 * Math.sin(beat * 9), 0);
    }
  }
  function solve(side, socket, move) {
    aimAt.copy(socket.hand).add(move).sub(side.shoulder);
    const half = side.length / 2, reach = THREE.MathUtils.clamp(aimAt.length(), .12 * side.length, .985 * side.length);
    aimAt.normalize();
    const along = reach / 2, bend = Math.sqrt(Math.max(0, half * half - along * along));
    poleNow.copy(socket.pole).addScaledVector(aimAt, -socket.pole.dot(aimAt)).normalize();
    side.elbowNow.copy(side.shoulder).addScaledVector(aimAt, along).addScaledVector(poleNow, bend);
    upperDir.subVectors(side.elbowNow, side.shoulder).normalize();
    foreAim.copy(side.shoulder).addScaledVector(aimAt, reach).sub(side.elbowNow).normalize();
    side.upper.setFromUnitVectors(side.rest, upperDir); side.fore.setFromUnitVectors(side.rest, foreAim);
    side.foreDir.copy(foreAim);
    side.hand.copy(side.elbowNow).addScaledVector(foreAim, half);
  }
  function pose(time, still) {
    const beat = still ? 0 : time;
    sides.forEach((side, i) => solve(side, sockets[i], still ? offset.set(0, 0, 0) : motion(side.s, beat)));
    // Cabeça: aceno no tempo forte, inclinação e giro lentos; parado (movimento reduzido) volta à pose neutra.
    const nod = still ? 0 : .07 * Math.sin(beat * 5.2) + .03 * Math.sin(beat * 2.6), tilt = still ? 0 : .05 * Math.sin(beat * 2.6 + .7), turn = still ? 0 : .08 * Math.sin(beat * 1.3 + index);
    for (const {skin, joints, head} of skins) {
      head.rotation.set(nod + gaze[0], turn + gaze[1], tilt);
      joints.forEach((joint, i) => {
        joint.upper.quaternion.copy(sides[i].upper);
        joint.fore.quaternion.copy(inverse.copy(sides[i].upper).invert()).multiply(sides[i].fore);
      });
      skin.updateMatrixWorld(true);
    }
    for (const stick of sticks) { const side = sides[stick.userData.side]; stick.position.copy(side.hand).addScaledVector(side.foreDir, .13); stick.quaternion.setFromUnitVectors(axisZ, side.foreDir); }
  }
  pose(0, true);

  // ------------------------------------------------------------ instrumentos
  const kit = new THREE.Group(); kit.name = 'instrument'; visual.add(kit);
  const add = (parent, geometry, color, position, { rotation = [0, 0, 0], glow = false } = {}) => {
    const mesh = new THREE.Mesh(geometry, material(color, glow)); mesh.position.set(...position); mesh.rotation.set(...rotation); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  };
  const box = (parent, size, color, position, options) => add(parent, new THREE.BoxGeometry(...size), color, position, options);
  const disc = (parent, radius, depth, color, position, options) => add(parent, new THREE.CylinderGeometry(radius, radius, depth, 24), color, position, options);
  const [right, left] = sides, flat = [Math.PI / 2, 0, 0];
  let guitar = null; // guitarra procedural (fallback): fica fora da fusão do bake para poder ser trocada pelo GLB v2
  if (spec.play === 'guitar' || spec.play === 'bass') {
    // Corpo junto à mão que dedilha; o braço do instrumento aponta para a mão da escala.
    const bass = spec.play === 'bass', strap = new THREE.Group(); strap.name = 'guitar-procedural'; kit.add(strap); guitar = strap;
    const anchor = left.hand.clone().add(new THREE.Vector3(.06, .02, .01)), axis = right.hand.clone().sub(anchor), reach = axis.length(); axis.normalize();
    const face = new THREE.Vector3(0, 0, 1).addScaledVector(axis, -axis.z).normalize(), up = new THREE.Vector3().crossVectors(face, axis);
    strap.position.copy(anchor); strap.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(axis, up, face));
    const body = bass ? '#3a2140' : '#e9e2cf', guard = bass ? '#9dd66b' : '#f2559c', scale = bass ? 1.12 : 1, neck = reach + (bass ? .2 : .13);
    disc(strap, .15 * scale, .05, body, [-.05, 0, 0], { rotation: flat }); disc(strap, .115 * scale, .05, body, [.11 * scale, 0, 0], { rotation: flat });
    disc(strap, .06 * scale, .05, body, [.19 * scale, .09 * scale, 0], { rotation: flat }); disc(strap, .05 * scale, .05, body, [.2 * scale, -.085 * scale, 0], { rotation: flat });
    disc(strap, .1 * scale, .008, guard, [-.03, -.03, .028], { rotation: flat });
    for (const x of bass ? [.04] : [-.02, .09]) box(strap, [.035, .1, .012], '#17191b', [x, .01, .03]);
    box(strap, [.03, .11, .014], '#c9c2b4', [-.11, .01, .03]);
    for (const [x, y] of [[-.13, -.09], [-.09, -.11]]) disc(strap, .014, .02, '#c9c2b4', [x, y, .032], { rotation: flat });
    box(strap, [neck - .18, bass ? .05 : .046, .026], '#6b4a2f', [.18 + (neck - .18) / 2, .012, .012]);
    box(strap, [neck - .2, bass ? .04 : .038, .006], '#2b1d16', [.19 + (neck - .2) / 2, .012, .028]);
    for (let i = 0; i < 9; i++) box(strap, [.004, .042, .008], '#c9c2b4', [.26 + i * (neck - .34) / 9, .012, .03]);
    box(strap, [neck + .1, .004, .003], '#e8e4d8', [neck / 2 - .06, .012, .036]);
    const head = box(strap, [.15 * scale, .075 * scale, .022], body, [neck + .06, .02, .006], { rotation: [0, 0, .12] });
    for (let i = 0; i < (bass ? 4 : 6); i++) disc(head, .011, .03, '#c9c2b4', [-.055 + i * (bass ? .036 : .022), i % 2 ? .045 : -.045, 0], { rotation: [0, 0, 0] });
  } else if (spec.play === 'keys') {
    // Teclado em cavalete na altura das mãos e microfone diante da boca.
    const middle = right.hand.clone().add(left.hand).multiplyScalar(.5), y = middle.y - .06, z = middle.z + .03;
    box(kit, [.98, .055, .3], '#1b1e21', [0, y, z]); box(kit, [.9, .012, .16], '#f1ecdc', [0, y + .032, z + .045]);
    for (let i = 0; i < 20; i++) if (i % 7 !== 2 && i % 7 !== 6) box(kit, [.022, .014, .09], '#111415', [-.42 + i * .0445, y + .04, z + .012]);
    box(kit, [.3, .012, .05], '#7fa6ff', [-.28, y + .032, z - .1], { glow: true });
    for (const turn of [-1, 1]) box(kit, [.035, Math.hypot(y, .5) + .02, .035], '#2a3036', [0, y / 2, z], { rotation: [0, 0, turn * Math.atan2(.5, y)] });
    const mouth = spec.shoulder[1] + .13;
    add(kit, new THREE.CylinderGeometry(.008, .008, mouth, 8), '#9a9d8b', [-.3, mouth / 2, z + .12]); disc(kit, .12, .02, '#2a3036', [-.3, .01, z + .12]);
    box(kit, [.3, .012, .012], '#9a9d8b', [-.16, mouth, z + .1], { rotation: [0, .1, .12] }); add(kit, new THREE.SphereGeometry(.032, 12, 8), '#2a3036', [-.02, mouth + .02, z + .09]);
  } else {
    // Bateria compacta à frente: bumbo, caixa, surdo, chimbal, prato e baquetas nas mãos.
    const middle = right.hand.clone().add(left.hand).multiplyScalar(.5), y = middle.y - .2, z = middle.z + .12;
    const kick = disc(kit, .3, .3, '#3a68d8', [0, .32, z + .3], { rotation: flat }); disc(kit, .28, .012, '#f1ecdc', [0, .32, z + .456], { rotation: flat });
    for (const s of [-1, 1]) box(kick, [.02, .3, .02], '#9a9d8b', [s * .3, 0, -.1], { rotation: [0, 0, s * .5] });
    disc(kit, .2, .13, '#c9c2b4', [0, y, z]); disc(kit, .19, .012, '#f1ecdc', [0, y + .07, z]); add(kit, new THREE.CylinderGeometry(.012, .012, y, 6), '#9a9d8b', [0, y / 2, z]);
    disc(kit, .24, .26, '#3a68d8', [.5, y - .1, z + .05]); disc(kit, .23, .012, '#f1ecdc', [.5, y + .035, z + .05]);
    for (const lift of [0, .028]) disc(kit, .19, .008, '#d9b64a', [-.48, y + .14 + lift, z + .02]); add(kit, new THREE.CylinderGeometry(.01, .01, y + .14, 6), '#9a9d8b', [-.48, (y + .14) / 2, z + .02]);
    disc(kit, .27, .008, '#d9b64a', [.42, y + .48, z + .34], { rotation: [.2, 0, -.12] }); add(kit, new THREE.CylinderGeometry(.01, .01, y + .48, 6), '#9a9d8b', [.42, (y + .48) / 2, z + .34]);
    for (const sideIndex of [0, 1]) { const stick = box(kit, [.016, .016, .42], '#d8b98a', [0, 0, 0]); stick.userData.side = sideIndex; sticks.push(stick); }
    pose(0, true);
  }
  // hands(): posição atual das mãos no espaço local do visual (depuração de pose e testes).
  return { pose, kit, sticks, guitar, visual, hands: () => sides.map(side => side.hand.clone()), vertices: skins.reduce((sum, skin) => sum + skin.influenced, 0) };
}
