// Fichas verificadas da Central de Descobertas (9 paradas, recorte 1998–2023).
// Separação explícita entre fatos reais de produção e elementos ficcionais (lore) da banda.
// Auditoria editorial completa em docs/gestao/descobertas-fichas.md e fontes em REFERENCES.md.

export const DISCOVERY_LORE = [
  {
    id: 'mtv-origin',
    stopId: 'beginning',
    title: 'O surgimento frente à MTV',
    period: '1998–2000',
    text: 'No fim dos anos 1990, Damon Albarn e Jamie Hewlett dividiram apartamento em Londres e, incomodados com a superficialidade da TV musical da época, imaginaram uma banda animada para comentar a indústria pop. O projeto não foi a primeira banda animada da história, mas renovou o formato ao unir anonimato criativo, quadrinhos e mistura de gêneros. A estreia fonográfica oficial veio em novembro de 2000, com o EP Tomorrow Comes Today.',
    tags: ['Eras', 'Bastidores'],
    keywords: ['Jamie Hewlett', 'Damon Albarn', 'MTV'],
    source: {
      url: 'https://www.theguardian.com/friday_review/story/0,,452238,00.html',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'kong-studios',
    stopId: 'era-explosao',
    title: 'Kong Studios, o QG interativo',
    period: '2000–2001',
    text: 'Na ficção da banda, Kong Studios é um quartel-general assombrado no topo de uma colina em Essex, na Inglaterra, povoado por zumbis e corredores sinistros. No mundo real, o estúdio ganhou vida como um site interativo em Macromedia Flash desenvolvido por Mat Wakeham com a equipe Zombie Flesh Eaters e Jamie Hewlett. Os visitantes exploravam quartos, salas secretas, mixers de áudio e minigames — inspiração direta para a navegação deste projeto.',
    tags: ['Eras', 'Bastidores'],
    keywords: ['Kong Studios', 'Essex', 'Flash'],
    source: {
      url: 'https://www.nme.com/features/inside-the-lost-gaming-history-of-gorillaz-3478233',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'geep-19-2000',
    stopId: 'live',
    title: 'O Geep e a gravação de 19-2000',
    period: '2001',
    text: 'No videoclipe animado de 19-2000, o quarteto percorre uma autoestrada suspensa cheia de obstáculos a bordo do buggy conhecido como Geep, dirigido por Murdoc. Nos bastidores reais da gravação de estúdio, Tina Weymouth (baixista de Talking Heads e Tom Tom Club) contribuiu com vocais de apoio e percussão adicional ao lado de Chris Frantz e Miho Hatori, segundo entrevistas da imprensa musical e o catálogo AllMusic. Ela participa da faixa gravada, e não como personagem no clipe.',
    tags: ['Bastidores', 'Eras'],
    keywords: ['Geep', '19-2000', 'Tina Weymouth'],
    source: {
      url: 'https://www.nme.com/features/music-interviews/does-rock-n-roll-kill-braincells-talking-heads-chris-frantz-3353898',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'del-clint-eastwood',
    stopId: 'genres',
    title: 'Del e o sucesso de Clint Eastwood',
    period: '2001',
    text: 'Na vida real, o rapper Del the Funky Homosapien gravou os versos de Clint Eastwood após trabalhar com Damon Albarn e o produtor Dan the Automator em Deltron 3030, levando o single ao 4º lugar nas paradas britânicas. Na ficção do universo Gorillaz, ele aparece como "Del, o Fantasma", espírito de um amigo que emerge do corpo do baterista Russel Hobbs após a perda de amigos em confrontos em Nova York. A faixa consolidou a fusão de hip-hop, pop e dub que define a banda.',
    tags: ['Personagens', 'Bastidores'],
    keywords: ['Clint Eastwood', 'Del', 'Russel'],
    source: {
      url: 'https://www.theguardian.com/theobserver/2001/mar/11/featuresreview.review2',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'demon-days-grammy',
    stopId: 'demon-days',
    title: 'Demon Days, o moinho e o Grammy',
    period: '2005–2006',
    text: 'Em Demon Days (2005), o moinho flutuante guiado por Noodle nos clipes de Feel Good Inc. e El Mañana funciona, na narrativa visual, como símbolo de refúgio diante da torre sombria e sufocante da cidade. No mundo real, Feel Good Inc. — parceria com o trio de hip-hop De La Soul — tornou-se um dos maiores sucessos da carreira do grupo. A faixa rendeu ao Gorillaz e ao De La Soul o Grammy 2006 de Melhor Colaboração Pop com Vocais (48ª edição).',
    tags: ['Eras', 'Bastidores'],
    keywords: ['Demon Days', 'Grammy', 'Feel Good Inc'],
    source: {
      url: 'https://www.grammy.com/awards/48th-annual-grammy-awards/',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'plastic-beach-cyborg',
    stopId: 'era-plastic',
    title: 'Plastic Beach e a Cyborg Noodle',
    period: '2010',
    text: 'Lançado em março de 2010, Plastic Beach é o terceiro álbum de estúdio do Gorillaz e combina pop, eletrônica e temática ambiental com convidados como Bobby Womack, Mos Def, Snoop Dogg e Lou Reed. Na ficção da Fase 3, após Noodle ser dada como desaparecida nos eventos do clipe de El Mañana, Murdoc usa DNA recuperado dos destroços para construir a Cyborg Noodle. A réplica ciborgue armada atua como guitarrista e guarda-costas na ilha de lixo no Pacífico.',
    tags: ['Eras', 'Personagens'],
    keywords: ['Plastic Beach', 'Cyborg', 'Noodle'],
    source: {
      url: 'https://www.theguardian.com/music/2010/mar/04/gorillaz-plastic-beach-cd-review',
      accessed: '2026-11-22',
    },
  },
  {
    id: '2d-black-eyes',
    stopId: 'voices',
    title: '2-D e a história dos olhos pretos',
    period: '1998–2006 (ficção)',
    text: 'Na biografia ficcional da banda (detalhada no livro oficial Rise of the Ogre, de 2006), o vocalista 2-D nasceu Stuart Pot e ganhou os olhos completamente pretos após dois acidentes de carro provocados por Murdoc. No primeiro, Murdoc invadiu com o carro a loja de instrumentos onde Stuart trabalhava; no segundo, arremessou Stuart pelo para-brisa durante uma manobra imprudente, causando hifema nos dois olhos e o apelido "2-D" (Two Dents). No mundo real, o traço é uma escolha estética de quadrinhos de Jamie Hewlett.',
    tags: ['Personagens'],
    keywords: ['2-D', 'Stuart Pot', 'Murdoc'],
    source: {
      url: 'https://www.nme.com/big-reads/gorillaz-big-read-interview-2018-2347399',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'saturnz-barz-2017',
    stopId: 'era-hiato',
    title: 'O retorno de 2017 e Spirit House',
    period: '2017',
    text: 'Após quase sete anos sem um álbum de estúdio desde Plastic Beach e The Fall (2010), o Gorillaz retornou em 2017 com Humanz e o single Saturnz Barz, com participação do cantor jamaicano Popcaan. Dirigido por Jamie Hewlett e produzido pela Passion Pictures, o clipe Saturnz Barz (Spirit House) levou o quarteto a uma casa mal-assombrada interativa em realidade virtual 360°. No lançamento, o vídeo superou 3 milhões de visualizações em 48 horas, batendo o recorde de estreia de um clipe em VR no YouTube à época.',
    tags: ['Eras', 'Bastidores'],
    keywords: ['Saturnz Barz', 'Spirit House', 'Humanz'],
    source: {
      url: 'https://www.thefader.com/2017/03/30/saturnz-barz-virtual-reality-record-gorillaz',
      accessed: '2026-11-22',
    },
  },
  {
    id: 'song-machine-2020',
    stopId: 'era-reinvencao',
    title: 'Song Machine: música em episódios',
    period: '2020',
    text: 'Em 2020, o projeto Song Machine, Season One: Strange Timez trocou o ciclo tradicional de álbum por episódios audiovisuais lançados ao longo do ano antes da edição completa em outubro. A temporada conectou gerações e estilos em faixas com convidados como Robert Smith (Strange Timez), Elton John e 6LACK (The Pink Phantom), slowthai e Slaves (Momentary Bliss) e Beck (The Valley of the Pagans). A crítica destacou o formato por dar fôlego criativo à banda durante o isolamento de 2020.',
    tags: ['Eras', 'Bastidores'],
    keywords: ['Song Machine', 'Robert Smith', 'Elton John'],
    source: {
      url: 'https://www.theguardian.com/music/2020/oct/15/gorillaz-song-machine-season-one-strange-timez-review-the-poignant-sound-of-social-distancing',
      accessed: '2026-11-22',
    },
  },
];
