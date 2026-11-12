import { createCabin } from './cabin.js';
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { CITY_ERAS, CITY_LOTS, ERA_GATES, eraAt, ROADS, NODES, REGIONS, DISCOVERIES, MEMBER_LOCATIONS, behind } from './world-data.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { createSurfaceLibrary, letteringTexture } from './materials.js';
import { installEnvironment } from './environment.js';
import { installCity } from './city.js';
import { createAtmosphere } from './atmosphere.js';
import { createPostFX } from './postfx.js';
import { buildRoads } from './roads.js';
import { installLandmarks } from './landmarks.js';
import { rigBand } from './band-pose.js';

const SHADOW_SPAN = 90;
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
  const smooth = new THREE.SphereGeometry(1,10,6), face = new THREE.SphereGeometry(1,12,10), detail = new THREE.SphereGeometry(1,8,4);
  const part = (parent,geometry,size,at,color) => {
    const mesh = new THREE.Mesh(geometry,material(color)); mesh.scale.set(...size); mesh.position.set(...at);
    mesh.castShadow=mesh.receiveShadow=true; parent.add(mesh); return mesh;
  };
  part(driver,smooth,[.33,.39,.19],[0,1.52,.06],'#e2d8c0');
  part(driver,smooth,[.35,.06,.2],[0,1.2,.06],'#f2559c');
  part(driver,smooth,[.1,.08,.1],[0,1.97,.04],'#d9a37c');
  const driverHead = new THREE.Group(); driverHead.position.set(0,2.24,.02); driverHead.name='driver-head'; driver.add(driverHead);
  part(driverHead,face,[.27,.2916,.27],[0,0,0],'#d9a37c');
  part(driverHead,new THREE.SphereGeometry(1,12,6,0,Math.PI*2,0,Math.PI/2),[.29,.22,.29],[0,.1,.03],'#f2559c');
  part(driverHead,smooth,[.3,.035,.18],[0,.08,-.18],'#f2559c');
  for (const side of [-1,1]) {
    part(driverHead,smooth,[.035,.06,.035],[side*.25,-.015,0],'#d9a37c');
    part(driverHead,detail,[.045,.055,.025],[side*.1,-.025,-.252],'#141414');
    part(driverHead,detail,[.012,.015,.007],[side*.1-.012,-.012,-.277],'#e2d8c0');
    part(driverHead,detail,[.07,.017,.022],[side*.1,.06,-.25],'#141414').rotation.z=side*.12;
    part(driver,smooth,[.12,.11,.35],[side*.17,1.12,-.3],'#2a3036');
    part(driver,smooth,[.11,.3,.11],[side*.17,.8,-.62],'#2a3036');
  }
  part(driverHead,detail,[.035,.045,.045],[0,-.055,-.269],'#d9a37c');
  part(driverHead,detail,[.065,.017,.02],[0,-.15,-.23],'#141414');
  const driverArms = new THREE.Group(); driverArms.position.set(0,1.62,-.5); driverArms.name='driver-arms'; driver.add(driverArms);
  for (const side of [-1,1]) {
    const shoulder = new THREE.Vector3(side*.28,.18,.58), wrist = new THREE.Vector3(side*.19,.01,.055);
    const direction = new THREE.Vector3().subVectors(wrist,shoulder), centre = new THREE.Vector3().addVectors(shoulder,wrist).multiplyScalar(.5);
    const arm = part(driverArms,smooth,[.085,.085,direction.length()/2+.025],centre.toArray(),'#e2d8c0');
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction.normalize());
    part(driverArms,detail,[.1,.08,.055],wrist.toArray(),'#f2559c').quaternion.copy(arm.quaternion);
    part(driverArms,smooth,[.085,.085,.085],[side*.19,0,0],'#d9a37c');
  }
  bake(driverHead); bake(driverArms); bake(driver,[driverHead,driverArms]);
  return {driver,driverHead,driverArms};
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

// Local credited Geep and Phase 7 models; original scenery and geometric fallbacks.
export function createWorld(container, onMember, {onLost = () => {}, onRestored = () => {}, onViewReset = () => {}, onFullscreen = () => {}, onExplore = () => {}, radio, onRadio, onSteer} = {}) {
  // Perfil gráfico: automático por padrão; ?qualidade=leve ou ?qualidade=alta força um perfil.
  const requested = new URLSearchParams(location.search).get('qualidade');
  const compact = container.clientWidth > 0 && container.clientWidth < 700;
  const light = requested === 'leve' || (requested !== 'alta' && compact);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  const maxRatio = Math.min(devicePixelRatio, light ? 1.5 : 1.75), minRatio = Math.min(maxRatio, .7);
  let pixelRatio = maxRatio;
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.info.autoReset = false;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Estrada 3D com carro, personagens e cenários musicais');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onLost(); });
  renderer.domElement.addEventListener('webglcontextrestored', () => onRestored());
  const scene = new THREE.Scene();
  const surfaces = createSurfaceLibrary();
  scene.background = new THREE.Color('#202631');
  scene.fog = new THREE.FogExp2('#202631', .007);
  scene.environmentIntensity = .9;
  const atmosphere = createAtmosphere(scene, renderer);
  let postfx = light ? null : createPostFX(renderer);
  renderer.domElement.dataset.quality = light ? 'leve' : postfx ? 'alta' : 'padrao';
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 650);
  const skylight = new THREE.HemisphereLight('#ffffff', '#69685e', 1.3);
  scene.add(skylight);
  const sunlight = new THREE.DirectionalLight('#ffe4c2', 3.1);
  sunlight.castShadow = true;
  const shadowSize = light ? 1024 : 2048;
  sunlight.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sunlight.shadow.camera, { left: -SHADOW_SPAN / 2, right: SHADOW_SPAN / 2, top: SHADOW_SPAN / 2, bottom: -SHADOW_SPAN / 2, near: 1, far: 260 });
  sunlight.shadow.normalBias = .05; sunlight.shadow.bias = -.0003;
  // A sombra é redesenhada em quadros alternados e presa à grade de texels: metade do custo, sem cintilar.
  sunlight.shadow.autoUpdate = false; scene.add(sunlight); scene.add(sunlight.target);
  const lightRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), atmosphere.sunDirection).normalize();
  const lightUp = new THREE.Vector3().crossVectors(atmosphere.sunDirection, lightRight);
  const shadowCentre = new THREE.Vector3(); let frameCount = 0;
  function aimSun(x, z) {
    const texel = SHADOW_SPAN / shadowSize; shadowCentre.set(x, 0, z);
    const right = Math.round(shadowCentre.dot(lightRight) / texel) * texel, up = Math.round(shadowCentre.dot(lightUp) / texel) * texel;
    const depth = shadowCentre.dot(atmosphere.sunDirection);
    sunlight.target.position.set(0, 0, 0).addScaledVector(lightRight, right).addScaledVector(lightUp, up).addScaledVector(atmosphere.sunDirection, depth);
    sunlight.position.copy(sunlight.target.position).addScaledVector(atmosphere.sunDirection, 130);
    sunlight.shadow.needsUpdate = true;
  }
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
  const ground = box(scene, [280, 5, 250], [0, -2.8, -75], '#34433f'); ground.material = surfaces.get('grass',90,80); ground.castShadow = false;
  // Tudo o que é estático entra em `city` e é fundido por material mais abaixo.
  const city = new THREE.Group(); scene.add(city);
  for (const region of REGIONS) {
    const plaza = cylinder(city, 17, 17, .06, [region.x, -.15, region.z], region.id === 'murals' ? '#454253' : '#495448', 48); plaza.material = surfaces.get('earth',8); plaza.castShadow = false; plaza.receiveShadow = true;
  }
  buildRoads(city, surfaces, material);

  // Prédios: gerados por city.js a partir de CITY_LOTS (inclui os marcos de BUILDINGS).
  // The hills sit beyond the drivable boundary; the road surface stays level.
  for (let i=0;i<23;i++) {
    const angle=i*Math.PI*2/23;
    const hill=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),material(i%2?'#5f7666':'#71867a'));
    hill.position.set(Math.cos(angle)*235,-6,-75+Math.sin(angle)*205);
    hill.scale.set(33+i%4*6,14+i%5*4,24+i%3*5);
    hill.rotation.y=angle;city.add(hill);
  }
  // Visible boundary stones mark the coast and recovery area.
  for (let i = 0; i < 32; i++) {
    const x = i < 16 ? -134 + i * 17.8 : (i % 2 ? -134 : 134);
    const z = i < 16 ? (i % 2 ? -194 : 44) : -185 + (i - 16) * 14;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3, 0), material('#52635d')); rock.position.set(x, -.4, z); rock.scale.y = .55; city.add(rock);
  }
  function sign(text, at, color = '#f2559c') {
    const signGroup = new THREE.Group(); signGroup.position.set(at.x, 0, at.z); signGroup.rotation.y = at.heading || 0; city.add(signGroup);
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const context = canvas.getContext('2d'); context.fillStyle = '#141414'; context.fillRect(0, 0, 768, 256);
    context.strokeStyle = color; context.lineWidth = 16; context.strokeRect(8, 8, 752, 240);
    context.fillStyle = '#e2d8c0'; context.font = 'bold 55px monospace'; context.textAlign = 'center';
    text.split('|').forEach((line, index, lines) => context.fillText(line, 384, lines.length === 1 ? 150 : 105 + index * 72, 700));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    // Chapa com acabamento próprio nas bordas; a arte fica só na frente e no verso, legível dos dois lados.
    box(signGroup, [8.16, 2.81, .16], [0, 4.1, 0], '#23282b');
    const art = new THREE.MeshStandardMaterial({ map: texture, roughness: .7 });
    for (const turn of [0, Math.PI]) {
      const face = new THREE.Mesh(new THREE.PlaneGeometry(8, 2.65), art);
      face.position.set(0, 4.1, turn ? -.085 : .085); face.rotation.y = turn; face.receiveShadow = true; signGroup.add(face);
    }
    for (const dx of [-2.6, 2.6]) box(signGroup, [.18, 3.5, .18], [dx, 1.5, 0], '#777487');
    return { canvas, context, texture };
  }
  // Palco de rua de cada integrante: muro de concreto com o nome em spray e o retrato colado como
  // lambe-lambe, tablado de madeira, caixas de som e os objetos de quem toca ali. Fica voltado
  // para a rua; o integrante se apresenta na frente do próprio muro.
  const MEMBER_SET = [
    { name: '2-D', role: 'VOCAL · TECLADOS', accent: '#7fa6ff', key: 'twod', tag: 'TOMORROW' },
    { name: 'MURDOC', role: 'BAIXO', accent: '#9dd66b', key: 'murdoc', tag: 'KONG' },
    { name: 'NOODLE', role: 'GUITARRA', accent: '#f5a9c6', key: 'noodle', tag: 'DARE' },
    { name: 'RUSSEL', role: 'BATERIA', accent: '#ffcc4d', key: 'russel', tag: '19-2000' },
  ];
  function concrete(context, width, height, seed) {
    const noise = n => { const v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
    context.fillStyle = '#8d908b'; context.fillRect(0, 0, width, height);
    for (let i = 0; i < 2600; i++) { context.fillStyle = noise(i) < .5 ? 'rgba(0,0,0,.07)' : 'rgba(255,255,255,.06)'; context.fillRect(noise(i + .3) * width, noise(i + .7) * height, 2 + noise(i + .1) * 7, 2 + noise(i + .9) * 5); }
    for (let x = 0; x < width; x += width / 4) { context.fillStyle = 'rgba(0,0,0,.18)'; context.fillRect(x, 0, 3, height); }
    const grime = context.createLinearGradient(0, height * .55, 0, height); grime.addColorStop(0, 'rgba(30,34,30,0)'); grime.addColorStop(1, 'rgba(30,34,30,.55)');
    context.fillStyle = grime; context.fillRect(0, 0, width, height);
    return noise;
  }
  const wallBack = (() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const context = canvas.getContext('2d');
    concrete(context, 1024, 512, 9);
    context.save(); context.translate(512, 270); context.rotate(-.05); context.textAlign = 'center';
    context.font = 'bold 170px Impact, "Arial Black", sans-serif'; context.lineWidth = 16; context.strokeStyle = '#111415'; context.strokeText('KONG', 0, 0); context.fillStyle = '#e2d8c0'; context.fillText('KONG', 0, 0);
    context.font = 'bold 44px monospace'; context.fillStyle = '#111415'; context.fillText('NO REALITY · JUST NOISE', 0, 90); context.restore();
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    return new THREE.MeshStandardMaterial({ map: texture, roughness: .95 });
  })();
  function memberStage(index, at) {
    const set = MEMBER_SET[index], stage = new THREE.Group(); stage.position.set(at.x, 0, at.z); stage.rotation.y = at.facing; city.add(stage);
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    function paint(image) {
      const noise = concrete(context, 1024, 512, index + 1);
      // Rabiscos e respingos de fundo.
      context.lineCap = 'round';
      for (let i = 0; i < 9; i++) { context.strokeStyle = i % 2 ? 'rgba(17,20,21,.55)' : 'rgba(241,236,220,.5)'; context.lineWidth = 5 + noise(i) * 6; context.beginPath(); const x = 380 + noise(i + 2) * 600, y = 330 + noise(i + 5) * 150; context.moveTo(x, y); context.bezierCurveTo(x + 40, y - 50 * noise(i + 1), x + 70, y + 40, x + 110 * noise(i + 4), y - 10); context.stroke(); }
      for (let i = 0; i < 70; i++) { context.fillStyle = i % 3 ? set.accent : '#111415'; context.globalAlpha = .5; context.beginPath(); context.arc(noise(i + 20) * 1024, noise(i + 40) * 512, 1 + noise(i + 60) * 5, 0, Math.PI * 2); context.fill(); }
      context.globalAlpha = 1;
      // Lambe-lambe: papel colado torto com o retrato em close sobre retícula.
      context.save(); context.translate(190, 262); context.rotate(-.06);
      context.fillStyle = 'rgba(0,0,0,.35)'; context.fillRect(-148, -212, 310, 440);
      context.fillStyle = '#ece6d4'; context.fillRect(-155, -220, 310, 440);
      context.fillStyle = set.accent; context.fillRect(-140, -205, 280, 330);
      context.fillStyle = 'rgba(17,20,21,.28)'; for (let y = -200; y < 120; y += 14) for (let x = -135 + (y / 14 % 2) * 7; x < 135; x += 14) { context.beginPath(); context.arc(x, y, 2.6 + (y + 200) / 90, 0, Math.PI * 2); context.fill(); }
      if (image) context.drawImage(image, image.width * .14, image.height * .02, image.width * .72, image.height * .52, -140, -205, 280, 330);
      context.fillStyle = '#111415'; context.font = 'bold 54px Impact, "Arial Black", sans-serif'; context.textAlign = 'center'; context.fillText(set.role.split(' · ')[0], 0, 185, 270);
      context.font = 'bold 20px monospace'; context.fillText('AO VIVO · KONG STUDIOS', 0, 210, 270);
      context.fillStyle = 'rgba(214,202,150,.85)'; for (const [x, y, turn] of [[-150, -215, -.6], [150, -215, .6], [-150, 215, .6], [150, 215, -.6]]) { context.save(); context.translate(x, y); context.rotate(turn); context.fillRect(-34, -11, 68, 22); context.restore(); }
      context.restore();
      // Nome em spray, com contorno grosso e tinta escorrida.
      context.save(); context.translate(690, 235); context.rotate(.035); context.textAlign = 'center';
      context.font = `bold ${set.name.length > 4 ? 190 : 250}px Impact, "Arial Black", sans-serif`; context.lineJoin = 'round';
      context.shadowColor = set.accent; context.shadowBlur = 38; context.fillStyle = set.accent; context.fillText(set.name, 0, 0, 600); context.shadowBlur = 0;
      context.lineWidth = 16; context.strokeStyle = '#111415'; context.strokeText(set.name, 0, 0, 600); context.fillStyle = set.accent; context.fillText(set.name, 0, 0, 600);
      context.fillStyle = '#f1ecdc'; context.fillRect(-250, -30 - (set.name.length > 4 ? 140 : 185), 90, 9);
      for (let i = 0; i < 8; i++) { const x = -270 + noise(i + 80) * 540, length = 30 + noise(i + 90) * 90; context.fillStyle = set.accent; context.fillRect(x, 0, 7, length); context.beginPath(); context.arc(x + 3.5, length, 6, 0, Math.PI * 2); context.fill(); }
      context.restore();
      // Função em estêncil e uma assinatura de canto.
      context.fillStyle = '#111415'; context.font = 'bold 52px monospace'; context.textAlign = 'left'; context.fillText(set.role, 400, 400, 590);
      context.fillRect(400, 414, 200, 7);
      context.save(); context.translate(900, 470); context.rotate(-.1); context.font = 'bold 40px Impact, sans-serif'; context.fillStyle = '#f1ecdc'; context.fillText(set.tag, -90, 0); context.restore();
      texture.needsUpdate = true;
    }
    paint(null);
    const image = new Image(); image.onload = () => paint(image); image.src = `/assets/portraits/phase7-${set.key}.png`;
    // Muro, arte na frente, pichação genérica no verso e um tubo de luz na cor do integrante.
    box(stage, [8.8, 4.5, .4], [0, 1.95, -3.6], '#7c7f7a');
    const front = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), new THREE.MeshStandardMaterial({ map: texture, roughness: .95 })); front.position.set(0, 2, -3.39); front.receiveShadow = true; stage.add(front);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), wallBack); back.position.set(0, 2, -3.81); back.rotation.y = Math.PI; stage.add(back);
    box(stage, [8.8, .12, .12], [0, 4.32, -3.3], set.accent, true).castShadow = false;
    // Tablado de paletes: tampo de madeira e saia escura com frestas.
    const deck = box(stage, [8, .26, 5.6], [0, -.13, -.4], '#8b6a45'); deck.material = surfaces.get('wood', 4, 3); deck.castShadow = false;
    for (let i = 0; i < 7; i++) box(stage, [.9, .24, .08], [-3.3 + i * 1.1, -.14, 2.42], '#2a2420').castShadow = false;
    // Caixas de som empilhadas nos dois lados.
    for (const side of [-1, 1]) for (const [y, size] of [[.75, 1.5], [2.05, 1.05]]) {
      box(stage, [size, size, 1], [side * 3.45, y, -2.6], '#17191b');
      const cone = cylinder(stage, size * .33, size * .33, .08, [side * 3.45, y, -2.07], '#2e3236', 20); cone.rotation.x = Math.PI / 2; cone.castShadow = false;
      const cap = cylinder(stage, size * .12, size * .12, .1, [side * 3.45, y, -2.05], set.accent, 12); cap.rotation.x = Math.PI / 2; cap.castShadow = false;
    }
    // Engradados e um cabo no chão.
    box(stage, [.8, .6, .8], [-2.5, .3, 1.5], set.accent); box(stage, [.8, .6, .8], [-2.7, .9, 1.45], '#2a3036').rotation.y = .3;
    box(stage, [2.6, .05, .08], [1.2, .03, 1.2], '#111415').rotation.y = .4;
    if (index === 0) {
      // 2-D: estojos de teclado e um retorno de palco.
      box(stage, [2.4, .5, .8], [2, .25, 1.2], '#17191b').rotation.y = .2; box(stage, [2.2, .08, .08], [2, .52, 1.2], set.accent).rotation.y = .2;
      box(stage, [1.1, .7, .8], [-1.4, .35, 1.6], '#2a3036').rotation.x = -.35;
    } else if (index === 1) {
      // Murdoc: cabeçote de baixo, tambor de óleo e pneus.
      box(stage, [1.3, .45, .7], [2.2, .23, .2], '#2a3036'); box(stage, [1.1, .1, .05], [2.2, .3, .56], set.accent, true).castShadow = false;
      cylinder(stage, .55, .55, 1.3, [-2.2, .65, .3], '#6a4632', 16); cylinder(stage, .57, .57, .08, [-2.2, 1.0, .3], '#3a2a20', 16);
      for (let i = 0; i < 3; i++) { const tyre = new THREE.Mesh(new THREE.TorusGeometry(.5, .2, 8, 18), material('#151618')); tyre.rotation.x = Math.PI / 2; tyre.position.set(2.6, .2 + i * .38, 1.7); tyre.castShadow = true; stage.add(tyre); }
    } else if (index === 2) {
      // Noodle: amplificador pequeno, pedaleira e lanternas de papel.
      box(stage, [1.1, .95, .6], [2.1, .48, .3], '#2a3036'); box(stage, [.95, .6, .04], [2.1, .42, .62], '#c9b98f');
      box(stage, [1.5, .08, .5], [.4, .04, 1.6], '#17191b'); for (let i = 0; i < 4; i++) box(stage, [.24, .1, .32], [-.1 + i * .34, .11, 1.6], ['#f5a9c6', '#ffcc4d', '#7fa6ff', '#9dd66b'][i]);
      for (let i = 0; i < 4; i++) { cylinder(stage, .012, .012, .7, [-2.4 + i * 1.6, 3.95, -3.05], '#111415', 5); sphere(stage, .3, [-2.4 + i * 1.6, 3.45, -3.05], i % 2 ? '#f5a9c6' : '#fff4c7', [1, 1.15, 1]).material = material(i % 2 ? '#f5a9c6' : '#fff4c7', true); }
    } else {
      // Russel: estojos de bateria empilhados e um toca-fitas.
      for (const [x, y, r] of [[-1.9, .45, .9], [-1.9, 1.25, .7]]) cylinder(stage, r, r, .7, [x, y, 1.1], '#17191b', 18);
      box(stage, [1.3, .6, .4], [2.3, .3, 1.3], '#2a3036'); for (const side of [-1, 1]) { const grille = cylinder(stage, .2, .2, .05, [2.3 + side * .38, .3, 1.52], '#9a9d8b', 14); grille.rotation.x = Math.PI / 2; }
    }
  }
  // Modelos densos só entram no mapa de sombras perto do carro; longe, a sombra não seria vista.
  // Ao longe, viram um cartaz: uma foto do próprio modelo, tirada uma única vez na carga,
  // substitui dezenas de milhares de triângulos que ocupariam poucos pixels na tela.
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
  installEnvironment(scene, renderer, surfaces, heavyCaster);
  installCity(scene, surfaces);
  const landmarks = installLandmarks(scene, material, bake);
  sign('MURAIS ←|MOINHO →', {x:11,z:-40.5,heading:.25}, '#7fa6ff');
  const discoveryObjects = DISCOVERIES.map((point, i) => {
    const group = new THREE.Group(); group.position.set(point.x,0,point.z); group.rotation.y = point.facing; scene.add(group);
    const paving = cylinder(group,4.5,4.7,.14,[0,-.11,0],'#687463',40);paving.material=surfaces.get('earth',3);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(3.9,.035,6,40),material('#f5a9c6',true));glow.rotation.x=Math.PI/2;glow.position.y=.01;group.add(glow);
    if(i===0) {
      const wall=box(group,[9.4,4.8,.35],[0,2.2,-3],'#d5c6a6');wall.material=surfaces.get('plaster',3,2);
      const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const ctx=canvas.getContext('2d');
      ctx.fillStyle='#b2ad8d';ctx.fillRect(0,0,1536,768);
      // Original graphic mural: expressive sound lines, graphic faces and dates.
      ctx.fillStyle='#314a51';ctx.beginPath();ctx.ellipse(400,390,230,250,-.1,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#63929e';ctx.beginPath();ctx.moveTo(185,265);ctx.lineTo(260,65);ctx.lineTo(335,160);ctx.lineTo(440,30);ctx.lineTo(485,160);ctx.lineTo(620,75);ctx.lineTo(570,285);ctx.closePath();ctx.fill();
      ctx.fillStyle='#d8d0aa';for(const x of [310,475]){ctx.beginPath();ctx.ellipse(x,350,35,45,0,0,Math.PI*2);ctx.fill();}
      ctx.strokeStyle='#dc8e9a';ctx.lineWidth=16;ctx.lineCap='round';
      for(let j=0;j<5;j++){ctx.beginPath();for(let k=0;k<28;k++){const x=710+k*25,y=245+j*68+Math.sin(k*.7+j)*33;if(k===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
      ctx.fillStyle='#263e42';ctx.font='bold 100px monospace';ctx.fillText('1998',755,165);ctx.font='bold 57px monospace';ctx.fillText('DUAS MENTES.',730,680);ctx.fillText('UM UNIVERSO.',730,735);
      const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
      const mural=new THREE.Mesh(new THREE.PlaneGeometry(8.8,4.4),new THREE.MeshStandardMaterial({map:texture,roughness:1,metalness:0}));mural.position.set(0,2.2,-2.81);group.add(mural);
    } else if(i===1) {
      const archive=box(group,[4.9,4,.8],[0,1.9,-2.5],'#596357');archive.material=surfaces.get('wood',2);
      for(let k=0;k<4;k++){const page=box(group,[1.05,2.9,.04],[-1.8+k*1.2,2,-2.07],'#e2d8c0');page.rotation.z=(k%2?1:-1)*.04;}
      const heading=new THREE.Mesh(new THREE.PlaneGeometry(4.3,.55),new THREE.MeshStandardMaterial({map:letteringTexture('QUATRO ROSTOS',{height:128}),roughness:1}));heading.position.set(0,3.7,-2.03);group.add(heading);
    } else if(i===2) {
      const radio=box(group,[3.5,2.2,1.1],[0,1.4,-2],'#626d60');radio.material=surfaces.get('wood');
      for(const x of [-1,1]){const speaker=cylinder(group,.55,.55,.12,[x,1.4,-1.38],'#171d20',32);speaker.rotation.x=Math.PI/2;}
      const display=box(group,[1,.45,.1],[0,1.9,-1.4],'#9bb79b',true);display.castShadow=false;
      const antenna=cylinder(group,.025,.025,3.7,[1.3,3.5,-2],'#9a9d8b',8);antenna.rotation.z=-.25;
      box(group,[4,.24,1.8],[0,.18,-2],'#5c5545').material=surfaces.get('wood');
    } else if(i===3) {
      for(const x of [-1.7,1.7])box(group,[.15,.9,1.6],[x,.3,-2.1],'#343d35');
      box(group,[4.6,.18,1.7],[0,.8,-2.1],'#9d9471').material=surfaces.get('wood',3);
      box(group,[4.6,1,.18],[0,1.35,-2.85],'#9d9471').material=surfaces.get('wood',3);
      const plaque=new THREE.Mesh(new THREE.PlaneGeometry(3,.7),new THREE.MeshStandardMaterial({map:letteringTexture('DEMON DAYS / 2005',{height:128}),roughness:1}));plaque.position.set(0,.6,-.9);plaque.rotation.x=-.2;group.add(plaque);
    } else {
      box(group,[8,.45,4],[0,.1,-1.3],'#76664c').material=surfaces.get('wood',4,2);
      for(const x of [-2.8,2.8]){box(group,[1.2,2,1],[x,1.3,-2.3],'#252c28');const cone=cylinder(group,.42,.42,.1,[x,1.3,-1.74],'#101916',24);cone.rotation.x=Math.PI/2;}
      cylinder(group,.045,.045,3.3,[0,1.7,-1.1],'#9d9e8e',10);sphere(group,.18,[0,3.3,-1.1],'#252c28');
    }
    const beacon=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),material('#f5a9c6',true));beacon.position.set(0,5.5,-2.8);group.add(beacon);
    bake(group,[glow,beacon]);
    return {group,glow,beacon};
  });
  const island=new THREE.Group();scene.add(island);
  const satellites=new THREE.Group();island.add(satellites);
  const portal=new THREE.Group();island.add(portal);
  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) {
    dustPositions[i * 3] = Math.sin(i * 43.17) * 95;
    dustPositions[i * 3 + 1] = 3 + (i * 17 % 70);
    dustPositions[i * 3 + 2] = Math.cos(i * 12.79) * 160;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({color:'#e2d8c0',size:.12,transparent:true,opacity:.45,depthWrite:false}));
  scene.add(dust);
  // Original provisional landmark, not the non-downloadable Sketchfab asset.
  const windmill = new THREE.Group(); windmill.position.set(80, 15, -163); scene.add(windmill);
  const floatingRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), surfaces.get('earth',3));
  floatingRock.scale.set(17, 6, 14); floatingRock.position.y = -3; floatingRock.rotation.z = .12; windmill.add(floatingRock);
  cylinder(windmill, 14, 15, 1.4, [0, 0, 0], '#68806a', 12);
  cylinder(windmill, 3, 4.7, 17, [0, 9, 0], '#a28c73', 32).material=surfaces.get('plaster',3,5);
  cylinder(windmill, 0, 5.4, 5.5, [0, 20.1, 0], '#485e64', 32).material=surfaces.get('roof',3);
  box(windmill, [1.7, 3.4, .15], [0, 3, 4.25], '#202b2e');
  for (const x of [-1.5, 1.5]) box(windmill, [1.1, 1.6, .15], [x, 9, 3.5], '#d2e2a8', true);
  const rotor = new THREE.Group(); rotor.position.set(0, 15, 4.8); windmill.add(rotor);
  const hub = cylinder(rotor, .7, .7, .9, [0, 0, .1], '#d2e2a8'); hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group(); blade.rotation.z = i * Math.PI / 2; rotor.add(blade);
    box(blade, [.2, 12, .25], [0, 5.7, 0], '#303d39');
    box(blade, [2.6, 7.5, .12], [1.1, 7.6, 0], '#c5bd9c').material=surfaces.get('wood',1,3);
    for (let j = 0; j < 6; j++) box(blade, [2.7, .09, .2], [1.1, 4.2 + j * 1.3, .1], '#48584a');
  }
  for (let i = 0; i < 5; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4 + i % 2, 5), material('#4c6d5b'));
    tuft.position.set(Math.cos(i * 1.3) * 10, 2, Math.sin(i * 1.3) * 9); windmill.add(tuft);
  }
  bake(rotor); bake(windmill, [rotor]);
  const districtLights = CITY_ERAS.map(({light}) => ({
    sun: new THREE.Color(light.sun), sky: new THREE.Color(light.sky), haze: new THREE.Color(light.haze),
  }));
  const groundColors = ['#34433f','#423b4f','#365b57','#5b4940','#443d57','#44586a','#3b5b50','#50414c'].map(color => new THREE.Color(color));
  const cabin = createCabin();
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
  const {driver,driverHead,driverArms} = createDriver(material);
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
    car.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
    car.clear(); car.add(vehicle); car.updateWorldMatrix(true, true); modelWheels = [];
    const wheelGroups = wheelMeshes.map(mesh => {
      const box = new THREE.Box3().setFromObject(mesh); const center = box.getCenter(new THREE.Vector3());
      const pivot = new THREE.Group(); pivot.position.copy(car.worldToLocal(center));
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
      driver.position.set(cabin.eye.x, cabin.eye.y - 2.24 * driver.scale.y, cabin.eye.z - .02);
    }
    bake(vehicle); car.add(driver, cabin.root);
    vehicleStatus.textContent = kind === 'geep' ? 'GEEP / SHABAEV / CC BY 4.0' : 'SUV KENNEY / CC0 · VEÍCULO ALTERNATIVO';
    vehicleStatus.dataset.loaded = 'true'; vehicleStatus.dataset.model = kind; vehicleStatus.dataset.wheels = String(modelWheels.length);
  }
  async function loadVehicle() {
    const loader = new GLTFLoader();
    try { installVehicle(await loader.loadAsync('/assets/models/gorillaz-geep.glb'), 'geep'); }
    catch (error) {
      console.warn('Geep indisponível; tentando o SUV local:', error.message);
      try { installVehicle(await loader.loadAsync('/assets/models/kenney-suv.glb'), 'kenney'); }
      catch (fallbackError) {
        console.warn('SUV indisponível; veículo geométrico mantido:', fallbackError.message);
        vehicleStatus.textContent = 'VEÍCULO GEOMÉTRICO / MODO ALTERNATIVO'; vehicleStatus.dataset.loaded = 'false';
      }
    }
  }
  loadVehicle();
  function person(index) {
    const g = new THREE.Group();
    const skin = ['#e2d8c0', '#91a568', '#e2d8c0', '#986b50'][index];
    const shirt = ['#f2559c', '#24242c', '#3a68d8', '#e2d8c0'][index];
    const wide = index === 3 ? 1.3 : 1;
    for (const x of [-.43, .43]) {
      box(g, [.48, 1.5, .55], [x, 1.05, 0], '#252333'); box(g, [.58, .3, .9], [x, .23, -.12], '#11131c');
    }
    box(g, [1.5 * wide, 1.8, .8], [0, 2.65, 0], shirt);
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * (.95 * wide), 3.25, 0);
      box(arm, [.38, 1.6, .42], [0, -.65, 0], skin); g.add(arm); arms.push(arm);
    }
    sphere(g, .85, [0, 4.35, 0], skin, [wide, 1.18, .9]);
    for (const x of [-.3, .3]) sphere(g, .15, [x, 4.45, -.69], '#141414', [1, 1.25, .5]);
    box(g, [.45, .06, .05], [0, 3.99, -.75], '#141414');
    const hair = index === 0 ? '#3a68d8' : '#141414';
    sphere(g, .86, [0, 4.96, .02], hair, [wide, .48, .95]);
    if (index !== 3) for (let i = 0; i < 5; i++) {
      const tuft = box(g, [.36, .65, .6], [-.65 + i * .32, 5.05 + i % 2 * .2, -.12], hair); tuft.rotation.z = (i - 2) * .18;
    }
    if (index === 2) { sphere(g, .5, [-.75, 4.4, 0], '#141414', [.5, 1.4, 1]); sphere(g, .5, [.75, 4.4, 0], '#141414', [.5, 1.4, 1]); }
    if (index === 1 || index === 2) {
      const guitar = sphere(g, .7, [.7, 2.4, -.6], index === 1 ? '#f2559c' : '#e2d8c0', [.7, 1, .22]); guitar.rotation.z = -.5;
      const neck = box(g, [.16, 2.2, .14], [1.18, 3.3, -.65], '#b89a72'); neck.rotation.z = -.4;
    }
    if (index === 3) { const drum = cylinder(g, .9, .9, .65, [0, 2.1, -1.05], '#3a68d8'); drum.rotation.x = Math.PI / 2; }
    return { group: g, arms };
  }
  const people = MEMBER_LOCATIONS.map((at, index) => {
    const actor = person(index); actor.group.position.set(at.x, 0, at.z); actor.group.rotation.y = at.heading + Math.PI;
    actor.group.userData.member = index; actor.group.traverse(object => { object.userData.member = index; }); scene.add(actor.group);
    memberStage(index, at);
    return actor;
  });
  bake(city);
  // Cor de bairro no chão: cada época tinge o terreno do seu território com a cor que já usa
  // no portal e no minimapa, com transição suave nas divisas.
  {
    const size = 96, tint = document.createElement('canvas'); tint.width = tint.height = size;
    const context = tint.getContext('2d');
    for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
      context.fillStyle = CITY_ERAS[eraAt({ x: -140 + i / (size - 1) * 280, z: -200 + j / (size - 1) * 250 })].color; context.fillRect(i, j, 1, 1);
    }
    const soft = document.createElement('canvas'); soft.width = soft.height = size * 2;
    const blur = soft.getContext('2d'); blur.filter = 'blur(7px)'; blur.drawImage(tint, 0, 0, size * 2, size * 2); blur.filter = 'none';
    blur.globalAlpha = .5; blur.drawImage(tint, 0, 0, size * 2, size * 2);
    const map = new THREE.CanvasTexture(soft); map.colorSpace = THREE.SRGBColorSpace;
    const wash = new THREE.Mesh(new THREE.PlaneGeometry(280, 250), new THREE.MeshStandardMaterial({ map, transparent: true, opacity: .38, roughness: 1, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
    wash.rotation.x = -Math.PI / 2; wash.position.set(0, -.295, -75); wash.receiveShadow = true; wash.renderOrder = 1; scene.add(wash);
  }
  // Pontos de valor: um facho de luz e uma etiqueta acima de cada história e de cada integrante,
  // visíveis de longe. Rosa = história a encontrar, verde = já no diário, cor própria = integrante.
  const MEMBER_ACCENTS = ['#7fa6ff', '#9dd66b', '#f5a9c6', '#ffcc4d'];
  function valueMarker(at, text, color) {
    const group = new THREE.Group(); group.position.set(at.x, 0, at.z); scene.add(group);
    const beamMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .2, depthWrite: false, side: THREE.DoubleSide });
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.25, .8, 30, 12, 1, true), beamMaterial); beam.position.y = 21; group.add(beam);
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 128;
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false })); label.position.y = 9.2; group.add(label);
    const context = canvas.getContext('2d');
    function paint(line, accent) {
      context.clearRect(0, 0, 512, 128); context.fillStyle = '#111415e6'; context.beginPath(); context.roundRect(4, 14, 504, 100, 18); context.fill();
      context.strokeStyle = accent; context.lineWidth = 6; context.stroke();
      context.fillStyle = accent; context.beginPath(); context.arc(52, 64, 16, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#f1ecdc'; context.font = 'bold 44px Arial, sans-serif'; context.textBaseline = 'middle'; context.fillText(line, 86, 66, 410);
      texture.needsUpdate = true; beamMaterial.color.set(accent);
    }
    paint(text, color);
    return { group, label, paint, state: null };
  }
  const storyMarkers = DISCOVERIES.map((point, i) => valueMarker(behind(point, 3), `HISTÓRIA ${i + 1} · ${point.kind}`, '#f5a9c6'));
  const memberMarkers = MEMBER_LOCATIONS.map((at, i) => valueMarker(at, ['2-D', 'MURDOC', 'NOODLE', 'RUSSEL'][i], MEMBER_ACCENTS[i]));
  const bandStatus = document.querySelector('#band-status');
  async function loadBand() {
    try {
    // Versão para a cena: texturas WebP de 1024 px e malha simplificada. O GLB original segue disponível para download.
    const bandLoader = new GLTFLoader();
    const gltf = await bandLoader.loadAsync('/assets/models/gorillaz-phase7-web.glb').catch(() => bandLoader.loadAsync('/assets/models/gorillaz-phase7.glb'));
    const roots = Array(4).fill(null);
    gltf.scene.traverse(object => { if (Number.isInteger(object.userData.memberIndex) && object.userData.memberIndex >= 0 && object.userData.memberIndex < 4) roots[object.userData.memberIndex] = object; });
    if (roots.length !== 4 || roots.some(root => !root)) throw new Error('O pacote precisa conter os quatro integrantes identificados');
    gltf.scene.updateWorldMatrix(true, true);
    const bounds = roots.map(root => new THREE.Box3().setFromObject(root));
    const scale = 6.2 / Math.max(...bounds.map(box => box.max.y - box.min.y));
    roots.forEach((model, index) => {
      const center = bounds[index].getCenter(new THREE.Vector3());
      const centered = new THREE.Group(); centered.add(model); centered.position.set(-center.x, -bounds[index].min.y, -center.z);
      const visual = new THREE.Group(); visual.add(centered); visual.scale.setScalar(scale); visual.rotation.y = Math.PI;
      visual.position.y = .03;
      visual.traverse(object => {
        object.userData.member = index;
        if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      // Cada integrante chega em várias malhas com o mesmo material: fundidas, viram uma chamada.
      bake(visual);
      // Braços em pose de tocar e instrumento na escala do corpo (band-pose.js); as baquetas ficam soltas para acompanhar as mãos.
      const rig = rigBand(visual, index, material); bake(rig.kit, rig.sticks);
      visual.traverse(object => { object.userData.member = index; });
      const actor = people[index]; actor.rig = rig;
      heavyCaster(visual, actor.group.position, -1);
      actor.group.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
      actor.group.clear(); actor.group.add(visual); actor.arms = [];
    });
    bandStatus.textContent = 'PHASE 7 / QUATRO INTEGRANTES NO CIRCUITO';
    bandStatus.dataset.loaded = 'true'; bandStatus.dataset.count = '4';
    } catch (error) {
    console.warn('Banda Phase 7 indisponível; personagens geométricos mantidos:', error.message);
    bandStatus.textContent = 'PERSONAGENS GEOMÉTRICOS / MODO ALTERNATIVO'; bandStatus.dataset.loaded = 'false';
    }
  }
  loadBand();
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
    if (firstPerson || overview || !live.vehicle) return null;
    const slow = Math.abs(live.vehicle.speed) < 2;
    if (!live.reduced && Math.abs(live.vehicle.speed)<=.05 && driver.visible && hitAt(event,[driverHead])) return {type:'driver'};
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
    if (firstPerson && interacting) return;
    steeringDrag = firstPerson && Boolean(hitAt(event,[cabin.wheel]));
    dragging = {x:event.clientX, y:event.clientY, origin:event.clientX};
    renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.style.cursor = 'grabbing';
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (driverPointerStart && Math.hypot(event.clientX-driverPointerStart.x,event.clientY-driverPointerStart.y)>4) driverDragged=true;
    if (firstPerson && interacting) {
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
    if (firstPerson) {
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
    if (firstPerson) {
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
  renderer.domElement.addEventListener('dblclick', event => { if (firstPerson && interacting) return; event.preventDefault(); onFullscreen(); });
  renderer.domElement.addEventListener('keydown', event => {
    if (event.key === 'Home') { dragAngle = 0; dragElevation = 0; zoom = 1; overview = false; landmarkView = false; onViewReset(); event.preventDefault(); }
  });
  function resize() {
    const width = container.clientWidth; const height = container.clientHeight;
    if (width <= 0 || height <= 0) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  let previousDistance = 0; let lightingReady = false;
  let overview = false;
  let firstPerson = false;
  let landmarkView = false;
  const look = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  let previousTime = null; let initialized = false;
  let impact = 0, intro = false; const tumbleYaw = new THREE.Quaternion(), upAxis = new THREE.Vector3(0, 1, 0);
  // Prédios como caixas orientadas: a câmera de viagem encurta o braço em vez de atravessar fachadas.
  const blockers = [...CITY_LOTS.map(lot => ({ x: lot.x, z: lot.z, cos: Math.cos(lot.rotation), sin: Math.sin(lot.rotation), halfW: lot.w / 2 + 1.2, halfD: lot.d / 2 + 1.2, top: lot.floors * 3.2 + 1.5 })),
    ...ERA_GATES.map(gate => ({ x: gate.x, z: gate.z, cos: Math.cos(gate.heading), sin: Math.sin(gate.heading), halfW: gate.width / 2 + 4, halfD: 1.5, top: 12 })),
    { x: -28, z: 6, cos: 1, sin: 0, halfW: 8, halfD: 8, top: 16 }];
  function clearReach(x, z, angle, radius, height) {
    const sin = Math.sin(angle), cos = Math.cos(angle);
    for (let reach = 8; reach <= radius; reach += 1.25) {
      const px = x + sin * reach, pz = z + cos * reach, py = 2 + (height - 2) * reach / radius;
      // Três amostras lado a lado: a vista precisa de um corredor livre, não de uma fresta entre prédios.
      for (const lot of blockers) {
        if (py > lot.top) continue;
        for (const side of [0, -2.5, 2.5]) {
          const dx = px + cos * side - lot.x, dz = pz - sin * side - lot.z;
          if (Math.abs(dx * lot.cos - dz * lot.sin) < lot.halfW && Math.abs(dx * lot.sin + dz * lot.cos) < lot.halfD) return Math.max(8, reach - 1.25);
        }
      }
    }
    return radius;
  }
  // Resolução adaptativa: mede o intervalo real entre quadros e ajusta a densidade de pixels.
  // A aplicação não chama update com a aba oculta, então todo intervalo recebido é desempenho real.
  let pace = 0, paceCheck = null, raiseAfter = 0, raiseBackoff = 4, lastRaise = -Infinity, slowAtFloor = 0;
  function adapt(dt, t) {
    if (dt <= 0) return;
    // Os primeiros segundos têm travadas de carga (modelos, texturas, shaders) que não representam o ritmo normal.
    if (paceCheck === null) paceCheck = t + 4;
    if (t < paceCheck) return;
    const budget = compact ? 1 / 30 : 1 / 60;
    pace = pace ? pace + (dt - pace) * .06 : dt;
    if (t - paceCheck < 1) return; paceCheck = t;
    let next = pixelRatio;
    if (pace > budget * 1.3) {
      next = Math.max(minRatio, pixelRatio * .85);
      if (t - lastRaise < 4) raiseBackoff = Math.min(60, raiseBackoff * 2);
      raiseAfter = t + raiseBackoff;
      // Três segundos no piso de resolução e ainda lento: o bloom é o próximo a sair.
      slowAtFloor = next === pixelRatio ? slowAtFloor + 1 : 0;
      if (slowAtFloor >= 3 && postfx) { postfx.dispose(); postfx = null; renderer.domElement.dataset.quality = 'padrao'; }
    } else if (pace < budget * 1.08 && pixelRatio < maxRatio && t > raiseAfter) { next = Math.min(maxRatio, pixelRatio * 1.1); lastRaise = t; slowAtFloor = 0; }
    if (next !== pixelRatio) { pixelRatio = next; renderer.setPixelRatio(pixelRatio); pace = 0; renderer.domElement.dataset.pixelRatio = pixelRatio.toFixed(2); }
  }
  return {
    // Usado por ?perf e pelos scripts de medição.
    debug: { renderer, scene, camera, setSize(width, height) { renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); } },
    setOverview(value) { overview = value; landmarkView = false; firstPerson = false; },
    // Abertura: câmera mais baixa e deslocada, para o Geep e a banda ficarem no terço direito e o título respirar.
    setIntro(value) { intro = value; },
    setInteraction(value) { interacting = firstPerson && value; highlight(null); release(); },
    recenter() { yaw = pitch = 0; },
    configureLook(gain, intensity) { sensitivity = gain; motion = intensity; },
    setFirstPerson(value) { interacting = false; yaw = pitch = smoothYaw = smoothPitch = 0; highlight(null); release(); firstPerson = value; overview = false; landmarkView = false; initialized = false; },
    focusWindmill(value) { landmarkView = value; overview = false; },
    zoomBy(amount) { zoom = THREE.MathUtils.clamp(zoom + amount, .7, 1.6); },
    resetCamera() { firstPerson = false; dragAngle = 0; dragElevation = 0; zoom = 1; overview = false; landmarkView = false; },
    update(vehicle, time, orbit, reduced, showcase, known, nearby) {
      live.vehicle = vehicle; live.showcase = showcase; live.nearby = nearby; live.reduced=reduced;
      const {x,z,heading} = vehicle; const t = time / 1000; const moving = Math.abs(vehicle.speed) > .1;
      const dt = previousTime === null ? .016 : Math.max(0, Math.min((time - previousTime) / 1000, .1)); previousTime = time;
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 4);
      const light = districtLights[eraAt(vehicle)];
      const fade = lightingReady ? 1 - Math.exp(-dt * 1.6) : 1;
      sunlight.color.lerp(light.sun, fade);
      skylight.color.lerp(light.sky, fade);
      scene.fog.color.lerp(light.haze, fade);
      scene.background.copy(scene.fog.color);
      atmosphere.update(sunlight.color, skylight.color, scene.fog.color, t, reduced); atmosphere.follow(x, z);
      adapt(dt, t); landmarks.update(t, reduced);
      lightingReady = true;
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, overview ? .001 : landmarkView ? .002 : .0035, blend);
      island.visible = showcase; island.position.set(x,0,z);
      dust.position.set(x, 0, z);
      if (!reduced) { rotor.rotation.z = -t * .3; windmill.position.y = 15 + Math.sin(t * .65) * .5; dust.rotation.y = Math.sin(t * .025) * .15; satellites.rotation.y = Math.sin(t * .1) * .12; portal.rotation.z = Math.sin(t * .07) * .04; }
      car.position.set(x, moving && !reduced ? Math.sin(t * (vehicle.surface==='terra'?19:13)) * (vehicle.surface==='terra'?.07:.025) : 0, z);
      car.rotation.y = heading;
      car.rotation.z = reduced ? 0 : THREE.MathUtils.lerp(car.rotation.z, -vehicle.steering * vehicle.speed * .008, blend);
      car.rotation.x = reduced ? 0 : THREE.MathUtils.lerp(car.rotation.x, THREE.MathUtils.clamp(vehicle.acceleration * -.006,-.06,.06), blend);
      const travelled = vehicle.distanceTravelled - previousDistance;
      modelWheels.forEach(wheel => { wheel.userData.rolling.rotation.x -= travelled / wheel.userData.radius; wheel.rotation.y = wheel.position.z < 0 ? vehicle.steering : 0; });
      if (!modelWheels.length) wheels.forEach(wheel => { wheel.rotation.x -= travelled / .75; });
      previousDistance = vehicle.distanceTravelled;
      // O motorista gira os braços com o volante e olha para dentro da curva.
      driverArms.rotation.z = vehicle.steering * 1.1; driverYaw=THREE.MathUtils.lerp(driverYaw,vehicle.steering*.9,blend);
      if (dragging) driverReaction.cancel();
      const greeting=driverReaction.sample(time/1000,vehicle.speed,reduced);
      driverHead.rotation.set(-.12*greeting,driverYaw+.24*greeting,0);
      const mobile = container.clientWidth < 700;
      const radius = (mobile ? (showcase ? 46 : 29) : (showcase ? 40 : 24)) * zoom + (reduced ? 0 : Math.abs(vehicle.speed)*.12);
      const travelHeading = heading + (vehicle.speed < -.2 ? Math.PI : 0);
      const angle = (orbit && !reduced ? t * .16 : showcase ? .48 : .16) + dragAngle;
      const opening = intro && showcase && !mobile && !overview && !landmarkView;
      const cameraAngle = angle + travelHeading, cameraHeight = (opening ? 8.5 : showcase ? 12 : 11.8) + dragElevation;
      // Dirigindo, a câmera só se aproxima; com a banda reunida, procura um ângulo livre para manter o enquadramento.
      let reach = clearReach(x, z, cameraAngle, radius, cameraHeight), viewAngle = cameraAngle;
      if (showcase && reach < radius) for (const turn of [.45, -.45, .9, -.9, 1.35, -1.35, 1.8, -1.8]) {
        const open = clearReach(x, z, cameraAngle + turn, radius, cameraHeight);
        if (open > reach) { reach = open; viewAngle = cameraAngle + turn; if (open >= radius) break; }
      }
      desiredCamera.set(x + Math.sin(viewAngle) * reach, cameraHeight, z + Math.cos(viewAngle) * reach);
      const ahead = showcase ? 1 : 7 + Math.min(Math.abs(vehicle.speed)*.27,7);
      const courtyardOffset=showcase?(mobile?-2:-8):0;
      look.set(x + courtyardOffset*Math.cos(heading) - Math.sin(travelHeading) * ahead, mobile && showcase ? 3 : 2, z - courtyardOffset*Math.sin(heading) - Math.cos(travelHeading) * ahead);
      if (opening) look.set(x - Math.cos(viewAngle) * 7.5, 3.2, z + Math.sin(viewAngle) * 7.5);
      if (landmarkView) { desiredCamera.set(125 * zoom, 38 + dragElevation, -98); look.set(84, 16, -152); }
      if (overview) { desiredCamera.set(0, 290 * zoom, -74); look.set(0, 0, -75); }
      // Primeira pessoa: o mesmo Geep continua visível; some apenas o boneco, e os olhos ficam
      // no banco do motorista. Não há segundo modelo de cabine para divergir do carro de fora.
      cabin.root.visible = firstPerson; driver.visible = !firstPerson;
      if (steeringPivot) steeringPivot.quaternion.copy(steeringRest).multiply(steeringTurn.setFromAxisAngle(upAxis, THREE.MathUtils.clamp(vehicle.steering * 1.9, -1.05, 1.05) * steeringSign));
      if (firstPerson) {
        car.updateMatrixWorld(true);
        desiredCamera.copy(cabin.eye).applyMatrix4(car.matrixWorld);
        cabinFrame.setFromEuler(cabinEuler.set(car.rotation.x * motion, heading, car.rotation.z * motion, car.rotation.order));
        smoothYaw = THREE.MathUtils.lerp(smoothYaw,interacting ? -.63 : yaw,blend);
        smoothPitch = THREE.MathUtils.lerp(smoothPitch,interacting ? -.54 : pitch-.06,blend);
        look.set(-Math.sin(smoothYaw)*Math.cos(smoothPitch), Math.sin(smoothPitch), -Math.cos(smoothYaw)*Math.cos(smoothPitch)).applyQuaternion(cabinFrame).add(desiredCamera);
        cabin.update(vehicle,radio.read(),{interacting,dt,t,reduced});
      }
      const targetFov = firstPerson ? 70 : reduced ? 46 : 46 + Math.abs(vehicle.speed) * .15;
      camera.fov = THREE.MathUtils.lerp(camera.fov,targetFov,blend); camera.updateProjectionMatrix();
      for (const [i, object] of discoveryObjects.entries()) {
        const found = known.has(DISCOVERIES[i].id); object.glow.material = material(found?'#d2e2a8':'#f5a9c6',true); object.beacon.material = material(found?'#d2e2a8':'#f5a9c6',true);
        object.beacon.position.y = 5.5 + (reduced ? 0 : Math.sin(t*2+i)*.35); object.beacon.rotation.y = reduced ? 0 : t*.7;
        const selected = nearby?.type === 'discovery' && nearby.index === i; object.beacon.scale.setScalar(selected?2.2:1);
        const marker = storyMarkers[i];
        if (marker.state !== found) { marker.state = found; marker.paint(found ? `✓ ${DISCOVERIES[i].kind} NO DIÁRIO` : `HISTÓRIA ${i + 1} · ${DISCOVERIES[i].kind}`, found ? '#d2e2a8' : '#f5a9c6'); }
      }
      // Etiquetas viradas para a câmera; somem na cabine de perto e com a banda reunida.
      for (const marker of [...storyMarkers, ...memberMarkers]) {
        marker.group.visible = !(showcase && memberMarkers.includes(marker)) && Math.hypot(marker.group.position.x - camera.position.x, marker.group.position.z - camera.position.z) > 9;
        marker.label.rotation.y = Math.atan2(camera.position.x - marker.group.position.x, camera.position.z - marker.group.position.z);
      }
      if (!initialized || reduced || firstPerson) { camera.position.copy(desiredCamera); cameraTarget.copy(look); initialized = true; }
      else { camera.position.lerp(desiredCamera, blend); cameraTarget.lerp(look, blend); }
      camera.lookAt(cameraTarget);
      // Tranco de câmera no impacto: curto, proporcional à velocidade, sem acumular no estado da câmera.
      if (impact > .01) { camera.rotateZ(Math.sin(t * 58) * impact * .022); camera.rotateX(Math.sin(t * 47) * impact * .012); impact *= Math.exp(-5 * dt); }
      if (frameCount++ % 2 === 0) aimSun(x, z);
      cardTint.copy(sunlight.color).lerp(skylight.color, .45);
      for (const entry of heavyCasters) {
        const casting = Math.hypot(entry.at.x - x, entry.at.z - z) < 55;
        if (casting !== entry.casting) { entry.casting = casting; for (const mesh of entry.meshes) mesh.castShadow = casting; }
        // Histerese de 10 m evita alternar entre modelo e cartaz na fronteira.
        const range = Math.hypot(entry.at.x - camera.position.x, entry.at.z - camera.position.z);
        const far = !overview && range > (entry.far ? 78 : 88);
        if (far !== entry.far) { entry.far = far; entry.object.visible = !far; entry.card.visible = far; }
        if (far) {
          entry.card.position.set(entry.at.x, (entry.at.y || 0) + entry.card.userData.lift, entry.at.z);
          entry.card.rotation.y = Math.atan2(camera.position.x - entry.at.x, camera.position.z - entry.at.z);
          entry.card.material.color.copy(cardTint);
        }
      }
      for (const [i, actor] of people.entries()) {
        const localSide = i % 2 ? 5.5 : -5.5; const localAlong = i < 2 ? -5 : 3;
        const fixed = MEMBER_LOCATIONS[i];
        const homeYaw = (showcase ? heading : fixed.heading) + Math.PI, place = actor.group.position;
        if (showcase) actor.knock = null;
        const hitDistance = Math.hypot(place.x - x, place.z - z), speed = Math.abs(vehicle.speed);
        const exposed = !actor.knock || actor.knock.phase === 'return' || actor.knock.phase === 'dizzy';
        if (!showcase && exposed && hitDistance < 3.2 && speed > 3) {
          // Atropelamento: o carro varre as pernas, o corpo é lançado na direção da viagem e gira para trás.
          const way = Math.sign(vehicle.speed), fx = -Math.sin(heading) * way, fz = -Math.cos(heading) * way;
          const ax = (place.x - x) / (hitDistance || 1), az = (place.z - z) / (hitDistance || 1);
          if (reduced) actor.knock = { phase: 'return', x: fixed.x + ax * 3, z: fixed.z + az * 3, y: 0, angle: 0, timer: 0, axis: new THREE.Vector3(1, 0, 0), yaw: homeYaw };
          else {
            const push = Math.min(9, speed * .7), vx = fx * push + ax * 2.5, vz = fz * push + az * 2.5, length = Math.hypot(vx, vz) || 1;
            actor.knock = { phase: 'air', x: place.x, z: place.z, y: Math.max(place.y, .05), vx, vz, vy: Math.min(9, 4.2 + speed * .22), angle: 0, spin: 3.5 + speed * .3,
              axis: new THREE.Vector3(-vz / length, 0, vx / length), bounced: false, timer: 0, yaw: homeYaw };
            impact = Math.min(1, speed / 18);
          }
        }
        const knock = actor.knock;
        if (!knock) {
          place.x = showcase ? x + localSide * Math.cos(heading) + localAlong * Math.sin(heading) : fixed.x;
          place.z = showcase ? z - localSide * Math.sin(heading) + localAlong * Math.cos(heading) : fixed.z;
          place.y = reduced ? 0 : Math.sin(t * 2 + i) * .07;
          // Quem vê o carro chegando rápido se inclina para longe antes do impacto.
          const wary = !showcase && !reduced && hitDistance < 11 && speed > 6 ? (1 - hitDistance / 11) * .16 : 0;
          actor.group.rotation.set(wary, homeYaw, 0, 'YXZ');
        } else {
          knock.timer += dt;
          if (knock.phase === 'air') {
            knock.vy -= 24 * dt; knock.x += knock.vx * dt; knock.z += knock.vz * dt; knock.y += knock.vy * dt; knock.angle += knock.spin * dt;
            if (knock.y <= .3 && knock.vy < 0) {
              knock.y = .3; knock.vx *= .5; knock.vz *= .5; knock.spin *= .45;
              if (knock.bounced || knock.vy > -4) { knock.phase = 'slide'; knock.timer = 0; knock.rest = (Math.round(knock.angle / Math.PI - .5) + .5) * Math.PI; }
              else { knock.bounced = true; knock.vy *= -.34; }
            }
          } else if (knock.phase === 'slide') {
            // Deitado: escorrega até parar e assenta de costas ou de bruços, o que estiver mais perto.
            const drag = Math.exp(-4.5 * dt); knock.vx *= drag; knock.vz *= drag; knock.x += knock.vx * dt; knock.z += knock.vz * dt;
            knock.angle += (knock.rest - knock.angle) * (1 - Math.exp(-12 * dt)); knock.y += (.3 - knock.y) * .3;
            if (knock.timer > 1.1 && Math.hypot(knock.vx, knock.vz) < .4) { knock.phase = 'rise'; knock.timer = 0; knock.from = knock.angle; knock.upright = Math.round(knock.angle / (Math.PI * 2)) * Math.PI * 2; }
          } else if (knock.phase === 'rise') {
            const k = Math.min(1, knock.timer / .9), ease = k * k * (3 - 2 * k);
            knock.angle = knock.from + (knock.upright - knock.from) * ease; knock.y = .3 * (1 - ease) + Math.sin(k * Math.PI) * .25;
            if (k >= 1) { knock.phase = 'dizzy'; knock.timer = 0; knock.angle = 0; }
          } else if (knock.phase === 'dizzy') {
            // Em pé, ainda tonto: balança, olha para o carro e só então volta.
            knock.y = 0; knock.sway = Math.sin(knock.timer * 9) * .2 * Math.max(0, 1 - knock.timer / 1.1);
            const toCar = Math.atan2(x - knock.x, z - knock.z) + Math.PI, turn = Math.atan2(Math.sin(toCar - knock.yaw), Math.cos(toCar - knock.yaw));
            knock.yaw += turn * (1 - Math.exp(-6 * dt));
            if (knock.timer > 1.2) { knock.phase = 'return'; knock.timer = 0; knock.sway = 0; }
          } else {
            const dx = fixed.x - knock.x, dz = fixed.z - knock.z, left = Math.hypot(dx, dz), step = Math.min(left, 4.2 * dt);
            if (left < .05) actor.knock = null;
            else {
              knock.x += dx / left * step; knock.z += dz / left * step; knock.y = reduced ? 0 : Math.abs(Math.sin(knock.timer * 9)) * .14;
              const walk = left > 1.2 ? Math.atan2(dx, dz) + Math.PI : homeYaw, turn = Math.atan2(Math.sin(walk - knock.yaw), Math.cos(walk - knock.yaw));
              knock.yaw += turn * (1 - Math.exp(-8 * dt));
            }
          }
          place.set(knock.x, knock.y, knock.z);
          actor.group.quaternion.setFromAxisAngle(knock.axis, knock.angle).multiply(tumbleYaw.setFromAxisAngle(upAxis, knock.yaw));
          if (knock.sway) actor.group.rotateZ(knock.sway);
        }
        // Só anima os braços de quem está perto o bastante para ser visto como malha.
        if (actor.rig && place.distanceTo(camera.position) < 85) actor.rig.pose(t + i, reduced || Boolean(actor.knock));
        if (actor.arms.length) {
          actor.arms[0].rotation.z = i === 1 || i === 2 ? -.55 + Math.sin(t * 8) * .16 : i === 3 ? -.25 + Math.sin(t * 10) * .35 : -.1;
          actor.arms[1].rotation.z = i === 1 || i === 2 ? .45 + Math.cos(t * 8) * .13 : i === 3 ? .25 + Math.cos(t * 10) * .35 : .1;
        }

      }
      renderer.info.reset();
      if (firstPerson) cabin.renderMirror(renderer, scene);
      if (postfx) postfx.render(scene, camera); else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      renderer.domElement.dataset.triangles=String(renderer.info.render.triangles);
      renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);
    },
  };
}
