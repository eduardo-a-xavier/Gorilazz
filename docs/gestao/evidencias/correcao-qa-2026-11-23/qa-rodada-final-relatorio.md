# Relatório de Homologação e Auditoria Técnica — Rodada Final

**Projeto:** Gorilazz A3 — A Estrada  
**Data:** 22/11/2026 (Rodada Final de 23/11)  
**Ambiente de Teste:** Google Chrome (Canal Estável, Playwright channel `chrome`, WebGL2 ANGLE D3D11)  
**Servidor Local:** `http://localhost:3000` (Node.js `server.mjs`)  
**Auditor Responsável:** QA Gorilazz  
**Status Geral:** **APROVADO (8 de 8 itens homologados — 100% de conformidade técnica)**  

---

## Tabela de Homologação dos 8 Itens

| Item | Componente / Requisito | Critérios de Aceite | Resultado Medido no Chrome Real | Veredito |
| :---: | :--- | :--- | :--- | :---: |
| **1** | **Piano do 2-D (Magic Tiles 3)** | Container ~90vw x 85vh, 4 pistas, erro `#FF2A2A` + shake 150 ms + som + reset combo, acerto verde/ciano PERFEITO/BOM, banner inteiro, 4 viewports, ESC sem derrubar fullscreen. | Largura cravada em 90vw (1296px, 1211px, 351px, 288px) e altura entre 79.2% e 85.0% vh. Erro acende coluna em vermelho com animação shake de 150 ms e combo zerado. Acerto com feedback verde/ciano. ESC fecha o minigame preservando tela cheia. | **APROVADO** |
| **2** | **Fliperama KONG ARCADE** | Reposicionado de frente para a calçada/via, anel luminoso e base no chão, enquadramento frontal da câmera ao E, tela com total de pontos (sem "Restam 0"), ranking Top 5. | Máquina recuada para (-13.5, -10) paralela à via com anel rosa (`arcade-ring`) e base cinza (`arcade-pad`). Câmera aproxima a 3.4 m da tela ao apertar E. Tela inicial exibe meta do labirinto e Top 5 funcional via localStorage. | **APROVADO** |
| **3** | **Descobertas X/9 & Bug do 2-D** | 0 a 9 abrindo modal com E (4 portais + 5 histórias), uma soma por parada, repetir não soma, ✓ no mapa M, persistência no reload, toast 9/9, e teste específico do 2-D. | Paradas 1 a 9 somaram estritamente 1 vez (0→9). Repetição não incrementa. Interação com palco do 2-D abre ficha biográfica e NÃO soma descoberta (`stopIdFor` filtra integrantes). Mapa M exibiu 9/9 com ✓, toast 9/9 disparado e persistência íntegra após reload. | **APROVADO** |
| **4** | **Passeio Guiado & Rádio** | Câmera cinematográfica dedicada em órbita na parada, retorno suave à câmera normal no WASD, troca de faixa no player Kong FM (limite de 2 faixas). | Órbita lenta a 7.5 m e altura 3.4 m durante os 4.5 s de parada. Tecla W encerra o modo guiado e `clearPose()` devolve a câmera de direção a ~24 m. Faixa 1 ("Maré de plástico") na era plástico e faixa 0 ("Concreto") nas demais. | **APROVADO** |
| **5** | **Câmera: Stutter e Copas** | Frame time sem stutter (p95/p99) e travessia de copas de árvore em curvas fechadas manuais dentro do teto aceito (4 de 576 amostras). | Frame time estável em 60 FPS: p50 16.7 ms, p95 17.0 ms, p99 17.2 ms, 0 quadros > 33 ms. No passeio guiado, 0 travessias de copa. Em zigue-zague manual rente a 16 árvores, mitigação comprovada pelo bloqueador de copas e piso de 7,5 m (limite aceito). | **APROVADO** |
| **6** | **Piloto v4 em 1ª Pessoa (V)** | Mãos no aro do volante, sem fenda no pulso com a manga rosa, pontas dos dedos sem rasgos, avaliação de angularidade e cadeia de fallback v4→v2→original. | Mãos fixadas no aro nas posições 11h/1h sem fresta no pulso. Dedos do modelo v4 (65 joints) íntegros sem malhas rasgadas; constata-se leve faceta poligonal nos nós dos dedos esquerdos em zoom macro. Fallback íntegro. | **APROVADO** |
| **7** | **Cena (Integrantes, Placa, Props)** | Pose do Murdoc de frente, visibilidade de Noodle e Russel sem bloqueio de árvores/prédios, placa "RUA SONG MACHINE" legível e apoio de caixas/bancas/totens. | Murdoc com inclinação -0.03, baixo no peito e traste elevado. Noodle e Russel desobstruídos após remoção das árvores em raio de 16 m do palco. Placa "RUA SONG MACHINE" legível a 3.85 m na esquina. Props assentados. | **APROVADO** |
| **8** | **Regressões e Métricas Finais** | ESC em pilha (sem erro de `<details open>`), scroll lock, HUD responsivo, FPS >= 55 nos 3 pontos, 0 erros HTTP/console, peso de rede, `npm run check` e `npm test` (174/174). | ESC em pilha testado com details e modais sem erros de JS. FPS cravado em 60.0–60.1 nos 3 pontos. 0 erros de console, 0 erros HTTP. Peso inicial de 8.58 MB (teto 9.3 MB). 40 módulos checados e 174/174 testes PASS. | **APROVADO** |

---

## Detalhamento Técnico das Validações

### 1. Piano do 2-D (Magic Tiles 3)
- **Dimensões e Proporções do Contêiner:**
  - Desktop 1440x900: `1296.0 x 732.5 px` (**90.0% vw** x **81.4% vh**), Canvas `934.0 x 700.5 px` (Aspect Ratio 1.333).
  - Notebook 1346x680: `1211.4 x 550.0 px` (**90.0% vw** x **80.9% vh**), Canvas `690.7 x 518.0 px` (Aspect Ratio 1.333).
  - Mobile Retrato 390x844: `351.0 x 668.1 px` (**90.0% vw** x **79.2% vh**), Canvas `323.0 x 242.3 px` (Aspect Ratio 1.333).
  - Mobile Pequeno 320x568: `288.0 x 482.8 px` (**90.0% vw** x **85.0% vh**), Canvas `260.0 x 195.0 px` (Aspect Ratio 1.333).
- **Mecânica de Feedback e Erro:**
  - Toque em coluna vazia dispara imediatamente a classe `.shake` no canvas (150 ms) e o preenchimento transitório em vermelho `#FF2A2A`.
  - Som de erro com osciladores de dente de serra/quadrada sintetizados via Web Audio API.
  - Combo zerado instantaneamente (`0`).
  - Banner `"ERRO: tecla errada"` mantido perfeitamente visível via `scrollIntoView`.
- **Teclado e Acessibilidade:**
  - Tecla `Escape` fecha o minigame e retorna o foco ao modal do 2-D sem derrubar a tela cheia ativa do navegador.

### 2. Fliperama KONG ARCADE
- **Geometria e Posicionamento:**
  - Posição definida em `ARCADE_SPOT = { x: -13.5, z: -10 }`, orientada tangencialmente para a via pública.
  - Base de piso cinza (`arcade-pad`) de raio 4.7 m assentada sobre a calçada com folga superior a 0.90 m do asfalto.
  - Anel de destaque emissivo rosa (`arcade-ring`, cor `#f5a9c6`) desacoplado da escala local do gabinete, mantendo iluminação visível a até 50 m de distância.
- **Interação:**
  - Tecla `E` a menos de 4 m dispara aproximação cinematográfica suave da câmera para o plano frontal da máquina (`distance: 3.4 m, height: 2.5 m`).
  - Tela inicial com labirinto e placar Top 5 funcional.

### 3. Descobertas X/9, Modal do 2-D e Mapa Tático
- **Auditoria Passo a Passo das 9 Paradas (Interação Manual com E):**
  1. `beginning` (História 1): `0 -> 1` (**somou**)
  2. `voices` (História 2): `1 -> 2` (**somou**)
  3. `genres` (História 3): `2 -> 3` (**somou**)
  4. `demon-days` (História 4): `3 -> 4` (**somou**)
  5. `live` (História 5): `4 -> 5` (**somou**)
  6. `explosao` (Portal Era 1): `5 -> 6` (**somou**)
  7. `plastic` (Portal Era 2): `6 -> 7` (**somou**)
  8. `hiato` (Portal Era 3): `7 -> 8` (**somou**)
  9. `reinvencao` (Portal Era 4): `8 -> 9` (**somou**)
- **Teste de Regressão Crítico — Palco do 2-D (Bug do vídeo):**
  - O veículo foi posicionado nas imediações do palco de 2-D (`x: -72.92, z: -70.34`) e a tecla `E` foi pressionada.
  - O modal biográfico `#character-dialog` abriu normalmente, e o contador de descobertas **permaneceu em 0** (`nao_somou_descoberta: true`).
  - O fechamento via `Escape` operou sem erros, mantendo o canvas 3D ativo e a navegação desimpedida.
- **Idempotência e Persistência:**
  - Repetir a tecla `E` na parada `beginning` não alterou o contador (`repeticao_nao_soma: true`).
  - Ao recarregar a página (`reload`), a chave `gorilazz.stops.v1` restaurou o estado com `9 / 9` e todas as 9 marcações `✓` no mapa `M`.
  - Toast `"Universo Gorillaz 100% Explorado"` confirmado em tela.

### 4. Passeio Guiado e Sincronização Musical
- **Câmera Cinemática:** Ao desacelerar na área de chegada de cada parada (`holdUntil`), a câmera entra em transição para o ponto central com órbita esférica contínua a 7.5 m de distância.
- **Assunção do Volante:** Qualquer comando de direção (`W`, `A`, `S`, `D`) desconecta o piloto automático instantaneamente, chamando `clearPose()` e devolvendo o braço da câmera para a posição padrão de terceira pessoa (~24 m do veículo).
- **Player Kong FM:** Função `localTrackFor` validada; a era Plastic Beach seleciona a faixa 1 (*Maré de plástico*) e as demais paradas selecionam a faixa 0 (*Concreto*). Limite técnico registrado devido ao acervo liberado no projeto.

### 5. Câmera, Frame Time e Colisão de Árvores
- **Estabilidade de Quadros:**
  - `p50`: **16.7 ms**
  - `p95`: **17.0 ms**
  - `p99`: **17.2 ms**
  - Quadros excedendo 33.3 ms: **0**
- **Copas de Árvore:**
  - No trajeto autônomo do passeio guiado: **0 amostras de colisão**.
  - Em manobras fechadas manuais em zigue-zague com 16 árvores: mitigação expressiva proporcionada pela inclusão das copas como `cameraBlockers` e piso de 7.5 m de altura. As ocorrências residuais mantêm-se rigorosamente dentro do limite aceito (4 de 576 amostras a 7.2–7.9 m do carro).

### 6. Piloto em 1ª Pessoa (`driver-pilot-v4.glb`)
- **Posição de Condução e Volante:** Na visão em primeira pessoa (`V`), as mãos conectam-se perfeitamente ao aro do volante.
- **Inspeção de Malha e Punhos:** Não foram constatadas fendas ou descontinuidades entre a manga rosa e a pele do pulso.
- **Parecer Técnico da Geometria dos Dedos:** A versão v4 (65 joints) solucionou as distorções severas da v1. Em análise visual detalhada, observa-se que as falanges dos dedos da mão esquerda ainda possuem pequenas arestas poligonais angulosas decorrentes da contagem otimizada de polígonos, sem qualquer comprometimento estético na visão de cockpit do jogo.
- **Cadeia de Fallback:** Verificada a resolução sequencial v4 → v2 → original em `src/pilot-rig.js`.

### 7. Elementos de Cena (Item 5)
- **Murdoc de Frente:** Enquadrado via `world.frameAt([-60.21, 3.2, -124.27], [-60.21, 3.4, -136.27])`. A pose exibe o baixo apoiado no peito com o braço em elevação e inclinação do tronco em -0.03. O braço do corpo permanece sutilmente oculto atrás do instrumento conforme documentado.
- **Noodle e Russel:** Câmeras frontais de aproximação (`[42.67, 2.8, -85]` e `[52.45, 2.8, -90]`) comprovaram campo visual livre. As árvores que anteriormente obstruíam a visão foram realocadas para fora do raio de 16 m do palco em `src/world-data.js`.
- **Placa "RUA SONG MACHINE":** Localizada na esquina de acesso à Rua Song Machine (índice 9 de `ROADS`), com poste de 4.2 m e placa fixada a 3.85 m legível de frente.
- **Apoio de Props:** Caixas, bancas e totens mantêm bases firmes sobre as calçadas sem vértices flutuantes.

### 8. Regressões e Métricas Finais
- **Pilha de Teclas (ESC):** O bug do elemento `<details open>` do diário de eras foi sanado em `src/app.js` restringindo o observer a tags `<dialog>`, evitando erros de `top.close is not a function`.
- **Desempenho (FPS Real em Chrome WebGL2 ANGLE D3D11):**
  - Kong Studios (Mural): **60.1 FPS**
  - Palco dos Integrantes: **60.0 FPS**
  - Centro / Pista: **60.0 FPS**
- **Erros e Alertas:**
  - Erros em `console.error`: **0**
  - Erros HTTP >= 400: **0**
  - Erros de página / exceções: **0**
- **Auditoria de Payload de Rede:**
  - **Método Declarado:** Cálculo exato da soma do cabeçalho `Content-Length` das requisições HTTP distintas transferidas do servidor local `server.mjs`.
  - Peso Landing Page: **1.32 MB**
  - Peso Inicial (Landing + Entrada no 3D): **8.58 MB** *(meta <= 9.3 MB — APROVADO com margem de 0.72 MB)*
  - Peso Acumulado pós-exploração total: **9.95 MB**
- **Testes Automatizados:**
  - `npm run check`: **40 módulos validados sem inconsistências**
  - `npm test`: **174 de 174 testes aprovados (100% PASS)**

---

## Evidências Gráficas Geradas

As capturas de tela e o arquivo JSON de telemetria foram gerados nesta auditoria:

- **JSON de Telemetria:** [qa-rodada-final-telemetria.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/qa-rodada-final-telemetria.json)
- **Capturas do Piano (Magic Tiles 3):**
  - [01-piano-erro-desktop-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/01-piano-erro-desktop-1440x900.png)
  - [01-piano-erro-notebook-1346x680.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/01-piano-erro-notebook-1346x680.png)
  - [01-piano-erro-retrato-390x844.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/01-piano-erro-retrato-390x844.png)
  - [01-piano-erro-pequeno-320x568.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/01-piano-erro-pequeno-320x568.png)
- **Capturas do Fliperama:**
  - [02-depois-fliperama-de-longe-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/02-depois-fliperama-de-longe-1440x900.png)
  - [02-depois-fliperama-E-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/02-depois-fliperama-E-1440x900.png)
- **Capturas de Descobertas, Mapa e 2-D:**
  - [03-modal-2d-integrante.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-modal-2d-integrante.png)
  - [03-mapa-9-de-9-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-mapa-9-de-9-1440x900.png)
  - [03-toast-9de9.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/03-toast-9de9.png)
- **Captura do Passeio e Câmera Cinemática:**
  - [04-cinematica-parada-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/04-cinematica-parada-1440x900.png)
- **Capturas do Piloto v4 em 1ª Pessoa:**
  - [06-depois-piloto-primeira-pessoa-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/06-depois-piloto-primeira-pessoa-1440x900.png)
  - [06-depois-piloto-volante-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/06-depois-piloto-volante-1440x900.png)
- **Capturas de Elementos de Cena:**
  - [07-depois-2d-corpo-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-2d-corpo-1440x900.png)
  - [07-depois-murdoc-corpo-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-murdoc-corpo-1440x900.png)
  - [07-depois-noodle-corpo-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-noodle-corpo-1440x900.png)
  - [07-depois-russel-corpo-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-russel-corpo-1440x900.png)
  - [07-depois-chegada-noodle-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-chegada-noodle-1440x900.png)
  - [07-depois-chegada-russel-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-chegada-russel-1440x900.png)
  - [07-depois-placa-song-machine-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/correcao-qa-2026-11-23/07-depois-placa-song-machine-1440x900.png)

*(Nenhum código-fonte foi alterado e nenhuma operação git foi efetuada).*
