# Relatório Final de Auditoria QA — Gorilazz A3 (Entrega Integrada)

- **Data / Hora da Auditoria Inicial:** 2026-11-20 17:12–17:18 (America/Sao_Paulo) — Veredito inicial: `REPROVADO` (2 P1 mobile + 2 P2)
- **Data / Hora da Reauditoria Final:** 2026-11-20 17:29–17:32 (America/Sao_Paulo)
- **Repositório auditado:** `E:\Gorilazz-Relatorio` (modo somente-auditoria; nenhum código-fonte alterado pelo QA; sem commit/push)
- **Servidor dedicado:** `node server.mjs` em `PORT=3115` (`http://127.0.0.1:3115`) — encerrado ao final (`0` processos residuais na porta `3115`, `0` processos `blender.exe`)
- **Ambiente de execução:** Chromium real via Playwright + WebGL2 (ANGLE/D3D11) + Node.js (`npm run check` e `npm test`)
- **Veredito Final:** **APROVADO** — Todos os 6 critérios obrigatórios e todos os 4 achados da rodada inicial (2 P1 mobile + 2 P2) foram corrigidos pela Engenharia e revalidados com sucesso em execução real.

---

## 1. Resumo de Métricas por Critério (Estado Final Revalidado)

| # | Critério | Status Final | Métricas / Evidências Observadas |
|---|----------|--------------|----------------------------------|
| 1 | **Console & Rede** | **APROVADO** | `console.error = 0`; `pageerror = 0`; `status >= 400 = 0` em todas as **65/65** rotas locais de `server.mjs`. HTTP **200** confirmado no browser e por GET direto em `/assets/models/driver-pilot.glb` (188.920 B), `/assets/models/DRIVER-CREDITS.txt` (1.507 B) e `/src/pilot-rig.js` (1.990 B). |
| 2 | **Piloto + Geep ao vivo (Three.js + WebGL2)** | **APROVADO** | `dataset.pilot === "glb"`, `dataset.model === "geep"`, `dataset.wheels === "4"`. Carregamento real com `16` primitivas `SkinnedMesh` (6 malhas GLTF / `1.526` tris / `65` ossos), `Driving_Loop` ativo em runtime (`Δq`: `Head=0.006879`, `upperarm_l=0.014975`), reação ao clique confirmada (`Head=14.4°`), 1ª pessoa (`V`) com `driver.visible === false`. **Posição calibrada preservada após carga do Geep:** `driver.position = (-0.6213, 0.208, 0.4471)` (`exactMatch: true`). Inspeção visual em `y = 0.208` confirma piloto assentado no banco, mãos nas luvas alinhadas ao volante, barra contínua na cintura, zero vazamento no chassi/assoalho e zero Z-fighting. |
| 3 | **Pistas e Cruzamentos** | **APROVADO** | Vista elevada, rotatória central (Nó 7, grau 4) e nós de grau 2 (Nós 0, 2 e 4): zero pintura amarela falsa nos nós 0/2/4, zero calçadas invadindo asfalto ou cruzamentos, zero sobreposição fora dos discos de cruzamento, 100% normais `+Y (> 0.99)` e zero pistas flutuantes. |
| 4 | **Câmera (Telemetria ao vivo)** | **APROVADO** | **4/4 `ERA_GATES`** atravessados sem parede invisível (`min_dist_to_gate`: Ato 1 `0.27 m`, Ato 2 `0.02 m`, Ato 3 `0.27 m`, Ato 4 `0.01 m`). Ré curta (`-4.17 m/s`, `91` quadros em ré) com `max_yaw_delta = 3.15°/quadro` e **zero flip de 180°**. Contorno de quarteirões/prédios: `0/275` quadros com clipping (`min_cam_y = 7.18 m`, `max_jump = 1.334 m`). Salto máximo global: `2.981 m` (~`72 km/h`). |
| 5 | **Parte Inferior & Garagem (Desktop + Mobile)** | **APROVADO** | **Desktop `1440×900` e `1920×1080`:** `overflow = 0` (`1440/1440`, `1920/1920`), `h1–h6` vazios `= 0`, `0` links/menções Wikipédia em toda a página e nas 9 paradas / 8 eras; `.reference-grid` simétrico em 4 colunas (`301×592 px` em 1440; `339×579 px` em 1920); créditos visíveis Quaternius CC0 + `./assets/models/DRIVER-CREDITS.txt` (HTTP 200) e `https://mola-zone.com/` (Yamê); **100% aderente aos tokens e tipografia de `DESIGN.md`** (`--blue: #7fa6ff`, `--black: #111415`, `--surface: #181d20`, `--surface-raised: #20272b`, `--cream: #e9e4d4`, `--muted: #a9aaa3`, `--pink: #f5a9c6`, `--acid: #d2e2a8`). **Mobile `390×844` e `320×568`:** `documentElement.scrollWidth <= innerWidth` e `document.body.scrollWidth <= innerWidth` (`390/390` e `320/320`); `.world-manifesto` contido (`351/351` e `288/288`); **5/5 links `.content-shortcuts`** visíveis e clicáveis dentro da viewport (`44 px`); `#modelos`, `.garage-bento`, `.garage-hero`, `.garage-telemetry` e `.garage-specs` com `scrollWidth === clientWidth` (`321/321` e `319/319` em 390; `258/258` e `256/256` em 320) e zero texto/botão cortado à direita. *(Nota não bloqueante: `#backstage` reporta `+5 px` de `scrollWidth` interno — `354` vs `349` em 390 e `291` vs `286` em 320 — devido à rotação `rotate(45deg)` do ícone `+` no `<summary>`, sem cortar texto ou afetar a largura da página).* |
| 6 | **Suíte Automatizada** | **APROVADO** | `npm run check`: `exit 0` (todos os 23 módulos JS/MJS válidos). `npm test`: **63/63 PASS**, `0 fail`, `0 skipped`, `duration_ms = 1977.64 ms` (incluindo novo teste de regressão `installVehicle preserva a posição calibrada do piloto GLB quando o Geep carrega depois (if (!pilotRig))`). |

---

## 2. Verificação de Fechamento dos 4 Achados da Rodada Inicial

| ID | Severidade | Achado Inicial | Status na Reauditoria | Evidência de Fechamento |
|----|------------|----------------|-----------------------|-------------------------|
| Bug 1 | **P1** | `.world-manifesto` / `.manifesto-marquee` estourando para `3902 px` no mobile (`body.scrollWidth = 3922`/`3918`, `.content-shortcuts` fora da tela) | **CORRIGIDO E APROVADO** | `390×844`: `docSW=390`, `bodySW=390`, `.world-manifesto=351/351`, 5/5 links `left: 19.5..236.7`, `right: 105.3..337.4`. `320×568`: `docSW=320`, `bodySW=320`, `.world-manifesto=288/288`, 5/5 links `left: 16..132`, `right: 116.6..225.2`. Capturas: `mobile-390-manifesto.png`, `mobile-320-manifesto.png`. |
| Bug 2 | **P1** | Corte horizontal de `76 px` nos cartões da Garagem (`#modelos`) em `320×568` (`326 px` em container de `250 px`) | **CORRIGIDO E APROVADO** | `320×568`: `#modelos` `258/258`, `.garage-bento` `258/258`, `.garage-hero` `256/256`, `.garage-telemetry` `256/256`, `.garage-specs` `256/256`. `390×844`: `#modelos` `321/321`, `.garage-bento` `321/321`, cards `319/319`. Inspeção visual sem cortes: `mobile-320-garagem.png`, `mobile-390-garagem.png`, `mobile-320-referencias.png`, `mobile-390-referencias.png`. |
| Bug 3 | **P2** | Race condition em `src/scene.js:641` sobrescrevendo `driver.position` para `(-0.6213, 0.3639, 0.4153)` (`+15,6 cm` em Y) | **CORRIGIDO E APROVADO** | Runtime WebGL2 pós-carga de Geep + Piloto: `driver.position = [-0.6213, 0.208, 0.4471]` (`exactMatch: true`). Capturas `piloto-04-3quartos-frontal.png`, `piloto-05-lateral.png` e `piloto-06-chassi-lateral-baixo.png` confirmam encaixe perfeito no banco, mãos no volante, zero vazamento no chassi e zero Z-fighting. Teste unitário dedicado adicionado (`63/63 PASS`). |
| Bug 4 | **P2** | Token `--blue` computado como `#3a68d8` em vez de `#7fa6ff` (`DESIGN.md:19`) | **CORRIGIDO E APROVADO** | `getComputedStyle(document.documentElement).getPropertyValue('--blue').trim() === '#7fa6ff'`. |

**Bugs abertos (P0/P1/P2):** Nenhum (`0`).

---

## 3. Detalhamento da Telemetria de Câmera (Execução Real WebGL)

Arquivo salvo: `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-telemetria.json`

| Cenário | Quadros | Dist. Mín. ao Portal | Veloc. Máx/Mín | Reach (m) | Altura Y Mín (m) | Salto Máx / Quadro (m) | Resultado |
|---------|---------|----------------------|----------------|-----------|------------------|------------------------|-----------|
| Portal Ato 1 (`A explosão`) | 151 | `0.27 m` | `20.15 m/s` | `10.76–30.27` | `8.80` | `0.916` | Atravessado sem parede invisível |
| Portal Ato 2 (`O auge ambicioso`) | 154 | `0.02 m` | `20.36 m/s` | `9.26–30.47` | `11.69` | `2.794` | Atravessado sem parede invisível |
| Portal Ato 3 (`A briga e o hiato`) | 148 | `0.27 m` | `20.05 m/s` | `18.83–30.33` | `11.69` | `2.981` | Atravessado sem parede invisível |
| Portal Ato 4 (`A reinvenção`) | 153 | `0.01 m` | `20.46 m/s` | `24.84–30.47` | `11.69` | `1.918` | Atravessado sem parede invisível |
| Manobra de ré curta | 202 (91 em ré) | — | `-4.17 m/s` (`-15 km/h`) | — | — | `1.515` | `max_yaw_delta = 3.15°/quadro`, **0 flip 180°** |
| Contorno de quarteirões/prédios | 275 | — | — | `12.03–27.87` | `7.18` | `1.334` | **0/275** quadros de clipping em prédios |

---

## 4. Saída Exata da Suíte Automatizada (Reauditoria Final)

### `npm run check`
```text
> gorilazz-a-estrada@1.0.0 check
> node --check server.mjs && node --check src/app.js && node --check src/city.js && node --check src/cabin.js && node --check src/scene.js && node --check src/route.js && node --check src/world-data.js && node --check src/driving.js && node --check src/input.js && node --check src/local-radio.js && node --check src/journey-guide.js && node --check src/discoveries.js && node --check src/navigation.js && node --check src/content.js && node --check src/progress.js && node --check src/environment.js && node --check src/materials.js && node --check src/atmosphere.js && node --check src/postfx.js && node --check src/roads.js && node --check src/band-pose.js && node --check src/pilot-rig.js && node --check src/landmarks.js
(exit code 0)
```

### `npm test`
```text
> gorilazz-a-estrada@1.0.0 test
> node --test tests/*.test.mjs

ℹ tests 63
ℹ suites 0
ℹ pass 63
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1977.6404
```

---

## 5. Inventário Completo de Evidências Salvas

Pasta: `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\`

### Relatório e Dados Estruturados
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\qa-final-relatorio.md` *(atualizado na reauditoria)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\audit-metrics.json` *(atualizado na reauditoria)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-telemetria.json`

### Screenshots — Piloto + Geep (Three.js + WebGL2)
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-01-traseira-3pessoa.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-02-direcao-estercada-3pessoa.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-03-direcao-estercada-closeup.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-04-3quartos-frontal.png` *(atualizado em `y=0.208`)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-05-lateral.png` *(atualizado em `y=0.208`)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-06-chassi-lateral-baixo.png` *(atualizado em `y=0.208`)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\piloto-07-primeira-pessoa.png`

### Screenshots — Pistas e Cruzamentos
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\pistas-01-vista-elevada.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\pistas-02-rotatoria-no7.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\pistas-03-no0-grau2.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\pistas-03-no2-grau2.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\pistas-03-no4-grau2.png`

### Screenshots — Câmera (Portais, Ré e Curvas em Quarteirões)
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-portal-ato1.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-portal-ato2.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-portal-ato3.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-portal-ato4.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-manobra-re.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-curva-quarteirao-1.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\camera-curva-quarteirao-2.png`

### Screenshots — Parte Inferior, Garagem, Referências e Mobile
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1440-banda.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1440-garagem-geep.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1440-garagem-piloto-tab.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1440-referencias-creditos.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1920-garagem.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\layout-1920-referencias-creditos.png`
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-390-manifesto.png` *(novo)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-390-garagem.png` *(atualizado)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-390-referencias.png` *(atualizado)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-320-manifesto.png` *(novo)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-320-garagem.png` *(atualizado)*
- `E:\Gorilazz-Relatorio\docs\gestao\evidencias\entrega-final-2026-11-20\mobile-320-referencias.png` *(atualizado)*

---

## 6. Limitações Externas (Não Auditáveis Localmente)
- Teste em dispositivo Android físico real (toque, teclado virtual, GPU móvel real).
- Teste com leitor de tela real (NVDA/TalkBack/VoiceOver).
- Verificação em URL pública HTTPS após deploy e `git commit`/`git push` (autor exclusivo: Eduardo).
