// Iluminação, sombras presas à grade de texels, fog, céu/atmosfera e pós-processamento.
import * as THREE from '../vendor/three.module.min.js';
import { CITY_ERAS, eraAt } from '../world-data.js';
import { createAtmosphere } from '../atmosphere.js';
import { createAmbientParticles } from '../ambient-particles.js';
import { createPostFX } from '../postfx.js';

export const SHADOW_SPAN = 90;

export function installLighting({ scene, renderer, light }) {
  scene.background = new THREE.Color('#202631');
  scene.fog = new THREE.FogExp2('#202631', .0045);
  scene.environmentIntensity = .5; // IBL mais baixo: sombras e relevo aparecem nas fachadas e na pista

  const atmosphere = createAtmosphere(scene, renderer);
  const ambient = createAmbientParticles(THREE, scene); // poeira, esporos e faíscas (micro-efeitos leves)
  let postfx = light ? null : createPostFX(renderer);
  renderer.domElement.dataset.quality = light ? 'leve' : postfx ? 'alta' : 'padrao';

  // Contraste e volume: céu frio e solo escuro (preenchimento fraco), sol quente e forte, contorno frio por trás.
  const skylight = new THREE.HemisphereLight('#e6eeff', '#2e2a22', .8);
  scene.add(skylight);
  const rimLight = new THREE.DirectionalLight('#7fb4ff', .9);
  rimLight.position.set(-40, 50, -40);
  scene.add(rimLight);

  const sunlight = new THREE.DirectionalLight('#ffd49a', 5.2);
  sunlight.castShadow = true;
  const shadowSize = light ? 1024 : 2048;
  const lightProfile = light;
  sunlight.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sunlight.shadow.camera, {
    left: -SHADOW_SPAN / 2, right: SHADOW_SPAN / 2,
    top: SHADOW_SPAN / 2, bottom: -SHADOW_SPAN / 2,
    near: 1, far: 260,
  });
  sunlight.shadow.normalBias = .02;
  sunlight.shadow.bias = -.0005;
  // A sombra é redesenhada em quadros alternados e presa à grade de texels: metade do custo, sem cintilar.
  sunlight.shadow.autoUpdate = false;
  scene.add(sunlight);
  scene.add(sunlight.target);

  const lightRight = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), atmosphere.sunDirection).normalize();
  const lightUp = new THREE.Vector3().crossVectors(atmosphere.sunDirection, lightRight);
  const shadowCentre = new THREE.Vector3();

  function aimSun(x, z) {
    const texel = SHADOW_SPAN / shadowSize;
    shadowCentre.set(x, 0, z);
    const right = Math.round(shadowCentre.dot(lightRight) / texel) * texel;
    const up = Math.round(shadowCentre.dot(lightUp) / texel) * texel;
    const depth = shadowCentre.dot(atmosphere.sunDirection);
    sunlight.target.position.set(0, 0, 0)
      .addScaledVector(lightRight, right)
      .addScaledVector(lightUp, up)
      .addScaledVector(atmosphere.sunDirection, depth);
    sunlight.position.copy(sunlight.target.position).addScaledVector(atmosphere.sunDirection, 130);
    sunlight.shadow.needsUpdate = true;
  }

  const districtLights = CITY_ERAS.map(({ light: cfg }) => ({
    sun: new THREE.Color(cfg.sun),
    sky: new THREE.Color(cfg.sky),
    haze: new THREE.Color(cfg.haze),
  }));

  let lightingReady = false;
  function update(vehicle, dt, t, blend, reduced, { overview, landmarkView }) {
    const cfg = districtLights[eraAt(vehicle)];
    const fade = lightingReady ? 1 - Math.exp(-dt * 1.6) : 1;
    sunlight.color.lerp(cfg.sun, fade);
    skylight.color.lerp(cfg.sky, fade);
    scene.fog.color.lerp(cfg.haze, fade);
    scene.background.copy(scene.fog.color);
    atmosphere.update(sunlight.color, skylight.color, scene.fog.color, t, reduced);
    atmosphere.follow(vehicle.x, vehicle.z);
    ambient.update(t, reduced);
    lightingReady = true;
    scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, overview ? .001 : landmarkView ? .002 : .003, blend);
  }

  function disablePostFX() {
    if (!postfx) return;
    postfx.dispose();
    postfx = null;
    renderer.domElement.dataset.quality = 'padrao';
  }

  function renderFrame(camera) {
    if (postfx) postfx.render(scene, camera);
    else { renderer.setRenderTarget(null); renderer.render(scene, camera); }
  }

  return {
    sunlight,
    skylight,
    lightProfile,
    aimSun,
    update,
    disablePostFX,
    hasPostFX: () => Boolean(postfx),
    renderFrame,
  };
}
