# Relatório Técnico: Fallback Sintetizado e Latência do Relógio de Notas

**Data:** 24 de Novembro de 2026 — 18:27:29  
**Ambiente:** Servidor de Subcaminho Oficial (`/Gorilazz/`), Headless Chromium (1440x900)  
**Flags de Não-Throttling:** `--disable-renderer-backgrounding --disable-backgrounding-occluded-windows --disable-background-timer-throttling --use-angle=d3d11 --ignore-gpu-blocklist`  
**Veredito:** **APROVADO (100% Conforme)**

---

## 1. Bloqueio Proposital de MP3 e Prova de Fallback Sintetizado
- **Mecanismo de Teste:** As requisições para `assets/audio/feel-good-inc.mp3` foram interceptadas via Playwright e abortadas intencionalmente (`net::ERR_BLOCKED_BY_CLIENT`).
- **Comportamento da Aplicação:** O elemento `<audio>` acionou o handler de falha `recording.onerror` / `catch()`, disparando imediatamente a rotina `launch(false)` sem travar a interface.
- **Ativação do Web Audio API Procedural:** O sintetizador de emergência assumiu a emissão sonora via osciladores senoidais, triangulares e ruídos com envelope exponencial agendados pelo `AudioContext`.
- **Interação e Pontuação:** Teclas 'D' e 'K' registraram feedback visual imediato (`ERRO: tecla errada`), provando que a partida permaneceu ativa e julgando toques normalmente.
- **Estabilidade:** **0 erros de código / exceções não tratadas**.

---

## 2. Medição da Latência (Evento `playing` -> Relógio das Notas)
- **Método Utilizado:** Instrumentação via timestamp no evento DOM `HTMLMediaElement.onplaying` até o callback seguinte de `requestAnimationFrame` que executa `now()` e `run.tick()`.
- **Latência Aferida:** **16.6 ms** (equivalente a 1 frame a 60 Hz).
- **Meta Exigida:** **< 80 ms**
- **Status:** **APROVADO** com folga técnica considerável.

---

## 3. Esclarecimento Técnico: Início do Relógio vs. Som Físico Efetivo
A métrica aferida pelo teste de software mede estritamente o **INÍCIO DO RELÓGIO DE SOFTWARE** (o intervalo em milissegundos entre o disparo do evento DOM `playing` da mídia e a execução do callback `requestAnimationFrame` que inicia o cálculo temporal e a descida visual das notas no canvas).

Ela **NÃO mede o som físico emitido pelas caixas acústicas ou fones de ouvido** no mundo real (latência acústica de saída do hardware / DAC), que depende dos buffers do driver de áudio do sistema operacional (WASAPI shared mode no Windows, tipicamente adicionando de 15 a 45 ms), a qual é imperceptível para o gameplay e inatingível via JavaScript puro sem microfone externo ou dispositivo físico de loopback acústico.

---

## 4. Evidências Geradas no Disco
- [validacao_fallback_latencia.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/validacao_fallback_latencia.json)
- [07_piano_fallback_sintetizador_bloqueio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/07_piano_fallback_sintetizador_bloqueio.png)
- [08_piano_latencia_relogio.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/08_piano_latencia_relogio.png)
