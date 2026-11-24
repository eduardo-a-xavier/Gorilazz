# Relatório de QA — Validação Final da Suspensão Recalibrada (Ganho 0,028)
**Data:** 24/11/2026  
**Ambiente:** Google Chrome Real (`headless=False`, 1440x900, aceleração GPU D3D11)  
**URL:** `http://localhost:3000/?perf`  
**Destino de Evidências:** `docs\gestao\evidencias\rodada-maos-suspensao-2026-11-24\`  
**Auditor:** QA Gorilazz (Qualidade e Entrega)  
**Resultado Geral:** **100% APROVADO**

---

## 1. Sumário Executivo

A Engenharia Gorilazz recalibrou o ganho de inclinação lateral (roll) em `src/vehicle-motion.js` de `0.011` para `0.028`. A suíte completa de testes automatizados passou com **218/218 testes verdes**.

A revalidação instrumental em tempo de execução real no Google Chrome registrou **1.666 quadros contínuos** em primeira pessoa (Cockpit), submetendo o Geep ao ciclo completo de manobras de pista (arrancada, frenagem forte, curvas em velocidade máxima à direita e à esquerda, ziguezague em alta frequência e transição de pisos).

Todos os critérios de física de suspensão, estabilidade de direção e desempenho gráfico foram plenamente homologados.

---

## 2. Matriz de Resultados Reais de Telemetria

| Métrica / Critério | Meta da Engenharia | Valor Medido Real | Veredito | Análise Técnica |
|---|:---:|:---:|:---:|---|
| **Roll Dinâmico (Rolagem)** | **2,0° a 4,0°** | **3,9483°** | ✔ **APROVADO** | Subiu de 0,98° para **3,95°**, dentro da faixa ideal e cravado com precisão física abaixo do teto `MAX_BODY_ROLL = Math.PI / 45 = 4,0°`. Inclinação lateral realista e imersiva no cockpit. |
| **Pitch Dinâmico (Mergulho)** | **$\le$ 3,0°** | **2,7502°** | ✔ **APROVADO** | Mergulho suave na frenagem estabilizado abaixo do teto de 3,0° (`Math.PI / 60`), mantendo boa visibilidade de pista. |
| **RMS Vertical do Chassi** | **> 0 e $\le$ 0,03 m** | **0,0076 m** (7,6 mm) | ✔ **APROVADO** | Ondulação de pista realista sem vibração excessiva (pico máximo registrado de 0,0288 m, dentro do teto de 0,03 m). |
| **Oscilações de Estabilização** | **$\le$ 1 oscilação** | **0 oscilações** | ✔ **APROVADO** | Mola criticamente amortecida dissipa a inércia suavemente sem repiques elásticos após a parada. |
| **Penetração no Solo (Afundamento)** | **$\ge$ 0,0 m** | **0,0000 m** | ✔ **APROVADO** | Chassi não afunda negativamente no asfalto em frenagens bruscas; fixação $y \ge 0$ confirmada. |
| **Estabilidade das Mãos (Salto/Quadro)**| **$\le$ 1,0°** | **0,7500°** | ✔ **APROVADO** | Limitador angular `MAX_WHEEL_STEP = Math.PI / 240` ativo; esterçamento fluido e contínuo. |
| **FPS Cockpit (1ª Pessoa)** | **$\ge$ 55 FPS** | **60,1 FPS** | ✔ **APROVADO** | Condução fluida e vsync estável sem quedas durante as manobras. |
| **FPS Condução 3D (Praça)** | **$\ge$ 55 FPS** | **59,9 FPS** | ✔ **APROVADO** | Taxa de quadros perfeitamente sustentada em 60 FPS com a cena completa renderizada. |
| **Erros de Console e HTTP** | **0 erros** | **0 erros** | ✔ **APROVADO** | Execução 100% limpa, todos os assets e módulos ES carregados com 200 OK. |
| **Orçamento de Carga Inicial** | **$\le$ 9,3 MB** | **8,96 MB** | ✔ **APROVADO** | Transferência de rede inicial dentro do limite. |

---

## 3. Investigação e Diagnóstico do FPS da Vitrine

A Engenharia solicitou esclarecimento sobre a taxa de quadros da vitrine inicial (antes de entrar no mundo 3D). A medição em duas etapas revelou o seguinte comportamento:

1. **Carga Fria (0 a 2s pós networkidle):**  
   - **Taxa Medida:** **0,7 a 15,4 FPS**.  
   - **Condições:** A thread principal do navegador está intensamente ocupada pelo parsing dos módulos ES6, decodificação assíncrona das geometrias GLB (`assets/models/driver-pilot-v3.glb`), upload de texturas WebP e compilação de shaders Three.js pelo driver WebGL / D3D11.
2. **Vitrine Estabilizada (pós compilação de shaders / 3s+):**  
   - **Taxa Medida:** **60,4 FPS cravados**.  
   - **Condições:** Assim que a carga assíncrona é concluída na GPU, a vitrine rotaciona suavemente a 60 FPS sem qualquer engasgo.
3. **Conclusão:** Não há gargalo contínuo na vitrine. A oscilação momentânea decorre estritamente da compilação de pipeline gráfica na inicialização a frio, normalizando de imediato para 60 FPS.

---

## 4. Evidências Anexadas

- **Sumário JSON de Métricas Aprovadas:**  
  [telemetria_suspensao_recalibrada.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-maos-suspensao-2026-11-24/telemetria_suspensao_recalibrada.json)
- **Base Completa de Telemetria (1.666 quadros):**  
  [telemetria_suspensao_completa.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-maos-suspensao-2026-11-24/telemetria_suspensao_completa.json)
- **Capturas no Cockpit (Curvas com Roll Calibrado):**  
  - [cockpit-curva-direita-roll-novo.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-maos-suspensao-2026-11-24/cockpit-curva-direita-roll-novo.png)
  - [cockpit-curva-esquerda-roll-novo.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-maos-suspensao-2026-11-24/cockpit-curva-esquerda-roll-novo.png)
  - [cockpit-repouso.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/rodada-maos-suspensao-2026-11-24/cockpit-repouso.png)

---

## 5. Parecer Final de QA

A alteração do ganho de roll para `0.028` corrigiu com exatidão a deficiência da rodada anterior, atingindo **3,95°** em curva sem violar o limite máximo de 4,0°. Todos os critérios de suspensão, volante, mãos e performance estão **HOMOLOGADOS**.
