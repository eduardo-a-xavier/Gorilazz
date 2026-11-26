// Garagem 3D, abas, spotlight dos cards, dock de rolagem, links âncora e prévia Sketchfab.

const SELECTED_MODELS = {
  car: { uid: 'd1ac8116d1ab4ad7b612921425aa827a', name: 'Gorrilaz Car BlockBench', author: 'shabaev', license: 'CC BY 4.0', url: 'https://sketchfab.com/3d-models/gorrilaz-car-blockbench-d1ac8116d1ab4ad7b612921425aa827a' },
  phase7: { uid: '77d8602771c44a9e879cdc623258a650', name: 'The Gorillaz band (phase 7)', author: 'Gorillaz / publicação Redtricity', license: 'CC BY 4.0 indicada na fonte', url: 'https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650' },
  band: { uid: 'b693d0e95a634674b5fe5744dd3392cb', name: 'Gorillaz — Papercraft', author: 'Dudi Julianto', license: 'licença de reutilização não informada · referência visual', url: 'https://sketchfab.com/3d-models/gorillaz-b693d0e95a634674b5fe5744dd3392cb' },
  windmill: { uid: '0e72abda7e8b4ec5a8eaa6bf9d25603b', name: 'Flying windmill', author: 'zeee7', license: 'Standard · referência visual', url: 'https://sketchfab.com/3d-models/flying-windmill-0e72abda7e8b4ec5a8eaa6bf9d25603b' },
};

export function initGarageDock({
  sceneSection,
  reducedMotion,
  cameraState,
  bandToggle,
  getWorld,
  isWorldAvailable,
  isEntered,
  enterWorld,
  lockScroll,
  focusWorld,
  setShowcase,
  syncCameraModes,
  startNavigation,
  stop,
  setTour,
  clearDestination,
  modalOpen,
  discoveries,
  journal,
}) {
  let tourIndex = 0;

  // Botão fixo "ENTRAR NO UNIVERSO 3D": aparece quando a página já foi rolada e o mundo 3D está fora da tela.
  const enter3dButton = document.querySelector('#enter-3d-fixed');
  const syncEnter3d = () => {
    if (!enter3dButton) return;
    const worldRect = sceneSection.getBoundingClientRect();
    enter3dButton.hidden = window.scrollY < window.innerHeight * .6 || (worldRect.top < window.innerHeight && worldRect.bottom > 0);
  };
  enter3dButton?.addEventListener('click', () => {
    if (!isEntered()) document.querySelector('#enter-world').click();
    lockScroll(true);
    sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
    focusWorld();
  });
  window.addEventListener('scroll', syncEnter3d, { passive: true });
  window.addEventListener('resize', syncEnter3d);
  syncEnter3d();

  // Links âncora suaves e logo "GORILLAZ" voltando ao topo.
  document.addEventListener('click', event => {
    const anchor = event.target.closest('a[href^="#"]'); if (!anchor) return;
    const id = anchor.getAttribute('href').slice(1);
    if (!id) {
      if (anchor.classList.contains('brand')) {
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' });
      }
      return;
    }
    const target = document.getElementById(id);
    const disclosure = target?.closest('details');
    if (disclosure) disclosure.open = true;
    if (target && !anchor.target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' });
    }
  });

  // Modal de prévia 3D Sketchfab.
  const modelDialog = document.querySelector('#model-dialog');
  const previewSlot = document.querySelector('#sketchfab-slot');
  let modelPreviousFocus;
  for (const button of document.querySelectorAll('[data-sketchfab]')) button.addEventListener('click', () => {
    if (modalOpen()) return;
    const model = SELECTED_MODELS[button.dataset.sketchfab];
    stop(); setTour(false); clearDestination(); modelPreviousFocus = document.activeElement;
    document.querySelector('#model-preview-title').textContent = model.name;
    document.querySelector('#model-preview-credit').textContent = `Por ${model.author} / ${model.license}`;
    document.querySelector('#model-preview-source').href = model.url;
    const frame = document.createElement('iframe'); frame.src = `https://sketchfab.com/models/${model.uid}/embed?autostart=0`;
    frame.title = `Prévia 3D: ${model.name}, por ${model.author}`;
    frame.allow = 'fullscreen; xr-spatial-tracking'; frame.referrerPolicy = 'strict-origin-when-cross-origin';
    previewSlot.replaceChildren(frame); modelDialog.showModal(); document.querySelector('#close-model-preview').focus();
  });
  document.querySelector('#close-model-preview').addEventListener('click', () => modelDialog.close());
  modelDialog.addEventListener('close', () => {
    previewSlot.replaceChildren(); stop();
    modelPreviousFocus?.focus({ preventScroll: true });
  });

  // Garagem do Geep: ações rápidas que sobem ao mundo 3D e ativam o modo desejado.
  function scrollToWorld() {
    sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  }
  document.querySelector('#garage-action-drive')?.addEventListener('click', () => {
    enterWorld(); cameraState.onManualInput(); bandToggle.setAttribute('aria-pressed', String(cameraState.showcase));
    getWorld()?.syncCameraState?.(); syncCameraModes(); scrollToWorld(); focusWorld();
  });
  document.querySelector('#garage-action-cockpit')?.addEventListener('click', () => {
    scrollToWorld();
    if (isWorldAvailable()) {
      enterWorld(); cameraState.setMode('cockpit');
      setShowcase(false); getWorld()?.setFirstPerson(true); syncCameraModes(); focusWorld();
    } else focusWorld();
  });
  document.querySelector('#garage-action-overview')?.addEventListener('click', () => {
    enterWorld(); cameraState.setMode('world');
    getWorld()?.setOverview(true); syncCameraModes(); scrollToWorld(); focusWorld();
  });
  document.querySelector('#garage-action-tour')?.addEventListener('click', () => {
    const point = discoveries.find(d => !journal.known.has(d.id)) || discoveries[tourIndex++ % discoveries.length];
    startNavigation(point); scrollToWorld();
  });

  // Abas interativas da Garagem 3D.
  const garageTabs = [...document.querySelectorAll('[data-garage-tab]')];
  const garagePanels = {
    geep: document.querySelector('#garage-panel-geep'),
    pilot: document.querySelector('#garage-panel-pilot'),
    band: document.querySelector('#garage-panel-band'),
    scenery: document.querySelector('#garage-panel-scenery'),
  };
  function selectGarageTab(key) {
    for (const tab of garageTabs) {
      const active = tab.dataset.garageTab === key;
      tab.setAttribute('aria-selected', String(active));
    }
    for (const [k, panelEl] of Object.entries(garagePanels)) {
      if (panelEl) panelEl.hidden = k !== key;
    }
  }
  for (const tab of garageTabs) {
    tab.addEventListener('click', () => selectGarageTab(tab.dataset.garageTab));
  }

  // Spotlight Bento Cards: brilho radial sutil seguindo o ponteiro em mouse/desktop.
  document.querySelector('main')?.addEventListener('pointermove', event => {
    if (event.pointerType !== 'mouse' || reducedMotion.matches) return;
    const card = event.target.closest('.era-panel, #era-menu button, #stop-menu button, .band-card, .garage-card, .reference-card');
    if (!card) return;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${(event.clientX - rect.left).toFixed(0)}px`);
    card.style.setProperty('--my', `${(event.clientY - rect.top).toFixed(0)}px`);
  });

  // Floating Section Dock: progresso de leitura e seção ativa ao rolar.
  const dockProgressBar = document.querySelector('#dock-progress-bar');
  const dockLinks = [...document.querySelectorAll('[data-dock-link]')];
  const trackedSections = [
    ['jogo', document.querySelector('#jogo')],
    ['eras', document.querySelector('#eras')],
    ['radio', document.querySelector('#radio')],
    ['paradas', document.querySelector('#paradas')],
    ['band-title', document.querySelector('.band-section')],
    ['modelos', document.querySelector('#modelos')],
    ['referencias', document.querySelector('#referencias')],
  ].filter(([, el]) => el);
  function syncScrollDock() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const ratio = Math.max(0, Math.min(1, window.scrollY / maxScroll));
    if (dockProgressBar) dockProgressBar.style.width = `${(ratio * 100).toFixed(1)}%`;
    const pivot = window.innerHeight * .38;
    let activeKey = trackedSections[0]?.[0] ?? 'jogo';
    for (const [key, el] of trackedSections) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= pivot) activeKey = key;
    }
    for (const link of dockLinks) {
      if (link.dataset.dockLink === activeKey) link.setAttribute('aria-current', 'true');
      else link.removeAttribute('aria-current');
    }
  }
  window.addEventListener('scroll', syncScrollDock, { passive: true });
  syncScrollDock();
}
