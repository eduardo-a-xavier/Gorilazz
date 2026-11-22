# Relatório de Validação QA — Lote da Engenharia (Gorilazz A3)

- **Data / Hora:** 2026-11-21 01:20–01:34 (America/Sao_Paulo)
- **Repositório:** `E:\Gorilazz-Relatorio` (modo somente-auditoria; nenhum código-fonte alterado; sem `git add`/`commit`/`push`)
- **Ambiente:** Navegador real Chromium via Playwright + WebGL2 (ANGLE D3D11), servidor dedicado `node server.mjs` na porta `3118` (`0` conexões residuais ao final; `0` `blender.exe`)
- **Suíte Automatizada:** `npm run check` (**exit 0**, 28 módulos verificados) · `npm test` **103/103 PASS** (`0 fail`, `0 skipped`, `3174.77 ms`)
- **Veredito Geral:** **APROVADO** (Todos os 5 itens A, B, C, D e E atendem integralmente aos requisitos de qualidade, sem regressões, com 0 erros de console, 0 erros HTTP e taxa de quadros estável entre 60.4 e 60.6 FPS).

---

## 1. Veredito Consolidado por Item

| Item | Veredito | Resumo das Medições em Navegador Real |
|---|---|---|
| **A) Onboarding (1.1)** | **APROVADO** | Boas-vindas abre automaticamente na 1ª visita limpa (`#onboarding-dialog[open]`), fecha com `Escape`; `localStorage` persiste estado de opt-out/welcomed e bloqueia reabertura no recarregamento; atalhos `H` e `F1` reabrem a ajuda com foco no diálogo; acessibilidade confirmada (`role="dialog"`, `aria-labelledby="onboarding-title"`, `aria-describedby="onboarding-intro"`, foco inicial em `#onboarding-start`); polimentos CSS validados (`letter-spacing: 0.9px` / `0.03em` no `h2`, `align-self: start` em `.onboarding-keys dt`); dicas de condução sem sobreposição com minimapa ou rádio nos viewports `1440×900`, `390×844` e `320×568` (`overlap = false`). |
| **B) Fliperama (3.2)** | **APROVADO** | Máquina 3D visível perto de Kong Studios nas coordenadas `(-10, -10)` com marquise e tela emissiva; prompt `#interact` (`E / JOGAR FLIPERAMA`) aparece somente com aproximação (< 9 m) e carro parado; tecla `E` abre `#arcade-dialog[open]` pausando o veículo; jogo funcional com teclado (WASD / setas) e D-pad de toque no mobile (`390×844`); tecla `P` pausa ("PAUSA · P para continuar"); tecla `Escape` encerra a partida e devolve a condução com o Geep parado; fantasmas autorais com cores e rostos próprios dos 4 integrantes (2-D, Murdoc, Noodle, Russel) e Geep como jogador no canvas 510×390; zero erros de console ou runtime. |
| **C) Otimização (3.3)** | **APROVADO** | Redução do peso transferido na carga inicial: compressão gzip em 5 arquivos GLB (`kong-studio`, `broadleaf-tree`, `driver-pilot`, `gorillaz-geep`, `gorillaz-phase7-web`) e migração para 12 texturas WebP lossless; fallback PNG testado e aprovado com WebP bloqueado (piloto GLB e Geep carregam normalmente sem erros); taxa de quadros superior à meta (`FPS >= 50`) nos 3 pontos da cidade: **Kong Studios (60.6 FPS)**, **Bairro dos Murais (60.4 FPS)** e **Mirante do Moinho (60.6 FPS)**; draw calls estáveis em ~314 chamadas / 252.517 triângulos; sem regressões na câmera, 1ª pessoa (`V`), banda, fauna (56 aves) ou mapa `M`. |
| **D) Integração 1.4** | **APROVADO** | Fonte Anton carregada com sucesso (`document.fonts.check('16px Anton') = true`) sem nenhum erro 404; rotas de fontes e pôsteres das 9 paradas e 5 descobertas integradas com tipografia de cartaz nos diálogos; **`0` erros HTTP `>= 400`** e **`0` `console.error`** ao navegar por todas as 8 eras, 9 paradas e descobertas em `1440×900`, `390×844` e `320×568`. |
| **E) Geral** | **APROVADO** | **`0` overflow horizontal** confirmado nos 3 viewports (`1440×900`, `390×844`, `320×568`, com `scrollWidth === innerWidth`); **`0` referências à Wikipédia** em todo o código e conteúdo; arquivos de créditos e referências rigorosamente preservados (`README.md`, `REFERENCES.md`, `DRIVER-CREDITS.txt`, `ANTON-OFL.txt`, `GEEP-CREDITS.txt`). |

---

## 2. Detalhamento Técnico das Verificações

### A) Onboarding (1.1)
- **Primeira entrada:** Sem dados em `localStorage`, o diálogo `#onboarding-dialog` abre com foco automático em `#onboarding-start`. Pressionar `Escape` fecha o diálogo de forma instantânea.
- **Ajuda por tecla:** Teclas `H` e `F1` abrem o diálogo de ajuda a qualquer momento durante a condução.
- **Opt-out:** O checkbox `#onboarding-optout` ("Não mostrar dicas nas próximas visitas") persiste em `localStorage.getItem('gorilazz-onboarding')`. Ao recarregar a página, as boas-vindas não reaparecem.
- **Tipografia e CSS:** Validado que `#onboarding-dialog h2` possui `letter-spacing: 0.9px` (equivalente a `.03em` sobre fonte base de 30px) e os termos de tecla `.onboarding-keys dt` utilizam `align-self: start`.
- **Dicas contextuais:** O elemento `#onboarding-tip` foi medido em `1440×900`, `390×844` e `320×568`, registrando `0` colisões com `.mini-map` e `#road-radio`.

### B) Fliperama (3.2)
- **Presença no mundo:** O gabinete 3D do fliperama situa-se em `(-10, -10)` ao sul de Kong Studios, com volume ampliado (1,8 × 3,6 m), anel no chão e letreiro luminoso. Capturas em ângulo aproximado e distante comprovam sua integração harmoniosa ao cenário.
- **Interação:** O botão `#interact` apresenta o texto `E / JOGAR FLIPERAMA` exclusivamente quando o Geep se aproxima a menos de 9 metros da máquina e a velocidade é inferior a 2 km/h.
- **Partida e Minigame:** Ao acionar `E` ou clicar no prompt, `#arcade-dialog` abre modalmente e pausa o loop de condução. Clicar em "Jogar" inicia o labirinto 17×13 no canvas 510×390. O jogador controla o Geep em vista superior através do teclado (WASD ou setas) ou via D-pad de toque (`.arcade-pad`) no mobile.
- **Fantasmas:** 4 fantasmas autorais com traços e paletas dos integrantes da banda:
  - 2-D: franja azul e corpo ondulado
  - Murdoc: pele verde e cabelo preto
  - Noodle: franja rosa
  - Russel: pele marrom e olhos estilizados
- **Pausa e Saída:** Tecla `P` alterna a mensagem "PAUSA · P para continuar". Tecla `Escape` encerra o jogo limpamente, fechando o diálogo e devolvendo o foco ao veículo, que permanece devidamente parado e pronto para dirigir.

### C) Otimização Web e Fallback (3.3)
- **Transferência:**
  - Redução de tamanho com compressão gzip ativa para GLBs em `server.mjs`.
  - 12 texturas de materiais servidas em formato WebP lossless com status 200.
- **Resiliência do Fallback PNG:** Ao interceptar e abortar todas as requisições `*.webp`, o módulo `src/materials.js` acionou o fallback automático para `*.png`. O veículo e o piloto GLB carregaram com sucesso (`pilot = "glb"`, `vehicle_loaded = "true"`) e `0` erros de página.
- **FPS e Draw Calls:**
  - Kong Studios: **60.6 FPS** · 314 draw calls · 252.517 triângulos
  - Bairro dos Murais: **60.4 FPS** · 314 draw calls · 252.517 triângulos
  - Mirante do Moinho: **60.6 FPS** · 314 draw calls · 252.517 triângulos
  *(Todos superando com folga a meta de 50 FPS)*.

### D) Integração da Tipografia Anton e Pôsteres (1.4)
- **Tipografia:** A fonte Anton foi validada como ativa via `document.fonts.check('16px Anton') = true` nos viewports de desktop e mobile.
- **Rotas de Servidor:** Servidas sem falhas em `server.mjs` com cabeçalhos MIME corretos (`font/woff2`, `font/ttf`).
- **Pôsteres:** Paradas temáticas e descobertas exibem tipografia de cartaz destacada, sem corte e com fundo gradiente nas capas oficiais.
- **Console & Rede:** Zero requisições com código `>= 400` e zero registros de `console.error`.

### E) Geral e Conformidade
- **Responsividade:** Nenhum vazamento de rolagem horizontal detectado (`scrollWidth === innerWidth` em `1440×900`, `390×844` e `320×568`).
- **Autenticidade de Fontes:** Todas as referências e links da Wikipédia foram removidos do código e substituídos por páginas oficiais e canais verificados de Gorillaz.
- **Atribuições:** Preservadas em conformidade com as licenças Creative Commons CC-BY 4.0 (Shabaev), CC0 1.0 (Quaternius, Kenney) e SIL OFL (Anton).

---

## 3. Inventário de Evidências

Pasta de evidências: `E:\Gorilazz-Relatorio\docs\gestao\evidencias\lote-qa-2026-11-21\`

- `qa-lote-relatorio.md` — Relatório formal consolidado de QA
- `qa-lote-metrics.json` — Telemetria de rede, FPS, bounding boxes e draw calls
- `qa-lote-a1-boas-vindas-1440.png` — Diálogo de boas-vindas do onboarding na 1ª visita (`1440×900`)
- `qa-lote-a4-ajuda-h.png` — Ajuda de atalhos reaberta via tecla `H`
- `qa-lote-a-dica-1440x900.png` — Dica contextual de condução em desktop
- `qa-lote-a-dica-390x844.png` — Dica contextual em mobile sem sobreposição
- `qa-lote-a-dica-320x568.png` — Dica contextual em tela ultra-estreita
- `qa-lote-b1-fliperama-aproximado.png` — Visão 3D aproximada do gabinete Kong Arcade e Geep
- `qa-lote-b2-fliperama-distante.png` — Visão 3D da área de Kong Studios com o gabinete ao fundo
- `qa-lote-b3-arcade-jogo-desktop.png` — Partida ativa no canvas 510×390 com fantasmas autorais
- `qa-lote-b5-arcade-gameplay.png` — Gameplay e movimentação do labirinto
- `qa-lote-b6-arcade-mobile-dpad.png` — Controles D-pad de toque em `390×844`
- `qa-lote-c1-materiais-webp.png` — Renderização em WebGL2 com materiais WebP ativos
- `qa-lote-c2-fallback-png.png` — Fallback PNG comprovado com WebP bloqueado
- `qa-lote-d1-poster-parada.png` — Diálogo temático de parada com tipografia Anton estilizada
