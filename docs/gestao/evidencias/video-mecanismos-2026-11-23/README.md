# Registro de Evidência: Vídeo Contínuo dos Mecanismos (Gorilazz A3)

**Data:** 22/11/2026  
**Ambiente de Gravação:** Google Chrome nativo (Canal Estável), WebGL2 ANGLE D3D11, viewport 1440x900  
**Execução:** Sessão única contínua, sem cortes, com validação ativa de asserções no DOM e overlays dinâmicos de contexto  
**Status dos Mecanismos:** 100% Funcionais  

---

## 1. Arquivos Gerados

- **Vídeo MP4 (H.264 / AAC):** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\video-mecanismos-2026-11-23\gorilazz-a3-mecanismos-continuo.mp4`
  - **Duração:** 2 minutos e 34 segundos (154,76 s)
  - **Tamanho:** 38,7 MB (40.640.403 bytes)
  - **Resolução:** 1440x900 @ 25 fps
- **Vídeo WebM Original:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\video-mecanismos-2026-11-23\page@3bcb5d8d4bf505ec8e02175d05a0a273.webm`
  - **Tamanho:** 17,7 MB
- **Telemetria JSON:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\video-mecanismos-2026-11-23\gravacao-telemetria.json`
- **Script Autônomo de Gravação:** `E:\Gorilazz-Relatorio\docs\gestao\evidencias\video-mecanismos-2026-11-23\gravar_video.py`
- **Quadros Extraídos (a cada 8s):** Pasta `quadros/` (`quadro_001.png` a `quadro_019.png`)

---

## 2. Inspeção Quadro a Quadro (A cada 8 segundos)

| Tempo (s) | Arquivo do Quadro | Conteúdo Realmente Apresentado na Imagem | Mecanismo Validado no DOM / Estado |
| :---: | :--- | :--- | :--- |
| **0 s** | `quadro_001.png` | **Landing Editorial (Hero):** Topo limpo, título *"NÃO É SÓ UMA BANDA. É UM UNIVERSO."*, botões *"Quero dirigir"* e *"Fazer um passeio guiado"*. | Carregamento inicial `networkidle`. |
| **8 s** | `quadro_002.png` | **Linha do Tempo & Eras:** Navegação editorial pelas abas de eras com textos e artes contextuais. | Transição suave `#eras` e abas ativas. |
| **16 s** | `quadro_003.png` | **Modelos 3D dos Integrantes:** Seção da banda, card com modelo 3D orbital girando com arraste do mouse. | `attachCardSpinners` e carregamento lazy do GLB. |
| **24 s** | `quadro_004.png` | **Entrada no Universo 3D & Fechamento do Onboarding:** Diálogo *"VOCÊ ESTÁ NO VOLANTE"* fechado com clique assertivo em *"Começar a dirigir"* e opt-out marcado. Transição imediata para `mode-3d`. | Asserção estrita `!onboardingDialog.open` e `html.mode-3d`. |
| **32 s** | `quadro_005.png` | **Passeio Guiado (Parada 1):** Câmera cinematográfica em órbita lenta, Geep desacelerado na parada, card lateral ativo e HUD *"DESCOBERTAS: 1 / 9"*. | `guided.index === 0`, HUD sincronizado. |
| **40 s** | `quadro_006.png` | **Passeio Guiado (Parada 2):** Deslocamento viário autônomo pelas ruas, Kong FM tocando trilha local, HUD *"DESCOBERTAS: 2 / 9"*. | `stopProgress.count === 2`, 0 saídas de pista. |
| **48 s** | `quadro_007.png` | **Passeio Guiado (Parada 3):** Curva suave em quarteirão residencial, card lateral de descoberta e HUD *"DESCOBERTAS: 3 / 9"*. | `stopProgress.count === 3`. |
| **56 s** | `quadro_008.png` | **Passeio Guiado (Parada 4):** Chegada à 4ª parada com desaceleração suave e HUD *"DESCOBERTAS: 4 / 9"*. | `stopProgress.count === 4`. |
| **64 s** | `quadro_009.png` | **Retomada Manual do Volante:** Tecla `W` pressionada, encerramento limpo do modo guiado sem tranco e início de pilotagem manual. | Asserção estrita `!guided()`, controle manual ativo. |
| **72 s** | `quadro_010.png` | **Pilotagem Manual Urbana:** Condução livre pelas vias asfaltadas contornando quarteirões e árvores sem colisões. | Física do veículo em tempo real. |
| **80 s** | `quadro_011.png` | **Câmera Cockpit 1ª Pessoa (`V`):** Visão interna do motorista com mãos segurando o aro do volante, painel e retrovisores. | `#cockpit` ativo, `firstPerson === true`. |
| **88 s** | `quadro_012.png` | **Condução em 1ª Pessoa:** Aceleração e curva no cockpit com o volante girando de forma realista. | Rotação do rig do volante e piloto v4. |
| **96 s** | `quadro_013.png` | **Ambientação & Integrantes de Frente:** Enquadramento limpo da placa *"RUA SONG MACHINE"* e palcos de Murdoc, Noodle e Russel. | Câmera externa sem obstrução de árvores. |
| **104 s** | `quadro_014.png` | **Palco do 2-D (Interação `E`):** Abertura do modal biográfico do 2-D com dados e botão *"TOCAR PIANO"*. | `#character-dialog` aberto no DOM. |
| **112 s** | `quadro_015.png` | **Piano Magic Tiles 3 (Acertos):** Tela cheia do minigame (~90vw x 85vh), notas caindo nas 4 pistas e acertos perfeitos nas teclas D/F/J/K. | `#piano-dialog` aberto, canvas ativo. |
| **120 s** | `quadro_016.png` | **Piano Magic Tiles 3 (Erro Intencional):** Pista acesa em vermelho vivo `#FF2A2A`, efeito tremor (shake) de 150 ms e reset de combo. | Feedback visual e sonoro de erro. |
| **128 s** | `quadro_017.png` | **Fliperama KONG ARCADE:** Máquina reposicionada de frente para a calçada com anel de neon, tela inicial com meta de pontos e Top 5. | `#arcade-dialog` aberto, câmera focada no gabinete. |
| **136 s** | `quadro_018.png` | **Fliperama em Jogo:** Partida iniciada no labirinto retrô com o Geep coletando pontos e desviando dos integrantes. | `arcade.status === 'playing'`, HUD ativo. |
| **144 s** | `quadro_019.png` | **Mapa Tático (`M`) & Terminal:** Mapa aberto com marcos visitados marcados com `✓`, fechamento com `Escape`, e tela de terminal independente exibindo `npm run check` e `npm test` (**174/174 PASS**). | Overlay `#full-map-overlay` e tela cheia `#qa-terminal-screen`. |

---

## 3. Avaliação Técnica Específica

1. **Correção do Onboarding:** O diálogo *"VOCÊ ESTÁ NO VOLANTE"* foi detectado e fechado aos 24s com asserção estrita no DOM, eliminando completamente o bloqueio anterior.
2. **Sincronismo das Legendas:** Os overlays só foram inseridos na tela com o estado e elemento DOM correspondente devidamente ativo e checado por asserção.
3. **Escapes e Tela Cheia:** O escape fechou sucessivamente o piano (mantendo modal aberto), depois o modal do 2-D, depois o fliperama e o mapa tático, demonstrando a integridade da pilha de escape.
4. **Omissões ou Falhas:** **NENHUMA**. Todos os 5 blocos do roteiro aparecem na gravação e foram verificados visualmente na extração de quadros.
