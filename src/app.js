// Composição e ciclo de vida principal do Gorilazz A3.
import { loadJourney, loadWorldJourney, saveWorldJourney } from './progress.js';
import { DISCOVERIES, MEMBER_LOCATIONS, TREE_LOCATIONS, distance } from './world-data.js';
import { createVehicle, stepVehicle, haltVehicle, recoverVehicle } from './driving.js';
import { createInput } from './input.js';
import { createJournal, archiveStops, nearbyInteraction } from './discoveries.js';
import { navigationInput } from './navigation.js';
import { clampFrameDelta } from './frame-timing.js';
import { isWorldVisible } from './world-cycle.js';
import { takeOver, stopIdFor } from './guided-tour.js';
import { createWorldLoader } from './world-loader.js';
import { createCameraState } from './camera-state.js';
import { createAudioController } from './audio-controller.js';
import { createMinigamesController } from './minigames.js';
import { createMapUI } from './map-ui.js';
import { createNavigationUI } from './navigation-ui.js';
import { createEditorialUI, createMembersData, MEMBER_ACCENTS } from './editorial-ui.js';
import { createHudController } from './hud-controller.js';
import { initGarageDock } from './garage-dock.js';

let artManifest = null;
fetch('./assets/art/manifest.json').then(r => r.json()).then(manifest => { artManifest = manifest; }).catch(() => {});

const members = createMembersData();
const vehicle = createVehicle();
let storage; try { storage = window.localStorage; } catch { /* Memory-only journal. */ }
const journal = createJournal(storage);
const savedWorld = loadWorldJourney(storage);
if (savedWorld) Object.assign(vehicle, savedWorld.vehicle);
const discovered = new Set(savedWorld?.discovered ?? loadJourney(storage).discovered);

const cameraState = createCameraState({ showcase: true });
const sceneSection = document.querySelector('#jogo');
const sectionDock = document.querySelector('#section-dock');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tourButton = document.querySelector('#tour-toggle');
const bandToggle = document.querySelector('#band-toggle');
const modalOpen = () => Boolean(document.querySelector('dialog[open]'));

let entered = false, enteredAt = 0, worldVisible = true, worldAvailable = false;
let world = null, destination = null, touring = false, previousFocus = null, nearby = null;
let lastTime, accumulator = 0, lastRenderTime = -Infinity, lastSavedTime = 0, lastHudTime = -Infinity;

function persistJourney() { saveWorldJourney(storage, vehicle, discovered); }
window.addEventListener('pagehide', persistJourney);
function announce(text) { document.querySelector('#announcement').textContent = text; }
function focusWorld() { (document.querySelector('#world canvas') || document.querySelector('#world-map'))?.focus({ preventScroll: true }); }
function refreshWorldVisibility() { return isWorldVisible(sceneSection.getBoundingClientRect(), { width: innerWidth, height: innerHeight }); }

function setShowcase(value) { cameraState.setShowcase(value); bandToggle.setAttribute('aria-pressed', String(cameraState.showcase)); }
function setTour(value) {
  touring = value;
  sceneSection.dataset.touring = String(value);
  tourButton.setAttribute('aria-pressed', String(value));
  tourButton.textContent = value ? 'Ⅱ PAUSAR PASSEIO' : '▶ PASSEIO GUIADO';
}
function restoreFocus() {
  accumulator = 0; lastTime = performance.now();
  if (previousFocus?.isConnected && !previousFocus.hidden && !previousFocus.disabled) previousFocus.focus({ preventScroll: true });
  else focusWorld();
}

let hud, mapUI, navUI, editorial, minigames, audio;

function enterWorld() {
  hud.lockScroll(true);
  if (entered) return;
  entered = true; enteredAt = performance.now(); world?.setIntro(false);
  if (hud.onboarding.shouldWelcome()) setTimeout(() => hud.openOnboarding(), 350);
  document.querySelector('#jogo').dataset.entered = 'true';
  document.querySelector('.scene-intro').classList.add('leaving');
  document.querySelector('.scene-intro').inert = true;
}

function stop() {
  input.clear(); haltVehicle(vehicle); destination = null; accumulator = 0;
  setTour(false); persistJourney(); navUI?.pauseIfActive();
}

function interactionAtCar() {
  const hit = nearbyInteraction(vehicle);
  if (hit) return hit;
  const index = archiveStops.findIndex(stopItem => distance(vehicle, stopItem) < 10);
  return index < 0 ? null : { ...archiveStops[index], type: 'archive', index };
}

function interact() {
  if (modalOpen() || !entered) return;
  nearby = interactionAtCar();
  if (!nearby && minigames.arcadeNear()) { minigames.openArcade(); return; }
  if (nearby) hud.onboarding.markUsed('explore');
  if (!nearby) return;
  if (Math.abs(vehicle.speed) >= 2) { announce('Reduza a velocidade para explorar este lugar.'); return; }
  const stopId = stopIdFor(nearby);
  if (stopId) navUI.recordStop(stopId);
  if (nearby.type === 'archive') { document.querySelector('#journal-toggle').click(); editorial.eraArchive.open(nearby.index); return; }
  if (nearby.type === 'member') editorial.openMember(nearby.index); else editorial.openDiscovery(nearby.index);
}

const input = createInput({
  enabled: () => entered && worldVisible,
  driftEnabled: () => !touring,
  onManual() {
    navUI.endGuided();
    enterWorld(); destination = null; setTour(false);
    cameraState.onManualInput();
    bandToggle.setAttribute('aria-pressed', String(cameraState.showcase));
    world?.syncCameraState?.();
    hud.syncCameraModes();
  },
  onInteract: interact,
});

audio = createAudioController({
  storage, vehicle,
  isEntered: () => entered,
  isWorldVisible: () => worldVisible,
  isModalOpen: modalOpen,
  isGuidedPaused: () => navUI?.isGuidedPaused() ?? false,
  isBlockedForHorn: () => hud?.isBlockedForHorn() ?? false,
  stop, setTour, clearDestination: () => { destination = null; },
});

minigames = createMinigamesController({
  cameraState, vehicle,
  isEntered: () => entered,
  modalOpen, stop,
  setPreviousFocus: el => { previousFocus = el; },
  restoreFocus,
  getWorld: () => world,
  getLocalRadio: () => audio.localRadio,
});

navUI = createNavigationUI({
  storage, vehicle, cameraState, bandToggle, tourButton,
  getWorld: () => world,
  getLocalRadio: () => audio.localRadio,
  getDestination: () => destination,
  setDestination: value => { destination = value; },
  isTouring: () => touring,
  setTour, enterWorld, stop,
  toggleHudMenu: open => hud.toggleHudMenu(open),
  syncCameraModes: () => hud.syncCameraModes(),
  focusWorld, announce,
  setTrack: index => audio.setTrack(index),
  playDiscoverySound: () => audio.playDiscoverySound(),
  interact, modalOpen,
  toggleFullMap: force => mapUI?.toggleFullMap(force),
});

hud = createHudController({
  storage, sceneSection, reducedMotion, cameraState, vehicle, input, journal, discovered, members, modalOpen,
  isEntered: () => entered,
  getEnteredAt: () => enteredAt,
  isWorldVisible: () => worldVisible,
  refreshWorldVisibility,
  setWorldVisible: v => { worldVisible = v; },
  isWorldAvailable: () => worldAvailable,
  isTouring: () => touring,
  getWorld: () => world,
  getNearby: () => nearby,
  getDestination: () => destination,
  enterWorld, stop, setShowcase,
  setPreviousFocus: el => { previousFocus = el; },
  restoreFocus, focusWorld, announce, haltVehicle,
  isFullMapOpen: () => mapUI?.isFullMapOpen() ?? false,
  toggleFullMap: force => mapUI?.toggleFullMap(force),
  openDiscoveries: () => navUI.openDiscoveries(),
  audio, guide: navUI.guide,
  arcadeNear: () => minigames.arcadeNear(),
});

mapUI = createMapUI({
  sceneSection, cameraState, bandToggle, vehicle, members, memberAccents: MEMBER_ACCENTS,
  onboarding: hud.onboarding, quickMap: hud.quickMap,
  getWorld: () => world,
  getLocalRadio: () => audio.localRadio,
  enterWorld, stop,
  toggleHudMenu: open => hud.toggleHudMenu(open),
  syncCameraModes: () => hud.syncCameraModes(),
  focusWorld,
  startNavigation: point => navUI.startNavigation(point),
});
navUI.syncGuidedHud();

editorial = createEditorialUI({
  members, vehicle, journal, discovered, sceneSection, reducedMotion, modalOpen, stop,
  setPreviousFocus: el => { previousFocus = el; },
  restoreFocus, persistJourney, announce, audio,
  memberView: minigames.memberView,
  startNavigation: point => navUI.startNavigation(point),
  getWorld: () => world,
  setShowcase,
  resetViewControls: () => hud.resetViewControls(),
  getArtManifest: () => artManifest,
});

initGarageDock({
  sceneSection, reducedMotion, cameraState, bandToggle,
  getWorld: () => world,
  isWorldAvailable: () => worldAvailable,
  isEntered: () => entered,
  enterWorld,
  lockScroll: on => hud.lockScroll(on),
  focusWorld, setShowcase,
  syncCameraModes: () => hud.syncCameraModes(),
  startNavigation: point => navUI.startNavigation(point),
  stop, setTour, clearDestination: () => { destination = null; },
  modalOpen, discoveries: DISCOVERIES, journal,
});

if ('IntersectionObserver' in window) new IntersectionObserver(() => {
  worldVisible = refreshWorldVisibility();
  if (sectionDock) sectionDock.dataset.visible = String(!worldVisible && !entered);
  if (!worldVisible) { input.clear(); haltVehicle(vehicle); accumulator = 0; persistJourney(); hud.hideTip(); }
}, { threshold: 0 }).observe(sceneSection);

window.addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
document.querySelector('#enter-world').addEventListener('click', () => { enterWorld(); focusWorld(); });
bandToggle.addEventListener('click', () => { stop(); setShowcase(!cameraState.showcase); });
document.querySelector('#recover-car').addEventListener('click', () => { stop(); recoverVehicle(vehicle); setShowcase(false); announce('Geep reposicionado no caminho mais próximo.'); });
document.querySelector('#interact').addEventListener('click', interact);

function set3dControls(enabled) {
  for (const button of document.querySelectorAll('.camera-tools button, #camera-toggle, #band-toggle')) button.disabled = !enabled;
}
function showWorldFailure(error) {
  const reason = error?.message || String(error) || 'erro desconhecido';
  console.error('[3D] mundo não carregou:', reason, error?.stack ?? '');
  document.querySelector('#render-status').textContent = 'MODO 2D / 3D NÃO CARREGOU';
  document.querySelector('#world-failure-reason').textContent = reason;
  document.querySelector('#world-failure').hidden = false;
  document.querySelector('#vehicle-status').textContent = 'MODO 2D / MODELOS DISPONÍVEIS PARA DOWNLOAD';
  document.querySelector('#band-status').textContent = 'MODO 2D / CONHEÇA A BANDA PELAS FICHAS';
  document.querySelector('.world-shell').classList.remove('has-3d');
  document.querySelector('.world-shell').classList.add('map-only');
  set3dControls(false);
}
function hideWorldFailure() {
  document.querySelector('#world-failure').hidden = true;
  document.querySelector('.world-shell').classList.add('has-3d');
  document.querySelector('.world-shell').classList.remove('map-only');
  document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL';
  set3dControls(true);
}

const worldLoader = createWorldLoader({
  importScene: () => import('./scene.js'),
  reset: () => document.querySelector('#world').replaceChildren(),
  onStatus: text => { document.querySelector('#render-status').textContent = text; },
  mount: ({ createWorld }) => {
    world = createWorld(document.querySelector('#world'), index => {
      if (cameraState.showcase || distance(vehicle, MEMBER_LOCATIONS[index]) < 13 && Math.abs(vehicle.speed) < 2) editorial.openMember(index);
      else announce('Aproxime-se e reduza a velocidade para conhecer este integrante.');
    }, {
      cameraState,
      onViewReset: () => hud.resetViewControls(),
      onFullscreen: () => hud.fullscreenButton.click(),
      onExplore: () => interact(),
      radio: audio.localRadio, onSteer: value => input.setWheelSteer(value),
      onRadio(action) {
        if (action === 'playlist') { hud.toggleHudMenu(audio.radioMenu); audio.localRadio.playlist.focus(); }
        else audio.localRadio.actions[action]?.();
      },
      onLost() {
        stop(); worldAvailable = false;
        document.querySelector('.world-shell').classList.remove('has-3d'); document.querySelector('.world-shell').classList.add('map-only');
        document.querySelector('#render-status').textContent = 'MODO 2D / 3D TEMPORARIAMENTE INDISPONÍVEL';
        document.querySelector('#world-map').focus({ preventScroll: true });
      },
      onRestored() {
        worldAvailable = true; document.querySelector('.world-shell').classList.add('has-3d'); document.querySelector('.world-shell').classList.remove('map-only');
        document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL'; focusWorld();
      },
    });
    worldAvailable = true; world.setIntro(!entered);
    world.setQuality(hud.qualitySelect.value);
    if (new URLSearchParams(location.search).has('perf')) {
      window.__gorilazz = {
        audio: () => audio.debugState(),
        ui: () => ({ entered, worldVisible, touring, modal: modalOpen(), fullscreen: Boolean(document.fullscreenElement), mode3d: document.documentElement.classList.contains('mode-3d') }),
        world, vehicle, cameraState, radio: audio.localRadio, trees: TREE_LOCATIONS, known: journal.known,
        arcade: minigames.arcadeScreen, piano: minigames.pianoScreen, openMember: editorial.openMember,
        memberView: minigames.memberView, guided: () => navUI.getGuided(), stopProgress: navUI.stopProgress,
        tourStops: navUI.tourStops, startGuided: navUI.startGuided, takeOver,
      };
    }
    document.querySelector('.world-shell').classList.add('has-3d');
    document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL';
    return world;
  },
  onReady: () => hideWorldFailure(),
  onFail: error => showWorldFailure(error),
});
document.querySelector('#world-retry').addEventListener('click', () => worldLoader.run());
worldLoader.run();

hud.updateTelemetry();

function updateFrame(time) {
  const delta = lastTime === undefined ? 0 : clampFrameDelta((time - lastTime) / 1000); lastTime = time;
  worldVisible = refreshWorldVisibility();
  const paused = modalOpen() || document.hidden || !worldVisible;
  if (paused) { cameraState.setSky(false); world?.setSkyLook(false); }
  audio.updateFrame(delta, paused);
  if (entered && !paused) mapUI.updateCar(delta);
  if (entered && !paused) {
    accumulator = Math.min(accumulator + delta, .1);
    while (accumulator >= 1 / 120) {
      let controls = input.read();
      if (navUI.isGuidedRunning() && !controls.active) controls = navUI.guidedControls();
      else if (destination && !controls.active) {
        controls = navigationInput(vehicle, destination);
        if (controls.arrived) { const title = destination.target.title; stop(); announce(`Você chegou: ${title}. Pressione E para explorar.`); break; }
      }
      stepVehicle(vehicle, controls, 1 / 120); accumulator -= 1 / 120;
    }
  } else accumulator = 0;
  if (time - lastHudTime >= 80) {
    lastHudTime = time;
    nearby = interactionAtCar();
    const { region, speed, moving } = hud.updateHudTick({ paused, nearby, destination });
    mapUI.updateHud({ region, speed, moving, destination, known: journal.known });
  }
  const moving = Math.abs(vehicle.speed) > .1;
  const renderInterval = window.innerWidth <= 700 ? 1000 / 30 : 1000 / 60;
  const renderable = !paused || (cameraState.cameraFocus && worldVisible && !document.hidden);
  if (world && worldAvailable && renderable && time - lastRenderTime + .5 >= renderInterval) {
    world.update(vehicle, time, cameraState.orbital, reducedMotion.matches, cameraState.showcase, journal.known, nearby);
    lastRenderTime = time;
  }
  if (moving && !paused && time - lastSavedTime > 1500) { persistJourney(); lastSavedTime = time; }
}

function frame(time) {
  requestAnimationFrame(frame);
  try { updateFrame(time); } catch (error) { console.error('Quadro ignorado:', error); }
}
requestAnimationFrame(frame);
