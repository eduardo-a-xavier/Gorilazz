# Relatório de Validação QA — Polimento (Câmera, 1ª Pessoa, Banda, Painéis)

- **Auditoria inicial:** 2026-11-20 21:47–21:57 (America/Sao_Paulo)
- **Revalidação pós-correção:** 2026-11-20 22:07–22:12 (America/Sao_Paulo)
- **Repositório:** `E:\Gorilazz-Relatorio` (modo somente-auditoria; nenhum código-fonte alterado; sem `git add`/`commit`/`push`)
- **Ambiente:** Navegador real Chromium via Playwright + WebGL2 (ANGLE/D3D11), servidor dedicado `node server.mjs` reiniciado em `PORT=3115` (`0` processos residuais na porta `3115`; `0` `blender.exe`)
- **Veredito Geral Final (pós-revalidação):** **APROVADO EM TODAS AS 5 FRENTES** (4/4 defeitos da rodada inicial fechados e comprovados em navegador real; registrada apenas 1 observação cosmética P3 no HUD mobile `390×844` em 1ª pessoa).

---

## 1. Veredito por Frente (Pós-Revalidação)

| Frente | Rodada Inicial | Pós-Revalidação | Resumo Objetivo |
|---|---|---|---|
| **1. Câmera (`src/scene.js`)** | **APROVADO** | **APROVADO** | Benchmark `measure-camera.mjs novo` reconfirmado (`32.736` quadros, `jump >0,30m = 19` vs `449` no legacy, `maxJump = 0.342 m`, `clip = 0`, `occluded = 0`, `minGap = 9.79 m`, `minDist = 13.56 m`). Regressão ao vivo no Portal Ato 3: `70` quadros, `insideBuildingFrames = 0`. |
| **2. 1ª Pessoa (`cabin.js`, `pilot-rig.js`, `scene.js`)** | **REPROVADO** | **APROVADO** | **3/3 defeitos fechados.** Sem arrastar o mouse, ao pressionar `V`, volante e duas mãos aparecem de imediato nos 3 viewports (`1585×746`, `1440×900` e `390×844`), acompanhando esterço esquerda/direita e foco do rádio (`R`). Luvas claras + punhos rosa + mangas azul-petróleo têm alto contraste; antebraço direito contínuo no rádio; LCD `KONG FM / PAUSA / Concreto` 100% fora da chapa preta (zero clipping); `boxArmsAnyVisible = false`. *(Nota cosmética P3 em `390×844`: botão `R · Sintonizar` / `Esc · Voltar à estrada` encosta sobre a barra compacta de áudio na base esquerda.)* |
| **3. Banda (`band-pose.js`)** | **APROVADO** | **APROVADO** | 4/4 integrantes (`2-D`, `Murdoc`, `Noodle`, `Russel`) com mãos nos instrumentos e `SkinnedMesh` (`phase7-arms-v1`) animando continuamente; regressão rápida confirmou **58 FPS** perto da banda (`52.7–56.1 FPS` na rodada inicial). |
| **4. Painéis, Capas, Outdoors & Créditos** | **APROVADO COM RESSALVA (P2)** | **APROVADO** | **Defeito P2 dos outdoors fechado.** Close-ups do Ato 4 confirmam `SONG MACHINE`, `CRACKER ISLAND` e `THE MOUNTAIN` 100% legíveis sem letra cortada, com `THE MOUNTAIN` e `MONKEY` sem capa (`null` em `src/city.js`). Regressão confirmou `8/8` capas `600×600` HTTP 200, `0` overflow em `1440×900` e `390×844`, `0` Wikipédia, créditos preservados em `README.md` e `REFERENCES.md`, `0` erros de console/página/HTTP. |
| **5. Suíte Automatizada** | **APROVADO** | **APROVADO** | `npm run check` (`exit 0`, 23 arquivos) e `npm test` **73/73 PASS** (`0 fail`, `0 skipped`, `2946.67 ms`). |

---

## 2. Revalidação Pós-Correção (Fechamento dos 4 Defeitos)

### Fechamento dos Defeitos da Rodada Inicial
| ID | Severidade | Descrição | Status Pós-Revalidação | Evidência Principal |
|---|---|---|---|---|
| **Defeito 1** | P1 | Em 1ª pessoa padrão (`V`), volante e mãos fora da tela sem arrastar o mouse | **FECHADO** | `1440×900`: `hand_l/r ndcY = -0.573` (`inFrame: true`); `1585×746`: `ndcY = -0.547` (`inFrame: true`); `390×844`: `ndcY = -0.497`, `fov ≈ 83–88°` (`inFrame: true`). Prints `reval-1p-*-parado.png`. |
| **Defeito 2** | P1 | Contraste baixo de luvas/mangas escuras e descontinuidade do antebraço no rádio (`R`) | **FECHADO** | Luvas claras, punhos rosa e mangas azul-petróleo nitidamente legíveis contra o cockpit/volante escuro em parado/esquerda/direita; em `R`, mão direita com antebraço azul-petróleo contínuo sobre as teclas do rádio nos 3 viewports. Prints `reval-1p-*-esquerda/direita/radio.png`. |
| **Defeito 3** | P2 | Clipping do canto superior esquerdo do LCD `KONG FM / Concreto` na chapa preta | **FECHADO** | Display LCD `KONG FM / PAUSA / Concreto` e teclas 100% livres da chapa preta em `1440×900`, `1585×746` e `390×844` (em visão normal e em `R`). |
| **Defeito 4** | P2 | Capa nos outdoors 3D do Ato 4 cortando a 1ª letra (`SONG MACHINE`, `CRACKER ISLAND`, `THE MOUNTAIN`) e capa indevida em `THE MOUNTAIN` | **FECHADO** | Texto deslocado à direita quando há capa; `SONG MACHINE` (`S` íntegro), `CRACKER ISLAND` (`C` íntegro) e `THE MOUNTAIN` centralizado sem capa (`null` confirmado para `THE MOUNTAIN` e `MONKEY`). Prints `reval-outdoors-ato4-closeup.png` e `reval-outdoors-ato4-detalhe.png`. |

### Resumo Numérico de 1ª Pessoa Sem Arrastar o Mouse (`revalidacao_pos_correcao`)

| Viewport | Estado | `FOV` | `steering` | `hand_l` (`ndcX, ndcY`, `inFrame`) | `hand_r` (`ndcX, ndcY`, `inFrame`) | `boxArmsAnyVisible` | Overflow |
|---|---|---:|---:|---|---|---|---|
| **1440×900** | Parado (`V`) | `72.5°` | `0.000` | `(-0.199, -0.573)` `true` | `(0.200, -0.573)` `true` | `false` | `false` (`1440/1440`) |
| **1440×900** | Esquerda (`A`) | `75.0°` | `+0.496` | `(-0.227, -0.696)` `true` | `(0.101, -0.361)` `true` | `false` | — |
| **1440×900** | Direita (`D`) | `75.0°` | `-0.380` | `(-0.119, -0.393)` `true` | `(0.232, -0.635)` `true` | `false` | — |
| **1440×900** | Rádio (`R`) | `75.0°` | `0.000` | `(-0.609, -0.517)` `true` | `(0.051, -0.340)` `true` (`lowerarm_r: true`) | `false` | — |
| **1585×746** | Parado (`V`) | `73.5°` | `0.000` | `(-0.143, -0.547)` `true` | `(0.144, -0.547)` `true` | `false` | — |
| **1585×746** | Esquerda (`A`) | `75.0°` | `+0.492` | `(-0.167, -0.693)` `true` | `(0.074, -0.363)` `true` | `false` | — |
| **1585×746** | Direita (`D`) | `75.0°` | `-0.386` | `(-0.090, -0.388)` `true` | `(0.166, -0.644)` `true` | `false` | — |
| **1585×746** | Rádio (`R`) | `75.0°` | `0.000` | `(-0.447, -0.516)` `true` | `(0.038, -0.341)` `true` (`lowerarm_r: true`) | `false` | — |
| **390×844** | Parado (`V`) | `82.7°` | `0.000` | `(-0.585, -0.497)` `true` | `(0.588, -0.497)` `true` | `false` | `false` (`390/390`) |
| **390×844** | Esquerda (`A`) | `87.8°` | `+0.497` | `(-0.633, -0.557)` `true` | `(0.282, -0.289)` `true` | `false` | — |
| **390×844** | Direita (`D`) | `88.0°` | `-0.405` | `(-0.321, -0.306)` `true` | `(0.639, -0.515)` `true` | `false` | — |
| **390×844** | Rádio (`R`) | `88.0°` | `0.000` | `(-1.694, -0.411)` `false` *(foco no rádio)* | `(0.143, -0.270)` `true` (`lowerarm_r: true`) | `false` | — |

### Regressão Rápida & Telemetria de Erros (Pós-Correção)
- `console_errors`: **0**
- `page_errors`: **0**
- `http_errors (status >= 400)`: **0**
- Capas carregadas no painel de eras: **8/8** (`600×600 px`)
- Menções/links à Wikipédia: **0**
- Overflow horizontal: **0** em `1440×900` (`docSW=1440`) e **0** em `390×844` (`docSW=390`)
- Banda: **58 FPS** perto dos integrantes
- Câmera (Portal Ato 3): `70` quadros, `insideBuildingFrames = 0`; benchmark `measure-camera.mjs novo` idêntico ao baseline (`19` saltos `>0.30m`, `maxJump = 0.342 m`, `0` clip, `0` oclusão)
- `npm run check`: `exit 0` | `npm test`: **73/73 PASS** (`0 fail`, `0 skipped`, `2946.67 ms`)

### Observação Cosmética Não-Bloqueante (P3)
- **[P3] Sobreposição leve no HUD mobile (`390×844`) em 1ª pessoa:** nos prints `reval-1p-390x844-*.png`, o botão `R · Sintonizar` / `Esc · Voltar à estrada` sobrepõe parcialmente a barra compacta de áudio (`play / ≡`) na parte inferior esquerda da tela estreita. Não impede o uso nem afeta a legibilidade da cabine/volante/rádio, mas fica registrado para eventual ajuste futuro de espaçamento mobile.

---

## 3. Histórico da Rodada Inicial (21:47–21:57)

### Frente 1 — Câmera (`src/scene.js`)
- Benchmark `measure-camera.mjs` (132 percursos × 32.736 quadros): `legacy` `449` → `novo` `19` saltos `>0,30 m/quadro` (**−95,8%**), `maxJump` `0.689 → 0.342 m`, `clip = 0`, `occluded = 0`, `minGap = 9.79 m`, `minDist = 13.56 m`.
- Reprodução WebGL2 dos 3 cenários do vídeo do Eduardo (`20261121-0016-47.3110488.mp4`):
  - **Trecho A** (Av. Kong Studios → curva rente a prédios até `108 km/h`): `178` quadros, `inside = 0`, `occluded = 0`.
  - **Trecho B** (Av. DoYaThing atravessando Portal Ato 3 `A BRIGA E O HIATO` a `108 km/h`): `105` quadros, `inside = 0`, `occluded = 0`.
  - **Trecho C** (Ato 4 prédios de neon + freada + ré a `15 km/h`): `141` quadros, `inside = 0`, `occluded = 0`, zero flip 180°.

### Frente 3 — Banda (`src/band-pose.js`)
| Integrante | Instrumento | Rig `phase7-arms-v1` | Δ `head` (30f) | Δ `left_forearm` | Δ `right_forearm` | FPS WebGL2 | Captura |
|---|---|---|---|---|---|---|---|
| 2-D | Teclado + microfone | Sim | `0.05119` | `0.02754` | `0.01968` | `56.1` | `banda-01-twod.png` |
| Murdoc | Baixo | Sim | `0.05539` | `0.06813` | `0.08360` | `52.7` | `banda-02-murdoc.png` |
| Noodle | Guitarra | Sim | `0.02426` | `0.04607` | `0.03441` | `54.4` | `banda-03-noodle.png` |
| Russel | Bateria + baquetas | Sim | `0.00845` | `0.10350` | `0.08775` | `56.1` | `banda-04-russel.png` |

### Frente 4 — Créditos & Capas
- 8/8 capas HTTP 200 e `600×600 px` no DOM (`gorillaz-2001.jpg`, `demon-days-2005.jpg`, `plastic-beach-2010.jpg`, `the-fall-2010.jpg`, `humanz-2017.jpg`, `the-now-now-2018.jpg`, `song-machine-2020.jpg`, `cracker-island-2023.jpg`).
- Créditos preservados em `README.md` e `REFERENCES.md` (incluindo `driver-pilot.glb` CC0 e tabela SHA-256 das 8 capas Parlophone/Apple Music).

---

## 4. Inventário de Evidências Salvas

Pasta: `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\`

### Relatório e Métricas
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\qa-polimento-relatorio.md`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\polimento-metrics.json`

### Capturas da Revalidação Pós-Correção (14 prints)
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1440x900-parado.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1440x900-esquerda.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1440x900-direita.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1440x900-radio.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1585x746-parado.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1585x746-esquerda.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1585x746-direita.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-1585x746-radio.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-390x844-parado.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-390x844-esquerda.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-390x844-direita.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-1p-390x844-radio.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-outdoors-ato4-closeup.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\reval-outdoors-ato4-detalhe.png`

### Capturas da Rodada Inicial (17 prints)
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\cam-eduardo-trechoA-predios.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\cam-eduardo-trechoB-portal3.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\cam-eduardo-trechoC-re-neon.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\1p-01-parado-visao-padrao.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\1p-02-parado-olhando-volante.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\1p-03-esterco-esquerda.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\1p-04-esterco-direita.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\1p-05-radio.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\banda-01-twod.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\banda-02-murdoc.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\banda-03-noodle.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\banda-04-russel.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\paineis-01-eras-gorillaz-1440.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\paineis-02-eras-cracker-1440.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\paineis-03-outdoors-cidade3d.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\paineis-04-eras-mobile-390.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\polimento-2026-11-20\paineis-05-outdoors-ato4.png`

---

## 5. Pendências Externas
- Teste em dispositivo Android físico real (GPU móvel, toque simultâneo e legibilidade em tela pequena).
- Teste com leitor de tela real (NVDA/TalkBack/VoiceOver).
- Verificação em URL pública HTTPS após deploy e `git commit`/`git push` (autor exclusivo: Eduardo).
