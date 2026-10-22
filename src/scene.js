import * as THREE from './vendor/three.module.min.js';

// All geometry is original and generated locally. No remote models or textures.
export function createWorld(container, onMember) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Estrada 3D com carro, personagens e cenários musicais');
  renderer.domElement.setAttribute('role', 'img');
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#252144');
  scene.fog = new THREE.FogExp2('#252144', .006);
  const camera = new THREE.PerspectiveCamera(46, 1, .1, 650);
  scene.add(new THREE.HemisphereLight('#c6d7ff', '#755375', 2.4));
  const sunlight = new THREE.DirectionalLight('#ffe4c2', 3.7);
  sunlight.position.set(-35, 65, 15); sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  Object.assign(sunlight.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, far: 180 });
  sunlight.shadow.normalBias = .03; scene.add(sunlight); scene.add(sunlight.target);
  const materials = new Map();
  function material(color, glow = false) {
    const key = color + glow;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .65, metalness: .12, ...(glow ? { emissive: color, emissiveIntensity: .65 } : {}) }));
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
  const ground = box(scene, [190, 1, 1500], [0, -1, -620], '#39334e');
  ground.receiveShadow = true;
  box(scene, [17, .3, 1420], [0, -.25, -620], '#202333');
  for (const x of [-8.2, 8.2]) box(scene, [.22, .04, 1410], [x, -.07, -620], '#f2559c', true);
  for (let z = 70; z > -1310; z -= 12) {
    box(scene, [.18, .05, 5], [0, -.04, z], '#e2d8c0');
    for (const x of [-11, 11]) {
      box(scene, [.16, 1.2, .16], [x, .6, z], '#8d8ba4');
      box(scene, [.25, .22, .25], [x, 1.2, z], '#7fa6ff', true);
    }
  }
  // Deterministic skyline and trees keep the scene identical on every visit.
  for (let i = 0; i < 75; i++) {
    const z = 30 - i * 18;
    for (const side of [-1, 1]) {
      const x = side * (24 + (i * 17 % 47));
      const h = 10 + (i * 13 % 35);
      if (i % 3) {
        const tower = box(scene, [7 + i % 5, h, 8], [x, h / 2 - 1, z], i % 2 ? '#45416a' : '#303556');
        for (let y = 4; y < h - 2; y += 6) box(tower, [2.4, .7, .08], [0, y - h / 2, 4.05], i % 2 ? '#f2559c' : '#7fa6ff', true);
      } else {
        cylinder(scene, .4, .7, 5, [side * 15, 2, z], '#5b4562');
        const tree = new THREE.Mesh(new THREE.ConeGeometry(3.3, 9, 5), material('#477b80'));
        tree.position.set(side * 15, 8, z); scene.add(tree);
      }
    }
  }
  function sign(text, x, z, color = '#f2559c') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const context = canvas.getContext('2d'); context.fillStyle = '#141414'; context.fillRect(0, 0, 768, 256);
    context.strokeStyle = color; context.lineWidth = 16; context.strokeRect(8, 8, 752, 240);
    context.fillStyle = '#e2d8c0'; context.font = 'bold 55px monospace'; context.textAlign = 'center';
    text.split('|').forEach((line, index, lines) => context.fillText(line, 384, lines.length === 1 ? 150 : 105 + index * 72, 700));
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const board = new THREE.Mesh(new THREE.BoxGeometry(16, 5.3, .3), new THREE.MeshStandardMaterial({ map: texture, roughness: .7 }));
    board.position.set(x, 9, z); board.rotation.y = x < 0 ? .22 : -.22; scene.add(board);
    for (const dx of [-5, 5]) box(scene, [.4, 7, .4], [x + dx, 3, z], '#777487');
  }
  const names = ['KONG STUDIOS|WELCOME TO THE ROAD', '1998 / LONDON|THE BEGINNING', 'MEET THE BAND|FOUR MINDS. ONE SOUND.', 'NO GENRE.|NO BOUNDARIES.', 'PLASTIC BEACH|WELCOME TO PARADISE', 'LIVE ON STAGE|TURN IT UP', 'A DIFFERENT WORLD|LISTEN CLOSER', 'MADE BY STUDENTS|DRIVEN BY MUSIC', 'NO REALITY.|JUST GORILLAZ.'];
  names.forEach((name, i) => sign(name, i % 2 ? -19 : 19, -i * 140 - 20));
  // Raised solar disc at the vanishing point.
  const sun = new THREE.Mesh(new THREE.CircleGeometry(45, 64), new THREE.MeshBasicMaterial({ color: '#f2559c', fog: false }));
  sun.position.set(0, 65, -1450); scene.add(sun);
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
  const people = [.22, .44, .65, .86].map((progress, index) => {
    const actor = person(index); actor.group.position.set(index % 2 ? 5.7 : -5.7, 0, -progress * 1120);
    actor.group.rotation.y = Math.PI + (index % 2 ? .3 : -.3); actor.group.userData.member = index;
    actor.group.traverse(object => { object.userData.member = index; }); scene.add(actor.group);
    const platform = cylinder(scene, 3.7, 4, .4, [actor.group.position.x, -.08, actor.group.position.z], '#3a68d8'); platform.receiveShadow = true;
    sign(['2-D / VOCALS', 'MURDOC / BASS', 'NOODLE / GUITAR', 'RUSSEL / DRUMS'][index], index % 2 ? 18 : -18, actor.group.position.z - 5, '#7fa6ff');
    return actor;
  });
  const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
  renderer.domElement.addEventListener('click', event => {
    const bounds = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(people.map(actor => actor.group), true)[0];
    if (hit) onMember(hit.object.userData.member);
  });
  function resize() {
    const width = container.clientWidth; const height = container.clientHeight;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  }
  const observer = new ResizeObserver(resize); observer.observe(container); resize();
  let wasZ = 0;
  const look = new THREE.Vector3();
  return {
    update(progress, time, moving, orbit, reduced, showcase) {
      const z = -progress * 1120; const t = time / 1000;
      car.position.z = z; car.position.y = moving && !reduced ? Math.sin(t * 14) * .035 : 0;
      car.rotation.z = moving && !reduced ? Math.sin(t * 2) * .012 : 0;
      wheels.forEach(wheel => { wheel.rotation.x += (z - wasZ) * .8; }); wasZ = z;
      const angle = orbit && !reduced ? t * .18 : .48;
      const mobile = container.clientWidth < 600;
      const radius = mobile ? 30 : 24;
      camera.position.set(Math.sin(angle) * radius, orbit ? 10 : 9, z + Math.cos(angle) * radius);
      look.set(0, 1.5, z - (orbit || showcase ? 1 : 12)); camera.lookAt(look);
      sunlight.position.z = z + 20; sunlight.target.position.z = z - 15;
      for (const [i, actor] of people.entries()) {
        actor.group.position.x = showcase ? (i % 2 ? 5.5 : -5.5) : (i % 2 ? 5.7 : -5.7);
        actor.group.position.z = showcase ? z + (i < 2 ? -5 : 3) : -[.22, .44, .65, .86][i] * 1120;
        actor.group.position.y = reduced ? 0 : Math.sin(t * 2 + i) * .07;
        actor.arms[0].rotation.z = reduced ? -.15 : Math.sin(t * 2 + i) * .12 - .15;
        actor.arms[1].rotation.z = reduced ? .15 : Math.cos(t * 2 + i) * .12 + .15;
      }
      renderer.render(scene, camera);
    },
  };
}
