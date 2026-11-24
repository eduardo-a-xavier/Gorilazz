# Relatório Técnico de QA: Homologação do Patch Pré-Push

**Data:** 22/11/2026  
**Ambiente de Teste:** Google Chrome nativo (Canal Estável), WebGL2 ANGLE D3D11, Windows 11  
**Servidor:** `http://localhost:3000/?perf` (Node.js `server.mjs`)  
**Escopo:** Auditoria independente do Patch Pré-Push da Engenharia  
**Resultado Geral:** **APROVADO (100% de conformidade técnica e integridade de regressões)**  

---

## 1. Tabela Consolidada de Homologação

| Item | Componente / Requisito | Critérios de Aceite | Resultado Medido no Chrome Real | Veredito |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Cards da Banda & 360°** | Exatamente 1 modelo visível por card (fallback `<img>` oculto quando GLB carrega; visível em falha), modelo centralizado preenchendo o card, rotação orbital 360° funcional. | A regra `img[hidden] { display: none !important; }` eliminou a duplicidade; os 4 cards exibem apenas o canvas 3D (267x228 px). Câmera aproximada (6,9 m / foco 1,6 m) preenche o enquadramento. Fallback testado com sucesso. Arraste 360° íntegro. | **APROVADO** |
| **2** | **Estabilidade, Frame Time & Trajeto** | Frame time p95/p99 em passeio e condução (delta limitado a 50 ms via `clampFrameDelta`), 0 saídas de pista, carro sem deslizamento lateral visível (heading vs velocidade). | Delta limitado testado (`tests/guided-tour.test.mjs`). Telemetria de frame time: p50 16,7 ms, p95 17,0 ms, p99 17,2 ms (maxDt 17,3 ms). Projeção perpendicular do vetor de velocidade sobre o heading registrou deslizamento de `1,38e-17 m` (0 deslizamento lateral, física com grip estrito). 0 amostras fora do asfalto. | **APROVADO** |
| **3** | **HUD & Responsividade** | Remoção de faixa cinza com blur (`backdrop-filter: none`), controles recolhidos no botão `[J] Controles` (sem conflito com `[H]` que abre ajuda), toasts em 2,5 s, pílula sem corte/sobreposição em 4 viewports (1440x900, 1346x680, 390x844, 320x568), ESC em pilha. | Rodapé e docks sólidos sem blur. Tecla `J` abre e fecha o painel `#journey`; tecla `H` abre `#onboarding-dialog` e `Escape` fecha ordenadamente. `TOAST_MS = 2500` validado no código e testes. Nos 4 viewports testados, folga vertical e horizontal garantida sem sobreposição com o contador. | **APROVADO** |
| **4** | **Cockpit, Mãos & Kong FM** | Mãos avançadas no aro do volante (~4 cm), visor 3D exibindo o mesmo título da Kong FM (sincronizado na troca), Teclado do 2-D pausa rádio ao Começar e devolve ao sair só se estava tocando. | Mãos posicionadas mais à frente com offset de 0,06 m na normal do volante. Visor integrado lendo `radio.read()`, refletindo "Concreto" e atualizando para "Maré de plástico" via `]`. Módulo `radio-duck.js` gerencia pausa e restauração sem religar indevidamente. | **APROVADO** |
| **5** | **Placas e Letreiros** | Molduras escuras e tipografia Anton legíveis em alto contraste (Rua Song Machine, portais, totens), letreiros SEM SINAL / FECHADO com brilho de neon ajustado. | Placa "RUA SONG MACHINE" legível a distância com moldura metálica escura e fundo preto de alto contraste com anisotropia 8. Letreiros com cores `CLOSED_SIGN_NEON` aplicadas. | **APROVADO** |
| **6** | **Regressões e Métricas Finais** | Scroll lock, minigames, descobertas 0 a 9, mapa `M` com `✓`, piloto v4; FPS >= 55 nos 3 pontos, 0 erros HTTP/console, peso <= 9,3 MB, `npm run check` e `npm test` (180/180 PASS). | Scroll travado no 3D. Mapa `M` com paradas `✓` abre e fecha com ESC. Piloto v4 em 1ª pessoa íntegro. FPS real de 59,8 a 59,9 nos 3 pontos. 0 erros de console, 0 erros HTTP. Peso inicial de 4,34 MB (teto 9,3 MB). 180/180 testes unitários e de integração PASS (100%). | **APROVADO** |

---

## 2. Medições e Telemetria Independente

### A. Taxa de Quadros (FPS Real em Chrome WebGL2 ANGLE D3D11 - rAF 3s)
- **Mural 1 (Kong Studios):** **59,8 FPS** *(meta >= 55 FPS)*
- **Palco dos Integrantes:** **59,9 FPS** *(meta >= 55 FPS)*
- **Centro da Pista:** **59,9 FPS** *(meta >= 55 FPS)*

### B. Frame Time e Suavidade
- `p50`: **16,7 ms**
- `p95`: **17,0 ms**
- `p99`: **17,2 ms**
- Quadro máximo (`maxDt`): **17,3 ms** (0 quadros > 33,3 ms durante a condução estabilizada)

### C. Deslizamento Lateral em Curva (Heading x Velocidade)
- **Deslizamento lateral máximo medido:** `1,38 × 10⁻¹⁷ m` (rigorosamente zero, confirmando ausência de derrapagem artificial ou perda de grip).

### D. HUD e Responsividade dos Viewports (Caixas delimitadoras em px)

| Viewport | Pílula do Passeio (top–bottom / left–right) | Contador Descobertas (top–bottom / left–right) | Sobreposição |
| :---: | :---: | :---: | :---: |
| **1440x900** | 371,7–528,3 / 1111,2–1411,2 | 86,8–98,8 / 600,0–727,8 | **Nenhuma (Livre)** |
| **1346x680** | 261,7–418,3 / 1019,1–1319,1 | 84,9–96,9 / 553,0–680,8 | **Nenhuma (Livre)** |
| **390x844** | 483,4–640,0 / 105,0–378,0 | 56,0–67,0 / 120,0–237,0 | **Nenhuma (Livre)** |
| **320x568** | 207,4–364,0 / 84,0–308,0 | 56,0–67,0 / 85,0–202,0 | **Nenhuma (Livre)** |

### E. Suíte de Testes Automatizados
- `npm run check`: **40 módulos validados com sucesso (`node --check`)**
- `npm test`: **180 de 180 testes PASS (100% aprovados em 4.16s)**
  - Testes adicionais validados: `clampFrameDelta` (limitação a 50 ms), `TOAST_MS` (2500 ms), `createRadioDuck` (ducking no piano), placas padronizadas e letreiros fechados.

---

## 3. Evidências Visuais Geradas

- **Cards da Banda (1 boneco por card):** [01-qa-cards-banda-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/01-qa-cards-banda-1440x900.png)
- **HUD sem Blur (1440x900):** [03-qa-hud-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-qa-hud-1440x900.png)
- **HUD sem Blur (1346x680):** [03-qa-hud-1346x680.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-qa-hud-1346x680.png)
- **HUD sem Blur (390x844):** [03-qa-hud-390x844.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-qa-hud-390x844.png)
- **HUD sem Blur (320x568):** [03-qa-hud-320x568.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-qa-hud-320x568.png)
- **Cockpit e Visor Kong FM:** [04-qa-cockpit-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/04-qa-cockpit-1440x900.png)
- **Cockpit Mãos no Aro (+4cm):** [04-qa-cockpit-maos-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/04-qa-cockpit-maos-1440x900.png)
- **Placa Rua Song Machine (Moldura Anton):** [05-qa-placa-song-machine-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/05-qa-placa-song-machine-1440x900.png)
- **Telemetria JSON Bruta:** [qa-patch-pre-push-telemetria.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/qa-patch-pre-push-telemetria.json)

---

## 4. Conclusão e Veredito Final

O **PATCH PRÉ-PUSH** da Engenharia cumpre com total fidelidade os requisitos de estabilidade, usabilidade e qualidade visual. Todas as regressões foram verificadas e o código está pronto para push pelo autor (Eduardo).

*(Nenhum arquivo de código foi alterado e nenhuma operação git foi efetuada).*
