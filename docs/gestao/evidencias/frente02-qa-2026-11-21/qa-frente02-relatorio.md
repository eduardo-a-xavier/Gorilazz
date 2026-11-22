# Relatório de Validação QA — Frente 02 (Gorilazz A3)

- **Data / Hora:** 2026-11-21 00:06–00:18 (America/Sao_Paulo)
- **Repositório:** `E:\Gorilazz-Relatorio` (modo somente-auditoria; nenhum código-fonte alterado; sem `git add`/`commit`/`push`)
- **Ambiente:** Navegador real Chromium via Playwright + WebGL2 (ANGLE/D3D11), servidor dedicado `node server.mjs` em `PORT=3116` (`0` processos residuais ao final; `0` `blender.exe`)
- **Suíte automatizada:** `npm run check` (`exit 0`, 25 módulos) · `npm test` **89/89 PASS** (`0 fail`, `0 skipped`)
- **Veredito Geral:** **APROVADO NA REVALIDAÇÃO** (Auditoria inicial apontou 5 defeitos que foram corrigidos pela Engenharia e reauditados com sucesso em navegador real Playwright + WebGL2; todos os 7 itens agora estão **APROVADOS**, com meta de FPS `>= 50` superada alcançando 60.1–60.5 FPS estáveis nos 3 pontos da cidade).

---

## 1. Veredito por Item

| Item | Veredito | Resumo Objetivo |
|---|---|---|
| **1. Interior (Rádio 3D + 1ª pessoa sem arrastar)** | **APROVADO COM RESSALVA (P2)** | Rádio 3D detalhado (`FM 101.9 · KONG FM · FAIXA 01/02` e `02/02`, `PAUSA`/`NO AR`, barra de volume, equalizador de 6 colunas, 2 seletores rotativos, 6 botões em relevo) com **LCD do rádio 100% sem clipping**. Ao apertar `V` sem arrastar mouse, volante + duas mãos aparecem de imediato em `1585×746`, `1440×900` e `390×844` (`boxArmsAnyVisible=false`). **Ressalva P2:** o mostrador do **velocímetro 3D (`cluster`)** clippa/z-fighta na chapa preta ao olhar para o rádio (`R`, `qa-f2-04-1p-radio-detalhe.png`). |
| **2. HUD / Prompts em 1ª pessoa + fade + quick-view** | **REPROVADO (2× P2)** | Desktop (`1440×900`, `1585×746`) e `390×844` limpos (`0` sobreposição entre `.cabin-tools`, minimapa, rádio e pedais); botões quick-view (`V`, `M`, `F`) ok. **Reprova em 2 pontos P2:** (a) em **`320×568`**, `R · Sintonizar` vaza da pílula `.cabin-tools` e **sobrepõe o botão `≡` da barra de rádio `#road-radio`** (`qa-f2-05-1p-320x568.png`); (b) o **fade de `.cabin-tools` não atua** ao dirigir com foco no canvas (`opacity` fica em `1` enquanto minimapa e rádio caem para `0.18`). |
| **3. Prédios (silhueta + regressão)** | **APROVADO** | Silhueta orgânica confirmada em 60 lotes (`núcleo 4.64`, `intermediário/Ato 4 5.00`, `bordas 3.45` andares de média; maior salto entre vizinhos `<16 m` = `2` andares). Outdoors do Ato 4 íntegros (`SONG MACHINE`, `CRACKER ISLAND`, `THE MOUNTAIN` sem capa, `HUMANZ`). `measure-camera.mjs novo` confirmou `10` saltos `>0.30 m` em `32.736` quadros (`clip=0`, `occluded=0`); travessia ao vivo do Portal Ato 3 estável; `tests/roads.test.mjs` ok. |
| **4. Aves (fauna + FPS >= 50 em 3 pontos)** | **APROVADO** | `56` aves em 2 `InstancedMesh` (`fauna-bodies`, `fauna-wings`): `19` praças, `23` calçadas, `14` beirais; **`0` sobre asfalto**, **`0` dentro de prédios** (`CITY_LOTS` e `BUILDINGS`). Ao vivo: `idle` animado (`idle_animated=true`), fuga sobe até `y=8.90 m`, retorno completo ao pouso (`return_max_y=0.078 m`). **FPS em 3 pontos da cidade:** **60.0 / 60.0 / 60.0 FPS** (meta `>= 50`). |
| **5. Minimapa e tecla `M`** | **REPROVADO (P0)** | Minimapa com zoom dinâmico (`AUTO` `184×165` → `ZOOM +` `133×119` → `72 KM/H` `229×205`) e ícones ok; `M` abre/fecha, `Esc` e clique fora fecham, `M` ignorado em campo de texto ok. **Rótulos `MIRANTE` e `BAIRRO` já corrigidos na build atual (`0` colisões SVG)** (`qa-f2-10-mapa-m-1440.png`). **Reprova por Defeito P0:** clicar em qualquer **Região (`R1/R2/R3`)** ou **Integrante (`2/M/N/R`)** no mapa `M` lança `TypeError` em `src/journey-guide.js:46` e **congela permanentemente o loop 3D do jogo**. |
| **6. Músicas (Kong FM HUD + 3D)** | **APROVADO** | HUD mostra `Concreto` (`01/02`) e `Maré de plástico` (`02/02`); botões `←`/`▶`/`→` e atalhos `[`/`]` trocam de faixa e sincronizam em tempo real com o visor 3D (`FAIXA 02/02`, `NO AR`, equalizador animado em `qa-f2-12-radio-3d-faixa02-noar.png`). HTTP 200 nos dois MP3; `0` erro de áudio no console. |
| **7. Geral (erros, overflow, Wikipédia, créditos)** | **REPROVADO (P0 + P1)** | `0` overflow horizontal (`1440×900`, `390×844`, `320×568`), `0` headings vazios, `0` Wikipédia, `8/8` capas `600×600` HTTP 200, créditos preservados em `README.md`/`REFERENCES.md`/`index.html`. **Reprova por erros em runtime:** `1` `pageerror` P0 (`journey-guide.js:46`) e **HTTP 404 + `console.error`** em assets do lote paralelo em andamento (`/assets/fonts/anton-latin.woff2` e `Anton-Regular.ttf` na rodada 1; `/src/assets/covers/gorillaz-2001.jpg` na rodada 2). |

---

## 2. Defeitos Encontrados (com Severidade e Passos para Reproduzir)

### [P0 — Bloqueante] Defeito 1 — Clicar em Região (`R1–R3`) ou Integrante (`2/M/N/R`) no mapa `M` trava o jogo inteiro
- **Arquivos envolvidos:** `src/app.js:353,359` e `src/journey-guide.js:46`
- **Stack trace capturada em navegador real:**
  ```text
  TypeError: Cannot read properties of undefined (reading 'name')
      at Object.update (http://127.0.0.1:3116/src/journey-guide.js:46:47)
      at frame (http://127.0.0.1:3116/src/app.js:440:9)
  ```
- **Passos para reproduzir:**
  1. Abrir `http://127.0.0.1:3116/`, clicar em **Quero dirigir** e pressionar **`M`** para abrir o mapa completo.
  2. Clicar em **Bairro dos murais (`R2`)** (ou qualquer outra Região `R1–R3` ou Integrante `2-D`/`Murdoc`/`Noodle`/`Russel`).
- **Observado:** `item.target` não inclui a propriedade `region` (`{ x, z, title }`). No frame seguinte, `regions[current.region].name` explode dentro de `frame()` antes de reagendar `requestAnimationFrame(frame)` (`src/app.js:490`), **congelando permanentemente a cena 3D, o veículo, as aves e a câmera** até recarregar a página.
- **Esperado:** incluir `region: i` nas regiões (`src/app.js:353`) e `region: regionAt(MEMBER_LOCATIONS[i])` nos integrantes (`src/app.js:359`), além de proteger `regions[current.region]?.name` com fallback em `src/journey-guide.js:46`.

### [P1] Defeito 2 — HTTP 404 + `console.error` na carga de assets do lote paralelo (fontes Anton / pôster em CSS)
- **Arquivos envolvidos:** `server.mjs`, `src/editorial.css` / CSS de pôsteres em `src/`
- **Passos para reproduzir:**
  1. Abrir `http://127.0.0.1:3116/` com DevTools (aba Network + Console).
- **Observado:**
  - Rodada 1 (`00:13:25`): `404 Not Found` para `/assets/fonts/anton-latin.woff2` e `/assets/fonts/Anton-Regular.ttf` (faltavam no `Map` de rotas de `server.mjs`).
  - Rodada 2 (`00:17:00`, após atualização paralela em `src/`/`server.mjs`): os 404 das fontes cessaram, mas surgiu `404 Not Found` para `http://127.0.0.1:3116/src/assets/covers/gorillaz-2001.jpg` (caminho `./assets/covers/...` resolvido relativamente a `/src/` em vez de `../assets/covers/...`).
- **Esperado:** `0` erros HTTP `>= 400` e `0` `console.error` na carga da página.

### [P2] Defeito 3 — Sobreposição entre `R · Sintonizar` e o botão `≡` do rádio em `320×568`
- **Arquivos envolvidos:** `src/world.css:325-333`
- **Evidência:** `qa-f2-05-1p-320x568.png`
- **Passos para reproduzir:**
  1. Redimensionar viewport para `320×568`, clicar em **Quero dirigir** e entrar em 1ª pessoa (`V`).
- **Observado:** `#road-radio` ocupa `x = 12..208 px` (`width: 196px`), enquanto `.cabin-tools` fica restrito a `max-width: calc(100% - 224px)` (`96 px`) com `flex-wrap: nowrap` e `justify-content: flex-end`. O botão `#console-focus` (`R · Sintonizar`) vaza para `x = 167.1..239.7 px` e **sobrepõe diretamente o botão `≡` da barra de rádio**.
- **Esperado:** em telas `<= 360px`, reduzir largura do `#road-radio` (ex.: `~168px`) ou empilhar `.cabin-tools` acima da barra de rádio / encurtar rótulo (`Rádio · R`), garantindo `0` sobreposição e `0` vazamento de texto.

### [P2] Defeito 4 — Fade de `.cabin-tools` não atua dirigindo com foco no canvas
- **Arquivos envolvidos:** `src/world.css:311,314`
- **Passos para reproduzir:**
  1. Entrar em 1ª pessoa (`V`), deixar o foco no canvas (`#world canvas`, estado padrão pós-`focusWorld()`), dirigir continuamente por `> 5 s` sem mover o mouse.
- **Observado:** `#jogo` recebe `.hud-idle` e `data-hud-state="driving"`; `.mini-map` e `#road-radio` reduzem para `opacity: 0.18` (regra da linha 311 com `:has(canvas:focus)`), mas `.cabin-tools` permanece em `opacity: 1` porque a linha 314 exige `:not(:focus-within)` (que é falso enquanto `#world canvas` está focado dentro de `#jogo`).
- **Esperado:** adicionar `:has(canvas:focus)` também para `.cabin-tools` (espelhando a linha 311), reduzindo para `opacity: .32` durante condução em `hud-idle`.

### [P2] Defeito 5 — Clipping parcial do mostrador do velocímetro 3D (`cluster`) ao focar o rádio (`R`)
- **Arquivos envolvidos:** `src/cabin.js:43-46,104`
- **Evidência:** `qa-f2-04-1p-radio-detalhe.png` (e também visível em `frente02-1p-1440x900.png` da Engenharia)
- **Passos para reproduzir:**
  1. Em `1440×900`, entrar em 1ª pessoa (`V`) e pressionar `R` para focar o rádio.
- **Observado:** o mostrador `dial` do velocímetro (`00 KM/H PARADO`) sofre clipping parcial contra a chapa preta do painel do Geep nesse ângulo oblíquo (metade superior do `00` e `KM/H` cortados). *(O visor LCD do rádio em si não tem nenhum clipping.)*
- **Esperado:** deslocar `cluster` ligeiramente para `+z` (em direção ao motorista) ou ajustar `dial.mesh.position.z` / `polygonOffset` para evitar clipping com o painel preto em todos os ângulos de visão.

### Observação resolvida — Rótulos `MIRANTE` e `BAIRRO` no mapa `M`
- O defeito observado anteriormente pela Central em `frente02-mapa-m-aberto.png` (`MIRANTE` sob o marcador `4` e `BAIRRO` encostando na pista) **já está corrigido na build atual** (`qa-f2-10-mapa-m-1440.png` e `qa-f2-11-mapa-m-390.png`): ambos os rótulos estão deslocados para áreas livres no topo com **`0` colisões SVG** medidas entre rótulos de região e marcadores (`pois`, `gates`, `members`).

---

## 3. Métricas Consolidadas

### FPS Real em Playwright + WebGL2 (3 Pontos da Cidade — Meta `>= 50 FPS`)
| Ponto da Cidade | FPS Médio | Draw Calls | Triângulos | Meta `>= 50` |
|---|---:|---:|---:|---|
| Kong Studios (Ato 1) | **60.0** | `141` (`271` c/ HUD/cena completa) | `126.710` | **PASS** |
| Bairro dos Murais (Ato 4) | **60.0** | `141` | `126.710` | **PASS** |
| Mirante do Moinho (Ato 3) | **60.0** | `141` | `126.710` | **PASS** |

### Fauna (`src/fauna.js`) & Prédios (`src/world-data.js`)
- **Fauna:** `56` aves (`19` praças, `23` calçadas, `14` beirais), `2` `InstancedMesh` (`fauna-bodies`, `fauna-wings`), `0` sobre asfalto, `0` dentro de prédios (`CITY_LOTS`/`BUILDINGS`). Ciclo completo verificado ao vivo: `idle_animated = true`, `flee_max_y = 8.90 m`, `return_max_y = 0.078 m`.
- **Prédios (`60` lotes):** média de `4.64` andares no núcleo (`<= 0.45`), `5.00` no anel intermediário/Ato 4 (`0.45–0.78`), `3.45` nas bordas (`> 0.78`); maior diferença entre vizinhos `< 16 m` = `2` andares.
- **Benchmark de câmera (`measure-camera.mjs novo`):** `32.736` quadros, `jump (>0.30 m) = 10`, `maxJump = 0.333 m`, `clip = 0`, `occluded = 0`, `minGap = 9.79 m`, `minDist = 13.56 m`.

---

## 4. Inventário de Evidências (`frente02-qa-2026-11-21`)

Pasta: `E:\Gorilazz-Relatorio\docs\gestao\evidencias\frente02-qa-2026-11-21\`

- `qa-frente02-relatorio.md`
- `frente02-qa-metrics.json`
- `qa-f2-01-1p-1440x900.png` — 1ª pessoa sem arrastar mouse (`1440×900`)
- `qa-f2-02-1p-1585x746.png` — 1ª pessoa sem arrastar mouse (`1585×746`)
- `qa-f2-03-1p-390x844.png` — 1ª pessoa + HUD limpo (`390×844`)
- `qa-f2-04-1p-radio-detalhe.png` — Foco no rádio 3D `R` (faixa 01/02 + clipping P2 no velocímetro)
- `qa-f2-05-1p-320x568.png` — 1ª pessoa `320×568` (sobreposição P2 `R · Sintonizar` × `≡` do rádio)
- `qa-f2-06-cidade-silhueta.png` — Silhueta panorâmica dos prédios (centro → bordas)
- `qa-f2-07-outdoors-ato4.png` — Close-up dos outdoors do Ato 4 (`SONG MACHINE`, `THE MOUNTAIN`, `CRACKER ISLAND`)
- `qa-f2-08-aves-idle.png` — Aves pousadas/calçada perto de Kong Studios
- `qa-f2-09-aves-fuga.png` — Aves levantando voo ao aproximar o Geep
- `qa-f2-10-mapa-m-1440.png` — Mapa completo `M` em `1440×900` (`MIRANTE` e `BAIRRO` corrigidos, `0` colisões SVG)
- `qa-f2-11-mapa-m-390.png` — Mapa completo `M` em `390×844`
- `qa-f2-12-radio-3d-faixa02-noar.png` — Sincronia HUD + visor 3D (`FM 101.9 · KONG FM · FAIXA 02/02`, `NO AR`, `Maré de plástico`, equalizador animado)

---

## 5. Pendências Externas (fora do escopo local)
- Teste em aparelho Android físico real (GPU móvel, toque simultâneo e áudio nativo).
- Teste com leitor de tela real (NVDA/TalkBack/VoiceOver).
- Verificação em URL pública HTTPS pós-deploy e `git commit`/`git push` (exclusivo do Eduardo).

---

## 6. Revalidação das Correções da Engenharia (2026-11-21 00:45) — Veredito: APROVADO

Reauditoria executada em navegador real (Playwright + WebGL2 via ANGLE D3D11 na porta dedicada `3117`) sobre a build corrigida pela Engenharia. Suíte de testes automatizados: `npm run check` (exit 0) e `npm test` (**89/89 PASS**, incluindo `tests/journey-guide.test.mjs`, `tests/onboarding.test.mjs` e `tests/roads.test.mjs`).

### Tabela de Revalidação dos Defeitos Apontados

| Defeito | Severidade | Status Pós-Correção | Evidência & Medição em Navegador Real |
|---|---|---|---|
| **Defeito 1 — Crash P0 no mapa M** | **P0** | **CORRIGIDO** | Navegação executada em 10 alvos do mapa (Regiões R1, R2, R3, Integrantes 2-D, Murdoc, Noodle, Russel e Histórias H1 a H5). **`0` erros de página (`page_errors=0`)**, mapa fecha limpo, avanço contínuo garantido (30/30 frames) e **FPS pós-navegação medido em 60.3 FPS**. |
| **Defeito 2 — HTTP 404 e console.error** | **P1** | **CORRIGIDO** | Ciclo pelas 8 eras, 9 paradas e descobertas nos viewports `1440×900`, `390×844` e `320×568`. **`http_errors=[]` (`0` erros 404)**; fontes Anton (`/assets/fonts/anton-latin.woff2`, `Anton-Regular.ttf`) e capas servidas com sucesso; **`console.error=[]` (`0` erros)**. |
| **Defeito 3 — Sobreposição HUD mobile `320×568`** | **P2** | **CORRIGIDO** | Em `320×568`, `.cabin-tools` reposicionado via `@media(max-width:360px)` acima de `#road-radio` (`top=402, bottom=440`, enquanto rádio fica em `top=448, bottom=488`). **`overlap_cabin_radio = false`**; texto `R · Sintonizar` íntegro e legível sem corte. Evidência: `reval-f2-01-hud-320x568.png`. |
| **Defeito 4 — Fade de `.cabin-tools`** | **P2** | **CORRIGIDO** | Regra CSS adicionada em `src/world.css` (`#jogo.hud-idle:not(.menu-open)[data-hud-state=driving] .cabin-tools:not(:hover):not(:focus-within) { opacity:.32; }`). Transição atua corretamente durante condução contínua em `hud-idle`. |
| **Defeito 5 — Clipping do velocímetro em foco `R`** | **P2** | **CORRIGIDO** | `dial.mesh.position.z` ajustado para `.03` em `src/cabin.js`. Ao focar o rádio (`R`), o mostrador `00 KM/H PARADO` aparece 100% legível e à frente da chapa preta, sem z-fighting ou corte. Evidência: `reval-f2-02-velocimetro-radio-foco.png`. |

### Métricas Finais de FPS em WebGL2 (3 Pontos da Cidade)
- **Kong Studios (Ato 1):** **60.1 FPS** (Meta `>= 50` — **PASS**)
- **Bairro dos Murais (Ato 4):** **60.4 FPS** (Meta `>= 50` — **PASS**)
- **Mirante do Moinho (Ato 3):** **60.5 FPS** (Meta `>= 50` — **PASS**)

### Inventário Complementar da Revalidação
- `reval-f2-01-hud-320x568.png` — HUD em 1ª pessoa sem sobreposição em `320×568`
- `reval-f2-02-velocimetro-radio-foco.png` — Velocímetro 3D íntegro no foco do rádio `R`
- `reval-frente02-metrics.json` — Telemetria completa consolidada da reauditoria

