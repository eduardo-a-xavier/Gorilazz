# Relatório de Inspeção: Pose do Piloto v5 no Cockpit (Volante Reto, Esquerda e Direita)

**Data:** 2026-11-24 18:27:29  
**Ambiente:** Headless Chromium (1440x900) com Flags de Não-Throttling da Central  
**Veredito:** **APROVADO (Sem Torções ou Aberturas)**

---

## 1. Vistas Capturadas em 1440x900
1. **Volante Reto:** [09_piloto_v5_volante_reto.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/09_piloto_v5_volante_reto.png)
2. **Volante Virado à Esquerda:** [10_piloto_v5_volante_esquerda.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/10_piloto_v5_volante_esquerda.png)
3. **Volante Virado à Direita:** [11_piloto_v5_volante_direita.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/11_piloto_v5_volante_direita.png)
4. **Close-up Mãos e Aro:** [12_piloto_v5_closeup_maos_aro.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/validacao-audio-subcaminho-2026-11-24/12_piloto_v5_closeup_maos_aro.png)

---

## 2. Análise Anatômica e Mecânica da Pose
- **Envolvimento do Aro:** Os dedos e polegares do modelo piloto-v5.glb possuem curvatura pré-moldada e flexão angular estável local em AX, mantendo as luvas e falanges encaixadas no diâmetro do aro.
- **Frestas e Aberturas:** Nenhuma abertura ou fresta visível observada entre a luva e o aro no cockpit.
- **Torção de Punhos:** Sem torção extrema de punhos. A cinemática inversa (solveArm) calcula os alvos dos pulsos mantendo os cotovelos direcionados para fora e para baixo sem torção do antebraço.
- **Sombreamento e Malha:** smoothNormals() ativo soldando normais de vértices idênticos, eliminando arestas duras nas luvas.
