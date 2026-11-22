# Motorista do Geep: atual × variante A × variante B (TRELLIS) — 12/11/2026

> **Atualização:** Eduardo escolheu a variante A e a B foi **removida do produto** (ver o adendo no fim). Este documento fica como registro da comparação; as referências ao carregamento `?motorista=trellis`, à rota do servidor e ao teste da B descrevem o estado anterior à remoção.

**Recomendação: variante A como padrão.** A B funciona e é a que tem mais "cara de desenho", mas perde a reação da cabeça, o movimento dos braços no volante e a paleta rosa/creme, e traz uma textura e uma origem generativa a mais para sustentar. O ganho de chamadas da B (cerca de 10 a menos por quadro) é pequeno. Eduardo escolhe pelas capturas abaixo.

Sem commit, push ou publicação; servidor da porta 3000 (PID 22696) não foi reiniciado (a rota nova da B só aparece nele depois de um reinício, que cabe ao Eduardo). `changes.diff` mostra só esta tarefa (sobre um snapshot que já continha as mudanças pendentes de Pages e gráficos, preservadas).

## O que é cada versão

- **Atual:** boneco procedural em código (rodada anterior).
- **Variante A (padrão):** refino em código em `src/scene.js` (`createDriver`), com os mesmos encaixes (grupo em `(-0,54; 0,12; 0,42)` escala 1,22, cabeça em `(0; 2,24; 0,02)`, braços em `(0; 1,62; -0,5)`, mãos no volante) e as mesmas 5 cores. Mudanças: rosto com olhos de esclera, pupila e brilho, sobrancelhas, nariz, sorriso e bochechas; costeletas e cabelo escuros atrás do boné; boné com botão; peito e abdômen em duas peças, gola rosa, pescoço e ombros arredondados; braços com cotovelo; mãos com palma, polegar e dedos; sem sapatos (invisíveis no jipe). `createDriverReaction`, o grupo `driver-head` e a lógica de arraste e movimento reduzido não foram alterados.
- **Variante B (diagnóstico):** GLB gerado pelo TRELLIS a partir de uma captura do boneco da variante A, e carregado só com `?motorista=trellis` (`loadTrellisDriver`). Origem, versão e licença em `ORIGEM.md`.

## Capturas lado a lado (mesma câmera, 1345 × 635, perfil alto, pixel ratio 1)

Câmeras relativas ao motorista: frente `(0,2; 2,5; -2,2)`, lado `(-2,5; 2,35; -0,15)`, 3/4 `(-1,45; 2,95; -2,25)`, traseira próxima `(0,3; 3,2; 3,6)` com o jipe a 15 a 28 km/h. A iluminação do cenário muda com o tempo, então o fundo varia um pouco entre capturas.

![Frente](lado-a-lado-frente.png)
![Lado](lado-a-lado-lado.png)
![3/4](lado-a-lado-3-4.png)
![Dirigindo, câmera traseira próxima](lado-a-lado-dirigindo-perto.png)
![Dirigindo, câmera natural do jogo (recorte ampliado)](lado-a-lado-dirigindo-natural.png)

Originais, uma por versão e câmera: `atual-*.png`, `A-*.png`, `B-*.png` (`frente`, `lado`, `3-4`, `dirigindo`, `dirigindo-perto`). Entrada do TRELLIS: `trellis-entrada.png`.

## Tabela de custos

| Medida | Atual | A | B (TRELLIS) |
| --- | ---: | ---: | ---: |
| Triângulos do motorista | 2.228 | **2.934** (≤ 3.000) | 2.908 |
| Malhas | 11 | 12 | **1** |
| Materiais / texturas | 5 / 0 | 5 / 0 | 1 / 1 (512 × 512 JPEG) |
| Buffers de geometria (bytes) | 69.752 | 95.268 | 61.328 |
| Textura na GPU (estimativa RGBA8 + mipmaps) | 0 | 0 | ≈ 1,33 MiB |
| Arquivo extra baixado | 0 | 0 | **110.832 bytes** (só com `?motorista=trellis`) |
| Chamadas extra, quadro normal | +10 | +11 | **+1** |
| Chamadas extra, quadro de sombra | +21 | +23 | **+2** |
| Triângulos extra, quadro normal / sombra | +1.828 / +4.056 | +2.614 / +5.548 | +2.908 / +5.816 |
| Reação da cabeça (hover/toque, parado) | sim | sim* | **não** |
| Braços acompanham o volante | sim | sim | **não** |
| Paleta de 5 cores do projeto | sim | sim | **não** (cores da textura gerada) |
| `src/scene.js` (bytes) | 75.013 | 77.904 (A + carregador da B) | idem |

Chamadas medidas como (quadro com o motorista visível) − (quadro com todas as malhas dele ocultas), na mesma página e câmera fixa de frente. O quadro base sem motorista tem 71 chamadas (normal) e 148 (sombra); com o atual 81 e 169, com a A 82 e 171, com a B 72 e 150. Como o jogo alterna quadros com e sem passe de sombra, os dois valores aparecem. Em câmera natural (sem fixar), a B ficou 10 chamadas abaixo da atual no quadro normal (131 contra 141), da ordem de 7%. Não medi FPS: o navegador desta sessão entregou de 1 a 3 quadros por segundo.

\* a reação da cabeça foi preservada por construção (mesmo grupo e mesmo `createDriverReaction`, 50 testes passando); não repeti o teste de hover com mouse real, que na rodada anterior dependia de um navegador com `prefers-reduced-motion` desligado.

## Avaliação

| | Atual | A | B |
| --- | --- | --- | --- |
| Rosto | olhos pretos e boca reta, expressão fechada | olhos expressivos, sorriso, bochechas | o mais "desenhado", mas com textura lavada e rosto levemente achatado de lado |
| Roupa e mãos | blocos lisos | gola, ombros, cotovelos, dedos | formas fundidas, mãos sem dedos claros |
| Pose | sentado, mãos no volante | sentado, mãos no volante | pernas retas apoiadas sobre o banco; mãos não pegam o volante (veio de uma imagem frontal, sem pose sentada) |
| Visto de trás | cabeça lisa | cabelo escuro sob o boné | cabelo escuro sob o boné |
| Cores | rosa e creme do projeto | rosa e creme do projeto | tons mais claros e quentes, com brilho de iluminação cozida na textura |

## Variante B: como foi feita e o que falhou ou não

A demo pública funcionou sem login, fila ou cota esgotada. A malha saiu do TRELLIS já com 2.908 triângulos (Simplify 0,98), então não foi preciso decimar; só recomprimi a textura (PNG 324 KB → JPEG 48 KB) e converti os índices, o que levou o arquivo de 404 KB para 111 KB (`trellis/reduzir-glb.py`). Nenhuma ferramenta foi instalada. Ajustes de escala, posição (altura 2,12, centrada na cabine) e giro foram só os suficientes para a câmera; a B **não está ajustada ao banco e ao volante**.

## Validação

- `npm run check`: saída 0. `npm test`: **50 de 50** (49 anteriores + `tests/driver-trellis.test.mjs`, que confere magia/versão/tamanho do GLB, ≤ 3.000 triângulos, ≤ 300 KB, textura ≤ 512 px, 1 malha/material/textura, sem arquivos externos e a rota em `server.mjs`). Logs: `check-final.log`, `test-final.log`. A mesma verificação passou após cada mudança de A.
- Preservados por SHA-256: `README.md`, `src/content.js`, `assets/environment/CREDITS.txt`, `manifest.json`, `assets/models/GEEP-CREDITS.txt`, `gorillaz-geep.glb`, `src/cabin.js`, `package.json` (`preserved-before.sha256`).
- O GLB da B carregou no navegador sem avisos de console.

## Limitações e riscos

- Só Chromium desktop; sem aparelho real; FPS não medido. Medida de chamadas feita com câmera fixa de frente; em outras câmeras as chamadas do motorista podem variar por corte de frustum.
- A B é uma malha estática: sem reação, sem braços no volante e com `driverHead` vazio (o teste de acerto da cabeça não encontra alvo).
- `server.mjs` ganhou a rota da B. Com ela, o fluxo de Pages publicaria o GLB (111 KB) mesmo que a variante B não seja escolhida; se a A for a escolha, remova rota, GLB, `loadTrellisDriver` e o teste juntos. O processo atual do servidor (PID 22696) só serve o GLB depois de reiniciado.
- A hospedagem e os créditos já existentes não foram alterados. Os créditos da B ficam só em `ORIGEM.md`, conforme pedido.
- Preferência estética, a segurança jurídica da saída do modelo generativo e a decisão de manter ou remover a B ficam com o Eduardo.

## Adendo — remoção da variante B do produto (12/11/2026)

Eduardo escolheu a **variante A**. Removidos juntos:

- `server.mjs`: a rota `/assets/models/motorista-trellis.glb` (o arquivo voltou a ser idêntico ao do commit `HEAD`).
- `assets/models/motorista-trellis.glb` (110.832 bytes; o SHA-256 está em `baseline-remocao/assets/`).
- `src/scene.js`: `loadTrellisDriver`, a chamada e o parâmetro `?motorista=trellis`. `createDriver` (variante A) não foi tocado.
- `tests/driver-trellis.test.mjs`.

Mantidos na pasta como registro, fora do produto: `ORIGEM.md`, as capturas (`atual-*`, `A-*`, `B-*`, `lado-a-lado-*`), `trellis-entrada.png`, `trellis/reduzir-glb.py`, `trellis/trellis-bruto.glb` (**404.096 bytes**, abaixo de 1 MB; é a entrada do script e está referenciado pelo SHA em `ORIGEM.md`) e `trellis/motorista-trellis.glb` (a cópia reduzida da B, 110.832 bytes). Se Eduardo quiser aliviar o repositório, os dois GLB de `trellis/` podem sair sem afetar o produto; a decisão é dele.

### Confirmações (`verificacao-remocao.log`)

- Servidor (`PORT=0 node server.mjs`, processo próprio): `GET /assets/models/motorista-trellis.glb` → **404**; `gorillaz-geep.glb` e `src/scene.js` → 200.
- Pacote do Pages: o mesmo passo do workflow (`montar-site-estatico.mjs`) copia **62 arquivos** e nenhum contém "motorista" ou "trellis"; `.github/workflows/pages.yml` não tem referência a eles.
- `grep -ri trellis` em `src/`, `server.mjs`, `tests/`, `.github/`, `package.json` e `index.html`: **0 arquivos**. As únicas menções ficam em `docs/`.
- `npm run check`: saída 0. `npm test`: **49 de 49**, 0 falhas (`check-remocao.log`, `test-remocao.log`).
- Preservados por SHA-256: `README.md`, `src/content.js`, `assets/environment/CREDITS.txt`, `manifest.json`, `assets/models/GEEP-CREDITS.txt`, `gorillaz-geep.glb`, `src/cabin.js`, `package.json`. Créditos e licenças não foram alterados.
- Servidor compartilhado da porta 3000 (PID 22696): não reiniciado, responde 200.
- Diff só desta remoção: `changes-remocao.diff` (baseline em `baseline-remocao/`).

### Lista final de arquivos para o commit do Eduardo

Mudanças do motorista (variante A): `src/scene.js` e a pasta `docs/gestao/evidencias/motorista-comparacao-2026-11-12/`.

Todas as mudanças pendentes no repositório (inclui Pages e gráficos, mantidas como estavam):

- Alterados: `index.html`, `src/app.js`, `src/environment.js`, `src/local-radio.js`, `src/materials.js`, `src/scene.js`, `docs/gestao/evidencias/GZ-creditos-textos-2026-11-12/README.md`.
- Novos: `.github/workflows/pages.yml`, `docs/gestao/evidencias/graficos-2026-11-12/`, `docs/gestao/evidencias/hospedagem-pages-2026-11-12/`, `docs/gestao/evidencias/hospedagem/`, `docs/gestao/evidencias/pesquisa-graficos/melhorias-visuais-threejs.md`, `docs/gestao/evidencias/motorista-comparacao-2026-11-12/`.
- `server.mjs`, `tests/` e `assets/` ficaram sem mudança líquida em relação ao `HEAD`.
