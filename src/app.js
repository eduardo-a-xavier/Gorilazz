import { eras, tracks, sources, memberStories, eraForProgress, trackById, listeningUrl } from './content.js';
import { loadJourney, saveJourney } from './progress.js';
import { wrapProgress, nearestDestination, circularDistance, STOP_COUNT, MEMBER_STOPS } from './route.js';
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
const road = document.querySelector('#road');
const car = document.querySelector('#car');
const dialog = document.querySelector('#character-dialog');
const modalOpen = () => Boolean(document.querySelector('dialog[open]'));
const pow = document.querySelector('#pow');
let journeyStorage;
try { journeyStorage = window.localStorage; } catch { journeyStorage = null; }
const restoredJourney = loadJourney(journeyStorage);
const discovered = new Set(restoredJourney.discovered);
const held = new Set();
const pointers = new Map();
let position = restoredJourney.position;
let destination = null;
let touring = false;
let orbital = false;
let showcase = true;
let entered = false;
let enterTimer;
function enterWorld(startTour = false) {
  if (!entered) {
    entered = true;
    const intro = document.querySelector('.scene-intro');
    intro.classList.add('leaving');
    const reveal = () => { document.querySelector('#jogo').dataset.entered = 'true'; document.querySelector('.chapter-card').hidden = false; };
    if (reducedMotion.matches) reveal(); else { clearTimeout(enterTimer); enterTimer = setTimeout(reveal, 550); }
  }
  if (startTour) { setShowcase(false); setTour(true); }
}
document.querySelector('#enter-world').addEventListener('click', () => { enterWorld(); document.querySelector('#world canvas, #road')?.focus({preventScroll:true}); });
document.querySelector('#read-chapter').addEventListener('click', () => {
  selectStop(Math.max(0, routeIndex));
  document.querySelector('#paradas').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  document.querySelector('#panel').focus({preventScroll:true});
});
const bandToggle = document.querySelector("#band-toggle");
function setShowcase(value) { showcase = value; bandToggle.setAttribute("aria-pressed", String(value)); }
bandToggle.addEventListener("click", () => { setTour(false); destination = null; setShowcase(!showcase); });
let world = null;
const cameraTools = document.querySelector('.camera-tools');
const cameraMenuToggle = document.querySelector('#camera-menu-toggle');
function setCameraMenu(value) {
  cameraTools.dataset.expanded = String(value); cameraMenuToggle.setAttribute('aria-expanded', String(value));
  cameraMenuToggle.setAttribute('aria-label', value ? 'Fechar controles da câmera' : 'Abrir controles da câmera');
}
cameraMenuToggle.addEventListener('click', () => setCameraMenu(cameraTools.dataset.expanded !== 'true'));
document.addEventListener('pointerdown', event => { if (!cameraTools.contains(event.target)) setCameraMenu(false); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') setCameraMenu(false); });

document.querySelector('#zoom-in').addEventListener('click', () => world?.zoomBy(-.15));
document.querySelector('#zoom-out').addEventListener('click', () => world?.zoomBy(.15));
document.querySelector('#reset-camera').addEventListener('click', () => { world?.resetCamera(); resetViewControls(); });
let overview = false;
let landmarkView = false;
function syncCameraModes() {
  const overviewButton = document.querySelector('#overview-toggle');
  overviewButton.setAttribute('aria-pressed', String(overview)); overviewButton.textContent = overview ? '↙ VOLTAR AO JIPE' : '◎ VER CIRCUITO';
  const landmarkButton = document.querySelector('#windmill-focus');
  landmarkButton.setAttribute('aria-pressed', String(landmarkView)); landmarkButton.textContent = landmarkView ? '↙ VOLTAR AO JIPE' : '✦ VER MOINHO';
}
function resetViewControls() {
  overview = false; landmarkView = false; orbital = false;
  const button = document.querySelector('#camera-toggle'); button.setAttribute('aria-pressed', 'false'); button.textContent = '↻ CÂMERA ORBITAL';
  syncCameraModes();
}
document.querySelector('#overview-toggle').addEventListener('click', () => {
  overview = !overview; landmarkView = false; world?.setOverview(overview); syncCameraModes();
});
document.querySelector('#windmill-focus').addEventListener('click', () => {
  enterWorld(); landmarkView = !landmarkView; overview = false; setTour(false); stop(); destination = null;
  world?.focusWindmill(landmarkView); syncCameraModes();
});
let routeIndex = -1;
let roadEraIndex = -1;
let selectedEraIndex = eraForProgress(position);
let followingRoad = true;
let followingEra = true;
let manualTrack = false;
let worldVisible = true;
let worldAvailable = false;
let lastRenderTime = -Infinity;
let lastSavedTime = 0;
let previouslyMoving = false;
const sceneSection = document.querySelector('#jogo');
if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
  worldVisible = entries[0].isIntersecting;
  if (!worldVisible) { stop(); setTour(false); persistJourney(); }
}, {threshold: 0}).observe(sceneSection);
function persistJourney() { saveJourney(journeyStorage, position, discovered); }
window.addEventListener('pagehide', persistJourney);
function updateDiscovery() {
  actors.forEach((button, index) => button.classList.toggle('discovered', discovered.has(index)));
  document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
}
function followJourney() {
  followingRoad = true; followingEra = true; manualTrack = false;
  selectEra(eraForProgress(position), {automatic: true});
}
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tourButton = document.querySelector('#tour-toggle');
function setTour(value) {
  touring = value; tourButton.setAttribute('aria-pressed', String(value));
  tourButton.textContent = value ? 'Ⅱ PAUSAR TOUR' : '▶ TOUR AUTOMÁTICO';
}
tourButton.addEventListener('click', () => { enterWorld(); destination = null; followJourney(); setTour(!touring); });
document.querySelector('#camera-toggle').addEventListener('click', event => {
  orbital = !orbital; event.currentTarget.setAttribute('aria-pressed', String(orbital));
  event.currentTarget.textContent = orbital ? '↗ CÂMERA DE VIAGEM' : '↻ CÂMERA ORBITAL';
});
import('./scene.js').then(({createWorld}) => {
  world = createWorld(document.querySelector('#world'), index => openMember(index), {
    onViewReset() { resetViewControls(); },
    onLost() { worldAvailable = false; document.querySelector('.world-shell').classList.remove('has-3d'); document.querySelector('#render-status').textContent = 'MODO 2D / VISTA 3D TEMPORARIAMENTE INDISPONÍVEL'; },
    onRestored() { worldAvailable = true; document.querySelector('.world-shell').classList.add('has-3d'); document.querySelector('#render-status').textContent = '3D EM TEMPO REAL / THE ROAD'; },
  });
  worldAvailable = true; world.setEra(eraForProgress(position));
  document.querySelector('.world-shell').classList.add('has-3d');
  document.querySelector('#render-status').textContent = '3D EM TEMPO REAL / THE ROAD';
}).catch(error => {
  console.warn('Modo 2D ativado:', error.message);
  document.querySelector('#render-status').textContent = 'MODO 2D / WebGL indisponível';
  document.querySelector('#vehicle-status').textContent = 'MODO 2D / MODELOS DISPONÍVEIS PARA DOWNLOAD';
  document.querySelector('#band-status').textContent = 'MODO 2D / CONHEÇA OS INTEGRANTES PELAS FICHAS';
  document.querySelector('#band-status').dataset.loaded = 'false';
  for (const button of document.querySelectorAll('.camera-tools button, #camera-toggle, #band-toggle, #overview-toggle')) button.disabled = true;
});
let lastTime;
let previousFocus;
let encounter = null;
let cooldown = 0;
let powTimer;
const actors = members.map((member, index) => {
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'person';
  button.style.left = `${member.position * 100}%`;
  button.setAttribute('aria-label', `Abrir ficha de ${member.name}`);
  button.innerHTML = `${portrait(member, index)}<span>${member.name}</span>`;
  button.addEventListener('click', () => openMember(index));
  document.querySelector('#characters').append(button);
  return button;
});
function stop() { held.clear(); pointers.clear(); }
function openMember(index, collision = false) {
  if (modalOpen()) return;
  const member = members[index];
  dialog.dataset.collision = String(collision);
  stop(); setTour(false); destination = null; previousFocus = document.activeElement;
  document.querySelector('#portrait').innerHTML = memberPhoto(index);
  document.querySelector('#portrait img').addEventListener('error', () => { document.querySelector('#portrait').innerHTML = portrait(member, index); }, {once:true});
  document.querySelector('#character-name').textContent = member.name;
  document.querySelector('#character-role').textContent = member.role;
  document.querySelector('#character-description').textContent = member.description;
  document.querySelector('#character-detail').textContent = member.detail;
  document.querySelector('#character-song').textContent = member.song;
  setTrack(tracks.findIndex(track => track.id === member.track)); manualTrack = true;
  document.querySelector('#character-listen').href = listeningUrl(tracks[trackIndex]);
  if (!discovered.has(index)) {
    discovered.add(index); updateDiscovery(); persistJourney();
    document.querySelector('#announcement').textContent = `${member.name} encontrado. ${discovered.size} de 4 personagens.`;
  }
  if (collision) {
    encounter = index; pow.hidden = false; pow.style.left = `${member.position * 100}%`;
    clearTimeout(powTimer); powTimer = setTimeout(() => { pow.hidden = true; }, 650);
  }
  dialog.showModal();
  dialog.querySelector('.close').focus();
}
function closeMember() { dialog.close(); }
dialog.querySelector('.close').addEventListener('click', closeMember);
dialog.querySelector('.return').addEventListener('click', closeMember);
dialog.addEventListener('close', () => {
  stop(); cooldown = performance.now() + 700;
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
});
const inputTarget = (target) => target instanceof Element && Boolean(target.closest('input, textarea, select, button, a, [contenteditable]:not([contenteditable="false"])'));
const directionFor = key => ['ArrowLeft', 'a', 'A'].includes(key) ? -1 : ['ArrowRight', 'd', 'D'].includes(key) ? 1 : 0;
window.addEventListener('keydown', event => {
  if (modalOpen() || inputTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (directionFor(event.key)) { event.preventDefault(); held.add(event.key); }
});
window.addEventListener('keyup', event => held.delete(event.key));
window.addEventListener('blur', () => { stop(); setTour(false); persistJourney(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stop(); setTour(false); persistJourney(); } });
for (const button of document.querySelectorAll('[data-direction]')) {
  button.addEventListener('pointerdown', event => {
    if (modalOpen() || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); button.focus({ preventScroll: true });
    button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, Number(button.dataset.direction));
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => pointers.delete(event.pointerId));
  button.addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key) && !modalOpen()) { event.preventDefault(); pointers.set(button, Number(button.dataset.direction)); }
  });
  button.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); pointers.delete(button); } });
  button.addEventListener('blur', () => pointers.delete(button));
}
function frame(time) {
  const delta = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .05); lastTime = time;
  let moving = false;
  if (!modalOpen() && !document.hidden && worldVisible) {
    const direction = Math.sign([...held].reduce((sum, key) => sum + directionFor(key), 0) + [...pointers.values()].reduce((sum, value) => sum + value, 0));
    if (direction) { enterWorld(); destination = null; if (!followingEra || manualTrack) followJourney(); followingRoad = true; setTour(false); }
    const previous = position;
    if (destination !== null) {
      const difference = destination - position;
      if (Math.abs(difference) < .002) { position = destination; destination = null; }
      else position += Math.sign(difference) * Math.min(Math.abs(difference), delta * .17);
    } else position += (direction || (touring ? 1 : 0)) * delta * .035;
    moving = Math.abs(previous - position) > .000001;
    if (moving) { enterWorld(); setShowcase(false); }
    const nearby = members.findIndex(member => circularDistance(member.position, position) < .009);
    if (encounter !== null && nearby !== encounter) encounter = null;
    if (moving && destination === null && nearby >= 0 && nearby !== encounter && time >= cooldown) openMember(nearby, true);
  }
  const progress = wrapProgress(position);
  const currentRoute = Math.round(progress * STOP_COUNT) % STOP_COUNT;
  if (currentRoute !== routeIndex) {
    routeIndex = currentRoute; renderChapter(currentRoute);
    if (followingRoad) selectStop(currentRoute, false, true);
  }
  const eraIndex = eraForProgress(position);
  if (eraIndex !== roadEraIndex) {
    roadEraIndex = eraIndex; world?.setEra(eraIndex);
    if (followingEra) selectEra(eraIndex, {automatic: true});
    renderChapter(currentRoute);
  }
  document.querySelector('#trip-distance').textContent = `CIRCUITO ${String(Math.floor(progress * 100)).padStart(2, '0')}%`;
  document.querySelector('#trip-progress').style.width = `${progress * 100}%`;
  document.querySelector('#radio').classList.toggle('playing', moving && !reducedMotion.matches);
  const renderInterval = window.innerWidth <= 700 ? 1000 / 30 : 1000 / 60;
  if (world && worldAvailable && worldVisible && !modalOpen() && !document.hidden && time - lastRenderTime + .5 >= renderInterval) {
    world.update(position, time, moving, orbital, reducedMotion.matches, showcase); lastRenderTime = time;
  }
  const width = road.clientWidth; car.style.transform = `translateX(${progress * Math.max(0, width - car.offsetWidth)}px)`;
  if ((moving && time - lastSavedTime > 1500) || (previouslyMoving && !moving)) { persistJourney(); lastSavedTime = time; }
  previouslyMoving = moving;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const stops = [
  ['Início', 'Siga o som.', '<p>Uma banda virtual reúne personagens, músicos reais, animação e colaboração. Esta viagem apresenta oito eras entre 1998 e 2023, vistas por nove paradas temáticas.</p><p>Use ← / → ou A / D, segure os botões na tela ou ative o tour. Encontrar um integrante abre sua ficha. Todas as informações também estão nos menus, sem precisar dirigir.</p><p>A câmera pode girar por arraste; a vista aérea revela o circuito. O progresso fica salvo quando o armazenamento deste navegador está disponível e pode ser reiniciado pelo botão da estrada.</p>', 'Entre no circuito ou explore o conteúdo pelos menus. Todas as fichas estão sempre disponíveis.'],
  ['História', 'Do desenho ao primeiro disco.', '<p>Gorillaz nasceu em Londres, em 1998, da parceria entre Damon Albarn e Jamie Hewlett. A música e a identidade visual foram pensadas juntas, com os quatro integrantes virtuais como parte de uma narrativa em expansão.</p><p>O EP Tomorrow Comes Today apareceu em 2000. Em 2001, o álbum Gorillaz apresentou uma mistura de rock, hip-hop, dub e eletrônica, com Clint Eastwood e 19-2000 entre as entradas mais conhecidas para esse universo.</p><p>A história real é a dos artistas, gravações, lançamentos e shows. Na ficção, 2-D, Murdoc, Noodle e Russel vivem suas próprias histórias. <a href="#eras">A linha do tempo separa essas camadas em cada era ↗</a>.</p>', 'Londres, 1998. Albarn e Hewlett começam um projeto em que som, imagem e ficção caminham juntos.'],
  ['Personagens', 'Quatro rostos. Muitas histórias.', '<p>Os integrantes virtuais têm funções, personalidades e trajetórias próprias. A obra é realizada por artistas reais e muitos colaboradores. Nas fichas, as duas camadas aparecem separadas.</p><div class="cards">' + members.map((member, index) => `<button type="button" data-member="${index}">${member.name} ↗</button>`).join('') + '</div><p>As figuras 3D desta experiência são da Phase 7. Elas permanecem as mesmas ao visitar eras anteriores; não representam todos os visuais históricos de cada personagem.</p>', 'Conheça os integrantes virtuais e a relação deles com quem faz a música fora da tela.'],
  ['Identidade', 'A identidade está no encontro.', '<div class="genre-tags"><span>ROCK</span><span>HIP-HOP</span><span>DUB</span><span>ELETRÔNICA</span><span>POP</span></div><p>Gorillaz não depende de um único gênero para ser reconhecível. A voz de Albarn, o desenho de Hewlett, os convidados e a construção audiovisual dão continuidade a trabalhos musicalmente diferentes.</p><p>Capas, clipes e personagens ampliam as músicas. As colaborações fazem parte do processo: de Del the Funky Homosapien e De La Soul a Bobby Womack, Little Dragon e Thundercat, diferentes encontros mudam a paisagem de cada disco.</p>', 'Música, desenho e colaboração constroem uma identidade que muda de forma sem perder o fio.'],
  ['Álbuns', 'Oito discos. Oito portas.', '<div class="album-guide">' + eras.map((era, index) => `<article><span>${era.label}</span><h4>${era.album}</h4><p>${era.title}</p><button type="button" data-era="${index}">LER ESTA ERA ↗</button></article>`).join('') + '</div><p class="editorial-note">Recorte de oito álbuns até 2023. The Fall tem lançamento digital em 2010 e edição física em 2011. EPs, compilações e lançamentos posteriores ficam fora desta seleção.</p>', 'Escolha um disco para conhecer seu contexto e uma sugestão de escuta.'],
  ['Ao vivo', 'Quando o universo encontra o palco.', '<p>Os shows de Gorillaz reúnem músicos reais, vocalistas e convidados. Imagens e projeções conectam o palco aos integrantes virtuais, em formatos que variam entre apresentações e turnês.</p><p>Essa passagem para o palco evidencia a dimensão coletiva do projeto: os personagens dão unidade ao universo visual, enquanto uma equipe de artistas transforma as gravações em performance.</p>', 'Músicos reais, convidados e imagens colocam o universo virtual em contato com o público.'],
  ['Temas', 'O mundo no retrovisor.', '<div class="theme-grid"><article><h4>Solidão e cidade</h4><p>Tomorrow Comes Today oferece uma escuta para a melancolia e a vida urbana.</p></article><article><h4>Consumo e mídia</h4><p>A torre e o moinho de Feel Good Inc. permitem discutir isolamento, aparência e liberdade.</p></article><article><h4>Ambiente e descarte</h4><p>Plastic Beach transforma uma ilha de detritos em cenário. É uma porta para conversar sobre consumo e meio ambiente.</p></article><article><h4>Crença e imagem</h4><p>Cracker Island trabalha uma narrativa de cultos e rituais numa Los Angeles ficcional.</p></article></div><p class="editorial-note">São leituras propostas por este projeto. Uma canção ou imagem pode permitir interpretações diferentes; os temas não explicam sozinhos toda a obra.</p>', 'Uma proposta de leitura sobre cidade, consumo, meio ambiente e as imagens em que escolhemos acreditar.'],
  ['Projeto', 'Uma estrada feita por nós.', '<p>Projeto acadêmico de <strong>Eduardo Alves Xavier</strong>, <strong>Gedson de Souza Mancio Júnior</strong> e <strong>Rafael Machado Colnaghi</strong>.</p><p>O circuito reúne oito eras e nove pontos de vista sobre a banda. As cores das eras e o moinho provisório são interpretações do projeto. O Geep aproxima a viagem da iconografia de 19-2000; o moinho remete à ideia visual de Feel Good Inc.</p><p>Os modelos Phase 7 foram publicados por Redtricity, que os atribui ao Gorillaz, com CC BY 4.0 indicada na fonte. O Geep é de shabaev, sob CC BY 4.0. <a href="#backstage">Créditos, arquivos e adaptações estão nos bastidores ↗</a>.</p>', 'Uma experiência acadêmica que usa a estrada para conectar música, contexto e personagens.'],
  ['Fontes', 'A viagem continua na pesquisa.', '<p>Este percurso cobre 1998–2023. A seleção separa fatos da produção musical, a narrativa dos personagens e as interpretações do projeto.</p><ul class="history-sources">' + sources.map(source => `<li><a href="${source.url}" target="_blank" rel="noopener noreferrer">${source.label} ↗</a><p>${source.detail}</p></li>`).join('') + '</ul><p>Os links são referências para consulta e atualização. A atribuição dos arquivos 3D está nos <a href="#backstage">créditos e modelos</a>. Projeto acadêmico independente, sem vínculo oficial com Gorillaz.</p>', 'Consulte as fontes e os créditos. História real, ficção e interpretações estão identificadas no percurso.'],
];
const menu = document.querySelector('#stop-menu');
const panel = document.querySelector('#panel');
function renderChapter(index) {
  document.querySelector('#chapter-title').textContent = stops[index][1];
  document.querySelector('#chapter-description').textContent = stops[index][3];
  const era = eras[eraForProgress(position)];
  document.querySelector('#scene-label').textContent = `${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()} · ERA ${era.label}`;
  document.querySelectorAll('#chapter-dock button').forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
}
function selectStop(index, travel = false, automatic = false) {
  if (travel) { enterWorld(); destination = nearestDestination(position, index / STOP_COUNT); setTour(false); followingEra = true; }
  if (!automatic) followingRoad = false;
  [...menu.children].forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  panel.setAttribute('aria-labelledby', `stop-${index}`);
  panel.innerHTML = `<span class="eyebrow">PARADA ${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</span><h3>${stops[index][1]}</h3>${stops[index][2]}<button type="button" class="drive-to-stop">IR A ESTA PARADA NA ESTRADA ↗</button>`;
  for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
  for (const button of panel.querySelectorAll('[data-era]')) button.addEventListener('click', () => { selectEra(Number(button.dataset.era)); document.querySelector('#eras').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); });
  panel.querySelector('.drive-to-stop').addEventListener('click', () => { selectStop(index, true); sceneSection.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'}); });
}
function selectEra(index, {automatic = false} = {}) {
  selectedEraIndex = index;
  if (!automatic) { followingEra = false; manualTrack = false; }
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
  waypoint.setAttribute('aria-label', `Viajar para ${name}`); waypoint.setAttribute('aria-controls', 'panel');
  waypoint.addEventListener('click', () => selectStop(index, true)); document.querySelector('#chapter-dock').append(waypoint);
});
selectStop(0, false, true);

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
  enterWorld(); setTour(false); destination = nearestDestination(position, selectedEraIndex / eras.length); followingEra = false;
  sceneSection.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'});
});
document.querySelector('#era-listen').addEventListener('click', () => { manualTrack = false; setTrack(tracks.findIndex(track => track.id === eras[selectedEraIndex].track)); });
document.querySelector('#reset-journey').addEventListener('click', () => {
  stop(); setTour(false); position = 0; destination = null; encounter = null; discovered.clear(); updateDiscovery(); followingRoad = true; followingEra = true; manualTrack = false;
  setShowcase(true); world?.resetCamera(); resetViewControls();
  selectStop(0); followingRoad = true; selectEra(0); followingEra = true; persistJourney(); document.querySelector('#announcement').textContent = 'Viagem reiniciada. Nenhum personagem encontrado.';
});
document.addEventListener('click', event => {
  const anchor = event.target.closest('a[href^="#"]'); if (!anchor) return;
  const id = anchor.getAttribute('href').slice(1); if (!id) return;
  const target = document.getElementById(id); const disclosure = target?.closest('details'); if (disclosure) disclosure.open = true;
});
updateDiscovery(); selectEra(eraForProgress(position), {automatic:true});

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
  previewSlot.replaceChildren(); stop(); cooldown = performance.now() + 700;
  modelPreviousFocus?.focus({preventScroll:true});
});
