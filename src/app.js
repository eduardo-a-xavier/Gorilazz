const members = [
  { name: '2-D', role: 'Voz e teclados', skin: '#e2d8c0', hair: '#3a68d8', shirt: '#f2559c', position: .22, description: 'Stuart Pot, conhecido como 2-D, é a voz da banda virtual. Seu cabelo azul e olhos escuros compõem sua identidade visual. Sua personalidade sensível contrasta com o caos ao redor.', song: 'Tomorrow Comes Today' },
  { name: 'Murdoc', role: 'Baixo', skin: '#91a568', hair: '#141414', shirt: '#373737', position: .44, description: 'Murdoc Niccals é o baixista e autoproclamado líder da banda. Provocador e ligado ao rock, está no centro de várias histórias do universo Gorillaz.', song: 'Feel Good Inc.' },
  { name: 'Noodle', role: 'Guitarra', skin: '#e2d8c0', hair: '#141414', shirt: '#3a68d8', position: .65, description: 'Noodle é a guitarrista japonesa da banda. Sua trajetória atravessa as eras visuais de Gorillaz, combinando mistério, independência e energia.', song: 'DARE' },
  { name: 'Russel', role: 'Bateria', skin: '#986b50', hair: '#141414', shirt: '#e2d8c0', position: .86, description: 'Russel Hobbs é o baterista. Sua conexão com o hip-hop e o sobrenatural faz parte da narrativa da banda.', song: 'Clint Eastwood' },
];
function portrait(member, index) {
  return `<svg viewBox="0 0 70 110" aria-hidden="true"><path d="M22 76 18 108M47 76l5 32" stroke="#141414" stroke-width="10"/><path d="M${index === 3 ? 10 : 17} 79V54Q35 36 ${index === 3 ? 60 : 53} 54v25Z" fill="${member.shirt}" stroke="#141414" stroke-width="3"/><path d="M18 55 8 80m45-25 9 25" stroke="${member.skin}" stroke-width="8"/><ellipse cx="35" cy="28" rx="${index === 3 ? 24 : 19}" ry="24" fill="${member.skin}" stroke="#141414" stroke-width="3"/><path d="M15 24 13 7 26 9 34 0 41 9 56 5 54 30 44 15 34 21 26 15Z" fill="${member.hair}"/><g fill="#141414"><ellipse cx="27" cy="29" rx="4" ry="5"/><ellipse cx="43" cy="29" rx="4" ry="5"/></g><path d="m28 42 15-2" stroke="#141414" stroke-width="2"/></svg>`;
}
const road = document.querySelector('#road');
const car = document.querySelector('#car');
const dialog = document.querySelector('#character-dialog');
const pow = document.querySelector('#pow');
const discovered = new Set();
const held = new Set();
const pointers = new Map();
let position = 0;
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
  document.querySelector('#paradas').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'});
  document.querySelector('#panel').focus({preventScroll:true});
});
const bandToggle = document.querySelector("#band-toggle");
function setShowcase(value) { showcase = value; bandToggle.setAttribute("aria-pressed", String(value)); }
bandToggle.addEventListener("click", () => { setTour(false); destination = null; setShowcase(!showcase); });
let world = null;
document.querySelector('#zoom-in').addEventListener('click', () => world?.zoomBy(-.15));
document.querySelector('#zoom-out').addEventListener('click', () => world?.zoomBy(.15));
document.querySelector('#reset-camera').addEventListener('click', () => world?.resetCamera());
let routeIndex = -1;
let musicSector = -1;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const tourButton = document.querySelector('#tour-toggle');
function setTour(value) {
  touring = value; tourButton.setAttribute('aria-pressed', String(value));
  tourButton.textContent = value ? 'Ⅱ PAUSAR TOUR' : '▶ TOUR AUTOMÁTICO';
}
tourButton.addEventListener('click', () => { enterWorld(); destination = null; if (position >= .999) position = 0; setTour(!touring); });
document.querySelector('#camera-toggle').addEventListener('click', event => {
  orbital = !orbital; event.currentTarget.setAttribute('aria-pressed', String(orbital));
  event.currentTarget.textContent = orbital ? '↗ CÂMERA DE VIAGEM' : '↻ CÂMERA ORBITAL';
});
import('./scene.js').then(({createWorld}) => {
  world = createWorld(document.querySelector('#world'), index => openMember(index));
  document.querySelector('.world-shell').classList.add('has-3d');
  document.querySelector('#render-status').textContent = '3D EM TEMPO REAL / ARTE AUTORAL';
}).catch(error => {
  console.warn('Modo 2D ativado:', error.message);
  document.querySelector('#render-status').textContent = 'MODO 2D / WebGL indisponível';
  for (const button of document.querySelectorAll('.camera-tools button, #camera-toggle, #band-toggle')) button.disabled = true;
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
  if (dialog.open) return;
  const member = members[index];
  dialog.dataset.collision = String(collision);
  stop(); setTour(false); destination = null; previousFocus = document.activeElement;
  document.querySelector('#portrait').innerHTML = portrait(member, index);
  document.querySelector('#character-name').textContent = member.name;
  document.querySelector('#character-role').textContent = member.role;
  document.querySelector('#character-description').textContent = member.description;
  document.querySelector('#character-song').textContent = member.song;
  setTrack([1, 2, 3, 0][index]);
  document.querySelector('#character-listen').href = `https://www.youtube.com/watch?v=${tracks[trackIndex].video}`;
  if (!discovered.has(index)) {
    discovered.add(index); actors[index].classList.add('discovered');
    document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
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
  if (dialog.open || inputTarget(event.target) || event.ctrlKey || event.metaKey || event.altKey) return;
  if (directionFor(event.key)) { event.preventDefault(); held.add(event.key); }
});
window.addEventListener('keyup', event => held.delete(event.key));
window.addEventListener('blur', stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
for (const button of document.querySelectorAll('[data-direction]')) {
  button.addEventListener('pointerdown', event => {
    if (dialog.open || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); button.focus({ preventScroll: true });
    button.setPointerCapture(event.pointerId); pointers.set(event.pointerId, Number(button.dataset.direction));
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, event => pointers.delete(event.pointerId));
  button.addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key) && !dialog.open) { event.preventDefault(); pointers.set(button, Number(button.dataset.direction)); }
  });
  button.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); pointers.delete(button); } });
  button.addEventListener('blur', () => pointers.delete(button));
}
function frame(time) {
  const delta = lastTime === undefined ? 0 : Math.min((time - lastTime) / 1000, .05); lastTime = time;
  let moving = false;
  if (!dialog.open && !document.hidden) {
    const direction = Math.sign([...held].reduce((sum, key) => sum + directionFor(key), 0) + [...pointers.values()].reduce((sum, value) => sum + value, 0));
    if (direction) { enterWorld(); destination = null; setTour(false); }
    const previous = position;
    if (destination !== null) {
      const difference = destination - position;
      if (Math.abs(difference) < .002) { position = destination; destination = null; }
      else position += Math.sign(difference) * Math.min(Math.abs(difference), delta * .17);
    } else position += (direction || (touring ? 1 : 0)) * delta * .035;
    position = Math.max(0, Math.min(1, position));
    if (position >= 1) setTour(false);
    moving = Math.abs(previous - position) > .000001;
    if (moving) { enterWorld(); setShowcase(false); }
    const nearby = members.findIndex(member => Math.abs(member.position - position) < .009);
    if (encounter !== null && nearby !== encounter) encounter = null;
    if (moving && destination === null && nearby >= 0 && nearby !== encounter && time >= cooldown) openMember(nearby, true);
  }
  const currentRoute = Math.min(8, Math.round(position * 8));
  if (currentRoute !== routeIndex) {
    routeIndex = currentRoute; selectStop(currentRoute, false);
    document.querySelector('#scene-label').textContent = `${String(currentRoute + 1).padStart(2, '0')} / ${stops[currentRoute][0].toUpperCase()}`;
  }
  const sector = Math.min(7, Math.floor(position * 8));
  if (sector !== musicSector) { musicSector = sector; setTrack(sector); }
  document.querySelector('#trip-distance').textContent = `KM ${String(Math.round(position * 112)).padStart(3, '0')}`;
  document.querySelector('#trip-progress').style.width = `${position * 100}%`;
  document.querySelector('#radio').classList.toggle('playing', moving && !reducedMotion.matches);
  if (world) world.update(position, time, moving, orbital, reducedMotion.matches, showcase);
  const width = road.clientWidth; car.style.transform = `translateX(${position * Math.max(0, width - car.offsetWidth)}px)`;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
const stops = [
  ['Início', 'Siga o som.', '<p>Uma viagem pelo universo Gorillaz. Use ← / → ou A / D, ou segure os botões na tela. Encontre os personagens para abrir suas fichas. A colisão é cartunesca: um encontro, um POW!, uma nova história.</p><p>Prefere explorar sem dirigir? A parada Personagens oferece todas as fichas. As nove paradas estão sempre disponíveis.</p>'],
  ['História', 'Uma banda além do real.', '<p>Criada em Londres, em 1998, por Damon Albarn e Jamie Hewlett, Gorillaz reúne música e um universo de personagens animados. O primeiro álbum, Gorillaz, chegou em 2001.</p>'],
  ['Personagens', 'Quatro rostos. Muitas histórias.', '<p>Abra uma ficha para conhecer cada integrante. Não é necessário jogar para acessar as informações.</p><div class="cards">' + members.map((member, index) => `<button type="button" data-member="${index}">${member.name} ↗</button>`).join('') + '</div>'],
  ['Identidade', 'Sem fronteiras sonoras.', '<p>Rock, hip-hop, eletrônico e dub convivem na identidade de Gorillaz. Música, animação, narrativa, capas e clipes constroem um universo que se transforma a cada era.</p>'],
  ['Álbuns', 'Uma discografia em movimento.', '<ul class="albums">' + [['Gorillaz',2001],['Demon Days',2005],['Plastic Beach',2010],['The Fall',2010],['Humanz',2017],['The Now Now',2018],['Song Machine, Season One',2020],['Cracker Island',2023]].map(([name, year]) => `<li>${name}<small>${year}</small></li>`).join('') + '</ul><p>Recorte inicial até 2023. Este conteúdo precisa de revisão e atualização para incluir lançamentos posteriores.</p>'],
  ['Ao vivo', 'Do desenho ao palco.', '<p>Nos shows, músicos reais e convidados dão vida ao repertório. Projeções e imagens dos personagens conectam a performance ao universo visual da banda, em formatos que variam entre turnês.</p>'],
  ['Temas', 'O mundo no retrovisor.', '<p>Solidão, consumo, tecnologia e meio ambiente atravessam o universo da banda. Plastic Beach, por exemplo, usa a imagem de uma ilha de resíduos para abordar questões ambientais e o consumo.</p>'],
  ['Projeto', 'Uma estrada feita por nós.', '<p>Projeto acadêmico de <strong>Eduardo Alves Xavier</strong>, <strong>Gedson de Souza Mancio Júnior</strong> e <strong>Rafael Machado Colnaghi</strong>.</p><p>A estrada conecta nove paradas temáticas. O carro e as figuras esquemáticas são interpretações autorais para este protótipo, sem uso de arte oficial.</p>'],
  ['Fontes', 'Respeito às origens.', '<p>Crédito ao universo criado por Jamie Hewlett e Damon Albarn. Consulte o <a href="https://www.gorillaz.com/" target="_blank" rel="noopener noreferrer">site oficial de Gorillaz ↗</a>.</p><p>Projeto acadêmico independente, sem vínculo oficial. As figuras deste protótipo são esquemáticas e autorais; os textos são introdutórios e devem ser revisados para uso acadêmico final.</p>'],
];
const menu = document.querySelector('#stop-menu');
const panel = document.querySelector('#panel');
function selectStop(index, travel = true) {
  if (travel) { enterWorld(); destination = index / 8; setTour(false); }
  document.querySelectorAll('#chapter-dock button').forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  document.querySelector('#chapter-title').textContent = stops[index][1];
  const chapterCopy = document.createElement('div'); chapterCopy.innerHTML = stops[index][2];
  document.querySelector('#chapter-description').textContent = (chapterCopy.querySelector('p')?.textContent ?? 'Explore os discos e as histórias que constroem este universo.').split('. ').slice(0, 2).join('. ').replace(/\.*$/, '.');
  [...menu.children].forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  panel.setAttribute('aria-labelledby', `stop-${index}`);
  panel.innerHTML = `<span class="eyebrow">PARADA ${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</span><h3>${stops[index][1]}</h3>${stops[index][2]}`;
  for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
}
stops.forEach(([name], index) => {
  const button = document.createElement('button'); button.type = 'button'; button.id = `stop-${index}`;
  button.setAttribute('aria-controls', 'panel'); button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${name.toUpperCase()}`;
  button.addEventListener('click', () => selectStop(index)); menu.append(button);
  const waypoint = document.createElement('button'); waypoint.type = 'button'; waypoint.textContent = String(index + 1).padStart(2, '0');
  waypoint.setAttribute('aria-label', `Viajar para ${name}`); waypoint.setAttribute('aria-controls', 'panel');
  waypoint.addEventListener('click', () => selectStop(index)); document.querySelector('#chapter-dock').append(waypoint);
});
selectStop(0, false);

const tracks = [
  { name: 'Clint Eastwood', album: 'Gorillaz', year: 2001, video: '1V_xRb0x9aw', text: 'O ponto de partida: hip-hop, dub e um refrão que atravessa gerações.', color: '#a9b775' },
  { name: 'Tomorrow Comes Today', album: 'Gorillaz', year: 2001, video: 'PiNdcBg3xC8', text: 'A voz de 2-D em uma Londres de animação, melancolia e batidas arrastadas.', color: '#7fa6ff' },
  { name: 'Feel Good Inc.', album: 'Demon Days', year: 2005, video: 'HyHNuVaZJ-k', text: 'Um baixo inconfundível. Uma torre isolada. O encontro entre crítica, hip-hop e pop.', color: '#f2559c' },
  { name: 'DARE', album: 'Demon Days', year: 2005, video: 'uAOR6ib95kQ', text: 'Noodle no centro da cena: uma parada para o lado mais dançante da banda.', color: '#bc9df5' },
  { name: 'On Melancholy Hill', album: 'Plastic Beach', year: 2010, video: '04mfKJWDSzI', text: 'Sintetizadores e uma paisagem distante. Bem-vindo ao arquipélago de Plastic Beach.', color: '#62c5bd' },
  { name: 'Stylo', album: 'Plastic Beach', year: 2010, video: 'nhPaWIeULKk', text: 'Uma perseguição pela estrada. A conexão perfeita entre música e esta viagem.', color: '#ef9a65' },
  { name: 'Saturnz Barz', album: 'Humanz', year: 2017, video: '5qJp6xlKEug', text: 'Outra dimensão do universo Gorillaz, com a participação de Popcaan.', color: '#af8fce' },
  { name: 'Cracker Island', album: 'Cracker Island', year: 2023, video: 'S03T47hapAc', text: 'Uma nova paisagem sonora, com Thundercat. O fim deste percurso é só outra entrada.', color: '#f2559c' },
];
let trackIndex = 0;
function setTrack(index) {
  trackIndex = (index + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  document.querySelector('#radio-title').textContent = track.name;
  document.querySelector('#track-album').textContent = `${track.album} · ${track.year}`;
  document.querySelector('#track-description').textContent = track.text;
  document.querySelector('#track-number').textContent = `${String(trackIndex + 1).padStart(2, '0')} — 08`;
  document.querySelector('#listen-link').href = `https://www.youtube.com/watch?v=${track.video}`;
  document.querySelector('#radio').style.setProperty('--record-color', track.color);
  document.querySelector('#video-slot').replaceChildren();
  document.querySelector('#play-track').textContent = '▶ ABRIR CLIPE';
}
document.querySelector('#previous-track').addEventListener('click', () => setTrack(trackIndex - 1));
document.querySelector('#next-track').addEventListener('click', () => setTrack(trackIndex + 1));
document.querySelector('#play-track').addEventListener('click', () => {
  const slot = document.querySelector('#video-slot');
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
  button.innerHTML = `<div class="band-portrait">${portrait(member, index)}</div><span class="eyebrow">0${index + 1} / ${member.role.toUpperCase()}</span><strong>${member.name}</strong><span>CONHEÇA A HISTÓRIA ↗</span>`;
  button.addEventListener('click', () => openMember(index)); document.querySelector('#band-grid').append(button);
});
setTrack(0);
