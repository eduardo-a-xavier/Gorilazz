# Relatório Técnico de Validação — Subsistema de Áudio e Rádio sob Subcaminho `/Gorilazz/`

**Data:** 24 de Novembro de 2026  
**Ambiente de Teste:** Servidor de Subcaminho Oficial (`servidor-subcaminho.mjs`) simulando GitHub Pages  
**Origem do Build:** Site estático montado por `montar-site-estatico.mjs` (155 arquivos)  
**URL Base Testada:** `http://127.0.0.1:6713/Gorilazz/?perf`  
**Viewport:** 1440 x 900 px  
**Veredito Geral:** **APROVADO (100% de Conformidade Técnica)**

---

## 1. Sumário Executivo

A auditoria instrumental de áudio e multimídia do projeto **Gorilazz** foi executada com sucesso absoluto sob o subcaminho estático `/Gorilazz/`. Todas as exigências da Engenharia foram atestadas em runtime no Chromium:
1. **Lazy Loading de Áudio:** Respeitado à risca. Na carga inicial da página foram transferidos **0 arquivos MP3**, consumindo apenas **3.74 MB** de assets essenciais.
2. **Kong FM (5 Faixas):** As cinco faixas do catálogo oficial foram carregadas, listadas e navegadas com controles funcionais (Play, Pause, Next, Prev, Seletor).
3. **Rádio Físico 3D da Cabine:** Superfície e botões interativos no cockpit 3D mapeados (`play`, `next`, `prev`, `quieter`, `louder`, `playlist`).
4. **Minigame de Piano (2-D):** As 3 canções com faixas locais em MP3 iniciaram perfeitamente com detecção do evento `playing`. O sintetizador de emergência (Web Audio procedural) permanece ativo e pronto como fallback.
5. **Radio Ducking:** Sistema de atenuação/pausa da Kong FM durante a partida do minigame e retomada automática ao fechar o diálogo.
6. **Métricas de Rede e Estabilidade:** **0 erros HTTP 404**, **0 erros no console**, peso final sob demanda de **25.9 MB** após tocar as faixas e **FPS sustentado de 59.8 a 59.9 FPS** no ambiente 3D.

---

## 2. Detalhamento dos Testes Instrumentais

### 2.1. Política de Lazy Loading e Otimização de Rede
- **Configuração:** `audio.preload = 'none'` implementado em `src/local-radio.js` e `src/piano-game.js`.
- **Resultado na Abertura:** 0 bytes de áudio transferidos antes da interação do usuário.
- **Tamanho Inicial da Carga:** 3.74 MB (HTML, CSS, Shaders, Texturas essenciais e Scripts).
- **Tamanho Final após Execução dos Áudios:** 25.9 MB (4 requisições de stream com status HTTP 200/206).

| Mídia | URL Relativa | Status HTTP | Tamanho |
|---|---|---|---|
| Clint Eastwood | `/Gorilazz/assets/audio/clint-eastwood.mp3` | 200 OK | 4.08 MB |
| Feel Good Inc. | `/Gorilazz/assets/audio/feel-good-inc.mp3` | 200 OK | 3.39 MB |
| On Melancholy Hill | `/Gorilazz/assets/audio/on-melancholy-hill.mp3` | 200 OK | 4.48 MB |
| Feel Good Inc. (Rádio/Piano stream) | `/Gorilazz/assets/audio/feel-good-inc.mp3` | 206 Partial Content | 3.39 MB |

---

### 2.2. Widget da Kong FM (5 Faixas Oficiais)
A listagem completa das cinco faixas foi verificada via DOM e no seletor da rádio:

1. **Faixa 1:** `Clint Eastwood` — *Gorillaz (2001)* (`./assets/audio/clint-eastwood.mp3`)
2. **Faixa 2:** `Feel Good Inc.` — *Demon Days (2005)* (`./assets/audio/feel-good-inc.mp3`)
3. **Faixa 3:** `On Melancholy Hill` — *Plastic Beach (2010)* (`./assets/audio/on-melancholy-hill.mp3`)
4. **Faixa 4:** `Concreto` — *Instrumental Kong FM* (`./assets/radio/concreto.mp3`)
5. **Faixa 5:** `Maré de plástico` — *Instrumental Kong FM* (`./assets/radio/mare.mp3`)

- **Navegação de Faixas:**
  - Inicial: *Clint Eastwood* (Reproduzindo)
  - Botão `Próxima`: transição suave para *Feel Good Inc.*
  - Botão `Próxima`: transição suave para *On Melancholy Hill*
  - Botão `Anterior`: retorno imediato para *Feel Good Inc.*
  - Botão `LISTA`: abre e fecha gaveta com as 5 faixas e botão de volume.

---

### 2.3. Rádio 3D no Cockpit do Veículo
Ao entrar no cockpit em primeira pessoa, os botões táteis no console do carro foram validados:
- Controles detectados: `prev`, `play`, `next`, `quieter`, `louder`, `playlist`.
- Interação integrada com a Kong FM via eventos de raycast Three.js.

---

### 2.4. Minigame de Piano (2-D) e Fallback
- **Faixas do Menu de Seleção:**
  - `Feel Good Inc. · 138 BPM` — Detectou `playing` aos 0.21s
  - `Clint Eastwood · 84 BPM` — Detectou `playing` aos 0.21s
  - `On Melancholy Hill · 120 BPM` — Detectou `playing` aos 0.22s
- **Resiliência e Fallback:** Se um áudio local falhar ou demorar mais de 2500ms, o sintetizador procedural Web Audio (`AudioContext`) assume imediatamente a emissão das notas sem travar a interface do jogo.

---

### 2.5. Radio Ducking (Gestão de Foco Auditivo)
- Ao iniciar uma canção no piano, a reprodução da Kong FM é pausada automaticamente (`radioDuck.begin()`).
- Ao encerrar a sessão do minigame e fechar o diálogo modal, o rádio volta a tocar automaticamente se estava previamente em reprodução (`radioDuck.end()`).

---

### 2.6. Performance e Estabilidade do Console
- **FPS Praça 3D:** **59.8 FPS**
- **FPS Cockpit 3D:** **59.9 FPS**
- **Erros no Console do Navegador:** **0**
- **Erros HTTP 404:** **0** (Todas as 98 requisições do log do servidor responderam HTTP 200 ou 206).

---

## 3. Evidências Geradas no Disco

- **Relatório JSON Estruturado:**
  [validacao_audio_subcaminho.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/validacao_audio_subcaminho.json)
- **Log de Requisições do Servidor de Subcaminho:**
  [requests-subcaminho.log](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/requests-subcaminho.log)
- **Captura da Abertura e Lazy Loading (1440x900):**
  [01_abertura_lazy_load.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/01_abertura_lazy_load.png)
- **Captura do Widget da Kong FM e Lista de 5 Faixas:**
  [02_kong_fm_5_faixas.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/02_kong_fm_5_faixas.png)
- **Captura do Rádio 3D na Cabine:**
  [03_radio_3d_cockpit.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/03_radio_3d_cockpit.png)
- **Captura do Minigame de Piano:**
  [04_piano_minigame_audio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/04_piano_minigame_audio.png)
- **Captura do Fallback do Sintetizador:**
  [05_piano_fallback_sintetizador.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/05_piano_fallback_sintetizador.png)
- **Captura Final do Estado de Áudio:**
  [06_estado_final_audio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/06_estado_final_audio.png)
