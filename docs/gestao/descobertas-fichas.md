# Central de Descobertas — Auditoria Editorial e 9 Fichas Verificadas (1998–2023)

**Data de pesquisa e verificação:** 22/11/2026  
**Escopo temporal:** 1998–2023 (*The Mountain*, de 2026, mantido fora do escopo do projeto).  
**Módulo JS pronto:** `src/discoveries-lore.js` (`export const DISCOVERY_LORE = [...]`).  
**Regra editorial:** 0 fontes da Wikipédia; distinção explícita entre **fatos reais** (produção, gravações, prêmios, datas) e **ficção da banda (lore)**.

---

## 1. Mapeamento 1:1 — 9 Pontos do Site ↔ 9 Fichas

Os identificadores `stopId` abaixo correspondem exatamente aos 9 pontos computados por `buildStops()` e `stopIdFor()` em `src/guided-tour.js` (`4` portais de era + `5` pontos de história):

| # | `stopId` no site | Ponto no mapa | `id` da ficha | Título da ficha | Tags |
|---:|---|---|---|---|---|
| 1 | `beginning` | Duas mentes, um universo (História) | `mtv-origin` | O surgimento frente à MTV | `Eras`, `Bastidores` |
| 2 | `era-explosao` | A explosão (Portal de Era 1) | `kong-studios` | Kong Studios, o QG interativo | `Eras`, `Bastidores` |
| 3 | `live` | Quando o desenho encontra o palco (História) | `geep-19-2000` | O Geep e a gravação de 19-2000 | `Bastidores`, `Eras` |
| 4 | `genres` | Um som sem fronteiras (História) | `del-clint-eastwood` | Del e o sucesso de Clint Eastwood | `Personagens`, `Bastidores` |
| 5 | `demon-days` | A paisagem de Demon Days (História) | `demon-days-grammy` | Demon Days, o moinho e o Grammy | `Eras`, `Bastidores` |
| 6 | `era-plastic` | O auge ambicioso / Plastic Beach (Portal de Era 2) | `plastic-beach-cyborg` | Plastic Beach e a Cyborg Noodle | `Eras`, `Personagens` |
| 7 | `voices` | Quatro rostos. Muitas histórias. (História) | `2d-black-eyes` | 2-D e a história dos olhos pretos | `Personagens` |
| 8 | `era-hiato` | A briga e o hiato (Portal de Era 3) | `saturnz-barz-2017` | O retorno de 2017 e Spirit House | `Eras`, `Bastidores` |
| 9 | `era-reinvencao` | A reinvenção (Portal de Era 4) | `song-machine-2020` | Song Machine: música em episódios | `Eras`, `Bastidores` |

---

## 2. Checagem Factual do Texto Proposto por Eduardo (Correções e Limites)

| Ficha | Afirmação no briefing do Eduardo | Veredito | Correção aplicada / observação |
|---|---|---|---|
| 1. Surgimento (1998–2000) | Apartamento em Londres, irritados com a MTV; "primeira banda virtual do mundo"; *Tomorrow Comes Today* EP. | **Parcialmente correto** | Apartamento em Londres (Westbourne Grove) e crítica à MTV confirmados em entrevistas (*The Guardian*, *NME*). **Corrigido:** "primeira banda virtual do mundo" é impreciso (antes já existiam grupos animados como *The Archies* nos anos 1960); reescrito como renovação do formato multimídia. Confirmado *Tomorrow Comes Today* EP em novembro de 2000. |
| 2. Kong Studios | Quartel-general assombrado no topo de uma colina em Essex; site interativo dos anos 2000. | **Confirmado (separar ficção/real)** | Localização em Essex e zumbis pertencem estritamente à **ficção** da banda; o site interativo em Macromedia Flash (Mat Wakeham / Zombie Flesh Eaters / Jamie Hewlett, 2000–2001) é fato real confirmado (*NME*). |
| 3. Geep e *19-2000* | Buggy azul-acinzentado dirigido por Murdoc na autoestrada; "participação histórica de Tina Weymouth (Talking Heads)" no clipe. | **Corrigido** | **Corrigido (1):** Tina Weymouth (Talking Heads / Tom Tom Club) contribuiu nos **vocais de apoio e percussão adicional da gravação de estúdio** de *19-2000* ao lado de Chris Frantz e Miho Hatori (confirmado em entrevista de Chris Frantz ao *NME* e em *AllMusic*, deixando o Discogs apenas como catálogo secundário; o encarte físico original da Parlophone não foi lido diretamente), e **não** aparece como personagem no videoclipe. **Corrigido (2):** retirada a cor "azul-acinzentado" (não confirmada em fonte oficial) em favor de descrição segura ("o buggy conhecido como Geep, dirigido por Murdoc no clipe"). |
| 4. Del e *Clint Eastwood* | Espírito de Del possuindo Russel após traumas de gangues em NY. | **Confirmado (separar ficção/real)** | Separado o **fato real** (colaboração com o rapper Del the Funky Homosapien via Dan the Automator / *Deltron 3030*; single 4º lugar no Reino Unido) da **ficção** ("Del, o Fantasma" saindo de Russel Hobbs no universo da banda). |
| 5. *Demon Days* e Grammy | Moinho flutuante em *El Mañana* / *Feel Good Inc.*; vitória no Grammy 2006. | **Confirmado** | Vitória no **48º Grammy Awards (2006)** em *Best Pop Collaboration with Vocals* confirmada em `grammy.com` (com **De La Soul**). Simbolismo visual do moinho enquadrado como narrativa dos clipes. |
| 6. *Plastic Beach* e Cyborg Noodle | Após desaparecimento de Noodle, Murdoc cria réplica ciborgue armada com DNA dela numa ilha de lixo no Pacífico. | **Confirmado (separar ficção/real)** | Enquadrada a história da Cyborg Noodle explicitamente como **ficção da Fase 3** e o álbum *Plastic Beach* (março de 2010, terceiro álbum de estúdio) como fato real (*The Guardian*, *NME*). |
| 7. 2-D e olhos pretos | Stuart Pot ganhou olhos pretos (hifema bilateral) após ser "atropelado duas vezes" pelo carro de Murdoc. | **Corrigido (ficção do lore)** | Enquadrado explicitamente como **biografia ficcional** (detalhada em *Rise of the Ogre*, 2006). **Corrigido:** no lore, não foram dois atropelamentos idênticos — no 1º incidente o carro de Murdoc invadiu a loja onde Stuart trabalhava; no 2º, Stuart estava dentro do carro de Murdoc e foi arremessado pelo para-brisa. **Não confirmado em fonte primária aberta:** texto integral do livro *Rise of the Ogre* (Penguin Group, direitos fechados) não pôde ser lido diretamente online; o enquadramento foi cruzado com a entrevista do *NME* (2018) e registrado com transparência. |
| 8. *Saturnz Barz* / Spirit House (2017) | Retorno após 7 anos de hiato em 2017 com casa mal-assombrada interativa em 360°. | **Confirmado (com precisão)** | Confirmado retorno em 2017 com *Humanz* (quase 7 anos após *Plastic Beach*/*The Fall* de 2010) e clipe em VR 360° *Saturnz Barz (Spirit House)* com **Popcaan**, recorde de estreia de vídeo musical em VR no YouTube (> 3 milhões de visualizações em 48 h, *The Fader*). |
| 9. *Song Machine* (Temporada 1) | Formato de episódios audiovisuais mensais; colaboradores Robert Smith, Elton John, slowthai e Beck. | **Confirmado (com precisão)** | Todos os 4 colaboradores citados estão confirmados nas faixas de *Song Machine, Season One: Strange Timez* (2020, *The Guardian* / *NME*). **Precisado:** trocado "mensais" por "ao longo do ano", pois o intervalo entre episódios variou durante 2020. |

---

## 3. As 9 Fichas Finais Prontas

### 1. O surgimento frente à MTV (`mtv-origin` → `beginning`)
- **Período:** 1998–2000
- **Tags:** `Eras`, `Bastidores`
- **Palavras-chave:** `Jamie Hewlett`, `Damon Albarn`, `MTV`
- **Texto:** No fim dos anos 1990, Damon Albarn e Jamie Hewlett dividiram apartamento em Londres e, incomodados com a superficialidade da TV musical da época, imaginaram uma banda animada para comentar a indústria pop. O projeto não foi a primeira banda animada da história, mas renovou o formato ao unir anonimato criativo, quadrinhos e mistura de gêneros. A estreia fonográfica oficial veio em novembro de 2000, com o EP *Tomorrow Comes Today*.
- **Fonte:** The Guardian — https://www.theguardian.com/friday_review/story/0,,452238,00.html (acesso em 22/11/2026); apoio complementar: NME — https://www.nme.com/features/opinion/gorillaz-20-anniversary-debut-damon-albarn-2909266 (acesso em 22/11/2026).

### 2. Kong Studios, o QG interativo (`kong-studios` → `era-explosao`)
- **Período:** 2000–2001
- **Tags:** `Eras`, `Bastidores`
- **Palavras-chave:** `Kong Studios`, `Essex`, `Flash`
- **Texto:** Na ficção da banda, Kong Studios é um quartel-general assombrado no topo de uma colina em Essex, na Inglaterra, povoado por zumbis e corredores sinistros. No mundo real, o estúdio ganhou vida como um site interativo em Macromedia Flash desenvolvido por Mat Wakeham com a equipe Zombie Flesh Eaters e Jamie Hewlett. Os visitantes exploravam quartos, salas secretas, mixers de áudio e minigames — inspiração direta para a navegação deste projeto.
- **Fonte:** NME — https://www.nme.com/features/inside-the-lost-gaming-history-of-gorillaz-3478233 (acesso em 22/11/2026).

### 3. O Geep e a gravação de 19-2000 (`geep-19-2000` → `live`)
- **Período:** 2001
- **Tags:** `Bastidores`, `Eras`
- **Palavras-chave:** `Geep`, `19-2000`, `Tina Weymouth`
- **Texto:** No videoclipe animado de *19-2000*, o quarteto percorre uma autoestrada suspensa cheia de obstáculos a bordo do buggy conhecido como Geep, dirigido por Murdoc. Nos bastidores reais da gravação de estúdio, Tina Weymouth (baixista de Talking Heads e Tom Tom Club) contribuiu com vocais de apoio e percussão adicional ao lado de Chris Frantz e Miho Hatori, segundo entrevistas da imprensa musical e o catálogo AllMusic. Ela participa da faixa gravada, e não como personagem no clipe.
- **Fonte:** NME (entrevista com Chris Frantz) — https://www.nme.com/features/music-interviews/does-rock-n-roll-kill-braincells-talking-heads-chris-frantz-3353898 (acesso em 22/11/2026); apoio complementar: AllMusic — https://www.allmusic.com/artist/gorillaz-mn0000664770 (acesso em 22/11/2026); catálogo secundário: Discogs — https://www.discogs.com/master/58011-Gorillaz-192000 (acesso em 22/11/2026).

### 4. Del e o sucesso de Clint Eastwood (`del-clint-eastwood` → `genres`)
- **Período:** 2001
- **Tags:** `Personagens`, `Bastidores`
- **Palavras-chave:** `Clint Eastwood`, `Del`, `Russel`
- **Texto:** Na vida real, o rapper Del the Funky Homosapien gravou os versos de *Clint Eastwood* após trabalhar com Damon Albarn e o produtor Dan the Automator em *Deltron 3030*, levando o single ao 4º lugar nas paradas britânicas. Na ficção do universo Gorillaz, ele aparece como "Del, o Fantasma", espírito de um amigo que emerge do corpo do baterista Russel Hobbs após a perda de amigos em confrontos em Nova York. A faixa consolidou a fusão de hip-hop, pop e dub que define a banda.
- **Fonte:** The Guardian / The Observer — https://www.theguardian.com/theobserver/2001/mar/11/featuresreview.review2 (acesso em 22/11/2026); apoio complementar: Rolling Stone UK — https://www.rollingstone.co.uk/music/gorillaz-25-years-interview-damon-albarn-jamie-hewlett-53346/ (acesso em 22/11/2026).

### 5. Demon Days, o moinho e o Grammy (`demon-days-grammy` → `demon-days`)
- **Período:** 2005–2006
- **Tags:** `Eras`, `Bastidores`
- **Palavras-chave:** `Demon Days`, `Grammy`, `Feel Good Inc`
- **Texto:** Em *Demon Days* (2005), o moinho flutuante guiado por Noodle nos clipes de *Feel Good Inc.* e *El Mañana* funciona, na narrativa visual, como símbolo de refúgio diante da torre sombria e sufocante da cidade. No mundo real, *Feel Good Inc.* — parceria com o trio de hip-hop De La Soul — tornou-se um dos maiores sucessos da carreira do grupo. A faixa rendeu ao Gorillaz e ao De La Soul o Grammy 2006 de Melhor Colaboração Pop com Vocais (48ª edição).
- **Fonte:** GRAMMY.com — https://www.grammy.com/awards/48th-annual-grammy-awards/ (acesso em 22/11/2026).

### 6. Plastic Beach e a Cyborg Noodle (`plastic-beach-cyborg` → `era-plastic`)
- **Período:** 2010
- **Tags:** `Eras`, `Personagens`
- **Palavras-chave:** `Plastic Beach`, `Cyborg`, `Noodle`
- **Texto:** Lançado em março de 2010, *Plastic Beach* é o terceiro álbum de estúdio do Gorillaz e combina pop, eletrônica e temática ambiental com convidados como Bobby Womack, Mos Def, Snoop Dogg e Lou Reed. Na ficção da Fase 3, após Noodle ser dada como desaparecida nos eventos do clipe de *El Mañana*, Murdoc usa DNA recuperado dos destroços para construir a Cyborg Noodle. A réplica ciborgue armada atua como guitarrista e guarda-costas na ilha de lixo no Pacífico.
- **Fonte:** The Guardian — https://www.theguardian.com/music/2010/mar/04/gorillaz-plastic-beach-cd-review (acesso em 22/11/2026); apoio complementar: NME — https://www.nme.com/news/music/gorillaz-30-1298744 (acesso em 22/11/2026).

### 7. 2-D e a história dos olhos pretos (`2d-black-eyes` → `voices`)
- **Período:** 1998–2006 (ficção)
- **Tags:** `Personagens`
- **Palavras-chave:** `2-D`, `Stuart Pot`, `Murdoc`
- **Texto:** Na biografia ficcional da banda (detalhada no livro oficial *Rise of the Ogre*, de 2006), o vocalista 2-D nasceu Stuart Pot e ganhou os olhos completamente pretos após dois acidentes de carro provocados por Murdoc. No primeiro, Murdoc invadiu com o carro a loja de instrumentos onde Stuart trabalhava; no segundo, arremessou Stuart pelo para-brisa durante uma manobra imprudente, causando hifema nos dois olhos e o apelido "2-D" (*Two Dents*). No mundo real, o traço é uma escolha estética de quadrinhos de Jamie Hewlett.
- **Fonte:** NME Big Read — https://www.nme.com/big-reads/gorillaz-big-read-interview-2018-2347399 (acesso em 22/11/2026); referência bibliográfica do lore: *Gorillaz: Rise of the Ogre* (Cass Browne, Penguin Group, 2006 — obra de direitos fechados, sem leitura integral aberta na web).

### 8. O retorno de 2017 e Spirit House (`saturnz-barz-2017` → `era-hiato`)
- **Período:** 2017
- **Tags:** `Eras`, `Bastidores`
- **Palavras-chave:** `Saturnz Barz`, `Spirit House`, `Humanz`
- **Texto:** Após quase sete anos sem um álbum de estúdio desde *Plastic Beach* e *The Fall* (2010), o Gorillaz retornou em 2017 com *Humanz* e o single *Saturnz Barz*, com participação do cantor jamaicano Popcaan. Dirigido por Jamie Hewlett e produzido pela Passion Pictures, o clipe *Saturnz Barz (Spirit House)* levou o quarteto a uma casa mal-assombrada interativa em realidade virtual 360°. No lançamento, o vídeo superou 3 milhões de visualizações em 48 horas, batendo o recorde de estreia de um clipe em VR no YouTube à época.
- **Fonte:** The Fader — https://www.thefader.com/2017/03/30/saturnz-barz-virtual-reality-record-gorillaz (acesso em 22/11/2026); apoio complementar: The Guardian — https://www.theguardian.com/music/2017/apr/30/gorillaz-humanz-review-kitty-empire (acesso em 22/11/2026).

### 9. Song Machine: música em episódios (`song-machine-2020` → `era-reinvencao`)
- **Período:** 2020
- **Tags:** `Eras`, `Bastidores`
- **Palavras-chave:** `Song Machine`, `Robert Smith`, `Elton John`
- **Texto:** Em 2020, o projeto *Song Machine, Season One: Strange Timez* trocou o ciclo tradicional de álbum por episódios audiovisuais lançados ao longo do ano antes da edição completa em outubro. A temporada conectou gerações e estilos em faixas com convidados como Robert Smith (*Strange Timez*), Elton John e 6LACK (*The Pink Phantom*), slowthai e Slaves (*Momentary Bliss*) e Beck (*The Valley of the Pagans*). A crítica destacou o formato por dar fôlego criativo à banda durante o isolamento de 2020.
- **Fonte:** The Guardian — https://www.theguardian.com/music/2020/oct/15/gorillaz-song-machine-season-one-strange-timez-review-the-poignant-sound-of-social-distancing (acesso em 22/11/2026).

---

## 4. Auditoria de fontes (ausência de agregador como fonte única) e limites

- **Revisão de agregadores nas 9 fichas:** nenhuma das 9 fichas depende hoje de agregador colaborativo (como Discogs ou SongBPM) como fonte única. Todas usam imprensa musical de peso (*The Guardian*, *NME*, *The Fader*, *Rolling Stone UK*) ou fonte oficial do prêmio (*GRAMMY.com*).
- **Encarte físico original de *Gorillaz* (Parlophone, 2001) e matiz exato do Geep:** o encarte físico oficial do álbum não foi consultado diretamente online; a participação de Tina Weymouth em *19-2000* foi ancorada em entrevista de Chris Frantz ao *NME* e em *AllMusic* (com Discogs apenas como referência secundária), e o matiz "azul-acinzentado" do Geep foi removido por falta de confirmação oficial.

- **Texto integral de *Gorillaz: Rise of the Ogre* (2006):** obra oficial de direitos autorais fechados (Penguin Group); o trecho literal da biografia ficcional de 2-D (Stuart Pot / hifema / *Two Dents*) não está disponível em repositório aberto, tendo sido referenciado bibliograficamente e cruzado com a cobertura do *NME* (2018).
- **Cadência rigorosamente mensal de *Song Machine*:** os episódios de 2020 tiveram intervalos irregulares durante a pandemia; por isso a ficha registra "episódios audiovisuais lançados ao longo do ano".
