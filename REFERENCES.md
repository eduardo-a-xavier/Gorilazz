# Fontes, modelos e licenças

## Geep em uso — shabaev

- Modelo: **Gorrilaz Car BlockBench**.
- Autor: [shabaev](https://sketchfab.com/shabaev).
- Fonte: https://sketchfab.com/3d-models/gorrilaz-car-blockbench-d1ac8116d1ab4ad7b612921425aa827a
- Licença: [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/).
- O ZIP `gorrilaz-car-blockbench.zip` foi fornecido pelo usuário. Seu SHA-256 é `26e8d416f17a6925c827a33e8f16c3435b78d84e52326d8cf13926bfa27069ce`.
- Conversão: `source/model.gltf` para `assets/models/gorillaz-geep.glb`, com as 14 imagens embutidas em bufferViews. Malhas, materiais e coordenadas originais foram preservados. Atribuição adicionada ao campo `asset.copyright`.
- Em execução: escala, centralização e orientação ajustadas ao circuito, com pivôs para animar rodas e detalhes. Créditos também em `assets/models/GEEP-CREDITS.txt`.
- O autor não endossa este projeto acadêmico. O nome Geep identifica o veículo da obra, sem afirmar vínculo com fabricantes.

## SUVs alternativos — Kenney

- Autor: **Kenney**. Pacote: **Car Kit 3.1**, licença **CC0 1.0 Universal**.
- Fonte oficial: https://kenney.nl/assets/car-kit
- Cópia pública consultada e baixada: https://github.com/Arslan12216775/kenney_car-kit/tree/153591d606970058a4d0e44aeadf435c2d3f89ed
- Licença preservada em `assets/models/KENNEY-LICENSE.txt`. O site oficial não abriu na rede desta máquina; arquivos e licença foram verificados na cópia pública.
- GLBs copiados sem alteração; escala e orientação são ajustadas em execução.
- `kenney-suv.glb` é o fallback do Geep. (`kenney-suv-luxury.glb` foi removido na faxina final de assets, commit `9e2f1a7`.)

## Integridade dos arquivos incluídos

| Arquivo | SHA-256 |
| --- | --- |
| `assets/models/gorillaz-geep.glb` | `a07400446fe54848d8e2c44a0b1e60ff643980ec44f866c729d33010239e10d0` |
| `assets/models/kenney-suv.glb` | `cc195543e412a3c6b7c94dee3313c9998522efc18a0a95a9438a4b476754ff4f` |
| `assets/models/driver-pilot.glb` | `db07755496a3426af1349b99dea99644918daf573b8c7b45608571fed9784200` |
| `assets/models/driver-pilot-v2.glb` | `a956e63c7c978bc7121503d155306ff5ffd7aca9b1f899f07f7bb4efddf399ea` |
| `assets/models/driver-pilot-v4.glb` | `044f53931cbd9436f636723a67672412ad21b279e2dd5feee33c76a551a79169` |
| `assets/models/driver-pilot-v5.glb` | `906e439d5a6c4b6bcd66535ec4e984fbe0c56aa2c2ae9f4d4ad2b1479a09a2bc` |
| `assets/models/driver-pilot-v6.glb` | `1d7efd3cc1a02741cb16697c9202149e37fe16bd4051611956c4fde2ed47986f` |
| `assets/models/gorillaz-phase7-web.glb` | `8aba124746b1f93c9483084b5210a99a6cd9c0f9ded1b9dd2fc9b8cf733deaa7` |
| `assets/models/gorillaz-phase7-web-v3.glb` | `3bac569dac992d1a4b11d6b5de6ca4e980ac84b990888730c08b10a92aeda4ba` |
| `assets/models/noodle-guitar-v3.glb` | `cc373d64fcc54f74d0af63d762a815cbc855d7b195030c042605c2f59c77fc7d` |
| `assets/models/noodle-stage-props-v2.glb` | `156e6b065aed776d9cbf347d8c102b511d904fcb6a97dcda0acd9a6c24bce837` |
| `assets/radio/concreto.mp3` | `2717334056389e35f15897eaee71ee7553c08c633d47b5b5c9ffe8432115bd07` |
| `assets/radio/mare.mp3` | `b56f93f31c3b304d72a244efa99a82ffd8887759c7e921bd0f425ebcfc4fb635` |

## Referências Sketchfab sem arquivo incorporado

Os metadados públicos foram consultados em 22/10/2026 via API oficial e resumidos em `assets/models/sketchfab-references.json`.

### Flying windmill — zeee7

- Autor: [zeee7](https://sketchfab.com/zeee7).
- Fonte: https://sketchfab.com/3d-models/flying-windmill-0e72abda7e8b4ec5a8eaa6bf9d25603b
- Licença informada: **Standard**, https://sketchfab.com/licenses
- API: `isDownloadable: false`. Referência visual e visualizador oficial sob clique; nenhum arquivo foi extraído do visualizador.
- O moinho do circuito é uma geometria provisória própria. Para usar o arquivo de zeee7 é necessário obtê-lo de forma autorizada do autor.

### Gorillaz — Dudi Julianto

- Autor: [Dudi Julianto](https://sketchfab.com/julianto.dudi).
- Fonte: https://sketchfab.com/3d-models/gorillaz-b693d0e95a634674b5fe5744dd3392cb
- O autor descreve o modelo como uma encomenda de papercraft.
- API: `isDownloadable: false`, campo `license` vazio na consulta. Não foi encontrada licença pública de reutilização; o arquivo não está incluído nem foi extraído do visualizador.
- Mantido apenas como referência visual com autoria e link. Os integrantes em uso são os do pacote Phase 7 fornecido separadamente.

As prévias abrem em iframes apenas após clique e são removidas ao fechar. A tentativa real de iframe no Chromium apresentou erro de rede; testes de interface usaram respostas externas simuladas. A presença da prévia não implica download ou incorporação ao WebGL local.

## Bibliotecas e direção

- **Three.js 0.180.0**: licença MIT em `src/vendor/THREE-LICENSE.txt`. GLTFLoader e BufferGeometryUtils são da mesma versão, com caminhos de importação adaptados para módulos locais.
- **Khronos Toy Car**: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ToyCar — referência de glTF 2.0. Créditos a Guido Odendahl e Eric Chadwick, licença CC0 no README consultado. Arquivo não incluído.
- **Yamê — The Molazone**: https://mola-zone.com/ — referência de exploração e câmera indicada pelo usuário. Nenhum código ou arquivo dele foi reutilizado.
- **Gorillaz**: https://www.gorillaz.com/ — universo criado por Jamie Hewlett e Damon Albarn. Projeto acadêmico independente, sem vínculo oficial.

## Circuito

Malha viária autoral de mundo aberto: 8 nós e 11 ruas (curvas Catmull-Rom definidas em `src/world-data.js` e desenhadas por `src/roads.js`), não mais um circuito circular. Os nós de grau 3 ou mais (1, 3, 5, 6 e 7) têm rotatória; os de grau 2 (0, 2 e 4) são emendas contínuas, sem pintura de rotatória. Calçadas, rotatórias e pinturas não invadem o asfalto de outras ruas, e os testes `tests/roads.test.mjs` conferem isso. As cinco descobertas e os quatro portais de época ficam recuados da rua e o passeio guiado chega a todos eles. O moinho provisório e as figuras alternativas são gerados localmente; os modelos Phase 7, o Geep e o piloto usam os arquivos creditados neste documento.

## Piloto do Geep em uso — Quaternius + acessórios autorais

- Arquivo ativo: `assets/models/driver-pilot-v6.glb` (258.776 bytes), derivado da mesma base Quaternius (CC0 1.0, 65 joints, `Driving_Loop`) com encaixe simétrico das mãos ao aro do volante (diferença palma-aro `<= 0,36 cm`), acabamento fosco sem brilho estourado e mangas contínuas em 1ª pessoa (`V`).
- Cadeia de reserva (fallback): `assets/models/driver-pilot-v6.glb` → `driver-pilot-v5.glb` (247.016 bytes) → `driver-pilot-v4.glb` (250.440 bytes) → `driver-pilot-v2.glb` (243.068 bytes) → `driver-pilot.glb` (188.920 bytes). A revisão intermediária `driver-pilot-v3.glb` foi removida na faxina final (commit `9e2f1a7`).
- Base de personagem e animação: **Quaternius**, Universal Base Characters e Universal Animation Library, https://quaternius.com/, licença **CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/).
- Acréscimos autorais do projeto: jaqueta, óculos/viseira, luvas de direção e fones Kong FM. Créditos em `assets/models/DRIVER-CREDITS.txt`.
- Métricas (`driver-pilot.glb` base): 6 malhas, 1.526 triângulos na exportação, 1 skin (65 ossos), clipe `Driving_Loop` (195 canais), 0 imagens externas.
- SHA-256 (`driver-pilot-v6.glb`): `1d7efd3cc1a02741cb16697c9202149e37fe16bd4051611956c4fde2ed47986f`.
- SHA-256 (`driver-pilot-v5.glb`): `906e439d5a6c4b6bcd66535ec4e984fbe0c56aa2c2ae9f4d4ad2b1479a09a2bc`.
- SHA-256 (`driver-pilot-v4.glb`): `044f53931cbd9436f636723a67672412ad21b279e2dd5feee33c76a551a79169`.
- SHA-256 (`driver-pilot-v2.glb`): `a956e63c7c978bc7121503d155306ff5ffd7aca9b1f899f07f7bb4efddf399ea`.
- SHA-256 (`driver-pilot.glb`): `db07755496a3426af1349b99dea99644918daf573b8c7b45608571fed9784200`.
- Em execução: encaixe medido no Geep (posição `-0.6213, 0.208, 0.4471`, escala 1.22), animação pelo `AnimationMixer` e rotações reativas de direção nos ossos `Head`, `spine_02`, `upperarm_l` e `upperarm_r`. Se os GLBs falharem, o piloto procedural da cena permanece.
- Sem vínculo ou endosso de Quaternius ao projeto acadêmico.

## Banda Phase 7 em uso

- Título: **The Gorillaz band (phase 7)**.
- Fonte: https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650
- Publicação: **Redtricity**, https://sketchfab.com/nnastav49
- A descrição da publicação atribui os modelos originais ao **Gorillaz**. Essa atribuição foi mantida; não se apresenta o publicador como criador original.
- Licença exibida pela API da fonte: **Creative Commons Attribution 4.0**, https://creativecommons.org/licenses/by/4.0/
- `isDownloadable: true`. Arquivo fornecido pelo usuário: `the-gorillaz-band-phase-7.zip`, contendo `source/Gorillazband(phase 7).fbx` e quatro PNG.
- Crédito adicional na aplicação: `assets/models/PHASE7-CREDITS.txt`.
- Adaptações: reconexão das quatro texturas originais, pose dos braços em três rigs, aplicação das malhas avaliadas, agrupamento por integrante, alinhamento ao chão, exportação GLB estática e transparência por recorte. As variantes otimizadas para web ativas (`gorillaz-phase7-web-v3.glb` e fallback `gorillaz-phase7-web.glb`) derivam do mesmo pacote sob a mesma atribuição (CC BY 4.0 indicada na fonte), com texturas WebP de 1024 px, simplificação de malha via `gltf-transform` e ajustes de encaixe/pose em `src/band-pose.js`. Os arquivos pesados legados (`gorillaz-phase7.glb`, `gorillaz-phase7-v2.glb` e `gorillaz-phase7-web-v2.glb`) foram removidos na faxina final (commit `9e2f1a7`).
- Acessórios autorais de palco da Noodle: `assets/models/noodle-guitar-v3.glb` (43.628 bytes; substituiu `noodle-guitar-v2.glb`, removido em `9e2f1a7`) e `assets/models/noodle-stage-props-v2.glb` (16.428 bytes, amplificador e pedaleira), modelados especificamente para este projeto acadêmico e servidos em `server.mjs`.
- Os retratos `assets/portraits/phase7-*.png` são renderizações derivadas dos mesmos modelos, geradas no Blender para galeria e fichas.
- Não há vínculo ou endosso do publicador ou dos autores ao projeto acadêmico.

SHA-256 do ZIP fornecido: `5a42d6e9c407feaec18d567b44a6d6b0ea453b20e2e1526d9305efc96225b6e1`.

SHA-256 dos GLBs distribuídos em `assets/models/`:
- `gorillaz-phase7-web-v3.glb`: `3bac569dac992d1a4b11d6b5de6ca4e980ac84b990888730c08b10a92aeda4ba`
- `gorillaz-phase7-web.glb`: `8aba124746b1f93c9483084b5210a99a6cd9c0f9ded1b9dd2fc9b8cf733deaa7`
- `noodle-guitar-v3.glb`: `cc373d64fcc54f74d0af63d762a815cbc855d7b195030c042605c2f59c77fc7d`
- `noodle-stage-props-v2.glb`: `156e6b065aed776d9cbf347d8c102b511d904fcb6a97dcda0acd9a6c24bce837`

## Áudio local (Kong FM) e minigame rítmico de piano

- **`assets/radio/concreto.mp3`** (78.109 bytes, SHA-256 `2717334056389e35f15897eaee71ee7553c08c633d47b5b5c9ffe8432115bd07`): declarado em `src/local-radio.js` e `README.md` como *"Concreto — Kong FM · instrumental original"*. Status documental: sem arquivo de licença formal separado no repositório e sem BPM confirmado (autoria individual e termos formais de licença marcados como **não confirmados**).
- **`assets/radio/mare.mp3`** (75.399 bytes, SHA-256 `b56f93f31c3b304d72a244efa99a82ffd8887759c7e921bd0f425ebcfc4fb635`): declarado em `src/local-radio.js` e `README.md` como *"Maré de plástico — Kong FM · instrumental original"*. Mesmo status documental: sem arquivo de licença formal separado e sem BPM confirmado.
- **Carregamento local pelo visitante:** a Kong FM permite carregar arquivos de áudio do próprio dispositivo em memória (`URL.createObjectURL`), sem hospedagem nem redistribuição pelo site. Nenhuma gravação comercial do Gorillaz é distribuída pela aplicação.
- **Minigame rítmico de piano do 2-D (`src/piano-game.js` / `src/piano-screen.js`):** utiliza áudio **100% sintetizado no navegador via Web Audio API**, sem samples ou fonogramas comerciais. Os andamentos (BPM) e compassos (4/4) de referência — *Tomorrow Comes Today* (93 BPM), *Clint Eastwood* (84 BPM) e *On Melancholy Hill* (120 BPM) — foram verificados em 22/11/2026 em SongBPM, Tunebat, GetSongBPM e Musicnotes, com divergências e limites registrados em `docs/gestao/minigame-piano-bpm.md`. Crédito exibido na interface: *"Áudio sintetizado próprio · BPMs de referência · uso acadêmico"*.

## Conteúdo histórico e recorte editorial

O conteúdo de `src/content.js` é uma seleção de 1998 a 2023. Não é apresentado como discografia completa nem como consulta atualizada a todos os lançamentos. A referência a The Fall distingue digital (2010) e físico (2011).

Referências indicadas para consulta:

- Gorillaz, site oficial: https://www.gorillaz.com/
- Gorillaz, canal oficial e clipes: https://www.youtube.com/@Gorillaz
- Lançamento de The Fall (digital em 2010, físico em 2011): site oficial e registros oficiais da discografia.

Nesta revisão, em 29/10/2026, os pedidos HTTP ao site oficial e à Britannica foram bloqueados pelo proxy (403 no túnel). Não se afirma que essas páginas foram lidas ou que a atualização documental online foi concluída. A versão distingue fatos históricos, narrativa virtual e interpretações editoriais, mantendo o recorte limitado a informações históricas conhecidas. As referências indicadas são pontos de partida para conferência, não substituem uma bibliografia acadêmica final.

A auditoria e os limites da revisão estão em [HISTORY_REVIEW.md](HISTORY_REVIEW.md).

## Capas oficiais de álbuns (uso acadêmico — Frente 4)

As oito capas oficiais do recorte histórico (2001–2023) foram obtidas em 20/11/2026 diretamente pelo catálogo oficial da **Parlophone Records / Warner Music Group / Gorillaz Partnership** distribuído na Apple Music (600×600 px), exclusivamente para **ilustração crítica e estudo acadêmico sem fins comerciais** neste projeto. Todos os direitos autorais e fonográficos pertencem aos respectivos titulares (Jamie Hewlett, Damon Albarn, Gorillaz Partnership e Parlophone Records Limited). Nenhuma imagem foi obtida da Wikipédia.

| Arquivo em `assets/covers/` | Álbum / Data oficial | Crédito / Direitos | Fonte oficial | SHA-256 |
| --- | --- | --- | --- | --- |
| `gorillaz-2001.jpg` | *Gorillaz* (26/03/2001) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/gorillaz/850576570 | `42a08df159df4541c4b2ad2aa8b5a890bd501a4e6416aa52b205497ddfc8110c` |
| `demon-days-2005.jpg` | *Demon Days* (11/05/2005) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/demon-days/850571319 | `6142eba63735385b86b5ed1281003163759eeff8309854a12097a061d7a2d477` |
| `plastic-beach-2010.jpg` | *Plastic Beach* (03/03/2010) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/plastic-beach/850569437 | `0b06739301a8c70c30efa0bb032a45ff2d8944f952a332e2ba7687ab6f18173c` |
| `the-fall-2010.jpg` | *The Fall* (25/12/2010 digital; 2011 físico) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/the-fall/850585388 | `d8e03e1112e47972bc2c9271cc1f6b51dbf748b106968d3a968054d23b111d47` |
| `humanz-2017.jpg` | *Humanz* (28/04/2017) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/humanz/1215772681 | `537a5218c9d90441327fd62e5c32dd57f8167b4955a7ec046723eaf38d05bb16` |
| `the-now-now-2018.jpg` | *The Now Now* (29/06/2018) | Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/the-now-now/1387814084 | `8c78b3bc7d3643a5393f97d58c1a8c70cbefa4eb9c9b25e56dac499bbac37aca` |
| `song-machine-2020.jpg` | *Song Machine, Season One: Strange Timez* (23/10/2020) | Arte: Jamie Hewlett · ℗ 2020 Gorillaz Partnership / Parlophone | https://music.apple.com/gb/album/song-machine-season-one-strange-timez/1530806008 | `0b6a468adf98954d72e1d403363e532461931386d08185bb3623879c2d579fae` |
| `cracker-island-2023.jpg` | *Cracker Island* (24/02/2023) | Arte: Jamie Hewlett · ℗ 2023 Parlophone Records Limited | https://music.apple.com/gb/album/cracker-island/1641561652 | `6ef21e5f3c2f7e2d075cc66b9c90c5c4dd258a8c02d2215921fa80adc17c0f35` |

### Fontes primárias e oficiais adicionais (painéis de `src/content.js`)

- Entrevista com Jamie Hewlett sobre a criação em 1998 (VICE): https://www.vice.com/en/article/gorillaz-co-creator-jamie-hewlett-just-wanted-to-draw-comics/
- *Tomorrow Comes Today* EP (novembro de 2000) — loja oficial: https://store.gorillaz.com/products/tomorrow-comes-today-ep
- Álbum *Gorillaz* (26 de março de 2001) — loja oficial: https://store.gorillaz.com/products/gorillaz-lp
- Kong Studios — FAQ oficial: https://gorillaz.com/Kongstudiosfaqs/
- Biografia de imprensa oficial (Nasty Little Man): https://www.nastylittleman.com/artists/gorillaz/
- Catálogo oficial Gorillaz (Apple Music / Parlophone): https://music.apple.com/gb/artist/gorillaz/567072

### Curadoria visual pendente (não obtida de fonte oficial aberta)

- **Artes conceituais de bastidores e rascunhos de estúdio** (ex.: ilustrações editoriais de *Rise of the Ogre* ou *Gorillaz Almanac*): sem fonte oficial aberta com distribuição direta confirmada; não foram baixadas de wikis ou repositórios de terceiros e permanecem pendentes de fornecimento oficial caso o grupo deseje incluí-las.

## Tipografia — Anton (Google Fonts / SIL OFL 1.1)

- Família tipográfica: **Anton** (Regular, display condensada estilo cartaz).
- Autor original: **Vernon Adams** (com manutenção pelo Google Fonts).
- Fontes oficiais: https://fonts.google.com/specimen/Anton e https://github.com/google/fonts/tree/main/ofl/anton
- Licença: **SIL Open Font License 1.1 (OFL-1.1)** — texto integral preservado em `assets/fonts/ANTON-OFL.txt`.
- Uso no projeto: declarada localmente via `@font-face` em `src/editorial.css` para títulos de alto impacto estilo cartaz nos painéis de eras, nas 9 paradas temáticas e nos diálogos de descoberta, com fallback para `Impact, 'Arial Narrow', sans-serif`.

| Arquivo em `assets/fonts/` | Formato / Papel | SHA-256 |
| --- | --- | --- |
| `anton-latin.woff2` | WOFF2 (subset Latin, web) | `d0fa07ff63dd60cbc0e2f58e29c802dca2a5ae0276c999f59c6111ab7bbaec3b` |
| `anton-latin-ext.woff2` | WOFF2 (subset Latin Extended, acentos PT-BR) | `0d17b7880f389deeb6663a52fa4eadc6d9116bdda725f0aa1f3d404fbb7d3d59` |
| `Anton-Regular.ttf` | TrueType completo (fallback local) | `a4ba3a92350ebb031da0cb47630ac49eb265082ca1bc0450442f4a83ab947cab` |
| `ANTON-OFL.txt` | Licença SIL OFL 1.1 oficial | `ee67e6ee22790b7929f1a3769ca2801d565c64b5a9096942c1adf5596de9c9e4` |

## Artes otimizadas em WebP para o mundo 3D (`assets/art/` — Polimento Final)

Conjunto de 19 imagens em formato **`.webp`** otimizado (`<= 1024×1024`, todas `< 150 KB`) para murais, palcos e outdoors do cenário 3D (mapeadas em `assets/art/manifest.json`), obtidas em 21/11/2026 de fontes oficiais da gravadora (**Parlophone Records / Apple Music**), da assessoria de imprensa oficial (**Nasty Little Man**) e dos retratos derivados do pacote **Phase 7** já creditado em `assets/models/PHASE7-CREDITS.txt`. Uso **exclusivamente acadêmico e sem fins comerciais**; nenhuma imagem foi obtida da Wikipédia ou de sites sem fonte verificável.

| Arquivo em `assets/art/` | Dimensões | Peso | Crédito / Direitos | Fonte oficial | SHA-256 |
| --- | --- | --- | --- | --- | --- |
| `album-gorillaz-2001.webp` | 1000×1000 | 89.5 KB | Gorillaz (2001) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/gorillaz/850576570 | `ab6f032a34bbbf56e183a75b72985a0dc40bcd4f6223287f4c276f46a1350083` |
| `album-demon-days-2005.webp` | 1000×1000 | 61.9 KB | Demon Days (2005) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/demon-days/850571319 | `7d3f209ed4e08544dc46c631d495d355834a1efdd382ec999e10d31a7ab1555e` |
| `album-plastic-beach-2010.webp` | 1000×1000 | 87.9 KB | Plastic Beach (2010) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/plastic-beach/850569437 | `9ec5a5d9acf3682c829e80b4c113ed4dbc2ce852a286097e12a4dc3e6ca726aa` |
| `album-the-fall-2010.webp` | 1000×1000 | 143.8 KB | The Fall (2010) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/the-fall/850585388 | `fb92770770a01af093e8b3d211fe034766976a041c4ecebb45b1d048615f0c0a` |
| `album-humanz-2017.webp` | 1000×1000 | 65.6 KB | Humanz (2017) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/humanz/1215772681 | `b2e597565c8d4917c0ed7da44e71cd106b4d33012b48b0730a70cd918f306a03` |
| `album-the-now-now-2018.webp` | 1000×1000 | 132.7 KB | The Now Now (2018) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/gb/album/the-now-now/1387814084 | `6444eefd1c56b8390427adb5bf6dfb589eccb3d288a831474e64bab11b7531fa` |
| `album-song-machine-2020.webp` | 1000×1000 | 143.0 KB | Song Machine, Season One (2020) · Arte: Jamie Hewlett · ℗ 2020 Gorillaz Partnership / Parlophone | https://music.apple.com/gb/album/song-machine-season-one-strange-timez/1530806008 | `53aea0f5bd19db9e9f0d1f04431840e2cbe8e3919ab6db21adc3f72d1c8c4576` |
| `album-cracker-island-2023.webp` | 1000×1000 | 138.1 KB | Cracker Island (2023) · Arte: Jamie Hewlett · ℗ 2023 Parlophone Records Limited | https://music.apple.com/gb/album/cracker-island/1641561652 | `6a10cf904292ff0e95019f0adb7a2c2d337f3c1692770cf143332595af64324c` |
| `art-feel-good-inc-2005.webp` | 1000×1000 | 39.3 KB | Feel Good Inc. EP (2005) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/us/album/feel-good-inc-ep/693620734 | `50fe7bf1daca44d41bfc9a18e4e8e9afd848525ce4252e385cafe9e0043ace16` |
| `art-dare-2005.webp` | 1000×1000 | 69.8 KB | DARE Single (2005) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/us/album/dare-feat-shaun-ryder-radio-edit-single/700025929 | `c028d938af1016aab7241605badc3eaa54f1d9d9b20328b8e7d6ba0d71929751` |
| `art-stylo-2010.webp` | 1000×1000 | 81.9 KB | Stylo Single (2010) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/us/album/stylo-feat-mos-def-bobby-womack-single/700583456 | `f3dbe17ce8db8ede356a380a0f7707e4e8135f8107ec13475403c553306dceb3` |
| `art-sleeping-powder-2017.webp` | 1000×1000 | 84.3 KB | Sleeping Powder Single (2017) · Arte: Jamie Hewlett · ℗ Parlophone Records Limited | https://music.apple.com/us/album/sleeping-powder-single/1247590076 | `681681eaa35ce2bd8d11a930062d244f7b3728059c73189b51a0592af153d6a0` |
| `member-2d.webp` | 384×512 | 15.0 KB | 2-D (Phase 7) · Render derivado do pacote publicado por Redtricity (modelos originais atribuídos ao Gorillaz; CC BY 4.0 indicada na fonte) | https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650 | `1d2f54f98ed83107835dfaefc2be277eb118e4e2177fac2103f6ef2a29c8b187` |
| `member-murdoc.webp` | 384×512 | 14.3 KB | Murdoc (Phase 7) · Render derivado do pacote publicado por Redtricity (modelos originais atribuídos ao Gorillaz; CC BY 4.0 indicada na fonte) | https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650 | `51ea6ebd11ad496a05f2a7b08929d2920ab464e124dff835892ac8b75c529bab` |
| `member-noodle.webp` | 384×512 | 15.2 KB | Noodle (Phase 7) · Render derivado do pacote publicado por Redtricity (modelos originais atribuídos ao Gorillaz; CC BY 4.0 indicada na fonte) | https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650 | `68dac223596bb2c5126bf792ac9c4c995a8e96a24e38c9557892c55e951cf4c1` |
| `member-russel.webp` | 384×512 | 16.9 KB | Russel (Phase 7) · Render derivado do pacote publicado por Redtricity (modelos originais atribuídos ao Gorillaz; CC BY 4.0 indicada na fonte) | https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650 | `784e105e317f28862ef8a8ae96b3495b284c6f714a332f9c22265a859fe48788` |
| `press-creators-band.webp` | 1023×736 | 128.2 KB | Damon Albarn, Jamie Hewlett e integrantes virtuais · Foto oficial de imprensa: Gorillaz / Reuben Bastienne-Lewis (Nasty Little Man) | https://www.nastylittleman.com/artists/gorillaz/ | `0a45725c5a44dcb04163f2cfaf0d112d5ad43ce55623118add373a55d9f28b4f` |
| `press-band-phase7.webp` | 1024×731 | 42.8 KB | Gorillaz (Phase 7 / Cracker Island) · Arte oficial de imprensa: Jamie Hewlett / Gorillaz (Nasty Little Man) | https://www.nastylittleman.com/artists/gorillaz/ | `5287056f90798a1a1f903f311a1bfb03fae872ed519ff910d38eef72fa92603f` |
| `press-gorillaz-live.webp` | 1024×733 | 68.6 KB | Gorillaz ao vivo · Foto oficial de imprensa de turnê (Nasty Little Man) | https://www.nastylittleman.com/artists/gorillaz/ | `aa00df8b18beb805b24657227d806e8ce6e5bf494f47f53befc0b2939e400bca` |

### Atlas de outdoors, portais e placas (gerado em execução)

- O atlas de outdoors de era (`adAtlas`), os portais (`gateTexture`), os murais de empena (`muralAtlas`) e as placas comerciais (`signTexture`) em `src/city.js`, bem como o atlas viário em `src/roads.js`, são gerados proceduralmente em `<canvas>` durante a execução (sem arquivo estático de atlas em disco).
- No `adAtlas`, os espaços de capa carregam inicialmente os arquivos de `assets/covers/*.jpg` e substituem sob demanda pelas artes correspondentes de `assets/art/*.webp` (todas listadas nas tabelas acima com fonte oficial, crédito e SHA-256). Os créditos curtos para outdoors, totens e bancas estão exportados em `src/content.js` (`eraBillboardCredits`).

### Artes pendentes (sem fonte oficial aberta)

- ***Gorillaz: Rise of the Ogre*** (2006, Cass Browne / Damon Albarn / Jamie Hewlett / Zombie Flesh Eaters): publicado pela Penguin Group (Michael Joseph Ltd. no Reino Unido; Riverhead Books nos EUA). Direitos autorais fechados (todos os direitos reservados); sem repositório oficial aberto ou licença pública de reutilização para artes internas. Mantido como pendente.
- ***Gorillaz Almanac*** (2020, Jamie Hewlett e artistas convidados): publicado pela Z2 Comics (`https://z2comics.com/`) em parceria oficial com Gorillaz. Termos de serviço da editora proíbem cópia ou redistribuição de artes e prévias sem autorização expressa por escrito; sem licença aberta. Mantido como pendente.
- ***Concept art* de bastidores de Kong Studios em alta resolução**: sem repositório oficial público com distribuição direta confirmada; mantido como pendente para evitar uso de fontes não oficiais ou sem atribuição verificável.

## Fontes da Central de Descobertas (9 fichas — 1998–2023)

Fontes oficiais e de jornalismo musical consultadas em **22/11/2026** para as 9 fichas em `src/discoveries-lore.js` e `docs/gestao/descobertas-fichas.md` (0 referências da Wikipédia; ficção da banda distinguida explicitamente dos fatos reais):

- **Surgimento (1998–2000):** The Guardian — https://www.theguardian.com/friday_review/story/0,,452238,00.html ; NME — https://www.nme.com/features/opinion/gorillaz-20-anniversary-debut-damon-albarn-2909266 (acesso em 22/11/2026).
- **Kong Studios (site interativo Flash, 2000–2001):** NME — https://www.nme.com/features/inside-the-lost-gaming-history-of-gorillaz-3478233 (acesso em 22/11/2026).
- **Geep e gravação de *19-2000* (Tina Weymouth, Chris Frantz, Miho Hatori):** NME (entrevista com Chris Frantz) — https://www.nme.com/features/music-interviews/does-rock-n-roll-kill-braincells-talking-heads-chris-frantz-3353898 ; AllMusic — https://www.allmusic.com/artist/gorillaz-mn0000664770 ; catálogo secundário: Discogs — https://www.discogs.com/master/58011-Gorillaz-192000 (acesso em 22/11/2026; encarte físico original da Parlophone não lido diretamente).
- **Del the Funky Homosapien e *Clint Eastwood* (2001):** The Guardian / The Observer — https://www.theguardian.com/theobserver/2001/mar/11/featuresreview.review2 ; Rolling Stone UK — https://www.rollingstone.co.uk/music/gorillaz-25-years-interview-damon-albarn-jamie-hewlett-53346/ (acesso em 22/11/2026).
- ***Demon Days*, *Feel Good Inc.* e 48º Grammy Awards (2006):** GRAMMY.com — https://www.grammy.com/awards/48th-annual-grammy-awards/ (acesso em 22/11/2026).
- ***Plastic Beach* e Cyborg Noodle (2010):** The Guardian — https://www.theguardian.com/music/2010/mar/04/gorillaz-plastic-beach-cd-review ; NME — https://www.nme.com/news/music/gorillaz-30-1298744 (acesso em 22/11/2026).
- **2-D / Stuart Pot e os olhos pretos (ficção da banda):** NME Big Read — https://www.nme.com/big-reads/gorillaz-big-read-interview-2018-2347399 (acesso em 22/11/2026); referência bibliográfica do lore: *Gorillaz: Rise of the Ogre* (Cass Browne, Penguin Group, 2006, sem leitura integral aberta online).
- ***Humanz* e *Saturnz Barz (Spirit House)* 360° VR (2017):** The Fader — https://www.thefader.com/2017/03/30/saturnz-barz-virtual-reality-record-gorillaz ; The Guardian — https://www.theguardian.com/music/2017/apr/30/gorillaz-humanz-review-kitty-empire (acesso em 22/11/2026).
- ***Song Machine, Season One: Strange Timez* (2020):** The Guardian — https://www.theguardian.com/music/2020/oct/15/gorillaz-song-machine-season-one-strange-timez-review-the-poignant-sound-of-social-distancing (acesso em 22/11/2026).

## Referências de Easter Eggs do mapa 3D (homenagens autorais)

Os *easter eggs* inseridos no mapa 3D são **homenagens autorais criadas pela equipe do projeto**, inspiradas na obra e no universo fictício do Gorillaz (1998–2023), **sem uso de arquivos originais** (áudio, vídeo, texturas ou fontes oficiais da banda). Verificação editorial completa em `docs/gestao/easter-eggs-referencias.md` (acesso em **24/11/2026**; 0 Wikipédia):

- **Alce gigante de *19-2000* (clipe oficial, 2001):** NME — https://www.nme.com/news/music/gorillaz-160-1386039 ; MUBI — https://mubi.com/pt/us/films/gorillaz-19-2000-mv ; YouTube oficial — https://www.youtube.com/watch?v=bbOjTwOMOL0
- **Winnebago de Murdoc (Kong Studios):** Gorillaz — Kong Studios FAQs — https://gorillaz.com/kongstudiosfaqs/ *(nota: a placa `"M1-N4-STY"` não foi confirmada em fonte oficial; caso exibida, constitui licença criativa autoral do projeto)*.
- **Slogan `"REJECT FALSE ICONS"` (campanha *Demon Days*, 2004–2005, e documentário de 2019):** The Guardian — https://www.theguardian.com/music/2006/jan/22/popandrock.gorillaz ; Trafalgar Releasing — https://trafalgar-releasing.com/events/gorillaz-reject-false-icons/ ; Denholm Hewlett — https://www.denholmhewlett.com/portfolio/reject-false-icons-directors-cut
- **Slogan `"SAVE US FROM HIM"` (campanha *The Now Now* / clipe *"Humility"*, 2018):** It's Nice That — https://www.itsnicethat.com/news/jamie-hewlett-gorillaz-humility-animation-010618 ; NME — https://www.nme.com/blogs/nme-blogs/gorillaz-exclusive-murdoc-hits-back-2d-wormwood-scrubs-cell-2354976
- **Pazuzu (motivo ocultista associado a Murdoc / Kong Studios e influência de *O Exorcista* em Jamie Hewlett):** The Guardian — https://www.theguardian.com/artanddesign/2008/jul/20/art ; loja oficial Gorillaz — https://usstore.gorillaz.com/products/pazuzu-t-shirt e https://usstore.gorillaz.com/products/hok-gorillaz-bomber-jacket
- **Zumbis / gorilas-zumbis do Kong Studios:** Gorillaz — Kong Studios FAQs — https://gorillaz.com/kongstudiosfaqs/ ; NME — https://www.nme.com/features/inside-the-lost-gaming-history-of-gorillaz-3478233 *(nota: a placa literal `"AVISO: ZUMBIS DO KONG STUDIOS"` é criação autoral do projeto inspirada no lore)*.
- **Risada de *Feel Good Inc.* (Maseo / De La Soul) e melódica de Damon Albarn (*Clint Eastwood* / *Feel Good Inc.*):** The Guardian — https://www.theguardian.com/music/2023/feb/23/de-la-soul-interview-belated-streaming-debut ; NME — https://www.nme.com/news/music/de-la-soul-6-1215914 ; MusicRadar — https://www.musicradar.com/artists/its-an-arcane-18th-century-german-form-of-rap-i-really-enjoy-it-because-its-an-opportunity-to-say-some-quite-bizarre-things-that-i-wouldnt-necessarily-be-able-to-sing-about-the-inside-story-of-the-gorillaz-classic-feel-good-inc ; Sound On Sound — https://www.soundonsound.com/people/recording-gorillazs-clint-eastwood

### Gravações usadas na Kong FM e no piano

Arquivos fornecidos por Eduardo a partir de seu computador para o projeto; gravações originais do Gorillaz (Parlophone/Warner), uso acadêmico/ilustrativo conforme instrução do responsável. A procedência da cópia e as permissões de distribuição não foram verificadas nesta integração.

- `assets/audio/clint-eastwood.mp3` — SHA-256 `af7c77f224dfa952e445e9905707777314b84e4df690e5fd88b75f14b41ef426`.
- `assets/audio/feel-good-inc.mp3` — SHA-256 `700a20a214e06b152f02a36e4b5ed4c4b004590d6557535c7d74860aad4484cf`.
- `assets/audio/on-melancholy-hill.mp3` — SHA-256 `851763d0432256439478913d67c84639b7ebbeca7bddd54af8c316056b3ab338`.

Piloto v6: arquivo GLB fornecido pelo Desenvolvedor Plataforma B (`assets/models/driver-pilot-v6.glb`, 258.776 bytes, SHA-256 `1d7efd3cc1a02741cb16697c9202149e37fe16bd4051611956c4fde2ed47986f`); mantém-se a cadeia de fallback documentada (`v6 → v5 → v4 → v2 → original`).

## Modelos 3D de Cenário (`assets/models/scenery/` — 22 GLBs, Blocos A–E + instrumentos v2)

Modelos originais em formato `.glb` criados por **OpenBot / Desenvolvedor Plataforma B** em Blender (sem assets, texturas ou pacotes externos), dedicados ao domínio público sob licença **CC0 1.0 Universal** (`https://creativecommons.org/publicdomain/zero/1.0/`). Carregados de forma *lazy* após a entrada no mundo 3D com `InstancedMesh` e fallback automático às primitivas originais. Nota de fechamento (25/11/2026): **bancos (`bench-01-slatted.glb`) e pedras (`rock-01/02/03`) foram removidos do mapa (limite 0)**, embora os GLBs originais permaneçam catalogados na pasta.

| Arquivo em `assets/models/scenery/` | Origem / Autor | Licença | SHA-256 |
| --- | --- | --- | --- |
| `tree-01-broadleaf.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `28c736e2995469547ea6dfaaf9ae307fa7d63ef67592a78953129c840498c893` |
| `tree-02-windswept.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `12c2162fc6b73712b0e4846dc879a22fbf6c4fe2700bd9ae3471153b423e72b4` |
| `tree-03-sage.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `90cf4abaca91cb301d678cc5cfa66b7f71dc3c8002b94746e7a52a98add5d8c8` |
| `bush-01-mound.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `31add791f59c56c4a0845bd9d65158fccd2cbc846cf8ebf95f2eba488cfa317e` |
| `bush-02-spreading.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `1b13f442c08999195e79151c57f8eab14202eb0b9611907ca3a928f61e5424d2` |
| `rock-01-slate.glb` *(fora do mapa)* | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `1adbcf51233312d715a520ba56b5512f7710da7ac6fc23978dff68d2dad622fe` |
| `rock-02-ochre.glb` *(fora do mapa)* | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `56ef97f484b0a9f0bef52dc94ad91e4e136480528899aef861d489a7edbe9665` |
| `rock-03-split.glb` *(fora do mapa)* | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `a834f96c34e0e3c9018bc1170629da1a763ee987ce04548a3ad34ba0ce2107d1` |
| `lamp-01-crooked.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `9539af5ee76f3455f5fcbc1e22e27b273893dc5f2b6775f0db086234656e271f` |
| `bench-01-slatted.glb` *(fora do mapa)* | Original / OpenBot (Desenvolvedor Plataforma B — Bloco A) | CC0-1.0 | `ad484a76812332573929642b834b0a11c92ce66f6d61144c435a3dcff0bd4f34` |
| `pigeon-01-animated.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco B) | CC0-1.0 | `6b66769e0b9f66ca3f8b4153364d1538211facc8fa67e0e1a1c436ea9e82e58d` |
| `instrument-01-bass.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco C) | CC0-1.0 | `610a3b4ff129fd0344b748514beb5f46a03cca02af2e755cbe67d84aa28fc494` |
| `instrument-02-drums.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco C) | CC0-1.0 | `800b0625167aba393661cf63c9d1bf333b472982ff66c473cfdbcf6a85f5f73c` |
| `instrument-03-keyboard.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco C) | CC0-1.0 | `16ad2c5aa9876a2986460f7678660a12916b19b5984ce877586b55c71151bfdf` |
| `instrument-04-bass-v2.glb` | Original / OpenBot (Jazz Bass, Murdoc; modelado do zero) | CC0-1.0 | `7d2b93a0addf114e48db19349f5b84eed36bb6961de57eecd1682921ae1a4755` |
| `instrument-05-guitar-v2.glb` | Original / OpenBot (Les Paul, Noodle; modelada do zero) | CC0-1.0 | `75f14f19c3ac4ac0267b46f62569b4ed59db1f0ea3017dbe4cf80a733b6fca8b` |
| `speaker-01-stack.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco D) | CC0-1.0 | `ff67149472bc4e0209f2e806320d7a37a6324787787a5557e163fce7702e6e32` |
| `speaker-02-tower.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco D) | CC0-1.0 | `8f80e8f9585c80f8334dc92cbf9fa62e8142fb40942ac89020b07e28de617eab` |
| `arcade-01-kong.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco D) | CC0-1.0 | `ae0f948fb3648f8983311c67db569c2447872dd0a281de748388d53f603064b7` |
| `car-01-sedan.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco E) | CC0-1.0 | `d10de50a0e215b0580c1a654739247c88852853fc6e94c5e2ec85635773518af` |
| `car-02-van.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco E) | CC0-1.0 | `140684e6aa8dc30f0230a43de435bab556fc365bd8c231dcac9824139299cfb6` |
| `barrier-01-road.glb` | Original / OpenBot (Desenvolvedor Plataforma B — Bloco E) | CC0-1.0 | `bb654f58746ce44cbd876dbae0619aa875987d3a8ebe5e7d5df4be84e0841a4e` |

- `assets/models/scenery/moose-01.glb` — alce do Easter egg (modelo original, Blender 5.3, CC0 1.0, 2026-11-26; SHA-256 fc36186e7e2be882e90bc7fba214c73acef2a04a319b5d06a48c91f9d6e0354e).
