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
- `kenney-suv.glb` é o fallback do Geep. `kenney-suv-luxury.glb` é uma alternativa para download e não é carregado na cena.

## Integridade dos arquivos incluídos

| Arquivo | SHA-256 |
| --- | --- |
| `assets/models/gorillaz-geep.glb` | `a07400446fe54848d8e2c44a0b1e60ff643980ec44f866c729d33010239e10d0` |
| `assets/models/kenney-suv.glb` | `cc195543e412a3c6b7c94dee3313c9998522efc18a0a95a9438a4b476754ff4f` |
| `assets/models/kenney-suv-luxury.glb` | `45193092aa900794b56817f5158aae0a562f4bc97fe566e15ff75b3b7c863ee2` |
| `assets/models/driver-pilot.glb` | `db07755496a3426af1349b99dea99644918daf573b8c7b45608571fed9784200` |
| `assets/models/driver-pilot-v2.glb` | `a956e63c7c978bc7121503d155306ff5ffd7aca9b1f899f07f7bb4efddf399ea` |
| `assets/models/driver-pilot-v3.glb` | `f9067c3d02ef3b51e7d87ad9ba3932bc050203fe5e3cfcd66b8344b33c1c1c0c` |
| `assets/models/driver-pilot-v4.glb` | `044f53931cbd9436f636723a67672412ad21b279e2dd5feee33c76a551a79169` |
| `assets/models/gorillaz-phase7.glb` | `e30f02e978222bf2bacdee81d3ee3e32304de3f9c06cce55a60948c6f49d2398` |
| `assets/models/gorillaz-phase7-web.glb` | `8aba124746b1f93c9483084b5210a99a6cd9c0f9ded1b9dd2fc9b8cf733deaa7` |
| `assets/models/gorillaz-phase7-v2.glb` | `468bc09bbda03d82ab413160a18d68e74c551faabd3444c9032bcccdaf47aa3e` |
| `assets/models/gorillaz-phase7-web-v2.glb` | `f09a451f5dca1acf58f053cdda4ce7d023973b09a0eb4a20a6b87bc1e901aec1` |
| `assets/models/noodle-guitar-v2.glb` | `534f363b40a20ca365e01a8e1929d3edc3a4e2db98e717956a25d3eb99cd1a83` |
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

- Arquivo ativo: `assets/models/driver-pilot-v4.glb` (250.440 bytes), derivado da mesma base Quaternius (CC0 1.0, 65 joints, `Driving_Loop`) com mãos fixadas ao aro do volante (11h/1h) sem fresta no pulso com a manga rosa em 1ª pessoa (`V`).
- Cadeia de reserva (fallback): `assets/models/driver-pilot-v2.glb` (243.068 bytes) → `assets/models/driver-pilot.glb` (188.920 bytes). A revisão intermediária `assets/models/driver-pilot-v3.glb` (390.460 bytes) permanece no disco sem uso ativo na cadeia.
- Base de personagem e animação: **Quaternius**, Universal Base Characters e Universal Animation Library, https://quaternius.com/, licença **CC0 1.0** (https://creativecommons.org/publicdomain/zero/1.0/).
- Acréscimos autorais do projeto: jaqueta, óculos/viseira, luvas de direção e fones Kong FM. Créditos em `assets/models/DRIVER-CREDITS.txt`.
- Métricas (`driver-pilot.glb` base): 6 malhas, 1.526 triângulos na exportação, 1 skin (65 ossos), clipe `Driving_Loop` (195 canais), 0 imagens externas.
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
- Adaptações: reconexão das quatro texturas originais, pose dos braços em três rigs, aplicação das malhas avaliadas, agrupamento por integrante, alinhamento ao chão, exportação GLB estática e transparência por recorte. As variantes otimizadas para web (`gorillaz-phase7-web.glb` e `gorillaz-phase7-web-v2.glb`) e a revisão `gorillaz-phase7-v2.glb` derivam do mesmo pacote sob a mesma atribuição (CC BY 4.0 indicada na fonte), com texturas WebP de 1024 px, simplificação de malha via `gltf-transform` e ajustes de encaixe/pose em `src/band-pose.js`.
- Acessórios autorais de palco da Noodle: `assets/models/noodle-guitar-v2.glb` (42.908 bytes) e `assets/models/noodle-stage-props-v2.glb` (16.428 bytes, amplificador e pedaleira), modelados especificamente para este projeto acadêmico e servidos em `server.mjs`.
- Os retratos `assets/portraits/phase7-*.png` são renderizações derivadas dos mesmos modelos, geradas no Blender para galeria e fichas.
- Não há vínculo ou endosso do publicador ou dos autores ao projeto acadêmico.

SHA-256 do ZIP fornecido: `5a42d6e9c407feaec18d567b44a6d6b0ea453b20e2e1526d9305efc96225b6e1`.

SHA-256 dos GLBs distribuídos:
- `gorillaz-phase7.glb`: `e30f02e978222bf2bacdee81d3ee3e32304de3f9c06cce55a60948c6f49d2398`
- `gorillaz-phase7-web.glb`: `8aba124746b1f93c9483084b5210a99a6cd9c0f9ded1b9dd2fc9b8cf733deaa7`
- `gorillaz-phase7-v2.glb`: `468bc09bbda03d82ab413160a18d68e74c551faabd3444c9032bcccdaf47aa3e`
- `gorillaz-phase7-web-v2.glb`: `f09a451f5dca1acf58f053cdda4ce7d023973b09a0eb4a20a6b87bc1e901aec1`
- `noodle-guitar-v2.glb`: `534f363b40a20ca365e01a8e1929d3edc3a4e2db98e717956a25d3eb99cd1a83`
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
