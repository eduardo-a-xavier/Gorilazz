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
    previous = key;
    const g = ctx.createLinearGradient(0, 0, 0, height);
    g.addColorStop(0, '#162c29'); g.addColorStop(1, '#0e1d1b');
    ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    paint(ctx); texture.needsUpdate = true;
  }
  return { mesh, draw };
}

export function createCabin() {
  const root = new THREE.Group(), controls = [];
  root.visible = false; root.name = 'cabin';
  const unit = new THREE.BoxGeometry();
  const materials = new Map();
  const solid = (color, emissive = null, emissiveIntensity = 0) => {
    const key = `${color}/${emissive}/${emissiveIntensity}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .75, ...(emissive ? { emissive, emissiveIntensity } : {}) }));
    return materials.get(key);
  };
  function box(parent,w,h,d,x,y,z,color,emissive=null,emissiveIntensity=0) {
    const part = new THREE.Mesh(unit,solid(color,emissive,emissiveIntensity));
    part.scale.set(w,h,d); part.position.set(x,y,z); parent.add(part); return part;
  }
  const trim = '#232b28', panel = '#3b4640';
  // Medidas do Geep já na escala da cena; `fit()` as substitui pelas do modelo carregado.
  const eye = new THREE.Vector3(-.6,3.06,.52);
  const steering = { centre: new THREE.Vector3(-.625,2.25,-.305), normal: new THREE.Vector3(0,.28,.96).normalize(), radius: .31 };
  const across = new THREE.Vector3(), upward = new THREE.Vector3();

  // Coluna de instrumentos atrás do volante e módulo central de rádio Kong FM com visor emissivo,
  // moldura chanfrada, seletores rotativos e seis botões físicos em relevo.
  // Luz de preenchimento fraca só na cabine (desligada fora da 1ª pessoa porque root.visible = false).
  const cabinLight = new THREE.PointLight('#d8f2dc', .85, 2.5, 1.8);
  root.add(cabinLight);
  const cluster = new THREE.Group(), radioUnit = new THREE.Group(); root.add(cluster,radioUnit);
  box(cluster,.78,.34,.16,0,0,-.095,'#19211f','#7fa68a',.16); box(cluster,.72,.28,.04,0,0,-.018,trim,'#9ad4a8',.24); box(cluster,.2,.5,.14,0,-.36,-.12,trim);
  const clusterHalo = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: '#c4dc9d', transparent: true, opacity: .18, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  clusterHalo.scale.set(.70,.24,.01); clusterHalo.position.set(0,0,.024); cluster.add(clusterHalo);
  const clusterStrip = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: '#c4dc9d', toneMapped: false }));
  clusterStrip.scale.set(.66,.014,.016); clusterStrip.position.set(0,.125,.002); cluster.add(clusterStrip);
  // Mostrador do velocímetro à frente da moldura de topo: sem isso, a chapa escura cobre o número quando o rádio está ativo.
  const dial = display(256,80,.66,.2); dial.mesh.position.z = .03; cluster.add(dial.mesh);
  box(radioUnit,1.08,.62,.22,0,0,-.12,'#171f1e','#7fa68a',.16);
  box(radioUnit,1.02,.56,.05,0,0,-.022,trim,'#9ad4a8',.24);
  box(radioUnit,.96,.30,.02,0,.095,-.006,'#0c1413','#c4dc9d',.22);
  box(radioUnit,.5,.7,.16,0,-.6,-.14,panel);
  const radioHalo = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: '#c4dc9d', transparent: true, opacity: .16, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  radioHalo.scale.set(.96,.29,.01); radioHalo.position.set(0,.095,.003); radioUnit.add(radioHalo);
  const visorGlow = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: '#c4dc9d', toneMapped: false }));
  visorGlow.scale.set(.94,.014,.016); visorGlow.position.set(0,.252,.004); radioUnit.add(visorGlow);
  for (const side of [-1, 1]) {
    box(radioUnit,.055,.055,.045,side*.46,-.16,.012,'#2f3c38');
    const cap = new THREE.Mesh(unit, new THREE.MeshBasicMaterial({ color: side < 0 ? '#c4dc9d' : '#7fa6ff', toneMapped: false }));
    cap.scale.set(.024,.024,.012); cap.position.set(side*.46,-.16,.038); radioUnit.add(cap);
  }
  const lcd = display(640,180,.92,.26); lcd.mesh.position.set(0,.095,.005); radioUnit.add(lcd.mesh);
  [['prev','◀◀'],['play','▶Ⅱ'],['next','▶▶'],['quieter','−'],['louder','+'],['playlist','LISTA']].forEach(([action,label], i) => {
    const x = (i-2.5)*.136;
    box(radioUnit,.128,.114,.028,x,-.16,-.008,'#151e1d');
    const key = display(112,80,.122,.102);
    const accent = action === 'play' ? '#c4dc9d' : action === 'playlist' ? '#7fa6ff' : '#d8e8c8';
    key.draw(label,ctx => {
      ctx.fillStyle = '#182624'; ctx.fillRect(0, 0, 112, 80);
      ctx.strokeStyle = accent; ctx.lineWidth = 4; ctx.strokeRect(4, 4, 104, 72);
      ctx.fillStyle = accent; ctx.fillRect(10, 64, 92, 5);
      ctx.fillStyle = '#f1efda'; ctx.font = 'bold 26px Arial'; ctx.textAlign = 'center'; ctx.fillText(label,56,45);
    });
    key.mesh.position.set(x,-.16,.008); key.mesh.userData.action = action; controls.push(key.mesh); radioUnit.add(key.mesh);
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
    side, shoulder: new THREE.Vector3(), elbow: new THREE.Vector3(), hand: new THREE.Vector3(), grip: new THREE.Vector3(), aim: new THREE.Vector3(),
    upper: limb(sleeve,.17), fore: limb(sleeve,.145), wrist: limb(cuff,.158), palm: limb(skin,.125), fingers: limb(skin,.11), thumb: limb(skin,.05),
  }));
  const parts = arms.flatMap(arm => [arm.upper, arm.fore, arm.wrist, arm.palm, arm.fingers, arm.thumb]);
  /** Com o piloto GLB em primeira pessoa, os braços de bloco (protótipo) ficam escondidos. */
  function setBoxArmsVisible(value) { for (const part of parts) part.visible = Boolean(value); }
  /** Alvos das mãos no espaço do carro (aro a 10h e 2h, ou tecla do rádio), antes do limite de alcance. */
  const hands = { left: arms[0].aim, right: arms[1].aim };
  const pressAt = new THREE.Vector3(); let reach = 0, press = 0, lastSteer = 0;
  function fit() {
    // Base do plano do volante: `across` aponta para a direita do motorista, `upward` para o alto do aro.
    across.set(1,0,0).addScaledVector(steering.normal,-steering.normal.x).normalize(); upward.crossVectors(steering.normal,across).normalize();
    cluster.position.copy(steering.centre).addScaledVector(upward,steering.radius + .2).addScaledVector(steering.normal,-.1); cluster.lookAt(eye);
    radioUnit.position.set(steering.centre.x + .74,steering.centre.y - .08,steering.centre.z - .08); radioUnit.lookAt(eye.x + .2,eye.y,eye.z); radioUnit.scale.setScalar(.72);
    cluster.scale.setScalar(.72);
    cabinLight.position.set(steering.centre.x + .28, steering.centre.y + .22, steering.centre.z + .34);
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
    // Olhos acima do encosto e do para-brisa baixo do jipe, enquadrando rua, painel e volante.
    eye.set(centre.x,Math.max(centre.y + .82,(seatTop ?? 0) + .34),centre.z + .82); fit();
  }
  // Giro suavizado: A/D viram o volante com inércia leve, sem saltos entre os quadros.
  let smoothTurn = 0;
  function poseArms(steer, state) {
    const dt = state.dt || .016, target = THREE.MathUtils.clamp(steer * 1.15,-.68,.68);
    smoothTurn += (target - smoothTurn) * Math.min(1, dt * 7); const turn = smoothTurn;
    reach += ((state.interacting ? 1 : 0) - reach) * Math.min(1,dt * 6); press = Math.max(0,press - dt * 4);
    const ease = reach*reach*(3 - 2*reach);
    for (const arm of arms) {
      // Mãos em 11h e 1h no aro (mais altas e firmes que 10h/2h), acompanhando o giro; a mão fica presa ao aro.
      const angle = (arm.side < 0 ? Math.PI - .75 : .75) + turn;
      arm.grip.copy(steering.centre).addScaledVector(across,Math.cos(angle)*steering.radius*.96).addScaledVector(upward,Math.sin(angle)*steering.radius*.96).addScaledVector(steering.normal,.06); // mãos ~4 cm mais à frente (antes .02): os dedos encaixam no aro
      arm.hand.copy(arm.grip);
      if (arm.side > 0 && ease > .001) {
        // Rádio em foco: a mão direita repousa diante das teclas e só avança quando uma tecla é acionada.
        radioUnit.localToWorld(tip.copy(pressAt).setZ(.14 - Math.sin(press * Math.PI) * .11)); root.worldToLocal(tip);
        arm.hand.lerp(tip,ease);
      }
      // Dois ossos: se o alvo estiver além do alcance, a mão para no limite em vez de esticar o braço.
      arm.aim.copy(arm.hand);
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
    const gear = vehicle.speed < -.1 ? 'RÉ' : Math.abs(vehicle.speed) < .1 ? 'PARADO' : 'ESTRADA';
    dial.draw(`${speed}|${gear}`,ctx => {
      ctx.strokeStyle='#c4dc9d44'; ctx.lineWidth=3; ctx.strokeRect(3,3,250,74);
      ctx.fillStyle='#d2e8b8'; ctx.font='bold 56px monospace'; ctx.fillText(String(speed).padStart(2,'0'),12,60);
      ctx.font='bold 18px monospace'; ctx.fillText('KM/H',138,36);
      ctx.fillStyle='#c4dc9d'; ctx.font='bold 15px monospace'; ctx.fillText(gear,138,62);
    });
    const trackSlot = `${String((radio.index ?? 0) + 1).padStart(2,'0')}/${String(radio.total ?? 2).padStart(2,'0')}`;
    const pulse = radio.playing ? Math.floor((state.t ?? 0) * 4) % 4 : 0;
    lcd.draw([radio.name,radio.playing,radio.seconds,radio.volume,trackSlot,pulse].join('|'),ctx => {
      ctx.strokeStyle='#c4dc9d66'; ctx.lineWidth=4; ctx.strokeRect(4,4,632,172);
      ctx.fillStyle='#162a28'; ctx.fillRect(8,8,624,38);
      ctx.fillStyle=radio.playing?'#c4dc9d':'#ffcc4d';
      ctx.beginPath(); ctx.arc(26,27,7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#c4dc9d'; ctx.font='bold 22px monospace';
      ctx.fillText(`FM 101.9 · KONG FM · FAIXA ${trackSlot}`,44,34);
      ctx.fillStyle=radio.playing?'#c4dc9d':'#ffcc4d';
      ctx.fillText(radio.playing?'NO AR':'PAUSA',532,34);
      ctx.fillStyle='#f4f1de'; ctx.font='bold 44px sans-serif'; ctx.fillText(radio.name,18,98,490);
      const clock = Math.floor(radio.seconds/60)+':'+String(radio.seconds%60).padStart(2,'0');
      ctx.fillStyle='#b9da99'; ctx.font='22px sans-serif'; ctx.fillText(radio.artist,18,136,360);
      ctx.font='bold 20px monospace'; ctx.fillText(`${clock} · VOL ${radio.volume}%`,18,164);
      // Barra visual de volume e equalizador de 6 colunas no visor emissivo.
      ctx.fillStyle='#243b38'; ctx.fillRect(250,150,140,12);
      ctx.fillStyle='#c4dc9d'; ctx.fillRect(250,150,Math.round(1.4 * (radio.volume ?? 65)),12);
      for (let b = 0; b < 6; b++) {
        const h = radio.playing ? 18 + ((b * 17 + pulse * 13) % 44) : 10;
        ctx.fillStyle = b % 2 ? '#7fa6ff' : '#c4dc9d';
        ctx.fillRect(520 + b * 17, 162 - h, 11, h);
      }
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
  function pressKey(action) { const key = controls.find(item => item.userData.action === action); if (key) { pressAt.copy(key.position); pressAt.y -= .09; press = 1; } }
  pressAt.set(0,-.25,0);
  return {root,wheel,controls,eye,attach,update,renderMirror,pressKey,hands,setBoxArmsVisible};
}
