# Modelos novos — integração e evidências

Medido no Chrome real (`localhost:3000/?perf`), 1440x900. GLBs não foram editados; só as cadeias de carregamento mudaram.

## Cadeias

| modelo | ordem de carregamento | onde |
|---|---|---|
| Piloto (cockpit) | `driver-pilot-v5.glb` → `v4` → `v2` → `driver-pilot.glb` | `src/pilot-rig.js`, `src/scene.js` |
| Banda (palco e cards 360°) | `gorillaz-phase7-web-v3.glb` → `v2` → `web` → `phase7-v2` → `phase7` | `src/scene.js`, `src/member-viewer.js` |
| Guitarra da Noodle | `noodle-guitar-v3.glb` → `v2` → procedural | `src/scene.js` |

Todos os elos têm rota em `server.mjs` e existem em `assets/models/`. Testes: `tests/model-chain.test.mjs` (ordem e existência) e o teste do piloto em `tests/driver.test.mjs` (tamanho, hash e 65 ossos do v5).

## Status por modelo

| modelo | status | observação |
|---|---|---|
| Piloto v5 | **integrado** | Dedos lisos, sem as pontas rasgadas do v4 (ver `*-cockpit-maos-*.png`). As mãos continuam sobre o aro e os punhos rosa seguem sem fenda visível nesta escala. Não há regressão visível: fica como primeira opção. |
| Banda v3 | **integrado** | Palco e cards em um modelo por card. Diferença v2 × v3 pequena na escala do card; em `antes-integrante-*` e `depois-integrante-*` Russel e 2-D aparecem com baquetas e braços para baixo, não em T rígido. Não há regressão visível. |
| Guitarra v3 | **integrado** | Pegada da Noodle e alça sem atravessar o tronco (`*-palco-noodle-*.png`). Não há regressão visível. |

## Medidas

- FPS (rAF 3 s): mural 59,8 · palco 59,9 · centro 59,8 (≥ 55).
- Frame time (40 s de passeio): p50 16,7 · p95 16,9 · p99 17,1 ms; 5 quadros > 33 ms.
- Erros HTTP, console e página: 0.
- Peso inicial (antes de entrar no 3D): 4,35 MB (teto 9,3).
- Acumulado ao final: 8,13 MB. A banda v3 tem o mesmo tamanho do v2 (3.407.940 bytes); o piloto v5 é menor que o v4; a guitarra v3 tem +720 bytes em relação à v2.
- `npm run check` OK; `npm test` 188/188.

## Limites

- Nenhum dos três modelos mostrou regressão visível nas capturas, então nenhum foi revertido.
- A diferença visual da banda v3 é sutil; uma comparação de perto (cards em tamanho grande) seria a próxima verificação.
- A tela de cockpit em 1ª pessoa foi conferida só em 1440x900.
