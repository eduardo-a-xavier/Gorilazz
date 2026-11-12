# GZ-03 — Região e ato espacial no diário

Data: 11/11/2026. Parcela pequena autorizada pela Central, com capturas reais e sem testes.

## Interpretação e alteração

Procede: `src/app.js`, em `openDiscovery`, usa `CITY_ERAS[eraAt(point)].act` para o ato da ficha. Antes, `updateJournal` mostrava somente `REGIONS[point.region].name`.

Foi alterada uma linha em `src/app.js:278`: o parágrafo passa a mostrar `Região: <nome> · Ato espacial: <número>`. Reutiliza exatamente o cálculo da ficha. `eraAt`, em `src/world-data.js:176`, escolhe a âncora espacial mais próxima; isso não constitui correspondência 1:1 com as oito eras históricas da linha do tempo. Região editorial e ato espacial continuam sendo informações diferentes.

O escopo não muda títulos, ordem, botões, consulta livre, coleta, conclusão, armazenamento ou navegação. `src/content.js` já estava modificado por outra pessoa e não foi editado nesta tarefa. README da raiz e seus créditos não foram alterados.

## Evidência real

Servidor já existente em `http://localhost:3000/` (porta 3000, PID observado 28388); nenhum servidor foi iniciado ou encerrado nesta tarefa.

Percurso de captura: “Quero dirigir” → “Mapa e controles” → “DIÁRIO” → rolagem até a lista. A primeira tentativa de abrir diretamente o botão do diário falhou porque o menu estava recolhido; abrir o menu resolveu, sem alteração de código para a captura.

- [Antes, PNG](antes.png): somente o nome da região, sem ato.
- [Depois, PNG](depois.png): região e ato espacial, sem alteração do estilo.
- [Gravação original antes](antes.webm) e [gravação original depois](depois.webm).
- [Diff de src/app.js](app.diff): uma linha substituída.

Os PNGs são os primeiros quadros extraídos das gravações reais pelo FFmpeg já instalado, sem montagem ou edição do conteúdo. As capturas também foram observadas pela ferramenta de screenshot do navegador e os PNGs extraídos foram abertos para inspeção.

Leitura do DOM após recarregar a página, em ordem das cinco entradas:

1. Região: Kong Studios · Ato espacial: 1
2. Região: Bairro dos murais · Ato espacial: 4
3. Região: Bairro dos murais · Ato espacial: 4
4. Região: Mirante do moinho · Ato espacial: 3
5. Região: Mirante do moinho · Ato espacial: 3

O contador observado antes e depois foi `0 / 5`. Não foram coletadas descobertas, reiniciados dados ou preenchido armazenamento artificialmente. A própria aplicação pode persistir a posição ao perder foco ou sair, conforme seu comportamento existente no navegador privado usado na captura.

## Limitações e revisão

- Não foram executados ou acrescentados testes, builds, checks de sintaxe ou suites automatizadas. Apenas leitura do código, diff e operações de navegador necessárias às capturas.
- A preservação dos fluxos de coleta e conclusão decorre do diff restrito ao texto de apresentação; não foi exercitada uma jornada completa nem um diário com descobertas salvas.
- A captura enquadra as três primeiras entradas completas; os cinco rótulos foram lidos no DOM. Não houve captura mobile ou auditoria de acessibilidade.
- Resoluções reais das gravações: antes 1350 × 608, depois 1600 × 722. O navegador adaptou o enquadramento; as imagens não permitem comparação de geometria pixel a pixel. Não houve mudança de CSS.
- `RTK.md` referenciado nas instruções não foi encontrado no workspace ou na raiz do projeto. Não foram encontradas instruções AGENTS.md locais nas pastas consultadas.
- Os originais gerados pela ferramenta também permanecem em `C:\Users\dudu2\OpenBot\Downloads\openbot-browser-2026-11-11T20-56-58-813Z-fcc52c95.webm` e `C:\Users\dudu2\OpenBot\Downloads\openbot-browser-2026-11-11T20-57-37-500Z-bd038a81.webm`.
- Sem instalação, commit, push, publicação ou submissão. A revisão final do diff confirmou uma única linha de código alterada nesta tarefa.

## Análise antes do código

Stack: JavaScript ESM, HTML/CSS e Three.js; sem banco. Há runner Node no projeto, não executado por restrição expressa.

Volume: cinco descobertas fixas, cálculo sobre quatro âncoras; nenhum histórico crescente novo. Consumidores: alteração local de texto em `updateJournal`; ficha mantém seu cálculo existente. Irmãos: ficha e diário passam a usar a mesma expressão para ato. Bordas: nenhuma alteração em coordenadas, fuso ou entradas externas; saída continua em `textContent`. Limite real: clareza da localização no diário, sem remapeamento histórico e sem encerrar o GZ-03 inteiro.
