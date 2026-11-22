# Relatório de Auditoria Técnica de QA — Passeio Guiado e Descobertas (9 Paradas)

**Data da Auditoria:** 22/11/2026  
**Ambiente de Teste:** Google Chrome real (Canal estável), WebGL2 ANGLE (Direct3D11), Resolução base 1440x900  
**Executado por:** Agente de QA Independente (Antigravity QA)  
**Projeto:** Gorilazz 3D (`E:\Gorilazz-Relatorio`)  
**Status Geral:** **APROVADO (100% dos critérios de aceite atendidos)**

---

## 1. Resumo Executivo

A frente **Passeio Guiado + Descobertas X/9**, implementada e ajustada pela Engenharia em 22/11/2026, foi integralmente auditada em Google Chrome real. O teste executou uma corrida autônoma completa de ponta a ponta pelas 9 paradas, coletando 616 amostras de telemetria em alta frequência (250 ms), além de testes de estresse em partidas alternativas, retomada de direção, controle de modais, persistência de dados, tipografia e métricas de desempenho.

Todos os 6 critérios de aceite foram validados com **zero inconformidades**:
- **0 amostras fora do asfalto** (`roadGap <= 1.5 m`).
- **0 amostras de marcha à ré** (`speed < -0.05 m/s`) em todo o percurso.
- **9 de 9 paradas visitadas** com permanência cravada de ~4,5 s e exibição impecável do card lateral.
- **60,3 FPS estáveis** em rAF real durante a condução 3D.
- **0 erros de console** e **0 falhas HTTP (>= 400)**.
- **165/165 testes unitários aprovados** (`npm test`).

---

## 2. Matriz de Aceite e Verificação Técnica

| Item | Critério de Aceite | Resultado Medido | Status |
| :--- | :--- | :--- | :---: |
| **1** | **Passeio Guiado Hero & Paradas**<br>Início por `#start-guided`; 9 paradas; desaceleração suave (zona 40 m); parada de ~4,5 s; card com título/ano/resumo; troca de track da lista editorial. | 9/9 paradas percorridas em **165,17 s**; desaceleração suave via `speedCap`; pausas medidas entre **4,49 s e 4,53 s**; card lateral ativo em todas as paradas; faixas sincronizadas. | **APROVADO** |
| **2** | **Trajeto e Alinhamento**<br>0 amostras fora do asfalto (`gap <= 1.5`); 0 marchas à ré; sem colisões; 3 pontos de partida testados (Hero, Murais, Moinho). | **616 amostras**: 0 fora do asfalto, **0 marchas à ré**; alinhamento parado a 1,6 rad/s para mira >= 8 m; saídas limpas em Kong Studios, Murais e Moinho. | **APROVADO** |
| **3** | **Assumir Volante & Pausa**<br>WASD/setas assumem volante sem tranco; barra com *"Modo Passeio Guiado · Pressione WASD para assumir o volante"*; pausar/retomar; pausa por modais, fliperama, minigame e ESC. | Tecla `W` encerra passeio mantendo velocidade sem corte brusco; barra inferior funcional; botão alterna *"⏸ Pausar"* e *"▶ Retomar"*; modais de integrante, arcade e ESC pausam o Geep. | **APROVADO** |
| **4** | **Contador, Mapa e Persistência**<br>Contador *"DESCOBERTAS: X / 9"* com barra superior; persiste após reload; marcas ✓ no mapa `M`; toast *"Universo Gorillaz 100% Explorado"* em 9/9; `localStorage.clear()` zera; convive com diário X/5. | Barra e contador atualizados para 9/9; chave `gorilazz.stops.v1` íntegra; mapa `M` exibiu 9/9 marcas `✓`; toast disparado sem travar o jogo; reload manteve 9/9; clear zerou para 0/9; sem conflito com o diário. | **APROVADO** |
| **5** | **Tipografia dos Títulos**<br>Títulos de cards e HUD sem palavras coladas (*"A explosão"*, *"A reinvenção"*) em `h1`–`h4` e `.tour-card-title`. | `word-spacing: 2.52px` (`0.14em`) e `letter-spacing: 0.18px` (`0.01em`) no card; `h1`–`h4` com `word-spacing` de `1.54px` a `11.088px` neutralizando o `-2px` global; espaçamento visual perfeito. | **APROVADO** |
| **6** | **Regressões e Métricas**<br>4 viewports (`1440x900`, `1346x680`, `390x844`, `320x568`); FPS >= 55; 0 erros HTTP/console; peso inicial <= 9,3 MB; `npm run check` e `npm test`. | 4 viewports sem quebra/overflow; **60,3 FPS**; 0 erros de console; 0 erros HTTP; peso inicial **7,54 MB** (teto 9,3 MB); 40 módulos OK; **165/165 testes PASS**. | **APROVADO** |

---

## 3. Cronograma das 9 Paradas da Corrida Completa

A corrida foi iniciada via clique no botão da Hero `#start-guided` em `(x: 0, z: 0)`:

| # | Parada | Categoria | Timestamp (s) | Pausa Medida (s) | Faixa Musical (Track) |
|---|---|---|:---:|:---:|---|
| **1** | A explosão | Portal de Era (Ato 1) | 3,97 s | 4,50 s | Clint Eastwood (0) |
| **2** | Duas mentes, um universo | História (O COMEÇO / 1998) | 16,77 s | 4,49 s | Clint Eastwood (0) |
| **3** | A reinvenção | Portal de Era (Ato 4) | 38,51 s | 4,50 s | Trilha Era (7) |
| **4** | Quatro rostos. Muitas histórias. | História (BAIRRO DOS MURAIS) | 54,11 s | 4,53 s | Feel Good Inc. (1) |
| **5** | Um som sem fronteiras | História (FREQUÊNCIA LIVRE) | 73,19 s | 4,49 s | DARE (3) |
| **6** | Quando o desenho encontra o palco | História (PÁTIO DE ENSAIO) | 91,19 s | 4,52 s | Dirty Harry (4) |
| **7** | A briga e o hiato | Portal de Era (Ato 3) | 121,10 s | 4,49 s | Trilha Era (6) |
| **8** | A paisagem de Demon Days | História (MIRANTE / 2005) | 138,55 s | 4,49 s | Kids with Guns (2) |
| **9** | O auge ambicioso | Portal de Era (Ato 2) | 158,66 s | — | Trilha Era (4) |

**Tempo Total do Passeio:** **165,17 segundos** (dentro do intervalo previsto de 164 s a 175 s). Ao término da 9ª parada, o estado `guided` foi finalizado com sucesso e a mensagem de conclusão foi anunciada.

---

## 4. Análise do Trajeto, Saídas de Pista e Eliminação da Marcha à Ré

- **Telemetria de Condução:** Foram amostradas 616 leituras de velocidade, ângulo de direção e posição durante a corrida guiada. A velocidade em marcha ré medida foi exatamente **0 amostras com speed < -0.05 m/s**.
- **Solução do Giro Parado:** A correção introduzida em `src/app.js` (`legTo`), que faz o veículo girar parado no asfalto a 1,6 rad/s até alinhar com o primeiro ponto do trajeto a `>= 8 m`, eliminou por completo as 26 amostras anteriores de ré que jogavam o veículo para a calçada.
- **Comportamento em Partidas Alternativas:**
  1. *Kong Studios (Hero) `(0, 0)`:* Alinhamento suave em `heading: -1.954 rad`, 0 ré.
  2. *Bairro dos Murais `(-95, -150)`:* Alinhamento em `heading: -2.205 rad`, partida direta no asfalto.
  3. *Mirante do Moinho `(80, -150)`:* Alinhamento em `heading: 2.265 rad`, partida direta no asfalto.

---

## 5. Auditoria de Tipografia e Legibilidade

- **Problema Anterior:** `letter-spacing: -2px` global em títulos reduzia o espaço entre palavras, gerando colisões visuais ("Aexplosão", "Areinvenção").
- **Medição Computada:**
  - Card lateral `#guided-title`: `word-spacing: 2.52px` (`0.14em`), `letter-spacing: 0.18px` (`0.01em`).
  - Títulos globais `h1`: `word-spacing: 11.088px` | `h2`: `9.24px` | `h3`: `2.1px` | `h4`: `1.54px`.
- **Inspeção Visual:** Todos os textos do card e HUD apresentam separação nítida e legível em todas as resoluções.

---

## 6. Arquivos e Evidências Salvas

Todas as evidências da presente auditoria foram persistidas no diretório:
`E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-22\`

- **Telemetria Consolidada:** [qa-passeio-guiado-telemetria.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/qa-passeio-guiado-telemetria.json)
- **Captura do Passeio Concluído:** [item1_passeio_concluido_1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/item1_passeio_concluido_1440x900.png)
- **Captura Assumindo o Volante:** [item3_assumir_volante.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/item3_assumir_volante.png)
- **Captura Mapa Tático com Checkmarks ✓:** [item4_mapa_destinos_com_checks.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/item4_mapa_destinos_com_checks.png)
- **Captura Toast Conclusão 9/9:** [item4_toast_conclusao_9de9.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-22/item4_toast_conclusao_9de9.png)
- **Capturas de Viewports:** `vp_1440x900_desktop.png`, `vp_1346x680_laptop.png`, `vp_390x844_mobile.png`, `vp_320x568_small_mobile.png`.

---

## 7. Veredito Final

A frente **Passeio Guiado e Descobertas (9 Paradas)** cumpre rigorosamente todos os critérios de engenharia, usabilidade, estabilidade gráfica e fidelidade temática. **Aprovada para liberação em produção.**
