import { eras, tracks, sources, memberStories, trackById, listeningUrl } from './content.js';
import { loadJourney, loadWorldJourney, saveWorldJourney } from './progress.js';
import { MEMBER_STOPS } from './route.js';
import { DISCOVERIES, MEMBER_LOCATIONS, REGIONS, ROADS, distance, regionAt } from './world-data.js';
import { createVehicle, stepVehicle, haltVehicle, recoverVehicle } from './driving.js';
import { createInput } from './input.js';
import { createJournal, nearbyInteraction } from './discoveries.js';
import { planPath, navigationInput } from './navigation.js';
const members = [
  { name: '2-D', role: 'Voz e teclados', skin: '#e2d8c0', hair: '#3a68d8', shirt: '#f2559c', position: MEMBER_STOPS[0], description: 'Stuart Pot, conhecido como 2-D, é a voz da banda virtual. Seu cabelo azul e olhos escuros compõem sua identidade visual. Sua personalidade sensível contrasta com o caos ao redor.', song: 'Tomorrow Comes Today' },
  { name: 'Murdoc', role: 'Baixo', skin: '#91a568', hair: '#141414', shirt: '#373737', position: MEMBER_STOPS[1], description: 'Murdoc Niccals é o baixista e autoproclamado líder da banda. Provocador e ligado ao rock, está no centro de várias histórias do universo Gorillaz.', song: 'Feel Good Inc.' },
  { name: 'Noodle', role: 'Guitarra', skin: '#e2d8c0', hair: '#141414', shirt: '#3a68d8', position: MEMBER_STOPS[2], description: 'Noodle é a guitarrista japonesa da banda. Sua trajetória atravessa as eras visuais de Gorillaz, combinando mistério, independência e energia.', song: 'DARE' },
  { name: 'Russel', role: 'Bateria', skin: '#986b50', hair: '#141414', shirt: '#e2d8c0', position: MEMBER_STOPS[3], description: 'Russel Hobbs é o baterista. Sua conexão com o hip-hop e o sobrenatural faz parte da narrativa da banda.', song: 'Clint Eastwood' },
];
members.forEach((member, index) => Object.assign(member, memberStories[index], {song: trackById(memberStories[index].track).name}));
const memberKeys = ['twod', 'murdoc', 'noodle', 'russel'];
function memberPhoto(index) { return `<img src="/assets/portraits/phase7-${memberKeys[index]}.png" alt="" loading="lazy">`; }
function portrait(member, index) {
  return `<svg viewBox="0 0 70 110" aria-hidden="true"><path d="M22 76 18 108M47 76l5 32" stroke="#141414" stroke-width="10"/><path d="M${index === 3 ? 10 : 17} 79V54Q35 36 ${index === 3 ? 60 : 53} 54v25Z" fill="${member.shirt}" stroke="#141414" stroke-width="3"/><path d="M18 55 8 80m45-25 9 25" stroke="${member.skin}" stroke-width="8"/><ellipse cx="35" cy="28" rx="${index === 3 ? 24 : 19}" ry="24" fill="${member.skin}" stroke="#141414" stroke-width="3"/><path d="M15 24 13 7 26 9 34 0 41 9 56 5 54 30 44 15 34 21 26 15Z" fill="${member.hair}"/><g fill="#141414"><ellipse cx="27" cy="29" rx="4" ry="5"/><ellipse cx="43" cy="29" rx="4" ry="5"/></g><path d="m28 42 15-2" stroke="#141414" stroke-width="2"/></svg>`;
}

const vehicle = createVehicle();
let storage; try { storage = window.localStorage; } catch { /* Memory-only journal. */ }
const journal = createJournal(storage);
const savedWorld = loadWorldJourney(storage);
if (savedWorld) Object.assign(vehicle, savedWorld.vehicle);
const discovered = new Set(savedWorld?.discovered ?? loadJourney(storage).discovered);
let manualTrack = false, selectedEraIndex = 0, worldVisible = true, worldAvailable = false;
let lastRenderTime = -Infinity, lastSavedTime = 0;
const sceneSection = document.querySelector('#jogo');
function persistJourney() { saveWorldJourney(storage, vehicle, discovered); }
window.addEventListener('pagehide', persistJourney);
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  worldVisible = entries[0].isIntersecting;
  if (!worldVisible) stop();
}, {threshold:0}).observe(sceneSection);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const dialog = document.querySelector('#character-dialog');
const discoveryDialog = document.querySelector('#discovery-dialog');
const journalDialog = document.querySelector('#journal-dialog');
const modalOpen = () => Boolean(document.querySelector('dialog[open]'));
let entered = false, showcase = true, orbital = false, overview = false, landmarkView = false;
let world = null, destination = null, touring = false, previousFocus = null, nearby = null;
let lastTime, accumulator = 0, currentRegion = -1, tourIndex = 0;
const tourButton = document.querySelector('#tour-toggle');
const bandToggle = document.querySelector('#band-toggle');
const input = createInput({ onManual() {
  enterWorld(); destination = null; setTour(false); setShowcase(false);
  if (overview || landmarkView) { overview = false; landmarkView = false; world?.setOverview(false); syncCameraModes(); }
}, onInteract: interact });

function announce(text) { document.querySelector('#announcement').textContent = text; }
function focusWorld() { (document.querySelector('#world canvas') || document.querySelector('#world-map'))?.focus({preventScroll:true}); }
function enterWorld() {
  if (entered) return;
  entered = true;
  document.querySelector('#jogo').dataset.entered = 'true';
  document.querySelector('.scene-intro').classList.add('leaving');
}
function setShowcase(value) { showcase = value; bandToggle.setAttribute('aria-pressed', String(value)); }
function setTour(value) {
  touring = value; tourButton.setAttribute('aria-pressed', String(value));
  tourButton.textContent = value ? 'Ⅱ PAUSAR PASSEIO' : '▶ PASSEIO GUIADO';
}
function stop() { input.clear(); haltVehicle(vehicle); destination = null; accumulator = 0; setTour(false); persistJourney(); }
window.addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
document.querySelector('#enter-world').addEventListener('click', () => { enterWorld(); focusWorld(); });
bandToggle.addEventListener('click', () => { stop(); setShowcase(!showcase); });
document.querySelector('#recover-car').addEventListener('click', () => { stop(); recoverVehicle(vehicle); setShowcase(false); announce('Geep reposicionado no caminho mais próximo.'); });
function startNavigation(point) {
  stop(); enterWorld(); setShowcase(false); overview = false; landmarkView = false; world?.setOverview(false); syncCameraModes();
  destination = planPath(vehicle, point); announce(`Passeio até ${point.title}. Você pode assumir a direção a qualquer momento.`);
  focusWorld();
}
tourButton.addEventListener('click', () => {
  if (touring || destination) { stop(); return; }
  const point = DISCOVERIES.find(d => !journal.known.has(d.id)) || DISCOVERIES[tourIndex++ % DISCOVERIES.length];
  startNavigation(point); setTour(true);
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
cameraMenuToggle.addEventListener('click', () => setCameraMenu(cameraTools.dataset.expanded !== 'true'));
document.addEventListener('pointerdown', event => { if (!cameraTools.contains(event.target)) setCameraMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') setCameraMenu(false); });
function resetViewControls() {
  overview = false; landmarkView = false; orbital = false;
  const button = document.querySelector('#camera-toggle'); button.setAttribute('aria-pressed','false'); button.textContent = '↻ CÂMERA ORBITAL'; syncCameraModes();
}
function syncCameraModes() {
  document.querySelector('#overview-toggle').setAttribute('aria-pressed', String(overview));
  document.querySelector('#overview-toggle').textContent = overview ? '↙ VOLTAR AO JIPE' : '◎ VER MUNDO';
  document.querySelector('#windmill-focus').setAttribute('aria-pressed', String(landmarkView));
  document.querySelector('#windmill-focus').textContent = landmarkView ? '↙ VOLTAR AO JIPE' : '✦ VER MOINHO';
}
document.querySelector('#zoom-in').addEventListener('click', () => world?.zoomBy(-.15));
document.querySelector('#zoom-out').addEventListener('click', () => world?.zoomBy(.15));
document.querySelector('#reset-camera').addEventListener('click', () => { world?.resetCamera(); resetViewControls(); });
document.querySelector('#overview-toggle').addEventListener('click', () => { overview = !overview; landmarkView = false; world?.setOverview(overview); syncCameraModes(); });
document.querySelector('#windmill-focus').addEventListener('click', () => { enterWorld(); stop(); landmarkView = !landmarkView; overview = false; world?.focusWindmill(landmarkView); syncCameraModes(); });
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
  discovered.add(index); actors[index].classList.add('discovered'); persistJourney();
  document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
  announce(`${member.name} encontrado. ${discovered.size} de 4 personagens.`);
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
  document.querySelector('#discovery-kind').textContent = `${point.kind} / ${point.label}`;
  document.querySelector('#discovery-title').textContent = point.title;
  document.querySelector('#discovery-text').textContent = point.text;
  document.querySelector('#discovery-detail').textContent = point.detail;
  document.querySelector('#discovery-source').href = point.source;
  document.querySelector('#discovery-saved').textContent = journal.known.has(point.id) ? (fresh ? '✓ Nova descoberta salva no seu diário.' : '✓ Esta história já está no seu diário.') : 'Consulta livre. Encontre este lugar no mundo para registrar a descoberta.';
  setTrack(point.track); updateJournal(); discoveryDialog.showModal(); discoveryDialog.querySelector('.close').focus();
  if (fresh) announce(`Nova descoberta: ${point.title}. ${journal.known.size} de 5 histórias.`);
}
function interact() {
  if (modalOpen() || !entered) return;
  nearby = nearbyInteraction(vehicle);
  if (!nearby) return;
  if (Math.abs(vehicle.speed) >= 2) { announce('Reduza a velocidade para explorar este lugar.'); return; }
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
    const region = document.createElement('p'); region.textContent = REGIONS[point.region].name;
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
map.innerHTML = `<rect x="-140" y="-200" width="280" height="250" rx="22" fill="#263831"/>${ROADS.map(r => `<polyline points="${r.samples.map(p => `${p.x},${p.z}`).join(' ')}" fill="none" stroke="#e2d8c055" stroke-width="6" stroke-linecap="round"/>`).join('')}${REGIONS.map((r, i) => `<text x="${r.x}" y="${r.z + (i === 0 ? 27 : -24)}" text-anchor="middle" fill="${r.color}" font-size="7">${['KONG', 'MURAIS', 'MOINHO'][i]}</text>`).join('')}${DISCOVERIES.map(d => `<g data-map-poi="${d.id}"><circle cx="${d.x}" cy="${d.z}" r="4" fill="#f5a9c6"/></g>`).join('')}<path id="map-car" d="M0 -7 5 5 0 3 -5 5Z" fill="#d2e2a8" stroke="#111415" stroke-width="1.2"/>`;
import('./scene.js').then(({createWorld}) => {
  world = createWorld(document.querySelector('#world'), index => {
    if (showcase || distance(vehicle, MEMBER_LOCATIONS[index]) < 13 && Math.abs(vehicle.speed) < 2) openMember(index);
    else announce('Aproxime-se e reduza a velocidade para conhecer este integrante.');
  }, {
    onViewReset: resetViewControls,
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
  worldAvailable = true; world.setEra(tracks[REGIONS[regionAt(vehicle)].track].era);
  document.querySelector('.world-shell').classList.add('has-3d');
  document.querySelector('#render-status').textContent = 'MUNDO ABERTO / 3D EM TEMPO REAL';
}).catch(error => {
  console.warn('Modo 2D ativado:', error.message);
  document.querySelector('#render-status').textContent = 'MODO 2D / EXPLORE PELO MAPA E PELO DIÁRIO';
  document.querySelector('#vehicle-status').textContent = 'MODO 2D / MODELOS DISPONÍVEIS PARA DOWNLOAD';
  document.querySelector('#band-status').textContent = 'MODO 2D / CONHEÇA A BANDA PELAS FICHAS';
  document.querySelector('.world-shell').classList.add('map-only');
  for (const button of document.querySelectorAll('.camera-tools button, #camera-toggle, #band-toggle')) button.disabled = true;
});
function frame(time) {
  const delta = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .1); lastTime = time;
  const paused = modalOpen() || document.hidden || !worldVisible;
  if (entered && !paused) {
    accumulator = Math.min(accumulator + delta, .1);
    while (accumulator >= 1 / 120) {
      let controls = input.read();
      if (destination && !controls.active) {
        controls = navigationInput(vehicle, destination);
        if (controls.arrived) { const title = destination.target.title; stop(); announce(`Você chegou: ${title}. Pressione E para explorar.`); break; }
      }
      stepVehicle(vehicle, controls, 1 / 120); accumulator -= 1 / 120;
    }
  } else accumulator = 0;
  let region = regionAt(vehicle);
  if (currentRegion >= 0 && region !== currentRegion && distance(vehicle, REGIONS[region]) + 8 >= distance(vehicle, REGIONS[currentRegion])) region = currentRegion;
  if (region !== currentRegion) {
    currentRegion = region; document.querySelector('#scene-label').textContent = REGIONS[region].name.toUpperCase();
    document.querySelector('#region-name').textContent = REGIONS[region].name; if (!manualTrack) setTrack(REGIONS[region].track); world?.setEra(tracks[REGIONS[region].track].era);
  }
  nearby = nearbyInteraction(vehicle);
  const interaction = document.querySelector('#interact');
  interaction.hidden = !nearby || !entered || paused;
  if (nearby) { interaction.disabled = Math.abs(vehicle.speed) >= 2; interaction.textContent = interaction.disabled ? `Reduza para explorar · ${nearby.title}` : `E / EXPLORAR — ${nearby.title}`; }
  const unfound = DISCOVERIES.filter(d => !journal.known.has(d.id)).sort((a, b) => distance(vehicle, a) - distance(vehicle, b))[0];
  document.querySelector('#exploration-hint').textContent = destination ? `Passeio guiado · ${destination.target.title}` : unfound ? `${unfound.kind.toLowerCase()} a ${Math.round(distance(vehicle, unfound))} m · escolha seu caminho` : 'Todas as histórias encontradas. Continue explorando.';
  const speed = Math.round(Math.abs(vehicle.speed) * 3.6);
  document.querySelector('#speed').textContent = String(speed).padStart(2, '0');
  document.querySelector('#gear').textContent = vehicle.speed < -.1 ? 'RÉ' : vehicle.braking ? 'FREIO' : Math.abs(vehicle.speed) < .1 ? 'PARADO' : vehicle.surface.toUpperCase();
  const hud = document.querySelector('#drive-hud'); hud.dataset.x = vehicle.x.toFixed(2); hud.dataset.z = vehicle.z.toFixed(2); hud.dataset.speed = vehicle.speed.toFixed(3); hud.dataset.heading = vehicle.heading.toFixed(3);
  document.querySelector('#map-car').setAttribute('transform', `translate(${vehicle.x},${vehicle.z}) rotate(${-vehicle.heading * 180 / Math.PI})`);
  for (const point of DISCOVERIES) {
    const marker = map.querySelector(`[data-map-poi="${point.id}"]`); marker.style.opacity = journal.known.has(point.id) ? '1' : distance(vehicle, point) < 48 ? '.6' : '0';
    marker.querySelector('circle').setAttribute('fill', journal.known.has(point.id) ? '#d2e2a8' : '#f5a9c6');
  }
  const moving = Math.abs(vehicle.speed) > .1;
  document.querySelector('#radio').classList.toggle('playing', moving && !reducedMotion.matches && !paused);
  const renderInterval = window.innerWidth <= 700 ? 1000/30 : 1000/60;
  if (world && worldAvailable && !paused && time-lastRenderTime+.5 >= renderInterval) {
    world.update(vehicle, time, orbital, reducedMotion.matches, showcase, journal.known, nearby); lastRenderTime = time;
  }
  if (moving && !paused && time-lastSavedTime > 1500) { persistJourney(); lastSavedTime = time; }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const stops = [
  ['Início', 'Siga o som.', '<p>Uma banda virtual reúne personagens, músicos reais, animação e colaboração. Esta viagem apresenta oito eras entre 1998 e 2023, vistas por nove paradas temáticas.</p><p>Use W/S para acelerar e frear, A/D para virar ou os pedais na tela. Escolha ruas e atalhos. Reduza e pressione E para explorar um lugar ou conhecer um integrante. Todas as informações também estão nos menus, sem precisar dirigir.</p><p>A câmera pode girar por arraste; a vista aérea revela o mundo aberto. O progresso fica salvo quando o armazenamento deste navegador está disponível e pode ser reiniciado pelo botão da estrada.</p>', 'Explore o mundo ou explore o conteúdo pelos menus. Todas as fichas estão sempre disponíveis.'],
  ['História', 'Do desenho ao primeiro disco.', '<p>Gorillaz nasceu em Londres, em 1998, da parceria entre Damon Albarn e Jamie Hewlett. A música e a identidade visual foram pensadas juntas, com os quatro integrantes virtuais como parte de uma narrativa em expansão.</p><p>O EP Tomorrow Comes Today apareceu em 2000. Em 2001, o álbum Gorillaz apresentou uma mistura de rock, hip-hop, dub e eletrônica, com Clint Eastwood e 19-2000 entre as entradas mais conhecidas para esse universo.</p><p>A história real é a dos artistas, gravações, lançamentos e shows. Na ficção, 2-D, Murdoc, Noodle e Russel vivem suas próprias histórias. <a href="#eras">A linha do tempo separa essas camadas em cada era ↗</a>.</p>', 'Londres, 1998. Albarn e Hewlett começam um projeto em que som, imagem e ficção caminham juntos.'],
  ['Personagens', 'Quatro rostos. Muitas histórias.', '<p>Os integrantes virtuais têm funções, personalidades e trajetórias próprias. A obra é realizada por artistas reais e muitos colaboradores. Nas fichas, as duas camadas aparecem separadas.</p><div class="cards">' + members.map((member, index) => `<button type="button" data-member="${index}">${member.name} ↗</button>`).join('') + '</div><p>As figuras 3D desta experiência são da Phase 7. Elas permanecem as mesmas ao visitar eras anteriores; não representam todos os visuais históricos de cada personagem.</p>', 'Conheça os integrantes virtuais e a relação deles com quem faz a música fora da tela.'],
  ['Identidade', 'A identidade está no encontro.', '<div class="genre-tags"><span>ROCK</span><span>HIP-HOP</span><span>DUB</span><span>ELETRÔNICA</span><span>POP</span></div><p>Gorillaz não depende de um único gênero para ser reconhecível. A voz de Albarn, o desenho de Hewlett, os convidados e a construção audiovisual dão continuidade a trabalhos musicalmente diferentes.</p><p>Capas, clipes e personagens ampliam as músicas. As colaborações fazem parte do processo: de Del the Funky Homosapien e De La Soul a Bobby Womack, Little Dragon e Thundercat, diferentes encontros mudam a paisagem de cada disco.</p>', 'Música, desenho e colaboração constroem uma identidade que muda de forma sem perder o fio.'],
  ['Álbuns', 'Oito discos. Oito portas.', '<div class="album-guide">' + eras.map((era, index) => `<article><span>${era.label}</span><h4>${era.album}</h4><p>${era.title}</p><button type="button" data-era="${index}">LER ESTA ERA ↗</button></article>`).join('') + '</div><p class="editorial-note">Recorte de oito álbuns até 2023. The Fall tem lançamento digital em 2010 e edição física em 2011. EPs, compilações e lançamentos posteriores ficam fora desta seleção.</p>', 'Escolha um disco para conhecer seu contexto e uma sugestão de escuta.'],
  ['Ao vivo', 'Quando o universo encontra o palco.', '<p>Os shows de Gorillaz reúnem músicos reais, vocalistas e convidados. Imagens e projeções conectam o palco aos integrantes virtuais, em formatos que variam entre apresentações e turnês.</p><p>Essa passagem para o palco evidencia a dimensão coletiva do projeto: os personagens dão unidade ao universo visual, enquanto uma equipe de artistas transforma as gravações em performance.</p>', 'Músicos reais, convidados e imagens colocam o universo virtual em contato com o público.'],
  ['Temas', 'O mundo no retrovisor.', '<div class="theme-grid"><article><h4>Solidão e cidade</h4><p>Tomorrow Comes Today oferece uma escuta para a melancolia e a vida urbana.</p></article><article><h4>Consumo e mídia</h4><p>A torre e o moinho de Feel Good Inc. permitem discutir isolamento, aparência e liberdade.</p></article><article><h4>Ambiente e descarte</h4><p>Plastic Beach transforma uma ilha de detritos em cenário. É uma porta para conversar sobre consumo e meio ambiente.</p></article><article><h4>Crença e imagem</h4><p>Cracker Island trabalha uma narrativa de cultos e rituais numa Los Angeles ficcional.</p></article></div><p class="editorial-note">São leituras propostas por este projeto. Uma canção ou imagem pode permitir interpretações diferentes; os temas não explicam sozinhos toda a obra.</p>', 'Uma proposta de leitura sobre cidade, consumo, meio ambiente e as imagens em que escolhemos acreditar.'],
  ['Projeto', 'Uma estrada feita por nós.', '<p>Projeto acadêmico de <strong>Eduardo Alves Xavier</strong>, <strong>Gedson de Souza Mancio Júnior</strong> e <strong>Rafael Machado Colnaghi</strong>.</p><p>O mundo aberto conecta descobertas e permite consultar oito eras e nove pontos de vista sobre a banda. As cores das eras e o moinho provisório são interpretações do projeto. O Geep aproxima a viagem da iconografia de 19-2000; o moinho remete à ideia visual de Feel Good Inc.</p><p>Os modelos Phase 7 foram publicados por Redtricity, que os atribui ao Gorillaz, com CC BY 4.0 indicada na fonte. O Geep é de shabaev, sob CC BY 4.0. <a href="#backstage">Créditos, arquivos e adaptações estão nos bastidores ↗</a>.</p>', 'Uma experiência acadêmica que usa a estrada para conectar música, contexto e personagens.'],
  ['Fontes', 'A viagem continua na pesquisa.', '<p>Este percurso cobre 1998–2023. A seleção separa fatos da produção musical, a narrativa dos personagens e as interpretações do projeto.</p><ul class="history-sources">' + sources.map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a><p>${source.detail}</p></li>`).join('') + '</ul><p>Os links são referências para consulta e atualização. A atribuição dos arquivos 3D está nos <a href="#backstage">créditos e modelos</a>. Projeto acadêmico independente, sem vínculo oficial com Gorillaz.</p>', 'Consulte as fontes e os créditos. História real, ficção e interpretações estão identificadas no percurso.'],
];
const menu = document.querySelector('#stop-menu');
const panel = document.querySelector('#panel');
function selectStop(index) {
  document.querySelectorAll('#chapter-dock button').forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  document.querySelector('#chapter-title').textContent = stops[index][1];
  [...menu.children].forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  panel.setAttribute('aria-labelledby', `stop-${index}`);
  panel.innerHTML = `<span class="eyebrow">${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</span><h3>${stops[index][1]}</h3>${stops[index][2]}`;
  for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
  for (const button of panel.querySelectorAll('[data-era]')) button.addEventListener('click', () => { selectEra(Number(button.dataset.era)); document.querySelector('#eras').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); });
}
function selectEra(index, {automatic = false} = {}) {
  selectedEraIndex = index;
  if (!automatic) manualTrack = false;
  const era = eras[index];
  document.querySelectorAll('#era-menu button').forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  document.querySelector('#era-panel').style.setProperty('--era-color', era.color);
  document.querySelector('#era-kicker').textContent = `${era.label} / ${era.album.toUpperCase()}`;
  document.querySelector('#era-title').textContent = era.title;
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
let trackIndex = 0;
function setTrack(index) {
  trackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  document.querySelector('#radio-title').textContent = track.name;
  document.querySelector('#track-album').textContent = `${track.album} · ${track.year}`;
  document.querySelector('#track-description').textContent = track.text;
  document.querySelector('#track-number').textContent = `${String(trackIndex + 1).padStart(2, '0')} — ${String(tracks.length).padStart(2, '0')}`;
  document.querySelector('#listen-link').href = listeningUrl(track);
  document.querySelector('#listen-link').textContent = track.video ? 'OUVIR NO YOUTUBE ↗' : 'BUSCAR NO YOUTUBE ↗';
  document.querySelector('#track-era').textContent = `NA VIAGEM / ${eras[track.era].album.toUpperCase()}`;
  document.querySelector('#track-status').textContent = track.video ? 'O clipe abre sob sua escolha e precisa de internet. Sem reprodução automática.' : 'Esta faixa abre uma busca pelo clipe oficial. Não há uma prévia incorporada cadastrada para esta escuta.';
  document.querySelector('#radio').style.setProperty('--record-color', track.color);
  document.querySelector('#video-slot').replaceChildren();
  document.querySelector('#play-track').textContent = track.video ? '▶ ABRIR CLIPE' : 'BUSCAR CLIPE ↗';
}
document.querySelector('#previous-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex - 1); });
document.querySelector('#next-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex + 1); });
document.querySelector('#play-track').addEventListener('click', () => {
  const slot = document.querySelector('#video-slot');
  if (!tracks[trackIndex].video) { window.open(listeningUrl(tracks[trackIndex]), '_blank', 'noopener,noreferrer'); return; }
  if (slot.firstChild) { slot.replaceChildren(); document.querySelector('#play-track').textContent = '▶ ABRIR CLIPE'; return; }
  setTour(false); stop(); destination = null;
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${tracks[trackIndex].video}`;
  iframe.title = `Clipe de ${tracks[trackIndex].name} — Gorillaz`;
  iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  slot.append(iframe); document.querySelector('#play-track').textContent = '× FECHAR CLIPE';
});
members.forEach((member, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.className = 'band-card';
  button.innerHTML = `<div class="band-portrait">${memberPhoto(index)}</div><span class="eyebrow">0${index + 1} / ${member.role.toUpperCase()}</span><strong>${member.name}</strong><span>CONHEÇA A HISTÓRIA ↗</span>`;
  button.querySelector('img').addEventListener('error', () => { button.querySelector('.band-portrait').innerHTML = portrait(member, index); }, {once:true});
  button.addEventListener('click', () => openMember(index)); document.querySelector('#band-grid').append(button);
});
eras.forEach((era, index) => {
  const button = document.createElement('button'); button.type = 'button'; button.innerHTML = `<span>${era.label}</span><strong>${era.album}</strong>`;
  button.addEventListener('click', () => selectEra(index)); document.querySelector('#era-menu').append(button);
});
document.querySelector('#era-menu').addEventListener('keydown', event => {
  const buttons = [...event.currentTarget.children]; const index = buttons.indexOf(document.activeElement);
  if (index < 0 || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  event.preventDefault(); event.stopPropagation();
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
  buttons[next].focus(); selectEra(next);
});
document.querySelector('#era-drive').addEventListener('click', () => {
  const related = [0,3,2,2,4,1,4,1][selectedEraIndex];
  startNavigation(DISCOVERIES[related]); world?.setEra(selectedEraIndex);
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
  const id = anchor.getAttribute('href').slice(1); if (!id) return;
  const target = document.getElementById(id); const disclosure = target?.closest('details'); if (disclosure) disclosure.open = true;
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

updateJournal();
