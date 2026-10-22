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
| `gorillaz-geep.glb` | `a07400446fe54848d8e2c44a0b1e60ff643980ec44f866c729d33010239e10d0` |
| `kenney-suv.glb` | `cc195543e412a3c6b7c94dee3313c9998522efc18a0a95a9438a4b476754ff4f` |
| `kenney-suv-luxury.glb` | `45193092aa900794b56817f5158aae0a562f4bc97fe566e15ff75b3b7c863ee2` |

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
- **Yamê — The Molazone**: referência de exploração e câmera indicada pelo usuário. O site não pôde ser inspecionado; nenhum código ou arquivo dele foi reutilizado.
- **Gorillaz**: https://www.gorillaz.com/ — universo criado por Jamie Hewlett e Damon Albarn. Projeto acadêmico independente, sem vínculo oficial.

## Circuito

Trajeto autoral circular de raio 58 unidades. As nove paradas têm posições distintas `i / 9`; o Geep segue a tangente e a câmera acompanha. A emenda é contínua em ambos os sentidos e a navegação por paradas escolhe o menor arco. O moinho provisório e as figuras alternativas são gerados localmente; os modelos Phase 7 e o Geep usam os arquivos creditados acima.

## Banda Phase 7 em uso

- Título: **The Gorillaz band (phase 7)**.
- Fonte: https://sketchfab.com/3d-models/the-gorillaz-band-phase-7-77d8602771c44a9e879cdc623258a650
- Publicação: **Redtricity**, https://sketchfab.com/nnastav49
- A descrição da publicação atribui os modelos originais ao **Gorillaz**. Essa atribuição foi mantida; não se apresenta o publicador como criador original.
- Licença exibida pela API da fonte: **Creative Commons Attribution 4.0**, https://creativecommons.org/licenses/by/4.0/
- `isDownloadable: true`. Arquivo fornecido pelo usuário: `the-gorillaz-band-phase-7.zip`, contendo `source/Gorillazband(phase 7).fbx` e quatro PNG.
- Crédito adicional na aplicação: `assets/models/PHASE7-CREDITS.txt`.
- Adaptações: reconexão das quatro texturas originais, pose dos braços em três rigs, aplicação das malhas avaliadas, agrupamento por integrante, alinhamento ao chão, exportação GLB estática e transparência por recorte. Sem redução de malha; sem rigs ou clipes no GLB final. Escala, orientação e movimento dos grupos são aplicados em execução.
- Os retratos `assets/portraits/phase7-*.png` são renderizações derivadas dos mesmos modelos, geradas no Blender para galeria e fichas.
- Não há vínculo ou endosso do publicador ou dos autores ao projeto acadêmico.

SHA-256 do ZIP fornecido: `5a42d6e9c407feaec18d567b44a6d6b0ea453b20e2e1526d9305efc96225b6e1`.

SHA-256 do GLB distribuído: `e30f02e978222bf2bacdee81d3ee3e32304de3f9c06cce55a60948c6f49d2398`.
