# Relatório de QA — Validação de Cockpit Piloto v5, Rádio LISTA, Drift e Helicópteros
**Data:** 24/11/2026  
**Ambiente:** Google Chrome Real (`headless=False`, 1440x900)  
**URL:** `http://localhost:3000/?perf`  
**Destino de Evidências:** `docs\gestao\evidencias\rodada-cockpit-v5-drift-2026-11-24\`  
**Auditor:** QA Gorilazz (Qualidade e Entrega)  
**Status Geral:** **100% HOMOLOGADO**

---

## 1. Resumo Executivo

A Engenharia Gorilazz realizou um lote expressivo de aprimoramentos no Geep e no mundo 3D sem quebra de compatibilidade (223/223 testes automatizados verdes):
1. **Cockpit Piloto v5:** Introdução de velocímetro analógico com mostrador circular clássico e ponteiro vermelho móvel, velocímetro digital com indicador de marcha, rádio retrô em acabamento amadeirado/dourado e mãos articuladas anatômicas sobre o volante.
2. **Rádio LISTA em 3D e no Widget 2D:** O botão do widget da Kong FM foi renomeado de `☰` para `LISTA`, sincronizado com a tecla `playlist` do rádio físico 3D na cabine.
3. **Mecânica de Drift com a Tecla Espaço:** Permite derrapagem controlada em asfalto sob alta velocidade ($> 8\text{ m/s}$) e esterçamento, com geração de fumaça cinza nas rodas traseiras e proteção de bloqueio quando modais, minigames ou passeio guiado estão ativos.
4. **Cinemática dos Dois Helicópteros de El Mañana:** Transição para relógio temporal contínuo (`helicopterTime`) orbitando `{x: 80, y: 31, z: -163}` em 10 segundos, tanto com quanto sem `prefers-reduced-motion`.

---

## 2. Matriz de Resultados Reais

| Subsistema / Recurso | Critério de Aceite | Resultado Medido Real | Veredito | Análise Técnica |
|---|:---:|:---:|:---:|---|
| **Velocímetro Analógico** | Mostrador circular com ponteiro móvel | **Deflexão de 153,0°** | ✔ **APROVADO** | Ponteiro vermelho rotaciona com precisão de 0 a 68 km/h sobre a escala de 0 a 120 km/h. |
| **Velocímetro Digital** | Velocidade e marcha (`PARADO`/`ESTRADA`/`RÉ`)| **68 km/h · ESTRADA** | ✔ **APROVADO** | Display digital verde responde em sincronia com o velocímetro analógico e HUD. |
| **Rádio Retrô no Cockpit** | Gabinete estilizado e teclas funcionais | **Gabinete amadeirado OK** | ✔ **APROVADO** | Tons amadeirados e dourados (`#a89c7d`/`#4b3023`) com teclas de ação (`play`, `prev`, `next`, `playlist`). |
| **Rádio Widget (HUD)** | Botão `LISTA` funcional | **Texto `LISTA` / Menu OK** | ✔ **APROVADO** | Botão renomeado para `LISTA` abre o menu de seleção de faixas da Kong FM. |
| **Drift com Espaço em Pista**| Ativação em velocidade com esterçamento | **Ativo: `slip` = 0,2004 rad** | ✔ **APROVADO** | Derrapagem lateral de 11,5° atingida a 22 m/s em asfalto; desativa automaticamente ao tocar a terra. |
| **Espaço com Modal Aberto** | Não acionar drift nem movimentar o carro | **Drift bloqueado (0 m/s)** | ✔ **APROVADO** | Diálogos modais (`#character-dialog`) retêm o foco sem interferência no veículo. |
| **Espaço no Minigame** | Não acionar drift durante arcade/piano | **Drift bloqueado** | ✔ **APROVADO** | Jogabilidade do fliperama isolada dos atalhos do mundo 3D. |
| **Espaço no Passeio Guiado** | Drift desabilitado durante condução autônoma| **Drift bloqueado** | ✔ **APROVADO** | `driftEnabled: () => !touring` preserva a estabilidade do roteiro de 9 paradas. |
| **Helicópteros (Modo Normal)** | 2 helicópteros em órbita por 10 s | **117,20 m percorridos cada** | ✔ **APROVADO** | Ambos orbitam continuamente em torno de `{80, 31, -163}` com inclinação lateral `rotZ = 0,20 rad`. |
| **Helicópteros (Modo Reduzido)**| Órbita preservada com inclinação zerada | **119,32 m · `rotZ = 0,00 rad`** | ✔ **APROVADO** | Respeita acessibilidade vestibular (`reduced-motion`): translação orbital ativa sem inclinação agressiva. |
| **FPS Cockpit / Praça** | $\ge 55$ FPS contínuos | **60,2 FPS / 59,9 FPS** | ✔ **APROVADO** | Desempenho sólido e sem micro-travamentos em 1440x900. |
| **Erros de Console e Rede** | 0 erros | **0 erros** | ✔ **APROVADO** | Zero erros de carregamento, Three.js ou JavaScript. |
| **Peso Inicial de Rede** | $\le 9,3$ MB | **8,95 MB** | ✔ **APROVADO** | Orçamento de payload respeitado. |

---

## 3. Cinemática dos Helicópteros de El Mañana (Amostragem de 10 s)

- **Centro da Órbita:** $X = 80$, $Y = 31$, $Z = -163$ (Moinho Flutuante).
- **Deslocamento Médio em 10 s:** $\approx 117,2\text{ m}$ por aeronave (velocidade orbital de $0,32\text{ rad/s}$ correspondendo a $\Delta \theta = 3,20\text{ rad} \approx 183^\circ$ de meia-volta completa).
- **Diferenciação por Preferência de Movimento:**
  - **Normal:** Inclinação lateral dinâmica nas curvas (`rotZ = 0.2 rad`) simulando sustentação de voo.
  - **Reduzido (`reduce`):** Inclinação lateral desativada (`rotZ = 0.0 rad`), garantindo conformidade com a WCAG 2.1 e acessibilidade a usuários sensíveis a movimento.

---

## 4. Itens Não Testados (Transparência de QA)

Para total transparência e rigor metodológico, registram-se os seguintes itens que não integraram este protocolo de teste:
1. **Upload de Áudio Customizado:** Não foi realizado upload de arquivos `.mp3`/`.wav` pelo usuário no seletor de arquivos do rádio (`#radio-files`).
2. **Fechamento de Ciclo de 360° do Helicóptero:** Foi validada a janela contínua de 10,0 s conforme solicitação da Engenharia, sem aguardar o período completo de órbita de $T \approx 19,63\text{ s}$.
3. **Dispositivos Móveis com Sensores de Orientação:** A validação foi realizada em desktop sob viewport de 1440x900 com teclado/mouse.

---

## 5. Evidências Anexadas

- **Base de Dados JSON de Telemetria:**  
  [telemetria_cockpit_v5_drift.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/telemetria_cockpit_v5_drift.json)
- **Capturas Visuais em 1440x900:**
  - [1440x900-cockpit-v5-repouso.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-cockpit-v5-repouso.png)
  - [1440x900-cockpit-v5-em-velocidade.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-cockpit-v5-em-velocidade.png)
  - [1440x900-radio-lista-widget.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-radio-lista-widget.png)
  - [1440x900-drift-ativo.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-drift-ativo.png)
  - [1440x900-helicopteros-normal.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-helicopteros-normal.png)
  - [1440x900-helicopteros-reduced.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-cockpit-v5-drift-2026-11-24/1440x900-helicopteros-reduced.png)
