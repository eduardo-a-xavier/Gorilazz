# Rodada 2 — lote Gorilazz A3 (B1, B2, C, D, E)

Sem git add/commit/push. `npm run check` OK; `npm test` **103/103** (era 102).

## B1 — Máquina de fliperama visível (feito)
- Posição final: (-10, -10), perto de Kong Studios (~11 m de Kong), afastada da estrada e de obstáculos. Corpo 1,8 × 3,6 m (antes 1,0 × 2,1 m), marquise "KONG ARCADE", tela emissiva, feixe de luz amarelo e anel no chão. Sem PointLight (cada luz extra encarece o shader de todos os materiais).
- Descartadas: (-6, 6) e (-6, 2): atrás do arco do Ato 1 e dos prédios; (-6, -2) e (8, -8): a bateria e o palco do marco "Duas mentes" ficam na frente da máquina em quase toda vista de 3ª pessoa.
- Prints: `B-fliperama/b1/b1-aproximado-tercapessoa.png` (a 8 m, carro virado para a máquina; visível com a tela emissiva ao lado do palco) e `B-fliperama/b1/b1-distante-inicio.png` (vista de início, distante).
- Limitação: na vista de início ela ainda fica parcialmente atrás do palco. Quem chega pela rota a vê de frente.

## B2 — Sprites autorais (feito)
- Fantasmas = os 4 integrantes, com rosto desenhado em canvas (olhos, boca, franja e corpo ondulado) nas cores da paleta do projeto (`src/app.js`): 2-D (franja azul), Murdoc (pele verde, cabelo preto), Noodle (franja rosa, conforme pedido), Russel (pele marrom, cabelo preto). Obs.: a paleta do `app.js` dá cabelo preto ao Noodle; se preferir preto, é trocar um valor em `GHOSTS`.
- Assustados: corpo azul com rosto de susto.
- Jogador: Geep em vista de cima (autoral, sem arte oficial).
- Teclado, D-pad, Esc, pausa e testes mantidos. `tests/arcade.test.mjs` com 14 casos (novo: os 4 integrantes com cores distintas).
- Print: `B-fliperama/arcade-jogo-desktop.png`; zoom: `B-fliperama/zoom-sprites.png`.

## C — Otimização (feito; culling já existia)
| Métrica | Antes (rodada 1) | Depois (rodada 2) |
|---|---|---|
| Bytes transferidos no carregamento | 11.191.104 | **9.553.807** (−1.637.297; −14,6%) |
| PNG transferidos | 5.356.540 | 763.343 (PNG de materiais sai do caminho) |
| WebP transferidos | — | 2.954.706 (12 materiais) |
| GLB transferidos | 3.463.419 | 3.463.419 (sem mudança nesta rodada) |
| FPS Kong / Murais / Mirante (1440x900, D3D11) | 60,4 / 60,6 / 60,4 | 60,4 / 60,6 / 60,6 |

- **WebP lossless** dos 15 materiais de `assets/materials/` (5.600.408 → 3.595.968 bytes, −35,8%). Pixel a pixel idênticos aos PNG (verificado com Pillow: 15 de 15). `src/materials.js` tenta `.webp` e, se falhar, carrega o `.png` original sem trocar o material. Rotas `.webp` no `server.mjs`.
- **Fallback testado** (`verify-webp-fallback.py`): com `.webp` bloqueado, os 12 materiais vêm do PNG, o Geep carrega, o piloto carrega (`piloto=glb`), 0 erros de página. Testes de rota em `tests/server.test.mjs`.
- **Culling por distância: já existe no projeto** (`src/scene.js`, `heavyCasters`): modelos pesados (banda, escultura) viram cartaz a partir de 78–88 m (com histerese) e só projetam sombra a 55 m. Não adicionei outro, porque mediu-se que ele já reduz a carga:
  - Draw calls por ponto (10 amostras por ponto, `sample-points.py`): **Kong 308–424 (mediana 366)**, **Bairro dos murais 162–246 (mediana 204)**, **Mirante 203–325 (mediana 264)**.
  - A medição única da rodada 1 (306 em todos os pontos) foi um instantâneo; não é comparável com essa distribuição.
- **Draw calls: não reduzi.** Próximo passo com retorno real: LOD ou mesclagem dos modelos da banda (~103 mil dos 252 mil triângulos no ponto de Kong). É mudança visual de risco; ficou de fora.
- Meta: peso < 11,19 MB ✔ (9,55 MB) e FPS ≥ 50 ✔ (60,4–60,6; o teto de 60 vem do vsync, então o ganho real não aparece aqui).
- Dados: `C-otimizacao/antes`, `C-otimizacao/depois-webp`, `C-otimizacao/depois-final/c-medicao.json`; prints do fallback `C-otimizacao/webp-webp.png` e `C-otimizacao/webp-bloqueado.png`.

## D — Polimento do onboarding (feito)
- `#onboarding-dialog h2` com `letter-spacing: .03em`; `.onboarding-keys dt` com `align-self: start` (`src/onboarding.css`).

## E — Teste de servidor (feito)
- `tests/server.test.mjs` cobre: fontes Anton (woff2, ttf, OFL), capas, WebP com fallback PNG, GLB comprimido, rotas de onboarding e fliperama (`/src/onboarding*`, `/src/arcade*`).

## Erros e regressão
- `verify-errors.py`: 0 HTTP ≥400 e 0 console.error ao entrar no mundo e abrir as 5 descobertas, em 1440x900 e 390x844.
- `verify-arcade.py`: prompt, abertura, jogo, Esc, D-pad mobile; 0 erros.
- `verify-map-clicks.py` (mapa M): sem erros, loop ativo.

## Arquivos desta rodada
- Novos/alterados: `src/arcade.js` (posição, GHOSTS), `src/arcade-screen.js` (sprites), `src/arcade-cabinet.js` (máquina maior), `src/materials.js` (WebP com fallback), `src/onboarding.css` (D), `server.mjs` (rotas WebP, GLB gzip), `index.html` (canvas 510×390), `src/arcade.css`, `assets/materials/*.webp` (15 arquivos; os PNG foram mantidos como fallback), `tests/arcade.test.mjs`, `tests/server.test.mjs`.
