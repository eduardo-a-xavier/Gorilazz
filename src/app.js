import { eras, tracks, sources, memberStories, trackById, listeningUrl, thematicStops, roadDiscoveryLore } from './content.js';
import { loadJourney, loadWorldJourney, saveWorldJourney } from './progress.js';
import { MEMBER_STOPS } from './route.js';
import { CITY_ERAS, CITY_LOTS, DISCOVERIES, ERA_GATES, MEMBER_LOCATIONS, REGIONS, ROADS, TREE_LOCATIONS, distance, eraAt, regionAt, nearestRoad } from './world-data.js';
import { createVehicle, stepVehicle, haltVehicle, recoverVehicle } from './driving.js';
import { createInput, numericShortcutIndex } from './input.js';
import { createJournal, archiveStops, createEraArchive, nearbyInteraction, rankByProximity } from './discoveries.js';
import { planPath, navigationInput } from './navigation.js';
import { createLocalRadio } from './local-radio.js';
import { createJourneyGuide } from './journey-guide.js';
import { createOnboarding, CONTROLS, TIPS, isHelpKey } from './onboarding.js';
import { createArcadeScreen } from './arcade-screen.js';
import { handleEscape } from './escape-stack.js';
import { createPianoScreen } from './piano-screen.js';
import { createMemberViewer, attachCardSpinners } from './member-viewer.js';
import { buildStops, orderTour, createStopProgress, speedCap, takeOver, stopIdFor, localTrackFor, ARRIVE_M, STOP_HOLD_MS } from './guided-tour.js';
import { discoveryIndexForEra, eraNavState } from './era-places.js';
import { createWorldLoader } from './world-loader.js';
import { artForDiscovery, creditLine } from './art-panels.js';
let artManifest = null;
fetch('./assets/art/manifest.json').then(r => r.json()).then(manifest => { artManifest = manifest; }).catch(() => {});
import { ARCADE_SPOT, ARCADE_RADIUS } from './arcade.js';
const members = [
  { name: '2-D', role: 'Voz', skin: '#e2d8c0', hair: '#3a68d8', shirt: '#f2559c', position: MEMBER_STOPS[0], description: 'Stuart Pot, conhecido como 2-D, é a voz da banda virtual. Seu cabelo azul e olhos escuros compõem sua identidade visual. Sua personalidade sensível contrasta com o caos ao redor.', song: 'Tomorrow Comes Today' },
  { name: 'Murdoc', role: 'Baixo', skin: '#91a568', hair: '#141414', shirt: '#373737', position: MEMBER_STOPS[1], description: 'Murdoc Niccals é o baixista e autoproclamado líder da banda. Provocador e ligado ao rock, está no centro de várias histórias do universo Gorillaz.', song: 'Feel Good Inc.' },
  { name: 'Noodle', role: 'Guitarra', skin: '#e2d8c0', hair: '#141414', shirt: '#3a68d8', position: MEMBER_STOPS[2], description: 'Noodle é a guitarrista japonesa da banda. Sua trajetória atravessa as eras visuais de Gorillaz, combinando mistério, independência e energia.', song: 'DARE' },
  { name: 'Russel', role: 'Bateria', skin: '#986b50', hair: '#141414', shirt: '#e2d8c0', position: MEMBER_STOPS[3], description: 'Russel Hobbs é o baterista. Sua conexão com o hip-hop e o sobrenatural faz parte da narrativa da banda.', song: 'Clint Eastwood' },
];
members.forEach((member, index) => Object.assign(member, memberStories[index], {song: trackById(memberStories[index].track).name}));
const memberKeys = ['twod', 'murdoc', 'noodle', 'russel'];
// Mesmas cores das placas e dos fachos de luz de cada integrante no mundo.
const MEMBER_ACCENTS = ['#7fa6ff', '#9dd66b', '#f5a9c6', '#ffcc4d'];
function memberPhoto(index) { return `<img src="./assets/portraits/phase7-${memberKeys[index]}.png" alt="" width="384" height="512" loading="lazy">`; }
function portrait(member, index) {
  return `<svg viewBox="0 0 70 110" aria-hidden="true"><path d="M22 76 18 108M47 76l5 32" stroke="#141414" stroke-width="10"/><path d="M${index === 3 ? 10 : 17} 79V54Q35 36 ${index === 3 ? 60 : 53} 54v25Z" fill="${member.shirt}" stroke="#141414" stroke-width="3"/><path d="M18 55 8 80m45-25 9 25" stroke="${member.skin}" stroke-width="8"/><ellipse cx="35" cy="28" rx="${index === 3 ? 24 : 19}" ry="24" fill="${member.skin}" stroke="#141414" stroke-width="3"/><path d="M15 24 13 7 26 9 34 0 41 9 56 5 54 30 44 15 34 21 26 15Z" fill="${member.hair}"/><g fill="#141414"><ellipse cx="27" cy="29" rx="4" ry="5"/><ellipse cx="43" cy="29" rx="4" ry="5"/></g><path d="m28 42 15-2" stroke="#141414" stroke-width="2"/></svg>`;
}

const vehicle = createVehicle();
let storage; try { storage = window.localStorage; } catch { /* Memory-only journal. */ }
const journal = createJournal(storage);
// Onboarding: boas-vindas única, ajuda de teclas (H ou F1) e dicas contextuais que somem após o uso.
const onboarding = createOnboarding(storage);
const onboardingDialog = document.querySelector('#onboarding-dialog');
const onboardingTip = document.querySelector('#onboarding-tip');
const onboardingOptOut = document.querySelector('#onboarding-optout');
onboardingDialog.querySelector('.onboarding-keys').replaceChildren(...CONTROLS.flatMap(({ keys, text }) => {
  const dt = document.createElement('dt'); dt.textContent = keys;
  const dd = document.createElement('dd'); dd.textContent = text;
  return [dt, dd];
}));
let tipId = null, tipUntil = 0, tipCooldown = 0, enteredAt = 0;
function openOnboarding() {
  if (modalOpen()) return;
  if (fullMapOverlay && !fullMapOverlay.hidden) toggleFullMap(false);
  // Não usa stop(): ele apagaria o destino da era (EXPLORAR) que acabou de começar. O laço já pausa com modal aberto.
  input.clear(); haltVehicle(vehicle); previousFocus = document.activeElement; hideTip();
  onboardingOptOut.checked = onboarding.optOut;
  onboardingDialog.showModal(); onboardingDialog.querySelector('#onboarding-start').focus();
}
onboardingDialog.addEventListener('close', () => { onboarding.setOptOut(onboardingOptOut.checked); onboarding.markWelcomed(); restoreFocus(); });
onboardingDialog.querySelector('#onboarding-start').addEventListener('click', () => onboardingDialog.close());
document.addEventListener('keydown', event => {
  if (!isHelpKey(event.key) || event.repeat || event.ctrlKey || event.metaKey || event.altKey || event.target.closest?.('input,select,textarea,[contenteditable]')) return;
  event.preventDefault(); openOnboarding();
});
function hideTip() { tipId = null; onboardingTip.hidden = true; }
function showTip(id) {
  tipId = id; tipUntil = performance.now() + 4000;
  setTimeout(() => { if (tipId === id) { hideTip(); tipCooldown = performance.now() + 8000; } }, 4000);
  onboardingTip.textContent = TIPS.find(item => item.id === id).text; onboardingTip.hidden = false;
  onboarding.noteTipShown(id);
}
// Dica some após 4 s, quando o gesto acontece (dirigir, E, M) e nunca fora do modo 3D; depois espera 8 s antes de voltar.
function tickOnboarding() {
  const now = performance.now();
  if (!entered || !document.documentElement.classList.contains('mode-3d') || !worldVisible || modalOpen() || (fullMapOverlay && !fullMapOverlay.hidden)) return hideTip();
  if (Math.abs(vehicle.speed) > 3) { onboarding.markUsed('drive'); hideTip(); }
  if (tipId && onboarding.isUsed(tipId)) return hideTip();
  if (tipId) { if (now > tipUntil) { hideTip(); tipCooldown = now + 8000; } return; }
  if (now < tipCooldown) return;
  if (nearby && onboarding.tipPending('explore')) return showTip('explore');
  if (onboarding.tipPending('drive') && now - enteredAt > 1500) return showTip('drive');
  if (onboarding.tipPending('map') && now - enteredAt > 20000) return showTip('map');
}
setInterval(tickOnboarding, 400);
// Fliperama de Kong Studios: E perto da máquina, com o carro parado, abre o minigame e pausa a condução.
let cameraFocus = false; // fliperama aberto: a câmera foca a tela do gabinete
const arcadeScreen = createArcadeScreen({ dialog: document.querySelector('#arcade-dialog'), onClose: () => { cameraFocus = false; world?.clearPose(); restoreFocus(); } });
// Frente do gabinete: a mesma direção que arcade-cabinet.js usa (para a via mais próxima).
const arcadeFront = (() => { const road = nearestRoad(ARCADE_SPOT), dx = road.x - ARCADE_SPOT.x, dz = road.z - ARCADE_SPOT.z, len = Math.hypot(dx, dz) || 1; return { x: dx / len, z: dz / len }; })();
// Visualizador 360° do integrante no modal: a ficha mostra o modelo girável; sem ele, fica o retrato 2D.
const memberView = createMemberViewer({
  canvas: document.querySelector('#member-canvas'),
  onReady: () => { document.querySelector('#member-view').hidden = false; document.querySelector('#portrait').hidden = true; },
  onFail: () => { document.querySelector('#member-view').hidden = true; document.querySelector('#portrait').hidden = false; },
});
document.querySelector('#view-prev').addEventListener('click', () => memberView.rotate(-1));
document.querySelector('#view-next').addEventListener('click', () => memberView.rotate(1));
// Minigame de piano do 2-D: abre do modal do 2-D; ao sair, o foco volta ao botão e o modal fica aberto.
const pianoScreen = createPianoScreen({ dialog: document.querySelector('#piano-dialog'), onClose: () => document.querySelector('#character-piano')?.focus() });
document.querySelector('#character-piano').addEventListener('click', () => pianoScreen.open());
const arcadeNear = () => entered && Math.hypot(vehicle.x - ARCADE_SPOT.x, vehicle.z - ARCADE_SPOT.z) < ARCADE_RADIUS && Math.abs(vehicle.speed) < 2;
function openArcade() {
  if (modalOpen()) return;
  stop(); previousFocus = document.activeElement; cameraFocus = true;
  // Câmera aproxima a tela do gabinete ao abrir o jogo; ao fechar, clearPose devolve a câmera ao carro.
  world?.frameSpot({ x: ARCADE_SPOT.x + arcadeFront.x * .6, z: ARCADE_SPOT.z + arcadeFront.z * .6, dirX: arcadeFront.x, dirZ: arcadeFront.z, distance: 3.4, height: 2.5, target: 2.2 });
  arcadeScreen.open();
}
const savedWorld = loadWorldJourney(storage);
if (savedWorld) Object.assign(vehicle, savedWorld.vehicle);
const discovered = new Set(savedWorld?.discovered ?? loadJourney(storage).discovered);
let manualTrack = false, selectedEraIndex = 0, worldVisible = true, worldAvailable = false;
let lastRenderTime = -Infinity, lastSavedTime = 0;
const sceneSection = document.querySelector('#jogo');
const sectionDock = document.querySelector('#section-dock');
function persistJourney() { saveWorldJourney(storage, vehicle, discovered); }
window.addEventListener('pagehide', persistJourney);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  worldVisible = entries[0].isIntersecting;
  // Depois de entrar no mundo, a leitura usa o botão "Voltar ao Carro 3D" (mesmo canto): a barra de seções não aparece junto.
  if (sectionDock) sectionDock.dataset.visible = String(!worldVisible && !entered);
  // Fora da tela o laço já pausa; só freia o carro e mantém a rota (destino e passeio) para retomar ao voltar.
  if (!worldVisible) { input.clear(); haltVehicle(vehicle); accumulator = 0; persistJourney(); hideTip(); }
}, {threshold:0}).observe(sceneSection);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dialog = document.querySelector('#character-dialog');
const discoveryDialog = document.querySelector('#discovery-dialog');
const journalDialog = document.querySelector('#journal-dialog');
const modalOpen = () => Boolean(document.querySelector('dialog[open]'));
let entered = false, showcase = true, orbital = false, overview = false, landmarkView = false, firstPerson = false;
let world = null, destination = null, touring = false, previousFocus = null, nearby = null;
let lastTime, accumulator = 0, currentRegion = -1, currentDistrict = -1, tourIndex = 0;
const tourButton = document.querySelector('#tour-toggle');
const bandToggle = document.querySelector('#band-toggle');
const input = createInput({ enabled: () => entered && worldVisible, onManual() {
  endGuided(); // assumir o volante: o passeio sai sem tranco; o progresso continua salvo
  enterWorld(); destination = null; setTour(false); setShowcase(false);
  if (overview || landmarkView) { overview = false; landmarkView = false; firstPerson = false; world?.setFirstPerson(false); world?.setOverview(false); syncCameraModes(); }
}, onInteract: interact });

function announce(text) { document.querySelector('#announcement').textContent = text; }
function focusWorld() { (document.querySelector('#world canvas') || document.querySelector('#world-map'))?.focus({preventScroll:true}); }
function enterWorld() {
  lockScroll(true);
  if (entered) return;
  entered = true; enteredAt = performance.now(); world?.setIntro(false);
  if (onboarding.shouldWelcome()) setTimeout(openOnboarding, 350);
  document.querySelector('#jogo').dataset.entered = 'true';
  document.querySelector('.scene-intro').classList.add('leaving');
  document.querySelector('.scene-intro').inert = true;
}
function setShowcase(value) { showcase = value; bandToggle.setAttribute('aria-pressed', String(value)); }
function setTour(value) {
  touring = value;
  sceneSection.dataset.touring = String(value); tourButton.setAttribute('aria-pressed', String(value));
  tourButton.textContent = value ? 'Ⅱ PAUSAR PASSEIO' : '▶ PASSEIO GUIADO';
}
function stop() { input.clear(); haltVehicle(vehicle); destination = null; accumulator = 0; setTour(false); persistJourney(); if (guided) { guided.paused = true; syncGuidedHud(); } }
window.addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
document.querySelector('#enter-world').addEventListener('click', () => { enterWorld(); focusWorld(); });
bandToggle.addEventListener('click', () => { stop(); setShowcase(!showcase); });
document.querySelector('#recover-car').addEventListener('click', () => { stop(); recoverVehicle(vehicle); setShowcase(false); announce('Geep reposicionado no caminho mais próximo.'); });
// ---- Passeio guiado (9 paradas) e contador de descobertas: regras em src/guided-tour.js ----
// As 9 paradas são os 4 portais de era (CITY_ERAS) e os 5 pontos de história (DISCOVERIES), com texto já existente.
const eraTracks = ['clint', 'melancholy', 'revolving', 'saturnz']; // faixa de cada portal de era (uma por era)
const tourStops = buildStops({ gates: ERA_GATES, cityEras: CITY_ERAS, eraTracks, discoveries: DISCOVERIES, tracks });
const stopProgress = createStopProgress(storage, tourStops.map(stop => stop.id));
let guided = null; // { order, index, holdUntil, paused } enquanto o passeio existe (pausado ou não)
const brakeControls = { throttle: false, brake: true, steer: 0 };
const roadPointOf = stop => { const road = nearestRoad(stop); return { x: road.x, z: road.z, title: stop.title }; };
function showGuidedCard(stop) {
  document.querySelector('#guided-kicker').textContent = stop.kind === 'era' ? 'ERA NA ESTRADA' : 'HISTÓRIA';
  document.querySelector('#guided-title').textContent = stop.title;
  document.querySelector('#guided-year').textContent = stop.year;
  document.querySelector('#guided-summary').textContent = stop.summary;
  document.querySelector('#guided-card').hidden = false;
}
function hideGuidedCard() { document.querySelector('#guided-card').hidden = true; }
function showStopsToast() { const toast = document.querySelector('#stops-toast'); toast.hidden = false; setTimeout(() => { toast.hidden = true; }, 6000); }
function renderTourMapStops() {
  const container = document.querySelector('#full-map-destinations'); if (!container) return;
  container.querySelector('.tour-stops')?.remove();
  const section = document.createElement('div'); section.className = 'full-map-group tour-stops';
  const heading = document.createElement('h3'); heading.textContent = `Paradas do passeio (${stopProgress.count} / ${stopProgress.total})`; section.append(heading);
  for (const stop of tourStops) {
    const button = document.createElement('button'); button.type = 'button';
    const done = stopProgress.has(stop.id);
    button.innerHTML = `<span class="dest-tag" style="--tag:${stop.kind === 'era' ? '#d2e2a8' : '#f5a9c6'}">${done ? '✓' : '○'}</span><strong>${stop.title}</strong><small>${stop.year}</small>`;
    button.addEventListener('click', () => { toggleFullMap(false); startNavigation(roadPointOf(stop)); });
    section.append(button);
  }
  container.append(section);
}
function syncGuidedHud() {
  const count = stopProgress.count, total = stopProgress.total;
  document.querySelector('#stops-count').textContent = `DESCOBERTAS: ${count} / ${total}`;
  document.querySelector('#stops-bar-fill').style.width = `${count / total * 100}%`;
  const text = document.querySelector('#guided-text'), toggle = document.querySelector('#guided-toggle');
  if (guided && !guided.paused) { text.textContent = 'Modo Passeio Guiado · Pressione WASD para assumir o volante'; toggle.textContent = '⏸ Pausar passeio'; }
  else if (guided) { text.textContent = 'Passeio guiado pausado'; toggle.textContent = '▶ Retomar passeio'; }
  else { text.textContent = count >= total ? 'Universo explorado: refazer o passeio guiado' : `Passeio guiado pelas ${total} paradas · ${total - count} para descobrir`; toggle.textContent = '▶ Fazer passeio guiado'; }
  renderTourMapStops();
}
function legTo(index) {
  guided.index = index; guided.holdUntil = 0; hideGuidedCard(); world?.clearPose();
  destination = planPath(vehicle, roadPointOf(guided.order[index]));
  // Antes de sair, o Geep gira no lugar (parado, sobre o asfalto) até a frente apontar para o ponto que o navigationInput vai mirar:
  // o primeiro do trecho a 8 m ou mais (o trecho começa com pontos colados no carro, que podem apontar para trás).
  // Mirar no primeiro ponto fazia o navigationInput dar marcha ré e levar o carro para a calçada.
  const path = destination.points;
  let aim = destination.index;
  while (aim < path.length - 1 && distance(vehicle, path[aim]) < 8) aim++;
  const next = path[aim];
  guided.align = Math.atan2(-(next.x - vehicle.x), -(next.z - vehicle.z));
  setTour(true); syncGuidedHud();
}
// Conta uma parada (passeio ou tecla E). Só a primeira visita soma; HUD e mapa são atualizados na hora.
function recordStop(id) {
  const fresh = stopProgress.visit(id);
  if (fresh) { if (stopProgress.complete) showStopsToast(); syncGuidedHud(); }
  return fresh;
}
function arriveAt(stop) {
  recordStop(stop.id);
  guided.holdUntil = performance.now() + STOP_HOLD_MS;
  showGuidedCard(stop); setTrack(stop.trackIndex); announce(`${stop.title}. ${stop.year}.`);
  // Player local da Kong FM acompanha a parada (Concreto ou Maré de plástico); sem trocar se já está nela.
  const localIndex = localTrackFor(stop);
  if (localRadio.read().index !== localIndex) localRadio.select(localIndex);
  syncGuidedHud();
}
// Câmera cinematográfica na parada: órbita lenta (~25 s por volta) em torno do ponto, durante a espera.
function cinematicHold(stop) {
  const a = performance.now() / 1000 * .25;
  world?.frameSpot({ x: stop.x, z: stop.z, dirX: Math.sin(a), dirZ: Math.cos(a), distance: 7.5, height: 3.4, target: 2.6 });
}
function finishGuided() { guided = null; destination = null; hideGuidedCard(); setTour(false); world?.clearPose(); announce('Passeio guiado concluído. Você pode continuar explorando.'); syncGuidedHud(); }
// Assumir o volante (WASD) ou parar o passeio devolve a câmera de viagem ao normal.
function endGuided() { if (!guided) return; guided = null; destination = null; hideGuidedCard(); setTour(false); world?.clearPose(); syncGuidedHud(); }
// Controle do passeio: espera na parada, chega, reduz a velocidade perto dela e segue a malha de estradas.
function guidedControls() {
  if (guided.holdUntil) {
    if (performance.now() < guided.holdUntil) { cinematicHold(guided.order[guided.index]); return brakeControls; }
    if (guided.index + 1 >= guided.order.length) { finishGuided(); return brakeControls; }
    legTo(guided.index + 1);
  }
  if (guided.align !== null && guided.align !== undefined) {
    if (Math.abs(vehicle.speed) > .3) return brakeControls; // ainda andando: só gira parado
    const diff = Math.atan2(Math.sin(guided.align - vehicle.heading), Math.cos(guided.align - vehicle.heading));
    if (Math.abs(diff) < .03) { vehicle.heading = guided.align; guided.align = null; }
    else vehicle.heading += Math.sign(diff) * Math.min(Math.abs(diff), 1.6 / 120); // 1,6 rad/s, passo do loop de 120 Hz
    return brakeControls;
  }
  // Chegada medida até o ponto da pista (alvo do trajeto), para o Geep não sair do asfalto nem cortar a calçada.
  const stop = guided.order[guided.index], roadPoint = roadPointOf(stop), d = distance(vehicle, roadPoint);
  if (d < ARRIVE_M) { arriveAt(stop); return brakeControls; }
  const nav = navigationInput(vehicle, destination);
  if (nav.arrived) { arriveAt(stop); return brakeControls; }
  if (Math.abs(vehicle.speed) > speedCap(d)) return { ...nav, throttle: false, brake: true };
  return nav;
}
function startGuided() {
  enterWorld(); setShowcase(false); overview = false; landmarkView = false; firstPerson = false; world?.setFirstPerson(false); world?.setOverview(false); syncCameraModes();
  toggleHudMenu(null);
  if (!guided) guided = { order: orderTour(tourStops, vehicle), index: 0, holdUntil: 0, paused: false };
  guided.paused = false; legTo(guided.index);
  announce(`Passeio guiado pelas ${guided.order.length} paradas. Pressione WASD para assumir o volante.`);
  focusWorld();
}
document.querySelector('#guided-toggle').addEventListener('click', () => { if (guided && !guided.paused) stop(); else startGuided(); });
syncGuidedHud(); // mostra o progresso salvo logo na carga (sem esperar a primeira visita)
function startNavigation(point) {
  endGuided(); stop(); enterWorld(); setShowcase(false); overview = false; landmarkView = false; firstPerson = false; world?.setFirstPerson(false); world?.setOverview(false); syncCameraModes();
  toggleHudMenu(null);
  destination = planPath(vehicle, point); setTour(true); announce(`Passeio até ${point.title}. Você pode assumir a direção a qualquer momento.`);
  focusWorld();
}
document.querySelector('#start-guided').addEventListener('click', () => { startGuided(); });
const guide = createJourneyGuide({ points: DISCOVERIES, regions: REGIONS, onNavigate: startNavigation, onStop: stop, onExplore: interact });
tourButton.addEventListener('click', () => {
  if (touring || destination) { stop(); return; }
  startGuided();
});
document.querySelector('#camera-toggle').addEventListener('click', event => {
  orbital = !orbital; event.currentTarget.setAttribute('aria-pressed', String(orbital));
  event.currentTarget.textContent = orbital ? '↗ CÂMERA DE VIAGEM' : '↻ CÂMERA ORBITAL';
});
const cameraTools = document.querySelector('.camera-tools');
const cameraMenuToggle = document.querySelector('#camera-menu-toggle');
function setCameraMenu(value) {
  cameraTools.dataset.expanded = String(value); cameraMenuToggle.setAttribute('aria-expanded', String(value));
  cameraMenuToggle.setAttribute('aria-label', value ? 'Fechar controles da câmera' : 'Abrir controles da câmera');
}
const fullscreenButton = document.querySelector('#fullscreen-toggle');
fullscreenButton.addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await sceneSection.requestFullscreen();
  } catch { announce('A tela cheia não está disponível neste navegador.'); }
});
document.addEventListener('fullscreenchange', () => {
  const active = document.fullscreenElement === sceneSection;
  fullscreenButton.setAttribute('aria-pressed', String(active));
  fullscreenButton.setAttribute('aria-label', active ? 'Sair da tela cheia' : 'Abrir tela cheia');
  fullscreenButton.textContent = active ? '×' : '⛶';
});
cameraMenuToggle.addEventListener('click', () => setCameraMenu(cameraTools.dataset.expanded !== 'true'));
document.addEventListener('pointerdown', event => { if (!cameraTools.contains(event.target)) setCameraMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') setCameraMenu(false); });
function resetViewControls() {
  overview = false; landmarkView = false; orbital = false; firstPerson = false;
  world?.setFirstPerson(false); cockpit.hidden = true; input.setWheelSteer(0); document.querySelector('#first-person').setAttribute('aria-pressed','false');
  const button = document.querySelector('#camera-toggle'); button.setAttribute('aria-pressed','false'); button.textContent = '↻ CÂMERA ORBITAL'; syncCameraModes();
}
function syncCameraModes() {
  cockpit.hidden = !firstPerson;
  sceneSection.classList.toggle('inside-geep',firstPerson);
  if (!firstPerson) { focusRadio(false); input.setWheelSteer(0); }
  document.querySelector('#first-person').setAttribute('aria-pressed', String(firstPerson));
  document.querySelector('#first-person').textContent = firstPerson ? '↙ VOLTAR AO CARRO' : '◉ 1ª PESSOA';
  document.querySelector('#overview-toggle').setAttribute('aria-pressed', String(overview));
  document.querySelector('#overview-toggle').textContent = overview ? '↙ VOLTAR AO JIPE' : '◎ VER MUNDO';
  document.querySelector('#windmill-focus').setAttribute('aria-pressed', String(landmarkView));
  document.querySelector('#windmill-focus').textContent = landmarkView ? '↙ VOLTAR AO JIPE' : '✦ VER MOINHO';
  quickFirstPerson.setAttribute('aria-pressed', String(firstPerson));
  quickFirstPerson.textContent = firstPerson ? '↙ Ver o Geep · V' : '◉ 1ª pessoa · V';
}
// Atalhos sempre à vista: 1ª pessoa e tela cheia, sem precisar abrir o menu.
const quickView = document.createElement('div');
quickView.className = 'quick-view'; quickView.setAttribute('role', 'group'); quickView.setAttribute('aria-label', 'Vista');
const quickFirstPerson = document.createElement('button'); quickFirstPerson.type = 'button'; quickFirstPerson.textContent = '◉ 1ª pessoa · V'; quickFirstPerson.setAttribute('aria-pressed', 'false');
const quickMap = document.createElement('button'); quickMap.type = 'button'; quickMap.id = 'quick-map'; quickMap.textContent = '🗺 Mapa · M'; quickMap.setAttribute('aria-expanded', 'false'); quickMap.setAttribute('aria-controls', 'full-map-overlay');
const quickFullscreen = document.createElement('button'); quickFullscreen.type = 'button'; quickFullscreen.textContent = '⛶ Tela cheia · F'; quickFullscreen.title = 'Ou dê dois cliques no cenário';
// Modo 3D: enquanto o jogo está em uso a página não rola por baixo da HUD. A saída é explícita
// (botão "Voltar para a História" ou qualquer link âncora da página), que libera o scroll antes de navegar.
const exit3dButton = document.createElement('button'); exit3dButton.type = 'button'; exit3dButton.id = 'exit-3d'; exit3dButton.hidden = true;
exit3dButton.textContent = '↓ Ler História & Eras'; exit3dButton.title = 'Parar de dirigir e ler a história e as eras';
// Volta ao carro 3D a partir da leitura: aparece só depois de já ter entrado no mundo e com o modo 3D desligado.
const backToCar = document.createElement('button'); backToCar.type = 'button'; backToCar.id = 'back-to-car'; backToCar.hidden = true;
backToCar.textContent = '↑ Voltar ao Carro 3D'; backToCar.title = 'Voltar à pilotagem 3D';
backToCar.addEventListener('click', () => document.querySelector('#enter-world').click());
document.body.append(backToCar);
quickView.append(quickFirstPerson, quickMap, quickFullscreen, exit3dButton); document.querySelector('.world-shell').append(quickView);
function lockScroll(on) {
  const root = document.documentElement;
  // Ao entrar, alinha o mundo ao topo da janela (sem animação): com a página travada a HUD inferior só aparece inteira assim.
  if (on && !root.classList.contains('mode-3d')) {
    const top = sceneSection.getBoundingClientRect().top;
    if (Math.abs(top) > 1) window.scrollTo({ top: window.scrollY + top, behavior: 'instant' });
  }
  root.classList.toggle('mode-3d', on); exit3dButton.hidden = !on; backToCar.hidden = on || !entered;
}
function exit3d(target) {
  if (!document.documentElement.classList.contains('mode-3d')) return;
  lockScroll(false); stop(); hideTip();
  if (target && target.length > 1) document.querySelector(target)?.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
}
exit3dButton.addEventListener('click', () => exit3d('#eras'));
// Esc por pilha de prioridade (src/escape-stack.js): modal > minigame > mapa > painel > jogo.
// Fase de captura na janela: o item de cima recebe o Esc e os de baixo não veem a tecla.
const MINIGAME_DIALOGS = new Set(['arcade-dialog', 'piano-dialog']);
// Pilha dos diálogos abertos, na ordem em que abriram: o último aberto é o de cima e recebe o Esc.
const dialogStack = [];
const topDialog = () => dialogStack.filter(d => d.open && d.localName === 'dialog').pop();
const escapeLayers = {
  open: () => {
    const top = topDialog();
    return {
      modal: Boolean(top) && !MINIGAME_DIALOGS.has(top.id),
      minigame: Boolean(top) && MINIGAME_DIALOGS.has(top.id),
      map: Boolean(fullMapOverlay && !fullMapOverlay.hidden),
      panel: radioFocused || hudMenus.some(([, menu]) => !menu.hidden),
      game: document.documentElement.classList.contains('mode-3d'),
    };
  },
  close: {
    modal: () => { const top = topDialog(); if (top && !MINIGAME_DIALOGS.has(top.id)) top.close(); },
    minigame: () => { const top = topDialog(); if (top && MINIGAME_DIALOGS.has(top.id)) top.close(); },
    map: () => toggleFullMap(false),
    panel: () => { const menu = hudMenus.find(([, item]) => !item.hidden); if (radioFocused) focusRadio(false); toggleHudMenu(null); menu?.[0].focus(); focusWorld(); },
    game: () => exit3d('#eras'),
  },
};
window.addEventListener('keydown', event => handleEscape(event, escapeLayers), true);
// Em tela cheia, o Esc só chega à página com o bloqueio de teclado: enquanto há diálogo aberto, o bloqueio fica ligado.
new MutationObserver(records => {
  for (const { target } of records) {
    if (target.localName !== 'dialog') continue; // <details open> do arquivo de eras não é diálogo e não tem close()
    const at = dialogStack.indexOf(target);
    if (target.open && at < 0) dialogStack.push(target);
    if (!target.open && at >= 0) dialogStack.splice(at, 1);
  }
  const any = dialogStack.length > 0;
  if (any && document.fullscreenElement) navigator.keyboard?.lock?.(['Escape']).catch(() => {});
  else if (!any) navigator.keyboard?.unlock?.();
}).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
document.addEventListener('click', event => {
  const link = event.target.closest?.('a[href^="#"]');
  if (link && !sceneSection.contains(link)) exit3d(link.getAttribute('href'));
}, true);
quickFirstPerson.addEventListener('click', () => document.querySelector('#first-person').click());
quickFullscreen.addEventListener('click', () => fullscreenButton.click());
document.addEventListener('fullscreenchange', () => { quickFullscreen.textContent = document.fullscreenElement === sceneSection ? '× Sair da tela cheia · F' : '⛶ Tela cheia · F'; });
const cockpit = document.querySelector('#cockpit');
let radioFocused = false;
const consoleFocus = document.querySelector('#console-focus');
function focusRadio(value) {
  radioFocused = firstPerson && value;
  world?.setInteraction(radioFocused);
  consoleFocus.setAttribute('aria-pressed',String(radioFocused));
  consoleFocus.textContent = radioFocused ? 'Esc · Voltar à estrada' : 'R · Sintonizar';
}
consoleFocus.onclick = () => { focusRadio(!radioFocused); focusWorld(); };
document.querySelector('#cabin-recenter')?.addEventListener('click', () => { focusRadio(false); world?.recenter(); focusWorld(); });
const fullMapOverlay = document.querySelector('#full-map-overlay');
const mapOpenBtn = document.querySelector('#map-open');
function toggleFullMap(force) {
  if (!fullMapOverlay) return;
  const open = typeof force === 'boolean' ? force : fullMapOverlay.hidden;
  if (open) onboarding.markUsed('map');
  if (open) { enterWorld(); stop(); toggleHudMenu(null); }
  fullMapOverlay.hidden = !open;
  sceneSection.classList.toggle('full-map-open', open);
  mapOpenBtn?.setAttribute('aria-expanded', String(open));
  quickMap.setAttribute('aria-expanded', String(open));
  quickMap.setAttribute('aria-pressed', String(open));
  if (open) document.querySelector('#full-map-close')?.focus({ preventScroll: true });
  else focusWorld();
}
mapOpenBtn?.addEventListener('click', () => toggleFullMap());
quickMap.addEventListener('click', () => toggleFullMap());
document.querySelector('#full-map-close')?.addEventListener('click', () => toggleFullMap(false));
fullMapOverlay?.addEventListener('pointerdown', event => { if (event.target === fullMapOverlay) toggleFullMap(false); });
for (const slider of cockpit.querySelectorAll('input')) slider.oninput = () => {
  world?.configureLook(Number(document.querySelector('#look-gain').value), Number(document.querySelector('#motion-gain').value));
};
document.querySelector('#first-person').addEventListener('click', () => {
  if (!worldAvailable) return;
  enterWorld(); firstPerson = !firstPerson; overview = landmarkView = false;
  setShowcase(false); world.setFirstPerson(firstPerson); syncCameraModes(); focusWorld();
  if (!reducedMotion.matches) document.querySelector('#world canvas')?.animate([{opacity:.45},{opacity:1}],{duration:220});
});
document.addEventListener('keydown', event => {
  if (!worldVisible || modalOpen() || event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key.toLowerCase();
  if (event.target.closest('input,select,textarea,[contenteditable]')) return;
  if (key === 'm') { event.preventDefault(); toggleFullMap(); return; }
  if (!entered) return;
  if (key === '[') { event.preventDefault(); localRadio.actions.prev(); announce(`Kong FM: ${localRadio.read().name}`); return; }
  if (key === ']') { event.preventDefault(); localRadio.actions.next(); announce(`Kong FM: ${localRadio.read().name}`); return; }
  if (!worldAvailable) return;
  if (key === 'v') document.querySelector('#first-person').click();
  if (key === 'f') fullscreenButton.click();
  if (firstPerson && key === 'r') consoleFocus.click();
  if (firstPerson && key === 'c') { focusRadio(false); world.recenter(); }
});
document.querySelector('#zoom-in').addEventListener('click', () => world?.zoomBy(-.15));
document.querySelector('#zoom-out').addEventListener('click', () => world?.zoomBy(.15));
document.querySelector('#reset-camera').addEventListener('click', () => { world?.resetCamera(); resetViewControls(); });
document.querySelector('#overview-toggle').addEventListener('click', () => { firstPerson = false; world?.setFirstPerson(false); cockpit.hidden = true; input.setWheelSteer(0); document.querySelector('#first-person').setAttribute('aria-pressed','false'); overview = !overview; landmarkView = false; world?.setOverview(overview); syncCameraModes(); });
document.querySelector('#windmill-focus').addEventListener('click', () => { enterWorld(); stop(); firstPerson = false; world?.setFirstPerson(false); cockpit.hidden = true; input.setWheelSteer(0); document.querySelector('#first-person').setAttribute('aria-pressed','false'); landmarkView = !landmarkView; overview = false; world?.focusWindmill(landmarkView); syncCameraModes(); });
document.querySelector('#read-chapter').addEventListener('click', () => { document.querySelector('#paradas').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); document.querySelector('#panel').focus({preventScroll:true}); });

const actors = members.map((member, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'person'; button.style.left = `${member.position * 100}%`;
  button.setAttribute('aria-label', `Abrir ficha de ${member.name}`); button.innerHTML = `${portrait(member, index)}<span>${member.name}</span>`;
  button.addEventListener('click', () => openMember(index)); document.querySelector('#characters').append(button); return button;
});
function openMember(index) {
  if (modalOpen()) return;
  stop(); previousFocus = document.activeElement;
  const member = members[index]; dialog.dataset.collision = 'false';
  document.querySelector('#portrait').innerHTML = memberPhoto(index);
  document.querySelector('#portrait img').addEventListener('error', () => { document.querySelector('#portrait').innerHTML = portrait(member, index); }, {once:true});
  document.querySelector('#character-name').textContent = member.name;
  document.querySelector('#character-role').textContent = member.role;
  document.querySelector('#character-description').textContent = member.description;
  document.querySelector('#character-song').textContent = member.song;
  document.querySelector('#character-detail').textContent = member.detail;
  setTrack(tracks.findIndex(track => track.id === member.track)); manualTrack = true;
  document.querySelector('#character-listen').href = listeningUrl(tracks[trackIndex]);
  document.querySelector('#character-piano').hidden = index !== 0; // minigame de piano: só no modal do 2-D (teclado)
  memberView.show(index); // 360°: carrega o integrante sob demanda (lazy); falha mantém o retrato
  discovered.add(index); actors[index].classList.add('discovered'); persistJourney();
  document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
  announce(`${member.name} encontrado. ${discovered.size} de 4 personagens.`);
  dialog.style.setProperty('--place', MEMBER_ACCENTS[index]);
  dialog.showModal(); dialog.querySelector('.close').focus();
}
dialog.querySelector('.close').addEventListener('click', () => dialog.close());
dialog.querySelector('.return').addEventListener('click', () => dialog.close());
function restoreFocus() {
  // The vehicle stopped when the dialog opened. A delayed native close event
  // must not clear a new driving command pressed after the dialog disappeared.
  accumulator = 0; lastTime = performance.now();
  if (previousFocus?.isConnected && !previousFocus.hidden && !previousFocus.disabled) previousFocus.focus({preventScroll:true});
  else focusWorld();
}
dialog.addEventListener('close', restoreFocus);

function openDiscovery(index, collect = true) {
  if (modalOpen()) return;
  stop(); previousFocus = document.activeElement; const point = DISCOVERIES[index];
  const fresh = collect && journal.discover(point.id);
  // A ficha leva a cor do bairro onde a história está e diz em que ponto do percurso ela fica.
  const place = CITY_ERAS[eraAt(point)]; discoveryDialog.style.setProperty('--place', place.color);
  document.querySelector('#discovery-kind').textContent = `HISTÓRIA ${index + 1} DE ${DISCOVERIES.length} · ${point.kind} / ${point.label} · ATO ${place.act}`;
  document.querySelector('#discovery-title').textContent = point.title;
  // Texto revisado (roadDiscoveryLore) e moldura .dialog-poster com a capa do álbum relacionado.
  const lore = roadDiscoveryLore[point.id];
  document.querySelector('#discovery-text').textContent = lore?.text ?? point.text;
  document.querySelector('#discovery-detail').textContent = lore?.detail ?? point.detail;
  const artCredit = document.querySelector('#discovery-art-credit'); const credit = creditLine(artForDiscovery(artManifest, point.id));
  artCredit.textContent = credit; artCredit.hidden = !credit;
  let dialogPoster = discoveryDialog.querySelector('.dialog-poster');
  if (!dialogPoster) { dialogPoster = document.createElement('div'); dialogPoster.className = 'dialog-poster'; dialogPoster.append(document.createElement('small')); discoveryDialog.querySelector('.close').after(dialogPoster); }
  dialogPoster.hidden = !lore?.cover;
  if (lore?.cover) { dialogPoster.style.setProperty('--dialog-cover', `url('${new URL(lore.cover, document.baseURI).href}')`); dialogPoster.querySelector('small').textContent = lore.coverCredit; }
  document.querySelector('#discovery-source').href = point.source;
  document.querySelector('#discovery-saved').textContent = journal.known.has(point.id) ? (fresh ? '✓ Nova descoberta salva no seu diário.' : '✓ Esta história já está no seu diário.') : 'Consulta livre. Encontre este lugar no mundo para registrar a descoberta.';
  // Fecho do percurso: na quinta descoberta, a ficha resume o caminho e aponta os próximos passos.
  const complete = fresh && journal.known.size === DISCOVERIES.length;
  discoveryFinale.hidden = !complete;
  setTrack(point.track); updateJournal(); discoveryDialog.showModal(); discoveryDialog.querySelector('.close').focus();
  if (complete) announce(`Percurso completo: você encontrou as ${DISCOVERIES.length} descobertas. O diário guarda todas elas.`);
  else if (fresh) announce(`Nova descoberta: ${point.title}. ${journal.known.size} de ${DISCOVERIES.length} descobertas.`);
}
const discoveryFinale = document.createElement('div');
discoveryFinale.id = 'discovery-finale'; discoveryFinale.hidden = true;
discoveryFinale.innerHTML = '<p class="eyebrow">PERCURSO COMPLETO / 5 DE 5</p><p>Você passou pela criação da banda, pelos quatro integrantes, pela mistura de gêneros, por Demon Days e pelo palco. O diário guarda as cinco histórias neste navegador.</p><div class="finale-actions"><button type="button" id="finale-journal">Abrir o diário</button><button type="button" id="finale-eras">Ler a história em oito eras</button></div>';
document.querySelector('#discovery-saved').after(discoveryFinale);
// As ações rodam depois do evento close, quando o foco já voltou ao mundo.
const afterDiscovery = action => { discoveryDialog.addEventListener('close', action, { once: true }); discoveryDialog.close(); };
discoveryFinale.querySelector('#finale-journal').addEventListener('click', () => afterDiscovery(() => document.querySelector('#journal-toggle').click()));
discoveryFinale.querySelector('#finale-eras').addEventListener('click', () => afterDiscovery(() => {
  const heading = document.querySelector('#eras-title'); heading.tabIndex = -1;
  document.querySelector('#eras').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' }); heading.focus({ preventScroll: true });
}));
const eraArchive = createEraArchive(document.querySelector('#era-archive'), point => {
  journalNextAction = () => startNavigation(point); journalDialog.close();
});
function interactionAtCar() {
  const nearby = nearbyInteraction(vehicle);
  if (nearby) return nearby;
  const index = archiveStops.findIndex(stop => distance(vehicle,stop) < 10);
  return index < 0 ? null : { ...archiveStops[index], type:'archive', index };
}
function interact() {
  if (modalOpen() || !entered) return;
  nearby = interactionAtCar();
  if (!nearby && arcadeNear()) { openArcade(); return; }
  if (nearby) onboarding.markUsed('explore');
  if (!nearby) return;
  if (Math.abs(vehicle.speed) >= 2) { announce('Reduza a velocidade para explorar este lugar.'); return; }
  const stopId = stopIdFor(nearby); // as 9 paradas contam ao abrir pelo E, com ou sem passeio
  if (stopId) recordStop(stopId);
  if (nearby.type === 'archive') {
    document.querySelector('#journal-toggle').click(); eraArchive.open(nearby.index); return;
  }
  if (nearby.type === 'member') openMember(nearby.index); else openDiscovery(nearby.index);
}
document.querySelector('#interact').addEventListener('click', interact);
discoveryDialog.querySelector('.close').addEventListener('click', () => discoveryDialog.close());
discoveryDialog.querySelector('.return').addEventListener('click', () => discoveryDialog.close());
discoveryDialog.addEventListener('close', restoreFocus);
let resetArmed = false, journalNextAction = null;
function updateJournal() {
  document.querySelector('#journal-count').textContent = `${journal.known.size} / ${DISCOVERIES.length}`;
  document.querySelector('#trip-distance').textContent = `DESCOBERTAS ${journal.known.size} / ${DISCOVERIES.length}`;
  document.querySelector('#trip-progress').style.width = `${journal.known.size / DISCOVERIES.length * 100}%`;
  const list = document.querySelector('#journal-list'); list.replaceChildren();
  DISCOVERIES.forEach((point, index) => {
    const known = journal.known.has(point.id); const item = document.createElement('li'); item.className = known ? 'found' : '';
    const title = document.createElement('h3'); title.textContent = known ? point.title : `? ${point.kind.toLowerCase()} a descobrir`;
    const region = document.createElement('p'); region.textContent = `Região: ${REGIONS[point.region].name} · Ato espacial: ${CITY_ERAS[eraAt(point)].act}`;
    const read = document.createElement('button'); read.type = 'button'; read.textContent = known ? 'Reler história ↗' : 'Consultar conteúdo ↗';
    read.addEventListener('click', () => { journalNextAction = () => openDiscovery(index, false); journalDialog.close(); }); item.append(title, region, read);
    if (known) { const go = document.createElement('button'); go.type = 'button'; go.textContent = 'Visitar lugar →'; go.addEventListener('click', () => { journalNextAction = () => startNavigation(point); journalDialog.close(); }); item.append(go); }
    list.append(item);
  });
}
document.querySelector('#journal-toggle').addEventListener('click', () => {
  stop(); previousFocus = document.activeElement; updateJournal(); resetArmed = false; document.querySelector('#reset-journal').textContent = 'Reiniciar diário'; journalDialog.showModal(); journalDialog.querySelector('.close').focus();
});
journalDialog.querySelector('.close').addEventListener('click', () => journalDialog.close());
journalDialog.addEventListener('close', () => {
  resetArmed = false; resetJourneyArmed = false;
  document.querySelector('#reset-journey').textContent = 'Reiniciar posição e integrantes';
  restoreFocus(); const next = journalNextAction; journalNextAction = null; next?.();
});
document.querySelector('#reset-journal').addEventListener('click', event => {
  if (!resetArmed) { resetArmed = true; event.currentTarget.textContent = 'Confirmar: apagar descobertas'; return; }
  journal.reset(); resetArmed = false; event.currentTarget.textContent = 'Reiniciar diário'; updateJournal(); announce('Diário reiniciado.');
});
const map = document.querySelector('#world-map');
const buildMapSvgContent = (carId, detailed = false) =>
  `<rect x="-140" y="-200" width="280" height="250" rx="22" fill="#182723" stroke="#c4dc9d33" stroke-width="1.5"/>` +
  CITY_LOTS.map(l => `<rect x="${-l.w/2}" y="${-l.d/2}" width="${l.w}" height="${l.d}" fill="${CITY_ERAS[l.era].color}" fill-opacity="${detailed ? '.55' : '.48'}" transform="translate(${l.x.toFixed(1)} ${l.z.toFixed(1)}) rotate(${(-l.rotation*180/Math.PI).toFixed(1)})"/>`).join('') +
  ROADS.map(r => `<polyline points="${r.samples.map(p => `${p.x},${p.z}`).join(' ')}" fill="none" stroke="#111817" stroke-width="${r.width*.56}" stroke-linecap="round"/><polyline points="${r.samples.map(p => `${p.x},${p.z}`).join(' ')}" fill="none" stroke="#e9e4d480" stroke-width="${r.width*.42}" stroke-linecap="round"/>`).join('') +
  ERA_GATES.map(g => `<g class="map-gate"><circle cx="${g.x.toFixed(1)}" cy="${g.z.toFixed(1)}" r="${detailed ? 5.2 : 4.2}" fill="#111415" stroke="${CITY_ERAS[g.era].color}" stroke-width="1.4"/><text x="${g.x.toFixed(1)}" y="${(g.z+2.1).toFixed(1)}" text-anchor="middle" fill="${CITY_ERAS[g.era].color}" font-size="${detailed ? 5.8 : 5.2}" font-weight="bold">${CITY_ERAS[g.era].act}</text></g>`).join('') +
  REGIONS.map((r, i) => { const [lx, ly] = [[0, 26], [-102, -164], [88, -164]][i] || [r.x, r.z]; return `<text class="map-region-label" x="${lx}" y="${ly}" text-anchor="middle" fill="${r.color}" stroke="#0b1314" stroke-width="${detailed ? 3.2 : 2.6}" stroke-linejoin="round" paint-order="stroke" font-size="${detailed ? 8.5 : 7.5}" font-weight="bold">${['KONG STUDIOS', 'BAIRRO DOS MURAIS', 'MIRANTE DO MOINHO'][i].split(' ')[0]}</text>`; }).join('') +
  DISCOVERIES.map((d, i) => `<g data-map-poi="${d.id}"><title>${d.title}</title><circle cx="${d.x}" cy="${d.z}" r="${detailed ? 5.6 : 4.6}" fill="#f5a9c6" stroke="#111415" stroke-width="1.3"/>${detailed ? `<text x="${d.x}" y="${d.z + 2}" text-anchor="middle" fill="#111415" font-size="5.2" font-weight="bold">${i + 1}</text>` : ''}</g>`).join('') +
  MEMBER_LOCATIONS.map((m, i) => `<g data-map-member="${i}"><title>${['2-D','Murdoc','Noodle','Russel'][i]}</title><rect x="${m.x-3.5}" y="${m.z-3.5}" width="7" height="7" rx="1.4" transform="rotate(45 ${m.x} ${m.z})" fill="${MEMBER_ACCENTS[i]}" stroke="#111415" stroke-width="1.2"/></g>`).join('') +
  `<g id="${carId}"><circle r="10.5" fill="#d2e2a82e" stroke="#d2e2a888" stroke-width=".9"/><path d="M0 -8 5.8 5.8 0 3.2 -5.8 5.8Z" fill="#d2e2a8" stroke="#111415" stroke-width="1.4"/></g>`;
map.innerHTML = buildMapSvgContent('map-car', false);
const fullWorldMap = document.querySelector('#full-world-map');
if (fullWorldMap) fullWorldMap.innerHTML = buildMapSvgContent('full-map-car', true);
const fullMapDestContainer = document.querySelector('#full-map-destinations');
if (fullMapDestContainer) {
  const makeGroup = (heading, items) => {
    const section = document.createElement('div'); section.className = 'full-map-group';
    const h = document.createElement('h3'); h.textContent = heading; section.append(h);
    for (const item of items) {
      const btn = document.createElement('button'); btn.type = 'button';
      btn.innerHTML = `<span class="dest-tag" style="--tag:${item.color}">${item.tag}</span><strong>${item.title}</strong><small>${item.sub}</small>`;
      btn.addEventListener('click', () => { toggleFullMap(false); startNavigation(item.target); });
      section.append(btn);
    }
    fullMapDestContainer.append(section);
  };
  makeGroup('Regiões Principais (3)', REGIONS.map((r, i) => ({
    tag: `R${i + 1}`, color: r.color, title: r.name, sub: `Ato ${CITY_ERAS[eraAt(r)].act} · Clique para ir`, target: { x: r.x, z: r.z, title: r.name, region: i },
  })));
  makeGroup('Histórias & Descobertas (5)', DISCOVERIES.map((d, i) => ({
    tag: `H${i + 1}`, color: '#f5a9c6', title: d.title, sub: `${d.kind} · ${REGIONS[d.region].name}`, target: d,
  })));
  makeGroup('Integrantes Phase 7 (4)', members.map((m, i) => ({
    tag: m.name[0], color: MEMBER_ACCENTS[i], title: m.name, sub: `${m.role} · ${m.song}`, target: { ...MEMBER_LOCATIONS[i], title: m.name, region: regionAt(MEMBER_LOCATIONS[i]) },
  })));
}
// Mundo 3D com diagnóstico: tenta de novo sozinho e, se falhar, mostra o motivo real e um botão para tentar de novo.
const worldLoader = createWorldLoader({
  importScene: () => import('./scene.js'),
  reset: () => document.querySelector('#world').replaceChildren(),
  onStatus: text => { document.querySelector('#render-status').textContent = text; },
  mount: ({ createWorld }) => {
    world = createWorld(document.querySelector('#world'), index => {
      if (showcase || distance(vehicle, MEMBER_LOCATIONS[index]) < 13 && Math.abs(vehicle.speed) < 2) openMember(index);
      else announce('Aproxime-se e reduza a velocidade para conhecer este integrante.');
    }, {
      onViewReset: resetViewControls,
      onFullscreen: () => fullscreenButton.click(),
      onExplore: () => interact(),
      radio: localRadio, onSteer: value => input.setWheelSteer(value),
      onRadio(action) {
        if (action === 'playlist') { toggleHudMenu(radioMenu); localRadio.playlist.focus(); }
        else localRadio.actions[action]?.();
      },
      onLost() {
        stop(); worldAvailable = false;
        document.querySelector('.world-shell').classList.remove('has-3d'); document.querySelector('.world-shell').classList.add('map-only');
        document.querySelector('#render-status').textContent = 'MODO 2D / 3D TEMPORARIAMENTE INDISPONÍVEL';
        document.querySelector('#world-map').focus({preventScroll:true});
      },
      onRestored() {
        worldAvailable = true; document.querySelector('.world-shell').classList.add('has-3d'); document.querySelector('.world-shell').classList.remove('map-only');
        document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL'; focusWorld();
      },
    });
    worldAvailable = true; world.setIntro(!entered);
    // ?perf expõe a cena para medições (scripts/ e console); não altera a experiência.
    if (new URLSearchParams(location.search).has('perf')) window.__gorilazz = { world, vehicle, trees: TREE_LOCATIONS, known: journal.known, arcade: arcadeScreen, piano: pianoScreen, openMember, memberView, guided: () => guided, stopProgress, tourStops, startGuided, takeOver };
    document.querySelector('.world-shell').classList.add('has-3d');
    document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL';
    return world;
  },
  onReady: () => hideWorldFailure(),
  onFail: error => showWorldFailure(error),
});
document.querySelector('#world-retry').addEventListener('click', () => worldLoader.run());
worldLoader.run();
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

function frame(time) {
  // Agenda o próximo quadro antes do trabalho: um erro isolado não congela o loop 3D.
  requestAnimationFrame(frame);
  try { updateFrame(time); } catch (error) { console.error('Quadro ignorado:', error); }
}
function updateFrame(time) {
  const delta = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .1); lastTime = time;
  const paused = modalOpen() || document.hidden || !worldVisible;
  if (entered && !paused) {
    accumulator = Math.min(accumulator + delta, .1);
    while (accumulator >= 1 / 120) {
      let controls = input.read();
      if (guided && !guided.paused && !controls.active) controls = guidedControls();
      else if (destination && !controls.active) {
        controls = navigationInput(vehicle, destination);
        if (controls.arrived) { const title = destination.target.title; stop(); announce(`Você chegou: ${title}. Pressione E para explorar.`); break; }
      }
      stepVehicle(vehicle, controls, 1 / 120); accumulator -= 1 / 120;
    }
  } else accumulator = 0;
  if (time - lastHudTime >= 80) {
  lastHudTime = time;
  let region = regionAt(vehicle);
  if (currentRegion >= 0 && region !== currentRegion && distance(vehicle, REGIONS[region]) + 8 >= distance(vehicle, REGIONS[currentRegion])) region = currentRegion;
  const district = eraAt(vehicle);
  if (district !== currentDistrict && region === currentRegion) {
    currentDistrict = district; const era = CITY_ERAS[district];
    document.querySelector('#scene-label').textContent = `${REGIONS[region].name.toUpperCase()} · ATO ${era.act} · ${era.title.toUpperCase()} (${era.years})`;
    if (entered) document.querySelector('#announcement').textContent = `Ato ${era.act}: ${era.title}, ${era.years}. ${era.summary}`;
  }
  if (region !== currentRegion) {
    currentRegion = region; currentDistrict = eraAt(vehicle); const era = CITY_ERAS[currentDistrict];
    document.querySelector('#scene-label').textContent = `${REGIONS[region].name.toUpperCase()} · ATO ${era.act} · ${era.title.toUpperCase()} (${era.years})`;
    document.querySelector('#region-name').textContent = REGIONS[region].name; if (!manualTrack) setTrack(REGIONS[region].track);
  }
  nearby = interactionAtCar();
  const interaction = document.querySelector('#interact');
  interaction.hidden = !nearby || !entered || paused;
  if (!nearby && entered && !paused && arcadeNear()) { interaction.hidden = false; interaction.disabled = false; interaction.textContent = 'E / JOGAR FLIPERAMA'; }
  if (nearby) { interaction.disabled = Math.abs(vehicle.speed) >= 2; interaction.textContent = interaction.disabled ? `Reduza para explorar · ${nearby.title}` : nearby.type === 'discovery' ? `[E] Ler História Completa — ${nearby.title}` : `E / EXPLORAR — ${nearby.title}`; }
  const ranked = rankByProximity(vehicle, DISCOVERIES, journal.known);
  const topHint = ! journal.known || journal.known.size >= DISCOVERIES.length
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
  const carTransform = `translate(${vehicle.x},${vehicle.z}) rotate(${-vehicle.heading * 180 / Math.PI})`;
  document.querySelector('#map-car').setAttribute('transform', carTransform);
  document.querySelector('#full-map-car')?.setAttribute('transform', carTransform);
  for (const svg of [map, fullWorldMap].filter(Boolean)) {
    for (const point of DISCOVERIES) {
      const marker = svg.querySelector(`[data-map-poi="${point.id}"]`);
      if (!marker) continue;
      const found = journal.known.has(point.id);
      marker.style.opacity = svg === fullWorldMap || destination?.target === point || found ? '1' : distance(vehicle, point) < 75 ? '.9' : '.68';
      marker.querySelector('circle').setAttribute('fill', found ? '#d2e2a8' : '#f5a9c6');
    }
  }
  const moving = Math.abs(vehicle.speed) > .1;
  document.querySelector('#radio').classList.toggle('playing', moving && !reducedMotion.matches && !paused);
  // Zoom dinâmico do minimapa: adapta o alcance suavemente à velocidade do Geep.
  const speedRatio = Math.min(1, Math.abs(vehicle.speed) / 22);
  const targetSpanW = mapZoomed ? 112 + speedRatio * 48 : 184 + speedRatio * 68;
  smoothMapSpanW += (targetSpanW - smoothMapSpanW) * .22;
  const spanW = Math.round(smoothMapSpanW), spanH = Math.round(spanW * (260 / 290));
  const minVX = Math.max(-145, Math.min(145 - spanW, vehicle.x - spanW / 2));
  const minVZ = Math.max(-205, Math.min(55 - spanH, vehicle.z - spanH / 2));
  map.setAttribute('viewBox', `${minVX.toFixed(1)} ${minVZ.toFixed(1)} ${spanW} ${spanH}`);
  const zoomLabel = document.querySelector('#map-zoom-label');
  if (zoomLabel) zoomLabel.textContent = mapZoomed ? 'ZOOM +' : moving ? `${speed} KM/H` : 'AUTO';
  const fullCoords = document.querySelector('#full-map-coords');
  if (fullCoords) fullCoords.textContent = `${REGIONS[region].name} · Ato ${CITY_ERAS[eraAt(vehicle)].act} · Kong FM: ${localRadio.read().name}`;
  const state = modalOpen() || !fullMapOverlay?.hidden || sceneSection.classList.contains('menu-open') ? 'menu' : overview || landmarkView ? 'exploring' : moving ? 'driving' : 'stopped';
  if (sceneSection.dataset.hudState !== state) sceneSection.dataset.hudState = state;
  document.querySelector('#dial-value').style.strokeDasharray = `${Math.min(speed/110,1)*76} 100`;
  if (lastRoute !== destination || lastRouteIndex !== destination?.index) {
    const pts = destination ? [vehicle,...destination.points.slice(destination.index)].map(p => `${p.x},${p.z}`).join(' ') : '';
    routeLine.setAttribute('points', pts);
    fullRouteLine?.setAttribute('points', pts);
    lastRoute = destination;
    lastRouteIndex = destination?.index;
  }
  updateTelemetry();
  }
  const moving = Math.abs(vehicle.speed) > .1;
  const renderInterval = window.innerWidth <= 700 ? 1000/30 : 1000/60;
  // Com o fliperama aberto, só a câmera continua atualizando (a física fica parada): ela foca a tela do gabinete.
  const renderable = !paused || (cameraFocus && worldVisible && !document.hidden);
  if (world && worldAvailable && renderable && time-lastRenderTime+.5 >= renderInterval) {
    world.update(vehicle, time, orbital, reducedMotion.matches, showcase, journal.known, nearby); lastRenderTime = time;
  }
  if (moving && !paused && time-lastSavedTime > 1500) { persistJourney(); lastSavedTime = time; }
}
requestAnimationFrame(frame);
const stops = [
  ['Início', 'Siga o som.', '<p>Uma banda virtual reúne personagens, músicos reais, animação e colaboração. Esta viagem apresenta oito eras entre 1998 e 2023, vistas por nove paradas temáticas.</p><p>Use W/S para acelerar e frear, A/D para virar ou os pedais na tela. Escolha ruas e atalhos. Reduza e pressione E para explorar um lugar ou conhecer um integrante. Todas as informações também estão nos menus, sem precisar dirigir.</p><p>A câmera pode girar por arraste; a vista aérea revela o mundo aberto. O progresso fica salvo quando o armazenamento deste navegador está disponível e pode ser reiniciado pelo botão da estrada.</p>', 'Explore o mundo ou explore o conteúdo pelos menus. Todas as fichas estão sempre disponíveis.'],
  ['História', 'Do desenho ao primeiro disco.', '<p>Gorillaz surgiu em 1998, a partir da colaboração entre Damon Albarn e Jamie Hewlett. A música e a identidade visual foram pensadas juntas, com os quatro integrantes virtuais como parte de uma narrativa em expansão.</p><p>O EP Tomorrow Comes Today apareceu em 2000. Em 2001, o álbum Gorillaz apresentou uma mistura de rock, hip-hop, dub e eletrônica, com Clint Eastwood e 19-2000 entre as entradas mais conhecidas para esse universo.</p><p>A história real é a dos artistas, gravações, lançamentos e shows. Na ficção, 2-D, Murdoc, Noodle e Russel vivem suas próprias histórias. <a href="#eras">A linha do tempo separa essas camadas em cada era ↗</a>.</p>', '1998. Albarn e Hewlett começam um projeto em que som, imagem e ficção caminham juntos.'],
  ['Personagens', 'Quatro rostos. Muitas histórias.', '<p>Os integrantes virtuais têm funções, personalidades e trajetórias próprias. A obra é realizada por artistas reais e muitos colaboradores. Nas fichas, as duas camadas aparecem separadas.</p><div class="cards">' + members.map((member, index) => `<button type="button" data-member="${index}">${member.name} ↗</button>`).join('') + '</div><p>As figuras 3D desta experiência são da Phase 7. Elas permanecem as mesmas ao visitar eras anteriores; não representam todos os visuais históricos de cada personagem.</p>', 'Conheça os integrantes virtuais e a relação deles com quem faz a música fora da tela.'],
  ['Identidade', 'A identidade está no encontro.', '<div class="genre-tags"><span>ROCK</span><span>HIP-HOP</span><span>DUB</span><span>ELETRÔNICA</span><span>POP</span></div><p>Gorillaz não depende de um único gênero para ser reconhecível. A voz de Albarn, o desenho de Hewlett, os convidados e a construção audiovisual dão continuidade a trabalhos musicalmente diferentes.</p><p>Capas, clipes e personagens ampliam as músicas. As colaborações fazem parte do processo: de Del the Funky Homosapien e De La Soul a Bobby Womack, Little Dragon e Thundercat, diferentes encontros mudam a paisagem de cada disco.</p>', 'Música, desenho e colaboração constroem uma identidade que muda de forma sem perder o fio.'],
  ['Álbuns', 'Oito discos. Oito portas.', '<div class="album-guide">' + eras.map((era, index) => `<article><span>${era.label}</span><h4>${era.album}</h4><p>${era.title}</p><button type="button" data-era="${index}">LER ESTA ERA ↗</button></article>`).join('') + '</div><p class="editorial-note">Recorte de oito álbuns até 2023. The Fall tem lançamento digital em 2010 e edição física em 2011. EPs, compilações e lançamentos posteriores ficam fora desta seleção.</p>', 'Escolha um disco para conhecer seu contexto e uma sugestão de escuta.'],
  ['Ao vivo', 'Quando o universo encontra o palco.', '<p>Os shows de Gorillaz reúnem músicos reais, vocalistas e convidados. Imagens e projeções conectam o palco aos integrantes virtuais, em formatos que variam entre apresentações e turnês.</p><p>Essa passagem para o palco evidencia a dimensão coletiva do projeto: os personagens dão unidade ao universo visual, enquanto uma equipe de artistas transforma as gravações em performance.</p>', 'Músicos reais, convidados e imagens colocam o universo virtual em contato com o público.'],
  ['Temas', 'O mundo no retrovisor.', '<div class="theme-grid"><article><h4>Solidão e cidade</h4><p>Tomorrow Comes Today oferece uma escuta para a melancolia e a vida urbana.</p></article><article><h4>Consumo e mídia</h4><p>A torre e o moinho de Feel Good Inc. permitem discutir isolamento, aparência e liberdade.</p></article><article><h4>Ambiente e descarte</h4><p>Plastic Beach transforma uma ilha de detritos em cenário. É uma porta para conversar sobre consumo e meio ambiente.</p></article><article><h4>Crença e imagem</h4><p>Cracker Island trabalha uma narrativa de cultos e rituais numa Los Angeles ficcional.</p></article></div><p class="editorial-note">São leituras propostas por este projeto. Uma canção ou imagem pode permitir interpretações diferentes; os temas não explicam sozinhos toda a obra.</p>', 'Uma proposta de leitura sobre cidade, consumo, meio ambiente e as imagens em que escolhemos acreditar.'],
  ['Projeto', 'Uma estrada feita por nós.', '<p>Projeto acadêmico de <strong>Eduardo Alves Xavier</strong>, <strong>Gedson de Souza Mancio Júnior</strong> e <strong>Rafael Machado Colnaghi</strong>.</p><p>O mundo aberto conecta descobertas e permite consultar oito eras e nove pontos de vista sobre a banda. As cores das eras e o moinho são interpretações do projeto. O Geep aproxima a viagem da iconografia de 19-2000; o moinho remete à ideia visual de Feel Good Inc.</p><p>Os modelos Phase 7 foram publicados por Redtricity, que os atribui ao Gorillaz, com CC BY 4.0 indicada na fonte. O Geep é de shabaev, sob CC BY 4.0. <a href="#backstage">Créditos, arquivos e adaptações estão nos bastidores ↗</a>.</p>', 'Uma experiência acadêmica que usa a estrada para conectar música, contexto e personagens.'],
  ['Fontes', 'A viagem continua na pesquisa.', '<p>Este percurso cobre 1998–2023. A seleção separa fatos da produção musical, a narrativa dos personagens e as interpretações do projeto.</p><ul class="history-sources">' + sources.map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a><p>${source.detail}</p></li>`).join('') + '</ul><p>Os links são referências para consulta e atualização. A atribuição dos arquivos 3D está nos <a href="#backstage">créditos e modelos</a>. Projeto acadêmico independente, sem vínculo oficial com Gorillaz.</p>', 'Consulte as fontes e os créditos. História real, ficção e interpretações estão identificadas no percurso.'],
];
const menu = document.querySelector('#stop-menu');
const panel = document.querySelector('#panel');
function selectStop(index) {
  document.querySelectorAll('#chapter-dock button').forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  document.querySelector('#chapter-title').textContent = stops[index][1];
  [...menu.children].forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  panel.setAttribute('aria-labelledby', `stop-${index}`);
  // Cabeçalho em cartaz (Anton sobre a capa oficial) com os textos curados de thematicStops.
  const poster = thematicStops[index];
  // URL absoluta: o CSS resolveria ./assets a partir de src/ e geraria 404.
  panel.innerHTML = `<header class="stop-poster" style="--stop-cover:url('${new URL(poster.cover, document.baseURI).href}');--stop-accent:${poster.accent}"><span class="stop-poster-kicker">${poster.kicker}</span><h3 class="stop-poster-title">${poster.title}</h3><p class="stop-poster-credit">${poster.coverCredit}</p></header><p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</p><p class="stop-summary">${poster.summary}</p><div class="stop-layer-chips" aria-label="Camadas editoriais desta parada"><span class="layer-chip is-fact">FATO · HISTÓRIA REAL</span><span class="layer-chip is-fiction">FICÇÃO · NARRATIVA VIRTUAL</span><span class="layer-chip is-reading">INTERPRETAÇÃO · LEITURA DO PROJETO</span></div>${stops[index][2]}`;
  for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
  for (const button of panel.querySelectorAll('[data-era]')) button.addEventListener('click', () => { selectEra(Number(button.dataset.era)); document.querySelector('#eras').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); });
}
function selectEra(index, {automatic = false} = {}) {
  selectedEraIndex = (index + eras.length) % eras.length;
  if (!automatic) manualTrack = false;
  const era = eras[selectedEraIndex];
  document.querySelectorAll('#era-menu button, #era-strip button').forEach(button => { const siblings = [...button.parentElement.children]; button.setAttribute('aria-current', String(siblings.indexOf(button) === selectedEraIndex)); });
  document.querySelector('#era-panel').style.setProperty('--era-color', era.color);
  const counter = document.querySelector('#era-counter');
  if (counter) counter.textContent = `${String(selectedEraIndex + 1).padStart(2, '0')} / ${String(eras.length).padStart(2, '0')}`;
  document.querySelector('#era-kicker').textContent = `${era.label} / ${era.album.toUpperCase()}`;
  document.querySelector('#era-title').textContent = era.title;
  // Paginação: nas pontas, o botão fica desabilitado (sem dar a volta na lista).
  const nav = eraNavState(selectedEraIndex, eras.length);
  for (const [id, enabled] of [['#prev-era', nav.prev], ['#next-era', nav.next]]) {
    const button = document.querySelector(id); if (!button) continue;
    button.disabled = !enabled; button.setAttribute('aria-disabled', String(!enabled));
  }
  // O botão de explorar mostra o nome da parada que a era leva no mapa.
  const place = DISCOVERIES[discoveryIndexForEra(selectedEraIndex)];
  const driveButton = document.querySelector('#era-drive'); if (driveButton && place) driveButton.textContent = `EXPLORAR: ${place.title} ↗`;
  // Capa oficial do álbum (era.cover / coverAlt / coverCredit): moldura criada uma vez e atualizada a cada era.
  if (era.cover) {
    let frame = document.querySelector('#era-cover');
    if (!frame) {
      frame = document.createElement('figure'); frame.id = 'era-cover'; frame.className = 'era-cover-frame';
      const image = document.createElement('img'); image.className = 'era-cover-img'; image.width = 132; image.height = 132; image.decoding = 'async';
      const caption = document.createElement('figcaption'); caption.className = 'era-cover-caption';
      frame.append(image, caption);
      document.querySelector('#era-panel .era-columns')?.before(frame);
    }
    // A capa preenche o quadro: a mesma arte, borrada, vira o fundo; a nítida fica à esquerda. Troca com fade.
    const image = frame.querySelector('img'); const caption = frame.querySelector('figcaption');
    const coverUrl = new URL(era.cover, document.baseURI).href;
    frame.style.setProperty('--era-cover-url', `url("${coverUrl}")`);
    image.classList.remove('is-ready'); image.addEventListener('load', () => image.classList.add('is-ready'), { once: true });
    image.src = era.cover; image.alt = era.coverAlt ?? '';
    const kicker = document.createElement('span'); kicker.className = 'era-cover-kicker'; kicker.textContent = `${era.label} / ${era.album.toUpperCase()}`;
    const credit = document.createElement('span'); credit.className = 'era-cover-credit'; credit.textContent = era.coverCredit ?? '';
    caption.replaceChildren(kicker, credit);
    frame.hidden = false;
  } else document.querySelector('#era-cover')?.setAttribute('hidden', '');
  document.querySelector('#era-real').textContent = era.real;
  document.querySelector('#era-fiction').textContent = era.fiction;
  document.querySelector('#era-insight').textContent = era.insight;
  document.querySelector('#era-source-links').replaceChildren(...era.refs.map(id => {
    const source = sources.find(item => item.id === id); const link = document.createElement('a');
    link.href = source.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = `${source.label} ↗`; return link;
  }));
  if (!manualTrack) setTrack(tracks.findIndex(track => track.id === era.track));
}
stops.forEach(([name], index) => {
  const button = document.createElement('button'); button.type = 'button'; button.id = `stop-${index}`;
  button.setAttribute('aria-controls', 'panel'); button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${name.toUpperCase()}`;
  button.addEventListener('click', () => selectStop(index)); menu.append(button);
  const waypoint = document.createElement('button'); waypoint.type = 'button'; waypoint.textContent = String(index + 1).padStart(2, '0');
  waypoint.setAttribute('aria-label', `Consultar ${name}`); waypoint.addEventListener('click', () => { stop(); selectStop(index); document.querySelector('#paradas').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); });
  document.querySelector('#chapter-dock').append(waypoint);
});
selectStop(0);
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || modalOpen()) return;
  if (event.target.closest('input,select,textarea,button,a,[contenteditable]')) return;
  const index = numericShortcutIndex(event.key, stops.length);
  if (index < 0) return;
  event.preventDefault(); selectStop(index);
  menu.children[index].focus({preventScroll:true});
  document.querySelector('#paradas').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'});
});
let trackIndex = 0;
const trackQueue = document.querySelector('#track-queue');
if (trackQueue) {
  tracks.forEach((track, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span>${track.name}`;
    btn.addEventListener('click', () => { manualTrack = true; setTrack(i); });
    trackQueue.append(btn);
  });
}
function setTrack(index) {
  trackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  document.querySelector('#radio-title').textContent = track.name;
  document.querySelector('#track-album').textContent = `${track.album} · ${track.year}`;
  document.querySelector('#track-description').textContent = track.text;
  document.querySelector('#track-number').textContent = `${String(trackIndex + 1).padStart(2, '0')} — ${String(tracks.length).padStart(2, '0')}`;
  document.querySelector('#listen-link').href = listeningUrl(track);
  document.querySelector('#listen-link').textContent = track.video ? 'ABRIR NO YOUTUBE ↗' : 'BUSCAR NO YOUTUBE ↗';
  document.querySelector('#track-era').textContent = `NA VIAGEM / ${eras[track.era].album.toUpperCase()}`;
  document.querySelector('#track-status').textContent = track.video ? 'Clipe do YouTube nesta página. Precisa de internet e reprodução manual.' : 'Abre uma busca no YouTube em nova aba. Esta faixa não tem player incorporado.';
  const radioSection = document.querySelector('#radio');
  radioSection.style.setProperty('--record-color', track.color);
  radioSection.classList.remove('video-open');
  document.querySelector('#video-slot').replaceChildren();
  document.querySelector('#play-track').textContent = track.video ? '▶ VER CLIPE DO YOUTUBE' : 'BUSCAR NO YOUTUBE ↗';
  if (trackQueue) [...trackQueue.children].forEach((btn, i) => btn.setAttribute('aria-current', String(i === trackIndex)));
}
const localRadio = createLocalRadio({
  input: document.querySelector('#radio-files'), playButton: document.querySelector('#road-radio-play'),
  previousButton: document.querySelector('#road-radio-prev'), nextButton: document.querySelector('#road-radio-next'),
  title: document.querySelector('#road-radio-track'), album: document.querySelector('#road-radio-album'),
  status: document.querySelector('#road-radio-status'),
});
document.querySelector('#previous-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex - 1); });
document.querySelector('#next-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex + 1); });
document.querySelector('#play-track').addEventListener('click', () => {
  const slot = document.querySelector('#video-slot');
  const radioSection = document.querySelector('#radio');
  if (!tracks[trackIndex].video) { window.open(listeningUrl(tracks[trackIndex]), '_blank', 'noopener,noreferrer'); return; }
  if (slot.firstChild) { slot.replaceChildren(); radioSection.classList.remove('video-open'); document.querySelector('#play-track').textContent = '▶ VER CLIPE DO YOUTUBE'; return; }
  setTour(false); stop(); destination = null;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${tracks[trackIndex].video}`;
  iframe.title = `Clipe de ${tracks[trackIndex].name} — Gorillaz`;
  iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  const fallback = document.createElement('div');
  fallback.className = 'embed-fallback';
  fallback.innerHTML = `<span>Se o vídeo não carregar na sua rede, assista diretamente no YouTube:</span><a href="${listeningUrl(tracks[trackIndex])}" target="_blank" rel="noopener noreferrer">Abrir ${tracks[trackIndex].name} no YouTube ↗</a>`;
  slot.append(iframe, fallback); radioSection.classList.add('video-open'); document.querySelector('#play-track').textContent = '× FECHAR CLIPE';
});
members.forEach((member, index) => {
  const card = document.createElement('article'); card.className = 'band-card';
  const act = CITY_ERAS[eraAt(MEMBER_LOCATIONS[index])].act;
  card.innerHTML = `<div class="band-portrait">${memberPhoto(index)}</div><div class="band-card-body"><span class="eyebrow">0${index + 1} / ${member.role.toUpperCase()}</span><strong>${member.name}</strong><p class="band-card-meta">Faixa: ${member.song} · Ato ${act}</p><div class="band-card-actions"><button type="button" class="band-story-btn">CONHEÇA A HISTÓRIA <span aria-hidden="true">↗</span></button><button type="button" class="band-road-btn">ENCONTRAR NA ESTRADA <span aria-hidden="true">↗</span></button></div></div>`;
  card.querySelector('img').addEventListener('error', () => { card.querySelector('.band-portrait').innerHTML = portrait(member, index); }, {once:true});
  card.querySelector('.band-portrait').addEventListener('click', () => openMember(index));
  card.querySelector('.band-story-btn').addEventListener('click', () => openMember(index));
  card.querySelector('.band-road-btn').addEventListener('click', () => {
    startNavigation({ ...MEMBER_LOCATIONS[index], title: member.name });
    sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  document.querySelector('#band-grid').append(card);
});
// 360° nos cards da seção editorial (lazy: o GLB carrega quando o card aparece).
attachCardSpinners([...document.querySelectorAll('#band-grid .band-portrait')].map((host, index) => ({ host, index })));
eras.forEach((era, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.innerHTML = `<span>${era.label}</span><strong>${era.album}</strong>`;
  button.style.setProperty('--album-color', era.color);
  button.addEventListener('click', () => selectEra(index)); document.querySelector('#era-menu').append(button);
});
document.querySelector('#prev-era')?.addEventListener('click', () => { if (eraNavState(selectedEraIndex, eras.length).prev) selectEra(selectedEraIndex - 1); });
document.querySelector('#next-era')?.addEventListener('click', () => { if (eraNavState(selectedEraIndex, eras.length).next) selectEra(selectedEraIndex + 1); });
document.querySelector('#era-menu').addEventListener('keydown', event => {
  const buttons = [...event.currentTarget.children]; const index = buttons.indexOf(document.activeElement);
  if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next].focus(); selectEra(next);
});
// Faixa de capas das 8 eras, no espaço ao lado do título: cada capa seleciona a era correspondente.
const eraStrip = document.querySelector('#era-strip');
if (eraStrip) eraStrip.replaceChildren(...eras.map((era, index) => {
  const button = document.createElement('button'); button.type = 'button';
  button.setAttribute('aria-label', `${era.label}: ${era.album}`);
  const image = document.createElement('img'); image.src = era.cover; image.alt = ''; image.width = 44; image.height = 44; image.decoding = 'async';
  button.append(image);
  button.addEventListener('click', () => { selectEra(index); document.querySelector('#era-panel').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' }); });
  return button;
}));
// Botão fixo "ENTRAR NO UNIVERSO 3D": aparece quando a página já foi rolada e o mundo 3D está fora da tela.
const enter3dButton = document.querySelector('#enter-3d-fixed');
const syncEnter3d = () => {
  if (!enter3dButton) return;
  const worldRect = sceneSection.getBoundingClientRect();
  enter3dButton.hidden = window.scrollY < window.innerHeight * .6 || (worldRect.top < window.innerHeight && worldRect.bottom > 0);
};
enter3dButton?.addEventListener('click', () => {
  if (!entered) document.querySelector('#enter-world').click();
  lockScroll(true);
  sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' });
  focusWorld();
});
window.addEventListener('scroll', syncEnter3d, { passive: true }); window.addEventListener('resize', syncEnter3d); syncEnter3d();
document.querySelector('#era-drive').addEventListener('click', () => {
  // A era leva o carro à parada dela no mapa (era-places.js), não à primeira do percurso.
  startNavigation(DISCOVERIES[discoveryIndexForEra(selectedEraIndex)]);
  sceneSection.scrollIntoView({behavior:reducedMotion.matches ? 'instant' : 'smooth'});
});
document.querySelector('#era-listen').addEventListener('click', () => { manualTrack = false; setTrack(tracks.findIndex(track => track.id === eras[selectedEraIndex].track)); });
let resetJourneyArmed = false;
document.querySelector('#reset-journey').addEventListener('click', event => {
  if (!resetJourneyArmed) { resetJourneyArmed = true; event.currentTarget.textContent = 'Confirmar: reiniciar posição e integrantes'; return; }
  stop(); Object.assign(vehicle, createVehicle()); discovered.clear();
  actors.forEach(actor => actor.classList.remove('discovered'));
  document.querySelector('#counter').textContent = '00 / 04 PERSONAGENS';
  setShowcase(true); manualTrack = false; world?.resetCamera(); resetViewControls(); persistJourney();
  resetJourneyArmed = false; event.currentTarget.textContent = 'Reiniciar posição e integrantes';
  announce('Posição e integrantes reiniciados. Seu diário de histórias foi preservado.');
});
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]'); if (!anchor) return;
  const id = anchor.getAttribute('href').slice(1);
  // Logo "GORILLAZ": volta ao topo da página (antes era href="#", sem ação).
  if (!id) { if (anchor.classList.contains('brand')) { event.preventDefault(); window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'auto' : 'smooth' }); } return; }
  const target = document.getElementById(id); const disclosure = target?.closest('details'); if (disclosure) disclosure.open = true;
  // Navbar com rolagem suave (instantânea com prefers-reduced-motion).
  if (target && !anchor.target) { event.preventDefault(); target.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start' }); }
});
actors.forEach((actor,index) => actor.classList.toggle('discovered',discovered.has(index)));
document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2,'0')} / 04 PERSONAGENS`;
selectEra(0, {automatic:true});

const selectedModels = {
  car: { uid: 'd1ac8116d1ab4ad7b612921425aa827a', name: 'Gorrilaz Car BlockBench', author: 'shabaev', license: 'CC BY 4.0', url: 'https://sketchfab.com/3d-models/gorrilaz-car-blockbench-d1ac8116d1ab4ad7b612921425aa827a' },
  phase7: { uid: '77d8602771c44a9e879cdc623258a650', name: 'The Gorillaz band (phase 7)', author: 'Gorillaz / publicação Redtricity', license: 'CC BY 4.0 indicada na fonte', url: 'https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650' },
  band: { uid: 'b693d0e95a634674b5fe5744dd3392cb', name: 'Gorillaz — Papercraft', author: 'Dudi Julianto', license: 'licença de reutilização não informada · referência visual', url: 'https://sketchfab.com/3d-models/gorillaz-b693d0e95a634674b5fe5744dd3392cb' },
  windmill: { uid: '0e72abda7e8b4ec5a8eaa6bf9d25603b', name: 'Flying windmill', author: 'zeee7', license: 'Standard · referência visual', url: 'https://sketchfab.com/3d-models/flying-windmill-0e72abda7e8b4ec5a8eaa6bf9d25603b' },
};
const modelDialog = document.querySelector('#model-dialog');
const previewSlot = document.querySelector('#sketchfab-slot');
let modelPreviousFocus;
for (const button of document.querySelectorAll('[data-sketchfab]')) button.addEventListener('click', () => {
  if (modalOpen()) return;
  const model = selectedModels[button.dataset.sketchfab];
  stop(); setTour(false); destination = null; modelPreviousFocus = document.activeElement;
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
  modelPreviousFocus?.focus({preventScroll:true});
});

// Reuse the existing controls and their listeners inside the compact HUD.
const navMenu = document.createElement('div');
navMenu.id = 'hud-navigation';
document.querySelector('#journey').append(navMenu);
for (const selector of ['#route-toggle','#journey-description','#route-list','.exploration-hud','.experience-toolbar','.camera-tools','.game-top','.trip-meter']) {
  navMenu.append(document.querySelector(selector));
}
const radioMenu = document.createElement('div');
radioMenu.id = 'hud-radio-menu';
document.querySelector('.radio-import').addEventListener('click', () => document.querySelector('#radio-files').click());
document.querySelector('#road-radio').append(radioMenu);
for (const selector of ['#kong-fm-help','.radio-import','#road-radio-listen','#road-radio select','.radio-volume']) {
  radioMenu.append(document.querySelector(selector));
}
const hudMenus = [[document.querySelector('#hud-nav'), navMenu], [document.querySelector('#hud-radio-toggle'), radioMenu]];
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
let idleTimer;
function wakeHud() {
  sceneSection.classList.remove('hud-idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => sceneSection.classList.add('hud-idle'), 5000);
}
for (const type of ['pointermove','pointerdown','keydown','focusin']) sceneSection.addEventListener(type, wakeHud);
wakeHud();
const routeLine = document.createElementNS('http://www.w3.org/2000/svg','polyline');
for (const [key,value] of Object.entries({fill:'none',stroke:'#c4dc9d','stroke-width':'3','stroke-linejoin':'round'})) routeLine.setAttribute(key,value);
map.insertBefore(routeLine, document.querySelector('#map-car'));
const fullRouteLine = fullWorldMap ? document.createElementNS('http://www.w3.org/2000/svg','polyline') : null;
if (fullRouteLine && fullWorldMap) {
  for (const [key,value] of Object.entries({fill:'none',stroke:'#c4dc9d','stroke-width':'3.5','stroke-linejoin':'round'})) fullRouteLine.setAttribute(key,value);
  fullWorldMap.insertBefore(fullRouteLine, document.querySelector('#full-map-car'));
}
let mapZoomed = false, smoothMapSpanW = 184;
document.querySelector('#map-zoom').addEventListener('click', event => {
  mapZoomed = !mapZoomed;
  event.currentTarget.setAttribute('aria-pressed', String(mapZoomed));
  event.currentTarget.setAttribute('aria-label', mapZoomed ? 'Zoom automático do minimapa' : 'Aproximar minimapa');
  event.currentTarget.textContent = mapZoomed ? '−' : '+';
});
let lastRoute, lastRouteIndex, lastHudTime = -Infinity;
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
    const mode = firstPerson ? 'Cabine 1ª pessoa' : overview ? 'Vista aérea' : landmarkView ? 'Mirante do moinho' : touring ? 'Passeio guiado' : 'Câmera de viagem';
    const pilot = document.querySelector('#world canvas')?.dataset.pilot === 'glb'
      ? 'Piloto: 6 malhas · 2.806 tris · 65 ossos · Driving_Loop + reatividade de direção'
      : 'Piloto procedural (GLB indisponível ou carregando)';
    rigEl.textContent = `${vStatus.textContent} · ${pilot} · ${mode}`;
  }
}
updateJournal();
updateTelemetry();

// Garagem do Geep: ações rápidas que sobem ao mundo 3D e ativam o modo desejado.
function scrollToWorld() {
  sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
}
document.querySelector('#garage-action-drive')?.addEventListener('click', () => {
  enterWorld(); setShowcase(false); overview = false; landmarkView = false; firstPerson = false;
  world?.setFirstPerson(false); world?.setOverview(false); syncCameraModes(); scrollToWorld(); focusWorld();
});
document.querySelector('#garage-action-cockpit')?.addEventListener('click', () => {
  scrollToWorld();
  if (worldAvailable) {
    enterWorld(); firstPerson = true; overview = landmarkView = false;
    setShowcase(false); world?.setFirstPerson(true); syncCameraModes(); focusWorld();
  } else focusWorld();
});
document.querySelector('#garage-action-overview')?.addEventListener('click', () => {
  enterWorld(); firstPerson = false; landmarkView = false; overview = true;
  world?.setFirstPerson(false); world?.setOverview(true); syncCameraModes(); scrollToWorld(); focusWorld();
});
document.querySelector('#garage-action-tour')?.addEventListener('click', () => {
  const point = DISCOVERIES.find(d => !journal.known.has(d.id)) || DISCOVERIES[tourIndex++ % DISCOVERIES.length];
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
