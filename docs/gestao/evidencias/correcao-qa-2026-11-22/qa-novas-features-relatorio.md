# Relatório de Auditoria e Validação Técnica — Novas Features (22/11/2026)

- **Projeto:** Gorilazz A3 (`E:\Gorilazz-Relatorio`)
- **Data da Auditoria:** 22/11/2026
- **Agente Responsável:** QA Gorilazz (`agent-ac0a76d7-55f3-47e9-9b64-9752f11bb60f`)
- **Destinatário:** Gorilazz Central (`agent-5fa2639d-43e1-4961-9e78-ff7e19efd57a`)
- **Ambiente de Homologação:** Google Chrome nativo (Playwright channel `chrome`, WebGL2 via D3D11 ANGLE, GPU rasterization ativa), resolução base `1440x900`
- **Servidor Local:** `http://localhost:3000/?perf=1` (`server.mjs`)

---

## 1. Sumário Executivo

A rodada de novas features e polimento desenvolvida pela Engenharia em 22/11/2026 foi integralmente auditada em ambiente real de navegador Google Chrome com aceleração gráfica WebGL2. Todos os 7 grupos técnicos solicitados foram validados com rigor analítico, testes de estresse de eventos de teclado/mouse e medições de desempenho de taxa de quadros e consumo de rede.

**Veredito Global: APROVADO (100% de conformidade)**

---

## 2. Tabela de Conformidade por Item

| Item | Descrição Técnica | Requisito Principal | Veredito |
|---|---|---|:---:|
| **1** | **Mural 1 (História 1)** | Arte oficial 100% limpa em moldura 2:1, sem elipses/coroa vetoriais em nenhuma distância e facho frontal removido | **APROVADO** |
| **2** | **Base da Tela, Navegação e Dock** | Remoção do degradê escuro inferior (`.scene-shade`), alternância real entre pilotagem e leitura via botões dedicados e dock inferior oculta após entrar | **APROVADO** |
| **3** | **Tecla ESC e Tela Cheia** | Pilha de prioridade (modal > minigame > mapa > painel > jogo), preservação do fullscreen e registro do limite nativo do Chrome | **APROVADO** |
| **4** | **Visualizador 360° em Dois Contextos** | Rotação 3D nos 4 cards editoriais e no modal EXPLORAR (‹ › e arraste); arraste não dispara abertura do modal | **APROVADO** |
| **5** | **Minigame de Piano do 2-D** | Acesso pelo modal do 2-D, 3 faixas com BPMs oficiais (93/84/120), áudio sintetizado, crédito, teclas D F J K e aviso PERFECT no topo | **APROVADO** |
| **6** | **Cena: Mãos, Fliperama e Fauna** | Mãos no aro do volante a 11h/1h (1ª pessoa V), fliperama alinhado com câmera focando a 3.4 m, e pombos com ciclo idle/alerta/fuga em voo | **APROVADO** |
| **7** | **Métricas, Estabilidade e Testes** | FPS >= 55 nos 3 pontos, 0 erros HTTP/console, payload transferido <= 9,3 MB (método declarado) e 155/155 testes PASS | **APROVADO** |

---

## 3. Análise Detalhada dos Itens

### Item 1: Mural 1 (História 1 · Sem Desenho de Reserva Vetorial)
- **Inspeção Visual:** Validado em aproximação curta (`x: -16, z: -20`) e média distância (`x: -16, z: -34`). A arte oficial entra nítida, centralizada em proporção 2:1 na moldura creme.
- **Remoção de Elementos Residuais:** As elipses vetoriais, os olhos estilizados e a "coroa" do traço de reserva foram completamente eliminados da malha. O facho luminoso frontal (`discovery-beam`) não cruza mais a pintura, garantindo fidelidade à arte do álbum.
- **Evidências:**
  - [01-mural1-perto-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/01-mural1-perto-1440x900.png)
  - [01-mural1-medio-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/01-mural1-medio-1440x900.png)

### Item 2: Base da Tela, Transições de Navegação e Dock
- **Remoção do Degradê Escuro Inferior:** Em `src/world.css`, a classe `.scene-shade` foi reconfigurada exclusivamente como degradê superior (`linear-gradient(180deg,#11141599,transparent 40%)`), eliminando a faixa escura inferior que obscurecia a pista e o rodapé.
- **Transição Pilotagem ↔ Leitura Editorial:**
  - Botão `"↓ Ler História & Eras"` (`#exit-3d`): Localizado no HUD rápido de visão, desativa a classe `mode-3d`, destrava o scroll da página e direciona a visualização para a seção de eras (`scrollIntoView` em `#eras`, `scrollY: 1289px`). O HUD 3D não se sobrepõe ao texto editorial.
  - Botão `"↑ Voltar ao Carro 3D"` (`#back-to-car`): Permanece fixo no canto inferior da página editorial após o mundo já ter sido iniciado. O clique reativa o modo 3D instantaneamente, trava novamente o scroll na simulação e reexibe o HUD de pilotagem.
- **Comportamento da Barra de Seções (`#section-dock`):** Permanece com `data-visible="false"` após o usuário ingressar no mundo, evitando duplicidade de controles de rodapé.
- **Evidências:**
  - [02-editorial-modo-leitura.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/02-editorial-modo-leitura.png)

### Item 3: Tecla ESC por Pilha de Prioridade e Tela Cheia
- **Hierarquia da Pilha de Escape (`src/escape-stack.js`):** `modal` > `minigame` > `map` > `panel` > `game`.
- **Validação Prática:**
  - Aberto o modal do integrante 2-D (`#character-dialog`) e, sobre ele, o minigame de piano (`#piano-dialog`) sob tela cheia ativa (`#jogo:fullscreen`).
  - **1º acionamento de `Escape`:** Fechou exclusivamente o minigame de piano (`#piano-dialog.open === false`). O modal do 2-D continuou aberto e a tela cheia permaneceu intacta.
  - **2º acionamento de `Escape`:** Fechou o modal do integrante (`#character-dialog.open === false`). A tela cheia permaneceu ativa na pilotagem 3D.
  - **Teste do Mapa Tático (`M`):** Com o mapa aberto (`#full-map-overlay`), a tecla `Escape` fechou apenas o mapa, preservando o modo 3D.
- **Limite Registrado do Chrome:** Com `navigator.keyboard.lock(['Escape'])` ativo em tela cheia, a API captura e consome o pressionamento simples da tecla para os componentes da aplicação. A saída forçada do modo tela cheia pelo navegador requer o comando nativo do Chrome de manter a tecla pressionada (*"Pressione e segure Esc"*).
- **Evidências:**
  - [03-tela-cheia-piano-aberto.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/03-tela-cheia-piano-aberto.png)

### Item 4: Rotação 360° nos Cards da Editorial e no Modal EXPLORAR
- **Cards da Seção Editorial (`#band-grid`):**
  - Os 4 integrantes (2-D, Murdoc, Noodle e Russel) contam com canvas 3D dedicado (`.spin-canvas`), controles de rotação lateral (`‹` e `›`) e indicação tátil *"360° · Arraste para girar"*.
  - O carregamento do modelo GLB ocorre de forma assíncrona/lazy quando o card entra na viewport (`attachCardSpinners`).
  - **Supressão de Clique por Arraste:** O gesto de arrastar o mouse sobre o canvas (deslocamento > 4px) rotaciona o personagem e cancela a propagação do evento de clique, prevenindo a abertura indesejada da ficha biográfica.
- **Modal EXPLORAR (`#character-dialog`):**
  - O visualizador `#view-canvas` suporta rotação via arraste contínuo e botões incrementais `#view-prev` e `#view-next` (passo de 45°).
- **Evidências:**
  - [04-card-editorial-360-girado.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/04-card-editorial-360-girado.png)
  - [04-modal-explorar-360-girado.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/04-modal-explorar-360-girado.png)

### Item 5: Minigame de Piano do 2-D (`src/piano-game.js` e `src/piano-screen.js`)
- **Acesso:** Botão dedicado `"TOCAR PIANO (MINIGAME RÍTMICO)"` (`#character-piano`) presente na ficha do 2-D.
- **Faixas e BPMs Validados:**
  1. *Tomorrow Comes Today:* **93 BPM**
  2. *Clint Eastwood:* **84 BPM**
  3. *On Melancholy Hill:* **120 BPM**
- **Áudio e Conformidade Jurídica:** Síntese sonora procedural via Web Audio API (notas em acorde maior nas frequências 262, 330, 392 e 523 Hz), sem uso de samples fonográficos comerciais protegidos. Crédito explícito exibido: *"Áudio sintetizado próprio · BPMs de referência · uso acadêmico"*.
- **Jogabilidade e Controles:** Operação por teclas `D`, `F`, `J`, `K` e eventos de toque. Janelas de julgamento ativas (`Perfect`: <= 50 ms, `Good`: <= 120 ms, `Miss`), contador de combo e pontuação com multiplicador limitador.
- **Layout:** O banner `#piano-message` foi reposicionado no topo do palco, evitando cobrir as notas cadentes ou a linha de toque inferior.
- **Evidências:**
  - [05-piano-minigame-execucao.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/05-piano-minigame-execucao.png)

### Item 6: Cena (Mãos no Volante, Câmera do Fliperama e Fauna)
- **Mãos no Volante (1ª Pessoa `V`):** Posicionadas ergonomicamente no aro nas posições 11h e 1h (ângulo 0,75 rad), com sombreamento e normais suavizadas (`smoothNormals`).
- **Gabinete do Fliperama:** Orientado paralelamente ao bordo da pista. Ao ser ativado (`#interact`), a câmera realiza zoom automático focando a tela do fliperama a 3.4 m de distância; ao fechar via `Escape`, a câmera retorna de imediato à vista padrão de condução do Geep.
- **Fauna Urbana (Pombos):**
  - Validação comportamental completa por sequência cronológica de aproximação do veículo:
    1. *Quadro 1 (repouso distante ~28 m):* Pombos em estado `idle`, bicando o solo e alternando rotação da cabeça.
    2. *Quadro 2 (alerta preliminar ~20 m):* Cessam a bicada e orientam a cabeça em direção ao jipe.
    3. *Quadro 3 (gatilho de fuga ~14 m):* Disparo de `flee` com batimento de asas e impulsão vertical.
    4. *Quadro 4 (ascensão aérea ~9 m):* Aves ganhando altitude de 2 a 5 metros acima do solo.
    5. *Quadro 5 (voo em teto ~3 m):* Voo nivelado a 6.5–9 m de altitude e posterior dispersão circular para retorno seguro ao solo.
  - Implementado com apenas 2 `InstancedMesh` para corpos e asas, preservando a taxa de quadros.
- **Evidências:**
  - [06a-maos-volante-1a-pessoa.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06a-maos-volante-1a-pessoa.png)
  - [06b-fliperama-camera-foco-4m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06b-fliperama-camera-foco-4m.png)
  - [06c-pombos-quadro-1.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06c-pombos-quadro-1.png)
  - [06c-pombos-quadro-2.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06c-pombos-quadro-2.png)
  - [06c-pombos-quadro-3.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06c-pombos-quadro-3.png)
  - [06c-pombos-quadro-4.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06c-pombos-quadro-4.png)
  - [06c-pombos-quadro-5.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/06c-pombos-quadro-5.png)

---

## 4. Métricas Consolidadas de Desempenho e Rede

### Taxa de Quadros (FPS Real em Chrome WebGL2)
- **Kong Studios (Ponto de Partida):** **60.2 FPS** *(meta >= 55 FPS)*
- **Bairro dos Murais:** **59.7 FPS** *(meta >= 55 FPS)*
- **Mirante do Moinho:** **59.9 FPS** *(meta >= 55 FPS)*

### Volume de Dados e Auditoria de Rede
- **Método Declarado de Medição:** Interceptação direta das respostas HTTP transmitidas pelo servidor local `server.mjs`, computando a soma exata dos bytes reportados no cabeçalho `Content-Length` de cada URL distinta requisitada durante a sessão de navegação, descartando objetos `blob:` internos da memória do navegador.
- **Carga na Landing Page:** **4.18 MB**
- **Carga Inicial (Landing + Entrada no Modo 3D):** **7.56 MB** *(meta <= 9.3 MB — Margem de 1.74 MB)*
- **Carga Acumulada após rolar até os Cards 360°:** **8.41 MB** *(meta <= 9.3 MB — Margem de 0.89 MB)*
- **Erros HTTP (status >= 400):** **0**
- **Erros em `console.error` ou `window.onerror`:** **0**

### Suíte de Testes e Tipagem Estática
- `npm run check`: **35 módulos inspecionados sem inconformidades**
- `npm test`: **155 de 155 testes aprovados (100% PASS)** em 3.35s

---

## 5. Repositório de Evidências

Todos os artefatos, capturas em alta resolução e telemetria estruturada foram consolidados em:
`E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-22\`

- **Relatório Oficial:** [qa-novas-features-relatorio.md](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/qa-novas-features-relatorio.md)
- **JSON de Telemetria:** [qa-novas-features-results.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/qa-novas-features-results.json)

---

## 6. Conclusão e Veredito

A entrega técnica da Engenharia de 22/11/2026 cumpre todos os critérios de qualidade visual, acessibilidade por teclado, fluidez de animação e restrições de payload. Não foram identificadas regressões funcionais.

**Veredito Oficial: APROVADO**
