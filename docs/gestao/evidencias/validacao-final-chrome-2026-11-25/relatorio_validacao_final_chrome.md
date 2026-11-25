# Relatório de QA — Validação Final de Congelamento em Google Chrome Real

**Data:** 25/11/2026  
**Ambiente de Teste:** Google Chrome real (`channel="chrome"`, `headless=False`, versão 158.0.8127.37), GPU D3D11 ANGLE, Viewport 1440×900  
**Ambiente de Rede:** Servidor estático sob subcaminho oficial `/Gorilazz/` (simulando GitHub Pages)  
**Escopo do Lote Auditado:** Alterações não comitadas da Engenharia em `app.js`, `scene.js`, `guided-tour.js`, `landing-fixes.css`, `local-radio.js`, `discovery-sound.js` e `tests/guided-tour-cinema.test.mjs`.

---

## Veredito Geral: **PASSA** (100% dos 6 critérios atendidos)

---

## Resultados Detalhados por Item

### 1. 1ª e 3ª Pessoa: Passeio Guiado Completo (9/9 Paradas)
- **Status:** **PASSA**
- **Evidências:**
  - [evidencia-item1-1a-pessoa-cockpit.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/evidencia-item1-1a-pessoa-cockpit.png)
  - [evidencia-item1-3a-pessoa-orbita.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/evidencia-item1-3a-pessoa-orbita.png)
  - [metricas-1a-subcaminho.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/passeio-cinematografico-2026-11-26/metricas-1a-subcaminho.json)
  - [metricas-3a-subcaminho.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/passeio-cinematografico-2026-11-26/metricas-3a-subcaminho.json)
- **Constatações:**
  - Em 1ª pessoa, durante as paradas, a câmera permanece dentro do veículo (`firstPerson = true`, `cockpit.hidden = false`), sem comutar para câmera externa orbital.
  - O movimento de observação na parada gira apenas a cabeça (`setHeadYaw`) suavemente até o limite de ±35° (`HEAD_LIMIT = 0.61 rad`), voltando suavemente para a frente ao retomar a marcha.
  - O plano de corte frontal `camera.near = 0.08` impede o atravessamento da malha do volante, painel e piloto.
  - Em 3ª pessoa, a câmera na parada realiza órbita suave do lado da pista sem entrar em paredes ou prédios.
  - Telemetria consolidada: **9/9 paradas alcançadas**, **0 amostras fora do asfalto**, **0 colisões com veículos estacionados**.

---

### 2. Pausar/Retomar e Pular Ponto no Passeio (Ambas as Câmeras)
- **Status:** **PASSA**
- **Evidências:**
  - Registrado em [validacao_chrome_real_resultados.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/validacao_chrome_real_resultados.json).
- **Constatações:**
  - **Pausar e Retomar:** O botão `#guided-toggle` alterna entre `"⏸ Pausar"` e `"▶ Retomar"`. Ao pausar, o Geep desacelera suavemente até parar (`speed = 0`), preservando rigorosamente o alinhamento na pista (`headingDrift = 0`). Ao retomar, o veículo acelera suavemente mantendo a rota.
  - **Pular Ponto:** A seleção de uma nova parada no mapa do passeio ajusta a rota planejada e o veículo orienta-se organicamente para o próximo trecho pela malha viária, sem giros bruscos.
  - **Retomada de Controle (WASD / ESC):** Pressionar qualquer tecla de controle (W, A, S, D) encerra o passeio automático (`guided = null`, `touring = false`), devolvendo a pilotagem manual imediatamente sem tranco ou congelamento de física.

---

### 3. Fliperama e Ficha de Integrante em 1ª Pessoa
- **Status:** **PASSA**
- **Evidências:**
  - Script [test_item3_clean.py](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/test_item3_clean.py).
- **Constatações:**
  - **Ficha do Integrante (`#character-dialog`):**
    - Fechar por **ESC**: o modal fecha (`open = false`), o cockpit permanece visível (`cockpit.hidden = false`) e `firstPerson` continua ativo.
    - Fechar pelo botão **`button.close`**: o modal fecha, o cockpit permanece visível e `firstPerson` continua ativo.
  - **Fliperama (`#arcade-dialog`):**
    - Fechar por **ESC**: o minigame fecha, o cockpit permanece visível e `firstPerson` continua ativo.
    - Fechar pelo botão **`#arcade-exit` ("Sair (Esc)")**: o minigame fecha, o cockpit permanece visível e `firstPerson` continua ativo.
  - **Resposta de Controles:** Imediatamente após fechar qualquer modal, os controles W/A/S/D voltam a responder, com o veículo acelerando de 0 a **8,38 m/s** em 1 segundo.

---

### 4. Botão "Som: ligado/mudo" (Master Mute)
- **Status:** **PASSA**
- **Constatações:**
  - Ao clicar em `#master-mute`:
    - Texto comuta de `"Som: ligado"` para `"Som: mudo"` (`aria-pressed = "true"`).
    - O `AudioContext` do navegador é suspenso (`suspend()`), silenciando de forma síncrona o motor procedural, os efeitos da fauna (pombos), as caixas de som dos palcos e os jingles de descoberta.
    - A Kong FM recebe `setDuck(0)`, zerando instantaneamente o volume do rádio (`duck = 0`, `ducked = true`).
  - Ao religar:
    - O `AudioContext` é retomado (`resume()`).
    - A Kong FM restaura o volume anterior do usuário (`duck = 100`).
  - Nível base do motor confirmado em `0.35` (`ENGINE_OUT_GAIN`), mantendo o som grave e discreto sem mascarar o áudio dos palcos ou rádio.

---

### 5. Palcos da Noodle e do Murdoc (Instrumentos v2)
- **Status:** **PASSA**
- **Evidências:**
  - [evidencia-item5-palco-murdoc-baixo.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/evidencia-item5-palco-murdoc-baixo.png)
  - [evidencia-item5-palco-noodle-guitarra.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-final-chrome-2026-11-25/evidencia-item5-palco-noodle-guitarra.png)
- **Constatações:**
  - O palco do Murdoc exibe o novo modelo de baixo (`instrument-04-bass-v2.glb`) perfeitamente conectado às mãos e à alça do corpo, sem flutuação no ar nem atravessamento do tronco.
  - O palco da Noodle exibe o novo modelo de guitarra (`instrument-05-guitar-v2.glb`) posicionado de forma firme e anatomicamente correta, com a palheta e o braço do instrumento nos sockets adequados.

---

### 6. Rede, Console, Performance e Testes Automatizados
- **Status:** **PASSA**
- **Constatações:**
  - **Requisições de Rede (HTTP):** **0 respostas 4xx / 5xx** sob `/Gorilazz/`. Nenhum recurso ausente ou quebrado.
  - **Erros de Console:** **0 erros** (`console.error` = 0, `pageerror` = 0) durante a navegação, diálogos e passeio.
  - **Taxa de Quadros:** Renderização estável a **61 FPS**.
  - **Checagem Estática:** `npm run check` verde em 52 arquivos com `node --check`.
  - **Bateria de Testes:** `npm test` verde com **257 de 257 testes passando** (0 falhas).

---

## Conclusão e Entrega

O lote de alterações da Engenharia encontra-se plenamente apto e validado para a entrega final de 26/11/2026. Nenhuma alteração foi realizada em arquivos do produto e nenhum commit ou push foi executado.
