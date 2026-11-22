# Auditoria técnica — carregamento, CSS, semântica e falhas

**Data:** 18/11/2026. **Escopo:** leitura de `package.json`, `index.html`, `src/`, servidor próprio `PORT=3100` e runtime no navegador. Somente leitura no produto; sem instalação, testes automatizados, commit, push ou publicação.

## P0/P1/P2

| Prioridade | Achado técnico | Dados / localização | Esforço | Correção proposta | Critério de aceite |
|---|---|---|---:|---|---|
| P1 | Overflow horizontal em viewport de 320 px. | Runtime: `innerWidth=320`, `clientWidth=305`, `scrollWidth=308`; `#world-map` termina em 307.7 e legenda em 308.3. Captura `mobile-320-overflow.png`. | baixo | Conter SVG/legenda no contêiner (`max-width:100%`, `overflow-x:clip` apenas no componente, revisão de box-sizing). | `scrollWidth === clientWidth` em 320, 375, 390; sem barra horizontal e sem cortar mapa. |
| P1 | Títulos dinâmicos começam vazios. | `index.html:24` `h3#journey-title`; `index.html:43` `h2#discovery-title`; avaliação DOM encontrou ambos sem texto no boot. | baixo | Texto acessível inicial ou `aria-live`/heading criado somente quando preenchido; não deixar região nomeada por heading vazio. | Auditoria DOM sem headings vazios; leitor de tela recebe nome antes/depois do boot. |
| P1 | Falha de HEAD em `https://www.gorillaz.com/` e dois erros de cache de fontes Sketchfab. | 14 destinos externos únicos: 12×200, YouTube×204, gorillaz.com `ERR` via HEAD; browser diagnostics: dois `net::ERR_CACHE_MISS` em fontes `static.sketchfab.com`. | baixo/médio | Confirmar com GET/browser e tratar terceiros como dependência não crítica; fallback de iframe/prévia. | Nenhum 404 local; falha externa mostra estado compreensível e não quebra navegação. |
| P2 | Bundle inicial carrega 3 CSS, app e módulos Three.js antes da interação. | `index.html:7-8`; Navigation: HTML `encodedBodySize=8890`, DOMContentLoaded ~263.5 ms, load ~283.2 ms na sessão; canvas e recursos locais carregados. | médio | Adiar modelos/ambiente pesado até entrada; manter HTML/CSS editorial crítico no primeiro paint. | Entrada utilizável antes do 3D; métricas documentadas em desktop/celular sem regressão visual. |
| P2 | CSS concentrado/minificado, com regras repetidas entre `style.css`, `editorial.css`, `world.css`; manutenção e detecção de regra morta ficam difíceis. | Três folhas referenciadas em `index.html:7`; `style.css` contém blocos de base, breakpoints e regras de componentes em linha única. | médio | Separar tokens/layout/componentes ou ao menos gerar relatório de seletores duplicados; remover apenas após cobertura visual. | `npm run check`/`npm test` passam e cada selector removido tem cobertura de captura/regressão. |
| P2 | No-JS existe, mas é um fallback tardio dentro de `#paradas`. | `index.html:33` contém `noscript` com história; `index.html:9` esconde botões/status em `noscript`. | baixo | Manter fallback em posição inicial ou garantir que, sem JS, o primeiro conteúdo útil seja história/atribuição. | Com JS desativado, conteúdo completo e navegação por âncoras sem controles mortos. |
| P2 | Fallback de WebGL/context lost está implementado, mas não foi induzido. | `src/app.js:313-335` troca para mapa 2D e diário; `src/scene.js:126-140` cria renderer e escuta `webglcontextlost/restored`. | médio | Acrescentar teste manual/automatizado de contexto perdido e verificar foco/status. | Ao perder WebGL, status anuncia “MODO 2D”, mapa recebe foco e nove olhares/diário continuam operáveis. |

## Dados de carregamento e recursos

- `package.json`: `npm run check` usa `node --check` em `server.mjs` e módulos de `src`; `npm test` executa `node --test tests/*.test.mjs`. Não rodei comandos automatizados nesta auditoria.
- Navegação local respondeu HTTP 200. As 12 referências relativas extraídas de `index.html` — CSS, JS e GLB/TXT — responderam 200 por `HEAD` na porta 3100.
- No runtime mobile (CSS viewport efetivo 375×829 por causa da barra), `canvas` foi criado, status ficou `MUNDO ABERTO / 3D EM TEMPO REAL`, e o canvas tinha 251×536 pixels internos no registro consultado.
- O perfil compacto é escolhido em `src/scene.js:120-128` quando largura <700; isso reduz pixel ratio e efeitos. **Interpretação:** a decisão é adequada ao celular, mas precisa de medição em aparelho real.
- Recursos de ambiente usam `loadAsync(...).catch(...)` e malhas alternativas em `src/environment.js:83-154`; veículo/personagens têm fallback em `src/scene.js:531-650`. **Fato:** há caminhos de fallback no código; não foi simulada indisponibilidade de cada asset.

## Contratos de aceite para 26/11

1. `scrollWidth` não excede `clientWidth` em 320/375/390 e não há texto/controle cortado.
2. Nenhum `h1–h6` vazio no boot ou em diálogo aberto; nomes e foco são anunciados.
3. GET/HEAD dos recursos locais retorna 200; 404/erro externo é exibido como estado recuperável.
4. Entrada, mapa, diário, nove olhares e conteúdo editorial funcionam sem WebGL.
5. Entrada útil aparece antes dos assets 3D; `npm run check` e `npm test` passam na regressão da Engenharia.
6. Falha de terceiros (Sketchfab/YouTube) não bloqueia o restante da experiência.

## Limitações

Não rodei `npm run check` nem `npm test` por autorização de somente leitura e por não instalar dependências; não medi CSS não usado com cobertura, não desativei JS/WebGL no navegador, não executei Lighthouse/axe, não testei Safari/Android/iOS físico, nem a URL publicada. O status de `gorillaz.com` foi inconclusivo via HEAD e precisa GET/browser.
