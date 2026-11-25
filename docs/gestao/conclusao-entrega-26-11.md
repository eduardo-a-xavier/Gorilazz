# Conclusão da entrega — Gorillaz: The Road

Data de referência: 25/11/2026 (fechamento final pré-push). Prazo de entrega: 26/11/2026.
Responsável pela aprovação e autoria exclusiva de commits/publicação: Eduardo Alves Xavier.
Status geral: **APROVADO PELA QA E CONSOLIDADO PARA FECHAMENTO PRÉ-PUSH (25/11/2026) — Decisões sobre contador X/9 e textos dos MP3s fechadas por Eduardo em 25/11/2026; pronto para revisão/commit/push exclusivos de Eduardo.**

## 1. Resumo para decisão

- **Suíte automatizada (25/11/2026):** `npm run check` (`exit 0`, **53 arquivos** JS/MJS validados — `server.mjs` + 52 módulos em `src/`) e `npm test` (**272/272 PASS**, `0 fail`, `0 skipped`).
- **Auditoria em navegador real (QA Gorilazz):** Google Chrome estável + WebGL2 (ANGLE D3D11) via Playwright com `60,0–60,1 FPS` nos 3 pontos de referência, `0` erros de console, `0` erros de página, `0` status HTTP `>= 400`, **8,58 MB** de carga inicial no 3D (teto `9,3 MB`; `1,32 MB` na landing; `9,95 MB` acumulado após explorar toda a editorial); pasta `assets/` em **28,47 MB** (`110` arquivos, `40` GLBs no total) e pacote estático publicado no GitHub Pages em **30,06 MB** (`164` arquivos). Fontes: `docs/gestao/evidencias/correcao-qa-2026-11-23/qa-rodada-final-relatorio.md`, `qa-rodada-final-telemetria.json` e `docs/gestao/evidencias/fechamento-final-2026-11-26/relatorio_congelamento_final.md`.
- **Auditoria de asset 3D (QA Plataforma):** Round-trip Blender 14/14 PASS e auditoria binária e de licenciamento aprovadas.
- **Higiene de ambiente:** `0` processos `blender.exe` residuais e servidor de QA na porta `3115` encerrado.
- **Git / Publicação:** Nenhum commit ou push foi realizado por agentes. O repositório aguarda a revisão final e o commit/push manual de Eduardo.

## 2. Estado final verificado por frente

### 2.1. Piloto Estilizado GLB & Rig (`assets/models/driver-pilot.glb`, `src/pilot-rig.js`, `src/scene.js`, `assets/models/DRIVER-CREDITS.txt`)
- **Asset GLB estilizado:** Base e animação Quaternius (CC0 1.0) combinadas com acessórios autorais Kong FM; `188.920` bytes, SHA-256 `db07755496a3426af1349b99dea99644918daf573b8c7b45608571fed9784200`, 6 malhas (`16` primitivas `SkinnedMesh`), `1.526` triângulos na exportação (`1.606` na reimportação), 1 skin (`65` ossos), clipe `Driving_Loop` (`195` canais) e zero imagens externas.
- **Integração e runtime:** Integrado em `src/scene.js` e `src/pilot-rig.js` com `frustumCulled = false`, `AnimationMixer` ativo em `Driving_Loop` e rotações aditivas reativas nos ossos reais (`Head`, `spine_02`, `upperarm_l`, `upperarm_r`), raycast de clique em `[driver]`, modo 1ª pessoa (`V`) ocultando o piloto (`driver.visible === false`) e posição calibrada `(-0.6213, 0.208, 0.4471)` preservada após o carregamento do Geep por `if (!pilotRig)` em `installVehicle` (`src/scene.js:641`).
- **Créditos e licenciamento:** Publicados e servidos com HTTP 200 em `assets/models/DRIVER-CREDITS.txt` (mapeado em `server.mjs`), além de documentados em `REFERENCES.md` e `index.html`.

### 2.2. Pistas e Malha Viária (`src/roads.js`, `src/world-data.js`, `tests/roads.test.mjs`)
- `0` quadras de calçada invadindo o asfalto ou os cruzamentos.
- Saias laterais descendo até `-0.32`, sem pistas flutuantes.
- `0` sobreposições fora dos discos de cruzamento e `100%` das normais voltadas para `+Y` (`y > 0.99`).
- Nós de grau 2 (Nós `0`, `2` e `4`) limpos, sem pintura amarela falsa de rotatória (mantida apenas na rotatória central, Nó `7`, grau 4).

### 2.3. Câmera (`src/scene.js`, `tests/camera.test.mjs`)
- **Portais de era:** `4/4` `ERA_GATES` atravessados em alta velocidade sem parede invisível (`min_dist_to_gate` entre `0.01 m` e `0.27 m`).
- **Manobra de ré:** Ré curta (`-4.17 m/s`, `91` quadros em ré) com `max_yaw_delta = 3.15°/quadro` e zero flip de 180°.
- **Contorno urbano:** Curvas ao redor de quarteirões e prédios com `0/275` quadros com clipping (`min_cam_y = 7.18 m`, `max_jump = 1.334 m`).
- **Troca/instalação de veículo:** `installVehicle()` preserva `driver` e `cabin.root` sem sobrescrever a calibração do piloto GLB.

### 2.4. Parte Inferior, Garagem Bento 21st.dev, Créditos & Responsividade (`index.html`, `src/editorial.css`, `src/app.js`, `REFERENCES.md`, `src/content.js`, `server.mjs`)
- **Componentes e layout:** Garagem Bento (`#modelos`), manifesto marquee (`.world-manifesto`) e chip de leituras (`.content-shortcuts`) implementados com zero overflow horizontal em desktop (`1440×900` e `1920×1080`) e mobile (`390×844` e `320×568`).
- **Design System:** Token `--blue: #7fa6ff` e demais variáveis cromáticas e tipográficas 100% alinhados a `DESIGN.md`.
- **Rigor editorial e acessibilidade:** `0` links ou menções à Wikipédia em todo o código e conteúdo (9 paradas e 8 eras), `0` headings (`h1–h6`) vazios no DOM pós-boot e link oficial do Yamê (`https://mola-zone.com/`) incluído nas referências e na interface.

## 3. Quadro consolidado de fechamento (P0 / P1 / P2)

Legenda: ✅ concluído e aprovado pela QA · ➖ opcional fora do escopo

| Prioridade | Item | Status | Evidência verificada |
|---|---|---|---|
| P0 acadêmico | Alinhar 9 paradas, 5 descobertas, 8 eras | ✅ | Contagens, navegação `1–9` e ausência de erros factuais confirmadas (`npm test` + QA). |
| P0 acadêmico | Fontes oficiais, remoção da Wikipédia e referência do Yamê | ✅ | `0` menções à Wikipédia; link oficial `https://mola-zone.com/` em `REFERENCES.md`, `src/content.js` e `index.html`. |
| P0 legal | Licenciamento e créditos de modelos 3D (Geep, Phase 7 e Piloto) | ✅ | Geep e Phase 7 (CC BY 4.0) e Piloto Quaternius (CC0 1.0 + acessórios Kong FM) documentados em `DRIVER-CREDITS.txt`, `CREDITS.txt`, `REFERENCES.md` e `index.html`. |
| P1 técnico | Piloto GLB estilizado com skin, animação e encaixe no Geep | ✅ | `driver-pilot.glb` (`1.526` tris, `65` ossos, `Driving_Loop`), posição `(-0.6213, 0.208, 0.4471)` preservada por `if (!pilotRig)` e validada em WebGL2. |
| P1 técnico | Geometria de pistas, cruzamentos e câmera sem colisão fantasma | ✅ | `tests/roads.test.mjs`, `tests/camera.test.mjs` e telemetria real WebGL2 (`4/4` portais, `0` flips em ré, `0/275` clippings). |
| P1 técnico | Zero overflow horizontal em desktop e mobile | ✅ | `scrollWidth <= innerWidth` confirmado em `1920×1080`, `1440×900`, `390×844` e `320×568`. |
| P1 acessibilidade | Zero headings dinâmicos vazios | ✅ | Auditoria DOM pós-boot com `0` elementos `h1–h6` vazios. |
| P2 visual | Garagem Bento 21st.dev e fidelidade ao `DESIGN.md` | ✅ | Layout Bento responsivo, `--blue: #7fa6ff` e grade de referências simétrica em 4 colunas no desktop. |

## 4. Evidências oficiais registradas

- **Relatório QA Gorilazz (navegador real + suíte):** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\qa-final-relatorio.md`
- **Métricas e telemetria QA Gorilazz:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\audit-metrics.json`, `camera-telemetria.json` e 27 capturas PNG na mesma pasta.
- **Relatório QA Plataforma (Blender round-trip 14/14 PASS):** `E:\Plataforma\qa\qa-driver-gorilaz-estilizado-2026-11-20.md`

## 5. Pendências exclusivas do Eduardo (ação manual)

1. Revisar localmente o site no navegador (`node server.mjs`).
2. Executar `git add` e `git commit` exclusivamente com autoria de `eduardo-a-xavier` (sem menção a IA e sem `Co-authored-by`).
3. Executar `git push` para publicar a versão final no GitHub Pages e submeter o link oficial da entrega.

## 6. Limites externos (não auditáveis em ambiente headless local)

- Teste em dispositivo Android físico real (toque, teclado virtual e GPU móvel física).
- Teste manual assistido com leitor de tela (NVDA / TalkBack / VoiceOver).
- Verificação da URL pública HTTPS após o `git push` de Eduardo.

## 7. Atualização 2026-11-21: roadmap mestre (Frente 02 + lote final)

Estado verificado, todas as frentes aprovadas pela QA em navegador real (Playwright + WebGL2); `npm run check` exit 0 e `npm test` 103/103.

| Item do roadmap | Estado | Evidência |
|---|---|---|
| 1.1 Onboarding (boas-vindas, H/F1, dicas) | Aprovado | `evidencias/lote-qa-2026-11-21/qa-lote-relatorio.md` |
| 1.2 Câmera sem jitter | Aprovado (449 → 19 saltos > 0,30 m/quadro) | `evidencias/polimento-2026-11-20/` |
| 1.3 1ª pessoa (braços do piloto, HUD limpa) | Aprovado | `evidencias/polimento-2026-11-20/`, `evidencias/frente02-qa-2026-11-21/` |
| 1.4 Lore e títulos Anton nas 9 paradas | Aprovado | `evidencias/lote-qa-2026-11-21/` |
| 2.1 Rádio no painel + faixa na HUD | Aprovado | `evidencias/frente02-qa-2026-11-21/` |
| 2.2 Minimapa e mapa completo (M) | Aprovado | idem |
| 2.3 Poses e animação da banda | Aprovado | `evidencias/polimento-2026-11-20/` |
| 2.4 Silhueta dos prédios | Aprovado | `evidencias/frente02-qa-2026-11-21/` |
| 3.2 Fliperama único (minigame autoral) | Aprovado | `evidencias/lote-qa-2026-11-21/` |
| 3.3 Fauna + otimização (peso 12,84 → 9,55 MB; 60 FPS nos 3 pontos) | Aprovado | `evidencias/lote-gorilazz-2026-11-21/RELATORIO-rodada2.md` |
| 3.1 Protótipo no Figma | **Não feito**: ferramentas do Figma disponíveis só leem; telas prototipadas direto no código, com prints como evidência | — |

Pendências do Eduardo: revisão local, `git add`/`git commit`/`git push` e publicação. Ninguém além dele cria commits.

## 8. Atualização 2026-11-21 (noite): correções do 3D e Polimento Final

Auditado pela QA em navegador real (relatório: `evidencias/polimento-final-qa-2026-11-21/qa-relatorio.md`): 9/9 itens aprovados; `npm run check` exit 0 e `npm test` 126/126.

- **Tela preta do 3D**: causa era um módulo novo (`src/world-loader.js`) sem rota no servidor, que derrubava o 3D para o modo 2D. Corrigido; novo teste (`tests/module-graph.test.mjs`) rastreia o grafo de imports; falha do 3D agora mostra a mensagem real e o botão "Tentar de novo".
- **Scroll travado no modo 3D** com botão "Voltar para a História"; HUD inferior alinhada em 4 viewports; aviso "Aperte M…" some em 4 s; rádio resiliente (pula faixa com erro).
- **Polimento**: murais/descobertas e outdoors de era a 1,5x com arte WebP carregada por proximidade e créditos; palcos com imagens dos integrantes; iluminação reforçada; mãos/mangas da 1ª pessoa com sombreamento suave.
- **Limites conhecidos**: mãos ainda facetadas (malha do `driver-pilot.glb` com poucos polígonos); bancas/totens fora das descobertas e crédito de imagem nos outdoors não feitos; gradiente de céu e escurecimento da base das fachadas não feitos; protótipo no Figma (3.1) não feito (ferramentas só de leitura).
- **Peso inicial**: 9,13 MB transferido (comprimido) e 11,65 MB decodificado (medição da QA); a Engenharia reportou 9,63 MB por outro método.
- **Operação**: ao alterar `server.mjs` ou criar módulo/asset novo, reiniciar `node server.mjs` (as rotas são lidas na subida).

## 9. Atualização 2026-11-21 (rodadas "Melhorar Mais Ainda" e "Correção")

### 9.1. Rodada "Melhorar Mais Ainda" (`evidencias/melhorar-qa-2026-11-21/qa-melhorar-relatorio.md`)
Veredito QA: **APROVADO (7/7 itens)** · `npm run check` (`33` módulos OK) · `npm test` **130/130 PASS** · `0` erros HTTP/console.

- **Luz e atmosfera:** gradiente de céu em 3 faixas colado à neblina `FogExp2` (`src/atmosphere.js`), escurecimento de base (AO falso) nas fachadas (`src/city.js`), postes com *glow* instanciado (1 *draw call*), halos nos 4 portais de era (`gateHalos`) e iluminação interna da cabine (`clusterHalo`, `radioHalo`, `visorGlow` e luz pontual suave).
- **Escala 1,5× e outdoors com créditos:** bancas, palcos, fliperama e totem direcional `"MURAIS ←|MOINHO →"` em `(9.5, -40.5)` a `1,5×` com folga de `2,26 m` da pista; atlas de outdoors em `2048 × 6528 px` (capas `256 px` em WebP sob demanda), alinhamento 1:1 entre `AD_COVERS` e `ERA_ART`, créditos acadêmicos `≤ 45` caracteres no rodapé dos outdoors e 5º outdoor do Ato 4 atualizado para `COACHELLA 2023 | TURNÊ CRACKER ISLAND · PHASE 7` (mantendo o recorte 1998–2023).
- **Partículas e dicas:** partículas instanciadas ao frear e perto de pontos (`drive-fx-particles`, 1 *draw call*) e ordenação de dicas por proximidade (`rankByProximity`).
- **Piloto v2:** migração para `assets/models/driver-pilot-v2.glb` (fallback garantido para `driver-pilot.glb`), eliminação de fendas no pulso na 1ª pessoa (`V`), cinemática inversa no volante e `smoothNormals()`.
- **Métricas QA:** Kong Studios `59,9 FPS`, Bairro dos Murais `59,8 FPS`, Mirante do Moinho `59,9 FPS`; peso transferido `8,50 MB` (`11,05 MB` decodificado).

### 9.2. Rodada "Correção" + Verificação Final (`evidencias/correcao-qa-2026-11-21/qa-correcao-relatorio.md`)
Veredito QA: **APROVADO (9/9 itens + verificação final 3/3)** · `npm run check` (`35` módulos OK) · `npm test` **139/139 PASS** · `0` erros HTTP/console.

- **HUD, mural e rodapé:** pílula `"E / JOGAR FLIPERAMA"` exibida apenas a `< 4,0 m` do gabinete com o carro parado (`< 2 km/h`); mural da História 1 sem o círculo/farol rosa frontal e em proporção `8.8×4.4` sem distorção; eliminação completa da linha rosa residual no rodapé (`html.mode-3d .trip-meter { display: none !important; }`, `0` pixels `#f5a9c6` no recorte) e remoção do contorno de foco no canvas 3D preservando foco nos botões do HUD; rádio sem mensagens espúrias de falha ao trocar faixas.
- **Fliperama e `ESC`:** ritmo balanceado (`TILE_MS = 170`, ~30% mais cadenciado), objetivo explícito (`#arcade-goal`), placar **Top 5** local em `localStorage` (`gorilazz-fliperama-top5`); `ESC` fecha apenas `#arcade-dialog` sem sair do 3D e solicita `navigator.keyboard.lock(['Escape'])`.
- **Cenário (133 props) e banda v2:** `133` props urbanos (árvores, bancos, canteiros e postes) com folga `≥ 0,90 m` do meio-fio; carga HTTP 200 de `gorillaz-phase7-web-v2.glb`, `noodle-guitar-v2.glb` e `noodle-stage-props-v2.glb` sem avisos de fallback; poses ajustadas em `src/band-pose.js` (2-D com mãos nas teclas e inclinação frontal, Noodle nos sockets da guitarra v2, Russel com baquetas alcançando a caixa).
- **Métricas QA (Verificação Final):** Kong Studios `60,1 FPS`, Bairro dos Murais `60,2 FPS`, Mirante do Moinho `59,9 FPS`; peso transferido `8,70 MB` (`8,55 MB` / `11,12 MB` decodificado na primeira passagem).

## 10. Atualização 2026-11-22: Novas Features, Piano do 2-D e Passeio Guiado

### 10.1. Novas Features e Polimento (`evidencias/correcao-qa-2026-11-22/qa-novas-features-relatorio.md`)
Veredito QA: **APROVADO (7/7 grupos)** · `npm run check` (`35` módulos OK) · `npm test` **155/155 PASS** · `0` erros HTTP/console.

- **Mural 1 e base da tela:** desenho vetorial de reserva (elipses/olhos/coroa) e facho frontal removidos do Mural 1 (moldura creme `2:1`); remoção do degradê escuro inferior (`.scene-shade`); navegação dedicada entre pilotagem e leitura (*“↓ Ler História & Eras”* e *“↑ Voltar ao Carro 3D”*) com `#section-dock` oculto após entrar no 3D.
- **Pilha de `ESC`:** `src/escape-stack.js` validado na ordem `modal > minigame > map > panel > game`, preservando a tela cheia ao fechar piano e modal do 2-D em sequência (com registro do limite nativo do Chrome: com `keyboard.lock` ativo, sair da tela cheia exige segurar `Esc`).
- **Rotação 360° dos integrantes:** ativa nos 4 cards da seção editorial (`#band-grid`, carga *lazy* e supressão de clique ao arrastar `> 4 px`) e no modal **Explorar** (`#view-canvas`, arraste e botões `‹`/`›` em passos de `45°`).
- **Minigame rítmico de piano do 2-D (`src/piano-game.js`, `src/piano-screen.js`):** acesso pelo botão `"TOCAR PIANO (MINIGAME RÍTMICO)"` na ficha do 2-D; 3 faixas com BPMs de referência levantados em `docs/gestao/minigame-piano-bpm.md` (*Tomorrow Comes Today* a **93 BPM**, *Clint Eastwood* a **84 BPM** e *On Melancholy Hill* a **120 BPM**, todas em **4/4**); áudio **100% sintetizado via Web Audio API** (sem fonogramas comerciais protegidos); crédito visível *"Áudio sintetizado próprio · BPMs de referência · uso acadêmico"*; teclas `D F J K` ou toque, julgamentos `Perfect/Good/Miss` no topo do palco e combo.
- **Cena (mãos, fliperama e pombos):** mãos no aro a 11h/1h (`0,75 rad`) com `smoothNormals`; gabinete do fliperama alinhado à pista com câmera focando a tela (`3,4–4,0 m`) ao abrir; pombos em 2 `InstancedMesh` com ciclo completo `idle` → alerta → fuga em voo.
- **Métricas QA:** Kong Studios `60,2 FPS`, Bairro dos Murais `59,7 FPS`, Mirante do Moinho `59,9 FPS`.

### 10.2. Passeio Guiado e Contador de Descobertas (`evidencias/correcao-qa-2026-11-22/qa-passeio-guiado-relatorio.md` e `evidencias/passeio-guiado-2026-11-22/README.md`)
Veredito QA: **APROVADO (6/6 critérios)** · `npm run check` (`40` módulos OK) · `npm test` **165/165 PASS** · `0` erros HTTP/console.

- **Percurso autônomo:** iniciado por `#start-guided` (*“Fazer um passeio guiado”*), percorre as **9 paradas** do mapa (4 portais de era em `CITY_ERAS` + 5 pontos de história em `DISCOVERIES`) pela malha viária, desacelera a `40 m`, pausa `~4,5 s` (`4,49–4,53 s` na QA) exibindo card lateral (título, ano e resumo) e sincroniza a faixa da lista editorial (`setTrack`).
- **Trajeto sem saída de pista:** giro parado sobre o asfalto a `1,6 rad/s` antes de cada trecho (`legTo` em `src/app.js`) zerou as saídas de pista: **0 amostras fora do asfalto** e **0 marchas à ré** nas `616` amostras da auditoria QA (corrida completa em `165,17 s`; `581` amostras e `163,7 s` na medição da Engenharia).
- **Retomada, pausa e contador `X / 9`:** WASD/setas assumem o volante sem tranco; modais, fliperama, minigame e `ESC` pausam o passeio; contador `"DESCOBERTAS: X / 9"` com barra superior persistido em `localStorage` (`gorilazz.stops.v1`), marcas `✓` no mapa (`M`), toast `"Universo Gorillaz 100% Explorado"` em `9/9` (convivendo com o diário `X / 5` sem conflito); correção de `word-spacing` (`0.14em`) nos títulos `h1–h4` e `.tour-card-title`.
- **Métricas QA:** `60,3 FPS` em rAF real durante a condução; 4 viewports (`1440×900`, `1346×680`, `390×844`, `320×568`) sem quebra nem overflow; peso inicial `7,54 MB`.

### 10.3. Rodada Final — Homologação 8/8 (`evidencias/correcao-qa-2026-11-23/qa-rodada-final-relatorio.md`, `qa-rodada-final-telemetria.json`, `evidencias/rodada-final-2026-11-23/README.md` e `engenharia-resultados.md`)
Veredito QA: **APROVADO (8/8 itens — 100% de conformidade técnica)** · `npm run check` (`40` módulos OK) · `npm test` **174/174 PASS** · `0` erros HTTP/console/página.

- **Piano do 2-D (Magic Tiles 3):** diálogo em ~`90vw × 85vh` (`90,0%` de largura e `79,2%–85,0%` de altura nos 4 viewports `1440×900`, `1346×680`, `390×844` e `320×568`), 4 pistas, erro destacando a coluna em `#FF2A2A` com tremor (`shake`) de `150 ms` + som + reset de combo, banner `ERRO: tecla errada` inteiro nos 4 tamanhos, acerto com feedback verde/ciano (`PERFEITO`/`BOM`) e `ESC` fechando o minigame sem derrubar a tela cheia.
- **Fliperama KONG ARCADE:** reposicionado em `(-13.5, -10)` de frente para a calçada/via com anel luminoso rosa (`arcade-ring`) e base cinza (`arcade-pad`), câmera aproximando a `3,4 m` da tela ao pressionar `E`, tela inicial exibindo a meta total do labirinto (*“colete todos os 117 pontos”*, sem `"Restam 0"`) e ranking **Top 5** local funcional via `localStorage`.
- **Descobertas `X / 9` e palcos dos integrantes:** as 9 paradas (`4` portais de era + `5` pontos de história) somam estritamente 1 vez via `E` (`0 → 9`), repetição não soma, mapa (`M`) exibe 9 `✓`, toast `"Universo Gorillaz 100% Explorado"` dispara em `9/9` e o contador persiste após reload. Os 4 palcos dos integrantes (2-D, Murdoc, Noodle, Russel) abrem a ficha biográfica e **não** somam no contador (`stopIdFor` filtra integrantes, por desenho — decisão pendente de Eduardo em `docs/gestao/DECISOES.md`).
- **Passeio Guiado e rádio Kong FM:** câmera cinematográfica dedicada em órbita (`7,5 m` de raio, `3,4 m` de altura) durante os `~4,5 s` de cada parada; WASD encerra o passeio e restaura suavemente a câmera normal (`clearPose()`); troca de faixa limitada às **2 faixas liberadas** no player local (*Maré de plástico* na parada da era plástico; *Concreto* nas demais).
- **Câmera (stutter e copas):** frame time em 60 FPS sem stutter (`p50 16,7 ms`, `p95 17,0 ms`, `p99 17,2 ms`, `0` quadros `> 33 ms` em 400 amostras na QA); `0` travessias de copa no trajeto do passeio guiado e redução de `9` para `4 de 576` amostras em zigue-zague manual rente a 16 árvores com bloqueio de copas e piso de `7,5 m` (limite aceito para não alterar o braço mínimo da câmera).
- **Piloto v4 em 1ª pessoa (`V`):** `assets/models/driver-pilot-v4.glb` ativo na cadeia de fallback `v4 → v2 → original`; mãos presas ao aro nas posições 11h/1h sem fresta no pulso com a manga rosa; 65 joints sem rasgos de malha, com **leve faceta poligonal** nos nós dos dedos esquerdos em zoom macro.
- **Cena (integrantes, placa e props):** pose do Murdoc levemente ajustada (`inclinação -0,03`, contato de mão no instrumento, baixo encostado no peito e traste elevado; braço do corpo ainda encoberto atrás do instrumento); Noodle e Russel desobstruídos após remoção de árvores em raio de `16 m` dos palcos (`src/street-props-plan.js` e `src/world-data.js`); placa **`RUA SONG MACHINE`** (índice 9 de `ROAD_NAMES`) em poste de `4,2 m` com placa a `3,85 m`, legível de frente.
- **Regressão de `ESC`:** corrigido o bug do `<details open>` no arquivo de eras em `src/app.js` (observer restrito a `<dialog>`, evitando `top.close is not a function`).

### 10.4. Fechamento Final Pré-Push (24–25/11/2026)
Veredito QA de Congelamento + Lote Pré-Push (`evidencias/fechamento-final-2026-11-26/relatorio_congelamento_final.md`): **`npm run check` (`53` arquivos JS/MJS OK)** · **`npm test` (`272/272 PASS`)** · subcaminho `/Gorilazz/` validado com `146/146` HTTP `200/304` e `0` erros.

- **Piloto v6 e Cockpit (`assets/models/driver-pilot-v6.glb`):** encaixe simétrico das mãos no aro do volante nas três poses (diferença palma-aro `<= 0,36 cm`), acabamento fosco sem brilho estourado, rádio deslocado para a direita sem colisão com a mão e cadeia de fallback `v6 → v5 → v4 → v2 → original` (revisão intermediária `v3` removida em `9e2f1a7`).
- **Cenário CC0, limpeza de mapa e aterramento (`assets/models/scenery/`, `src/ground-fit.js`):** **22 GLBs próprios CC0** carregados de forma *lazy* em `InstancedMesh`; **bancos e pedras removidos do mapa (limite 0)**; **21 casas/blocos isolados removidos do mundo**; discos coloridos de praça por bairro removidos; árvores e arbustos aterrados em `y = -0,06` (`src/ground-fit.js`); fauna de pombos ajustada de `56` para **`28`**; exposição ajustada para **`1,38`** (`renderer.toneMappingExposure`).
- **Passeio Guiado (sequência fixa curada `TOUR_ORDER`):** reestruturado para **sequência fixa curada ao redor da ilha** (`TOUR_ORDER`, 9 paradas na mesma ordem a partir de qualquer ponto de partida, entrada pela via mais próxima, spline *Catmull-Rom* com **8 subdivisões**, rampa de aceleração na saída de `1,8 s`, ré de destravamento só após `1,5 s` bloqueado e transição suave de `4,5 s` na parada com câmera dedicada e *fade* da Kong FM).
- **Malha viária, calçadas e texturas CC0 do ambientCG (`src/roads.js`, `assets/materials/`):** calçadas das rotatórias sem lajes em leque, junções chanfradas de calçada, acesso de calçada dos prédios (`accessPad`) e discos das rotatórias em **`10,9 m`** (nós 1, 3, 5, 6) e **`9,5 m`** (nó 7); texturas de chão substituídas por pacotes CC0 do **ambientCG** (`Asphalt012`, `PavingStones130`, `Ground037`) em `.webp` `512 px` com **anisotropia 8**, registrados com IDs, URLs e SHA-256 em `REFERENCES.md`.
- **Kit modular de calçada em Blender (`assets/models/scenery/sidewalk-kit/`):** 5 peças `.glb` CC0 originais e evidências em `docs/gestao/evidencias/kit-calcada-2026-11-26/` — **kit preparado para evolução pós-banca** (ainda não integrado ao jogo).
- **Rádio Kong FM e Áudio Procedural (`src/local-radio.js`, `src/discovery-sound.js`):** **5 faixas** disponíveis na Kong FM (3 músicas do Gorillaz mantidas sob demanda + 2 instrumentais originais); motor procedural de 4 marchas com ganho corrigido (alvo **`0,22`**), pombos nas praças, atenuação espacial por distância nos palcos (`34 m`) e *ducking* da Kong FM até `35%`.
- **Faxina de assets (commit `9e2f1a7` + texturas ambientCG):** removidos PNGs antigos de `assets/materials/` e GLBs pesados legados (`gorillaz-phase7.glb`, `gorillaz-phase7-v2.glb`, `gorillaz-phase7-web-v2.glb`, `driver-pilot-v3.glb`, `kenney-suv-luxury.glb`, `noodle-guitar-v2.glb`), fechando `assets/` em **`28,47 MB`** (`110` arquivos, `40` GLBs no total) e o pacote estático publicado no GitHub Pages em **`30,06 MB`** (`164` arquivos; carga inicial 3D em Chrome real: **`8,58 MB`**).

## 11. Resumo das medidas verificadas e método declarado (21–25/11/2026)

| Rodada (QA) | `npm run check` | `npm test` | FPS (Kong / Murais / Moinho) | Peso transferido (rede) | Peso decodificado (memória) |
|---|---|---|---|---|---|
| Polimento Final (21/11) | OK | 126/126 | 60 / 61 / 57 | 9,13 MB | 11,65 MB |
| Melhorar Mais Ainda (21/11) | 33 módulos OK | 130/130 | 59,9 / 59,8 / 59,9 | 8,50 MB | 11,05 MB |
| Correção + Verif. Final (21/11) | 35 módulos OK | 139/139 | 60,1 / 60,2 / 59,9 | 8,55–8,70 MB | 11,12 MB |
| Novas Features (22/11) | 35 módulos OK | 155/155 | 60,2 / 59,7 / 59,9 | 4,18 MB (landing) · 7,56 MB (3D) · 8,41 MB (com cards 360°) | — |
| Passeio Guiado (22/11) | 40 módulos OK | 165/165 | 60,3 (corrida real) | 7,54 MB (QA) · 4,34 / 8,08 MB (Eng.) | — |
| Rodada Final (22–23/11) | 40 módulos OK | 174/174 | 60,1 / 60,0 / 60,0 | 1,32 MB (landing) · 8,58 MB (3D inicial; teto 9,3 MB) · 9,95 MB (acumulado editorial) · 4,34 / 8,10 MB (Eng.) | — |
| **Fechamento Pré-Push (25/11)** | **53 arquivos OK** | **272/272** | **60,1 / 60,0 / 60,0** *(ref. Chrome real)* | **8,58 MB (3D inicial) · `assets/` 28,47 MB · pacote Pages 30,06 MB** | — |

- **Método declarado de peso:** soma exata dos bytes do cabeçalho `Content-Length` efetivamente transferidos por `server.mjs` (com `gzip` em textos e formatos comprimidos `.webp`/`.glb`/`.mp3`) para cada URL distinta requisitada na sessão, descartando objetos `blob:` internos do navegador. Quando reportado, o *peso decodificado* soma o corpo descompactado em memória após decodificação pelo navegador.
- **Método declarado de FPS e frame time:** medição via `requestAnimationFrame` (rAF) real em Google Chrome estável com WebGL2 (ANGLE D3D11) a `1440×900`, com `?perf=1`, nos três pontos de referência (Kong Studios/Mural, Palco dos Integrantes e Centro/Pista) e durante a condução (frame time na Rodada Final: `p50 16,7 ms`, `p95 17,0 ms`, `p99 17,2 ms`, `0` quadros `> 33 ms`).

## 12. Decisões pendentes, pendências honestas e fora de escopo (estado final 25/11/2026)

### 12.1. Decisões fechadas por Eduardo (25/11/2026)
- **Contador de descobertas (`X / 9`) — MANTIDO:** Eduardo confirmou em 25/11/2026 a manutenção de `X / 9` (`4` portais de era + `5` pontos de história). Os 4 palcos dos integrantes (2-D, Murdoc, Noodle e Russel) permanecem como fichas biográficas 360° separadas e **não** entram no contador (`docs/gestao/DECISOES.md`).
- **Alinhamento dos textos dos MP3s (`README.md` e `REFERENCES.md`) — CONCLUÍDO:** frases contraditórias removidas em 25/11/2026, explicitando que os 3 MP3s comerciais em `assets/audio/` são carregados sob demanda (`preload="none"`), para fins estritamente acadêmicos ilustrativos, sem redistribuição comercial e com procedência/permissões não verificadas.

### 12.2. Pendências honestas e limites conhecidos (não ocultados)
- **LOD dos props instanciados:** **não feito** (sem medição de ganho de desempenho que o justifique nesta entrega).
- **Revisão detalhada de caixas de som e totens:** verificados apenas por geometria/apoio geral sobre as calçadas, sem revisão individual exaustiva das 9 paradas (bancos e pedras foram removidos do mapa — limite 0).
- **Licença formal dos instrumentais originais (`assets/radio/`):** os 2 instrumentais da Kong FM (*Concreto* e *Maré de plástico*, que acompanham as 3 faixas do Gorillaz nas **5 faixas** da rádio) seguem sem arquivo de licença formal separado e sem BPM confirmado em `REFERENCES.md`.
- **Limites visuais e de câmera aceitos:** limite aceito de `4 de 576` amostras atravessando copas de árvore em zigue-zague manual rente a 16 árvores (braço mínimo da câmera a `7,5 m`); passeio iniciado fora da Hero `(0, 0)` não validado em corrida completa; micro-vibração visual ligada ao RPM do motor não implementada.
- **Validação manual fora de automação:** teste em celular físico Android/iOS (`GZ-06`), teste com leitor de tela real e verificação manual do comportamento nativo do Chrome ao segurar `Esc` em tela cheia com `keyboard.lock` ativo.
- **Ações exclusivas de Eduardo:** confirmação de rubrica/formato/hospedagem (`GZ-01`), validação em aparelho físico (`GZ-06`), ensaio na URL publicada (`GZ-07`), revisão final local (`node server.mjs`), `git add`, `git commit` (sem `Co-authored-by`) e `git push`.

### 12.3. Fora do escopo desta entrega / evolução pós-banca
- **Kit modular de calçada em Blender (`assets/models/scenery/sidewalk-kit/`):** 5 peças `.glb` CC0 originais com evidências em `docs/gestao/evidencias/kit-calcada-2026-11-26/` — **kit preparado para evolução pós-banca**, ainda **não** integrado ao jogo nesta entrega.
- Artes internas de ***Gorillaz: Rise of the Ogre*** (Penguin Group) e ***Gorillaz Almanac*** (Z2 Comics), por direitos autorais fechados e ausência de fonte oficial aberta.
- **Protótipo no Figma** (item 3.1 do roadmap), pois as ferramentas Figma disponíveis no ambiente operam apenas em modo leitura; as interfaces foram prototipadas diretamente no código com evidências em capturas de tela.
