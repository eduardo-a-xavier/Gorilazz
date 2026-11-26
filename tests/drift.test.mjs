import test from 'node:test';
import assert from 'node:assert/strict';
import { createVehicle, stepVehicle, haltVehicle } from '../src/driving.js';

test('Shift + aceleração parado/baixa velocidade ativa burnout com tração progressiva e recupera ao soltar', () => {
  const v = createVehicle();
  for (let i = 0; i < 60; i++) stepVehicle(v, { throttle: true, drift: true, steer: 0 }, 1 / 60);
  assert.equal(v.burnout, true, 'deve ativar burnout com W + Shift no asfalto');
  assert.ok(v.speed > 0 && v.speed <= 6.5, `velocidade de burnout controlada (${v.speed.toFixed(2)} m/s)`);
  assert.ok(v.tireIntensity > 0.5, `intensidade de pneu alta no burnout (${v.tireIntensity.toFixed(2)})`);

  // Ao soltar Shift mantendo W, sai do burnout e acelera normalmente
  for (let i = 0; i < 60; i++) stepVehicle(v, { throttle: true, drift: false, steer: 0 }, 1 / 60);
  assert.equal(v.burnout, false, 'deve encerrar burnout ao soltar Shift');
  assert.ok(v.speed > 6.5, `deve ganhar velocidade após soltar Shift (${v.speed.toFixed(2)} m/s)`);
});

test('Shift em curva acima de 15 km/h ativa drift controlado e recupera slip suavemente ao soltar', () => {
  const v = createVehicle();
  v.speed = 12; // ~43 km/h no asfalto
  for (let i = 0; i < 30; i++) stepVehicle(v, { throttle: true, drift: true, steer: 1 }, 1 / 60);
  assert.equal(v.drifting, true, 'deve entrar em drift controlado com Shift + esterço');
  assert.ok(Math.abs(v.slip) > 0.05 && Math.abs(v.slip) <= Math.PI / 9 + 1e-4, `slip lateral controlado (${v.slip.toFixed(3)} rad)`);
  assert.ok(v.tireIntensity > 0.3, 'deve gerar intensidade sonora/visual de pneu');

  for (let i = 0; i < 90; i++) stepVehicle(v, { throttle: true, drift: false, steer: 0 }, 1 / 60);
  assert.equal(v.drifting, false, 'deve encerrar drift ao soltar Shift');
  assert.ok(Math.abs(v.slip) < 0.02, `slip deve recuperar suavemente para ~0 (${v.slip.toFixed(4)})`);
});

test('haltVehicle limpa estado de drift, burnout e tireIntensity', () => {
  const v = createVehicle();
  v.speed = 12;
  for (let i = 0; i < 20; i++) stepVehicle(v, { throttle: true, drift: true, steer: -1 }, 1 / 60);
  haltVehicle(v);
  assert.equal(v.drifting, false);
  assert.equal(v.burnout, false);
  assert.equal(v.tireIntensity, 0);
  assert.equal(v.slip, 0);
});
