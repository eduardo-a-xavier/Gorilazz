import * as THREE from './vendor/three.module.min.js';

// Cabine em primeira pessoa. O interior é o do próprio Geep (carroceria, bancos, volante e
// arco do modelo): este módulo só acrescenta o que o modelo não traz — velocímetro, rádio,
// retrovisor e os braços do motorista. Tudo vive no espaço local do carro (frente = −z,
// direita = +x), por isso a vista interna e a externa mostram o mesmo veículo.

function display(width, height, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({map:texture, toneMapped:false}));
  let previous;
  function draw(key, paint) {
    if (previous === key) return;
    previous = key; ctx.fillStyle = '#101d1c'; ctx.fillRect(0, 0, width, height);
    paint(ctx); texture.needsUpdate = true;
  }
  return { mesh, draw };
}

export function createCabin() {
  const root = new THREE.Group(), controls = [];
  root.visible = false; root.name = 'cabin';
  const unit = new THREE.BoxGeometry();
  const materials = new Map();
  const solid = color => { if (!materials.has(color)) materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.8})); return materials.get(color); };
  function box(parent,w,h,d,x,y,z,color) {
    const part = new THREE.Mesh(unit,solid(color));
    part.scale.set(w,h,d); part.position.set(x,y,z); parent.add(part); return part;
  }
  const trim = '#232b28', panel = '#3b4640';
  // Medidas do Geep já na escala da cena; `fit()` as substitui pelas do modelo carregado.
  const eye = new THREE.Vector3(-.6,3.08,.5);
  const steering = { centre: new THREE.Vector3(-.625,2.25,-.305), normal: new THREE.Vector3(0,.28,.96).normalize(), radius: .31 };
  const across = new THREE.Vector3(), upward = new THREE.Vector3();

  // Coluna de instrumentos atrás do volante e rádio no centro, ambos voltados para os olhos.
  const cluster = new THREE.Group(), radioUnit = new THREE.Group(); root.add(cluster,radioUnit);
  box(cluster,.74,.3,.16,0,0,-.09,trim); box(cluster,.2,.5,.14,0,-.36,-.12,trim);
  const dial = display(256,80,.66,.2); dial.mesh.position.z = .001; cluster.add(dial.mesh);
  box(radioUnit,1.02,.56,.2,0,0,-.11,trim); box(radioUnit,.5,.7,.16,0,-.6,-.14,panel);
  const lcd = display(640,180,.94,.264); lcd.mesh.position.set(0,.1,.001); radioUnit.add(lcd.mesh);
  [['prev','◀◀'],['play','▶Ⅱ'],['next','▶▶'],['quieter','−'],['louder','+'],['playlist','LISTA']].forEach(([action,label], i) => {
    const key = display(96,72,.145,.108);
    key.draw(label,ctx => { ctx.fillStyle = '#bbdbaa'; ctx.font = 'bold 25px Arial'; ctx.textAlign = 'center'; ctx.fillText(label,48,45); });
    key.mesh.position.set((i-2.5)*.158,-.16,.001); key.mesh.userData.action = action; controls.push(key.mesh); radioUnit.add(key.mesh);
  });
  // Retrovisor com imagem real de trás, em baixa resolução e atualizado a cada três quadros.
  const mirrorTarget = new THREE.WebGLRenderTarget(256,96), mirrorCamera = new THREE.PerspectiveCamera(38,256/96,.6,400);
  const mirror = new THREE.Group(); root.add(mirror);
  box(mirror,.86,.3,.05,0,0,-.03,trim); box(mirror,.05,.3,.05,0,-.28,-.03,trim);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(.8,.25),new THREE.MeshBasicMaterial({map:mirrorTarget.texture}));
  glass.scale.x = -1; glass.material.side = THREE.DoubleSide; glass.position.z = .001; mirror.add(glass); root.add(mirrorCamera);
  // Área do volante que aceita arraste; invisível, mas presente para o raio do ponteiro.
  const wheel = new THREE.Mesh(new THREE.CircleGeometry(1,24),new THREE.MeshBasicMaterial({visible:false,side:THREE.DoubleSide})); root.add(wheel);

  // Braços: dois ossos de comprimento fixo resolvidos por cinemática inversa, cotovelo para baixo e para fora.
  const sleeve = new THREE.MeshStandardMaterial({color:'#e2d8c0',roughness:.9}), cuff = new THREE.MeshStandardMaterial({color:'#f2559c',roughness:.8}), skin = new THREE.MeshStandardMaterial({color:'#d9a37c',roughness:.75});
  const forward = new THREE.Vector3(0,0,1), span = new THREE.Vector3(), pole = new THREE.Vector3(), tip = new THREE.Vector3(), from = new THREE.Vector3();
  const UPPER = .6, FORE = .58;
  function limb(material, thickness) { const part = new THREE.Mesh(unit,material); part.userData.thickness = thickness; root.add(part); return part; }
  function stretch(part, a, b) {
    span.subVectors(b,a); const length = span.length() || 1e-4;
    part.position.addVectors(a,b).multiplyScalar(.5); part.scale.set(part.userData.thickness,part.userData.thickness,length);
    part.quaternion.setFromUnitVectors(forward,span.divideScalar(length));
  }
  const arms = [-1,1].map(side => ({
    side, shoulder: new THREE.Vector3(), elbow: new THREE.Vector3(), hand: new THREE.Vector3(), grip: new THREE.Vector3(),
    upper: limb(sleeve,.17), fore: limb(sleeve,.145), wrist: limb(cuff,.158), palm: limb(skin,.125), fingers: limb(skin,.11), thumb: limb(skin,.05),
  }));
  const pressAt = new THREE.Vector3(); let reach = 0, press = 0, lastSteer = 0;
  function fit() {
    // Base do plano do volante: `across` aponta para a direita do motorista, `upward` para o alto do aro.
    across.set(1,0,0).addScaledVector(steering.normal,-steering.normal.x).normalize(); upward.crossVectors(steering.normal,across).normalize();
    cluster.position.copy(steering.centre).addScaledVector(upward,steering.radius + .24).addScaledVector(steering.normal,-.1); cluster.lookAt(eye);
    radioUnit.position.set(steering.centre.x + .86,steering.centre.y - .02,steering.centre.z - .3); radioUnit.lookAt(eye.x + .25,eye.y,eye.z); radioUnit.scale.setScalar(.74);
    cluster.scale.setScalar(.72);
    // Retrovisor numa haste curta sobre o para-brisa baixo, ao centro, sem cobrir a rua.
    mirror.position.set(.2,eye.y - .2,eye.z - 1.5); mirror.scale.setScalar(.8); mirror.lookAt(eye.x,eye.y,eye.z);
    mirrorCamera.position.copy(mirror.position); mirrorCamera.rotation.set(0,Math.PI,0);
    wheel.position.copy(steering.centre); wheel.scale.setScalar(steering.radius * 1.25); wheel.lookAt(from.copy(steering.centre).add(steering.normal));
    for (const arm of arms) arm.shoulder.set(eye.x + arm.side*.34,eye.y - .5,eye.z + .1);
    root.updateMatrixWorld(true);
  }
  fit();
  /** Recebe o volante do modelo já separado: centro, eixo e raio no espaço do carro. */
  function attach({centre, normal, radius, seatTop}) {
    steering.centre.copy(centre); steering.normal.copy(normal).normalize(); steering.radius = radius;
    // Olhos acima do encosto e do para-brisa baixo do jipe, para a rua ficar à vista.
    eye.set(centre.x,Math.max(centre.y + .98,(seatTop ?? 0) + .48),centre.z + .74); fit();
  }
  function poseArms(steer, state) {
    const dt = state.dt || .016, turn = THREE.MathUtils.clamp(steer * 1.9,-1.05,1.05);
    reach += ((state.interacting ? 1 : 0) - reach) * Math.min(1,dt * 6); press = Math.max(0,press - dt * 4);
    const ease = reach*reach*(3 - 2*reach);
    for (const arm of arms) {
      // 10h e 2h no aro, acompanhando o giro; a mão fica por fora do aro, não atravessada nele.
      const angle = (arm.side < 0 ? Math.PI - .42 : .42) + turn;
      arm.grip.copy(steering.centre).addScaledVector(across,Math.cos(angle)*steering.radius).addScaledVector(upward,Math.sin(angle)*steering.radius).addScaledVector(steering.normal,.07);
      arm.hand.copy(arm.grip);
      if (arm.side > 0 && ease > .001) {
        // Rádio em foco: a mão direita repousa diante das teclas e só avança quando uma tecla é acionada.
        radioUnit.localToWorld(tip.copy(pressAt).setZ(.2 - Math.sin(press * Math.PI) * .15)); root.worldToLocal(tip);
        arm.hand.lerp(tip,ease);
      }
      // Dois ossos: se o alvo estiver além do alcance, a mão para no limite em vez de esticar o braço.
      span.subVectors(arm.hand,arm.shoulder); const distance = Math.min(span.length(),UPPER + FORE - .02); span.normalize();
      arm.hand.copy(arm.shoulder).addScaledVector(span,distance);
      const along = (UPPER*UPPER - FORE*FORE + distance*distance) / (2*distance), bend = Math.sqrt(Math.max(0,UPPER*UPPER - along*along));
      pole.set(arm.side*.55,-1,.25).addScaledVector(span,-pole.dot(span)).normalize();
      arm.elbow.copy(arm.shoulder).addScaledVector(span,along).addScaledVector(pole,bend);
      stretch(arm.upper,arm.shoulder,arm.elbow);
      span.subVectors(arm.hand,arm.elbow).normalize();
      const cuffAt = from.copy(arm.hand).addScaledVector(span,-.2).clone(), wristAt = from.copy(arm.hand).addScaledVector(span,-.1).clone();
      stretch(arm.fore,arm.elbow,cuffAt); stretch(arm.wrist,cuffAt,wristAt);
      stretch(arm.palm,wristAt,tip.copy(arm.hand).addScaledVector(span,.04));
      // Dedos: fechados sobre o aro ao dirigir, estendidos ao apontar para o rádio.
      const curl = arm.side > 0 ? 1 - ease : 1, knuckle = arm.hand.clone().addScaledVector(span,.04);
      stretch(arm.fingers,knuckle,tip.copy(knuckle).addScaledVector(span,.1*(1 - curl) + .02).addScaledVector(steering.normal,-.1*curl));
      const thumbAt = wristAt.clone().addScaledVector(across,-arm.side*.07); stretch(arm.thumb,thumbAt,tip.copy(thumbAt).addScaledVector(span,.09).addScaledVector(across,-arm.side*.02));
    }
    lastSteer = steer;
  }
  function update(vehicle,radio,state = {}) {
    poseArms(vehicle.steering,state);
    const speed = Math.round(Math.abs(vehicle.speed)*3.6);
    dial.draw(speed,ctx => {
      ctx.fillStyle='#d2e8b8'; ctx.font='bold 60px monospace'; ctx.fillText(String(speed).padStart(2,'0'),12,62);
      ctx.font='22px monospace'; ctx.fillText('KM/H',146,59);
    });
    lcd.draw([radio.name,radio.playing,radio.seconds,radio.volume].join('|'),ctx => {
      ctx.fillStyle='#b9da99';ctx.font='bold 29px monospace';ctx.fillText('KONG FM   /   '+(radio.playing?'NO AR':'PAUSA'),16,36);
      ctx.fillStyle='#f1efda';ctx.font='bold 48px sans-serif';ctx.fillText(radio.name,16,97,605);
      const clock = Math.floor(radio.seconds/60)+':'+String(radio.seconds%60).padStart(2,'0');
      ctx.font='24px sans-serif';ctx.fillText(radio.artist,16,147,385);ctx.fillText(clock+'  VOL '+radio.volume,418,147);
    });
  }
  let mirrorFrame = 0;
  /** Desenha o retrovisor; a cabine e o próprio espelho ficam fora da imagem. */
  function renderMirror(renderer, scene) {
    if (mirrorFrame++ % 3) return;
    const target = renderer.getRenderTarget(); root.visible = false;
    renderer.setRenderTarget(mirrorTarget); renderer.render(scene,mirrorCamera); renderer.setRenderTarget(target); root.visible = true;
  }
  /** Toque curto da mão direita na tecla acionada. */
  function pressKey(action) { const key = controls.find(item => item.userData.action === action); if (key) { pressAt.copy(key.position); press = 1; } }
  pressAt.set(0,-.16,0);
  return {root,wheel,controls,eye,attach,update,renderMirror,pressKey};
}
