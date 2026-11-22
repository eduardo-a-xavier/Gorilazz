# Lote Gorilazz A3 — 21/11/2026 (item 0, P0/P1/P2 da QA, A, B, C)

Sem git add/commit/push. Testes: `npm run check` OK; `npm test` **102/102** (era 78).

## Item 0 — Integração Anton, pôsteres (feito)
- `server.mjs`: rotas `/assets/fonts/anton-latin.woff2`, `anton-latin-ext.woff2` (font/woff2), `Anton-Regular.ttf` (font/ttf), `ANTON-OFL.txt` (text/plain). Teste em `tests/server.test.mjs`.
- `src/app.js`: `selectStop` renderiza `.stop-poster` com `thematicStops[i]`; `openDiscovery` aplica `roadDiscoveryLore[id]` e a moldura `.dialog-poster`.
- Capas passadas como URL absoluta: o CSS da Pesquisa resolvia `./assets` a partir de `src/` e gerava 404.
- Verificado: Anton carregada (`document.fonts.check` = true); 18 paradas (9 × 2 tamanhos) com pôster; 0 HTTP 404; 0 erros de console.
- Prints: `item0/stop-*.png`, `item0/discovery-*.png`.

## P0 (mapa M) — corrigido primeiro
- Alvos de região e integrante agora têm `region`; `journey-guide.js` aceita região ausente; `frame()` agenda o próximo quadro antes do trabalho e isola erros.
- Teste novo: `tests/journey-guide.test.mjs` (3 casos).
- Verificado no navegador: clique em R1, R3, 2-D, Russel e história: mapa fecha, 0 erros, ~50 frames/800 ms.
- Prints: `p0-mapa/`.

## P1 — 404
- Fontes: rotas do servidor (acima). Capas: URL absoluta. Verificado: 0 HTTP 404, 0 console.error em paradas e descobertas (1440x900 e 390x844).

## P2
- **P2-a (320x568):** em ≤360px a barra da cabine sobe uma linha acima do rádio. Sem sobreposição com rádio ou minimapa; 390x844 inalterado. Prints em `p2-cabin-depois/`.
- **P2-b (fade):** regra trocada por `:not(:hover):not(:focus-within)`, opacidade .32; hover volta a 1. O seletor foi confirmado com `matches()`. Não reproduzi o fade ao vivo: a transição de .25 s e o carro parando no spawn em headless impediram a leitura. **Parcial.**
- **P2-c (velocímetro):** mostrador movido à frente da moldura (z .03). Com R ativo, "00" e "KM/H · PARADO" aparecem inteiros. Print: `p2-cabin-depois/zoom-velocimetro.png`.

## A — Onboarding (feito)
- `src/onboarding.js` (lógica pura, com opt-out e limites de exibição), `src/onboarding.css`, marcação em `index.html`.
- Boas-vindas na 1ª entrada (uma vez; Esc fecha); H e F1 reabrem a ajuda; dicas de dirigir, E e M que somem após o uso; estado em localStorage.
- Verificado em 1440x900 e 390x844: boas-vindas abre, Esc fecha, H e F1 abrem, dica sem sobrepor minimapa ou rádio, 0 erros.
- Testes: `tests/onboarding.test.mjs` (8 casos).
- Prints: `A-onboarding/`.

## B — Fliperama (feito; falta print de fim de jogo)
- `src/arcade.js` (lógica pura: labirinto de pilares, pontos, pastilhas de poder, fantasmas autorais, vidas, fim e fase limpa, pausa, saída limpa). Testes: `tests/arcade.test.mjs` (13 casos).
- `src/arcade-screen.js` (diálogo acessível, canvas com desenho autoral, teclado WASD/setas/P/Enter/Esc, D-pad de toque). `src/arcade-cabinet.js` (máquina 3D em (-6, 6), perto de Kong Studios, geometria procedural).
- E perto da máquina com o carro parado abre o jogo; a condução pausa e o foco volta ao sair.
- Verificado: prompt "E / JOGAR FLIPERAMA", abertura, jogo, Esc fecha, carro parado depois, D-pad no mobile, 0 erros.
- Prints: `B-fliperama/arcade-jogo-desktop.png`, `arcade-jogo-mobile.png`.
- **Não confirmado:** a máquina 3D não ficou visível no enquadramento de `fliperama-no-mundo-1440.png` (atrás de prédios). A posição é validada pelo prompt, não pela imagem. Print de "início" e de "fim de jogo" não gerados.

## C — Otimização web (medido; sem regressão)
| Métrica | Antes | Depois |
|---|---|---|
| Bytes transferidos no carregamento | 12.837.889 | 11.191.104 (−12,8%) |
| GLB (transferido) | 5.110.204 | 3.463.419 |
| PNG (normal maps) | 5.356.540 | 5.356.540 (sem mudança) |
| FPS Kong Studios (1440x900, D3D11) | 60,5 | 60,4 |
| FPS Bairro dos murais | 60,6 | 60,6 |
| FPS Mirante do moinho | 60,4 | 60,4 |

- Mudança: gzip para `model/gltf-binary` em `server.mjs` (teste atualizado para o novo comportamento).
- Meta FPS ≥ 50: atendida nos 3 pontos. O navegador limita a 60 (vsync), então o teto real não é medido.
- Não feito: conversão de normal maps PNG (~2,8 MB) para WebP, culling por distância e auditoria de sombras/draw calls. Os números de draw calls exigem expor `renderer.info`, o que não foi feito. Ficam como próximo passo.
- Dados: `C-otimizacao/antes/c-medicao.json`, `C-otimizacao/depois/c-medicao.json`.

## Arquivos alterados
index.html, package.json, server.mjs, src/app.js, src/cabin.js, src/scene.js, src/world.css; novos: src/onboarding.js, src/onboarding.css, src/arcade.js, src/arcade-screen.js, src/arcade-cabinet.js, src/arcade.css; testes: tests/onboarding.test.mjs, tests/arcade.test.mjs, tests/journey-guide.test.mjs, tests/server.test.mjs (atualizado).
