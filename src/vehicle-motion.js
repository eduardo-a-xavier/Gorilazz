import { clampFrameDelta } from './frame-timing.js';

export const MAX_BODY_TILT = Math.PI / 60;
export const MAX_BODY_ROLL = Math.PI / 45;
export const MAX_WHEEL_STEP = Math.PI / 240;
export const MAX_BODY_HEIGHT = .03;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function createVehicleMotion() {
  return { wheel: 0, pitch: 0, roll: 0, height: 0, pitchVelocity: 0, rollVelocity: 0, heightVelocity: 0, lastSurface: null };
}

// Solução exata de uma mola criticamente amortecida com alvo constante no quadro.
function spring(state, key, target, frequency, dt) {
  const velocityKey = key + 'Velocity';
  const offset = state[key] - target;
  const impulse = state[velocityKey] + frequency * offset;
  const decay = Math.exp(-frequency * dt);
  state[key] = target + (offset + impulse * dt) * decay;
  state[velocityKey] = (state[velocityKey] - frequency * impulse * dt) * decay;
}

export function updateVehicleMotion(state, vehicle, seconds, reduced = false) {
  const dt = clampFrameDelta(seconds);
  const desiredWheel = clamp(vehicle.steering * 1.9, -1.05, 1.05);
  const wheelStep = (desiredWheel - state.wheel) * (1 - Math.exp(-7 * dt));
  state.wheel += clamp(wheelStep, -MAX_WHEEL_STEP, MAX_WHEEL_STEP);
  if (dt === 0) return state;
  const pitch = reduced ? 0 : clamp(-vehicle.acceleration * .004, -MAX_BODY_TILT, MAX_BODY_TILT);
  const roll = reduced ? 0 : clamp(-vehicle.steering * vehicle.speed * .028, -MAX_BODY_ROLL, MAX_BODY_ROLL);
  const height = reduced ? 0 : .018 * clamp(Math.abs(vehicle.acceleration) / 9, 0, 1);
  if (!reduced && state.lastSurface && vehicle.surface && state.lastSurface !== vehicle.surface && Math.abs(vehicle.speed) > 1) {
    state.heightVelocity = Math.min(.36, state.heightVelocity + .36);
  }
  if (vehicle.surface) state.lastSurface = vehicle.surface;
  spring(state, 'pitch', pitch, 12, dt);
  spring(state, 'roll', roll, 10, dt);
  spring(state, 'height', height, 12, dt);
  state.pitch = clamp(state.pitch, -MAX_BODY_TILT, MAX_BODY_TILT);
  state.roll = clamp(state.roll, -MAX_BODY_ROLL, MAX_BODY_ROLL);
  if (state.height < 0 || state.height > MAX_BODY_HEIGHT) {
    state.height = clamp(state.height, 0, MAX_BODY_HEIGHT);
    state.heightVelocity = 0;
  }
  return state;
}


