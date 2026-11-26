// Palcos dos integrantes, banda Phase 7 (com instrumentos GLB e fallback procedural), Murdoc Lunar e animação/colisão.
import * as THREE from '../vendor/three.module.min.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MEMBER_LOCATIONS } from '../world-data.js';
import { NON_DISCOVERY_PROP_SCALE } from '../discovery-scale.js';
import { eraBillboardCredits } from '../content.js';
import { rigBand } from '../band-pose.js';
import { loadModelSafely, repairMaterials } from '../model-safety.js';
import { LUNAR_MURDOC, followLunarCamera, configureLunarMaterial } from '../easter-eggs.js';

const MEMBER_SET = [
  { name: '2-D', role: 'VOCAL', accent: '#7fa6ff', key: 'twod', tag: 'TOMORROW', credit: eraBillboardCredits['the-now-now'] },
  { name: 'MURDOC', role: 'BAIXO', accent: '#9dd66b', key: 'murdoc', tag: 'KONG', credit: eraBillboardCredits.gorillaz },
  { name: 'NOODLE', role: 'GUITARRA', accent: '#f5a9c6', key: 'noodle', tag: 'DARE', credit: eraBillboardCredits['demon-days'] },
  { name: 'RUSSEL', role: 'BATERIA', accent: '#ffcc4d', key: 'russel', tag: '19-2000', credit: eraBillboardCredits['demon-days'] },
];

export function installStagesAndBand({ scene, city, surfaces, material, box, sphere, cylinder, bake, heavyCaster }) {
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

  const stageSpeakers = [];
  const stageLoaders = [];

  function memberStage(index, at) {
    const set = MEMBER_SET[index], stage = new THREE.Group(); stage.position.set(at.x, 0, at.z); stage.rotation.y = at.facing;
    stage.scale.setScalar(NON_DISCOVERY_PROP_SCALE); city.add(stage);
    const spkGroup = new THREE.Group(); spkGroup.position.set(at.x, 0, at.z); spkGroup.rotation.y = at.facing;
    spkGroup.scale.setScalar(NON_DISCOVERY_PROP_SCALE); scene.add(spkGroup);
    const spkFallback = [];
    stageSpeakers.push({ group: spkGroup, fallback: spkFallback });
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 512; const context = canvas.getContext('2d');
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
    function paint(image) {
      const noise = concrete(context, 1024, 512, index + 1);
      context.lineCap = 'round';
      for (let i = 0; i < 9; i++) { context.strokeStyle = i % 2 ? 'rgba(17,20,21,.55)' : 'rgba(241,236,220,.5)'; context.lineWidth = 5 + noise(i) * 6; context.beginPath(); const x = 380 + noise(i + 2) * 600, y = 330 + noise(i + 5) * 150; context.moveTo(x, y); context.bezierCurveTo(x + 40, y - 50 * noise(i + 1), x + 70, y + 40, x + 110 * noise(i + 4), y - 10); context.stroke(); }
      for (let i = 0; i < 70; i++) { context.fillStyle = i % 3 ? set.accent : '#111415'; context.globalAlpha = .5; context.beginPath(); context.arc(noise(i + 20) * 1024, noise(i + 40) * 512, 1 + noise(i + 60) * 5, 0, Math.PI * 2); context.fill(); }
      context.globalAlpha = 1;
      context.save(); context.translate(190, 262); context.rotate(-.06);
      context.fillStyle = 'rgba(0,0,0,.35)'; context.fillRect(-148, -212, 310, 440);
      context.fillStyle = '#ece6d4'; context.fillRect(-155, -220, 310, 440);
      context.fillStyle = set.accent; context.fillRect(-140, -205, 280, 330);
      context.fillStyle = 'rgba(17,20,21,.28)'; for (let y = -200; y < 120; y += 14) for (let x = -135 + (y / 14 % 2) * 7; x < 135; x += 14) { context.beginPath(); context.arc(x, y, 2.6 + (y + 200) / 90, 0, Math.PI * 2); context.fill(); }
      if (image) context.drawImage(image, image.width * .14, image.height * .02, image.width * .72, image.height * .52, -140, -205, 280, 330);
      context.fillStyle = 'rgba(241,236,220,.92)'; context.font = 'bold 15px monospace'; context.textAlign = 'center'; context.fillText(`PHASE 7 (CC BY 4.0) · ${set.credit.toUpperCase()}`, 512, 500, 960);
      context.fillStyle = '#111415'; context.font = 'bold 54px Impact, "Arial Black", sans-serif'; context.textAlign = 'center'; context.fillText(set.role.split(' · ')[0], 0, 185, 270);
      context.font = 'bold 20px monospace'; context.fillText('AO VIVO · KONG STUDIOS', 0, 210, 270);
      context.fillStyle = 'rgba(214,202,150,.85)'; for (const [x, y, turn] of [[-150, -215, -.6], [150, -215, .6], [-150, 215, .6], [150, 215, -.6]]) { context.save(); context.translate(x, y); context.rotate(turn); context.fillRect(-34, -11, 68, 22); context.restore(); }
      context.restore();
      context.save(); context.translate(690, 235); context.rotate(.035); context.textAlign = 'center';
      context.font = `bold ${set.name.length > 4 ? 190 : 250}px Impact, "Arial Black", sans-serif`; context.lineJoin = 'round';
      context.shadowColor = set.accent; context.shadowBlur = 38; context.fillStyle = set.accent; context.fillText(set.name, 0, 0, 600); context.shadowBlur = 0;
      context.lineWidth = 16; context.strokeStyle = '#111415'; context.strokeText(set.name, 0, 0, 600); context.fillStyle = set.accent; context.fillText(set.name, 0, 0, 600);
      context.fillStyle = '#f1ecdc'; context.fillRect(-250, -30 - (set.name.length > 4 ? 140 : 185), 90, 9);
      for (let i = 0; i < 8; i++) { const x = -270 + noise(i + 80) * 540, length = 30 + noise(i + 90) * 90; context.fillStyle = set.accent; context.fillRect(x, 0, 7, length); context.beginPath(); context.arc(x + 3.5, length, 6, 0, Math.PI * 2); context.fill(); }
      context.restore();
      context.fillStyle = '#111415'; context.font = 'bold 52px monospace'; context.textAlign = 'left'; context.fillText(set.role, 400, 400, 590);
      context.fillRect(400, 414, 200, 7);
      context.save(); context.translate(900, 470); context.rotate(-.1); context.font = 'bold 40px Impact, sans-serif'; context.fillStyle = '#f1ecdc'; context.fillText(set.tag, -90, 0); context.restore();
      texture.needsUpdate = true;
    }
    paint(null);
    const MEMBER_ART = { twod: 'member-2d', murdoc: 'member-murdoc', noodle: 'member-noodle', russel: 'member-russel' };
    const image = new Image(); let portraitRequested = false;
    image.onload = () => paint(image);
    stageLoaders[index] = () => { if (portraitRequested) return; portraitRequested = true; image.src = `./assets/art/${MEMBER_ART[set.key]}.webp`; };
    box(stage, [8.8, 4.5, .4], [0, 1.95, -3.6], '#7c7f7a');
    const front = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), new THREE.MeshStandardMaterial({ map: texture, roughness: .95 })); front.position.set(0, 2, -3.39); front.receiveShadow = true; stage.add(front);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 4.3), wallBack); back.position.set(0, 2, -3.81); back.rotation.y = Math.PI; stage.add(back);
    box(stage, [8.8, .12, .12], [0, 4.32, -3.3], set.accent, true).castShadow = false;
    const deck = box(stage, [8, .26, 5.6], [0, -.13, -.4], '#8b6a45'); deck.material = surfaces.get('wood', 4, 3); deck.castShadow = false;
    for (let i = 0; i < 7; i++) box(stage, [.9, .24, .08], [-3.3 + i * 1.1, -.14, 2.42], '#2a2420').castShadow = false;
    for (const side of [-1, 1]) for (const [y, size] of [[.75, 1.5], [2.05, 1.05]]) {
      spkFallback.push(box(spkGroup, [size, size, 1], [side * 3.45, y, -2.6], '#17191b'));
      const cone = cylinder(spkGroup, size * .33, size * .33, .08, [side * 3.45, y, -2.07], '#2e3236', 20); cone.rotation.x = Math.PI / 2; cone.castShadow = false; spkFallback.push(cone);
      const cap = cylinder(spkGroup, size * .12, size * .12, .1, [side * 3.45, y, -2.05], set.accent, 12); cap.rotation.x = Math.PI / 2; cap.castShadow = false; spkFallback.push(cap);
    }
    box(stage, [.8, .6, .8], [-2.5, .3, 1.5], set.accent); box(stage, [.8, .6, .8], [-2.7, .9, 1.45], '#2a3036').rotation.y = .3;
    box(stage, [2.6, .05, .08], [1.2, .03, 1.2], '#111415').rotation.y = .4;
    if (index === 0) {
      box(stage, [2.4, .5, .8], [2, .25, 1.2], '#17191b').rotation.y = .2; box(stage, [2.2, .08, .08], [2, .52, 1.2], set.accent).rotation.y = .2;
      box(stage, [1.1, .7, .8], [-1.4, .35, 1.6], '#2a3036').rotation.x = -.35;
    } else if (index === 1) {
      box(stage, [1.3, .45, .7], [2.2, .23, .2], '#2a3036'); box(stage, [1.1, .1, .05], [2.2, .3, .56], set.accent, true).castShadow = false;
      cylinder(stage, .55, .55, 1.3, [-2.2, .65, .3], '#6a4632', 16); cylinder(stage, .57, .57, .08, [-2.2, 1.0, .3], '#3a2a20', 16);
      for (let i = 0; i < 3; i++) { const tyre = new THREE.Mesh(new THREE.TorusGeometry(.5, .2, 8, 18), material('#151618')); tyre.rotation.x = Math.PI / 2; tyre.position.set(2.6, .2 + i * .38, 1.7); tyre.castShadow = true; stage.add(tyre); }
    } else if (index === 2) {
      box(stage, [1.1, .95, .6], [2.1, .48, .3], '#2a3036'); box(stage, [.95, .6, .04], [2.1, .42, .62], '#c9b98f');
      box(stage, [1.5, .08, .5], [.4, .04, 1.6], '#17191b'); for (let i = 0; i < 4; i++) box(stage, [.24, .1, .32], [-.1 + i * .34, .11, 1.6], ['#f5a9c6', '#ffcc4d', '#7fa6ff', '#9dd66b'][i]);
      for (let i = 0; i < 4; i++) { cylinder(stage, .012, .012, .7, [-2.4 + i * 1.6, 3.95, -3.05], '#111415', 5); sphere(stage, .3, [-2.4 + i * 1.6, 3.45, -3.05], i % 2 ? '#f5a9c6' : '#fff4c7', [1, 1.15, 1]).material = material(i % 2 ? '#f5a9c6' : '#fff4c7', true); }
    } else {
      for (const [x, y, r] of [[-1.9, .45, .9], [-1.9, 1.25, .7]]) cylinder(stage, r, r, .7, [x, y, 1.1], '#17191b', 18);
      box(stage, [1.3, .6, .4], [2.3, .3, 1.3], '#2a3036'); for (const side of [-1, 1]) { const grille = cylinder(stage, .2, .2, .05, [2.3 + side * .38, .3, 1.52], '#9a9d8b', 14); grille.rotation.x = Math.PI / 2; }
    }
  }

  let stageSpeakersLoaded = false;
  function loadStageSpeakers(loader = new GLTFLoader()) {
    if (stageSpeakersLoaded) return;
    stageSpeakersLoaded = true;
    Promise.all([
      loadModelSafely(loader, './assets/models/scenery/speaker-01-stack.glb'),
      loadModelSafely(loader, './assets/models/scenery/speaker-02-tower.glb'),
    ]).then(([stackGltf, towerGltf]) => {
      for (const g of [stackGltf, towerGltf]) {
        repairMaterials(g.scene);
        g.scene.traverse(o => {
          if (o.isMesh && o.geometry) {
            o.castShadow = true; o.receiveShadow = true;
            o.material = new THREE.MeshStandardMaterial({ color: '#b5b8b1', vertexColors: Boolean(o.geometry.attributes.color), roughness: .76, metalness: .08 });
          }
        });
      }
      for (const entry of stageSpeakers) {
        for (const m of entry.fallback) { entry.group.remove(m); m.geometry?.dispose?.(); }
        entry.fallback.length = 0;
        const leftTower = towerGltf.scene.clone(true); leftTower.position.set(-3.45, 0, -2.5);
        const rightTower = towerGltf.scene.clone(true); rightTower.position.set(3.45, 0, -2.5);
        const sideStack = stackGltf.scene.clone(true); sideStack.position.set(-2.35, 0, -2.35);
        entry.group.add(leftTower, rightTower, sideStack);
        entry.group.userData.speakersGlbLoaded = true;
      }
    }).catch(err => console.warn('Caixas de som GLB indisponíveis; mantendo procedurais:', err.message));
  }

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

  const bandStatus = document.querySelector('#band-status');
  let lunarMurdoc = null;

  function loadMemberInstrument(rig, index, loader) {
    const urls = {
      0: './assets/models/scenery/instrument-03-keyboard.glb',
      1: './assets/models/scenery/instrument-04-bass-v2.glb', // Murdoc: baixo v2
      3: './assets/models/scenery/instrument-02-drums.glb',
    };
    const url = urls[index];
    if (!url) return;
    loadModelSafely(loader, url).then(gltf => {
      repairMaterials(gltf.scene);
      gltf.scene.traverse(obj => {
        if (obj.isMesh && obj.geometry) {
          obj.castShadow = true; obj.receiveShadow = true;
          obj.material = new THREE.MeshStandardMaterial({ color: '#d0d4cc', vertexColors: Boolean(obj.geometry.attributes.color), roughness: .72, metalness: .10 });
        }
      });
      if (rig.guitar) rig.guitar.visible = false;
      rig.kit.add(gltf.scene);
      rig.kit.userData.instrumentGlbLoaded = true;
    }).catch(err => console.warn(`Instrumento GLB do integrante ${index} indisponível; mantendo procedural:`, err.message));
  }

  function loadNoodleExtras(rig, loader) {
    const prepare = gltf => { gltf.scene.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } }); repairMaterials(gltf.scene); };
    loadModelSafely(loader, './assets/models/scenery/instrument-05-guitar-v2.glb')
      .catch(() => loadModelSafely(loader, './assets/models/noodle-guitar-v3.glb'))
      .then(gltf => {
        prepare(gltf); if (rig.guitar) rig.guitar.visible = false; rig.kit.add(gltf.scene);
      }).catch(error => console.warn('Guitarra v2 da Noodle indisponível; mantendo a procedural:', error.message));
    loadModelSafely(loader, './assets/models/noodle-stage-props-v2.glb').then(gltf => {
      prepare(gltf); rig.kit.add(gltf.scene);
    }).catch(error => console.warn('Props de palco da Noodle indisponíveis:', error.message));
  }

  async function loadBand() {
    try {
      const bandLoader = new GLTFLoader();
      const gltf = await loadModelSafely(bandLoader, './assets/models/gorillaz-phase7-web-v3.glb')
        .catch(() => loadModelSafely(bandLoader, './assets/models/gorillaz-phase7-web.glb'));
      repairMaterials(gltf.scene);
      const roots = Array(4).fill(null);
      gltf.scene.traverse(object => { if (Number.isInteger(object.userData.memberIndex) && object.userData.memberIndex >= 0 && object.userData.memberIndex < 4) roots[object.userData.memberIndex] = object; });
      if (roots.length !== 4 || roots.some(root => !root)) throw new Error('O pacote precisa conter os quatro integrantes identificados');
      gltf.scene.updateWorldMatrix(true, true);
      const bounds = roots.map(root => new THREE.Box3().setFromObject(root));
      const scale = 6.2 / Math.max(...bounds.map(b => b.max.y - b.min.y));
      {
        const giant = roots[1].clone(true);
        const discard = [];
        giant.traverse(object => { if (object.isMesh && /(?:Body|Pants|Shoes)/i.test(object.name)) discard.push(object); });
        discard.forEach(object => object.removeFromParent());
        giant.traverse(object => {
          if (!object.isMesh) return;
          object.geometry = object.geometry.clone();
          object.geometry.computeVertexNormals();
          object.material = object.material.clone();
          object.material.color.multiplyScalar(.68);
          object.material.roughness = .92;
          object.material.metalness = 0;
          if (object.material.map) {
            object.material.emissiveMap = object.material.map;
            object.material.emissive = new THREE.Color('#7a7488');
            object.material.emissiveIntensity = .58;
          }
          configureLunarMaterial(object.material);
          object.material.side = THREE.FrontSide;
          object.material.depthTest = true;
          object.material.depthWrite = true;
          object.material.onBeforeCompile = shader => {
            shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 lunarNormal;')
              .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nlunarNormal = normalize(normalMatrix * objectNormal);');
            shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 lunarNormal;')
              .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb += vec3(.14, .09, .22) * pow(1.0 - max(0.0, normalize(lunarNormal).z), 2.6);');
          };
          object.material.transparent = false; object.renderOrder = -.5;
          object.castShadow = object.receiveShadow = false;
          object.frustumCulled = true;
        });
        const bustBounds = new THREE.Box3().setFromObject(giant), center = bustBounds.getCenter(new THREE.Vector3());
        const centered = new THREE.Group(); centered.add(giant); centered.position.set(-center.x, -center.y, -center.z);
        const bust = new THREE.Group(); bust.add(centered); bust.scale.setScalar(LUNAR_MURDOC.height / (bustBounds.max.y - bustBounds.min.y));
        bust.position.set(LUNAR_MURDOC.x, LUNAR_MURDOC.y, LUNAR_MURDOC.z);
        bust.rotation.y = Math.atan2(-LUNAR_MURDOC.x, -LUNAR_MURDOC.z);
        const haloMaterial = new THREE.ShaderMaterial({ depthWrite: false, depthTest: false, fog: false,
          uniforms: {}, vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader: 'varying vec2 vUv; void main(){float d=length(vUv-vec2(.5))*2.;if(d>1.)discard;vec3 c=mix(vec3(.07,.06,.11),vec3(.24,.18,.32),smoothstep(.55,1.,d));gl_FragColor=vec4(c,1.);}' });
        const halo = new THREE.Mesh(new THREE.PlaneGeometry(LUNAR_MURDOC.disk, LUNAR_MURDOC.disk), haloMaterial); halo.name = 'murdoc-lunar-halo'; halo.renderOrder = -.6;
        halo.position.set(LUNAR_MURDOC.x * 1.01, LUNAR_MURDOC.y * 1.01, LUNAR_MURDOC.z * 1.01);
        halo.lookAt(0, 0, 0);
        const depthReset = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthTest: false }));
        depthReset.name = 'murdoc-lunar-depth-reset'; depthReset.renderOrder = -.45; depthReset.frustumCulled = false;
        depthReset.onAfterRender = r => { r.state.buffers.depth.setMask(true); r.clearDepth(); };
        lunarMurdoc = new THREE.Group(); lunarMurdoc.name = 'murdoc-lunar'; lunarMurdoc.add(bust, halo, depthReset); scene.add(lunarMurdoc);
      }
      roots.forEach((model, index) => {
        const center = bounds[index].getCenter(new THREE.Vector3());
        const centered = new THREE.Group(); centered.add(model); centered.position.set(-center.x, -bounds[index].min.y, -center.z);
        const visual = new THREE.Group(); visual.add(centered); visual.scale.setScalar(scale); visual.rotation.y = Math.PI;
        visual.position.y = .03;
        visual.traverse(object => {
          object.userData.member = index;
          if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; }
        });
        bake(visual);
        const rig = rigBand(visual, index, material); bake(rig.kit, [...rig.sticks, ...(rig.guitar ? [rig.guitar] : [])]);
        loadMemberInstrument(rig, index, bandLoader);
        if (index === 2) loadNoodleExtras(rig, bandLoader);
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

  const tumbleYaw = new THREE.Quaternion(), upAxis = new THREE.Vector3(0, 1, 0);

  function updateStageArt(vehicle) {
    MEMBER_LOCATIONS.forEach((at, i) => {
      if (stageLoaders[i] && Math.hypot(vehicle.x - at.x, vehicle.z - at.z) < 60) stageLoaders[i]();
    });
  }

  function updateLunar(camera) {
    if (lunarMurdoc) followLunarCamera(lunarMurdoc, camera);
  }

  function updatePeople({ vehicle, camera, dt, t, reduced, showcase, onImpact }) {
    const { x, z, heading } = vehicle;
    for (const [i, actor] of people.entries()) {
      const localSide = i % 2 ? 5.5 : -5.5; const localAlong = i < 2 ? -5 : 3;
      const fixed = MEMBER_LOCATIONS[i];
      const homeYaw = (showcase ? heading : fixed.heading) + Math.PI, place = actor.group.position;
      if (showcase) actor.knock = null;
      const hitDistance = Math.hypot(place.x - x, place.z - z), speed = Math.abs(vehicle.speed);
      const exposed = !actor.knock || actor.knock.phase === 'return' || actor.knock.phase === 'dizzy';
      if (!showcase && exposed && hitDistance < 3.2 && speed > 3) {
        const way = Math.sign(vehicle.speed), fx = -Math.sin(heading) * way, fz = -Math.cos(heading) * way;
        const ax = (place.x - x) / (hitDistance || 1), az = (place.z - z) / (hitDistance || 1);
        if (reduced) actor.knock = { phase: 'return', x: fixed.x + ax * 3, z: fixed.z + az * 3, y: 0, angle: 0, timer: 0, axis: new THREE.Vector3(1, 0, 0), yaw: homeYaw };
        else {
          const push = Math.min(9, speed * .7), vx = fx * push + ax * 2.5, vz = fz * push + az * 2.5, length = Math.hypot(vx, vz) || 1;
          actor.knock = { phase: 'air', x: place.x, z: place.z, y: Math.max(place.y, .05), vx, vz, vy: Math.min(9, 4.2 + speed * .22), angle: 0, spin: 3.5 + speed * .3,
            axis: new THREE.Vector3(-vz / length, 0, vx / length), bounced: false, timer: 0, yaw: homeYaw };
          onImpact(Math.min(1, speed / 18));
        }
      }
      const knock = actor.knock;
      if (!knock) {
        place.x = showcase ? x + localSide * Math.cos(heading) + localAlong * Math.sin(heading) : fixed.x;
        place.z = showcase ? z - localSide * Math.sin(heading) + localAlong * Math.cos(heading) : fixed.z;
        place.y = reduced ? 0 : Math.sin(t * 2 + i) * .07;
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
          const drag = Math.exp(-4.5 * dt); knock.vx *= drag; knock.vz *= drag; knock.x += knock.vx * dt; knock.z += knock.vz * dt;
          knock.angle += (knock.rest - knock.angle) * (1 - Math.exp(-12 * dt)); knock.y += (.3 - knock.y) * .3;
          if (knock.timer > 1.1 && Math.hypot(knock.vx, knock.vz) < .4) { knock.phase = 'rise'; knock.timer = 0; knock.from = knock.angle; knock.upright = Math.round(knock.angle / (Math.PI * 2)) * Math.PI * 2; }
        } else if (knock.phase === 'rise') {
          const k = Math.min(1, knock.timer / .9), ease = k * k * (3 - 2 * k);
          knock.angle = knock.from + (knock.upright - knock.from) * ease; knock.y = .3 * (1 - ease) + Math.sin(k * Math.PI) * .25;
          if (k >= 1) { knock.phase = 'dizzy'; knock.timer = 0; knock.angle = 0; }
        } else if (knock.phase === 'dizzy') {
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
      if (actor.rig && place.distanceTo(camera.position) < 85) actor.rig.pose(t + i, reduced || Boolean(actor.knock));
      if (actor.arms.length) {
        actor.arms[0].rotation.z = i === 1 || i === 2 ? -.55 + Math.sin(t * 8) * .16 : i === 3 ? -.25 + Math.sin(t * 10) * .35 : -.1;
        actor.arms[1].rotation.z = i === 1 || i === 2 ? .45 + Math.cos(t * 8) * .13 : i === 3 ? .25 + Math.cos(t * 10) * .35 : .1;
      }
    }
  }

  return {
    people,
    stageSpeakers,
    loadStageSpeakers,
    updateStageArt,
    updateLunar,
    updatePeople,
  };
}
