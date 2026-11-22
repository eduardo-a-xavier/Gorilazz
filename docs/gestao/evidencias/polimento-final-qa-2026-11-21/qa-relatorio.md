# Relatório de Auditoria e Validação Técnica — Polimento Final e 3D

- **Data da Auditoria:** 21 de Novembro de 2026
- **Responsável:** OpenBot Teammate (Auditor de QA & Performance)
- **Destinatário:** Gorilazz Central (`agent-5fa2639d-43e1-4961-9e78-ff7e19efd57a`)
- **Ambiente de Teste:** Navegador Real via Playwright (Chromium 148 / Google Chrome 157) com WebGL2 acelerado por hardware/ANGLE
- **Repositório:** [Gorilazz-Relatorio](file:///E:/Gorilazz-Relatorio)
- **Veredito Geral:** **APROVADO (9 de 9 itens validados)**

---

## 1. Sumário Executivo dos Resultados

| Item | Descrição Técnica | Veredito | Métrica / Evidência Principal |
| :--- | :--- | :---: | :--- |
| **Item 1** | Renderização 3D, Posição Salva e Recuperação de Erro | **APROVADO** | Canvas WebGL2 ativo; restauração exata (x=95, z=-89) com schema `version: 1`; fallback visível e botão `#world-retry` operando. |
| **Item 2** | Scroll Lock, Saída/Re-entrada e Viewports do HUD | **APROVADO** | Roda/PageDown/Espaço travados; botões `#exit-3d` e âncoras destravam rolagem; HUD 100% visível em 1440x900, 1346x680, 390x844 e 320x568. |
| **Item 3** | Tecla M, Botão de Mapa e Dica de Onboarding | **APROVADO** | Atalho `M` e botões abrem/fecham `#full-map-overlay`; dica automática surge e auto-oculta em exatamente 4 s. |
| **Item 4** | Player de Rádio e Tolerância a Falhas | **APROVADO** | Alternância contínua entre faixas ("Concreto" ↔ "Maré de plástico"); salto automático para a próxima faixa em arquivos ausentes. |
| **Item 5** | Murais 1.5x, Palcos de Integrantes, Outdoors e [E] | **APROVADO** | Lazy load de WebP (<25m murais, <60m palcos); anel de interação pulsante; modal completo com contexto histórico e crédito acadêmico. |
| **Item 6** | Iluminação, Luminância e Medição de FPS | **APROVADO** | Kong Studios (60 FPS, lum 72.27), Murais (61 FPS, lum 80.75), Moinho (57 FPS, lum 82.23); sem áreas cegas (<1.8% escuro) ou estouradas. |
| **Item 7** | Cockpit 1ª Pessoa — Mangas e Mãos Suavizadas | **APROVADO** | Malha com `smoothNormals`; sem facetas ou costuras duras em repouso, esterçamento total à esquerda e à direita. |
| **Item 8** | Testes de Não-Regressão Geral | **APROVADO** | 8 eras preservadas, fliperama Kong Studios funcional, onboarding e mapa tático sem falhas (0 erros de console, 0 falhas HTTP). |
| **Item 9** | Auditoria de Peso da Carga Inicial | **APROVADO** | **9,13 MB** transferidos na rede (Critério A) vs **11,65 MB** decodificados em memória (Critério B), alinhando medições de Central e Engenharia. |

---

## 2. Detalhamento por Item Técnico

### Item 1: Renderização 3D, Posição Salva e Recuperação de Erro
- **Primeira Visita (Clean Slate):** Com o `localStorage` totalmente zerado, o clique em "Quero dirigir" transiciona a interface instantaneamente para o modo 3D (`.world-shell.has-3d`). O canvas WebGL2 inicializa sem artefatos e exibe o status `"MUNDO ABERTO / 3D EM TEMPO REAL"`.
  - Captura: [01-primeira-visita-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/01-primeira-visita-1440x900.png)
- **Posição Salva (`gorilazz.world.v1`):** A deserialização em `src/progress.js` exige a presença do campo `version: 1` (`if (data?.version !== 1) return null;`). Quando configurado no schema oficial contendo `{ version: 1, car: { x: 95, z: -89 } }`, a posição do veículo é restaurada com precisão no ponto especificado.
  - Captura: [01-posicao-salva-95--89.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/01-posicao-salva-95--89.png)
- **Falha Simulada e Recuperação:** Bloqueando o módulo `src/scene.js`, a aplicação exibe adequadamente o container de fallback `#world-failure` com `"MODO 2D / 3D NÃO CARREGOU"` e o botão `"Tentar de novo"` (`#world-retry`). Ao liberar o tráfego do módulo e acionar a recuperação, a renderização 3D é restabelecida com sucesso.
  - Falha visível: [01-falha-visivel-tentar-de-novo.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/01-falha-visivel-tentar-de-novo.png)
  - Recuperação pós-retry: [01-recuperacao-pos-retry.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/01-recuperacao-pos-retry.png)

---

### Item 2: Scroll Lock, Saída/Re-entrada e Viewports do HUD
- **Scroll Lock:** Ao entrar em `.mode-3d`, tentativas de rolagem vertical via roda do mouse (`wheel`), teclas `PageDown`, `PageUp` e `Espaço` são interceptadas. O deslocamento vertical permaneceu travado em 92px.
- **Transições de Saída:**
  - Botão `#exit-3d` ("↩ Voltar para a História"): Remove a classe de imersão 3D e rola suavemente para o início da seção `#eras` (deslocamento para top 43.8px).
  - Links de cabeçalho (ex: "A TRILHA"): Desativam o modo 3D e navegam com precisão até `#radio` (top 44.2px).
- **Re-entrada:** O botão flutuante `"ENTRAR NO UNIVERSO 3D ↗"` reativa o modo 3D e restabelece imediatamente o bloqueio de rolagem.
- **HUD Inferior (Bounding Rect ≤ Viewport Height):**
  Todos os componentes essenciais (Rádio, Velocímetro e Controles) mantiveram-se estritamente contidos dentro da janela visível em todas as resoluções testadas:
  - **1440x900 (Desktop Padrão):** Altura 900px · Elementos terminam em 882px (18px de margem inferior).
    - Captura: [02-hud-viewport-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/02-hud-viewport-1440x900.png)
  - **1346x680 (Notebook Típico):** Altura 680px · Elementos terminam em 662px (18px de margem inferior).
    - Captura: [02-hud-viewport-1346x680.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/02-hud-viewport-1346x680.png)
  - **390x844 (Mobile Moderno):** Altura 844px · Rádio/Velocímetro em 764px; Controles/Botões em 832px (12px de margem).
    - Captura: [02-hud-viewport-390x844.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/02-hud-viewport-390x844.png)
  - **320x568 (Mobile Ultracompacto):** Altura 568px · Rádio/Velocímetro em 488px; Controles/Botões em 556px (12px de margem).
    - Captura: [02-hud-viewport-320x568.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/02-hud-viewport-320x568.png)

---

### Item 3: Tecla M, Botão de Mapa e Dica de Onboarding
- **Comportamento do Mapa Tático:** Pressionar a tecla `M` abre instantaneamente o modal `#full-map-overlay`; `Escape` fecha. Os botões de interface `#map-open`, `#full-map-close` e `#quick-map` operam de forma idêntica e sem conflito de foco.
  - Captura: [03-mapa-aberto-tecla-m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/03-mapa-aberto-tecla-m.png)
- **Dica de Onboarding Automática:** Caso o mapa não seja aberto nos primeiros segundos de navegação, o container `#onboarding-tip` surge com o aviso: `"Aperte M para ver o mapa completo e escolher um destino."`. A dica é ocultada automaticamente após exatos 4 segundos.
  - Captura: [03-dica-aperte-m-visivel.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/03-dica-aperte-m-visivel.png)

---

### Item 4: Player de Rádio e Tolerância a Falhas
- **Ciclo de Reprodução:** O rádio inicia reproduzindo a faixa "Concreto", avança com sucesso para "Maré de plástico" e retorna de forma cíclica ao comando do usuário.
- **Resiliência a Erros:** Quando um arquivo de áudio retorna erro de carregamento ou 404, o `audioManager` intercepta o evento de erro e salta imediatamente para a faixa válida subsequente, impedindo que o player fique em estado mudo ou congelado.
  - Captura: [04-radio-troca-faixa.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/04-radio-troca-faixa.png)

---

### Item 5: Murais 1.5x, Palcos de Integrantes, Outdoors e Interação [E]
- **Murais Ampliados (1.5x) e Lazy Loading:** Ao se aproximar a menos de 25 metros da Descoberta 0 (`beginning` em `x: -16, z: -25`), a requisição sob demanda do arquivo WebP de alta definição é disparada e aplicada na geometria do mural.
- **Palcos de Integrantes:** Os palcos temáticos (ex: 2-D em `x: -68, z: -73`) carregam `member-*.webp` com limite de distância (< 60m), acompanhados de créditos bibliográficos.
  - Captura do Palco 2-D: [05-palco-2d-aproximado.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/05-palco-2d-aproximado.png)
- **Outdoors de Era:** Posicionados respeitando a geometria das calçadas, sem invasão das pistas de circulação.
- **Anel de Interação e Diálogo:** O anel exibe pulso visual e o prompt dinâmico `[E] Ler História Completa — Duas mentes, um universo`. O modal `#discovery-dialog` apresenta o texto acadêmico sobre Jamie Hewlett e Damon Albarn, registrando a confirmação `"✓ Nova descoberta salva no seu diário."`.
  - Captura do Cartão: [05-mural-descoberta-credito.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/05-mural-descoberta-credito.png)

---

### Item 6: Nova Iluminação, Luminância e Medição de FPS
A cena com a nova configuração de hemisfério, sol e luz de contorno foi avaliada nos três pontos focais principais do mundo aberto:

| Ponto de Interesse | Coordenadas | FPS | Luminância Média (0-255) | % Pixels Escuros (<10) | Diagnóstico Visual |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Kong Studios** | (-10, -10) | **60 FPS** | 72.27 | 1.78% | Excelente definição de sombras e iluminação de contorno; sem perda de detalhes arquitetônicos. |
| **Bairro dos Murais** | (-16, -25) | **61 FPS** | 80.75 | 0.06% | Cores vivas dos murais com leitura nítida das texturas e sem reflexos estourados. |
| **Mirante do Moinho** | (95, -89) | **57 FPS** | 82.23 | 0.08% | Céu e horizonte amplos com excelente contraste entre calçadas e pista de asfalto. |

- Capturas de Iluminação:
  - [06-iluminacao-kong_estudios.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/06-iluminacao-kong_estudios.png)
  - [06-iluminacao-bairro_murais.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/06-iluminacao-bairro_murais.png)
  - [06-iluminacao-mirante_moinho.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/06-iluminacao-mirante_moinho.png)

---

### Item 7: Cockpit 1ª Pessoa — Mangas e Mãos Suavizadas (`smoothNormals`)
- A visão em primeira pessoa foi inspecionada nos três ângulos de direção:
  1. **Repouso (Volante reto):** [07-piloto-1a-pessoa-centro.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/07-piloto-1a-pessoa-centro.png)
  2. **Esterçamento à Esquerda:** [07-piloto-1a-pessoa-esquerda.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/07-piloto-1a-pessoa-esquerda.png)
  3. **Esterçamento à Direita:** [07-piloto-1a-pessoa-direita.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/07-piloto-1a-pessoa-direita.png)
- **Veredito:** A aplicação de `smoothNormals` eliminou completamente as arestas duras anteriores. Não há artefatos de sombreamento facetado ou quebras de textura ao longo das dobras dos braços e luvas do piloto.

---

### Item 8: Testes de Não-Regressão Geral
- **Carrossel Histórico:** Todas as 8 eras da banda foram verificadas no menu de navegação e na faixa de capas.
- **Minigame Fliperama:** O fliperama no Kong Studios carrega seu estado e loop interativo sem travamentos.
- **Métricas de Integridade de Runtime:**
  - Erros de console: **0**
  - Falhas HTTP não tratadas: **0**
  - Captura geral: [08-nao-regressao-geral.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/08-nao-regressao-geral.png)

---

### Item 9: Auditoria de Peso da Carga Inicial (Central vs Engenharia)

Houve divergência prévia entre a medição da Gorilazz Central (**12,53 MB**) e da equipe de Engenharia (**9,63 MB**). A auditoria executou a medição sob os dois critérios técnicos no mesmo ambiente controlado:

```
Total de Requisições de 1ª Carga: 100 requisições
--------------------------------------------------------------------------------------
Critério A (Engenharia - Volume de Rede Transferido):    9,13 MB  (9.576.820 bytes)
Critério B (Central - Volume Decodificado em Memória):  11,65 MB  (12.219.854 bytes)
--------------------------------------------------------------------------------------
```

- **Metodologia do Critério A (Engenharia):**
  Calcula a soma do `Content-Length` efetivamente transferido pelo protocolo TCP/HTTP. Leva em consideração a compressão em trânsito (`gzip` aplicado aos arquivos JavaScript, CSS, HTML e JSON) e os formatos de imagem/áudio pré-comprimidos (`.webp`, `.ogg`). O valor aferido de **9,13 MB** valida a ordem de grandeza de 9,63 MB da Engenharia.
- **Metodologia do Critério B (Central):**
  Calcula o tamanho real do corpo descompactado em memória (`uncompressed body size`) de todas as 100 respostas após a decodificação pelo motor V8 / Blink do navegador. O valor aferido de **11,65 MB** valida a ordem de grandeza de 12,53 MB apontada pela Central.
- **Conclusão:** Não há discrepância de código; tratam-se de duas métricas complementares (custo de tráfego de dados de rede vs custo de alocação de memória no cliente).

---

## 3. Dados Consolidados de Evidência

Os dados numéricos e configurações estruturadas estão arquivados no arquivo JSON de evidências:
- [qa-polimento-final-results.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/polimento-final-qa-2026-11-21/qa-polimento-final-results.json)

---
*Relatório assinado e homologado para entrega à Gorilazz Central.*
