# Rodada HUD e FPS — evidências (Gorilazz A3)

Medido no Chrome real (`localhost:3000/?perf`). Sem git add/commit/push, sem Co-authored-by; quem faz o commit é o Eduardo.

Base técnica: three.js puro (`src/`). O briefing usa termos React/R3F (`dpr`, `Canvas`, `useFrame`, `setState`); a intenção foi traduzida para os módulos atuais.

## Status por item

### 1. HUD

| item | status | o que mudou | evidência |
|---|---|---|---|
| a) Topo central enxuto: só DESCOBERTAS X/9 + botão "▶ Passeio Guiado" | **feito** | Texto grande do passeio saiu do desktop (`#guided-text` oculto); o botão ficou ao lado do contador, na mesma linha (`landing-fixes.css`). Rótulos: "▶ Passeio Guiado" / "⏸ Pausar" / "▶ Retomar" (`src/app.js`). | `depois-passeio-hud-1440x900.png` |
| a) Banner grande central e "X" flutuante | **não reproduzido** | Nas medições o banner é o texto do passeio (agora oculto no desktop). Não encontrei um "X" flutuante sobre o DESCOBERTAS em desktop; os "×" do projeto são dos diálogos. Se o print do briefing veio de outro estado, precisa do passo a passo para reproduzir. | — |
| b) Atalhos V / M / F / História no menu recolhido | **feito** | O bloco `.quick-view` (1ª pessoa, mapa, tela cheia, história) é movido para dentro do menu de controles (`src/app.js`). | `depois-menu-H-1440x900.png` |
| b) "[H] Controles" | **feito** | H abre/fecha o menu (`isControlsKey`). H deixou de abrir a ajuda. A ajuda agora fica dentro do menu ("Ajuda de teclas (B / F1)") e B ou F1 continuam abrindo. | `tests/onboarding.test.mjs`, `tests/hud-layout.test.mjs` |
| b) Conflitos com ESC e onboarding | **verificado no navegador** | Esc fecha só o menu e o 3D continua; H com boas-vindas abertas não abre o menu; B abre a ajuda. | `esc_h_check.py` (resultado abaixo) |
| c) Botões de toque só em tela de toque | **feito** | A regra antiga mostrava os botões também abaixo de 700 px (desktop estreito). Agora o bloco some quando não há ponteiro grosso: `@media (not (any-pointer:coarse))` (`src/world.css`). Em 390x844 e 320x568 com toque emulado eles aparecem. | `depois-normal-toque-390x844.png` |
| d) Kong FM com bottom 16 px, inteiro | **feito no desktop; toque diferente** | Desktop: `bottom:16px` (1440x900 e 1346x680), inteiro. Toque: fica acima da barra de direção (`--instrument-bottom`), inteiro, mas não a 16 px. | `depois-normal-1440x900.png`, `depois-normal-toque-390x844.png` |
| e) No desktop no máximo 4 itens discretos + velocímetro | **feito** | Topo: [H] Controles; DESCOBERTAS + botão do passeio; minimapa. Base: Kong FM. Velocímetro à parte. A faixa "O mundo é seu" saiu do desktop (`.controls` oculto). | inventário em `hud_inventory.py` |
| Dica "Use W e S…" fora do centro e some em 2,5 s | **feito** | Desktop: canto inferior esquerdo, acima do rádio. Some em 2,5 s (`TOAST_MS`). Em celular fica centralizada, também por 2,5 s. | `depois-normal-1440x900.png` |
| Pílula sem corte em 390x844 e 320x568 | **feito** | Em celular o contador e o botão ficam empilhados no centro, sem texto grande e sem encostar no minimapa. | `depois-passeio-hud-320x568.png`, `depois-normal-toque-320x568.png` |

**Limite:** em 320x568 a barra de botões de direção e o minimapa ainda se apertam perto do topo (não alterado nesta rodada).

### 2. FPS

| item | status | medida |
|---|---|---|
| Teto de pixelRatio em `min(devicePixelRatio, 1.5)` | **feito** (`src/scene.js`) | dpr 2: pixelRatio médio 1,54 → 1,32 |
| InstancedMesh para árvores, postes, bancos, arbustos | **já estava** | `environment.js` (árvores), `street-props.js` (postes, bancos, canteiros), `city.js` (arbustos e brilhos de lâmpada), `fauna.js`, `scene.js` (efeito) |
| frustumCulled ativo | **já estava** | padrão do three.js; só desligado no céu (`atmosphere.js`) e nos bandos (`fauna.js`) |
| Sombras dinâmicas só perto da câmera | **não feito** | Não houve ganho medido que justificasse mexer no mapa de sombra; o frame time já está no alvo. |
| Zero alocação por quadro | **já estava** | 3 alocações no loop, todas em eventos (`scene.js`) |
| HUD ≤ 12,5 Hz | **já estava** | atualização a cada 80 ms (`src/app.js`) |
| Draw calls antes/depois | **medido** | antes ~245 (dpr 1), ~241 (dpr 2); depois ~244 (dpr 1), ~240 (dpr 2). Sem mudança relevante, porque nenhuma geometria foi alterada. |
| Frame time p95 / p99 (1440x900, passeio) | **medido** | antes p95 17,0 / p99 17,1 (dpr 1); depois p95 16,9 / p99 17,1 (dpr 1). Dpr 2: antes p95 17,0 / p99 17,1; depois p95 16,9 / p99 17,1. |

### 3. Modelos novos (integrantes v3 e piloto v5)

**Não integrado**, conforme o briefing: aguardando o Desenvolvedor Plataforma B. Os GLBs não foram alterados.

## Medidas de aceite

- FPS (rAF 3 s): mural 59,8 · palco 59,6 · centro 59,8 (≥ 55).
- Erros HTTP, console e página: 0 (`final_check` e `hud_shots`).
- Peso inicial: 4,35 MB (teto 9,3); acumulado ao final 8,10 MB.
- `npm run check`: OK (incluídos os módulos novos da rodada anterior).
- `npm test`: 185/185 (eram 180; novos: teclas H/B/F1, conflito H e onboarding, CSS de toque e desktop).

## Arquivos

- Código: `src/onboarding.js` (teclas), `src/app.js` (H, menu, rótulos, ESC), `src/world.css` (toque só em ponteiro grosso), `src/landing-fixes.css` (HUD desktop e celular), `src/scene.js` (teto de pixelRatio), `index.html` (botão [H]), `package.json` (check).
- Testes: `tests/onboarding.test.mjs` (atualizado), `tests/hud-layout.test.mjs` (novo).
- Evidências: esta pasta.

## Observação sobre o "antes"

O "antes" dos prints de passeio foi capturado com o passeio ativo (a pílula com o texto grande e a dica visível). O "depois" de passeio está no mesmo estado. O "depois" normal (sem passeio) não tem antes equivalente, porque o estado normal não foi capturado antes desta rodada.
