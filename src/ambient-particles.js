// Partículas atmosféricas leves: poeira dourada na área inicial, esporos perto do moinho de Demon Days e faíscas
// neon na Av. Saturnz Barz. Um único THREE.Points (uma chamada de desenho), poucas partículas, sem alocação por quadro.
// As funções de posição são puras (testadas em Node); createAmbientParticles recebe THREE para não importar o vendor aqui.
import { DISCOVERIES, ROADS } from './world-data.js';

export const PARTICLE_KINDS = Object.freeze({
  dust: { count: 24, radius: 26, color: [1, .82, .42], y: [.4, 2.6] },
  spore: { count: 18, radius: 9, color: [.72, .92, .55], y: [.6, 4.2] },
  spark: { count: 16, radius: 6, color: [.45, .95, 1], y: [.3, 2.2] },
});

// Âncoras no mundo: início (0,0), moinho de Demon Days e um trecho central da Av. Saturnz Barz.
export function ambientAnchors() {
  const mill = DISCOVERIES.find(item => item.id === 'demon-days');
  const saturnz = ROADS.find(road => road.name === 'Av. Saturnz Barz');
  const mid = saturnz.samples[Math.floor(saturnz.samples.length / 2)];
  return {
    dust: { x: 0, z: 0 },
    spore: { x: mill.x, z: mill.z },
    spark: { x: mid.x, z: mid.z },
  };
}

// Posições determinísticas (semente fixa): espalhadas num disco ao redor da âncora, com alturas dentro da faixa do tipo.
export function particleLayout(kind, anchor, seed = 7) {
  const spec = PARTICLE_KINDS[kind];
  let s = seed + kind.length * 31;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const out = [];
  for (let i = 0; i < spec.count; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * spec.radius;
    out.push({ x: anchor.x + Math.cos(a) * r, y: spec.y[0] + rnd() * (spec.y[1] - spec.y[0]), z: anchor.z + Math.sin(a) * r, phase: rnd() * Math.PI * 2 });
  }
  return out;
}

export function totalParticles() {
  return Object.values(PARTICLE_KINDS).reduce((sum, spec) => sum + spec.count, 0);
}

export function createAmbientParticles(THREE, scene) {
  const anchors = ambientAnchors();
  const layouts = Object.keys(PARTICLE_KINDS).map(kind => ({ kind, items: particleLayout(kind, anchors[kind]) }));
  const count = totalParticles();
  const positions = new Float32Array(count * 3), colors = new Float32Array(count * 3);
  const base = [], phases = [];
  let k = 0;
  for (const { kind, items } of layouts) {
    const color = PARTICLE_KINDS[kind].color;
    for (const item of items) {
      base.push(item); phases.push(item.phase);
      positions[k * 3] = item.x; positions[k * 3 + 1] = item.y; positions[k * 3 + 2] = item.z;
      colors[k * 3] = color[0]; colors[k * 3 + 1] = color[1]; colors[k * 3 + 2] = color[2];
      k++;
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  // Sprite redondo (gradiente em canvas de 32 px, criado uma vez): partícula em vez de quadradinho.
  const dot = document.createElement('canvas'); dot.width = dot.height = 32;
  const dotCtx = dot.getContext('2d'); const halo = dotCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  halo.addColorStop(0, 'rgba(255,255,255,1)'); halo.addColorStop(.4, 'rgba(255,255,255,.6)'); halo.addColorStop(1, 'rgba(255,255,255,0)');
  dotCtx.fillStyle = halo; dotCtx.fillRect(0, 0, 32, 32);
  const sprite = new THREE.CanvasTexture(dot);
  const material = new THREE.PointsMaterial({ map: sprite, size: .42, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: .85, depthWrite: false, toneMapped: false });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false; points.name = 'ambient-particles';
  scene.add(points);
  const attribute = geometry.attributes.position;
  return {
    // Flutuação suave; com movimento reduzido, as partículas ficam paradas.
    update(time, reduced) {
      if (reduced) return;
      for (let i = 0; i < count; i++) {
        const b = base[i];
        attribute.array[i * 3] = b.x + Math.sin(time * .35 + phases[i]) * .35;
        attribute.array[i * 3 + 1] = b.y + Math.sin(time * .9 + phases[i] * 1.7) * .25;
        attribute.array[i * 3 + 2] = b.z + Math.cos(time * .3 + phases[i]) * .35;
      }
      attribute.needsUpdate = true;
    },
    get count() { return count; },
    dispose() { scene.remove(points); geometry.dispose(); material.dispose(); sprite.dispose(); },
  };
}
