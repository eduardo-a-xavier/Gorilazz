# Novas features e polimento — 2026-11-22 (Engenharia Gorilazz)

Medido no Chrome real (channel chrome, headless), `http://localhost:3000/?perf`, 1440x900.

## Status por item (briefing 2026-11-22)
1. **Mural 1 (rosto vetorial):** feito. O desenho de reserva perdeu o rosto (elipses, "coroa" e olhos); a arte oficial entra centralizada numa moldura creme 2:1, sem o brilho emissivo do desenho de reserva. O facho do mural (`discovery-beam`, fundido pelo bake) saiu da frente da arte. Prints: `1-mural-*`.
2. **Borrão inferior + navegação:** feito parcialmente. Removido o degradê escuro da base (`.scene-shade`). Botão "↓ Ler História & Eras" (sai do 3D) e "↑ Voltar ao Carro 3D" (fixo, aparece depois de entrar no mundo e com o 3D desligado). Não reavaliado: a barra fixa inferior (`section-dock`) continua como estava. Prints: `2-base-3d-*`.
3. **ESC por pilha:** feito. Ordem modal > minigame > mapa > painel > jogo, por ordem de abertura (o último aberto recebe o Esc), com preventDefault e stopImmediatePropagation na captura. Testes: `tests/escape-stack.test.mjs` (5) e `esc_check` no navegador (9/9). Bloqueio de teclado em tela cheia quando há diálogo aberto; **não testado de verdade em tela cheia**.
4. **Visualizador 360°:** feito no modal de cada integrante (arraste, ‹ ›, cursor grab/grabbing, texto "360° · Arraste para girar"). Carga lazy do GLB. **Não feito:** cards da seção editorial. Prints: `4-visualizador-360-2d-girado.png`.
5. **Minigame piano:** feito. Botão "TOCAR PIANO (MINIGAME RÍTMICO)" no modal do 2-D. BPMs de referência confirmados pela Pesquisa (TCT 93, Clint Eastwood 84, OMH 120), áudio sintetizado, crédito "Áudio sintetizado próprio · BPMs de referência · uso acadêmico". Teclas D F J K ou toque, Perfect/Good/Miss, combo, Esc fecha só o minigame e volta ao modal do 2-D. Testes: `tests/piano-game.test.mjs` (10) e `piano_check` (5/5). Print: `5-piano-minigame-1440x900.png`.
6. **Cena:**
   - (a) Mãos no volante: sobem para 11h/1h no aro (ângulo 0,75 rad), mais firmes. **Não feito:** suavização da malha/sombreamento dos braços. Prints: `6a-maos-volante-*`.
   - (b) Fliperama: gabinete gira para a via mais próxima (paralelo à calçada). **Não feito:** câmera que se aproxima da tela ao iniciar o jogo. Prints: `6b-fliperama-*`.
   - (c) Pombos: estado de alerta (para de bicar e vira a cabeça para o carro antes de voar). Teste em `tests/fauna.test.mjs`. Sem print de antes (não capturado).

## Medidas
- FPS (rAF 3 s): mural 60,1 · palco 59,9 · centro 59,9.
- Peso transferido: 4,33 MB antes de entrar no 3D; 7,84 MB depois (limite 9,3). O visualizador 360° não entra no peso inicial (GLB só ao abrir o modal).
- Erros: 0 de console, 0 HTTP ≥ 400, 0 erros de página no fluxo normal.
- `npm run check` OK; `npm test` 155/155.

## Não feito / limites
- Câmera de aproximação do fliperama; suavização da malha das mãos; cards 360° na seção editorial; barra fixa inferior não reavaliada.
- Tela cheia com Esc: teste automático não reproduz o Chrome real.
- Peso e FPS medidos só nesta sessão.

## Rodada de retorno (Central, 22/11 — itens 1 a 6)
1. **360° nos cards da editorial:** feito. Canvas 3D no retrato dos 4 integrantes, arraste + botões ‹ ›, rótulo "360° · Arraste para girar", cursor grab/grabbing, carga lazy quando o card aparece; arrastar não abre a ficha. Teste: `card_spin` 6/6. Prints: `4b-card-360-*`. Peso após rolar até os cards: 8,64 MB (teto 9,3).
2. **Mãos no volante (suavização):** parcial. Testei relaxação Laplaciana nas malhas do driver-pilot-v2: descartada, porque a luva se soltou da manga (print `6a-maos-tentativa-relaxacao-DESCARTADA.png`). Mantido o que já existia (normais suavizadas, `smoothNormals`) e a mão mais alta no aro (ângulo 0,75 rad). O acabamento geométrico continua o do GLB (120 vértices por luva), sem edição do GLB.
3. **Fliperama, câmera:** feito. Ao abrir, a câmera foca a tela (4,0 m do gabinete) e volta ao carro ao fechar; Esc continua fechando só o fliperama. Print: `6b-fliperama-camera-aproximada-1440x900.png`. Trava da física: a câmera atualiza com o modal aberto (`cameraFocus`).
4. **Barra fixa inferior:** feito. Depois de entrar no mundo, a barra de seções (`section-dock`) fica oculta e o botão "↑ Voltar ao Carro 3D" ocupa o canto. Print: `4-leitura-botao-voltar-3d-1440x900.png`.
5. **Piano:** feito. Mensagem PERFECT/GOOD/MISS no topo do palco (não cobre D F J K) e título com espaçamento normal (a regra global de h2 espremia). Print: `5-piano-minigame-1440x900.png`.
6. **ESC em tela cheia (Chrome real, Playwright):** feito. Entra em tela cheia com F, abre o modal e o piano: Esc fecha só o piano, depois só o modal, e a tela cheia continua. `navigator.keyboard.lock(['Escape'])` foi pedido e aceito (`ok`). Limite: o Playwright envia a tecla à página; o Chrome, em tela cheia com bloqueio ativo, pede "pressione e segure Esc" para sair, mas isso não é reproduzido por automação. Print: `3-minigame-em-tela-cheia-1440x900.png`.

Medidas da rodada: FPS 60 / 59,8 / 59,9; peso inicial 4,33 MB; 7,85 MB ao entrar no 3D; 8,64 MB ao rolar até os cards; 0 erros de console/HTTP. `npm run check` OK; `npm test` 155/155. Testes de navegador: esc_check 9/9, piano_check 5/5, fs_check 5/5, card_spin 6/6, view_check 6/6.
