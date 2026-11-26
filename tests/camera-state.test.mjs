import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA_MODES, createCameraState } from '../src/camera-state.js';

test('CAMERA_MODES expõe exatamente os 7 modos esperados', () => {
  assert.deepEqual(CAMERA_MODES, ['follow', 'cockpit', 'orbit', 'world', 'windmill', 'sky', 'tour-orbit']);
});

test('estado inicial padrão começa em follow com showcase ativo', () => {
  const cam = createCameraState();
  assert.equal(cam.mode, 'follow');
  assert.equal(cam.showcase, true);
  assert.equal(cam.firstPerson, false);
  assert.equal(cam.overview, false);
  assert.equal(cam.landmarkView, false);
  assert.equal(cam.orbital, false);
  assert.equal(cam.sky, false);
  assert.equal(cam.tourOrbit, false);
  assert.equal(cam.cameraFocus, false);
});

test('toggleMode alterna cockpit, world, windmill e orbit de forma exclusiva', () => {
  const cam = createCameraState();
  cam.toggleMode('cockpit');
  assert.equal(cam.mode, 'cockpit');
  assert.equal(cam.firstPerson, true);
  assert.equal(cam.showcase, false);

  cam.toggleMode('world');
  assert.equal(cam.mode, 'world');
  assert.equal(cam.firstPerson, false);
  assert.equal(cam.overview, true);

  cam.toggleMode('windmill');
  assert.equal(cam.mode, 'windmill');
  assert.equal(cam.overview, false);
  assert.equal(cam.landmarkView, true);

  cam.toggleMode('windmill');
  assert.equal(cam.mode, 'follow');
  assert.equal(cam.landmarkView, false);

  cam.toggleMode('orbit');
  assert.equal(cam.mode, 'orbit');
  assert.equal(cam.orbital, true);

  cam.toggleMode('orbit');
  assert.equal(cam.mode, 'follow');
});

test('sky (L) ativa a partir de follow/orbit e restaura ao soltar, sem afetar cockpit/world', () => {
  const cam = createCameraState({ showcase: false });
  cam.setSky(true);
  assert.equal(cam.mode, 'sky');
  assert.equal(cam.sky, true);
  cam.setSky(false);
  assert.equal(cam.mode, 'follow');

  cam.setMode('orbit');
  cam.setSky(true);
  assert.equal(cam.mode, 'sky');
  cam.setSky(false);
  assert.equal(cam.mode, 'orbit');

  cam.setMode('cockpit');
  cam.setSky(true);
  assert.equal(cam.mode, 'cockpit');

  cam.setMode('world');
  cam.setSky(true);
  assert.equal(cam.mode, 'world');
});

test('tour-orbit preserva cockpit em 1ª pessoa e restaura follow/orbit ao sair', () => {
  const cam = createCameraState({ showcase: false });
  cam.enterTourOrbit();
  assert.equal(cam.mode, 'tour-orbit');
  assert.equal(cam.tourOrbit, true);
  cam.exitTourOrbit();
  assert.equal(cam.mode, 'follow');

  cam.setMode('cockpit');
  cam.enterTourOrbit();
  assert.equal(cam.mode, 'cockpit');
  cam.exitTourOrbit();
  assert.equal(cam.mode, 'cockpit');
});

test('onManualInput (WASD) encerra tour-orbit/world/windmill/sky e showcase, preservando cockpit e orbit', () => {
  const cam = createCameraState({ showcase: true });
  cam.enterTourOrbit();
  cam.onManualInput();
  assert.equal(cam.mode, 'follow');
  assert.equal(cam.showcase, false);

  cam.setMode('world');
  cam.onManualInput();
  assert.equal(cam.mode, 'follow');

  cam.setMode('windmill');
  cam.onManualInput();
  assert.equal(cam.mode, 'follow');

  cam.setMode('cockpit');
  cam.onManualInput();
  assert.equal(cam.mode, 'cockpit');

  cam.setMode('orbit');
  cam.onManualInput();
  assert.equal(cam.mode, 'orbit');
});

test('save/restore e enterModalFocus/exitModalFocus preservam modo e showcase ao abrir/fechar mapa ou modal', () => {
  const cam = createCameraState({ showcase: false });
  cam.setMode('cockpit');
  const snap = cam.save();
  cam.setMode('world');
  assert.equal(cam.mode, 'world');
  cam.restore(snap);
  assert.equal(cam.mode, 'cockpit');

  cam.setMode('orbit');
  cam.enterModalFocus();
  assert.equal(cam.cameraFocus, true);
  cam.exitModalFocus();
  assert.equal(cam.cameraFocus, false);
  assert.equal(cam.mode, 'orbit');
});

test('onFullscreenChange nunca troca modo de câmera nem showcase', () => {
  const cam = createCameraState({ showcase: false });
  cam.setMode('cockpit');
  cam.onFullscreenChange();
  assert.equal(cam.mode, 'cockpit');
  assert.equal(cam.showcase, false);

  cam.setMode('world');
  cam.onFullscreenChange();
  assert.equal(cam.mode, 'world');
});

test('setMode rejeita modo inválido', () => {
  const cam = createCameraState();
  assert.throws(() => cam.setMode('invalido'), /inválido/i);
});
