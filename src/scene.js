import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { ROADS, NODES, REGIONS, DISCOVERIES, MEMBER_LOCATIONS, BUILDINGS } from './world-data.js';
import { mergeGeometries } from './vendor/BufferGeometryUtils.js';
import { createSurfaceLibrary, letteringTexture } from './materials.js';
import { installEnvironment } from './environment.js';

// Local credited Geep and Phase 7 models; original scenery and geometric fallbacks.
export function createWorld(container, onMember, {onLost = () => {}, onRestored = () => {}, onViewReset = () => {}} = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, container.clientWidth < 700 ? 1.25 : 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Estrada 3D com carro, personagens e cenários musicais');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); onLost(); });
  renderer.domElement.addEventListener('webglcontextrestored', () => onRestored());
  const scene = new THREE.Scene();
  const surfaces = createSurfaceLibrary();
  scene.background = new THREE.Color('#202631');
  scene.fog = new THREE.FogExp2('#202631', .007);
  const skyCanvas=document.createElement('canvas');skyCanvas.width=1024;skyCanvas.height=512;
  const skyContext=skyCanvas.getContext('2d');const skyGradient=skyContext.createLinearGradient(0,0,0,512);
  skyGradient.addColorStop(0,'#253c4a');skyGradient.addColorStop(.46,'#8c9e96');skyGradient.addColorStop(.62,'#b0b2a0');skyGradient.addColorStop(1,'#677b77');
  skyContext.fillStyle=skyGradient;skyContext.fillRect(0,0,1024,512);
  for(let i=0;i<18;i++){skyContext.fillStyle=`rgba(218,222,200,${.025+i%3*.012})`;skyContext.beginPath();skyContext.ellipse((i*173)%1024,100+(i*47)%120,100+i%4*25,12+i%3*4,0,0,Math.PI*2);skyContext.fill();}
  const skyTexture=new THREE.CanvasTexture(skyCanvas);skyTexture.colorSpace=THREE.SRGBColorSpace;
  const sky=new THREE.Mesh(new THREE.SphereGeometry(480,32,16),new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,fog:false,depthWrite:false}));sky.renderOrder=-1;scene.add(sky);
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 650);
  scene.add(new THREE.HemisphereLight('#c6d7ff', '#626c55', 1.55));
  const sunlight = new THREE.DirectionalLight('#ffe4c2', 2.8);
  sunlight.position.set(-35, 65, 15); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 180 });
  sunlight.shadow.normalBias = .03; scene.add(sunlight); scene.add(sunlight.target);
  const materials = new Map();
  function material(color, glow = false) {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .88, metalness: 0, ...(glow ? { emissive: color, emissiveIntensity: .65 } : {}) }));
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
  const ocean = box(scene, [1800, 1, 1800], [0, -6, -75], '#203d49'); ocean.receiveShadow = true;
  const ground = box(scene, [280, 5, 250], [0, -2.8, -75], '#34433f'); ground.material = surfaces.get('grass',90,80); ground.receiveShadow = true;
  for (const region of REGIONS) {
    const plaza = cylinder(scene, 17, 17, .06, [region.x, -.15, region.z], region.id === 'murals' ? '#454253' : '#495448', 48); plaza.material = surfaces.get('earth',8); plaza.receiveShadow = true;
  }
  for (const road of ROADS) {
    const vertices = [], indices = [], uvs = [], borders = [[], []]; let along = 0;
    road.samples.forEach((point, i) => {
      const previous = road.samples[Math.max(0, i - 1)], next = road.samples[Math.min(road.samples.length - 1, i + 1)];
      const dx = next.x - previous.x, dz = next.z - previous.z; const length = Math.hypot(dx, dz) || 1;
      if(i) along += Math.hypot(point.x-previous.x,point.z-previous.z);
      for (const [sideIndex, side] of [-1, 1].entries()) {
        const x = point.x + dz / length * road.width / 2 * side, z = point.z - dx / length * road.width / 2 * side;
        vertices.push(x, -.09, z); uvs.push(sideIndex * road.width/3,along/3); if(i>=7 && i<road.samples.length-7) borders[sideIndex].push(new THREE.Vector3(x, -.04, z));
      }
      if (i < road.samples.length - 1) { const n = i * 2; indices.push(n, n + 2, n + 1, n + 1, n + 2, n + 3); }
      if (i % 7 === 3 && !NODES.some(node=>Math.hypot(point.x-node.x,point.z-node.z)<8)) { const dash = box(scene, [.16, .03, 1.7], [point.x, -.035, point.z], '#e2d8c0'); dash.rotation.y = Math.atan2(dx, dz); }
    });
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2)); geometry.setIndex(indices); geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, surfaces.get('asphalt')); mesh.material.side = THREE.DoubleSide; mesh.receiveShadow = true; scene.add(mesh);
    for (const border of borders) scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(border), new THREE.LineBasicMaterial({color:'#a9bca0',transparent:true,opacity:.65})));
  }
  for(const node of NODES){const junction=new THREE.Mesh(new THREE.CircleGeometry(7,40),surfaces.get('asphalt',4));junction.rotation.x=-Math.PI/2;junction.position.set(node.x,-.015,node.z);junction.receiveShadow=true;scene.add(junction);}
  const city=new THREE.Group();scene.add(city);
  for (const [i, building] of BUILDINGS.entries()) {
    const {x, z, radius, height} = building;
    if(i===0) continue;
    const tower = box(city, [radius * 1.35, height, radius * 1.35], [x, height / 2 - .3, z], i % 2 ? '#454b57' : '#35454c');
    tower.material = surfaces.get(i%2?'plaster':'brick',2,3);
    for (let y = 3; y < height - 1; y += 4) for (const side of [-1,1]) box(tower, [radius * .65, .6, .08], [0, y - height / 2, side * (radius * .675 + .05)], i % 2 ? '#f5a9c6' : '#7fa6ff', true);
    box(tower, [radius * 1.5, .3, radius * 1.5], [0, height / 2, 0], '#202631');
  }
  city.updateMatrixWorld(true);
  const cityBatches=new Map();city.traverse(object=>{if(!object.isMesh)return;const key=object.material.uuid;const batch=cityBatches.get(key)||{material:object.material,geometries:[]};batch.geometries.push(object.geometry.clone().applyMatrix4(object.matrixWorld));cityBatches.set(key,batch);});
  city.traverse(object=>{if(object.isMesh)object.geometry.dispose();});city.clear();
  for(const batch of cityBatches.values()){const geometry=mergeGeometries(batch.geometries);batch.geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,batch.material);mesh.castShadow=mesh.receiveShadow=true;city.add(mesh);}
  // Visible boundary stones mark the coast and recovery area.
  for (let i = 0; i < 32; i++) {
    const x = i < 16 ? -134 + i * 17.8 : (i % 2 ? -134 : 134);
    const z = i < 16 ? (i % 2 ? -194 : 44) : -185 + (i - 16) * 14;
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(3, 0), material('#52635d')); rock.position.set(x, -.4, z); rock.scale.y = .55; scene.add(rock);
  }
  function sign(text, at, color = '#f2559c') {
    const signGroup = new THREE.Group(); signGroup.position.set(at.x, 0, at.z); signGroup.rotation.y = at.heading || 0; scene.add(signGroup);
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
  installEnvironment(scene, renderer, surfaces);
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
    return {group,glow,beacon};
  });
  // Raised solar disc at the vanishing point.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ color: '#f2559c', fog: false }));
  sun.position.set(-70, 100, -300); scene.add(sun);
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
  const skyColors = ['#202b2a','#272333','#254347','#3b3330','#2d293f','#304050','#273f3c','#352b3d'].map(color => new THREE.Color(color));
  const groundColors = ['#34433f','#423b4f','#365b57','#5b4940','#443d57','#44586a','#3b5b50','#50414c'].map(color => new THREE.Color(color));
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
      pivot.userData.radius = Math.max(.2, box.getSize(new THREE.Vector3()).y / 2);
      car.add(pivot); pivot.updateWorldMatrix(true, false);
      return { mesh, pivot };
    });
    for (const detail of details) {
      const center = car.worldToLocal(new THREE.Box3().setFromObject(detail).getCenter(new THREE.Vector3()));
      const closest = wheelGroups.reduce((best, item) => !best || item.pivot.position.distanceToSquared(center) < best.pivot.position.distanceToSquared(center) ? item : best, null);
      closest?.pivot.attach(detail);
    }
    for (const {mesh, pivot} of wheelGroups) { pivot.attach(mesh); modelWheels.push(pivot); }
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
    const platform = cylinder(scene, 3.6, 4, .4, [at.x, -.08, at.z], '#3a68d8'); platform.receiveShadow = true;
    sign(['2-D / VOCALS', 'MURDOC / BASS', 'NOODLE / GUITAR', 'RUSSEL / DRUMS'][index], {x:at.x,z:at.z-6}, '#7fa6ff');
    return actor;
  });
  const bandStatus = document.querySelector('#band-status');
  async function loadBand() {
    try {
    const gltf = await new GLTFLoader().loadAsync('/assets/models/gorillaz-phase7.glb');
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
      visual.traverse(object => {
        object.userData.member = index;
        if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
      });
      const actor = people[index];
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
  renderer.domElement.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    dragging = {x:event.clientX, y:event.clientY}; moved = false;
    renderer.domElement.setPointerCapture(event.pointerId); renderer.domElement.style.cursor = 'grabbing';
  });
  renderer.domElement.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - dragging.x; const dy = event.clientY - dragging.y;
    if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    dragAngle -= dx * .006; dragElevation = THREE.MathUtils.clamp(dragElevation + dy * .035, -3, 14);
    dragging = {x:event.clientX, y:event.clientY};
  });
  function release() { dragging = null; renderer.domElement.style.cursor = 'grab'; }
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) renderer.domElement.addEventListener(event, release);
  renderer.domElement.addEventListener('click', event => {
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
  let previousDistance = 0; let activeEra = 0;
  let overview = false;
  let landmarkView = false;
  const look = new THREE.Vector3();
  const cameraTarget = new THREE.Vector3();
  const desiredCamera = new THREE.Vector3();
  let previousTime = null; let initialized = false;
  return {
    setEra(index) { activeEra = Math.max(0, Math.min(7,index)); },
    setOverview(value) { overview = value; landmarkView = false; },
    focusWindmill(value) { landmarkView = value; overview = false; },
    zoomBy(amount) { zoom = THREE.MathUtils.clamp(zoom + amount, .7, 1.6); },
    resetCamera() { dragAngle = 0; dragElevation = 0; zoom = 1; overview = false; landmarkView = false; },
    update(vehicle, time, orbit, reduced, showcase, known, nearby) {
      const {x,z,heading} = vehicle; const t = time / 1000; const moving = Math.abs(vehicle.speed) > .1;
      const dt = previousTime === null ? .016 : Math.min((time - previousTime) / 1000, .1); previousTime = time;
      const blend = reduced ? 1 : 1 - Math.exp(-dt * 4);
      const zone = activeEra;
      if (reduced) scene.background.copy(skyColors[zone]); else scene.background.lerp(skyColors[zone], blend * .35); scene.fog.color.copy(scene.background);
      scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, overview ? .001 : landmarkView ? .002 : .0035, blend);
      // Ground keeps its authored material palette; era changes affect atmosphere.
      island.visible = showcase; island.position.set(x,0,z);
      dust.position.set(x, 0, z);
      if (!reduced) { rotor.rotation.z = -t * .3; windmill.position.y = 15 + Math.sin(t * .65) * .5; dust.rotation.y = Math.sin(t * .025) * .15; satellites.rotation.y = Math.sin(t * .1) * .12; portal.rotation.z = Math.sin(t * .07) * .04; }
      car.position.set(x, moving && !reduced ? Math.sin(t * (vehicle.surface==='terra'?19:13)) * (vehicle.surface==='terra'?.07:.025) : 0, z);
      car.rotation.y = heading;
      car.rotation.z = reduced ? 0 : THREE.MathUtils.lerp(car.rotation.z, -vehicle.steering * vehicle.speed * .008, blend);
      car.rotation.x = reduced ? 0 : THREE.MathUtils.lerp(car.rotation.x, THREE.MathUtils.clamp(vehicle.acceleration * -.006,-.06,.06), blend);
      const travelled = vehicle.distanceTravelled - previousDistance;
      modelWheels.forEach(wheel => { wheel.rotation.x -= travelled / wheel.userData.radius; wheel.rotation.y = wheel.position.z < 0 ? vehicle.steering : 0; });
      if (!modelWheels.length) wheels.forEach(wheel => { wheel.rotation.x -= travelled / .75; });
      previousDistance = vehicle.distanceTravelled;
      const mobile = container.clientWidth < 700;
      const radius = (mobile ? (showcase ? 46 : 29) : (showcase ? 40 : 24)) * zoom + (reduced ? 0 : Math.abs(vehicle.speed)*.12);
      const travelHeading = heading + (vehicle.speed < -.2 ? Math.PI : 0);
      const angle = (orbit && !reduced ? t * .16 : showcase ? .48 : .16) + dragAngle;
      const cameraAngle = angle + travelHeading;
      desiredCamera.set(x + Math.sin(cameraAngle) * radius, (showcase ? 12 : 15) + dragElevation, z + Math.cos(cameraAngle) * radius);
      const ahead = showcase ? 1 : 9;
      const courtyardOffset=showcase?(mobile?-2:-8):0;
      look.set(x + courtyardOffset*Math.cos(heading) - Math.sin(travelHeading) * ahead, mobile && showcase ? 3 : 2, z - courtyardOffset*Math.sin(heading) - Math.cos(travelHeading) * ahead);
      if (landmarkView) { desiredCamera.set(125 * zoom, 38 + dragElevation, -98); look.set(84, 16, -152); }
      if (overview) { desiredCamera.set(0, 290 * zoom, -74); look.set(0, 0, -75); }
      const targetFov = reduced ? 46 : 46 + Math.abs(vehicle.speed) * .15;
      camera.fov = THREE.MathUtils.lerp(camera.fov,targetFov,blend); camera.updateProjectionMatrix();
      for (const [i, object] of discoveryObjects.entries()) {
        const found = known.has(DISCOVERIES[i].id); object.glow.material = material(found?'#d2e2a8':'#f5a9c6',true); object.beacon.material = material(found?'#d2e2a8':'#f5a9c6',true);
        object.beacon.position.y = 5.5 + (reduced ? 0 : Math.sin(t*2+i)*.35); object.beacon.rotation.y = reduced ? 0 : t*.7;
        const selected = nearby?.type === 'discovery' && nearby.index === i; object.beacon.scale.setScalar(selected?1.4:1);
      }
      if (!initialized || reduced) { camera.position.copy(desiredCamera); cameraTarget.copy(look); initialized = true; }
      else { camera.position.lerp(desiredCamera, blend); cameraTarget.lerp(look, blend); }
      camera.lookAt(cameraTarget);
      sunlight.position.set(x - 35, 65, z + 20); sunlight.target.position.set(x, 0, z); sun.lookAt(camera.position);
      for (const [i, actor] of people.entries()) {
        const localSide = i % 2 ? 5.5 : -5.5; const localAlong = i < 2 ? -5 : 3;
        const fixed = MEMBER_LOCATIONS[i];
        actor.group.position.x = showcase ? x + localSide * Math.cos(heading) + localAlong * Math.sin(heading) : fixed.x;
        actor.group.position.z = showcase ? z - localSide * Math.sin(heading) + localAlong * Math.cos(heading) : fixed.z;
        actor.group.rotation.y = (showcase ? heading : fixed.heading) + Math.PI;
        actor.group.position.y = reduced ? 0 : Math.sin(t * 2 + i) * .07;
        if (actor.arms.length) {
          actor.arms[0].rotation.z = reduced ? -.15 : Math.sin(t * 2 + i) * .12 - .15;
          actor.arms[1].rotation.z = reduced ? .15 : Math.cos(t * 2 + i) * .12 + .15;
        }
      }
      renderer.render(scene, camera);
      renderer.domElement.dataset.triangles=String(renderer.info.render.triangles);
      renderer.domElement.dataset.drawCalls=String(renderer.info.render.calls);
    },
  };
}
