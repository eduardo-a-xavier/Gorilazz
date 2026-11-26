// Conteúdo editorial: fichas de integrantes, descobertas, diário, 9 paradas temáticas e 8 eras.
import { eras, tracks, sources, memberStories, trackById, listeningUrl, thematicStops, roadDiscoveryLore } from './content.js';
import { MEMBER_STOPS } from './route.js';
import { CITY_ERAS, DISCOVERIES, MEMBER_LOCATIONS, REGIONS, eraAt } from './world-data.js';
import { createVehicle } from './driving.js';
import { createEraArchive } from './discoveries.js';
import { numericShortcutIndex } from './input.js';
import { attachCardSpinners } from './member-viewer.js';
import { discoveryIndexForEra, eraNavState } from './era-places.js';
import { artForDiscovery, creditLine } from './art-panels.js';

export const MEMBER_ACCENTS = ['#7fa6ff', '#9dd66b', '#f5a9c6', '#ffcc4d'];
const memberKeys = ['twod', 'murdoc', 'noodle', 'russel'];

export function createMembersData() {
  const list = [
    { name: '2-D', role: 'Voz', skin: '#e2d8c0', hair: '#3a68d8', shirt: '#f2559c', position: MEMBER_STOPS[0], description: 'Stuart Pot, conhecido como 2-D, é a voz da banda virtual. Seu cabelo azul e olhos escuros compõem sua identidade visual. Sua personalidade sensível contrasta com o caos ao redor.', song: 'Tomorrow Comes Today' },
    { name: 'Murdoc', role: 'Baixo', skin: '#91a568', hair: '#141414', shirt: '#373737', position: MEMBER_STOPS[1], description: 'Murdoc Niccals é o baixista e autoproclamado líder da banda. Provocador e ligado ao rock, está no centro de várias histórias do universo Gorillaz.', song: 'Feel Good Inc.' },
    { name: 'Noodle', role: 'Guitarra', skin: '#e2d8c0', hair: '#141414', shirt: '#3a68d8', position: MEMBER_STOPS[2], description: 'Noodle é a guitarrista japonesa da banda. Sua trajetória atravessa as eras visuais de Gorillaz, combinando mistério, independência e energia.', song: 'DARE' },
    { name: 'Russel', role: 'Bateria', skin: '#986b50', hair: '#141414', shirt: '#e2d8c0', position: MEMBER_STOPS[3], description: 'Russel Hobbs é o baterista. Sua conexão com o hip-hop e o sobrenatural faz parte da narrativa da banda.', song: 'Clint Eastwood' },
  ];
  list.forEach((member, index) => Object.assign(member, memberStories[index], { song: trackById(memberStories[index].track).name }));
  return list;
}

function memberPhoto(index) { return `<img src="./assets/portraits/phase7-${memberKeys[index]}.png" alt="" width="384" height="512" loading="lazy">`; }
function portrait(member, index) {
  return `<svg viewBox="0 0 70 110" aria-hidden="true"><path d="M22 76 18 108M47 76l5 32" stroke="#141414" stroke-width="10"/><path d="M${index === 3 ? 10 : 17} 79V54Q35 36 ${index === 3 ? 60 : 53} 54v25Z" fill="${member.shirt}" stroke="#141414" stroke-width="3"/><path d="M18 55 8 80m45-25 9 25" stroke="${member.skin}" stroke-width="8"/><ellipse cx="35" cy="28" rx="${index === 3 ? 24 : 19}" ry="24" fill="${member.skin}" stroke="#141414" stroke-width="3"/><path d="M15 24 13 7 26 9 34 0 41 9 56 5 54 30 44 15 34 21 26 15Z" fill="${member.hair}"/><g fill="#141414"><ellipse cx="27" cy="29" rx="4" ry="5"/><ellipse cx="43" cy="29" rx="4" ry="5"/></g><path d="m28 42 15-2" stroke="#141414" stroke-width="2"/></svg>`;
}

export function createEditorialUI({
  members,
  vehicle,
  journal,
  discovered,
  sceneSection,
  reducedMotion,
  modalOpen,
  stop,
  setPreviousFocus,
  restoreFocus,
  persistJourney,
  announce,
  audio,
  memberView,
  startNavigation,
  getWorld,
  setShowcase,
  resetViewControls,
  getArtManifest,
}) {
  const dialog = document.querySelector('#character-dialog');
  const discoveryDialog = document.querySelector('#discovery-dialog');
  const journalDialog = document.querySelector('#journal-dialog');
  let selectedEraIndex = 0;
  let resetArmed = false, resetJourneyArmed = false, journalNextAction = null;

  const actors = members.map((member, index) => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'person'; button.style.left = `${member.position * 100}%`;
    button.setAttribute('aria-label', `Abrir ficha de ${member.name}`); button.innerHTML = `${portrait(member, index)}<span>${member.name}</span>`;
    button.addEventListener('click', () => openMember(index)); document.querySelector('#characters').append(button); return button;
  });

  function openMember(index) {
    if (modalOpen()) return;
    stop(); setPreviousFocus(document.activeElement);
    const member = members[index]; dialog.dataset.collision = 'false';
    document.querySelector('#portrait').innerHTML = memberPhoto(index);
    document.querySelector('#portrait img').addEventListener('error', () => { document.querySelector('#portrait').innerHTML = portrait(member, index); }, { once: true });
    document.querySelector('#character-name').textContent = member.name;
    document.querySelector('#character-role').textContent = member.role;
    document.querySelector('#character-description').textContent = member.description;
    document.querySelector('#character-song').textContent = member.song;
    document.querySelector('#character-detail').textContent = member.detail;
    audio.setTrack(tracks.findIndex(track => track.id === member.track)); audio.setManualTrack(true);
    document.querySelector('#character-listen').href = listeningUrl(tracks[audio.trackIndex]);
    document.querySelector('#character-piano').hidden = index !== 0;
    memberView.show(index);
    discovered.add(index); actors[index].classList.add('discovered'); persistJourney();
    document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
    announce(`${member.name} encontrado. ${discovered.size} de 4 personagens.`);
    dialog.style.setProperty('--place', MEMBER_ACCENTS[index]);
    dialog.showModal(); dialog.querySelector('.close').focus();
  }
  dialog.querySelector('.close').addEventListener('click', () => dialog.close());
  dialog.querySelector('.return').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', restoreFocus);

  const discoveryFinale = document.createElement('div');
  discoveryFinale.id = 'discovery-finale'; discoveryFinale.hidden = true;
  discoveryFinale.innerHTML = '<p class="eyebrow">PERCURSO COMPLETO / 5 DE 5</p><p>Você passou pela criação da banda, pelos quatro integrantes, pela mistura de gêneros, por Demon Days e pelo palco. O diário guarda as cinco histórias neste navegador.</p><div class="finale-actions"><button type="button" id="finale-journal">Abrir o diário</button><button type="button" id="finale-eras">Ler a história em oito eras</button></div>';
  document.querySelector('#discovery-saved').after(discoveryFinale);
  const afterDiscovery = action => { discoveryDialog.addEventListener('close', action, { once: true }); discoveryDialog.close(); };
  discoveryFinale.querySelector('#finale-journal').addEventListener('click', () => afterDiscovery(() => document.querySelector('#journal-toggle').click()));
  discoveryFinale.querySelector('#finale-eras').addEventListener('click', () => afterDiscovery(() => {
    const heading = document.querySelector('#eras-title'); heading.tabIndex = -1;
    document.querySelector('#eras').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth' }); heading.focus({ preventScroll: true });
  }));

  function openDiscovery(index, collect = true) {
    if (modalOpen()) return;
    stop(); setPreviousFocus(document.activeElement); const point = DISCOVERIES[index];
    const fresh = collect && journal.discover(point.id);
    const place = CITY_ERAS[eraAt(point)]; discoveryDialog.style.setProperty('--place', place.color);
    document.querySelector('#discovery-kind').textContent = `HISTÓRIA ${index + 1} DE ${DISCOVERIES.length} · ${point.kind} / ${point.label} · ATO ${place.act}`;
    document.querySelector('#discovery-title').textContent = point.title;
    const lore = roadDiscoveryLore[point.id];
    document.querySelector('#discovery-text').textContent = lore?.text ?? point.text;
    document.querySelector('#discovery-detail').textContent = lore?.detail ?? point.detail;
    const artCredit = document.querySelector('#discovery-art-credit'); const credit = creditLine(artForDiscovery(getArtManifest(), point.id));
    artCredit.textContent = credit; artCredit.hidden = !credit;
    let dialogPoster = discoveryDialog.querySelector('.dialog-poster');
    if (!dialogPoster) { dialogPoster = document.createElement('div'); dialogPoster.className = 'dialog-poster'; dialogPoster.append(document.createElement('small')); discoveryDialog.querySelector('.close').after(dialogPoster); }
    dialogPoster.hidden = !lore?.cover;
    if (lore?.cover) { dialogPoster.style.setProperty('--dialog-cover', `url('${new URL(lore.cover, document.baseURI).href}')`); dialogPoster.querySelector('small').textContent = lore.coverCredit; }
    document.querySelector('#discovery-source').href = point.source;
    document.querySelector('#discovery-saved').textContent = journal.known.has(point.id) ? (fresh ? '✓ Nova descoberta salva no seu diário.' : '✓ Esta história já está no seu diário.') : 'Consulta livre. Encontre este lugar no mundo para registrar a descoberta.';
    const complete = fresh && journal.known.size === DISCOVERIES.length;
    discoveryFinale.hidden = !complete;
    audio.setTrack(point.track); updateJournal(); discoveryDialog.showModal(); discoveryDialog.querySelector('.close').focus();
    if (complete) announce(`Percurso completo: você encontrou as ${DISCOVERIES.length} descobertas. O diário guarda todas elas.`);
    else if (fresh) announce(`Nova descoberta: ${point.title}. ${journal.known.size} de ${DISCOVERIES.length} descobertas.`);
  }
  discoveryDialog.querySelector('.close').addEventListener('click', () => discoveryDialog.close());
  discoveryDialog.querySelector('.return').addEventListener('click', () => discoveryDialog.close());
  discoveryDialog.addEventListener('close', restoreFocus);

  const eraArchive = createEraArchive(document.querySelector('#era-archive'), point => {
    journalNextAction = () => startNavigation(point); journalDialog.close();
  });

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
    stop(); setPreviousFocus(document.activeElement); updateJournal(); resetArmed = false; document.querySelector('#reset-journal').textContent = 'Reiniciar diário'; journalDialog.showModal(); journalDialog.querySelector('.close').focus();
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
  document.querySelector('#reset-journey').addEventListener('click', event => {
    if (!resetJourneyArmed) { resetJourneyArmed = true; event.currentTarget.textContent = 'Confirmar: reiniciar posição e integrantes'; return; }
    stop(); Object.assign(vehicle, createVehicle()); discovered.clear();
    actors.forEach(actor => actor.classList.remove('discovered'));
    document.querySelector('#counter').textContent = '00 / 04 PERSONAGENS';
    setShowcase(true); audio.setManualTrack(false); getWorld()?.resetCamera(); resetViewControls(); persistJourney();
    resetJourneyArmed = false; event.currentTarget.textContent = 'Reiniciar posição e integrantes';
    announce('Posição e integrantes reiniciados. Seu diário de histórias foi preservado.');
  });

  // 9 paradas temáticas editoriais.
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
    const poster = thematicStops[index];
    panel.innerHTML = `<header class="stop-poster" style="--stop-cover:url('${new URL(poster.cover, document.baseURI).href}');--stop-accent:${poster.accent}"><span class="stop-poster-kicker">${poster.kicker}</span><h3 class="stop-poster-title">${poster.title}</h3><p class="stop-poster-credit">${poster.coverCredit}</p></header><p class="eyebrow">${String(index + 1).padStart(2, '0')} / ${stops[index][0].toUpperCase()}</p><p class="stop-summary">${poster.summary}</p><div class="stop-layer-chips" aria-label="Camadas editoriais desta parada"><span class="layer-chip is-fact">FATO · HISTÓRIA REAL</span><span class="layer-chip is-fiction">FICÇÃO · NARRATIVA VIRTUAL</span><span class="layer-chip is-reading">INTERPRETAÇÃO · LEITURA DO PROJETO</span></div>${stops[index][2]}`;
    for (const button of panel.querySelectorAll('[data-member]')) button.addEventListener('click', () => openMember(Number(button.dataset.member)));
    for (const button of panel.querySelectorAll('[data-era]')) button.addEventListener('click', () => { selectEra(Number(button.dataset.era)); document.querySelector('#eras').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); });
  }

  function selectEra(index, { automatic = false } = {}) {
    selectedEraIndex = (index + eras.length) % eras.length;
    if (!automatic) audio.setManualTrack(false);
    const era = eras[selectedEraIndex];
    document.querySelectorAll('#era-menu button, #era-strip button').forEach(button => { const siblings = [...button.parentElement.children]; button.setAttribute('aria-current', String(siblings.indexOf(button) === selectedEraIndex)); });
    document.querySelector('#era-panel').style.setProperty('--era-color', era.color);
    const counter = document.querySelector('#era-counter');
    if (counter) counter.textContent = `${String(selectedEraIndex + 1).padStart(2, '0')} / ${String(eras.length).padStart(2, '0')}`;
    document.querySelector('#era-kicker').textContent = `${era.label} / ${era.album.toUpperCase()}`;
    document.querySelector('#era-title').textContent = era.title;
    const nav = eraNavState(selectedEraIndex, eras.length);
    for (const [id, enabled] of [['#prev-era', nav.prev], ['#next-era', nav.next]]) {
      const button = document.querySelector(id); if (!button) continue;
      button.disabled = !enabled; button.setAttribute('aria-disabled', String(!enabled));
    }
    const place = DISCOVERIES[discoveryIndexForEra(selectedEraIndex)];
    const driveButton = document.querySelector('#era-drive'); if (driveButton && place) driveButton.textContent = `EXPLORAR: ${place.title} ↗`;
    if (era.cover) {
      let frame = document.querySelector('#era-cover');
      if (!frame) {
        frame = document.createElement('figure'); frame.id = 'era-cover'; frame.className = 'era-cover-frame';
        const image = document.createElement('img'); image.className = 'era-cover-img'; image.width = 132; image.height = 132; image.decoding = 'async';
        const caption = document.createElement('figcaption'); caption.className = 'era-cover-caption';
        frame.append(image, caption);
        document.querySelector('#era-panel .era-columns')?.before(frame);
      }
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
    if (!audio.manualTrack) audio.setTrack(tracks.findIndex(track => track.id === era.track));
  }

  stops.forEach(([name], index) => {
    const button = document.createElement('button'); button.type = 'button'; button.id = `stop-${index}`;
    button.setAttribute('aria-controls', 'panel'); button.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span>${name.toUpperCase()}`;
    button.addEventListener('click', () => selectStop(index)); menu.append(button);
    const waypoint = document.createElement('button'); waypoint.type = 'button'; waypoint.textContent = String(index + 1).padStart(2, '0');
    waypoint.setAttribute('aria-label', `Consultar ${name}`); waypoint.addEventListener('click', () => { stop(); selectStop(index); document.querySelector('#paradas').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' }); });
    document.querySelector('#chapter-dock').append(waypoint);
  });
  selectStop(0);

  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || modalOpen()) return;
    if (event.target.closest('input,select,textarea,button,a,[contenteditable]')) return;
    const index = numericShortcutIndex(event.key, stops.length);
    if (index < 0) return;
    event.preventDefault(); selectStop(index);
    menu.children[index].focus({ preventScroll: true });
    document.querySelector('#paradas').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });

  members.forEach((member, index) => {
    const card = document.createElement('article'); card.className = 'band-card';
    const act = CITY_ERAS[eraAt(MEMBER_LOCATIONS[index])].act;
    card.innerHTML = `<div class="band-portrait">${memberPhoto(index)}</div><div class="band-card-body"><span class="eyebrow">0${index + 1} / ${member.role.toUpperCase()}</span><strong>${member.name}</strong><p class="band-card-meta">Faixa: ${member.song} · Ato ${act}</p><div class="band-card-actions"><button type="button" class="band-story-btn">CONHEÇA A HISTÓRIA <span aria-hidden="true">↗</span></button><button type="button" class="band-road-btn">ENCONTRAR NA ESTRADA <span aria-hidden="true">↗</span></button></div></div>`;
    card.querySelector('img').addEventListener('error', () => { card.querySelector('.band-portrait').innerHTML = portrait(member, index); }, { once: true });
    card.querySelector('.band-portrait').addEventListener('click', () => openMember(index));
    card.querySelector('.band-story-btn').addEventListener('click', () => openMember(index));
    card.querySelector('.band-road-btn').addEventListener('click', () => {
      startNavigation({ ...MEMBER_LOCATIONS[index], title: member.name });
      sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    });
    document.querySelector('#band-grid').append(card);
  });
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
    if (index < 0 || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length;
    buttons[next].focus(); selectEra(next);
  });

  const eraStrip = document.querySelector('#era-strip');
  if (eraStrip) eraStrip.replaceChildren(...eras.map((era, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', `${era.label}: ${era.album}`);
    const image = document.createElement('img'); image.src = era.cover; image.alt = ''; image.width = 44; image.height = 44; image.decoding = 'async';
    button.append(image);
    button.addEventListener('click', () => { selectEra(index); document.querySelector('#era-panel').scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' }); });
    return button;
  }));

  document.querySelector('#era-drive').addEventListener('click', () => {
    startNavigation(DISCOVERIES[discoveryIndexForEra(selectedEraIndex)]);
    sceneSection.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  document.querySelector('#era-listen').addEventListener('click', () => { audio.setManualTrack(false); audio.setTrack(tracks.findIndex(track => track.id === eras[selectedEraIndex].track)); });

  actors.forEach((actor, index) => actor.classList.toggle('discovered', discovered.has(index)));
  document.querySelector('#counter').textContent = `${String(discovered.size).padStart(2, '0')} / 04 PERSONAGENS`;
  selectEra(0, { automatic: true });
  updateJournal();

  return { openMember, openDiscovery, eraArchive, updateJournal, selectStop, selectEra };
}
