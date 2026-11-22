# Rodada final — resultados de engenharia (front-end)

Medido no Chrome real, `localhost:3000/?perf`. Sem commit, push ou Co-authored-by: quem faz o commit é o Eduardo.

## Status por item do briefing

| # | item | status | o que mudou |
|---|---|---|---|
| 1 | Piano estilo Magic Tiles (erro vermelho, tela expandida) | **feito** (testes e prints) | Tecla sem nota na janela = erro (`wrong`): coluna inteira em `#FF2A2A`, tremor de 150 ms, som de erro sintetizado, combo zerado. Nota que passa da linha = erro na coluna. Acerto em verde/ciano com PERFEITO/BOM. Canvas 640x480 (4 pistas largas) e diálogo a ~90vw x 85vh. ESC segue igual (não re-testado nesta rodada). |
| 2 | KONG ARCADE reposicionado | **feito** | Máquina recuada de (-10,-10) para (-13,5; -10): base de 4,7 m fica a 1,14 m do asfalto (≥ 0,90 m). Base de piso e anel rosa iguais aos dos pontos de história. Frente voltada para a via. |
| 3 | Contador X/9 | **feito** (teste no navegador) | Cada uma das 9 paradas soma ao abrir pelo E (história ou portal de era), com ou sem passeio. Repetir não soma. HUD e ✓ do mapa atualizam na hora. Persiste após recarregar. |
| 3b | Passeio sincronizado com a Kong FM | **parcial** | Ao chegar, o player local troca de faixa: parada da era plástico → "Maré de plástico"; demais → "Concreto". Só há essas duas faixas liberadas, então não há troca por era. |
| 3c | Câmera cinematográfica no passeio | **feito** | Na parada, órbita lenta (~25 s por volta) a 7,5 m do ponto, altura 3,4 m. Ao pressionar W/S/A/D (ou parar o passeio), `clearPose` devolve a câmera de viagem (medido: 24 m do carro). |
| 4a | Câmera: árvores e suavização | **parcial** | Copas das árvores viraram bloqueadores da câmera. Damp já existia (exponencial). Frame time sem diferença (ver abaixo). Não consegui reproduzir a travessia de copa no trajeto do passeio (0 de 78 amostras com e sem o bloqueio), então o efeito não está medido no caso do vídeo (curvas fechadas em direção manual). |
| 4b | Piloto v4 | **feito** | `driver-pilot-v4.glb` na cadeia v4 → v2 → original (`src/pilot-rig.js`, `src/scene.js`); rota no `server.mjs`. Em 1ª pessoa, mãos seguem presas ao aro e ao punho rosa; sem fenda. Pontas dos dedos em direção ainda não conferidas de perto (Central já anotou). |
| 5 | Cena (Murdoc, Noodle/Russel, placa, caixas, bancas, totens, LOD) | **não feito** | Nenhuma alteração nesta rodada. Fica para a próxima. |

## Medidas

- **FPS (rAF 3 s):** mural 60 · palco 59,9 · centro 59,8 (aceite ≥ 55).
- **Frame time em passeio (40 s, Chrome):**
  - sem bloqueio de árvores: p50 16,7 · p95 17,0 · p99 17,3 ms; quadros > 33 ms: 7
  - com bloqueio de árvores: p50 16,7 · p95 17,0 · p99 17,2 ms; quadros > 33 ms: 3
- **Peso:** inicial 4,34 MB (teto 9,3); acumulado ao final 8,10 MB.
- **Erros de console/HTTP/página:** 0 (`final_check`, piano, contador, arcade, piloto).
- **Testes:** `npm run check` OK; `npm test` 173/173.
- **Contador pelo E (manual, 9 paradas):** 0 → 9, uma soma por parada, repetir não soma, mapa com 9 ✓, após recarregar 9/9.

## Bugs achados no caminho

- **Escape travado em diálogo:** o `MutationObserver` registrava também `<details open>` do arquivo de eras como diálogo; o Esc tentava `close()` nele e erro de página (`top.close is not a function`) deixava o diário aberto e bloqueava o E. Corrigido em `src/app.js` (só `<dialog>` entra na pilha).

## Testes novos

- `tests/piano-game.test.mjs`: tecla errada = erro e zera combo; miss na própria coluna; acerto sem vermelho; cores e mensagens do feedback.
- `tests/guided-tour.test.mjs`: `stopIdFor` (E conta história e era, integrante não conta); 9 paradas contam uma vez; `localTrackFor`.
- `tests/arcade.test.mjs`: base do fliperama a ≥ 0,90 m do asfalto e fora de obstáculos.
- `tests/camera.test.mjs` e `tests/driver.test.mjs`: atualizados para copas de árvore e para o v4 (tamanho, hash, 65 joints, Driving_Loop).

## Arquivos desta rodada

- Código: `src/piano-game.js`, `src/piano-screen.js`, `index.html` (canvas do piano), `src/arcade.css`, `src/arcade.js`, `src/arcade-cabinet.js`, `src/guided-tour.js`, `src/local-radio.js`, `src/app.js`, `src/scene.js`, `src/pilot-rig.js`, `server.mjs`.
- Testes: `tests/piano-game.test.mjs`, `tests/guided-tour.test.mjs`, `tests/arcade.test.mjs`, `tests/camera.test.mjs`, `tests/driver.test.mjs`.
- Evidências: esta pasta (prints antes/depois do fliperama e do piloto; piano em 4 tamanhos; HUD e mapa 9/9; câmera cinematográfica; frame time em JSON; `teste-contador-9-pelo-E.py`).

## Não feito ou não medido

- Piano "antes" (modal antigo) não foi capturado; só "depois".
- Item 5 inteiro (pose do Murdoc, ângulos de Noodle/Russel, placa, caixas, bancas, totens, LOD).
- Esc em tela cheia com piano aberto não re-testado nesta rodada.
- Câmera contra copas: não reproduzida no trajeto do passeio; precisa de teste em direção manual numa curva fechada.
- Trocar a faixa do player local por era depende de áudio liberado para cada era (hoje só 2 faixas).

## Aviso

O sistema avisou que `src/scene.js` mudou no disco depois da minha última leitura. Parte pode ser da minha própria escrita por script (import de `TREE_LOCATIONS`); não consegui confirmar se há outra mudança. Minhas alterações em `scene.js`: import de `TREE_LOCATIONS`, bloqueio de árvores em `createCameraBlockers`, carregamento do piloto (v4 → v2 → original) e comentário. Vale revisar o diff antes do commit.

## Atualização (rodada de ajustes do Central)

- **Piano:** diálogo ~90% x 81% da tela em 1440x900 (palco 934x701), layout em duas colunas no desktop; banner `ERRO: tecla errada` inteiro na área visível nos 4 tamanhos; tecla errada acende a coluna tocada em `#FF2A2A` com tremor de 150 ms.
- **Fliperama:** antes de começar mostra "colete todos os 117 pontos" (antes: "Restam 0").
- **Copas de árvore (direção manual, 16 árvores, curvas em zigue-zague):** sem bloqueio 9 de 576 amostras com a câmera atravessando copa; com bloqueio 7 (piso de altura 5,8 m); com piso de 7,5 m, 4 de 576. Os 4 restantes estão a 7,2–7,9 m do carro, na distância mínima do braço da câmera (7,5 m): não eliminados sem mudar o braço mínimo.
- **Troca de faixa Kong FM:** só 2 faixas liberadas (Concreto e Maré de plástico); registrado no README desta pasta.
- **Item 5 (cena):** não feito. Diagnóstico: o enquadramento de frente com `framePerson` ainda pega pernas e bateria do Murdoc, não a pose completa; "Rua Song Machine" existe em `world-data.js` (ROAD_NAMES), a conferir na cena.
- **Aceite:** FPS 59,8 / 60 / 60; 0 erros; peso inicial 4,34 MB, acumulado 8,10 MB; `npm run check` OK; `npm test` 174/174.
