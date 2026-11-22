import test from 'node:test';
import assert from 'node:assert/strict';
import { ESC_ORDER, escapeTarget, handleEscape } from '../src/escape-stack.js';

const none = { modal: false, minigame: false, map: false, panel: false, game: false };

test('a ordem da pilha é modal > minigame > mapa > painel > jogo', () => {
  assert.deepEqual(ESC_ORDER, ['modal', 'minigame', 'map', 'panel', 'game']);
});

test('com vários itens abertos, o Esc vai só para o item mais acima', () => {
  assert.equal(escapeTarget({ ...none, game: true, map: true, modal: true }), 'modal');
  assert.equal(escapeTarget({ ...none, game: true, map: true, minigame: true }), 'minigame');
  assert.equal(escapeTarget({ ...none, game: true, map: true }), 'map');
  assert.equal(escapeTarget({ ...none, game: true, panel: true }), 'panel');
  assert.equal(escapeTarget({ ...none, game: true }), 'game');
  assert.equal(escapeTarget(none), null);
});

function keyEvent(key = 'Escape') {
  const log = [];
  return {
    key, log,
    preventDefault() { log.push('preventDefault'); },
    stopImmediatePropagation() { log.push('stopImmediatePropagation'); },
  };
}

test('handleEscape cancela o evento e fecha só o item ativo, sem sair do jogo', () => {
  const closed = [];
  const handlers = { close: { modal: () => closed.push('modal'), minigame: () => closed.push('minigame'), map: () => closed.push('map'), panel: () => closed.push('panel'), game: () => closed.push('game') } };
  const open = () => ({ ...none, game: true, map: true, minigame: true });
  const event = keyEvent();
  assert.equal(handleEscape(event, { open, ...handlers }), 'minigame');
  assert.deepEqual(event.log, ['preventDefault', 'stopImmediatePropagation']);
  assert.deepEqual(closed, ['minigame'], 'só o minigame fecha; o mapa e o jogo ficam');
});

test('quando nada está aberto, o Esc passa para os outros handlers (sem cancelar)', () => {
  const event = keyEvent();
  assert.equal(handleEscape(event, { open: () => none, close: {} }), null);
  assert.deepEqual(event.log, [], 'nenhum preventDefault/stopImmediatePropagation');
});

test('outras teclas nunca são tratadas pela pilha', () => {
  const event = keyEvent('Enter');
  assert.equal(handleEscape(event, { open: () => ({ ...none, modal: true }), close: { modal: () => assert.fail('não deveria fechar') } }), null);
  assert.deepEqual(event.log, []);
});
