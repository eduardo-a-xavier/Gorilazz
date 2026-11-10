import * as THREE from './vendor/three.module.min.js';

// Céu procedural, reflexos de ambiente e mar. Tudo é gerado em execução: o céu
// recebe as cores de cada bairro, vira o mapa de ambiente (PMREM) que ilumina
// vidro e metal, e o horizonte usa a mesma cor da neblina para não haver emenda.

const SKY_VERTEX = 'varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }';
const SKY_FRAGMENT = `
varying vec3 vDir;
uniform vec3 zenith; uniform vec3 horizon; uniform vec3 sunColor; uniform vec3 sunDir; uniform float time;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x), mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p) { float a = .5, s = 0.; for (int i = 0; i < 4; i++) { s += a * noise(p); p = p * 2.03 + 7.1; a *= .5; } return s; }
void main() {
  vec3 d = normalize(vDir); float h = clamp(d.y, 0., 1.);
  vec3 color = mix(horizon, zenith, pow(h, .5));
  float s = max(dot(d, sunDir), 0.);
  color += sunColor * (pow(s, 6.) * .22 + pow(s, 48.) * .45);
  if (d.y > .02) {
    vec2 p = d.xz / (d.y + .12) * 1.5 + time * vec2(.008, .003);
    float cover = smoothstep(.5, .82, fbm(p)) * smoothstep(.02, .22, d.y);
    vec3 cloud = mix(horizon * 1.2, sunColor, .3) * (.6 + .4 * pow(s, 3.)) + .06;
    color = mix(color, cloud, cover * .75);
  }
  // Disco solar gráfico, acima de 1.0 para alimentar o bloom.
  color += sunColor * smoothstep(.9962, .9968, s) * 3.;
  color = mix(horizon, color, smoothstep(-.03, .05, d.y));
  gl_FragColor = vec4(color, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

function waterNormals(size = 256) {
  // Soma de ondas com frequências inteiras: a textura repete sem emenda.
  const waves = [[1, 2, .9, 0], [3, 1, .5, 1.3], [2, 5, .32, 2.1], [6, 3, .2, .7], [7, 9, .12, 4.2], [12, 5, .08, 3.3]];
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const context = canvas.getContext('2d'), image = context.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let dx = 0, dy = 0;
    for (const [kx, ky, amplitude, phase] of waves) {
      const slope = Math.cos((kx * x + ky * y) / size * Math.PI * 2 + phase) * amplitude;
      dx += slope * kx; dy += slope * ky;
    }
    const nx = -dx * .16, ny = -dy * .16, length = Math.hypot(nx, ny, 1), i = (y * size + x) * 4;
    image.data[i] = (nx / length * .5 + .5) * 255; image.data[i + 1] = (ny / length * .5 + .5) * 255;
    image.data[i + 2] = (1 / length * .5 + .5) * 255; image.data[i + 3] = 255;
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(70, 70); texture.anisotropy = 4;
  return texture;
}

export function createAtmosphere(scene, renderer) {
  // Sol à frente e à esquerda da vista inicial, a ~45°: um lado da rua iluminado, o outro em sombra.
  const sunDirection = new THREE.Vector3(-.6, .74, -.42).normalize();
  const uniforms = {
    zenith: { value: new THREE.Color() }, horizon: { value: new THREE.Color() }, sunColor: { value: new THREE.Color() },
    sunDir: { value: sunDirection }, time: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({ vertexShader: SKY_VERTEX, fragmentShader: SKY_FRAGMENT, uniforms, side: THREE.BackSide, depthWrite: false, fog: false });
  const geometry = new THREE.SphereGeometry(480, 32, 16);
  const sky = new THREE.Mesh(geometry, material); sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), new THREE.MeshStandardMaterial({ color: '#1c4553', roughness: .2, metalness: .05, normalMap: waterNormals() }));
  water.material.normalScale.set(.55, .55); water.rotation.x = -Math.PI / 2; water.position.set(0, -5.5, -75); water.receiveShadow = true; scene.add(water);

  const pmrem = new THREE.PMREMGenerator(renderer), probe = new THREE.Scene();
  probe.add(new THREE.Mesh(geometry, material));
  const baked = new THREE.Color(-1, -1, -1); let environment = null, bakedAt = -Infinity;
  function bake(time) {
    const next = pmrem.fromScene(probe, 0, 1, 1000);
    scene.environment = next.texture; environment?.dispose(); environment = next;
    baked.copy(uniforms.horizon.value); bakedAt = time;
  }
  const tint = new THREE.Color('#3b6ea8');
  return {
    sunDirection,
    update(sun, skyColor, haze, time, reduced) {
      uniforms.sunColor.value.copy(sun); uniforms.horizon.value.copy(haze);
      uniforms.zenith.value.copy(tint).lerp(skyColor, .28);
      if (!reduced) { uniforms.time.value = time; water.material.normalMap.offset.set(time * .012, time * .007); }
      // O ambiente só é refeito quando a cor do bairro mudou de forma perceptível.
      const drift = Math.abs(baked.r - haze.r) + Math.abs(baked.g - haze.g) + Math.abs(baked.b - haze.b);
      if (drift > .03 && time - bakedAt > .4) bake(time);
    },
    follow(x, z) { sky.position.set(x, 0, z); },
  };
}
