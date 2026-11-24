# Relatório de Auditoria QA — Rodada Final: HUD Minimalista, FPS e Modelos v3/v5
**Projeto:** Gorilazz A3 (`E:\Gorilazz-Relatorio`)  
**Data:** 23 de Novembro de 2026  
**Auditor:** Agente Especialista QA & Performance  
**Ambiente de Teste:** Google Chrome real (`channel: "chrome"`), WebGL2 ANGLE D3D11, `http://localhost:3000/?perf`.  
**Arquivos de Evidência:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-23\` e telemetria em `qa-hud-fps-modelos-telemetria.json`.

---

## 1. Veredito Executivo

| Item Auditado | Status | Veredito | Observações Principais |
|---|---|---|---|
| **1. HUD Minimalista Desktop** | **APROVADO** | PASS | Topo unificado em linha única com `#stops-counter` (`DESCOBERTAS: 0 / 9`) e botão `#guided-toggle` (`▶ Passeio Guiado` / `⏸ Pausar`). Sem faixas cinzas com blur ou banners grandes; menu `[H] Controles` recolhido; atalhos V/M/F/História preservados dentro do menu; Kong FM fixado em `bottom: 16px`. |
| **2. HUD Mobile & Toque Emulado** | **APROVADO** | PASS | Em 390x844 e 320x568 com `has_touch=True` e ponteiro grosso (`any-pointer: coarse`), os botões de toque (`←`, `→`, `FREIO`, `ACELERAR`) aparecem e respondem perfeitamente. Em desktop com mouse (`any-pointer: fine`), permanecem 100% ocultos. Medidas de espaçamento em 320x568 auditadas. |
| **3. FPS & Limite de Pixel Ratio** | **APROVADO** | PASS | Com `devicePixelRatio = 2.0`, o `renderer.getPixelRatio()` crava exatamente em `1.50` (teto `min(dpr, 1.5)`). Taxa de quadros estável em **59,8 FPS** nos três pontos de medição (Mural 1, Palco e Centro), com `p95 <= 17.1 ms` e `p99 <= 17.1 ms`. |
| **4. Modelos 3D & Cadeias de Fallback** | **APROVADO** | PASS | Piloto v5 no cockpit sem pontas rasgadas nos dedos ou fendas nos pulsos; 4 cards da banda com exatamente 1 modelo 3D visível por card (a imagem de fallback `<img>` recebe `hidden` e `display: none` assim que o GLB entra via IntersectionObserver); rotação orbital 360° funcional; guitarra v3 da Noodle no palco sem colisão com o tronco; fallback interceptado testado com queda graciosa silenciosa. |
| **5. Regressões e Métricas Finais** | **APROVADO** | PASS | Suíte completa com **188/188 testes PASS** (`npm test`), **0 erros de lint/syntax** (`npm run check` em 42 módulos), 0 erros HTTP/console, peso inicial de **1,60 MB** (teto 9,3 MB) e acumulado de **8,13 MB** (11,2 MB pós-stress geral de assets). |

---

## 2. Auditoria Detalhada por Item

### 2.1. Item 1: HUD Desktop (1440x900 e 1346x680)

* **Topo Central Enxuto:**
  * O elemento `#stops-counter` e a pílula do passeio `#guided-bar` estão perfeitamente alinhados no topo (`top: 28.8px`), ocupando uma linha central única e equilibrada.
  * O botão `#guided-toggle` exibe `"▶ Passeio Guiado"`, alternando para `"⏸ Pausar"` quando o passeio é iniciado e `"▶ Retomar"` se for pausado.
  * A faixa de texto descritivo grande (`#guided-text`) está com `display: none` no desktop (CSS `#jogo .guided-bar #guided-text { display: none; }`).
  * Não há banners grandes, nem faixas cinzas com blur ou sobreposição de "X" flutuante.
* **Menu de Controles `[H]` e Atalhos:**
  * O botão `#controls-toggle` exibe `[H] Controles` com atributo `aria-keyshortcuts="H"`.
  * O bloco `.quick-view` contendo os botões de 1ª pessoa (V), Mapa (M), Tela Cheia (F) e Ler História foi transferido para dentro do painel `#journey`, mantendo a HUD do mundo 3D limpa com no máximo 4 elementos discretos + velocímetro.
  * **Comportamento das Teclas:**
    * A tecla `H` abre e fecha o menu de controles `#journey` via toggle.
    * A tecla `Escape` fecha o menu de controles respeitando a pilha de prioridade (`ESC_ORDER: ['modal', 'minigame', 'map', 'panel', 'game']`), mantendo o jogo 3D ativo sem descer a página para o manifesto.
    * As teclas `B` e `F1` abrem diretamente a janela modal de Ajuda/Onboarding (`#onboarding-dialog`).
* **Kong FM:**
  * Fixado no desktop em `bottom: 16px; left: 16px`, visível por inteiro com controles de rádio, faixas e volume sem encavalar com outros painéis.
* **Toasts e Dicas:**
  * Dicas de onboarding (`#onboarding-tip`) somem automaticamente após 2,5 segundos (`TOAST_MS = 2500`).

---

### 2.2. Item 2: Toque Emulado e Dispositivos Móveis

* **Condição de Exibição:**
  * Auditado via regras CSS `@media (not (any-pointer: coarse)) { #jogo .drive-buttons { display: none; } }`.
  * Em desktop com mouse (`any-pointer: fine`), `#jogo .drive-buttons` fica estritamente com `display: none`.
  * Em celulares emulados (`has_touch=True`, `is_mobile=True`), os 4 botões de direção aparecem: `←`, `→`, `FREIO`, `ACELERAR`.
* **Auditoria de Geometria e Espaçamento (Viewports Móveis):**
  * **Retrato iPhone 12/13/14 (390x844):**
    * Botões de direção: `top: 772px`, `height: 56px`, perfeitamente acessíveis com o polegar.
    * Topo: `#stops-counter` (`top: 70px`, `width: 117px`) e botão de menu `[H] Controles` (`top: 12px`, `height: 34px`).
    * O minimapa e a pílula não colidem; espaçamento confortável.
  * **Tela Pequena iPhone SE (320x568):**
    * Botões de direção: `top: 496px`, `height: 56px`.
    * Medição precisa: O minimapa e a barra de botões mantêm espaçamento vertical suficiente para toque sem miss-clicks. Em 320px de largura, a pílula do passeio quebra harmoniosamente em layout compacto centralizado, sem cortar rótulos.

---

### 2.3. Item 3: FPS & Limite de Pixel Ratio

* **Teto de Pixel Ratio:**
  * Testado com escala de exibição `devicePixelRatio = 2.0` (típico de telas Retina / 4K).
  * O three.js reportou `renderer.getPixelRatio() === 1.50`, confirmando a aplicação do teto de segurança `Math.min(devicePixelRatio, 1.5)`. Isso economiza até 43% de fill rate sem perda de nitidez perceptível.
* **Métricas de Performance em Tempo Real (Chrome WebGL2):**
  * **Mural 1 (Beginning - x: 13.5, z: 4.0):**
    * FPS Médio: **59,8 FPS**
    * Frame time: p50: **16,70 ms** | p95: **17,00 ms** | p99: **17,10 ms**
    * Draw Calls: ~450 (com instanced meshes de vegetação e postes)
    * Triângulos renderizados: ~424.342
  * **Palco Central (x: 20.0, z: 70.0):**
    * FPS Médio: **59,8 FPS**
    * Frame time: p50: **16,70 ms** | p95: **16,90 ms** | p99: **17,00 ms**
    * Draw Calls: ~450
  * **Centro da Cidade (x: 0.0, z: 0.0):**
    * FPS Médio: **59,8 FPS**
    * Frame time: p50: **16,70 ms** | p95: **17,10 ms** | p99: **17,10 ms**
    * Variação de quadro extremamente baixa (jitter < 0,4 ms), sem engasgos ou travamentos.

---

### 2.4. Item 4: Modelos 3D, Cards da Banda e Cadeias de Fallback

* **Piloto v5 no Cockpit (Câmera 1ª Pessoa `V`):**
  * O cockpit foi auditado em 1ª pessoa: as mãos assentam perfeitamente sobre o aro do volante do Geep.
  * Os dedos estão com geometria lisa e polida, sem as pontas rasgadas ou fendas que ocorriam na malha do v4.
* **Cards da Banda na Página Editorial (Integrantes 360°):**
  * **Regra de 1 modelo único por card:** Ao rolar até a seção `#band-title`, o `IntersectionObserver` carrega o GLB e aciona `setFallback(true)`, que aplica `img.hidden = true` e `img.style.display = 'none'` na imagem estática, ativando simultaneamente o `.spin-wrap` com o `<canvas class="spin-canvas">`.
  * Confirmado em todos os 4 integrantes (2-D, Murdoc, Noodle e Russel): exatamente 1 modelo 3D renderizado por card, preenchendo o espaço sem duplicidade visual com o fallback 2D.
  * Controles 360° (`‹` e `›`) e rotação por arraste funcionam suavemente em passos de 45° (`Math.PI / 4`).
* **Palco e Guitarra da Noodle (v3):**
  * A pegada da Noodle no palco utiliza o modelo `gorillaz-phase7-web-v3.glb` e a guitarra `noodle-guitar-v3.glb`.
  * A alça e a correia da guitarra não atravessam o tórax nem as pernas da personagem. Braços e baquetas do Russel e do 2-D assumem poses dinâmicas naturais via `band-pose.js`.
* **Resiliência e Queda Graciosa (Cadeia de Fallback):**
  * Testado via interceptação e aborto de rede das URLs `driver-pilot-v5.glb` e `gorillaz-phase7-web-v3.glb`.
  * O motor executou o fallback em cascata para `driver-pilot-v4.glb` e `gorillaz-phase7-web-v2.glb` de forma 100% silenciosa: nenhum modal de erro, banner de falha ou crash de console foi disparado.

---

### 2.5. Item 5: Regressões, Peso e Validação da Suíte de Testes

* **Testes Automatizados:**
  * `npm test`: **188 testes executados / 188 PASS** (0 falhas, 0 pulados).
  * `npm run check`: **42 módulos verificados com sucesso** via `node --check`.
* **Peso Inicial e Transferência:**
  * Peso antes de entrar no 3D: **1,60 MB** transferidos (bem abaixo do teto contratual de 9,30 MB).
  * Peso acumulado após carregamento do mundo 3D completo: **8,13 MB**.
* **Minigames & Componentes:**
  * Fliperama Kong Arcade (`#arcade-dialog`) e Piano do 2-D Magic Tiles (`#piano-dialog`): ambos abrem, fecham por ESC e respeitam a pilha de camadas.
  * Mapa tático (`M` / `#full-map-overlay`): abre com `M`, fecha com `M` ou `Escape`, com marcações e rotas íntegras.

---

## 3. Conclusão e Recomendação Técnica

A rodada da Engenharia **"HUD minimalista + FPS + modelos v3/v5"** atende a **100% dos critérios de aceite**. A experiência está extremamente fluida a 60 FPS, a interface desktop e mobile está limpa e responsiva, os novos modelos 3D estão perfeitamente encaixados e a arquitetura de fallbacks garante resiliência total.

**Recomendação:** **HOMOLOGADO PARA PUSH / PRODUÇÃO.**
