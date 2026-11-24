// Onboarding: ajuda de teclas, boas-vindas única e dicas contextuais discretas.
// Lógica pura (sem DOM) para ser testada em Node; app.js só desenha e chama estes métodos.

export const CONTROLS = [
  { keys: 'W / S', text: 'acelerar e frear' },
  { keys: 'A / D', text: 'virar o Geep' },
  { keys: 'E', text: 'parar perto de um ponto brilhante e explorar a história' },
  { keys: 'V', text: 'entrar ou sair da cabine (1ª pessoa)' },
  { keys: 'M', text: 'abrir ou fechar o mapa completo' },
  { keys: 'R / C', text: 'focar o rádio e centralizar a visão (na cabine)' },
  { keys: '[  ]', text: 'trocar de faixa do rádio' },
  { keys: 'H', text: 'abrir ou fechar o menu de controles (com a ajuda)' },
  { keys: 'B ou F1', text: 'reabrir esta ajuda' },
];

// Cada dica some depois de usada; `max` limita quantas vezes ela aparece sem uso.
export const TIPS = [
  { id: 'drive', text: 'Use W e S para acelerar e frear. A e D viram o Geep.', max: 3 },
  { id: 'explore', text: 'Pare perto de um ponto brilhante e aperte E para explorar.', max: 3 },
  { id: 'map', text: 'Aperte M para ver o mapa completo e escolher um destino.', max: 2 },
];

// Ajuda de teclas: B ou F1. H é o interruptor do menu de controles (que contém a ajuda), não a ajuda.
export const HELP_KEYS = ['b', 'f1'];
export const isHelpKey = key => HELP_KEYS.includes(String(key).toLowerCase());
export const CONTROLS_KEY = 'h';
export const isControlsKey = key => String(key).toLowerCase() === CONTROLS_KEY;

export function createOnboarding(storage, storageKey = 'gorilazz-onboarding') {
  const read = () => {
    try { return JSON.parse(storage?.getItem(storageKey) ?? 'null') ?? {}; } catch { return {}; }
  };
  const state = { welcomed: false, optOut: false, used: {}, shown: {}, ...read() };
  const save = () => { try { storage?.setItem(storageKey, JSON.stringify(state)); } catch { /* Sem armazenamento: vale só nesta visita. */ } };
  const tip = id => TIPS.find(item => item.id === id);
  return {
    get optOut() { return state.optOut; },
    // Boas-vindas aparecem uma única vez, salvo se o jogador optou por não ver dicas.
    shouldWelcome() { return !state.optOut && !state.welcomed; },
    markWelcomed() { state.welcomed = true; save(); },
    setOptOut(value) { state.optOut = Boolean(value); save(); },
    // Uma dica pede atenção se ainda não foi usada, não passou do limite e o jogador não optou por sair.
    tipPending(id) {
      const item = tip(id);
      return Boolean(item) && !state.optOut && !state.used[id] && (state.shown[id] ?? 0) < item.max;
    },
    noteTipShown(id) { state.shown[id] = (state.shown[id] ?? 0) + 1; save(); },
    markUsed(id) { if (tip(id) && !state.used[id]) { state.used[id] = true; save(); return true; } return false; },
    isUsed(id) { return Boolean(state.used[id]); },
  };
}
