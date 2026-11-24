import test from 'node:test';
import assert from 'node:assert/strict';
import { createOnboarding, CONTROLS, TIPS, isHelpKey, isControlsKey } from '../src/onboarding.js';

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return { getItem: key => (data.has(key) ? data.get(key) : null), setItem: (key, value) => data.set(key, String(value)), dump: () => data };
}

test('boas-vindas aparecem uma única vez e a escolha persiste no armazenamento', () => {
  const storage = memoryStorage();
  const first = createOnboarding(storage);
  assert.equal(first.shouldWelcome(), true);
  first.markWelcomed();
  assert.equal(createOnboarding(storage).shouldWelcome(), false, 'segunda visita não reabre a boas-vindas');
});

test('opt-out desliga as dicas e persiste; reativar devolve as dicas', () => {
  const storage = memoryStorage();
  const onboarding = createOnboarding(storage);
  onboarding.setOptOut(true);
  assert.equal(onboarding.tipPending('drive'), false);
  assert.equal(createOnboarding(storage).optOut, true, 'opt-out sobrevive ao recarregar');
  createOnboarding(storage).setOptOut(false);
  assert.equal(createOnboarding(storage).tipPending('drive'), true);
});

test('dica some após o uso e não volta nas próximas visitas', () => {
  const storage = memoryStorage();
  const onboarding = createOnboarding(storage);
  assert.equal(onboarding.tipPending('explore'), true);
  assert.equal(onboarding.markUsed('explore'), true);
  assert.equal(onboarding.markUsed('explore'), false, 'marcar de novo não altera nada');
  assert.equal(onboarding.tipPending('explore'), false);
  assert.equal(createOnboarding(storage).isUsed('explore'), true);
});

test('dica sem uso para de aparecer depois do limite de exibições', () => {
  const onboarding = createOnboarding(memoryStorage());
  const max = TIPS.find(item => item.id === 'map').max;
  for (let i = 0; i < max; i++) { assert.equal(onboarding.tipPending('map'), true); onboarding.noteTipShown('map'); }
  assert.equal(onboarding.tipPending('map'), false);
});

test('id de dica desconhecido não é pendente nem marcado', () => {
  const onboarding = createOnboarding(memoryStorage());
  assert.equal(onboarding.tipPending('inexistente'), false);
  assert.equal(onboarding.markUsed('inexistente'), false);
});

test('armazenamento corrompido ou ausente não derruba o onboarding', () => {
  const broken = { getItem: () => '{não é json', setItem: () => { throw new Error('cheio'); } };
  const onboarding = createOnboarding(broken);
  assert.equal(onboarding.shouldWelcome(), true);
  assert.doesNotThrow(() => onboarding.markWelcomed());
  assert.doesNotThrow(() => createOnboarding(undefined).markUsed('drive'));
});

test('H e F1 reabrem a ajuda; outras teclas não', () => {
  assert.equal(isHelpKey('h'), false, 'H não abre a ajuda: abre o menu de controles');
  assert.equal(isHelpKey('b'), true);
  assert.equal(isHelpKey('B'), true);
  assert.equal(isHelpKey('F1'), true);
  assert.equal(isControlsKey('h'), true, 'H abre e fecha o menu de controles');
  assert.equal(isControlsKey('H'), true);
  assert.equal(isControlsKey('b'), false);
  assert.equal(isHelpKey('m'), false);
  assert.equal(isHelpKey('Escape'), false);
});

test('ajuda lista os atalhos principais: dirigir, E, V, M, rádio e faixas', () => {
  const keys = CONTROLS.map(item => item.keys).join(' | ');
  for (const expected of ['W / S', 'A / D', 'E', 'V', 'M', 'R / C', '[  ]', 'H', 'B ou F1']) assert.ok(keys.includes(expected), `falta ${expected}`);
});
