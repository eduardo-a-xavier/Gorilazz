# Relatório de Evidência Técnica — Regravação v2: Direção Manual 3D, Murdoc Lunar e Easter Eggs

**Data:** 24 de novembro de 2026  
**Auditor:** QA Gorilazz  
**Ambiente:** Google Chrome nativo (Canal Estável, Janela Visível `headless=False`, GPU D3D11, flags anti-throttling)  
**Resolução do Viewport:** 1440x900 px  
**Duração da Sessão:** 213,1 segundos (3 min 33 s / 3,55 min) — *estritamente entre 3 e 5 minutos*  
**Veredito:** **CONCLUÍDO COM SUCESSO (v2 Homologada)**

---

## 1. Arquivos de Vídeo e Evidências Geradas (Versão v2)

Os arquivos da versão anterior foram integralmente preservados, recebendo a nova entrega o sufixo `-v2`:

- **Vídeo Completo v2 (1440x900 px, H.264 CRF 22, 25 fps, faststart):**
  - [video-dirigindo-lua-completo-v2.mp4](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/video-dirigindo-lua-2026-11-24/video-dirigindo-lua-completo-v2.mp4) (51,5 MB)
- **Versão Leve v2 (1280x800 px, H.264 CRF 30, sem áudio, faststart):**
  - [video-dirigindo-lua-1280-leve-v2.mp4](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/video-dirigindo-lua-2026-11-24/video-dirigindo-lua-1280-leve-v2.mp4) (13,3 MB — meta ~12 MB)
- **Quadros Extraídos a Cada 4 Segundos (53 quadros auditados):**
  - Diretório: [quadros-v2/](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/video-dirigindo-lua-2026-11-24/quadros-v2/) (`frame_0001.jpg` a `frame_0053.jpg`)
- **Registro Estruturado de Linha do Tempo:**
  - [timeline_gravacao_v2.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/video-dirigindo-lua-2026-11-24/timeline_gravacao_v2.json)
- **Script Autônomo de Regravação:**
  - [gravar_direcao_lua_v3.py](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/video-dirigindo-lua-2026-11-24/gravar_direcao_lua_v3.py)

---

## 2. Auditoria Quadro a Quadro da Sessão (Amostragem a cada 4 s)

| Tempo (s) | Quadro | O que aparece de fato na tela | Estado / Avaliação |
|---|:---:|---|---|
| **00:00 - 00:06** | `frame_0001` a `0002` | **Vitrine Inicial do Topo:** Murdoc lunar com disco maior visível no céu a oeste sobre o palco (projeção: 883x278 px). | **Excelente:** Astro nítido no céu antes de entrar no modo 3D. |
| **00:07 - 00:15** | `frame_0003` a `0004` | **Transição 3D:** Clique em `#enter-world`, fechamento do diálogo de onboarding e ativação da classe `html.mode-3d`. | **Aprovado:** Foco restituído com sucesso ao canvas Three.js. |
| **00:16 - 00:29** | `frame_0005` a `0007` | **Av. Clint Eastwood:** Condução acelerando com teclas WASD pela via principal em direção ao mirante. | **Aprovado:** Carro em movimento fluido pela pista. |
| **00:30 - 00:33** | `frame_0008` | **Vista Homologada Clint Eastwood 1 (`-37, -54`, h=1.430 rad):** Murdoc lunar nítido no céu com disco escuro e busto (projeção: 386x182 px). | **Excelente:** Astro perfeitamente enquadrado acima da avenida. |
| **00:34 - 00:38** | `frame_0009` a `0010` | **Curva com `KeyD`:** Esterçamento à direita. O veículo muda de rumo e o Murdoc lunar sai do enquadramento da câmera. | **Comprovado:** Saída progressiva da lua do frustum visual. |
| **00:39 - 00:50** | `frame_0011` a `0013` | **Curva com `KeyA` e Reta:** Esterçamento à esquerda. O Murdoc lunar reentra no quadro e o carro acelera rumo a Saturnz Barz. | **Comprovado:** Reentrada da lua e aceleração contínua. |
| **00:51 - 01:05** | `frame_0014` a `0016` | **Condução até Saturnz Barz:** Curvas e retas pelas pistas urbanas sem paradas prolongadas. | **Aprovado:** Condução ativa a 60–80 km/h. |
| **01:06 - 01:25** | `frame_0017` a `0021` | **Vista Homologada Saturnz Barz (`-57, -144`, h=2.151 rad):** Murdoc lunar imponente sobre os edifícios de neon (projeção: 971x190 px). | **Excelente:** Visão ampla sob a atmosfera noturna. |
| **01:26 - 01:35** | `frame_0022` a `0024` | **Vista Homologada Song Machine (`-36, -101`, h=1.399 rad):** Murdoc lunar visível entre os quarteirões (projeção: 436x211 px). | **Aprovado:** Astro presente no céu entre os prédios. |
| **01:36 - 01:47** | `frame_0025` a `0027` | **Easter Egg 1 — Aviso dos Zumbis (`-5, -81.2`):** Parada a 3,8 m de distância. Placa *"AVISO: ZUMBIS DO KONG STUDIOS"* perfeitamente legível. | **Excelente:** Texto 100% nítido e legível no centro do quadro. |
| **01:48 - 01:55** | `frame_0028` a `0029` | **Easter Egg 2 — Alce Geométrico (`55, -42`):** Parada a 4,5 m de distância. Alce de 19-2000 no asfalto com galhadas ramificadas. | **Excelente:** Geometria angular e proporções em close. |
| **01:56 - 02:02** | `frame_0030` a `0031` | **Easter Egg 3 — Pôster SAVE US FROM HIM (`103, -110`):** Parada a 3,2 m no morro verde, sem árvores obstruindo a visão. | **Aprovado:** Pôster enquadrado em terreno livre. |
| **02:03 - 02:11** | `frame_0032` a `0033` | **Easter Egg 4 — Trailer Winnebago (`-74.5, -44.5`):** Parada a 4,2 m na rampa da garagem/subsolo mostrando a casinha/trailer. | **Aprovado:** Proximidade adequada na entrada do subsolo. |
| **02:12 - 02:19** | `frame_0034` a `0035` | **Easter Egg 5 — Pôster REJECT FALSE ICONS (`-98, -110`):** Parada a 3,0 m de frente para o mural de alto contraste. | **Aprovado:** Mural em primeiro plano. |
| **02:20 - 02:26** | `frame_0036` a `0037` | **Easter Egg 6 — Pôster PAZUZU (`-95.2, -122`):** Parada a 3,0 m de frente para a placa com estrela alada de Pazuzu da Fase 2. | **Excelente:** Placa *"PAZUZU"* e símbolo alado em alto contraste. |
| **02:27 - 02:33** | `frame_0038` a `0039` | **Buzina [G] e Menu [H]:** Disparo de 3 toques na tecla G (com cooldown de 800 ms) e acionamento de [H] com legenda explicativa. | **Parcialmente auditável:** Disparos acionados; ver limitações técnicas abaixo. |
| **02:34 - 03:06** | `frame_0040` a `0047` | **Câmera em 1ª Pessoa no Cockpit (Tecla V):** Visão interna do piloto v5, mãos enluvadas no volante, painel digital, rádio Kong FM e Murdoc lunar pelo para-brisa. | **Excelente:** Condução manual ativa em 1ª pessoa por 32 s. |
| **03:07 - 03:33** | `frame_0048` a `0053` | **Retorno à 3ª Pessoa e Vista Praça Central Clint 2 (`-16.25, -52.5`):** Retorno suave e parada final com o Murdoc lunar dominante no céu. | **Excelente:** Encerramento cinematográfico aos 213,1 s (3m33s). |

---

## 3. Limitações Conhecidas e Honestidade Técnica

1. **Áudio do Vídeo (Buzina e Motor):**
   - A captura de vídeo nativa do Playwright (`record_video_dir`) grava exclusivamente a renderização WebGL do canvas em formato WebM (VP8). Ela **não captura o subsistema Web Audio API (`AudioContext`)** do navegador.
   - Os toques de buzina acionados via `KeyG` geram de fato os tons sintetizados de 235 Hz -> 185 Hz no navegador durante a execução, mas o arquivo de vídeo gerado é silencioso por limitação da ferramenta de gravação do browser.
2. **Menu de Controles [H]:**
   - O pressionamento da tecla `KeyH` abre o modal de ajuda no DOM, mas devido ao rápido fechamento com `Escape` (4 segundos) e à taxa de amostragem de extração (1 quadro a cada 4 segundos), o frame amostrado calhou exatamente na transição de fechamento.
3. **Ausência de Trechos Parados Longos:**
   - O veículo permaneceu em constante movimento manual com teclas WASD, limitando qualquer parada de contemplação a no máximo 4,2 a 4,5 segundos (estritamente abaixo do limite de 5 s estabelecido).

---

## 4. Matriz de Cumprimento dos Requisitos da Regravação

- [x] **Duração estritamente entre 3 e 5 minutos:** 213,1 segundos = **3 min 33 s** (3,55 min).
- [x] **Murdoc Lunar nitidamente visível no céu:** Confirmado nas vistas homologadas (Clint Eastwood, Saturnz Barz, Song Machine e Praça Central), com disco maior e olhos âmbar recortados no céu.
- [x] **Demonstração de Saída e Reentrada do Astro:** Curva com `KeyD` fazendo o Murdoc lunar sair do campo de visão e posterior curva com `KeyA` reintroduzindo-o.
- [x] **Easter Eggs a curta distância (< 5 m):** Zumbis a 3,8 m (placa legível), Alce a 4,5 m, Save Us a 3,2 m (desobstruído), Trailer Winnebago a 4,2 m, Reject False Icons a 3,0 m e Pazuzu a 3,0 m (placa legível).
- [x] **Condução manual real com WASD:** Carro atingindo velocidades reais de condução, sem modo guiado e sem teleporte de câmera.
- [x] **Câmera em 1ª Pessoa no Cockpit (V):** Condução com visão interna dos instrumentos e do para-brisa frontal.
- [x] **Sufixo `-v2` sem apagar arquivos anteriores:** Arquivos v1 mantidos intactos na pasta.
- [x] **Sem git add/commit/push:** Alterações restritas aos arquivos de evidência em disco.
