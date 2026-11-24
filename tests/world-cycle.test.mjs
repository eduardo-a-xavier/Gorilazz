import test from 'node:test';
import assert from 'node:assert/strict';
import { isWorldVisible, exitPlan, returnPlan, realignAfterFullscreen } from '../src/world-cycle.js';

const VIEW = { width: 1440, height: 900 };
const rect = (top, height = 808) => ({ top, bottom: top + height, left: 0, right: 1440, width: 1440, height });

test('visibilidade do mundo: dentro da janela sim; totalmente fora não; zero de altura não', () => {
  assert.equal(isWorldVisible(rect(0), VIEW), true);
  assert.equal(isWorldVisible(rect(-200), VIEW), true, 'parte visível conta');
  assert.equal(isWorldVisible(rect(-900), VIEW), false, 'totalmente acima');
  assert.equal(isWorldVisible(rect(950), VIEW), false, 'totalmente abaixo');
  assert.equal(isWorldVisible(rect(0, 0), VIEW), false, 'sem altura');
});

test('sair do 3D fecha diálogos abertos, para o carro e libera a rolagem; fora do 3D não faz nada', () => {
  assert.deepEqual(exitPlan({ dialogsOpen: 1, mode3d: true }), ['closeDialogs', 'stopCar', 'unlockScroll']);
  assert.deepEqual(exitPlan({ dialogsOpen: 0, mode3d: true }), ['stopCar', 'unlockScroll']);
  assert.deepEqual(exitPlan({ dialogsOpen: 2, mode3d: false }), []);
});

test('voltar ao carro fecha diálogos, trava a rolagem, recalcula a visibilidade e devolve o foco ao jogo', () => {
  assert.deepEqual(returnPlan({ dialogsOpen: 1 }), ['closeDialogs', 'lockScroll', 'refreshVisibility', 'focusWorld']);
  assert.deepEqual(returnPlan({ dialogsOpen: 0 }), ['lockScroll', 'refreshVisibility', 'focusWorld']);
});

test('ao sair da tela cheia com o 3D ativo, o mundo é realinhado; em outros casos não', () => {
  assert.equal(realignAfterFullscreen({ fullscreen: false, mode3d: true }), true);
  assert.equal(realignAfterFullscreen({ fullscreen: true, mode3d: true }), false);
  assert.equal(realignAfterFullscreen({ fullscreen: false, mode3d: false }), false);
});
