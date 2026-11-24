# Relatório de Auditoria QA — Rodada: Central de Descobertas + Minimapa + Ciclo 3D + Efeitos
**Projeto:** Gorilazz A3 (`E:\Gorilazz-Relatorio`)  
**Data da Auditoria:** 23 de Novembro de 2026  
**Auditor Responsável:** Agente Especialista de QA e Homologação  
**Ambiente de Execução:** Google Chrome nativo (`channel: "chrome"`), WebGL2 ANGLE D3D11, `http://localhost:3000/?perf`  
**Pasta de Evidências:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-23\`  
**Arquivo de Telemetria:** `qa-central-descobertas-telemetria.json`

---

## 1. Tabela Executiva de Veredito

| Item de Escopo | Status | Veredito | Resumo das Medições & Validações |
|---|---|---|---|
| **1. Ciclo Sair/Voltar do 3D (20x)** | **APROVADO** | PASS | 20 repetições estritas em cenários críticos (normal, modal integrante, fliperama, piano, passeio guiado, link âncora e tela cheia). Carro e WASD responderam em **20/20** ciclos (`speed: ~1.88 m/s`); memória controlada (geometrias: 336 → 409 estável; texturas: 125 → 132); scroll devidamente travado no 3D e liberado fora; 0 diálogos órfãos; FPS sustentado. |
| **2. Minimapa com Arte & Estado** | **APROVADO** | PASS | Fundo pré-renderizado via canvas (`minimap-art.js`, grade urbana a cada 6 unidades, quarteirões coloridos, avenidas com iluminação destacada e vinheta); marcadores com `✓` verde-ciano nos descobertos e pulso âmbar nos pendentes; cone de visão suave; legibilidade preservada em 320x568 sem impacto de FPS. |
| **3. Central de Descobertas (Drawer)** | **APROVADO** | PASS | Abre por clique/teclado no contador `DESCOBERTAS`, menu `[H]` e mapa `M`; busca sem acento e case-insensitive validada em 5 termos canônicos; filtros Todas (9), Eras (7), Personagens (3) e Bastidores (7); botão "Ir até lá" define rota; ESC em pilha respeita hierarquia (fecha drawer sobre menu sem fechar menu); títulos legíveis nos 4 viewports (`letter-spacing: 0.6px`, `word-spacing: 4.2px`). Conteúdo 100% aderente a `discoveries-lore.js` e `descobertas-fichas.md` (9 fichas, 0 referências a 2026, 0 Wikipédia, links válidos). |
| **4. Micro-efeitos (Partículas e Som)** | **APROVADO** | PASS | Três zonas ativas via `THREE.Points` (58 partículas redondas com gradiente): poeira dourada no início (24), esporos verdes no moinho (18), faíscas ciano na Av. Saturnz Barz (16); efeito leve e flutuante sem perda de FPS. Som de descoberta suave (880 Hz / 1320 Hz) silenciável via menu de controles, com atenuação de volume quando o rádio toca. |
| **5. Regressões e Métricas Finais** | **APROVADO** | PASS | HUD [H] enxuto preservado; passeio guiado sem saídas do asfalto; minigames operacionais; modelos v5 (piloto) e v3 (banda e guitarra) íntegros; FPS médio em **59,8 FPS** nos 3 pontos; **0 erros** de console/HTTP/página; peso inicial transferido de **2,09 MB** (limite contratual de 9,30 MB); **`npm run check` OK** e **`npm test` 206/206 PASS**. |

---

## 2. Detalhamento Técnico das Medições

### 2.1. Item 1: Ciclo de 20 Repetições Sair/Voltar do 3D
A estabilidade do ciclo foi auditada com variação de cenários a cada execução:
- **Cenários testados:** Normal (botão `exit-3d` / `back-to-car`), Modal de integrante aberto, Fliperama Kong Arcade aberto, Piano do 2-D aberto, Durante passeio guiado, Link âncora externo (`#eras`) e modo Tela Cheia.
- **Resultado:**
  - Carro e controles WASD respondem após o retorno: **20 de 20 ciclos (100%)**.
  - Diálogos pendentes ao sair: Todos fechados automaticamente por `closeOpenDialogs()` (0 modais bloqueando o loop de renderização).
  - Comportamento de rolagem: `lockScroll(true)` trava o scroll no topo ao entrar no 3D; ao sair, o scroll é restaurado suavemente para o destino.
  - Memória do WebGL: Inicialmente 336 geometrias e 125 texturas, estabilizando em 409 geometrias e 132 texturas a partir do ciclo 10 (sem vazamento cumulativo de buffers ou materiais).
  - Taxa de quadros pós-ciclos: **60,5 FPS**.

### 2.2. Item 2: Minimapa Aprimorado
- **Renderização e Aparência:**
  - Canvas de fundo único (`data:image/png;base64...` de 52 KB) com grade urbana, avenidas com traço contínuo iluminado e ruas secundárias estilizadas.
  - O elemento SVG manipula apenas os nós dinâmicos (cone de visão e marcadores de destino).
  - Marcadores pendentes exibem pulso suave em tom âmbar/rosa; marcadores descobertos passam a apresentar o glifo `✓` em tom verde-ciano sem trepidação.
- **Responsividade (320x568):**
  - O minimapa posiciona-se em `top: -2px; left: 200px` com `width: 108px; height: 159.5px`, perfeitamente legível sem sobreposição ao velocímetro ou à barra inferior de instrumentos.

### 2.3. Item 3: Central de Descobertas & Auditoria Editorial
- **Mecanismos de Abertura e Foco:**
  - O contador `#stops-counter` atua com atributos de acessibilidade (`tabindex="0"`, `role="button"`, `aria-haspopup="dialog"`), abrindo o drawer tanto pelo clique quanto pelas teclas `Enter` e `Espaço`.
  - Abertura também verificada via botão `#open-discoveries` dentro do menu `[H]` e pelo botão `Central de Descobertas` dentro do mapa completo `M`.
- **Busca por Palavra-Chave (sem acento / case-insensitive):**
  - `"Kong Studios"`: 1 resultado (`Kong Studios, o QG interativo`).
  - `"Jamie Hewlett"`: 4 resultados (`O surgimento frente à MTV`, `Kong Studios`, `2-D e a história dos olhos pretos`, `O retorno de 2017 e Spirit House`).
  - `"Cyborg"`: 1 resultado (`Plastic Beach e a Cyborg Noodle`).
  - `"Grammy"`: 1 resultado (`Demon Days, o moinho e o Grammy`).
  - `"musica"` (sem acento): 3 resultados (`O surgimento frente à MTV`, `O Geep e a gravação de 19-2000`, `Song Machine: música em episódios`).
- **Filtros por Categoria:**
  - `Todas`: 9 fichas | `Eras`: 7 fichas | `Personagens`: 3 fichas | `Bastidores`: 7 fichas.
- **Navegação "Ir até lá":**
  - Fichas bloqueadas exibem pista e o botão `.discovery-go` ("Ir até lá"), que fecha o drawer e define o jipe a caminho da coordenada da parada correspondente.
- **Pilha de Camadas ESC:**
  1. Menu `[H]` aberto + Drawer de descobertas aberto por cima.
  2. 1º ESC: Fecha exclusivamente o drawer (`#discoveries-drawer`), mantendo o menu `#journey` aberto.
  3. 2º ESC: Fecha o menu `#journey`, retornando o foco ao mundo 3D com pilotagem intacta.
- **Conformidade Editorial:**
  - Exatamente **9 fichas** mapeadas 1:1 com os 9 pontos da cidade.
  - **Zero referências a 2026** no corpo das fichas (datas de 2026 restritas estritamente ao carimbo de acesso bibliográfico).
  - **Zero fontes da Wikipédia**; todas as referências apontam para *The Guardian*, *NME*, *Grammy.com* e *The Fader*.
  - Distinção nítida e explícita entre **fatos reais de produção** e **ficção da banda (lore)**.

### 2.4. Item 4: Micro-efeitos (Partículas e Áudio)
- **Partículas Ambientais:**
  - Instância única de `THREE.Points` (`name: "ambient-particles"`) com 58 vértices e mapa de cores vetorial por tipo.
  - Partículas geradas com sprites circulares suaves (sem aspecto quadriculado).
  - Comportamento testado: flutuação sutil senoidal sem causar oscilações no frame time.
- **Áudio de Descoberta:**
  - Sintetizador Web Audio API baseado em dois tons senoidais puros (880 Hz e 1320 Hz) com duração de 0,40 s.
  - Volume ajustado dinamicamente: ganho reduzido em 50% quando o rádio Kong FM está em reprodução, evitando concorrência sonora.
  - Opção de alternância no menu `[H]` ("Som de descoberta: ligado/desligado") persistida no `localStorage`.

### 2.5. Item 5: Regressões, Peso e Performance
- **Frame Rate nos 3 Pontos de Referência:**
  - *Mural 1 (Beginning):* **59,8 FPS** (frame time ~16,7 ms).
  - *Palco Central:* **59,8 FPS** (frame time ~16,7 ms).
  - *Centro da Cidade:* **59,8 FPS** (frame time ~16,7 ms).
- **Peso de Rede Transferido:**
  - Transferência antes do 3D: **2,09 MB** (teto máximo de 9,30 MB).
  - Transferência total com todos os assets e modelos 3D: **11,23 MB**.
- **Erros de Execução:** 0 erros de script (pageerror), 0 requisições HTTP >= 400, 0 logs de erro no console.
- **Testes Automatizados:**
  - `npm run check`: Sucesso em todos os módulos (incluindo os 7 módulos recém-incorporados).
  - `npm test`: **206 testes executados / 206 aprovados (100% PASS)**.

---

## 3. Conclusão da Auditoria

A rodada **"Central de Descobertas + minimapa + ciclo 3D + efeitos"** foi totalmente validada e cumpre com excelência todos os requisitos funcionais, de performance e editoriais estipulados.

**Veredito Final:** **HOMOLOGADO / APROVADO**.
