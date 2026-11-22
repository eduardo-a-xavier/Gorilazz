# Resumo de alterações por arquivo (para revisão antes do commit)

Não há histórico git neste diretório (não é repositório), então não há diff automático. Abaixo está o que **eu** alterei nas rodadas de passeio guiado e rodada final. Para ver o diff completo, compare com o último commit do Eduardo.

Aviso: o sistema avisou que `src/scene.js` e `src/arcade-screen.js` mudaram no disco depois da minha última leitura. Pode ser da minha própria escrita por script. Não consegui confirmar se há outra alteração além das listadas aqui: revisar o diff desses dois arquivos com atenção.

## Código

| arquivo | o que mudou |
|---|---|
| `src/app.js` | Contagem das paradas pelo E e pelo passeio (`recordStop`, `stopIdFor`); faixa do player local no passeio (`localTrackFor`); câmera cinematográfica na parada (`cinematicHold`); `clearPose` ao sair do passeio; observador de Esc só para `<dialog>`; `trees` exposto no `__gorilazz` (perf); `TREE_LOCATIONS` importado; correção de alinhamento do passeio (`legTo`). |
| `src/guided-tour.js` | `stopIdFor(hit)`; `localTrackFor(stop)`. |
| `src/local-radio.js` | `select` exposto no retorno do player. |
| `src/piano-game.js` | Tecla errada vira `wrong` (zera combo); eventos por resultado (`drainEvents`); `feedbackFor`; mensagens `ERRO: …` e `PERFEITO`/`BOM`. |
| `src/piano-screen.js` | Acende a coluna tocada em vermelho `#FF2A2A` (erro) ou verde/ciano (acerto); tremor de 150 ms; som de erro; banner leva a área visível (`scrollIntoView`). |
| `index.html` | Canvas do piano 640x480. |
| `src/arcade.css` | Piano em modo expandido (diálogo ~90vw x 85svh; no desktop, palco à esquerda e controles à direita); tremor do canvas. |
| `src/arcade.js` | `ARCADE_SPOT` recuado para (-13,5; -10); `ARCADE_PAD_RADIUS`, `ARCADE_ROAD_CLEARANCE`; `mazeDotCount()`. |
| `src/arcade-cabinet.js` | Base de piso e anel rosa (como os pontos de história) fora do grupo escalado; anel verde antigo removido. |
| `src/arcade-screen.js` | Objetivo mostra o total de pontos antes de começar (`setGoal`); HUD não sobrescreve antes de começar. |
| `src/scene.js` | Import de `TREE_LOCATIONS`; copas das árvores como bloqueadores da câmera (`createCameraBlockers`); piso de altura da câmera perto do carro 5,8 → 7,5 m; carregamento do piloto v4 → v2 → original (`PILOT_V2_URL`). |
| `src/pilot-rig.js` | `PILOT_MODEL_URL` = v4; novo `PILOT_V2_URL`; fallback original mantido. |
| `server.mjs` | Rota de `driver-pilot-v4.glb`. |

## Testes

| arquivo | o que mudou |
|---|---|
| `tests/piano-game.test.mjs` | Erro por tecla errada e nota perdida; feedback por resultado; asserts antigos ajustados para `wrong`. |
| `tests/guided-tour.test.mjs` | `stopIdFor`; 9 paradas contam uma vez; `localTrackFor`. |
| `tests/arcade.test.mjs` | Posição nova do fliperama; folga ≥ 0,90 m do asfalto e fora de obstáculos; total de pontos > 0. |
| `tests/camera.test.mjs` | Bloqueadores incluem copas (finas, de propósito). |
| `tests/driver.test.mjs` | Cadeia v4 → v2 → original; v4 verificado por tamanho, hash, 65 joints e `Driving_Loop`. |

Resultado: `npm run check` OK; `npm test` 174/174.

## Não alterado nesta rodada

- LOD dos props instanciados e revisão de caixas de som, bancas e totens das 9 descobertas: sem alteração de código.
- Malhas GLB: nenhum GLB foi editado.

## Alterações do item 5 (rodada de cena)

| arquivo | o que mudou |
|---|---|
| `src/band-pose.js` | SPECS do Murdoc: `contact`, `lean: -.03`, `gaze: [.06, .1]`. |
| `tests/band-pose.test.mjs` | `GAZE_PITCH` do Murdoc = `.06` (acompanha o SPECS). |
| `src/world-data.js` | `TREE_LOCATIONS` sem árvores a menos de 16 m de um palco de integrante. |
| `src/street-props-plan.js` | No anel do palco, só bancos e canteiros (sem árvores). |
| `src/scene.js` | Depuração: `personBounds(index)` (caixa e malhas) e `frameAt(olho, alvo)`. |
