# Rodada Central — evidências (Gorilazz A3)

Medido no Chrome real (`localhost:3000/?perf`), 1440x900. Sem git add, commit ou push: quem faz o commit é o Eduardo. Nada foi commitado.

## Status por item

### 1. Ciclo sair/voltar do modo 3D (prioridade) — **feito e medido**

| achado | correção | evidência |
|---|---|---|
| Sair com um diálogo aberto (ficha de integrante, fliperama, piano) deixava o modal por cima da página. Ao voltar, `modalOpen()` pausava o laço e os controles não respondiam (carro parado, câmera travada). | `closeOpenDialogs()` fecha todos os diálogos ao sair e ao voltar; o `close` de cada um devolve o rádio e o foco (`src/app.js`). | Antes (`cycle_hard`): modal de integrante, fliperama e piano com `responde: false`. Depois: todos `true`. |
| Voltar da tela cheia deixava a visibilidade do mundo presa em "fora da tela": o `IntersectionObserver` não acompanha mudanças de layout da tela cheia. | Visibilidade recalculada pelo retângulo do `#jogo` a cada quadro (`refreshWorldVisibility`, `src/world-cycle.js`). | Antes (20 ciclos): 3 falhas, todas em tela cheia. Depois: 0. |
| Ao sair da tela cheia, o navegador restaurava a rolagem antiga e o mundo ficava fora da tela. | Ao sair da tela cheia com o 3D ativo, o mundo volta ao topo (`realignAfterFullscreen`). | Ciclo de 20 repetições, todos respondendo (`ciclo-20-sair-voltar.json`). |
| Botão "Ler História & Eras" ficou escondido dentro do menu [H] na rodada anterior. | Coberto pelo menu; o teste clica pelo DOM. | — |

Ciclo de 20 repetições (`ciclo-20-sair-voltar.json`): normal, modal de integrante, fliperama, piano, passeio guiado e tela cheia, em rodízio.
- Carro responde em 20/20.
- Geometrias: 404 no início, 429 do ciclo 4 em diante (estável; o aumento foi no primeiro carregamento de cada parte).
- Texturas: 137 → 141 (estável).
- FPS mínimo nos ciclos: 55 (aceite ≥ 55).
- Erros: 0.

**Não medido:** contagem direta de listeners (o teste mede geometrias, texturas e programas do renderer). Os handlers de saída e de volta não são registrados a cada ciclo: `enterWorld` e `exit3d` só mudam classes e estado.

Testes: `tests/world-cycle.test.mjs` (visibilidade, plano de saída, plano de volta, realinhamento após tela cheia).

### 2. Minimapa — **feito**

- Fundo pré-renderizado uma vez num canvas (`src/minimap-art.js`): asfalto com ruído leve, grade urbana a cada 6 unidades, quarteirões sombreados pela cor do bairro, avenidas com contorno iluminado, ruas pequenas tracejadas, vinheta e anéis de radar.
- O SVG só redesenha marcadores e o carro. Moldura metálica escura (CSS).
- Pontos descobertos: verde-ciano com ✓. Pendentes: âmbar com pulso (desligado com "reduzir movimento").
- Cone de visão: posição e rotação atualizadas a cada quadro, com suavização exponencial.
- Legibilidade em 320x568 mantida (mesmo tamanho do minimapa); o fundo não é redesenhado por quadro.

Antes/depois: `antes-minimapa-hud-1440x900.png` (captura em passeio guiado, versão anterior) e `depois-minimapa-hud-1440x900.png` (modo normal). Os estados são diferentes; a comparação é de aparência.

### 3. Central de Descobertas — **feito, com dados de teste substituídos pelo módulo da Pesquisa**

- Abre pelo contador `DESCOBERTAS: X / 9` (clique, Enter ou Espaço), pelo menu [H] Controles e pelo mapa completo (M).
- Drawer (`<dialog>`): busca por palavra-chave (sem acento e sem maiúsculas; todas as palavras digitadas precisam aparecer), filtros Todas / Eras / Personagens / Bastidores, lista das 9 fichas.
- Bloqueada: título, dica ("Pista: …") e botão "Ir até lá", que define o destino do passeio. Verificado no navegador: a HUD passa a mostrar "A caminho: Duas mentes, um universo, 22 m em linha reta".
- Descoberta: texto completo, período, palavras-chave, fonte (link e data de acesso) e a marcação "Ficção da banda" quando o texto traz isso.
- ESC fecha só o drawer (pilha de diálogos), o 3D continua.
- Dados: `src/discoveries-lore.js` (Pesquisa). O drawer usa `stopId` para ligar cada ficha à parada; o estado descoberto vem do contador (mesma fonte do X/9).
- Rotas: uma única linha para `discoveries-lore.js` (da Pesquisa); acrescentei `discoveries-search.js`, `discoveries-drawer.js`.

Capturas: `drawer-descobertas-1440x900.png`, `drawer-filtro-personagens-1440x900.png`, `drawer-bloqueadas-1440x900.png`.

Testes: `tests/discoveries-search.test.mjs` (9 fichas com `stopId` real e fonte com data, busca sem acento, filtros, estados descoberto e bloqueado, marcação de ficção).

### 4. Micro-efeitos — **feito, sem captura visual das partículas**

- Partículas (`src/ambient-particles.js`): um único `THREE.Points`, 58 partículas em três tipos. Poeira dourada no início (0,0), esporos verdes perto do moinho de Demon Days, faíscas ciano num trecho central da Av. Saturnz Barz. Flutuação suave; com movimento reduzido ficam paradas.
- Som de descoberta (`src/discovery-sound.js`): dois tons senoidais (880 Hz e 1320 Hz), cerca de 0,4 s no total, tocado a cada parada nova (não repetida). Com o rádio tocando o volume cai pela metade. Opção de silenciar no menu de controles, salva no navegador.

**Interpretação:** "respeitando o rádio mutado/pausado" foi tratado como "o som não briga com o rádio": com o rádio tocando, o volume cai; com o rádio pausado ou mutado, o som sai no volume normal. Se a intenção for outra, é uma mudança de uma linha.

**Não medido:** o custo das partículas em isolamento (o frame time do passeio mudou só dentro do ruído, veja abaixo).

Testes: `tests/micro-effects.test.mjs` (posições determinísticas, raios e alturas, opção de som salva e corrompida, forma do som).

### 5. Aceite

- **FPS (rAF 3 s):** mural 59,8 · palco 59,9 · centro 59,8 (≥ 55).
- **Frame time (passeio de 40 s):** p50 16,7 · p95 17,0 · p99 17,2 ms; 6 quadros > 33 ms. Antes desta rodada: p95 16,9 · p99 17,1. A diferença de 0,1 ms está dentro do ruído.
- **Erros HTTP, console e página:** 0.
- **Peso inicial:** 4,36 MB (teto 9,3). Acumulado ao final: 8,15 MB.
- **`npm run check`:** OK (inclui os sete módulos novos).
- **`npm test`:** 205/205 (eram 188).

## Arquivos desta rodada

Código: `src/app.js`, `src/scene.js` (partículas), `src/landing-fixes.css`, `server.mjs`, `package.json`. (`index.html` não foi alterado nesta rodada.)

Módulos novos: `src/world-cycle.js`, `src/minimap-art.js`, `src/discoveries-search.js`, `src/discoveries-drawer.js`, `src/ambient-particles.js`, `src/discovery-sound.js`.

Testes novos: `tests/world-cycle.test.mjs`, `tests/minimap-art.test.mjs`, `tests/discoveries-search.test.mjs`, `tests/micro-effects.test.mjs`.

Observação: `git status` mostra o diretório como repositório (branch `main`), com muitos arquivos não rastreados de outras frentes. Esta rodada alterou os arquivos listados acima; a revisão antes do commit deve olhar só esses.

## Ajustes pedidos pela Central (rodada de conferência)

Pasta: `ajustes-2026-11-23/`.

1. **Títulos do drawer:** a regra global de `h1-h3` (letter-spacing -2px) colava as letras. Títulos das fichas e do cabeçalho agora usam `letter-spacing: .02em` e `word-spacing: .14em` (medido: 0,4 px e 2,8 px). Prints nos 4 tamanhos: `drawer-1440x900.png`, `drawer-1346x680.png`, `drawer-390x844.png`, `drawer-320x568.png`. Teste em `tests/hud-layout.test.mjs`.
2. **Partículas:** prints de perto nos três pontos (`particulas-poeira_inicio`, `particulas-esporos_moinho`, `particulas-faiscas_saturnz`). Passaram a ser pontos redondos (sprite com gradiente) em vez de quadradinhos. Aparecem sem poluir a cena; os esporos são os mais discretos.
3. **Som de descoberta, interpretação confirmada:** o som toca baixo (volume cai pela metade quando o rádio está tocando), não corta nem pausa o rádio (o código não chama pause/play do rádio), e fica mudo se o usuário silenciou (opção salva no navegador, botão no menu de controles). Testes em `tests/micro-effects.test.mjs`.
4. **Sobreposição e ESC em pilha** (1440x900, medido no navegador):
   - H abre o menu.
   - Com o menu aberto, o drawer abre por cima; ESC fecha só o drawer, o menu continua aberto; ESC de novo fecha o menu.
   - Com o mapa aberto (M), H não abre o menu; ESC fecha o mapa.
   - Nenhum estado com duas camadas do mesmo tipo ao mesmo tempo.
   - Ajuste no código: H não abre sobre o mapa completo.
   - Prints: `camadas-drawer-sobre-menu-1440x900.png`, `camadas-mapa-1440x900.png`.

Testes após os ajustes: `npm run check` OK; `npm test` 206/206.
