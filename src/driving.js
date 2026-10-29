import { nearestRoad, OBSTACLES, WORLD_BOUNDS } from './world-data.js';
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const approach = (n, target, delta) => n < target ? Math.min(target, n + delta) : Math.max(target, n - delta);
export function createVehicle() {
  return { x: 0, z: 0, heading: 0, speed: 0, steering: 0, acceleration: 0, distanceTravelled: 0, brakeWasDown: false, reverseReady: false, surface: 'asfalto', braking: false };
}
export function stepVehicle(state, input, dt) {
  const oldSpeed = state.speed;
  const brake = Boolean(input.brake), throttle = Boolean(input.throttle);
  if (!brake && state.brakeWasDown && Math.abs(state.speed) < .05) state.reverseReady = true;
  if (throttle) state.reverseReady = false;
  state.surface = nearestRoad(state).distance <= 6.5 ? 'asfalto' : 'terra';
  const rough = state.surface === 'terra';
  if (brake) {
    if (state.reverseReady && state.speed <= .05) state.speed = Math.max(-6, state.speed - 4 * dt);
    else state.speed = approach(state.speed, 0, 12 * dt);
  } else if (throttle) {
    state.speed = state.speed < 0 ? Math.min(0, state.speed + 12 * dt) : Math.min(22, state.speed + 6 * dt);
  } else state.speed = approach(state.speed, 0, ((rough ? 2 : .65) + state.speed ** 2 * (rough ? .025 : .008)) * dt);
  if (rough && state.speed > 13) state.speed = Math.max(13, state.speed - 8 * dt);
  const maxSteer = .6 / (1 + Math.abs(state.speed) * .035);
  state.steering = approach(state.steering, clamp(input.steer || 0, -1, 1) * maxSteer, dt * 2.4);
  state.heading += state.speed / 4 * Math.tan(state.steering) * dt;
  state.heading = Math.atan2(Math.sin(state.heading), Math.cos(state.heading));
  const travel = state.speed * dt;
  const x = state.x - Math.sin(state.heading) * travel, z = state.z - Math.cos(state.heading) * travel;
  const blocked = x < WORLD_BOUNDS.minX + 3 || x > WORLD_BOUNDS.maxX - 3 || z < WORLD_BOUNDS.minZ + 3 || z > WORLD_BOUNDS.maxZ - 3 || OBSTACLES.some(o => Math.hypot(x - o.x, z - o.z) < o.radius + 2.3);
  if (blocked) { state.speed = 0; state.reverseReady = false; }
  else { state.x = x; state.z = z; state.distanceTravelled += travel; }
  state.acceleration = (state.speed - oldSpeed) / dt;
  state.braking = brake && !state.reverseReady;
  state.brakeWasDown = brake;
  return state;
}
export function haltVehicle(state) {
  state.speed = 0; state.acceleration = 0; state.steering = 0; state.braking = false; state.brakeWasDown = false; state.reverseReady = false;
}
export function recoverVehicle(state) {
  const road = nearestRoad(state); state.x = road.x; state.z = road.z; state.heading = road.heading; haltVehicle(state);
}
