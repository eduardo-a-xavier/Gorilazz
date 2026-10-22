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
let position = .04;
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
  stop(); previousFocus = document.activeElement;
  document.querySelector('#portrait').innerHTML = portrait(member, index);
  document.querySelector('#character-name').textContent = member.name;
  document.querySelector('#character-role').textContent = member.role;
  document.querySelector('#character-description').textContent = member.description;
  document.querySelector('#character-song').textContent = member.song;
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
  const width = road.clientWidth;
  const carWidth = car.offsetWidth;
  const maxPosition = Math.max(0, 1 - carWidth / width);
  position = Math.min(position, maxPosition);
  if (!dialog.open && width > 0) {
    const direction = Math.sign([...held].reduce((sum, key) => sum + directionFor(key), 0) + [...pointers.values()].reduce((sum, value) => sum + value, 0));
    position = Math.max(0, Math.min(maxPosition, position + direction * 260 * delta / width));
    const center = position * width + carWidth / 2;
    const nearby = members.findIndex(member => Math.abs(member.position * width - center) < carWidth * .43 + actors[0].offsetWidth * .3);
    if (encounter !== null && nearby !== encounter) encounter = null;
    if (direction && nearby >= 0 && nearby !== encounter && time >= cooldown) openMember(nearby, true);
  }
  car.style.transform = `translateX(${position * width}px)`;
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
function selectStop(index) {
  [...menu.children].forEach((button, number) => button.setAttribute('aria-current', String(index === number)));
  panel.setAttribute('aria-labelledby', `stop-${index}`);
  panel.innerHTML = `<span class="eyebrow">PARADA ${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</span><h3>${stops[index][1]}</h3>${stops[index][2]}`;
  for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
}
stops.forEach(([name], index) => {
  const button = document.createElement('button'); button.type = 'button'; button.id = `stop-${index}`;
  button.setAttribute('aria-controls', 'panel'); button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${name.toUpperCase()}`;
  button.addEventListener('click', () => selectStop(index)); menu.append(button);
});
selectStop(0);
