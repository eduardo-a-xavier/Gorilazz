// Máquina de estados pura da câmera (sem DOM nem Three.js).
// Centraliza as antigas flags espalhadas (cameraFocus, showcase, orbital, overview,
// landmarkView, firstPerson) em um único estado com transições e preservação previsíveis.

export const CAMERA_MODES = Object.freeze([
  'follow',
  'cockpit',
  'orbit',
  'world',
  'windmill',
  'sky',
  'tour-orbit',
]);

const VALID_MODES = new Set(CAMERA_MODES);

export function createCameraState({ initialMode = 'follow', showcase = true } = {}) {
  let mode = VALID_MODES.has(initialMode) ? initialMode : 'follow';
  let showcaseOn = Boolean(showcase);
  let modalFocus = false;
  let preSkyMode = 'follow';
  let preTourMode = 'follow';
  const savedStack = [];

  function setMode(next) {
    if (!VALID_MODES.has(next)) throw new Error(`Modo de câmera inválido: ${next}`);
    mode = next;
    if (next === 'cockpit' || next === 'world' || next === 'windmill' || next === 'tour-orbit') {
      if (next !== 'world' && next !== 'windmill') showcaseOn = false;
    }
    return flags();
  }

  function toggleMode(target) {
    if (!VALID_MODES.has(target) || target === 'follow') return setMode('follow');
    if (mode === target) return setMode('follow');
    if (target === 'cockpit') showcaseOn = false;
    return setMode(target);
  }

  function setShowcase(value) {
    showcaseOn = Boolean(value);
    return flags();
  }

  // Tecla L: ativa modo 'sky' somente fora de cockpit/world/windmill/tour-orbit/showcase;
  // ao soltar, restaura o modo anterior sem perder o estado.
  function setSky(held) {
    const active = Boolean(held);
    if (active) {
      if (mode === 'follow' || mode === 'orbit') {
        preSkyMode = mode;
        mode = 'sky';
      }
    } else if (mode === 'sky') {
      mode = preSkyMode;
    }
    return flags();
  }

  // Órbita cinematográfica nas paradas do Passeio Guiado:
  // em 1ª pessoa (cockpit), preserva o cockpit (só gira a cabeça no carro).
  function enterTourOrbit() {
    if (mode === 'cockpit') return flags();
    if (mode !== 'tour-orbit') preTourMode = mode === 'sky' ? preSkyMode : mode;
    mode = 'tour-orbit';
    showcaseOn = false;
    return flags();
  }

  function exitTourOrbit() {
    if (mode === 'tour-orbit') {
      mode = preTourMode === 'orbit' ? 'orbit' : 'follow';
    }
    return flags();
  }

  // Foco de modal (ex.: Fliperama): salva estado atual e ativa foco até fechar.
  function enterModalFocus() {
    save();
    modalFocus = true;
    return flags();
  }

  function exitModalFocus() {
    modalFocus = false;
    return restore();
  }

  // Ao assumir o volante (WASD): encerra tour-orbit e showcase; sai de vista aérea/mirante/céu
  // para 'follow', mas mantém cockpit ou orbit caso o jogador já esteja neles.
  function onManualInput() {
    showcaseOn = false;
    if (mode === 'tour-orbit' || mode === 'world' || mode === 'windmill' || mode === 'sky') {
      mode = 'follow';
    }
    return flags();
  }

  // Ao iniciar passeio guiado ou navegação: sai de showcase/world/windmill/sky para 'follow',
  // preservando cockpit ou orbit se ativos.
  function onStartTour() {
    showcaseOn = false;
    if (mode === 'world' || mode === 'windmill' || mode === 'sky' || mode === 'tour-orbit') {
      mode = 'follow';
    }
    return flags();
  }

  // Tela cheia nunca altera o modo nem o showcase.
  function onFullscreenChange() {
    return flags();
  }

  function save() {
    const snapshot = { mode, showcase: showcaseOn, modalFocus, preSkyMode, preTourMode };
    savedStack.push(snapshot);
    return { ...snapshot };
  }

  function restore(explicitSnapshot = null) {
    const snap = explicitSnapshot ?? savedStack.pop();
    if (!snap) return flags();
    mode = VALID_MODES.has(snap.mode) ? snap.mode : 'follow';
    showcaseOn = Boolean(snap.showcase);
    modalFocus = Boolean(snap.modalFocus);
    preSkyMode = VALID_MODES.has(snap.preSkyMode) ? snap.preSkyMode : 'follow';
    preTourMode = VALID_MODES.has(snap.preTourMode) ? snap.preTourMode : 'follow';
    return flags();
  }

  function reset() {
    if (mode === 'world' || mode === 'windmill' || mode === 'orbit' || mode === 'sky' || mode === 'tour-orbit') {
      mode = 'follow';
    }
    modalFocus = false;
    return flags();
  }

  function flags() {
    return {
      mode,
      firstPerson: mode === 'cockpit',
      overview: mode === 'world',
      landmarkView: mode === 'windmill',
      orbital: mode === 'orbit',
      sky: mode === 'sky',
      tourOrbit: mode === 'tour-orbit',
      showcase: showcaseOn,
      cameraFocus: modalFocus,
    };
  }

  return {
    get mode() { return mode; },
    get showcase() { return showcaseOn; },
    get cameraFocus() { return modalFocus; },
    get firstPerson() { return mode === 'cockpit'; },
    get overview() { return mode === 'world'; },
    get landmarkView() { return mode === 'windmill'; },
    get orbital() { return mode === 'orbit'; },
    get sky() { return mode === 'sky'; },
    get tourOrbit() { return mode === 'tour-orbit'; },
    setMode,
    toggleMode,
    setShowcase,
    setSky,
    enterTourOrbit,
    exitTourOrbit,
    enterModalFocus,
    exitModalFocus,
    onManualInput,
    onStartTour,
    onFullscreenChange,
    save,
    restore,
    reset,
    flags,
  };
}
