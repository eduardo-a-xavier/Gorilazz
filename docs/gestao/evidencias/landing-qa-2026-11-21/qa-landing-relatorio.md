# Relatório de Auditoria e Validação Técnica — Landing Page

**Data:** 21/11/2026  
**Auditor:** Antigravity (QA Independente — OpenBot Teammate)  
**Projeto:** Gorilazz — The Road / An Interactive World (`E:\Gorilazz-Relatorio`)  
**Ambiente de Testes:** Navegador Real Chromium / Playwright com WebGL2 (`--use-gl=angle`, `--use-angle=d3d11`), Porta Dedicada 3119 e Servidor Limpo  
**Veredito Global:** **APROVADO (100%)**

---

## 1. Sumário Executivo

A auditoria independente inspecionou e validou exaustivamente todos os 9 grupos de requisitos da nova **Landing Page** do projeto *Gorilazz*. As verificações cobriram a experiência interativa do Hero, a paginação e responsividade das 8 eras históricas, a galeria de capas de álbuns, a persistência de rota e telemetria na HUD de condução, a ancoragem do botão fixo de entrada no 3D, o player inline da rádio com animações no vinil e espectro, a ausência total de regressões nos minigames e mapa tático, além do desempenho medido com taxa estável de **61 FPS**.

A suíte completa de testes automatizados do repositório foi executada, registrando **116/116 testes aprovados** (0 falhas) em 3.85 segundos, e a verificação estática de sintaxe de todos os módulos (`npm run check`) encerrou com código 0.

---

## 2. Matriz de Conformidade por Requisito

| Item | Requisito / Componente | Critérios de Avaliação | Resultado | Veredito |
| :--- | :--- | :--- | :--- | :---: |
| **01** | **Hero Actions** | "Quero dirigir" e "Passeio guiado" entram no 3D; "Prefiro conhecer a história" rola até `#eras` | Transições ativas; `#jogo[data-entered="true"]`; `#tour-toggle` ativo; rolagem suave até `#eras` (top < 50px). | **APROVADO** |
| **02** | **8 Eras & Capas Oficiais** | Troca de número, texto e capa (nítida 340px + fundo borrado + créditos) em 1440×900, 390×844 e 320×568 | 8 eras completas com dados históricos e fictícios; capa preenchendo quadro sem área vazia; proporções e opacidade 1.0. | **APROVADO** |
| **03** | **Paginação de Eras** | `#prev-era` desabilitado na 01 e `#next-era` na 08; gap de 12px; estilo desabilitado | `aria-disabled="true"`, `opacity: 0.4`, `cursor: not-allowed`, `pointer-events: none`; sem loop infinito nas pontas. | **APROVADO** |
| **04** | **Faixa de 8 Capas** | Faixa "8 ERAS · 1998–2023" com miniaturas funcionais | 8 botões com imagens carregadas (600px naturalWidth); clique em qualquer miniatura seleciona a era exata com `aria-current`. | **APROVADO** |
| **05** | **Explorar Parada & HUD** | Clique em "EXPLORAR" abre 3D e mostra "A caminho <parada>" por ≥ 4s com boas-vindas | Validado para 2005 ("A paisagem de Demon Days") e 2010 ("Um som sem fronteiras"); carro acelera (>8 km/h) e distância reduz. | **APROVADO** |
| **06** | **Botão Fixo 3D & Navbar** | Botão fixo surge fora do 3D e some no mundo; logo volta ao topo; links navegam suavemente | Botão surge ao rolar (`scrollY > 600`), leva ao 3D e foca cena; logo leva a `scrollY = 0`; 4 links com âncoras válidas. | **APROVADO** |
| **07** | **Grid Mobile < 700px** | Menu de eras em 2 colunas abaixo de 700px sem overflow horizontal nem texto cortado | Testado em `390×844` e `320×568`: 2 colunas de larguras iguais; `overflow = 0`; `overflow-wrap: anywhere` ativo. | **APROVADO** |
| **08** | **Rádio da Landing** | Clipe inline `youtube-nocookie`, vinil girando, equalizador animado, link real e fallback | Iframe inline seguro; classes de animação `landing-spin` e `landing-eq`; link externo real; fechamento reverte estado. | **APROVADO** |
| **09** | **Integridade & Não-Regressão** | 0 erros de console, 0 HTTP ≥ 400, FPS ≥ 50, mapa tático `M` e fliperama funcionais | 0 `console.error`; 0 requisições HTTP 4xx/5xx; **61 FPS** estável; mapa abre/fecha com `M`/`Esc`; fliperama abre em `(-10,-10)`. | **APROVADO** |

---

## 3. Detalhamento Técnico das Verificações

### 3.1. Hero Actions (Item 01)
- O botão `#enter-world` ("Quero dirigir") aciona a transição imediata para o universo 3D, definindo `#jogo[data-entered="true"]` e liberando o controle do Geep.
- O botão `#start-guided` ("Fazer um passeio guiado") inicia o modo guiado autônomo com `#tour-toggle[aria-pressed="true"]`, conduzindo o veículo pelos pontos de parada sem necessidade de intervenção do usuário.
- O link textual `.entry-reading` ("Prefiro conhecer a história") executa a rolagem suave diretamente para a seção editorial `#eras` (`scrollY` de 1289px, posicionando `#eras` no topo da viewport a 43.8px de offset).
- **Evidência:** [01-hero-actions-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/01-hero-actions-1440x900.png)

### 3.2. 8 Eras Musicais e Composição da Capa (Itens 02 e 07)
- Todas as 8 eras (1998–2001 Gorillaz, 2005 Demon Days, 2010 Plastic Beach, 2010–2011 The Fall, 2017 Humanz, 2018 The Now Now, 2020 Song Machine e 2023 Cracker Island) foram auditadas individualmente.
- O contador `#era-counter` atualiza fidedignamente de `01 / 08` a `08 / 08`.
- A moldura `#era-cover`:
  - **1440×900 (Desktop):** O container mede 1178.8 × 344 px. A imagem nítida à esquerda ocupa 340 × 340 px com `object-fit: cover` e fade suave (`opacity: 1`, classe `.is-ready`). O fundo é preenchido pela variável CSS `--era-cover-url` estilizada com `filter: blur(24px) saturate(1.15) brightness(.42)`. A legenda à direita acomoda perfeitamente a tag (`.era-cover-kicker`) e o crédito oficial com licença e indicação acadêmica (`.era-cover-credit`), sem qualquer espaço vazio ou quebra de grid.
  - **390×844 e 320×568 (Mobile):** A moldura transiciona para layout vertical de 1 coluna (`1fr`), preservando a capa quadrada com `aspect-ratio: 1 / 1` (313px no iPhone 12 e 250px no iPhone SE).
  - O menu de seleção `#era-menu` divide-se em exatamente 2 colunas proporcionais (2× 170.5px no viewport 390px e 2× 139px no viewport 320px), registrando **0 pixels de overflow horizontal** (`scrollWidth === clientWidth`) e texto íntegro com `overflow-wrap: anywhere`.
- **Evidências:**
  - [02-eras-cover-demon-days-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/02-eras-cover-demon-days-1440x900.png)
  - [08-eras-mobile-2cols-390x844.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/08-eras-mobile-2cols-390x844.png)
  - [09-eras-mobile-2cols-320x568.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/09-eras-mobile-2cols-320x568.png)

### 3.3. Paginação e Faixa de Miniaturas (Itens 03 e 04)
- **Extremidade Inicial (Era 01 / 08):** O botão `#prev-era` ("← Era anterior") apresenta estado `disabled = true`, atributo `aria-disabled="true"`, `opacity: 0.4`, `cursor: not-allowed` e `pointer-events: none`. O botão `#next-era` permanece habilitado com `cursor: pointer`.
- **Extremidade Final (Era 08 / 08):** O botão `#next-era` ("Próxima era →") apresenta `disabled = true`, `aria-disabled="true"`, `opacity: 0.4` e `cursor: not-allowed`. O botão `#prev-era` está habilitado.
- O container `.era-step-controls` aplica espaçamento nítido de `gap: 12px`.
- **Faixa de Miniaturas (`#era-strip`):** Posicionada ao lado do título da seção sob o subtítulo "8 ERAS · 1998–2023", renderiza 8 botões com miniaturas carregadas (largura natural de 600px). O teste de interação clicou na miniatura 4 (The Fall) e na miniatura 8 (Cracker Island), confirmando a ativação instantânea do painel correspondente e a presença de `aria-current="true"`.
- **Evidências:**
  - [03-eras-pagination-era1-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/03-eras-pagination-era1-1440x900.png)
  - [04-eras-pagination-era8-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/04-eras-pagination-era8-1440x900.png)
  - [05-eras-strip-8eras-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/05-eras-strip-8eras-1440x900.png)

### 3.4. Rota Dinâmica "EXPLORAR: <parada>" e Persistência na HUD (Item 05)
- Ao selecionar uma era no painel, o botão `#era-drive` reflete o destino mapeado (ex: `EXPLORAR: A paisagem de Demon Days ↗` para 2005 e `EXPLORAR: Um som sem fronteiras ↗` para 2010 Plastic Beach).
- Ao acionar `#era-drive`:
  1. A página rola para a cena 3D e foca o controle do mundo.
  2. A HUD de navegação (`#journey-title`) atualiza imediatamente para o nome da parada da era, com status `#journey-status` exibindo `"A caminho"`.
  3. Na primeira visita (sem dados prévios em `localStorage`), o diálogo modal `#onboarding-dialog` abre sobreposto. A HUD mantém intacto o destino `"A paisagem de Demon Days"`.
  4. Após o fechamento do modal pelo usuário (botão `#onboarding-start`), a telemetria comprovou persistência contínua por mais de 4 segundos:
     - Velocidade do veículo: **8.85 km/h** em marcha à frente.
     - Distância em linha reta: reduzida progressivamente de 165 m para 140 m e 133 m, confirmando condução ativa em direção ao alvo.
- **Análise do Comportamento ao Rolar para Longe (`scrollTo 1400`):**
  - O sistema implementa pausa de renderização via `IntersectionObserver` (`worldVisible = false`), congelando o loop do WebGL quando o canvas sai da viewport para economia de GPU e bateria.
  - Ao rolar para 1400px de distância, a HUD do jogo não está visível para o usuário. Os dados coletados (`snap_rolled` e `snap_returned`) atestam que tanto o status `"A caminho"` quanto o título da parada são preservados integralmente na memória da jornada. Ao rolar de volta para `#jogo`, o veículo retoma sua trajetória de aproximação sem regressão. Esse comportamento é **tecnicamente correto e aceitável**, representando boas práticas de ciclo de vida para aplicações 3D pesadas em páginas web.
- **Evidência:** [06-era-drive-hud-destination-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/06-era-drive-hud-destination-1440x900.png)

### 3.5. Botão Fixo "ENTRAR NO UNIVERSO 3D", Marca e Navbar (Item 06)
- **Comportamento Dinâmico:**
  - Com o jogo no topo da tela (`scrollY = 0`), o botão fixo `#enter-3d-fixed` permanece oculto (`hidden = true`, `display: none`).
  - Ao rolar para fora da cena 3D (`scrollY = 1289px`), o listener de rolagem remove o atributo oculto, exibindo o botão estilizado com fundo amarelo (`var(--acid)`), bordas arredondadas e sombra de profundidade (`box-shadow: 0 6px 18px #0008`).
  - Ao ser clicado, o botão aciona `enter-world`, rola suavemente para `#jogo` (`scrollY` retorna para 72px e topo do jogo fica a 20px da viewport), foca o canvas e oculta-se novamente de forma automática.
- **Marca / Logo:** Clicar no link do topo (`header a.brand`) executa o retorno imediato ao topo absoluto da página (`scrollY = 0`).
- **Navegação:** Todos os 4 links da barra principal (`#eras`, `#radio`, `#band-title`, `#paradas`) possuem destinos com elementos válidos no DOM e rolagem suave com suporte a `prefers-reduced-motion`.
- **Evidência:** [07-dock-button-fixed-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/07-dock-button-fixed-1440x900.png)

### 3.6. Rádio da Landing Page (Item 08)
- Clicar em `#play-track` ("▶ VER CLIPE DO YOUTUBE") aciona o player embutido na própria página:
  1. Cria dinamicamente um `<iframe>` apontando para o domínio seguro `https://www.youtube-nocookie.com/embed/1V_xRb0x9aw` com permissões restritas (`encrypted-media; picture-in-picture; fullscreen`).
  2. Adiciona a classe `.video-open` à seção `#radio`.
  3. Ativa as animações visuais de feedback: o vinil entra em rotação contínua (`landing-spin 4s linear infinite`) e as barras do espectro sonoro pulsam com delays alternados (`landing-eq .9s ease-in-out infinite alternate`).
  4. Disponibiliza container de fallback acessível (`.embed-fallback`) com link direto caso o vídeo seja bloqueado pela rede do usuário.
  5. O link auxiliar "ABRIR NO YOUTUBE" (`#listen-link`) aponta para URL canônica válida (`https://www.youtube.com/watch?v=1V_xRb0x9aw`).
  6. Um novo clique no botão (agora rotulado "× FECHAR CLIPE") destrói o iframe, remove a classe `.video-open` e encerra as animações.
- **Evidência:** [10-radio-clip-inline-and-vinyl-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/10-radio-clip-inline-and-vinyl-1440x900.png)

### 3.7. Desempenho, Estabilidade e Não-Regressão (Item 09)
- **Taxa de Quadros (FPS):** Medição em tempo real na cena 3D durante condução registrou **61 FPS**, superando com folga o limiar mínimo exigido de 50 FPS.
- **Console & Rede:** Registro de **0 erros de console** (`console.error` ou `pageerror`) e **0 falhas HTTP** (status ≥ 400).
- **Links e Ações:** Auditoria varreu todas as âncoras internas, registrando zero links sem destino e zero botões inoperantes.
- **Não-Regressão:**
  - **Mapa Tático (M):** Pressionar a tecla `M` abre o diálogo modal em tela cheia `#full-map-overlay`; pressionar `Escape` fecha o diálogo instantaneamente.
  - **Fliperama de Kong Studios:** Posicionar o Geep próximo à máquina (`x: -10, z: -10`) exibe o prompt de interação `#interact`. Clicar abre `#arcade-dialog` com o canvas do labirinto (510×390) e o minigame opera normalmente.
- **Evidência:** [11-non-regression-map-arcade.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/11-non-regression-map-arcade.png)

---

## 4. Evidências Geradas no Repositório

Todas as capturas e dados estruturados da auditoria encontram-se salvos na pasta dedicada:
`E:\Gorilazz-Relatorio\docs\gestao\evidencias\landing-qa-2026-11-21\`

1. [01-hero-actions-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/01-hero-actions-1440x900.png) — Botões "Quero dirigir", "Passeio guiado" e rolagem editorial
2. [02-eras-cover-demon-days-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/02-eras-cover-demon-days-1440x900.png) — Era 2005 Demon Days com capa 340px, blur de fundo e créditos
3. [03-eras-pagination-era1-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/03-eras-pagination-era1-1440x900.png) — Paginação na Era 01 com botão anterior desabilitado
4. [04-eras-pagination-era8-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/04-eras-pagination-era8-1440x900.png) — Paginação na Era 08 com próximo desabilitado
5. [05-eras-strip-8eras-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/05-eras-strip-8eras-1440x900.png) — Faixa de 8 capas com miniaturas ativas
6. [06-era-drive-hud-destination-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/06-era-drive-hud-destination-1440x900.png) — Condução iniciada via era com parada "A paisagem de Demon Days" na HUD
7. [07-dock-button-fixed-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/07-dock-button-fixed-1440x900.png) — Botão fixo "ENTRAR NO UNIVERSO 3D" exibido após rolagem
8. [08-eras-mobile-2cols-390x844.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/08-eras-mobile-2cols-390x844.png) — Grid de 2 colunas e capa adaptada no viewport 390×844
9. [09-eras-mobile-2cols-320x568.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/09-eras-mobile-2cols-320x568.png) — Layout mobile ultra-compacto no viewport 320×568
10. [10-radio-clip-inline-and-vinyl-1440x900.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/10-radio-clip-inline-and-vinyl-1440x900.png) — Rádio com clipe embutido, vinil girando e equalizador ativo
11. [11-non-regression-map-arcade.png](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/11-non-regression-map-arcade.png) — Minigame do fliperama aberto e operacional
12. [qa-landing-audit-results.json](file:///E:/Gorilazz-Relatorio/docs/gestao/evidencias/landing-qa-2026-11-21/qa-landing-audit-results.json) — Telemetria bruta estruturada da auditoria

---

## 5. Conclusão da Auditoria

A implementação da **Landing Page** pela Engenharia atende rigorosamente a todos os critérios visuais, arquiteturais, de acessibilidade, responsividade e não-regressão estipulados. Nenhum defeito impeditivo ou de severidade moderada foi detectado.

**Recomendação de QA:** **APROVADO PARA PRODUÇÃO / ENTREGA FINAL**.
