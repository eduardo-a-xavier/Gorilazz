import test from 'node:test';
import assert from 'node:assert/strict';
import { createVehicleMotion, updateVehicleMotion, MAX_BODY_TILT, MAX_BODY_ROLL, MAX_WHEEL_STEP, MAX_BODY_HEIGHT } from '../src/vehicle-motion.js';

test('volante conserva limite e estado entre modos', () => {
  const state = createVehicleMotion(), vehicle = { steering: .6, speed: 15, acceleration: 0 };
  let previous = state.wheel;
  for (let i = 0; i < 180; i++) {
    updateVehicleMotion(state, vehicle, i === 40 ? 5 : 1 / 60);
    assert.ok(Math.abs(state.wheel - previous) <= MAX_WHEEL_STEP + 1e-12);
    previous = state.wheel;
  }
  assert.ok(Math.abs(state.wheel - 1.05) < 1e-5);
});

test('molas críticas fornecem roll e resposta vertical limitados, sem oscilar ao estabilizar', () => {
  const state = createVehicleMotion(), vehicle = { steering: .4, speed: 14, acceleration: 8, surface: 'asfalto' };
  for (let i = 0; i < 180; i++) updateVehicleMotion(state, vehicle, 1 / 60);
  assert.ok(Math.abs(state.roll) >= 2 * Math.PI / 180 && Math.abs(state.roll) <= MAX_BODY_ROLL);
  assert.ok(state.height >= .01 && state.height <= MAX_BODY_HEIGHT);
  assert.ok(Math.abs(state.pitch) <= MAX_BODY_TILT);
  vehicle.steering = vehicle.acceleration = 0;
  for (let i = 0; i < 180; i++) {
    const old = { ...state }; updateVehicleMotion(state, vehicle, 1 / 60);
    assert.ok(Math.abs(state.roll) <= Math.abs(old.roll) + 1e-12);
    assert.ok(Math.abs(state.pitch) <= Math.abs(old.pitch) + 1e-12);
    assert.ok(state.height <= old.height + 1e-12 && state.height >= 0);
  }
  vehicle.surface = 'terra'; updateVehicleMotion(state, vehicle, 1 / 60);
  let maximum = state.height;
  for (let i = 0; i < 120; i++) { updateVehicleMotion(state, vehicle, 1 / 60); maximum = Math.max(maximum, state.height); }
  assert.ok(maximum > .001 && maximum <= MAX_BODY_HEIGHT);
  assert.ok(state.height < .00001);
});

test('passo longo equivale a 50 ms e zero não altera estado', () => {
  const a = createVehicleMotion(), b = createVehicleMotion(), vehicle = { steering: .2, speed: 10, acceleration: 5 };
  updateVehicleMotion(a, vehicle, 10); updateVehicleMotion(b, vehicle, .05);
  assert.deepEqual(a, b);
  const before = { ...a }; updateVehicleMotion(a, vehicle, 0); assert.deepEqual(a, before);
});

test('curva medida pela QA produz roll entre 2 e 4 graus sem perder o limite', () => {
  const state = createVehicleMotion();
  const vehicle = { steering: .12, speed: 15, acceleration: 0, surface: 'asfalto' };
  for (let i = 0; i < 90; i++) updateVehicleMotion(state, vehicle, 1 / 60);
  assert.ok(Math.abs(state.roll) >= 2 * Math.PI / 180 && Math.abs(state.roll) <= MAX_BODY_ROLL);
});
