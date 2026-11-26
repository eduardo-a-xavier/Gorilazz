// Passeio Guiado (9 paradas em ordem fixa), cartão de parada, HUD X/9, Central de Descobertas e navegação.
import { CITY_ERAS, DISCOVERIES, ERA_GATES, REGIONS, distance, nearestRoad } from './world-data.js';
import { tracks } from './content.js';
import { planPath, navigationInput } from './navigation.js';
import { createJourneyGuide } from './journey-guide.js';
import { createDiscoveriesDrawer } from './discoveries-drawer.js';
import { DISCOVERY_LORE } from './discoveries-lore.js';
import { stopFrame } from './tour-framing.js';
import { buildStops, orderTour, createStopProgress, speedCap, localTrackFor, ARRIVE_M, STOP_HOLD_MS, TOAST_MS } from './guided-tour.js';

const HEAD_LIMIT = 35 * Math.PI / 180;
const smooth01 = t => t * t * (3 - 2 * t);
const brakeControls = { throttle: false, brake: true, steer: 0 };

export function createNavigationUI({
  storage,
  vehicle,
  cameraState,
  bandToggle,
  tourButton,
  getWorld,
  getLocalRadio,
  getDestination,
  setDestination,
  isTouring,
  setTour,
  enterWorld,
  stop,
  toggleHudMenu,
  syncCameraModes,
  focusWorld,
  announce,
  setTrack,
  playDiscoverySound,
  interact,
  modalOpen,
  toggleFullMap,
}) {
  const eraTracks = ['clint', 'melancholy', 'revolving', 'saturnz'];
  const tourStops = buildStops({ gates: ERA_GATES, cityEras: CITY_ERAS, eraTracks, discoveries: DISCOVERIES, tracks });
  const stopProgress = createStopProgress(storage, tourStops.map(stop => stop.id));
  let guided = null; // { order, index, holdUntil, paused, departedAt, align }
  let cardTimer = 0;

  const roadPointOf = stopItem => {
    const road = nearestRoad(stopItem);
    return { x: road.x, z: road.z, title: stopItem.title };
  };

  function showGuidedCard(stopItem, position = 0, total = 0) {
    clearTimeout(cardTimer);
    const card = document.querySelector('#guided-card'); card.classList.remove('is-leaving');
    document.querySelector('#guided-kicker').textContent = (stopItem.kind === 'era' ? 'ERA NA ESTRADA' : 'HISTÓRIA') + (position ? ` · PONTO ${position} / ${total}` : '');
    document.querySelector('#guided-title').textContent = stopItem.title;
    document.querySelector('#guided-year').textContent = stopItem.year;
    document.querySelector('#guided-summary').textContent = stopItem.summary;
    card.hidden = false;
  }

  function hideGuidedCard() {
    const card = document.querySelector('#guided-card');
    if (!card || card.hidden) return;
    card.classList.add('is-leaving'); clearTimeout(cardTimer);
    cardTimer = setTimeout(() => { card.hidden = true; card.classList.remove('is-leaving'); }, 350);
  }

  function showStopsToast() {
    const toast = document.querySelector('#stops-toast');
    toast.hidden = false;
    setTimeout(() => { toast.hidden = true; }, TOAST_MS);
  }

  function renderTourMapStops() {
    const container = document.querySelector('#full-map-destinations'); if (!container) return;
    container.querySelector('.tour-stops')?.remove();
    const section = document.createElement('div'); section.className = 'full-map-group tour-stops';
    const heading = document.createElement('h3'); heading.textContent = `Paradas do passeio (${stopProgress.count} / ${stopProgress.total})`; section.append(heading);
    const central = document.createElement('button'); central.type = 'button'; central.className = 'map-discoveries'; central.textContent = 'Central de Descobertas'; central.addEventListener('click', () => openDiscoveries()); section.append(central);
    for (const stopItem of tourStops) {
      const button = document.createElement('button'); button.type = 'button';
      const done = stopProgress.has(stopItem.id);
      button.innerHTML = `<span class="dest-tag" style="--tag:${stopItem.kind === 'era' ? '#d2e2a8' : '#f5a9c6'}">${done ? '✓' : '○'}</span><strong>${stopItem.title}</strong><small>${stopItem.year}</small>`;
      button.addEventListener('click', () => { toggleFullMap(false); startNavigation(roadPointOf(stopItem)); });
      section.append(button);
    }
    container.append(section);
  }

  function syncGuidedHud() {
    const count = stopProgress.count, total = stopProgress.total;
    document.querySelector('#stops-count').textContent = `DESCOBERTAS: ${count} / ${total}`;
    document.querySelector('#stops-bar-fill').style.width = `${count / total * 100}%`;
    const text = document.querySelector('#guided-text'), toggle = document.querySelector('#guided-toggle');
    if (guided && !guided.paused) { text.textContent = 'Modo Passeio Guiado · Pressione WASD para assumir o volante'; toggle.textContent = '⏸ Pausar'; }
    else if (guided) { text.textContent = 'Passeio guiado pausado'; toggle.textContent = '▶ Retomar'; }
    else { text.textContent = count >= total ? 'Universo explorado: refazer o passeio guiado' : `Passeio guiado pelas ${total} paradas · ${total - count} para descobrir`; toggle.textContent = '▶ Passeio Guiado'; }
    renderTourMapStops();
  }

  function recordStop(id) {
    const fresh = stopProgress.visit(id);
    if (fresh) playDiscoverySound();
    if (fresh) { if (stopProgress.complete) showStopsToast(); syncGuidedHud(); }
    return fresh;
  }

  function arriveAt(stopItem) {
    recordStop(stopItem.id);
    guided.holdUntil = performance.now() + STOP_HOLD_MS;
    showGuidedCard(stopItem, guided.index + 1, guided.order.length);
    setTrack(stopItem.trackIndex);
    announce(`${stopItem.title}. ${stopItem.year}.`);
    const localRadio = getLocalRadio();
    const localIndex = localTrackFor(stopItem);
    if (localRadio.read().index !== localIndex) {
      if (localRadio.selectSmooth) localRadio.selectSmooth(localIndex); else localRadio.select(localIndex);
    }
    syncGuidedHud();
  }

  function cinematicHold(stopItem) {
    const world = getWorld();
    if (cameraState.firstPerson) {
      const h = vehicle.heading, fx = -Math.sin(h), fz = -Math.cos(h), rx = Math.cos(h), rz = -Math.sin(h);
      const dx = stopItem.x - vehicle.x, dz = stopItem.z - vehicle.z;
      const phi = Math.atan2(dx * rx + dz * rz, dx * fx + dz * fz);
      world?.setHeadYaw(-Math.max(-HEAD_LIMIT, Math.min(HEAD_LIMIT, phi)));
      return;
    }
    cameraState.enterTourOrbit();
    const now = performance.now(), t = now / 1000;
    const start = guided.holdUntil - STOP_HOLD_MS;
    const fadeIn = smooth01(Math.max(0, Math.min(1, (now - start) / 700)));
    const fadeOut = smooth01(Math.max(0, Math.min(1, (guided.holdUntil - now) / 600)));
    const alpha = fadeIn * fadeOut;
    const base = Math.atan2(vehicle.x - stopItem.x, vehicle.z - stopItem.z), a = base + .45 * Math.sin(t * .6);
    world?.frameSpot({ x: stopItem.x, z: stopItem.z, dirX: Math.sin(a), dirZ: Math.cos(a), ...stopFrame(stopItem), alpha });
  }

  function legTo(index) {
    guided.index = index; guided.holdUntil = 0; guided.departedAt = performance.now();
    hideGuidedCard(); cameraState.exitTourOrbit(); getWorld()?.clearPose();
    const dest = planPath(vehicle, roadPointOf(guided.order[index]));
    setDestination(dest);
    // Sem giro seco no lugar: o piloto automático executa manobra progressiva com deslocamento real ao longo da spline.
    guided.align = null;
    setTour(true); syncGuidedHud();
  }

  function finishGuided() {
    guided = null; setDestination(null); hideGuidedCard(); setTour(false);
    cameraState.exitTourOrbit(); getWorld()?.clearPose(); getWorld()?.setHeadYaw(0);
    announce('Passeio guiado concluído. Você pode continuar explorando.');
    syncGuidedHud();
  }

  function endGuided() {
    if (!guided) return;
    guided = null; setDestination(null); hideGuidedCard(); setTour(false);
    cameraState.exitTourOrbit(); getWorld()?.clearPose(); getWorld()?.setHeadYaw(0);
    syncGuidedHud();
  }

  function pauseIfActive() {
    if (guided) { guided.paused = true; syncGuidedHud(); }
  }

  function guidedControls() {
    if (guided.holdUntil) {
      if (performance.now() < guided.holdUntil) { cinematicHold(guided.order[guided.index]); return brakeControls; }
      if (guided.index + 1 >= guided.order.length) { finishGuided(); return brakeControls; }
      legTo(guided.index + 1);
    }
    if (guided.align !== null && guided.align !== undefined) {
      if (Math.abs(vehicle.speed) > .3) return brakeControls;
      const diff = Math.atan2(Math.sin(guided.align - vehicle.heading), Math.cos(guided.align - vehicle.heading));
      if (Math.abs(diff) < .03) { vehicle.heading = guided.align; guided.align = null; }
      else vehicle.heading += Math.sign(diff) * Math.min(Math.abs(diff), 1.6 / 120);
      return brakeControls;
    }
    const stopItem = guided.order[guided.index], roadPoint = roadPointOf(stopItem), d = distance(vehicle, roadPoint);
    if (d < ARRIVE_M) { arriveAt(stopItem); return brakeControls; }
    getWorld()?.setHeadYaw(0);
    const nav = navigationInput(vehicle, getDestination(), { sinceStop: (performance.now() - (guided.departedAt ?? performance.now())) / 1000 });
    if (nav.arrived) { arriveAt(stopItem); return brakeControls; }
    if (Math.abs(vehicle.speed) > speedCap(d)) return { ...nav, throttle: false, brake: true };
    return nav;
  }

  function startGuided() {
    enterWorld(); cameraState.onStartTour(); bandToggle.setAttribute('aria-pressed', String(cameraState.showcase));
    getWorld()?.syncCameraState?.(); syncCameraModes();
    toggleHudMenu(null);
    if (!guided) guided = { order: orderTour(tourStops), index: 0, holdUntil: 0, paused: false, departedAt: performance.now() };
    guided.paused = false; legTo(guided.index);
    announce(`Passeio guiado pelas ${guided.order.length} paradas. Pressione WASD para assumir o volante.`);
    focusWorld();
  }

  function startNavigation(point) {
    endGuided(); stop(); enterWorld(); cameraState.onStartTour(); bandToggle.setAttribute('aria-pressed', String(cameraState.showcase));
    getWorld()?.syncCameraState?.(); syncCameraModes();
    toggleHudMenu(null);
    setDestination(planPath(vehicle, point));
    setTour(true);
    announce(`Passeio até ${point.title}. Você pode assumir a direção a qualquer momento.`);
    focusWorld();
  }

  document.querySelector('#guided-toggle').addEventListener('click', () => { if (guided && !guided.paused) stop(); else startGuided(); });
  document.querySelector('#start-guided').addEventListener('click', () => { startGuided(); });
  tourButton.addEventListener('click', () => {
    if (isTouring() || getDestination()) { stop(); return; }
    startGuided();
  });

  const guide = createJourneyGuide({ points: DISCOVERIES, regions: REGIONS, onNavigate: startNavigation, onStop: stop, onExplore: interact });

  const discoveriesDrawer = createDiscoveriesDrawer({
    lore: DISCOVERY_LORE,
    visited: () => new Set(stopProgress.ids()),
    goTo(stopId) { const stopItem = tourStops.find(item => item.id === stopId); if (!stopItem) return; enterWorld(); startNavigation(roadPointOf(stopItem)); focusWorld(); },
    onClose: () => focusWorld(),
  });
  function openDiscoveries() { if (modalOpen()) return; toggleFullMap(false); discoveriesDrawer.open(); }
  const stopsCounter = document.querySelector('#stops-counter');
  stopsCounter.tabIndex = 0; stopsCounter.setAttribute('role', 'button'); stopsCounter.setAttribute('aria-haspopup', 'dialog'); stopsCounter.title = 'Abrir a Central de Descobertas';
  stopsCounter.addEventListener('click', openDiscoveries);
  stopsCounter.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDiscoveries(); } });

  syncGuidedHud();

  return {
    tourStops,
    stopProgress,
    guide,
    getGuided: () => guided,
    isGuidedPaused: () => Boolean(guided && guided.paused),
    isGuidedRunning: () => Boolean(guided && !guided.paused),
    recordStop,
    syncGuidedHud,
    pauseIfActive,
    endGuided,
    guidedControls,
    startGuided,
    startNavigation,
    openDiscoveries,
  };
}
