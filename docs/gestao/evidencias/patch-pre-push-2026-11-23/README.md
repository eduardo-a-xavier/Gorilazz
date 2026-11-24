# Patch pré-push — evidências (Gorilazz A3)

Medido no Chrome real (`localhost:3000/?perf`). Sem git add/commit/push, sem Co-authored-by; quem faz o commit é o Eduardo.

Base técnica: three.js puro (`src/`). O briefing fala em React/R3F (`useFrame`, `setState`, `useRef`, `onLoad`); a intenção foi traduzida para os módulos atuais, sem React.

## Status por item

| # | item | status | o que mudou | evidência |
|---|---|---|---|---|
| 1 | Boneco duplo nos cards da banda | **feito** | A regra `.band-portrait img{display:block}` vencia o atributo `hidden`; agora `img[hidden]` sai com `display:none !important` e `setFallback` também define `style.display` (`src/landing-fixes.css`, `src/member-viewer.js`). A câmera do visualizador foi aproximada (6,9 m, centro em 1,6 m) para o modelo de 3,2 m preencher o card (`src/member-viewer.js`). | `antes-cards-banda-1440x900.png` (dois bonecos), `depois-cards-banda-1440x900.png` (um por card) |
| 1b | Pose idle sem T-pose | **não feito** | Os GLBs dos integrantes não têm animação nem esqueleto (`gorillaz-phase7-web-v2.glb`: 0 animações, 0 skins). Não há pose idle para usar. A T-pose é do próprio modelo. | — |
| 2 | Delta limitado (`Math.min(delta, 0.05)`) | **feito** | Helper puro `clampFrameDelta` (`src/frame-timing.js`), usado no `updateFrame`. | teste em `tests/guided-tour.test.mjs` |
| 2 | Alocações por quadro | **auditado** | No loop de atualização há 3 alocações, todas em eventos (atropelamento e textura de placa), não por quadro. `stepVehicle` não aloca. | — |
| 2 | HUD em 10–15 Hz | **já estava** | Atualização a cada 80 ms (12,5 Hz). | `src/app.js` |
| 2 | Grip lateral ("carro de sabão") | **não aplicável** | O modelo de física não tem deslizamento lateral: a posição segue o heading. Não há o que aumentar de grip sem reescrever a física (velocidade vetorial). | — |
| 2 | Waypoints do passeio | **medido, sem alteração** | Re-medição: 0 amostras fora do asfalto, 9/9 em 164,4 s, 0 erros (`passeio-run.json`). O trajeto já segue o eixo da pista e não corta canteiro, então não houve suavização. | `passeio-run.json` |
| 2 | Frame time p95 / p99 | **medido** | Depois: p50 16,7 · p95 16,9 · p99 17,1 ms; 5 quadros > 33 ms em 40 s; pico de 301 ms num quadro. Rodada anterior: p95 17,0 · p99 17,2 ms (comparação entre sessões, não é um "antes" do mesmo código). | `frametime-depois.json` |
| 3 | Faixa cinza com blur | **feito** | Override `backdrop-filter:none` no rodapé, cartões da HUD e `.section-dock`. | `depois-hud-1440x900.png` (rodapé sólido, sem blur) |
| 3 | Controles recolhidos atrás de botão | **feito, com troca de tecla** | Painel "Mapa e controles" escondido por padrão; botão **[J] Controles** abre e fecha. **Não usei H**: H já abre a ajuda (`HELP_KEYS = ['h','f1']`, testado). J estava livre. | `depois-hud-*.png` |
| 3 | Toasts somem em 2,5 s | **feito** | `TOAST_MS = 2500` para o toast de 9/9 e para a dica (antes 6 s e 4 s). | teste em `tests/guided-tour.test.mjs` |
| 3 | Pílula do passeio sem corte | **feito** | Logo abaixo do contador (`top: var(--top) + 104px`); em telas ≤ 420 px quebra em duas linhas. | medidas abaixo |
| 3 | Confirmar 1440x900 / 1346x680 / 390x844 / 320x568 | **feito** | Ver medidas. Em 320x568 a barra superior de botões ainda encosta no minimapa (já existia, não foi alterada). | `depois-hud-*.png` |
| 4 | Mãos ~4 cm à frente | **feito** | Deslocamento ao longo da normal do volante de 0,02 para 0,06 m (`src/cabin.js`). A diferença visual é sutil. | `antes-cockpit-maos-*.png` e `depois-cockpit-maos-*.png` |
| 4 | Visor 3D ligado à faixa da Kong FM | **já estava** | O visor do cockpit lê `radio.read()`, o mesmo estado do player da HUD (`cabin.update(vehicle, radio.read(), …)`). Nos dois prints o visor mostra "Concreto". | `depois-cockpit-1440x900.png` |
| 4 | Piano pausa o rádio e devolve ao sair | **feito e testado no navegador** | Módulo `src/radio-duck.js`: pausa só se o rádio estava tocando; devolve ao sair; não religa o que o usuário pausou. Teste no navegador: tocando antes → pausado durante → tocando depois de sair; já pausado → continua pausado. | testes em `tests/guided-tour.test.mjs` e medição (`duck_check.py`) |
| 5 | Placas padronizadas | **feito, parcial** | Moldura metálica escura, painel escuro e Anton em alto contraste (`src/sign-style.js`, `src/roads.js`). **Mantive o atlas** (512 px de largura, 96 px por linha) em vez de 1024x512 por placa: 11 placas em 1024x512 seriam ~23 MB de textura, em conflito com peso e FPS. Anisotropia 8. | `antes-placa-song-machine-*.png`, `depois-placa-song-machine-*.png` |
| 5 | Letreiros SEM SINAL / FECHADO com brilho | **feito, não conferido em print** | Cor de neon mais clara só nessas linhas (`isClosedSign`, `CLOSED_SIGN_NEON`, em `src/city.js`). Não capturei o letreiro atrás dos andaimes. | teste em `tests/guided-tour.test.mjs` |
| 5 | Totens e suporte ao meio-fio | **não feito** | Não revisei totens nem suportes um a um nesta rodada. | — |

## Medidas de aceite

- **FPS (rAF 3 s):** mural 59,9 · palco 59,9 · centro 59,8 (≥ 55).
- **Erros HTTP, console e página:** 0.
- **Peso:** inicial 4,34 MB; acumulado ao final 8,10 MB (teto 9,3).
- **`npm run check`:** OK.
- **`npm test`:** 180/180 (eram 174; acrescentados: delta do quadro, TOAST_MS, rádio do piano, placas e letreiros fechados).

### HUD: caixas dos elementos (pixels, top–bottom / left–right)

| tamanho | pílula (depois) | contador (depois) | sobreposição |
|---|---|---|---|
| 1440x900 | 133–185 / 469–971 | 81–114 / 590–850 | nenhuma |
| 1346x680 | 131–183 / 422–924 | 79–112 / 543–803 | nenhuma |
| 390x844 | 112–191 / 98–293 | 64–96 / 110–280 | nenhuma |
| 320x568 | 112–205 / 80–240 | 64–96 / 75–245 | nenhuma |

Antes, medido na mesma sessão antes do patch: pílula em 320x568 em 343–484 px (141 px de altura), encostando no rádio (444–484).

## Limites

- Pose idle: os GLBs dos integrantes não têm animação.
- Grip lateral: o modelo não tem deslizamento lateral; não há o que ajustar sem reescrever a física.
- Atlas das placas mantido (peso e FPS).
- Totens das 9 descobertas e suportes ao meio-fio não revisados.
- Letreiro SEM SINAL / FECHADO: sem print de conferência.
- Tecla do controle: J, não H (conflito com a ajuda).
- Barra superior de botões em 320x568 ainda encosta no minimapa (não alterada).
