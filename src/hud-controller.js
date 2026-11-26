// Controlador da HUD: onboarding, controles de câmera/tela cheia/3D, pilha Esc, menus, qualidade e telemetria.
import { createOnboarding, CONTROLS, TIPS, isHelpKey } from './onboarding.js';
import { handleEscape } from './escape-stack.js';
import { realignAfterFullscreen } from './world-cycle.js';
import { TOAST_MS } from './guided-tour.js';
import { CITY_ERAS, DISCOVERIES, REGIONS, distance, eraAt, regionAt } from './world-data.js';
import { rankByProximity } from './discoveries.js';

export function createHudController({
  storage,
  sceneSection,
  reducedMotion,
  cameraState,
  vehicle,
  input,
  journal,
  discovered,
  members,
  modalOpen,
  isEntered,
  getEnteredAt,
  isWorldVisible,
  refreshWorldVisibility,
  setWorldVisible,
  isWorldAvailable,
  isTouring,
  getWorld,
  getNearby,
  getDestination,
  enterWorld,
  stop,
  setShowcase,
  setPreviousFocus,
  restoreFocus,
  focusWorld,
  announce,
  haltVehicle,
  isFullMapOpen,
  toggleFullMap,
  openDiscoveries,
  audio,
  guide,
  arcadeNear,
}) {
  const onboarding = createOnboarding(storage);
  const onboardingDialog = document.querySelector('#onboarding-dialog');
  const onboardingTip = document.querySelector('#onboarding-tip');
  const onboardingOptOut = document.querySelector('#onboarding-optout');
  onboardingDialog.querySelector('.onboarding-keys').replaceChildren(...CONTROLS.flatMap(({ keys, text }) => {
    const dt = document.createElement('dt'); dt.textContent = keys;
    const dd = document.createElement('dd'); dd.textContent = text;
    return [dt, dd];
  }));

  let tipId = null, tipUntil = 0, tipCooldown = 0;
  function hideTip() { tipId = null; onboardingTip.hidden = true; }
  function openOnboarding() {
    if (modalOpen()) return;
    if (isFullMapOpen()) toggleFullMap(false);
    input.clear(); haltVehicle(vehicle); setPreviousFocus(document.activeElement); hideTip();
    onboardingOptOut.checked = onboarding.optOut;
    onboardingDialog.showModal(); onboardingDialog.querySelector('#onboarding-start').focus();
  }
  onboardingDialog.addEventListener('close', () => { onboarding.setOptOut(onboardingOptOut.checked); onboarding.markWelcomed(); restoreFocus(); });
  onboardingDialog.querySelector('#onboarding-start').addEventListener('click', () => onboardingDialog.close());
  document.addEventListener('keydown', event => {
    if (!isHelpKey(event.key) || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input,select,textarea,[contenteditable]')) return;
    event.preventDefault(); openOnboarding();
  });
  function showTip(id) {
    tipId = id; tipUntil = performance.now() + TOAST_MS;
    setTimeout(() => { if (tipId === id) { hideTip(); tipCooldown = performance.now() + 8000; } }, TOAST_MS);
    onboardingTip.textContent = TIPS.find(item => item.id === id).text; onboardingTip.hidden = false;
    onboarding.noteTipShown(id);
  }
  function tickOnboarding() {
    const now = performance.now();
    if (!isEntered() || !document.documentElement.classList.contains('mode-3d') || !isWorldVisible() || modalOpen() || isFullMapOpen()) return hideTip();
    if (Math.abs(vehicle.speed) > 3) { onboarding.markUsed('drive'); hideTip(); }
    if (tipId && onboarding.isUsed(tipId)) return hideTip();
    if (tipId) { if (now > tipUntil) { hideTip(); tipCooldown = now + 8000; } return; }
    if (now < tipCooldown) return;
    if (getNearby() && onboarding.tipPending('explore')) return showTip('explore');
    if (onboarding.tipPending('drive') && now - getEnteredAt() > 1500) return showTip('drive');
    if (onboarding.tipPending('map') && now - getEnteredAt() > 20000) return showTip('map');
  }
  setInterval(tickOnboarding, 400);

  // Controles de câmera e tela cheia.
  const cameraTools = document.querySelector('.camera-tools');
  const cameraMenuToggle = document.querySelector('#camera-menu-toggle');
  function setCameraMenu(value) {
    cameraTools.dataset.expanded = String(value); cameraMenuToggle.setAttribute('aria-expanded', String(value));
    cameraMenuToggle.setAttribute('aria-label', value ? 'Fechar controles da câmera' : 'Abrir controles da câmera');
  }
  cameraMenuToggle.addEventListener('click', () => setCameraMenu(cameraTools.dataset.expanded !== 'true'));
  document.addEventListener('pointerdown', event => { if (!cameraTools.contains(event.target)) setCameraMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setCameraMenu(false); });

  const fullscreenButton = document.querySelector('#fullscreen-toggle');
  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await sceneSection.requestFullscreen();
    } catch { announce('A tela cheia não está disponível neste navegador.'); }
  });
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === sceneSection;
    if (active) navigator.keyboard?.lock?.(['Escape'])?.catch?.(() => {}); else navigator.keyboard?.unlock?.();
    fullscreenButton.setAttribute('aria-pressed', String(active));
    fullscreenButton.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Abrir tela cheia');
    fullscreenButton.textContent = active ? '×' : '⛶';
  });

  // Atalhos rápidos de vista + bloqueio de scroll no modo 3D.
  const quickView = document.createElement('div');
  quickView.className = 'quick-view'; quickView.setAttribute('role', 'group'); quickView.setAttribute('aria-label', 'Vista');
  const quickFirstPerson = document.createElement('button'); quickFirstPerson.type = 'button'; quickFirstPerson.textContent = '◉ 1ª pessoa · V'; quickFirstPerson.setAttribute('aria-pressed', 'false');
  const quickMap = document.createElement('button'); quickMap.type = 'button'; quickMap.id = 'quick-map'; quickMap.textContent = '🗺 Mapa · M'; quickMap.setAttribute('aria-expanded', 'false'); quickMap.setAttribute('aria-controls', 'full-map-overlay');
  const quickFullscreen = document.createElement('button'); quickFullscreen.type = 'button'; quickFullscreen.textContent = '⛶ Tela cheia · F'; quickFullscreen.title = 'Ou dê dois cliques no cenário';
  const exit3dButton = document.createElement('button'); exit3dButton.type = 'button'; exit3dButton.id = 'exit-3d'; exit3dButton.hidden = true;
  exit3dButton.textContent = '↓ Ler História & Eras'; exit3dButton.title = 'Parar de dirigir e ler a história e as eras';
  const backToCar = document.createElement('button'); backToCar.type = 'button'; backToCar.id = 'back-to-car'; backToCar.hidden = true;
  backToCar.textContent = '↑ Voltar ao Carro 3D'; backToCar.title = 'Voltar à pilotagem 3D';
  backToCar.addEventListener('click', () => { closeOpenDialogs(); document.querySelector('#enter-world').click(); setWorldVisible(refreshWorldVisibility()); focusWorld(); });
  document.body.append(backToCar);
  quickView.append(quickFirstPerson, quickMap, quickFullscreen, exit3dButton); document.querySelector('.world-shell').append(quickView);

  function lockScroll(on) {
    const root = document.documentElement;
    if (on && !root.classList.contains('mode-3d')) {
      const top = sceneSection.getBoundingClientRect().top;
      if (Math.abs(top) > 1) window.scrollTo({ top: window.scrollY + top, behavior: 'instant' });
    }
    root.classList.toggle('mode-3d', on); exit3dButton.hidden = !on; backToCar.hidden = on || !isEntered();
  }
  function closeOpenDialogs() { for (const d of [...document.querySelectorAll('dialog[open]')]) d.close(); }
  function exit3d(target) {
    if (!document.documentElement.classList.contains('mode-3d')) return;
    closeOpenDialogs(); lockScroll(false); stop(); hideTip();
    if (target && target.length > 1) document.querySelector(target)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  }
  exit3dButton.addEventListener('click', () => exit3d('#eras'));

  const cockpit = document.querySelector('#cockpit');
  let radioFocused = false;
  const consoleFocus = document.querySelector('#console-focus');
  function focusRadio(value) {
    radioFocused = cameraState.firstPerson && value;
    getWorld()?.setInteraction(radioFocused);
    consoleFocus.setAttribute('aria-pressed', String(radioFocused));
    consoleFocus.textContent = radioFocused ? 'Esc · Voltar à estrada' : 'R · Sintonizar';
  }
  consoleFocus.onclick = () => { focusRadio(!radioFocused); focusWorld(); };
  document.querySelector('#cabin-recenter')?.addEventListener('click', () => { focusRadio(false); getWorld()?.recenter(); focusWorld(); });
  for (const slider of cockpit.querySelectorAll('input')) slider.oninput = () => {
    getWorld()?.configureLook(Number(document.querySelector('#look-gain').value), Number(document.querySelector('#motion-gain').value));
  };

  function syncCameraModes() {
    const { firstPerson, overview, landmarkView, orbital } = cameraState;
    cockpit.hidden = !firstPerson;
    sceneSection.classList.toggle('inside-geep', firstPerson);
    if (!firstPerson) { focusRadio(false); input.setWheelSteer(0); }
    document.querySelector('#first-person').setAttribute('aria-pressed', String(firstPerson));
    document.querySelector('#first-person').textContent = firstPerson ? '↙ VOLTAR AO CARRO' : '◉ 1ª PESSOA';
    document.querySelector('#overview-toggle').setAttribute('aria-pressed', String(overview));
    document.querySelector('#overview-toggle').textContent = overview ? '↙ VOLTAR AO JIPE' : '◎ VER MUNDO';
    document.querySelector('#windmill-focus').setAttribute('aria-pressed', String(landmarkView));
    document.querySelector('#windmill-focus').textContent = landmarkView ? '↙ VOLTAR AO JIPE' : '✦ VER MOINHO';
    document.querySelector('#camera-toggle').setAttribute('aria-pressed', String(orbital));
    document.querySelector('#camera-toggle').textContent = orbital ? '↗ CÂMERA DE VIAGEM' : '↻ CÂMERA ORBITAL';
    quickFirstPerson.setAttribute('aria-pressed', String(firstPerson));
    quickFirstPerson.textContent = firstPerson ? '↙ Ver o Geep · V' : '◉ 1ª pessoa · V';
  }

  function resetViewControls() {
    cameraState.reset();
    const button = document.querySelector('#camera-toggle');
    button.setAttribute('aria-pressed', 'false');
    button.textContent = '↻ CÂMERA ORBITAL';
    syncCameraModes();
  }

  document.querySelector('#camera-toggle').addEventListener('click', event => {
    cameraState.toggleMode('orbit'); getWorld()?.syncCameraState?.(); syncCameraModes();
    event.currentTarget.setAttribute('aria-pressed', String(cameraState.orbital));
    event.currentTarget.textContent = cameraState.orbital ? '↗ CÂMERA DE VIAGEM' : '↻ CÂMERA ORBITAL';
  });
  document.querySelector('#first-person').addEventListener('click', () => {
    if (!isWorldAvailable()) return;
    enterWorld(); cameraState.toggleMode('cockpit');
    setShowcase(false); getWorld().setFirstPerson(cameraState.firstPerson); syncCameraModes(); focusWorld();
    if (!reducedMotion.matches) document.querySelector('#world canvas')?.animate([{ opacity: .45 }, { opacity: 1 }], { duration: 220 });
  });
  document.querySelector('#zoom-in').addEventListener('click', () => getWorld()?.zoomBy(-.15));
  document.querySelector('#zoom-out').addEventListener('click', () => getWorld()?.zoomBy(.15));
  document.querySelector('#reset-camera').addEventListener('click', () => { getWorld()?.resetCamera(); resetViewControls(); });
  document.querySelector('#overview-toggle').addEventListener('click', () => { cameraState.toggleMode('world'); getWorld()?.setOverview(cameraState.overview); syncCameraModes(); });
  document.querySelector('#windmill-focus').addEventListener('click', () => { enterWorld(); stop(); cameraState.toggleMode('windmill'); getWorld()?.focusWindmill(cameraState.landmarkView); syncCameraModes(); });
  document.querySelector('#read-chapter').addEventListener('click', () => { document.querySelector('#paradas').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); document.querySelector('#panel').focus({ preventScroll: true }); });

  quickFirstPerson.addEventListener('click', () => document.querySelector('#first-person').click());
  quickFullscreen.addEventListener('click', () => fullscreenButton.click());
  document.addEventListener('fullscreenchange', () => {
    cameraState.onFullscreenChange();
    if (realignAfterFullscreen({ fullscreen: Boolean(document.fullscreenElement), mode3d: document.documentElement.classList.contains('mode-3d') })) sceneSection.scrollIntoView({ block: 'start', behavior: 'instant' });
    setWorldVisible(refreshWorldVisibility());
    quickFullscreen.textContent = document.fullscreenElement === sceneSection ? '× Sair da tela cheia · F' : '⛶ Tela cheia · F';
  });

  // Painel de controles [H] e menus compactos da HUD.
  const journeyPanel = document.querySelector('#journey'), controlsToggle = document.querySelector('#controls-toggle');
  function toggleControls(open = journeyPanel.hidden) { journeyPanel.hidden = !open; controlsToggle.setAttribute('aria-expanded', String(open)); }
  controlsToggle.addEventListener('click', () => toggleControls());
  journeyPanel.prepend(quickView);
  const helpButton = document.createElement('button'); helpButton.type = 'button'; helpButton.id = 'open-help'; helpButton.textContent = 'Ajuda de teclas (B / F1)';
  journeyPanel.append(helpButton); helpButton.addEventListener('click', () => openOnboarding());
  const qualityLabel = document.createElement('label'); qualityLabel.textContent = 'Qualidade/FPS: ';
  const qualitySelect = document.createElement('select'); qualitySelect.setAttribute('aria-label', 'Qualidade/FPS');
  for (const [value, label] of [['auto', 'Auto'], ['performance', 'Desempenho (PC fraco)'], ['ultra', 'Ultra']]) qualitySelect.add(new Option(label, value));
  try { qualitySelect.value = storage?.getItem('gorilazz.quality.v1') || 'auto'; } catch { qualitySelect.value = 'auto'; }
  qualityLabel.append(qualitySelect); journeyPanel.append(qualityLabel);
  qualitySelect.addEventListener('change', () => { try { storage?.setItem('gorilazz.quality.v1', qualitySelect.value); } catch { /* vale nesta visita */ } getWorld()?.setQuality(qualitySelect.value); });
  const hornHint = document.createElement('p'); hornHint.textContent = 'G · Buzina · Espaço · Drift · Segure L · Olhar para o céu'; journeyPanel.append(hornHint);
  const discoveriesButton = document.createElement('button'); discoveriesButton.type = 'button'; discoveriesButton.id = 'open-discoveries'; discoveriesButton.textContent = 'Central de Descobertas';
  journeyPanel.append(discoveriesButton); discoveriesButton.addEventListener('click', () => openDiscoveries());
  journeyPanel.append(audio.soundButton);

  const navMenu = document.createElement('div');
  navMenu.id = 'hud-navigation';
  document.querySelector('#journey').append(navMenu);
  for (const selector of ['#route-toggle', '#journey-description', '#route-list', '.exploration-hud', '.experience-toolbar', '.camera-tools', '.game-top', '.trip-meter']) {
    navMenu.append(document.querySelector(selector));
  }
  const hudMenus = [[document.querySelector('#hud-nav'), navMenu], [document.querySelector('#hud-radio-toggle'), audio.radioMenu]];
  function toggleHudMenu(open) {
    for (const [button, menu] of hudMenus) {
      menu.hidden = menu !== open;
      button.setAttribute('aria-expanded', String(!menu.hidden));
    }
    sceneSection.classList.toggle('menu-open', Boolean(open));
  }
  toggleHudMenu(null);
  for (const [button, menu] of hudMenus) {
    button.addEventListener('click', () => toggleHudMenu(menu.hidden ? menu : null));
  }
  sceneSection.addEventListener('pointerdown', event => {
    if (!event.target.closest('#journey,#road-radio')) toggleHudMenu(null);
  });

  // Pilha Esc e saída ao clicar em âncora fora da cena.
  const MINIGAME_DIALOGS = new Set(['arcade-dialog', 'piano-dialog']);
  const dialogStack = [];
  const topDialog = () => dialogStack.filter(d => d.open && d.localName === 'dialog').pop();
  const escapeLayers = {
    open: () => {
      const top = topDialog();
      return {
        modal: Boolean(top) && !MINIGAME_DIALOGS.has(top.id),
        minigame: Boolean(top) && MINIGAME_DIALOGS.has(top.id),
        map: isFullMapOpen(),
        panel: radioFocused || hudMenus.some(([, menu]) => !menu.hidden) || !journeyPanel.hidden,
        game: document.documentElement.classList.contains('mode-3d'),
      };
    },
    close: {
      modal: () => { const top = topDialog(); if (top && !MINIGAME_DIALOGS.has(top.id)) top.close(); },
      minigame: () => { const top = topDialog(); if (top && MINIGAME_DIALOGS.has(top.id)) top.close(); },
      map: () => toggleFullMap(false),
      panel: () => {
        if (!journeyPanel.hidden && !radioFocused && !hudMenus.some(([, item]) => !item.hidden)) { toggleControls(false); focusWorld(); return; }
        const menu = hudMenus.find(([, item]) => !item.hidden);
        if (radioFocused) focusRadio(false);
        toggleHudMenu(null); menu?.[0].focus(); focusWorld();
      },
      game: () => exit3d('#eras'),
    },
  };
  window.addEventListener('keydown', event => handleEscape(event, escapeLayers), true);
  new MutationObserver(records => {
    for (const { target } of records) {
      if (target.localName !== 'dialog') continue;
      const at = dialogStack.indexOf(target);
      if (target.open && at < 0) dialogStack.push(target);
      if (!target.open && at >= 0) dialogStack.splice(at, 1);
    }
  }).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href^="#"]');
    if (link && !sceneSection.contains(link)) exit3d(link.getAttribute('href'));
  }, true);

  // Atalhos de teclado globais da experiência 3D.
  document.addEventListener('keydown', event => {
    if (event.key.toLowerCase() !== 'l' || !isEntered() || !isWorldVisible() || modalOpen() || isFullMapOpen() || event.target.closest?.('input,select,textarea,[contenteditable]')) return;
    event.preventDefault(); cameraState.setSky(true); getWorld()?.setSkyLook(true);
  });
  document.addEventListener('keyup', event => { if (event.key.toLowerCase() === 'l') { cameraState.setSky(false); getWorld()?.setSkyLook(false); } });
  window.addEventListener('blur', () => { cameraState.setSky(false); getWorld()?.setSkyLook(false); });
  document.addEventListener('keydown', event => {
    if (!isWorldVisible() || modalOpen() || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (event.target.closest('input,select,textarea,[contenteditable]')) return;
    if (key === 'm') { event.preventDefault(); toggleFullMap(); return; }
    if (!isEntered()) return;
    if (key === 'g') { audio.tryHorn(); return; }
    if (key === '[') { event.preventDefault(); audio.localRadio.actions.prev(); announce(`Kong FM: ${audio.localRadio.read().name}`); return; }
    if (key === ']') { event.preventDefault(); audio.localRadio.actions.next(); announce(`Kong FM: ${audio.localRadio.read().name}`); return; }
    if (!isWorldAvailable()) return;
    if (key === 'v') document.querySelector('#first-person').click();
    if (key === 'f') fullscreenButton.click();
    if (key === 'h' && !modalOpen() && !isFullMapOpen()) toggleControls();
    if (cameraState.firstPerson && key === 'r') consoleFocus.click();
    if (cameraState.firstPerson && key === 'c') { focusRadio(false); getWorld().recenter(); }
  });

  // Idle fade da HUD.
  let idleTimer;
  function wakeHud() {
    sceneSection.classList.remove('hud-idle');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => sceneSection.classList.add('hud-idle'), 5000);
  }
  for (const type of ['pointermove', 'pointerdown', 'keydown', 'focusin']) sceneSection.addEventListener(type, wakeHud);
  wakeHud();

  let currentRegion = -1, currentDistrict = -1;
  function updateTelemetry() {
    const region = REGIONS[regionAt(vehicle)];
    const era = CITY_ERAS[eraAt(vehicle)];
    const districtEl = document.querySelector('#telemetry-district');
    if (districtEl) districtEl.textContent = `${region.name} · Ato ${era.act} (${era.years})`;
    const discEl = document.querySelector('#telemetry-discoveries');
    if (discEl) discEl.textContent = `${journal.known.size} / ${DISCOVERIES.length}`;
    const memEl = document.querySelector('#telemetry-members');
    if (memEl) memEl.textContent = `${discovered.size} / ${members.length}`;
    const distEl = document.querySelector('#telemetry-distance');
    if (distEl) distEl.textContent = `${Math.round(vehicle.distanceTravelled || 0)} m`;
    const rigEl = document.querySelector('#telemetry-rig');
    const vStatus = document.querySelector('#vehicle-status');
    if (rigEl && vStatus) {
      const mode = cameraState.firstPerson ? 'Cabine 1ª pessoa' : cameraState.overview ? 'Vista aérea' : cameraState.landmarkView ? 'Mirante do moinho' : isTouring() ? 'Passeio guiado' : 'Câmera de viagem';
      const pilot = document.querySelector('#world canvas')?.dataset.pilot === 'glb'
        ? 'Piloto: 6 malhas · 2.806 tris · 65 ossos · Driving_Loop + reatividade de direção'
        : 'Piloto procedural (GLB indisponível ou carregando)';
      rigEl.textContent = `${vStatus.textContent} · ${pilot} · ${mode}`;
    }
  }

  function updateHudTick({ paused, nearby, destination }) {
    let region = regionAt(vehicle);
    if (currentRegion >= 0 && region !== currentRegion && distance(vehicle, REGIONS[region]) + 8 >= distance(vehicle, REGIONS[currentRegion])) region = currentRegion;
    const district = eraAt(vehicle);
    if (district !== currentDistrict && region === currentRegion) {
      currentDistrict = district; const era = CITY_ERAS[district];
      document.querySelector('#scene-label').textContent = `${REGIONS[region].name.toUpperCase()} · ATO ${era.act} · ${era.title.toUpperCase()} (${era.years})`;
      if (isEntered()) document.querySelector('#announcement').textContent = `Ato ${era.act}: ${era.title}, ${era.years}. ${era.summary}`;
    }
    if (region !== currentRegion) {
      currentRegion = region; currentDistrict = eraAt(vehicle); const era = CITY_ERAS[currentDistrict];
      document.querySelector('#scene-label').textContent = `${REGIONS[region].name.toUpperCase()} · ATO ${era.act} · ${era.title.toUpperCase()} (${era.years})`;
      document.querySelector('#region-name').textContent = REGIONS[region].name; if (!audio.manualTrack) audio.setTrack(REGIONS[region].track);
    }
    const interaction = document.querySelector('#interact');
    interaction.hidden = !nearby || !isEntered() || paused;
    if (!nearby && isEntered() && !paused && arcadeNear()) { interaction.hidden = false; interaction.disabled = false; interaction.textContent = 'E / JOGAR FLIPERAMA'; }
    if (nearby) { interaction.disabled = Math.abs(vehicle.speed) >= 2; interaction.textContent = interaction.disabled ? `Reduza para explorar · ${nearby.title}` : nearby.type === 'discovery' ? `[E] Ler História Completa — ${nearby.title}` : `E / EXPLORAR — ${nearby.title}`; }
    const ranked = rankByProximity(vehicle, DISCOVERIES, journal.known);
    const topHint = !journal.known || journal.known.size >= DISCOVERIES.length
      ? 'Todas as histórias encontradas. Continue explorando.'
      : ranked.length >= 2
        ? `1º ${ranked[0].kind.toLowerCase()} a ${ranked[0].distance} m · 2º ${ranked[1].kind.toLowerCase()} a ${ranked[1].distance} m`
        : `${ranked[0].kind.toLowerCase()} a ${ranked[0].distance} m · escolha seu caminho`;
    document.querySelector('#exploration-hint').textContent = destination ? `Passeio guiado · ${destination.target.title}` : topHint;
    guide.update({ vehicle, known: journal.known, destination: destination?.target, nearby });
    const speed = Math.round(Math.abs(vehicle.speed) * 3.6);
    document.querySelector('#speed').textContent = String(speed).padStart(2, '0');
    document.querySelector('#speed-fill').style.width = `${Math.min(speed / 110 * 100, 100)}%`;
    document.querySelector('#gear').textContent = vehicle.speed < -.1 ? 'RÉ' : vehicle.braking ? 'FREIO' : Math.abs(vehicle.speed) < .1 ? 'PARADO' : vehicle.surface.toUpperCase();
    const hud = document.querySelector('#drive-hud'); hud.classList.toggle('is-braking', vehicle.braking && Math.abs(vehicle.speed) > .1); hud.dataset.x = vehicle.x.toFixed(2); hud.dataset.z = vehicle.z.toFixed(2); hud.dataset.speed = vehicle.speed.toFixed(3); hud.dataset.heading = vehicle.heading.toFixed(3);
    const moving = Math.abs(vehicle.speed) > .1;
    document.querySelector('#radio').classList.toggle('playing', moving && !reducedMotion.matches && !paused);
    const state = modalOpen() || isFullMapOpen() || sceneSection.classList.contains('menu-open') ? 'menu' : cameraState.overview || cameraState.landmarkView ? 'exploring' : moving ? 'driving' : 'stopped';
    if (sceneSection.dataset.hudState !== state) sceneSection.dataset.hudState = state;
    document.querySelector('#dial-value').style.strokeDasharray = `${Math.min(speed / 110, 1) * 76} 100`;
    updateTelemetry();
    return { region, speed, moving };
  }

  return {
    onboarding,
    quickMap,
    qualitySelect,
    fullscreenButton,
    isBlockedForHorn: () => isFullMapOpen() || !journeyPanel.hidden || hudMenus.some(([, menu]) => !menu.hidden),
    hideTip,
    openOnboarding,
    lockScroll,
    syncCameraModes,
    resetViewControls,
    toggleHudMenu,
    updateTelemetry,
    updateHudTick,
  };
}
