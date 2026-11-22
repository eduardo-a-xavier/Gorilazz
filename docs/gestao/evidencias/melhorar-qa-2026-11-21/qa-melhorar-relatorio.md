# Relatório de Auditoria e Validação Técnica — Rodada "Melhorar Mais Ainda"

- **Data da Auditoria:** 21 de Novembro de 2026
- **Auditor:** QA Gorilazz (OpenBot Teammate — Qualidade e Entrega)
- **Destinatário:** Gorilazz Central (`agent-5fa2639d-43e1-4961-9e78-ff7e19efd57a`)
- **Ambiente de Teste:** Navegador Real via Playwright (Google Chrome com aceleração por hardware WebGL2 / ANGLE D3D11)
- **Servidor Auditado:** `http://localhost:3000` (servidor de desenvolvimento local ativo)
- **Repositório:** [Gorilazz-Relatorio](file:///E:/Gorilazz-Relatorio)
- **Veredito Geral:** **APROVADO (7 de 7 itens técnicos validados com sucesso)**

---

## 1. Tabela Resumo Item a Item

| Item | Descrição Técnica | Veredito | Métricas e Evidências Principais |
| :--- | :--- | :---: | :--- |
| **Item 1** | Gradiente de céu em 3 faixas e AO falso nas fachadas | **APROVADO** | Shader com zênite profundo, faixa média e horizonte colado à neblina `FogExp2` (sem corte); luminância média de 60.87 com apenas 0.95% de pixels escuros e 0.0% estourados; sem emenda no mar/horizonte. |
| **Item 2** | Postes com glow instanciado, halos dos 4 arcos e cabine iluminada | **APROVADO** | Glow aditivo instanciado nos postes (halo cruzado + poça na calçada em 1 único draw call sem PointLights extras); halos aditivos nos 4 arcos de ato (`gateHalos`); cabine com `clusterHalo`, `radioHalo` e `visorGlow` iluminando velocímetro e rádio em 1ª pessoa. |
| **Item 3** | Bancas, palcos, fliperama, totens e totem direcional 1,5x | **APROVADO** | Totem direcional "MURAIS ←\|MOINHO →" posicionado em `(9.5, -40.5)` a 1,5x com folga de 2,26 m da pista e 1,66 m do prédio vizinho; bancas, palcos de integrantes e gabinete do fliperama a 1,5x sem invasão do asfalto ou quarteirões. |
| **Item 4** | Outdoors: atlas 2048×6528, capas 256 px, Coachella 2023 | **APROVADO** | Atlas gerado com resolução exata de 2048×6528 (17 linhas de 384 px); capas em 256 px; créditos acadêmicos no rodapé (≤ 45 caracteres); alinhamento 1:1 rigoroso entre `AD_COVERS` e `ERA_ART` nas 4 eras; 5º outdoor do Ato 4 validado como `COACHELLA 2023\|TURNÊ CRACKER ISLAND · PHASE 7` (recorte 1998–2023). |
| **Item 5** | Partículas ao frear / perto de pontos e ordenação de dicas | **APROVADO** | Sistema de partículas instanciadas `drive-fx-particles` (1 draw call) disparando poeira/faísca neon nas desacelerações bruscas e ao cruzar pontos; algoritmo `rankByProximity` ordenando descobertas pendentes da menor para a maior distância. |
| **Item 6** | Novo piloto autoral `driver-pilot-v2.glb` e cockpit 1ª pessoa | **APROVADO** | Modelo GLB v2 carregado com sucesso (status 200 HTTP); resiliência com fallback garantido para `driver-pilot.glb`; eliminação total de fendas no pulso (mangas em `Sphere005_Retopology004_2` e mãos em `Sphere005_Retopology004_3`); cinemática inversa das mãos acompanhando o volante reativamente em A/D e repouso; `smoothNormals()` sem costuras duras. |
| **Item 7** | Regressões gerais, scroll lock, HUD e FPS nos 3 pontos | **APROVADO** | Scroll travado no modo 3D; HUD 100% contido no viewport (`bounding_box` inferior ≤ 900 px); atalho `M` abre e fecha o mapa tático; rádio avança faixas sem travar; **59.9 FPS** no Kong Studios, **59.8 FPS** no Bairro dos Murais e **59.9 FPS** no Mirante do Moinho (meta ≥ 55 FPS superada). |

---

## 2. Métricas de Performance, Rede e Qualidade

| Métrica Avaliada | Meta de Aceite | Valor Medido em Auditoria | Situação |
| :--- | :---: | :---: | :---: |
| **FPS — Kong Studios** | ≥ 55.0 FPS | **59.9 FPS** | **SUPERADO** |
| **FPS — Bairro dos Murais** | ≥ 55.0 FPS | **59.8 FPS** | **SUPERADO** |
| **FPS — Mirante do Moinho** | ≥ 55.0 FPS | **59.9 FPS** | **SUPERADO** |
| **Carga de Rede (Transferência Comprimida)** | ≤ 9.30 MB | **8.50 MB** (8.917.234 bytes) | **APROVADO** |
| **Carga de Memória (Corpo Decodificado)** | Informativo | **11.05 MB** (11.587.172 bytes) | **APROVADO** |
| **Erros HTTP (status ≥ 400)** | 0 | **0 erros** | **APROVADO** |
| **Erros de Console (`console.error` / `pageerror`)** | 0 | **0 erros** | **APROVADO** |
| **Verificação Estática (`npm run check`)** | 0 falhas | **33 módulos verificados com sucesso** (exit 0) | **APROVADO** |
| **Suíte de Testes Automatizados (`npm test`)** | 130/130 PASS | **130 testes aprovados** (3.32 s) | **APROVADO** |

---

## 3. Análise Detalhada por Item Técnico

### Item 1: Gradiente de Céu em 3 Faixas e Oclusão Ambiente Falsa
- O shader procedural de atmosfera em `src/atmosphere.js` foi configurado com interpolação vertical em três bandas:
  1. Faixa do horizonte colada à densidade exponencial da neblina (`FogExp2`), eliminando qualquer descontinuidade visual ou corte na linha d'água;
  2. Faixa média iluminada refletindo o clima cromático específico do bairro ativo;
  3. Zênite escurecido em degradê suave com o tom de contraste da cidade.
- As fachadas desenhadas em `src/city.js` incorporam gradiente vertical escurecido nas bases e sob as janelas, simulando oclusão ambiente (AO) sem exigir mapa de luz pesado ou cálculos volumétricos em tempo real.
- **Análise da Imagem:** A medição de luminância registrou média de `60.87`, com `0.95%` de áreas escuras (<15) e `0.0%` de pixels estourados (>245), assegurando excelente leitura do asfalto, calçadas e edifícios.
- **Evidência:** [01-ceu-horizonte-fachadas-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/01-ceu-horizonte-fachadas-1440x900.png)

### Item 2: Postes com Glow Instanciado, Halos dos Arcos e Iluminação da Cabine
- **Postes de Iluminação:** A iluminação urbana utiliza `InstancedMesh` para os halos luminosos cruzados no topo dos postes e a projeção aditiva circular no piso, consolidando toda a iluminação pública em 1 única chamada de desenho (*draw call*) e sem custos de `PointLight` por poste.
- **Arcos dos Portais de Ato:** Os 4 portais possuem anéis aditivos (`gateHalos`) com pulso luminoso que destacam as transições entre distritos históricos.
- **Cabine em 1ª Pessoa:** Ao alternar para o cockpit (`V`), os mostradores do cluster do velocímetro e da unidade de rádio recebem brilho próprio (`clusterHalo`, `radioHalo` e `visorGlow`), com uma luz pontual suave (`PointLight('#d8f2dc', 0.85, 2.5, 1.8)`), mantendo o interior perfeitamente legível sem ofuscar a visão da pista.
- **Evidências:**
  - Cabine e painel: [02-cabine-luz-velocimetro-radio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/02-cabine-luz-velocimetro-radio.png)
  - Postes e arcos: [02-postes-glow-e-arcos.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/02-postes-glow-e-arcos.png)

### Item 3: Bancas, Palcos, Fliperama, Totens e Totem Direcional 1,5x
- Todos os elementos de cenário e adereços de descoberta foram ampliados para escala 1,5x (`NON_DISCOVERY_PROP_SCALE = 1.5`, `ROAD_SIGN_SCALE = 1.5`).
- **Totem Direcional:** Posicionado estrategicamente na bifurcação `(9.5, -40.5)` com orientação `heading: 1.2`, traz a inscrição legível `"MURAIS ←|MOINHO →"` com folga comprovada de `2.26 m` até o asfalto e `1.66 m` até o prédio vizinho.
- **Desobstrução da Pista:** O gabinete do fliperama no Kong Studios `(-10, -10)` e os palcos dos 4 integrantes mantêm folga superior a 1,0 m da pista em todos os vértices de sua caixa de colisão, impedindo qualquer colisão acidental durante a condução.
- **Evidências:**
  - Totem direcional: [03-totem-direcional-murais-moinho.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/03-totem-direcional-murais-moinho.png)
  - Fliperama e palcos: [03-fliperama-e-palcos-1-5x.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/03-fliperama-e-palcos-1-5x.png)

### Item 4: Outdoors de Era (Atlas 2048×6528, Capas 256 px e Coachella 2023)
- O atlas de textura dos outdoors em `src/city.js` foi dimensionado para `2048 × 6528 px` (17 linhas de 384 px cada).
- Cada outdoor reserva área de 256 px para as capas dos álbuns (`AD_COVER_SIZE = 256`), com carregamento sob demanda de WebP oficial quando o veículo se aproxima a menos de 80 m da era e já percorreu pelo menos 30 m de pista.
- A faixa inferior de cada painel inclui crédito explícito acadêmico ("Arte: Jamie Hewlett · uso acadêmico" ou texto equivalente ≤ 45 caracteres).
- Alinhamento rigoroso 1:1 entre `AD_COVERS` e `ERA_ART` em todas as 4 eras.
- O 5º outdoor do Ato 4 exibe a inscrição oficial: `"COACHELLA 2023|TURNÊ CRACKER ISLAND · PHASE 7"`, respeitando rigorosamente o recorte cronológico deliberado de 1998 a 2023.
- **Evidência:** [04-outdoors-atlas-e-coachella2023.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/04-outdoors-atlas-e-coachella2023.png)

### Item 5: Partículas de Frenagem e Ordenação de Dicas por Proximidade
- A cena incorpora a malha de partículas instanciadas `drive-fx-particles` em `src/scene.js`, operando em um único draw call. Ao frear com desaceleração intensa ou transitar próximo às descobertas de história, partículas sutis de poeira e faíscas neon são emitidas nas rodas traseiras.
- O utilitário `rankByProximity` em `src/discoveries.js` classifica as descobertas ainda não visitadas em ordem estrita de distância cartesiana em relação à posição instantânea do veículo, garantindo que o sistema de dicas conduza o jogador ao ponto mais acessível primeiro.
- **Evidência:** [05-particulas-ao-frear.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/05-particulas-ao-frear.png)

### Item 6: Piloto Autoral `driver-pilot-v2.glb` e Cockpit Suavizado
- O piloto em primeira e terceira pessoa migrou com êxito para `driver-pilot-v2.glb`, tendo `driver-pilot.glb` como fallback documentado.
- Em primeira pessoa (`V`), a rotina `buildArmOnlyIndex()` isola os braços, punhos e luvas do modelo (`Sphere005_Retopology004_2` para mangas e `Sphere005_Retopology004_3` para mãos), ocultando cabeça e tronco da câmera sem quebrar a ancoragem dos ossos.
- As fendas que ocorriam na junção entre manga e pulso foram sanadas.
- O algoritmo `smoothNormals()` unifica as normais dos vértices coincidentes ponderadas pelo ângulo das faces, removendo arestas duras e facetas poligonais sob a iluminação direta.
- As mãos permanecem conectadas ao aro do volante em repouso e respondem com cinemática inversa suave nas manobras de esterçamento para esquerda (`A`) e direita (`D`).
- **Evidências:**
  - Posição neutra: [06-piloto-v2-centro.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-centro.png)
  - Esterçamento à esquerda: [06-piloto-v2-esquerda.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-esquerda.png)
  - Esterçamento à direita: [06-piloto-v2-direita.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-direita.png)

### Item 7: Testes de Não-Regressão Geral
- **Scroll Lock:** Durante o modo de direção, rolagens acidentais de página via roda do mouse ou teclado mantiveram-se bloqueadas.
- **HUD Inferior:** O painel de condução (`#drive-hud`), rádio e velocímetro mantiveram-se 100% visíveis dentro da altura de 900 px.
- **Mapa Tático (Tecla `M`):** O overlay em tela cheia abre e fecha normalmente via atalho e botões sem perda de foco.
- **Rádio Kong FM:** A troca de faixas ocorreu sem erros ou interrupções.
- **Evidência:** [07-regressao-mapa-m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/07-regressao-mapa-m.png)

---

## 4. Registro de Evidências Geradas

Todos os artefatos de teste, medições brutas e capturas de tela estão arquivados no diretório oficial de QA:
`E:\Gorilazz-Relatorio\docs\gestao\evidencias\melhorar-qa-2026-11-21\`

- Relatório Consolidado: [qa-melhorar-relatorio.md](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/qa-melhorar-relatorio.md)
- Telemetria e Métricas em JSON: [qa-melhorar-audit-results.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/qa-melhorar-audit-results.json)
- Capturas de Tela em Alta Resolução (1440×900 WebGL2):
  1. [01-ceu-horizonte-fachadas-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/01-ceu-horizonte-fachadas-1440x900.png)
  2. [02-cabine-luz-velocimetro-radio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/02-cabine-luz-velocimetro-radio.png)
  3. [02-postes-glow-e-arcos.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/02-postes-glow-e-arcos.png)
  4. [03-totem-direcional-murais-moinho.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/03-totem-direcional-murais-moinho.png)
  5. [03-fliperama-e-palcos-1-5x.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/03-fliperama-e-palcos-1-5x.png)
  6. [04-outdoors-atlas-e-coachella2023.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/04-outdoors-atlas-e-coachella2023.png)
  7. [05-particulas-ao-frear.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/05-particulas-ao-frear.png)
  8. [06-piloto-v2-centro.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-centro.png)
  9. [06-piloto-v2-esquerda.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-esquerda.png)
  10. [06-piloto-v2-direita.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/06-piloto-v2-direita.png)
  11. [07-regressao-mapa-m.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/melhorar-qa-2026-11-21/07-regressao-mapa-m.png)

---

## 5. Conclusão e Veredito Final

A rodada **"Melhorar Mais Ainda"** da Engenharia atendeu e superou todos os critérios de qualidade visual, integridade física, performance gráfica e otimização de rede estabelecidos. Todos os itens foram homologados sem ressalvas ou necessidade de correções adicionais.

**Veredito Oficial: APROVADO**
