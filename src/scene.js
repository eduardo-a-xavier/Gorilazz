import { createCabin } from './cabin.js';
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { CITY_ERAS, CITY_LOTS, ERA_GATES, eraAt, ROADS, NODES, REGIONS, DISCOVERIES, MEMBER_LOCATIONS } from './world-data.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { createSurfaceLibrary, letteringTexture } from './materials.js';
import { installEnvironment } from './environment.js';
import { installCity } from './city.js';
import { createAtmosphere } from './atmosphere.js';
import { createPostFX } from './postfx.js';
import { buildRoads } from './roads.js';
import { installLandmarks } from './landmarks.js';

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

// Local credited Geep and Phase 7 models; original scenery and geometric fallbacks.
export function createWorld(container, onMember, {onLost = () => {}, onRestored = () => {}, onViewReset = () => {}, radio, onRadio, onSteer} = {}) {
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
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.BoxGeometry(8, 2.65, .18), new THREE.MeshStandardMaterial({ map: texture, roughness: .7 }));
    board.position.set(0, 4.1, 0); signGroup.add(board);
    for (const dx of [-2.6, 2.6]) box(signGroup, [.18, 3.5, .18], [dx, 1.5, 0], '#777487');
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
  sign('MURAIS ←|MOINHO →', {x:7,z:-43}, '#7fa6ff');
  const discoveryObjects = DISCOVERIES.map((point, i) => {
    const group = new THREE.Group(); group.position.set(point.x,0,point.z); scene.add(group);
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
  const cabin = createCabin(); scene.add(cabin.root);
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
  let modelWheels = [];
  const vehicleStatus = document.querySelector('#vehicle-status');
  function installVehicle(gltf, kind) {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model); const size = bounds.getSize(new THREE.Vector3());
    const scale = 6.6 / size.z; const center = bounds.getCenter(new THREE.Vector3());
    const vehicle = new THREE.Group();
    model.scale.setScalar(scale); model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    vehicle.add(model); vehicle.rotation.y = Math.PI;
    const wheelMeshes = []; const details = [];
    model.traverse(object => {
      if (kind === "geep") cabin.reuse(object);
      if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      if (!object.isMesh) return;
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
    bake(vehicle);
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
    const platform = cylinder(city, 3.6, 4, .4, [at.x, -.08, at.z], '#3a68d8'); platform.castShadow = false; platform.receiveShadow = true;
    sign(['2-D / VOCALS', 'MURDOC / BASS', 'NOODLE / GUITAR', 'RUSSEL / DRUMS'][index], {x:at.x,z:at.z-6}, '#7fa6ff');
    return actor;
  });
  bake(city);
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
      bake(visual); visual.traverse(object => { object.userData.member = index; });
      const actor = people[index];
      heavyCaster(visual, actor.group.position, -1);
      actor.group.traverse(object => { if (object.isMesh) object.geometry.dispose(); });
      actor.group.clear(); actor.group.add(visual); actor.arms = [];
      if (index === 1 || index === 2) {
        const instrument = new THREE.Group();
        instrument.position.set(.25, 2.3, -1.0);
        instrument.rotation.z = -.34;
        const body = new THREE.Mesh(new THREE.CylinderGeometry(.42, .5, .22, 12), material(index === 1 ? '#442a46' : '#c78b4e'));
        body.rotation.x = Math.PI / 2; body.castShadow = true; instrument.add(body);
        const neck = box(instrument, [.16, 2.1, .16], [.38, 1.05, 0], '#a7794b');
        neck.rotation.z = -.25;
        actor.group.add(instrument); actor.instrument = instrument;
      }
      if (index === 3) {
        const drum = cylinder(actor.group, .7, .7, .48, [0, 1.95, -1.05], '#345c75');
        drum.rotation.x = Math.PI / 2;
      }
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
  function highlight(object) {
    if (highlighted) highlighted.material.color.set(0xffffff);
    highlighted = object;
    if (object) object.material.color.set(0xa2ff7c);
  }
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    moved = false;
    if (firstPerson && interacting) return;
    steeringDrag = firstPerson && Boolean(hitAt(event,[cabin.wheel]));
    dragging = {x:event.clientX, y:event.clientY, origin:event.clientX};
    renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.style.cursor = 'grabbing';
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (firstPerson && interacting) {
      const hit = hitAt(event,cabin.controls); highlight(hit);
      renderer.domElement.style.cursor = hit ? 'pointer' : 'default'; return;
    }
    if (!dragging) return;
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
  renderer.domElement.addEventListener('click', event => {
    if (firstPerson) {
      if (interacting) { const action = hitAt(event,cabin.controls)?.userData.action; if (action) onRadio(action); }
      return;
    }
    if (moved) return;
    const bounds = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(people.map(actor => actor.group), true)[0];
    if (hit) onMember(hit.object.userData.member);
  });
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
  let impact = 0; const tumbleYaw = new THREE.Quaternion(), upAxis = new THREE.Vector3(0, 1, 0);
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
    setInteraction(value) { interacting = firstPerson && value; highlight(null); release(); },
    recenter() { yaw = pitch = 0; },
    configureLook(gain, intensity) { sensitivity = gain; motion = intensity; },
    setFirstPerson(value) { interacting = false; yaw = pitch = smoothYaw = smoothPitch = 0; highlight(null); release(); firstPerson = value; overview = false; landmarkView = false; initialized = false; },
    focusWindmill(value) { landmarkView = value; overview = false; },
    zoomBy(amount) { zoom = THREE.MathUtils.clamp(zoom + amount, .7, 1.6); },
    resetCamera() { firstPerson = false; dragAngle = 0; dragElevation = 0; zoom = 1; overview = false; landmarkView = false; },
    update(vehicle, time, orbit, reduced, showcase, known, nearby) {
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
      const mobile = container.clientWidth < 700;
      const radius = (mobile ? (showcase ? 46 : 29) : (showcase ? 40 : 24)) * zoom + (reduced ? 0 : Math.abs(vehicle.speed)*.12);
      const travelHeading = heading + (vehicle.speed < -.2 ? Math.PI : 0);
      const angle = (orbit && !reduced ? t * .16 : showcase ? .48 : .16) + dragAngle;
      const cameraAngle = angle + travelHeading, cameraHeight = (showcase ? 12 : 11.8) + dragElevation;
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
      if (landmarkView) { desiredCamera.set(125 * zoom, 38 + dragElevation, -98); look.set(84, 16, -152); }
      if (overview) { desiredCamera.set(0, 290 * zoom, -74); look.set(0, 0, -75); }
      cabin.root.visible = firstPerson;
      car.visible = !firstPerson;
      if (firstPerson) {
        cabin.root.rotation.set(car.rotation.x * motion,heading,car.rotation.z * motion,car.rotation.order);
        cabin.root.position.set(-.54,2.18,.48).applyQuaternion(cabin.root.quaternion).add(car.position);
        cabin.root.position.y -= car.position.y * (1-motion);
        cabin.root.updateMatrixWorld();
        desiredCamera.copy(cabin.root.position);
        const gain = reduced ? 0 : motion;
        desiredCamera.y += gain * Math.min(.026,Math.abs(vehicle.acceleration)*.003);
        smoothYaw = THREE.MathUtils.lerp(smoothYaw,interacting ? -.61 : yaw,blend);
        smoothPitch = THREE.MathUtils.lerp(smoothPitch,interacting ? -.56 : pitch-.09,blend);
        look.set(-Math.sin(smoothYaw)*Math.cos(smoothPitch), Math.sin(smoothPitch), -Math.cos(smoothYaw)*Math.cos(smoothPitch)).applyQuaternion(cabin.root.quaternion).add(desiredCamera);
        cabin.update(vehicle,radio.read());
      }
      const targetFov = firstPerson ? 76 : reduced ? 46 : 46 + Math.abs(vehicle.speed) * .15;
      camera.fov = THREE.MathUtils.lerp(camera.fov,targetFov,blend); camera.updateProjectionMatrix();
      for (const [i, object] of discoveryObjects.entries()) {
        const found = known.has(DISCOVERIES[i].id); object.glow.material = material(found?'#d2e2a8':'#f5a9c6',true); object.beacon.material = material(found?'#d2e2a8':'#f5a9c6',true);
        object.beacon.position.y = 5.5 + (reduced ? 0 : Math.sin(t*2+i)*.35); object.beacon.rotation.y = reduced ? 0 : t*.7;
        const selected = nearby?.type === 'discovery' && nearby.index === i; object.beacon.scale.setScalar(selected?2.2:1);
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
        if (actor.instrument) actor.instrument.rotation.z = -.34 + (reduced ? 0 : Math.sin(t * 5 + i) * .035);
        if (actor.arms.length) {
          actor.arms[0].rotation.z = i === 1 || i === 2 ? -.55 + Math.sin(t * 8) * .16 : i === 3 ? -.25 + Math.sin(t * 10) * .35 : -.1;
          actor.arms[1].rotation.z = i === 1 || i === 2 ? .45 + Math.cos(t * 8) * .13 : i === 3 ? .25 + Math.cos(t * 10) * .35 : .1;
        }

      }
      renderer.info.reset();
      if (postfx) postfx.render(scene, camera); else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
      renderer.domElement.dataset.triangles=String(renderer.info.render.triangles);
      renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);
    },
  };
}
