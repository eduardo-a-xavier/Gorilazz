// Props urbanos, vegetação, fauna, fliperama, marcos, pontos de história, moinho, partículas e marcadores de valor.
import * as THREE from '../vendor/three.module.min.js';
import { DISCOVERIES, MEMBER_LOCATIONS, behind } from '../world-data.js';
import { letteringTexture } from '../materials.js';
import { installEnvironment } from '../environment.js';
import { installStreetProps, limitStreetProps } from '../street-props.js';
import { installEasterEggs, EASTER_EGG_POSITIONS } from '../easter-eggs.js';
import { installLandmarks } from '../landmarks.js';
import { installFauna } from '../fauna.js';
import { installArcadeCabinet } from '../arcade-cabinet.js';
import { DISCOVERY_PROP_SCALE } from '../discovery-scale.js';
import { shouldLoadArt } from '../art-panels.js';

export const FX_COUNT = 36;
const MEMBER_ACCENTS = ['#7fa6ff', '#9dd66b', '#f5a9c6', '#ffcc4d'];

export function installWorldProps({ scene, renderer, surfaces, material, box, sphere, cylinder, bake, heavyCaster }) {
  installEnvironment(scene, renderer, surfaces, heavyCaster);
  const streetProps = installStreetProps(scene, 2026, EASTER_EGG_POSITIONS.filter(p => p.id === 'save'));
  installEasterEggs(scene);
  const landmarks = installLandmarks(scene, material, bake);
  const fauna = installFauna(scene);
  const arcadeCabinet = installArcadeCabinet(scene);

  const artLoader = new THREE.TextureLoader(), artRequested = new Set();
  let haloTex = null;
  function haloTexture() {
    if (haloTex) return haloTex;
    const canvasEl = document.createElement('canvas'); canvasEl.width = canvasEl.height = 128; const g = canvasEl.getContext('2d');
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64); grad.addColorStop(0, 'rgba(255,255,255,1)'); grad.addColorStop(.35, 'rgba(255,255,255,.35)'); grad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    haloTex = new THREE.CanvasTexture(canvasEl); haloTex.colorSpace = THREE.SRGBColorSpace; return haloTex;
  }

  const artPaths = {};
  fetch('./assets/art/manifest.json').then(r => r.json()).then(manifest => {
    for (const point of DISCOVERIES) {
      const entry = manifest.discoveryMurals?.[point.id];
      if (entry) artPaths[point.id] = entry.primary;
    }
  }).catch(() => {});

  const discoveryObjects = DISCOVERIES.map((point, i) => {
    const group = new THREE.Group(); group.position.set(point.x, 0, point.z); group.rotation.y = point.facing; scene.add(group);
    const paving = cylinder(group, 4.5, 4.7, .14, [0, -.11, 0], '#687463', 40); paving.material = surfaces.get('asphalt', 3);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(3.9, .035, 6, 40), material('#f5a9c6', true)); glow.rotation.x = Math.PI / 2; glow.position.y = .01; group.add(glow);
    if (i === 0) {
      const wall = box(group, [9.4, 4.8, .35], [0, 2.2, -3], '#d5c6a6'); wall.material = surfaces.get('plaster', 3, 2);
      const canvas = document.createElement('canvas'); canvas.width = 1536; canvas.height = 768; const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#b2ad8d'; ctx.fillRect(0, 0, 1536, 768);
      ctx.strokeStyle = '#dc8e9a'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      for (let j = 0; j < 5; j++) { ctx.beginPath(); for (let k = 0; k < 28; k++) { const x = 710 + k * 25, y = 245 + j * 68 + Math.sin(k * .7 + j) * 33; if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
      ctx.fillStyle = '#263e42'; ctx.font = 'bold 100px monospace'; ctx.fillText('1998', 755, 165); ctx.font = 'bold 57px monospace'; ctx.fillText('DUAS MENTES.', 730, 680); ctx.fillText('UM UNIVERSO.', 730, 735);
      const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
      const mural = new THREE.Mesh(new THREE.PlaneGeometry(8.8, 4.4), new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, emissive: '#ff9ec4', emissiveMap: texture, emissiveIntensity: .4 }));
      mural.position.set(0, 2.2, -2.81); group.add(mural); group.userData.mural = mural;
    } else if (i === 1) {
      const archive = box(group, [4.9, 4, .8], [0, 1.9, -2.5], '#596357'); archive.material = surfaces.get('wood', 2);
      for (let k = 0; k < 4; k++) { const page = box(group, [1.05, 2.9, .04], [-1.8 + k * 1.2, 2, -2.07], '#e2d8c0'); page.rotation.z = (k % 2 ? 1 : -1) * .04; }
      const heading = new THREE.Mesh(new THREE.PlaneGeometry(4.3, .55), new THREE.MeshStandardMaterial({ map: letteringTexture('QUATRO ROSTOS', { height: 128 }), roughness: 1 })); heading.position.set(0, 3.7, -2.03); group.add(heading);
    } else if (i === 2) {
      const radio = box(group, [3.5, 2.2, 1.1], [0, 1.4, -2], '#626d60'); radio.material = surfaces.get('wood');
      for (const x of [-1, 1]) { const speaker = cylinder(group, .55, .55, .12, [x, 1.4, -1.38], '#171d20', 32); speaker.rotation.x = Math.PI / 2; }
      const display = box(group, [1, .45, .1], [0, 1.9, -1.4], '#9bb79b', true); display.castShadow = false;
      const antenna = cylinder(group, .025, .025, 3.7, [1.3, 3.5, -2], '#9a9d8b', 8); antenna.rotation.z = -.25;
      box(group, [4, .24, 1.8], [0, .18, -2], '#5c5545').material = surfaces.get('wood');
    } else if (i === 3) {
      for (const x of [-1.7, 1.7]) box(group, [.15, .9, 1.6], [x, .3, -2.1], '#343d35');
      box(group, [4.6, .18, 1.7], [0, .8, -2.1], '#9d9471').material = surfaces.get('wood', 3);
      box(group, [4.6, 1, .18], [0, 1.35, -2.85], '#9d9471').material = surfaces.get('wood', 3);
      const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3, .7), new THREE.MeshStandardMaterial({ map: letteringTexture('DEMON DAYS / 2005', { height: 128 }), roughness: 1 })); plaque.position.set(0, .6, -.9); plaque.rotation.x = -.2; group.add(plaque);
    } else {
      box(group, [8, .45, 4], [0, .1, -1.3], '#76664c').material = surfaces.get('wood', 4, 2);
      for (const x of [-2.8, 2.8]) { box(group, [1.2, 2, 1], [x, 1.3, -2.3], '#252c28'); const cone = cylinder(group, .42, .42, .1, [x, 1.3, -1.74], '#101916', 24); cone.rotation.x = Math.PI / 2; }
      cylinder(group, .045, .045, 3.3, [0, 1.7, -1.1], '#9d9e8e', 10); sphere(group, .18, [0, 3.3, -1.1], '#252c28');
    }
    const beacon = new THREE.Mesh(new THREE.SphereGeometry(.18, 12, 8), material('#f5a9c6', true)); beacon.position.set(0, i === 0 ? 7.4 : 5.5, i === 0 ? -4.5 : -2.8); group.add(beacon);
    const keep = new Set([paving, glow, beacon]);
    for (const child of [...group.children]) if (!keep.has(child)) { child.position.multiplyScalar(DISCOVERY_PROP_SCALE); child.scale.multiplyScalar(DISCOVERY_PROP_SCALE); }
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(.35, .9, 8, 16, 1, true), new THREE.MeshBasicMaterial({ color: '#f5a9c6', transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    beam.position.set(0, 4, -7); beam.name = 'discovery-beam'; group.add(beam);
    if (i === 0 || i === 4) {
      const glowLight = new THREE.PointLight(i === 0 ? '#f5a9c6' : '#ffcc4d', i === 0 ? 4 : 3, 15, 2);
      glowLight.position.set(0, 4.4, -1.6); group.add(glowLight);
    }
    if (i !== 0) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTexture(), color: i === 0 ? '#f5a9c6' : '#ffcc4d', transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      halo.scale.setScalar(7); halo.position.set(0, 3.4, -1); group.add(halo);
    }
    if (i > 0) {
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.8), new THREE.MeshStandardMaterial({ color: '#d8d0aa', roughness: 1, metalness: 0 }));
      panel.position.set(0, 2.5, -3.7); group.add(panel); group.userData.artPanel = panel;
    }
    bake(group, [glow, beacon]);
    return { group, glow, beacon };
  });

  const island = new THREE.Group(); scene.add(island);
  const satellites = new THREE.Group(); island.add(satellites);
  const portal = new THREE.Group(); island.add(portal);

  const dustGeometry = new THREE.BufferGeometry();
  const dustPositions = new Float32Array(360 * 3);
  for (let i = 0; i < 360; i++) {
    dustPositions[i * 3] = Math.sin(i * 43.17) * 95;
    dustPositions[i * 3 + 1] = 3 + (i * 17 % 70);
    dustPositions[i * 3 + 2] = Math.cos(i * 12.79) * 160;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: '#e2d8c0', size: .12, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(dust);

  // Feedback de jogo: partículas instanciadas leves (1 draw call) de poeira/faísca neon.
  const fxMesh = new THREE.InstancedMesh(
    new THREE.OctahedronGeometry(.07, 0),
    new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: .4, depthWrite: false }),
    FX_COUNT,
  );
  fxMesh.name = 'drive-fx-particles'; fxMesh.frustumCulled = false;
  const fxPool = Array.from({ length: FX_COUNT }, () => ({ life: 0, maxLife: .5, x: 0, y: -20, z: 0, vx: 0, vy: 0, vz: 0, scale: 0 }));
  const fxDummy = new THREE.Object3D(), fxColor = new THREE.Color();
  let fxCursor = 0;
  for (let i = 0; i < FX_COUNT; i++) { fxDummy.position.set(0, -20, 0); fxDummy.scale.setScalar(0); fxDummy.updateMatrix(); fxMesh.setMatrixAt(i, fxDummy.matrix); fxMesh.setColorAt(i, fxColor.set('#ffcc4d')); }
  scene.add(fxMesh);
  function spawnFx(x, y, z, vx, vy, vz, colorHex, scale = 1, maxLife = .55) {
    const p = fxPool[fxCursor];
    p.x = x; p.y = y; p.z = z; p.vx = vx; p.vy = vy; p.vz = vz; p.scale = scale; p.life = p.maxLife = maxLife;
    fxMesh.setColorAt(fxCursor, fxColor.set(colorHex));
    if (fxMesh.instanceColor) fxMesh.instanceColor.needsUpdate = true;
    fxCursor = (fxCursor + 1) % FX_COUNT;
  }

  // Original provisional landmark (Moinho).
  const windmill = new THREE.Group(); windmill.position.set(80, 15, -163); scene.add(windmill);
  const floatingRock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), surfaces.get('earth', 3));
  floatingRock.scale.set(17, 6, 14); floatingRock.position.y = -3; floatingRock.rotation.z = .12; windmill.add(floatingRock);
  cylinder(windmill, 14, 15, 1.4, [0, 0, 0], '#68806a', 12);
  cylinder(windmill, 3, 4.7, 17, [0, 9, 0], '#a28c73', 32).material = surfaces.get('plaster', 3, 5);
  cylinder(windmill, 0, 5.4, 5.5, [0, 20.1, 0], '#485e64', 32).material = surfaces.get('roof', 3);
  box(windmill, [1.7, 3.4, .15], [0, 3, 4.25], '#202b2e');
  for (const x of [-1.5, 1.5]) box(windmill, [1.1, 1.6, .15], [x, 9, 3.5], '#d2e2a8', true);
  const rotor = new THREE.Group(); rotor.position.set(0, 15, 4.8); windmill.add(rotor);
  const hub = cylinder(rotor, .7, .7, .9, [0, 0, .1], '#d2e2a8'); hub.rotation.x = Math.PI / 2;
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group(); blade.rotation.z = i * Math.PI / 2; rotor.add(blade);
    box(blade, [.2, 12, .25], [0, 5.7, 0], '#303d39');
    box(blade, [2.6, 7.5, .12], [1.1, 7.6, 0], '#c5bd9c').material = surfaces.get('wood', 1, 3);
    for (let j = 0; j < 6; j++) box(blade, [2.7, .09, .2], [1.1, 4.2 + j * 1.3, .1], '#48584a');
  }
  for (let i = 0; i < 5; i++) {
    const tuft = new THREE.Mesh(new THREE.ConeGeometry(1.5, 4 + i % 2, 5), material('#4c6d5b'));
    tuft.position.set(Math.cos(i * 1.3) * 10, 2, Math.sin(i * 1.3) * 9); windmill.add(tuft);
  }
  bake(rotor); bake(windmill, [rotor]);

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
  const storyMarkers = DISCOVERIES.map((point, i) => valueMarker(i === 0 ? { x: point.x - 5.5, z: point.z } : behind(point, 3), `HISTÓRIA ${i + 1} · ${point.kind}`, '#f5a9c6'));
  const memberMarkers = MEMBER_LOCATIONS.map((at, i) => valueMarker(at, ['2-D', 'MURDOC', 'NOODLE', 'RUSSEL'][i], MEMBER_ACCENTS[i]));

  let lastPropsCull = -Infinity;
  function applyQuality(config, vehicleX, vehicleZ) {
    const r = config.name === 'performance' ? 85 : Infinity;
    streetProps.setCullState?.(vehicleX, vehicleZ, r);
    limitStreetProps(streetProps.group, vehicleX, vehicleZ, r);
    lastPropsCull = -Infinity;
    fxMesh.count = config.particles;
    fauna.bodies.count = fauna.wings.count = config.birds;
    dust.visible = config.dust;
  }

  function loadSceneryLazy() {
    streetProps.loadSceneryModels?.();
    fauna.loadPigeonModel?.();
    arcadeCabinet.userData?.loadArcadeModel?.();
  }

  function updateFrame({ vehicle, camera, dt, t, reduced, showcase, known, nearby, qualityMode, frameCount }) {
    const { x, z, heading } = vehicle;
    if (qualityMode === 'performance' && t - lastPropsCull >= 1) {
      streetProps.setCullState?.(x, z, 85);
      limitStreetProps(streetProps.group, x, z, 85);
      lastPropsCull = t;
    }
    landmarks.update(t, reduced, dt);
    fauna.update(vehicle, camera.position, dt, t, reduced);
    island.visible = showcase; island.position.set(x, 0, z);
    dust.position.set(x, 0, z);
    if (!reduced) {
      rotor.rotation.z = -t * .3;
      windmill.position.y = 15 + Math.sin(t * .65) * .5;
      dust.rotation.y = Math.sin(t * .025) * .15;
      satellites.rotation.y = Math.sin(t * .1) * .12;
      portal.rotation.z = Math.sin(t * .07) * .04;
      if ((vehicle.braking || vehicle.drifting) && Math.abs(vehicle.speed) > 1.2) {
        const sinH = Math.sin(heading), cosH = Math.cos(heading);
        for (const side of [-1, 1]) {
          const wx = x + sinH * 2.9 + cosH * side * 1.35 + (Math.sin(t * 37 + side) * .18);
          const wz = z + cosH * 2.9 - sinH * side * 1.35 + (Math.cos(t * 29 + side) * .18);
          const spark = vehicle.drifting || vehicle.surface === 'terra' ? '#b7b8b0' : (frameCount + (side > 0 ? 1 : 0)) % 2 ? '#ff8a5c' : '#ffcc4d';
          spawnFx(wx, .22, wz, sinH * 2.4 + side * .6, 1.4 + (frameCount % 3) * .35, cosH * 2.4, spark, 1.15, .48);
        }
      }
      if (frameCount % 2 === 0) {
        for (const [pi, pt] of DISCOVERIES.entries()) {
          const d = Math.hypot(x - pt.x, z - pt.z);
          if (d < 15) {
            const ang = t * 2.4 + pi * 1.7 + (frameCount % 7) * .9, rad = 2.8 + (frameCount % 5) * .35;
            spawnFx(pt.x + Math.cos(ang) * rad, .35 + (frameCount % 4) * .25, pt.z + Math.sin(ang) * rad, Math.cos(ang) * .35, 1.65, Math.sin(ang) * .35, known.has(pt.id) ? '#d2e2a8' : '#f5a9c6', 1.1, .65);
            break;
          }
        }
      }
      let fxDirty = false;
      for (let i = 0; i < FX_COUNT; i++) {
        const p = fxPool[i];
        if (p.life > 0) {
          p.life = Math.max(0, p.life - dt);
          p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vy -= 1.8 * dt;
          const s = p.scale * Math.sin((p.life / p.maxLife) * Math.PI);
          fxDummy.position.set(p.x, Math.max(.05, p.y), p.z);
          fxDummy.rotation.set(t * 3 + i, t * 2 + i, 0);
          fxDummy.scale.setScalar(s);
          fxDummy.updateMatrix();
          fxMesh.setMatrixAt(i, fxDummy.matrix);
          fxDirty = true;
        }
      }
      if (fxDirty) fxMesh.instanceMatrix.needsUpdate = true;
    }

    for (const [i, object] of discoveryObjects.entries()) {
      if (i === 0 && object.group.userData.mural && !artRequested.has('mural-0') && Math.hypot(vehicle.x - DISCOVERIES[0].x, vehicle.z - DISCOVERIES[0].z) < 25) {
        artRequested.add('mural-0');
        artLoader.load('./assets/art/press-creators-band.webp', tex => {
          tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          const mural = object.group.userData.mural; mural.material.emissiveMap = null; mural.material.emissive.set('#000000');
          const frame = document.createElement('canvas'); frame.width = 1024; frame.height = 512; const fx = frame.getContext('2d');
          fx.fillStyle = '#d9cdb0'; fx.fillRect(0, 0, 1024, 512);
          const k = Math.min(1024 / tex.image.width, 512 / tex.image.height), dw = tex.image.width * k, dh = tex.image.height * k;
          fx.drawImage(tex.image, (1024 - dw) / 2, (512 - dh) / 2, dw, dh);
          const framed = new THREE.CanvasTexture(frame); framed.colorSpace = THREE.SRGBColorSpace; framed.anisotropy = tex.anisotropy;
          mural.material.map = framed; mural.material.needsUpdate = true;
        }, undefined, () => { console.warn('[arte] mural: mantendo o desenho em canvas'); });
      }
      if (i > 0 && object.group.userData.artPanel && shouldLoadArt(vehicle, DISCOVERIES[i], artRequested.has(`art-${i}`))) {
        artRequested.add(`art-${i}`);
        const panel = object.group.userData.artPanel; const path = artPaths[DISCOVERIES[i].id];
        if (path) artLoader.load(path, tex => { tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy()); panel.material.map = tex; panel.material.color.set('#ffffff'); panel.material.needsUpdate = true; }, undefined, () => { console.warn('[arte] painel: mantendo o placeholder'); });
      }
      if (!reduced) object.glow.scale.setScalar(1 + .035 * Math.sin(t * 2.2 + i));
      const found = known.has(DISCOVERIES[i].id);
      object.glow.material = material(found ? '#d2e2a8' : '#f5a9c6', true);
      object.beacon.material = material(found ? '#d2e2a8' : '#f5a9c6', true);
      object.beacon.position.y = 5.5 + (reduced ? 0 : Math.sin(t * 2 + i) * .35);
      object.beacon.rotation.y = reduced ? 0 : t * .7;
      const selected = nearby?.type === 'discovery' && nearby.index === i;
      object.beacon.scale.setScalar(selected ? 2.2 : 1);
      const marker = storyMarkers[i];
      if (marker.state !== found) {
        marker.state = found;
        marker.paint(found ? `✓ ${DISCOVERIES[i].kind} NO DIÁRIO` : `HISTÓRIA ${i + 1} · ${DISCOVERIES[i].kind}`, found ? '#d2e2a8' : '#f5a9c6');
      }
    }

    for (const marker of [...storyMarkers, ...memberMarkers]) {
      marker.group.visible = !(showcase && memberMarkers.includes(marker)) && Math.hypot(marker.group.position.x - camera.position.x, marker.group.position.z - camera.position.z) > 9;
      marker.label.rotation.y = Math.atan2(camera.position.x - marker.group.position.x, camera.position.z - marker.group.position.z);
    }
  }

  return {
    streetProps,
    fauna,
    arcadeCabinet,
    discoveryObjects,
    applyQuality,
    loadSceneryLazy,
    updateFrame,
  };
}
