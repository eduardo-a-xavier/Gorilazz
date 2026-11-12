import { CITY_ERAS, ERA_GATES, regionAt, DISCOVERIES, MEMBER_LOCATIONS, distance, clearPath } from './world-data.js';
const KEY = 'gorilazz-discoveries-v1';
export function createJournal(storage) {
  const known = new Set();
  try { const saved = JSON.parse(storage?.getItem(KEY) || '[]'); if (Array.isArray(saved)) for (const id of saved) if (DISCOVERIES.some(d => d.id === id)) known.add(id); } catch { /* Storage is optional. */ }
  function persist() { try { storage?.setItem(KEY, JSON.stringify([...known])); } catch { /* Keep the in-memory journal. */ } }
  return { known, discover(id) { if (!DISCOVERIES.some(d => d.id === id)) return false; const fresh = !known.has(id); known.add(id); persist(); return fresh; }, reset() { known.clear(); persist(); } };
}
export function nearbyInteraction(vehicle) {
  const choices = [
    ...DISCOVERIES.map((point, index) => ({ ...point, type: 'discovery', index })),
    ...MEMBER_LOCATIONS.map((point, index) => ({ ...point, type: 'member', index, title: ['2-D', 'Murdoc', 'Noodle', 'Russel'][index] })),
  ].filter(point => distance(vehicle, point) < 13 && clearPath(vehicle, point.type === 'member' ? { x: point.x + (vehicle.x - point.x) * .4, z: point.z + (vehicle.z - point.z) * .4 } : point));
  choices.sort((a, b) => distance(vehicle, a) - distance(vehicle, b));
  return choices[0] || null;
}


const recordings = {
  explosao: {
    object: 'O televisor de Kong',
    studio: 'Segundo a imprensa, Damon Albarn e Jamie Hewlett imaginaram uma banda de desenho enquanto dividiam um apartamento no oeste de Londres; Gorillaz surgiu em 1998. O EP Tomorrow Comes Today apresentou os personagens em 2000. No palco da primeira turnê, os músicos tocavam atrás de uma tela.',
    fiction: 'Em Clint Eastwood, Russel cai no chão e o fantasma de Del sai de seu corpo para rimar. Enquanto o público ouve um convidado na gravação, o clipe inventa um jeito de fazê-lo entrar na banda.',
    cue: 'Em Feel Good Inc., repare na distância entre a torre de 2-D e o moinho de Noodle. O próximo bairro leva essa ideia de um lugar isolado até o oceano.',
  },
  plastic: {
    object: 'A boia de Plastic Beach',
    studio: 'Em 2010, Plastic Beach reuniu vozes como Bobby Womack e Lou Reed. Durante a turnê, Albarn usou um iPad para gravar The Fall. Um disco nasceu de encontros em estúdio, o outro guardou o som da estrada.',
    fiction: 'Murdoc instala um estúdio numa ilha de resíduos no Pacífico. Ao lado dele aparece Cyborg Noodle, a substituta mecânica da guitarrista. O rosa da praia dá à ilha uma beleza estranha para um lugar feito de lixo.',
    cue: 'Ouça Stylo e depois uma faixa de The Fall. O que muda quando o estúdio passa a caber na bagagem?',
  },
  hiato: {
    object: 'A janela fechada',
    studio: 'Em 2012, DoYaThing juntou Albarn, James Murphy e André 3000. Depois veio uma pausa na parceria de Albarn e Hewlett. A volta exigia que os dois encontrassem espaço tanto para os desenhos quanto para o palco.',
    fiction: 'O clipe de DoYaThing visita uma casa compartilhada. 2-D sai da cama, anda pela cozinha e cruza com os outros moradores. Depois da escala de Plastic Beach, até uma manhã doméstica rende uma história.',
    cue: 'Compare a cozinha do clipe com a ilha do bairro anterior. Aqui a mudança de escala também aparece nas fachadas fechadas da rua.',
  },
  reinvencao: {
    object: 'A antena de transmissão',
    studio: 'Humanz marcou a volta em 2017. Vieram The Now Now, os lançamentos em episódios de Song Machine e Cracker Island. Em 2026, The Mountain reuniu gravações de diferentes gerações de colaboradores.',
    fiction: 'Na época de The Now Now, Ace assume o baixo enquanto Murdoc está preso. Em Song Machine, os convidados passam pelo estúdio dos personagens. A troca de integrantes e visitas vira parte da narrativa.',
    cue: 'Volte ao televisor do primeiro bairro. Entre aquele telão de turnê e os episódios de Song Machine, quem passou a aparecer ao lado dos desenhos?',
  },
};

export const archiveStops = ERA_GATES.map(gate => {
  const era = CITY_ERAS[gate.era];
  const entry = recordings[era.id];
  return { ...gate, ...entry, id: era.id, title: entry.object, region: regionAt(gate), era };
});

export function createEraArchive(container, onDrive) {
  const pages = archiveStops.map(stop => {
    const page = document.createElement('details');
    page.name = 'archive-act';
    page.style.setProperty('--act-color',stop.era.color);
    const summary = document.createElement('summary');
    summary.textContent = stop.era.years + ' · ' + stop.title;
    page.append(summary);
    for (const [heading, text] of [['Na gravação',stop.studio],['No universo da banda',stop.fiction],['Para reparar',stop.cue]]) {
      const label = document.createElement('h4'), body = document.createElement('p');
      label.textContent = heading; body.textContent = text; page.append(label,body);
    }
    const drive = document.createElement('button');
    drive.type = 'button'; drive.textContent = 'Dirigir até o portal';
    drive.onclick = () => onDrive(stop);
    page.append(drive); container.append(page);
    return page;
  });
  return { open(index) { pages[index].open = true; pages[index].querySelector('summary').focus(); } };
}
