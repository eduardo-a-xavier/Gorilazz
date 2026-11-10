import * as THREE from './vendor/three.module.min.js';

// Pós-processamento local e enxuto: a cena é desenhada em HDR (meio-float, MSAA),
// o brilho de neon, telões e sol passa por um bloom de filtro duplo em resoluções
// decrescentes e a composição final aplica vinheta, tone mapping e sRGB.
// Sem dependências externas; se o aparelho não renderiza em meio-float, retorna null
// e a cena continua sendo desenhada direto na tela.

const VERTEX = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }';
const DOWN = `
uniform sampler2D map; uniform vec2 texel; uniform float threshold; varying vec2 vUv;
vec3 pick(vec2 uv) {
  vec3 c = min(texture2D(map, uv).rgb, vec3(12.));
  if (threshold < 0.) return c;
  float level = max(c.r, max(c.g, c.b));
  float soft = clamp(level - threshold + .35, 0., .7); soft = soft * soft / 1.4;
  return c * max(soft, level - threshold) / max(level, 1e-4);
}
void main() {
  vec3 sum = pick(vUv) * 4.;
  sum += pick(vUv + texel) + pick(vUv - texel) + pick(vUv + vec2(texel.x, -texel.y)) + pick(vUv - vec2(texel.x, -texel.y));
  gl_FragColor = vec4(sum / 8., 1.);
}`;
const UP = `
uniform sampler2D map; uniform vec2 texel; varying vec2 vUv;
void main() {
  vec3 sum = texture2D(map, vUv + vec2(-texel.x * 2., 0.)).rgb + texture2D(map, vUv + vec2(texel.x * 2., 0.)).rgb
    + texture2D(map, vUv + vec2(0., texel.y * 2.)).rgb + texture2D(map, vUv + vec2(0., -texel.y * 2.)).rgb;
  sum += 2. * (texture2D(map, vUv + texel).rgb + texture2D(map, vUv - texel).rgb
    + texture2D(map, vUv + vec2(texel.x, -texel.y)).rgb + texture2D(map, vUv - vec2(texel.x, -texel.y)).rgb);
  gl_FragColor = vec4(sum / 12., 1.);
}`;
const COMPOSITE = `
uniform sampler2D map; uniform sampler2D bloom; uniform float strength; uniform float vignette; varying vec2 vUv;
void main() {
  vec3 color = texture2D(map, vUv).rgb + texture2D(bloom, vUv).rgb * strength;
  vec2 d = vUv - .5; color *= 1. - dot(d, d) * vignette;
  gl_FragColor = vec4(color, 1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createPostFX(renderer, { levels = 4, threshold = 1.05, strength = .55, vignette = .55 } = {}) {
  const gl = renderer.getContext();
  if (!renderer.capabilities.isWebGL2 || !(gl.getExtension('EXT_color_buffer_float') || gl.getExtension('EXT_color_buffer_half_float'))) return null;
  const options = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
  const sceneTarget = new THREE.WebGLRenderTarget(1, 1, { ...options, depthBuffer: true, samples: Math.min(4, renderer.capabilities.maxSamples) });
  const chain = Array.from({ length: levels }, () => new THREE.WebGLRenderTarget(1, 1, options));
  const triangle = new THREE.BufferGeometry();
  triangle.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  triangle.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const pass = (fragmentShader, uniforms, extra = {}) => new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
  const down = pass(DOWN, { map: { value: null }, texel: { value: new THREE.Vector2() }, threshold: { value: -1 } });
  const up = pass(UP, { map: { value: null }, texel: { value: new THREE.Vector2() } }, { blending: THREE.AdditiveBlending, transparent: true });
  const composite = pass(COMPOSITE, { map: { value: sceneTarget.texture }, bloom: { value: chain[0].texture }, strength: { value: strength }, vignette: { value: vignette } }, { toneMapped: true });
  const quad = new THREE.Mesh(triangle, down); quad.frustumCulled = false;
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const size = new THREE.Vector2(); let width = 0, height = 0;
  function fit() {
    renderer.getDrawingBufferSize(size);
    if (size.x === width && size.y === height) return;
    width = size.x; height = size.y; sceneTarget.setSize(width, height);
    chain.forEach((target, i) => target.setSize(Math.max(1, width >> (i + 1)), Math.max(1, height >> (i + 1))));
  }
  function draw(material, target) { quad.material = material; renderer.setRenderTarget(target); renderer.render(quad, camera); }
  return {
    render(scene, view) {
      fit();
      renderer.setRenderTarget(sceneTarget); renderer.render(scene, view);
      const autoClear = renderer.autoClear; renderer.autoClear = false;
      let source = sceneTarget;
      chain.forEach((target, i) => {
        down.uniforms.map.value = source.texture; down.uniforms.texel.value.set(1 / source.width, 1 / source.height);
        down.uniforms.threshold.value = i ? -1 : threshold; draw(down, target); source = target;
      });
      for (let i = levels - 1; i > 0; i--) {
        up.uniforms.map.value = chain[i].texture; up.uniforms.texel.value.set(.5 / chain[i].width, .5 / chain[i].height);
        draw(up, chain[i - 1]);
      }
      renderer.autoClear = autoClear;
      draw(composite, null);
    },
    dispose() { sceneTarget.dispose(); chain.forEach(target => target.dispose()); triangle.dispose(); down.dispose(); up.dispose(); composite.dispose(); },
  };
}
