# Passeio guiado e contador de descobertas — 2026-11-22

Especificação: `Shared/Gorilazz/Frente_Extra_Passeio_Guiado_Descobertas.md`. Medido no Chrome real, 1440x900, `?perf`.

## O que foi feito
- **Passeio guiado (botão da Hero "Fazer um passeio guiado"):** o Geep percorre sozinho as 9 paradas pela malha de estradas (`planPath`), na ordem da parada mais próxima. Reduz a velocidade ao se aproximar (`speedCap`, a partir de 40 m) e para 4,5 s em cada parada, com um card lateral (título, ano e resumo vindos de `CITY_ERAS` e `DISCOVERIES`, sem texto novo). Troca a faixa da lista editorial (`setTrack`) a cada parada.
- **Indicador:** "Modo Passeio Guiado · Pressione WASD para assumir o volante" (barra inferior), com botão pausar/retomar.
- **Assumir o volante:** W, A, S, D ou setas encerram o passeio sem tranco (a velocidade continua). O progresso fica salvo.
- **Pausa:** modal, fliperama, minigame ou ESC (pilha de prioridade) pausam o passeio; a posição é mantida e o botão "Retomar" retoma.
- **Contador:** "DESCOBERTAS: X / 9" com barra fina no topo da HUD, persistido em `localStorage` (`gorilazz.stops.v1`); no mapa completo (M), a lista "Paradas do passeio" marca ✓ nas visitadas. Toast "Universo Gorillaz 100% Explorado" em 9/9, sem interromper o jogo.

## Medidas (corrida completa automática)
- Percurso completo: **9 de 9 paradas em 175,6 s**, 0 erros de console/HTTP/página, toast exibido ao final.
- Tempo de cada parada desde o início:

| # | parada | tempo (s) |
|---|---|---|
| 1 | era-explosao (Ato 1) | 11,41 |
| 2 | beginning (O começo, 1998) | 25,11 |
| 3 | era-reinvencao (Ato 4) | 47,01 |
| 4 | voices (Quatro rostos) | 62,62 |
| 5 | genres (Um som sem fronteiras) | 81,76 |
| 6 | live (Quando o desenho encontra o palco) | 99,55 |
| 7 | era-hiato (Ato 3) | 129,35 |
| 8 | demon-days (A paisagem de Demon Days) | 151,15 |
| 9 | era-plastic (Ato 2) | 171,11 |

- FPS (rAF 3 s, após as mudanças): mural 60 · palco 59,9 · centro 59,9.
- Peso: 4,34 MB antes de entrar no 3D; 7,85 MB depois (teto 9,3 MB).
- `npm run check` OK; `npm test` 165/165 (inclui `tests/guided-tour.test.mjs`: progresso, persistência, dados corrompidos, 9/9, trajeto na pista, velocidade, assumir o volante).
- Controles no Chrome real (`guided_check`, 13/13): WASD assume o volante sem zerar a velocidade (0,00 → 1,16 m/s); progresso preservado; mapa com ✓; ESC pausa e a barra retoma; modal congela o movimento (dx=dz=0); progresso persiste após recarregar.

## Decisões e desvios (para revisão)
1. **Quais são as 9 paradas:** a especificação diz "9 paradas temáticas / eras". Os 9 capítulos de `thematicStops` são seções editoriais, sem lugar na estrada. Usei os 9 lugares já existentes no mapa: 4 portais de era (`CITY_ERAS`) e 5 pontos de história (`DISCOVERIES`), com título, ano e resumo do próprio dado. Confirmar com a coordenação.
2. **Contador:** o contador antigo "DESCOBERTAS X / 5" (diário) continua; o novo "X / 9" é o do passeio.
3. **Kong FM:** a troca de faixa usa a lista editorial (`setTrack`), que já é o que os integrantes usam. O player local da Kong FM (Concreto e Maré de plástico) não foi alterado: não há áudio liberado por era.

## Limites (não feito ou parcial)
- **Trajeto fora do asfalto:** resolvido na rodada de correção abaixo (0 amostras fora do asfalto na corrida completa). Na rodada anterior, 26 de 625 amostras ficavam na calçada; a causa era a marcha à ré na saída.
- **Velocidade:** a redução fica na zona de 40 m e o veículo para 4,5 s em cada parada; sem ajuste fino por curva.
- **Não feito:** tradução das faixas do player local da Kong FM por era; câmera própria durante o passeio (usa a câmera de viagem); sem LOD nos novos elementos de HUD.
- **Tela cheia:** o passeio foi testado fora de tela cheia; o comportamento do Esc em tela cheia com o passeio ativo fica como na rodada anterior (teste real limitado pelo navegador).

## Correção do trajeto (rodada de ajuste, pedido do Central)

Pasta: `correcao-trajeto-2026-11-22/` (prints 1440x900, `run-amostras.json`, `analise-fora-do-asfalto.json`).

### Causa do desvio
- O trajeto de cada trecho começa com pontos colados no carro. Quando o primeiro ponto ficava atrás do carro, o `navigationInput` mirava nele, o ângulo passava de 1,65 rad e o carro dava **marcha à ré** (até -4,17 m/s) para a calçada.
- Saída da corrida: o Geep partia com a frente em direção oposta ao primeiro ponto. Após cada parada o mesmo padrão se repetia.
- Medido antes da correção (corrida `guided-full2`): 26 de 625 amostras fora do asfalto, todas em um único trecho nos primeiros 3 s, com marcha à ré.

### Correção (`src/app.js`, `legTo`)
- Antes de cada trecho, o Geep gira **parado, sobre o asfalto** até a frente apontar para o ponto que o `navigationInput` vai mirar: o primeiro do trecho a 8 m ou mais (mesmo critério do `navigationInput`).
- Velocidade de giro: 1,6 rad/s, sem teleporte. Nenhum limite de curva foi afrouxado, nenhum trajeto foi encurtado.
- Primeira tentativa (alinhar com o primeiro ponto do trecho) ainda dava marcha à ré: mirava num ponto a 0,4 m atrás do carro. Corrigida antes da medição final.

### Medidas (Chrome real, 1440x900, `?perf`)

| item | resultado | aceite |
|---|---|---|
| amostras fora do asfalto na corrida completa | **0** de 581 amostras guiadas | 0 |
| amostras com marcha à ré | **0** | — |
| paradas visitadas | **9/9**, em 163,7 s (antes: 175,6 s) | 9/9 |
| erros de console, HTTP e página | **0** | 0 |
| FPS (rAF 3 s): mural / palco / centro | **60 / 60 / 59,8** | ≥ 55 |
| peso inicial (antes de entrar no 3D) | **4,34 MB** | ≤ 9,3 MB |
| peso acumulado ao final | **8,08 MB** | ≤ 9,3 MB |
| `npm run check` | OK (exit 0) | OK |
| `npm test` | **165/165** | OK |

Tempo de cada parada desde o início (corrida `correcao-trajeto`): 4,55 · 17,39 · 38,98 · 54,73 · 73,80 · 91,80 · 121,51 · 138,95 · 159,20 s.

### Títulos dos cards
- Causa: `h1–h3` usa `letter-spacing: -2px` em `src/style.css`, que encolhia o espaço entre palavras ("Aexplosão", "Areinvenção").
- Correção em `src/landing-fixes.css`: `h1, h2, h3, h4 { word-spacing: .14em; }` e, no card do passeio, `letter-spacing: .01em; word-spacing: .14em`.
- Conferido nos prints 1440x900: card do passeio "A explosão", barra "A caminho" (Courier New, sem o problema), cards de descoberta. Títulos de outras telas (painéis de era, bandas, mapa) recebem a mesma regra por serem `h1`–`h4`, mas não foram todos conferidos em print nesta rodada.

### Limites que continuam
- A simulação de partidas em outros pontos (fora do Hero) mostrou que o trajeto ainda pode sair do asfalto em curvas fechadas de alguns trechos, e que a partir de um ponto fora da malha (dentro de um quarteirão) o carro pode ficar preso na marcha à ré. Não medido no Chrome; o percurso de aceite começa no Hero (0, 0).
- Nenhum teste unitário novo para o alinhamento: a regressão está coberta pela medição do Chrome. Pode ser transformada em teste de simulação se o Central quiser.

### Decisão sobre as 9 paradas (não alterada)
- A especificação fala em "9 paradas temáticas / eras". Os 9 capítulos de `thematicStops` são painéis editoriais sem lugar na estrada, e o texto deles diz "consulte os nove painéis editoriais".
- Mantido: 4 portais de era (`CITY_ERAS`) + 5 pontos de história (`DISCOVERIES`), com título, ano e resumo que já existem no projeto.
- Alternativa: usar os 9 capítulos editoriais como paradas (exigiria lugares na estrada para eles). Não será trocada sem aviso prévio ao Central.
