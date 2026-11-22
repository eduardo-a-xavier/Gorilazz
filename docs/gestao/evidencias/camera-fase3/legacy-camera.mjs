// Copia fiel da camera de viagem ANTES da Fase 3 (src/scene.js do fim da Fase 2B), usada so como
// linha de base de medicao. Nao e importada pelo site.
import * as THREE from '../../../../src/vendor/three.module.min.js';
import { CITY_LOTS, ERA_GATES } from '../../../../src/world-data.js';

export function legacyBlockers() {
  return [
    ...CITY_LOTS.map(lot => ({ x: lot.x, z: lot.z, cos: Math.cos(lot.rotation), sin: Math.sin(lot.rotation), halfW: lot.w / 2 + 1.2, halfD: lot.d / 2 + 1.2, top: lot.floors * 3.2 + 1.5 })),
    ...ERA_GATES.flatMap(gate => [-1, 1].map(side => ({ x: gate.x + Math.cos(gate.heading) * side * (gate.width / 2 + 3), z: gate.z - Math.sin(gate.heading) * side * (gate.width / 2 + 3), cos: Math.cos(gate.heading), sin: Math.sin(gate.heading), halfW: 1.1, halfD: 1.1, top: 10 }))),
    { x: -28, z: 6, cos: 1, sin: 0, halfW: 8, halfD: 8, top: 16 },
  ];
}
const BLOCKERS = legacyBlockers();

function clearReach(x, z, angle, radius, height, blockers = BLOCKERS) {
  const sin = Math.sin(angle), cos = Math.cos(angle);
  for (let reach = 9.5; reach <= radius; reach += .75) {
    const px = x + sin * reach, pz = z + cos * reach, py = 2 + (height - 2) * reach / radius;
    for (const lot of blockers) {
      if (py > lot.top) continue;
      for (const side of [0, -1, 1]) {
        const dx = px + cos * side - lot.x, dz = pz - sin * side - lot.z;
        if (Math.abs(dx * lot.cos - dz * lot.sin) < lot.halfW && Math.abs(dx * lot.sin + dz * lot.cos) < lot.halfD) return Math.max(9.5, reach - .75);
      }
    }
  }
  return radius;
}

export function createLegacyCamera(blockers = BLOCKERS) {
  let smoothReach = null, smoothViewAngle = null, showcaseTurn = 0;
  function resync() { smoothReach = null; smoothViewAngle = null; showcaseTurn = 0; }
  function compute(vehicle, { dt = .016, t = 0, zoom = 1, dragAngle = 0, dragElevation = 0, orbit = false, reduced = false, showcase = false, mobile = false, desiredCamera = new THREE.Vector3(), look = new THREE.Vector3() } = {}) {
    const { x, z, heading, speed = 0 } = vehicle;
    const radius = (mobile ? (showcase ? 46 : 29) : (showcase ? 40 : 24)) * zoom + (reduced ? 0 : Math.abs(speed) * .12);
    const angle = (orbit && !reduced ? t * .16 : showcase ? .48 : .16) + dragAngle;
    const cameraAngle = angle + heading, cameraHeight = (showcase ? 12 : 11.8) + dragElevation;
    const reach = clearReach(x, z, cameraAngle, radius, cameraHeight, blockers), viewAngle = cameraAngle;
    if (reduced || smoothReach === null || smoothViewAngle === null) { smoothReach = reach; smoothViewAngle = viewAngle; }
    else {
      const delta = Math.atan2(Math.sin(viewAngle - smoothViewAngle), Math.cos(viewAngle - smoothViewAngle));
      smoothViewAngle += delta * (1 - Math.exp(-dt * 6));
      const reachRate = reach < smoothReach ? 1 - Math.exp(-dt * 10) : 1 - Math.exp(-dt * 3);
      smoothReach += (reach - smoothReach) * reachRate;
    }
    const effectiveHeight = THREE.MathUtils.lerp(Math.min(5.8, cameraHeight), cameraHeight, THREE.MathUtils.clamp((smoothReach - 9.5) / Math.max(1, radius - 9.5), 0, 1));
    desiredCamera.set(x + Math.sin(smoothViewAngle) * smoothReach, effectiveHeight, z + Math.cos(smoothViewAngle) * smoothReach);
    const ahead = 7 + Math.min(Math.abs(speed) * .27, 7);
    look.set(x - Math.sin(heading) * ahead, 2, z - Math.cos(heading) * ahead);
    return { desiredCamera, look, reach, smoothReach, viewAngle, smoothViewAngle, effectiveHeight, radius };
  }
  return { compute, resync };
}
