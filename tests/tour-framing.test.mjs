import test from 'node:test';
import assert from 'node:assert/strict';
import { stopFrame, screenFractionFromTop, ERA_STOP_FRAME, HISTORY_STOP_FRAME, BAND_FINALE_FRAME } from '../src/tour-framing.js';
import { TOUR_ORDER } from '../src/guided-tour.js';

const PORTAL_TOP_M = 11.6; // totem do pórtico de era
const TOP_HUD = 0.2;       // faixa do topo ocupada pelo HUD superior (fração da tela)
const BOTTOM_CARD = 0.76;  // a partir daqui começam o cartão inferior e o rádio

// Parada fictícia só com o tipo, como sai de buildStops: 'era' para os portais, 'historia' para descobertas.
const stopOf = id => ({ id, kind: id.startsWith('era-') ? 'era' : 'historia' });

test('todas as 9 paradas do passeio têm enquadramento próprio e olham para uma altura elevada', () => {
  assert.equal(TOUR_ORDER.length, 9);
  for (const id of TOUR_ORDER) {
    const frame = stopFrame(stopOf(id));
    assert.ok(frame.distance > 0 && frame.height > 0, `${id}: câmera com distância e altura`);
    assert.ok(frame.target >= 1.5, `${id}: alvo acima do chão`);
  }
});

test('pórtico de era inteiro no quadro: topo do totem e base do pórtico na faixa livre da tela', () => {
  for (const id of TOUR_ORDER.filter(id => id.startsWith('era-'))) {
    const frame = stopFrame(stopOf(id));
    assert.equal(frame, ERA_STOP_FRAME, `${id} usa a pose de pórtico`);
    const top = screenFractionFromTop(frame, PORTAL_TOP_M);
    const base = screenFractionFromTop(frame, 0);
    assert.ok(top >= TOP_HUD, `${id}: topo do totem (${top.toFixed(2)}) abaixo do HUD superior`);
    assert.ok(base <= BOTTOM_CARD, `${id}: base do pórtico (${base.toFixed(2)}) acima do cartão inferior`);
    assert.ok(base > top, `${id}: pórtico com altura visível`);
  }
});

test('descobertas usam a pose de descoberta, com mais recuo que a antiga (9 m)', () => {
  for (const id of TOUR_ORDER.filter(id => !id.startsWith('era-'))) {
    const frame = stopFrame(stopOf(id));
    assert.equal(frame, HISTORY_STOP_FRAME, `${id} usa a pose de descoberta`);
    assert.ok(frame.distance > 9, `${id}: recuo maior que 9 m`);
  }
});

test('enquadramento de era é mais alto que o de descoberta e a fração do topo é monótona na altura', () => {
  assert.ok(stopFrame(stopOf('era-explosao')).distance > stopFrame(stopOf('beginning')).distance);
  const f = ERA_STOP_FRAME;
  assert.ok(screenFractionFromTop(f, 0) > screenFractionFromTop(f, 5), 'base mais embaixo que o meio');
  assert.ok(screenFractionFromTop(f, 5) > screenFractionFromTop(f, PORTAL_TOP_M), 'meio mais embaixo que o topo');
});

test('encerramento da banda reunida: os 4 integrantes (6,2 m) cabem inteiros entre o HUD superior e o cartão inferior', () => {
  const frame = stopFrame({ id: 'band-finale', kind: 'banda' });
  assert.equal(frame, BAND_FINALE_FRAME);
  const top = screenFractionFromTop(frame, 6.2);
  const base = screenFractionFromTop(frame, 0);
  assert.ok(top >= TOP_HUD, `topo da banda (${top.toFixed(2)}) abaixo do HUD superior`);
  assert.ok(base <= BOTTOM_CARD, `base da banda (${base.toFixed(2)}) acima do cartão inferior`);
});
