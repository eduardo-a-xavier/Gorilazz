// Visualizador 360° de um integrante no modal "EXPLORAR": gira o modelo Phase 7 por arraste ou pelos botões ‹ ›.
// Carga lazy: o GLB da banda só é baixado na primeira vez que o modal abre. Se falhar, a ficha mantém o retrato 2D.
import * as THREE from './vendor/three.module.min.js';
import { GLTFLoader } from './vendor/GLTFLoader.js';
import { loadModelSafely, repairMaterials } from './model-safety.js';

const MODEL = './assets/models/gorillaz-phase7-web-v2.glb';
const FALLBACK_MODEL = './assets/models/gorillaz-phase7-web.glb';
const STEP = Math.PI / 4; // botões ‹ › giram 45°

export function createMemberViewer({ canvas, onReady, onFail }) {
  let renderer = null, scene = null, camera = null, pivot = null, source = null, loading = null;
  let index = -1, yaw = 0, target = 0, drag = null, raf = 0;
  const roots = new Map(); // índice do integrante → objeto clonado (cada um só uma vez)

  async function loadSource() {
    if (source) return source;
    loading ??= (async () => {
      const loader = new GLTFLoader();
      const gltf = await loadModelSafely(loader, MODEL).catch(() => loadModelSafely(loader, FALLBACK_MODEL));
      repairMaterials(gltf.scene);
      source = gltf.scene;
      return source;
    })();
    return loading;
  }
  function ensureRenderer() {
    if (renderer) return;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
    camera.position.set(0, 2.1, 9.4); camera.lookAt(0, 1.9, 0);
    scene.add(new THREE.HemisphereLight('#f4efe2', '#2a3036', 1.6));
    const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(3, 6, 5); scene.add(key);
    pivot = new THREE.Group(); scene.add(pivot);
  }
  // Extrai o integrante do GLB, centraliza e escala para ~3,2 m de altura.
  function memberRoot(i) {
    if (roots.has(i)) return roots.get(i);
    let found = null;
    source.traverse(object => { if (!found && object.userData?.memberIndex === i) found = object; });
    if (!found) return null;
    const copy = found.clone(true);
    const box = new THREE.Box3().setFromObject(copy), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
    const holder = new THREE.Group();
    copy.position.set(-center.x, -box.min.y, -center.z);
    holder.add(copy);
    holder.scale.setScalar(3.2 / Math.max(size.y, .01));
    roots.set(i, holder);
    return holder;
  }
  function render() {
    raf = 0;
    if (!renderer) return;
    pivot.rotation.y += (target - pivot.rotation.y) * .18;
    renderer.render(scene, camera);
    if (Math.abs(target - pivot.rotation.y) > .001) raf = requestAnimationFrame(render);
  }
  function requestRender() { if (!raf) raf = requestAnimationFrame(render); }
  function resize() {
    if (!renderer) return;
    const w = canvas.clientWidth || 180, h = canvas.clientHeight || 240;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  // Mostra o integrante `i` (chamado ao abrir a ficha). Falhas caem no retrato 2D.
  async function show(i) {
    try {
      await loadSource();
      const model = memberRoot(i);
      if (!model) throw new Error(`integrante ${i} não encontrado no GLB`);
      ensureRenderer();
      for (const child of [...pivot.children]) pivot.remove(child);
      pivot.add(model);
      index = i; yaw = target = 0; pivot.rotation.y = 0;
      resize(); requestRender(); onReady?.(i);
    } catch (error) {
      console.warn('[360] visualizador indisponível; mantendo o retrato:', error.message);
      onFail?.(error);
    }
  }
  function rotate(steps) { target += steps * STEP; requestRender(); }

  canvas.addEventListener('pointerdown', event => { drag = { x: event.clientX, base: target }; canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging'); });
  canvas.addEventListener('pointermove', event => { if (!drag) return; target = drag.base + (event.clientX - drag.x) * .012; requestRender(); });
  for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { drag = null; canvas.classList.remove('dragging'); });
  window.addEventListener('resize', resize);

  return { show, rotate, get index() { return index; }, get target() { return target; } };
}

// Girador dos cards da seção editorial: um renderer compartilhado desenha o integrante no canvas do retrato.
// Lazy: o GLB só carrega quando o card entra na tela. Arrastar não abre a ficha (o clique é suprimido).
let spinRenderer = null, spinScene = null, spinCamera = null, spinPivot = null, spinSource = null, spinLoading = null;
const spinRoots = new Map();
function spinEnsureScene() {
  if (spinRenderer) return;
  const canvas = document.createElement('canvas');
  spinRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  spinRenderer.setPixelRatio(1); spinRenderer.setSize(240, 320, false);
  spinScene = new THREE.Scene();
  spinCamera = new THREE.PerspectiveCamera(30, 240 / 320, .1, 100);
  spinCamera.position.set(0, 2.1, 9.4); spinCamera.lookAt(0, 1.9, 0);
  spinScene.add(new THREE.HemisphereLight('#f4efe2', '#2a3036', 1.6));
  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(3, 6, 5); spinScene.add(key);
  spinPivot = new THREE.Group(); spinScene.add(spinPivot);
}
function spinLoad() {
  if (spinSource) return Promise.resolve(spinSource);
  spinLoading ??= (async () => {
    const loader = new GLTFLoader();
    const gltf = await loadModelSafely(loader, MODEL).catch(() => loadModelSafely(loader, FALLBACK_MODEL));
    repairMaterials(gltf.scene); spinSource = gltf.scene; return spinSource;
  })();
  return spinLoading;
}
function spinRoot(index) {
  if (spinRoots.has(index)) return spinRoots.get(index);
  let found = null;
  spinSource.traverse(object => { if (!found && object.userData?.memberIndex === index) found = object; });
  if (!found) return null;
  const copy = found.clone(true);
  const box = new THREE.Box3().setFromObject(copy), size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3());
  const holder = new THREE.Group();
  copy.position.set(-center.x, -box.min.y, -center.z); holder.add(copy);
  holder.scale.setScalar(3.2 / Math.max(size.y, .01));
  spinRoots.set(index, holder);
  return holder;
}

export function attachCardSpinners(hosts) {
  const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) { observer.unobserve(entry.target); spinLoad().then(() => entry.target.__spinStart?.()).catch(() => entry.target.__spinFail?.()); }
  }, { rootMargin: '200px' }) : null;
  for (const { host, index } of hosts) {
    const wrap = document.createElement('div'); wrap.className = 'spin-wrap'; wrap.hidden = true;
    const canvas = document.createElement('canvas'); canvas.width = 240; canvas.height = 320; canvas.className = 'spin-canvas';
    canvas.setAttribute('aria-label', 'Modelo 3D do integrante: arraste para girar'); canvas.setAttribute('role', 'img');
    const ctx = canvas.getContext('2d');
    const controls = document.createElement('div'); controls.className = 'spin-controls';
    const prev = document.createElement('button'), next = document.createElement('button');
    prev.type = next.type = 'button'; prev.textContent = '‹'; next.textContent = '›'; prev.setAttribute('aria-label', 'Girar para a esquerda'); next.setAttribute('aria-label', 'Girar para a direita');
    const hint = document.createElement('span'); hint.className = 'spin-hint'; hint.textContent = '360° · Arraste para girar';
    controls.append(prev, hint, next); wrap.append(canvas, controls); host.append(wrap);
    const spin = { yaw: 0, target: 0, drag: null, moved: false, raf: 0 };
    const draw = () => {
      spin.raf = 0;
      if (!spinSource) return;
      spinEnsureScene();
      const root = spinRoot(index); if (!root) return;
      spinPivot.clear(); spinPivot.add(root);
      spin.yaw += (spin.target - spin.yaw) * .25; spinPivot.rotation.y = spin.yaw;
      spinRenderer.render(spinScene, spinCamera);
      ctx.clearRect(0, 0, 240, 320); ctx.drawImage(spinRenderer.domElement, 0, 0, 240, 320);
      if (Math.abs(spin.target - spin.yaw) > .001) spin.raf = requestAnimationFrame(draw);
    };
    const request = () => { if (!spin.raf) spin.raf = requestAnimationFrame(draw); };
    const start = () => { host.querySelector('img')?.setAttribute('hidden', ''); wrap.hidden = false; request(); };
    const fail = () => { wrap.hidden = true; host.querySelector('img')?.removeAttribute('hidden'); };
    canvas.addEventListener('pointerdown', event => { spin.drag = { x: event.clientX, base: spin.target }; spin.moved = false; canvas.setPointerCapture(event.pointerId); canvas.classList.add('dragging'); });
    canvas.addEventListener('pointermove', event => { if (!spin.drag) return; const dx = event.clientX - spin.drag.x; if (Math.abs(dx) > 4) spin.moved = true; spin.target = spin.drag.base + dx * .012; request(); });
    for (const type of ['pointerup', 'pointercancel']) canvas.addEventListener(type, () => { spin.drag = null; canvas.classList.remove('dragging'); });
    canvas.addEventListener('click', event => { if (spin.moved) { event.stopPropagation(); event.preventDefault(); } spin.moved = false; }); // arrastar não abre a ficha
    prev.addEventListener('click', event => { event.stopPropagation(); spin.target -= Math.PI / 4; request(); });
    next.addEventListener('click', event => { event.stopPropagation(); spin.target += Math.PI / 4; request(); });
    for (const el of [prev, next]) el.addEventListener('click', event => event.stopPropagation());
    // Primeiro quadro só depois de carregar o GLB: enquanto isso, o retrato 2D continua.
    host.__spinStart = start; host.__spinFail = fail;
    if (observer) observer.observe(host); else spinLoad().then(start).catch(fail);
  }
}
