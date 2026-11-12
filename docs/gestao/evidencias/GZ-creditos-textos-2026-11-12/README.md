# Créditos do diorama e texto "Londres, 1998" — 12/11/2026

Pedido: itens 4 e 5 de `docs/gestao/analise-melhorias-12-11-2026.md`, aprovados por Eduardo via maricota. Sem commit, push, publicação ou reinício do servidor.

## Alterações

| Arquivo | Mudança |
| --- | --- |
| `index.html` (bloco "Novas peças do mundo") | O texto "autoria ainda está sendo confirmada; o crédito completo será acrescentado aqui" virou: diorama da Noodle removido em 12/11/2026 por autoria e licença não comprovadas, substituído pelo Jardim de frequências (arte original), com registro em "créditos e adaptações". |
| `index.html` (aviso `#exhibition-update`) | "A descrição histórica abaixo foi preservada para revisão dos créditos" → "O histórico de atribuição foi mantido no arquivo de créditos." |
| `README.md` linha 136 | Diorama substituído pelo Jardim de frequências; o Jardim não usa a "foto" de longe. |
| `index.html` linhas 19, 30, 33 | "Londres" removido; "criada em Londres, em 1998" → "surgiu em 1998, a partir da colaboração entre Damon Albarn e Jamie Hewlett" (mesma redação de `src/content.js`, recomendada pela Central). |

Histórico de atribuição preservado: `assets/environment/CREDITS.txt` (registro de remoção) e `manifest.json` não foram tocados (`preserved-before.sha256`: OK).

## Checagem factual (Pesquisa Gorilazz, baseada em `fontes-e-creditos/gz-04-primeira-era.md`, linhas 7, 10, 11)

- "1998": confirmado com atribuição (relato de Hewlett à VICE).
- "Londres" como local da criação: **não confirmado** em nenhuma fonte do GZ-04.
- "EST. 1998" no cabeçalho: aceitável como marca editorial; "DESDE 1998" seria mais neutro. **Não alterado.**
- Frase "nunca precisou existir para mudar a música": sem fonte; é tom editorial. **Mantida**, decisão de Eduardo.
- "2-D (voz e teclados)" no noscript: GZ-04 só sustenta vocal. **Não alterado** (aparece igual no cartão "01 / VOZ E TECLADOS" do bloco da banda, fora do escopo).

## Validação

- `npm run check`: saída 0 (`check.log`). `npm test`: 49 testes, 49 passaram, 0 falhas (`test.log`).
- HTML servido em localhost:3000 após a mudança (`servido-depois.html`): 0 ocorrências de "Londres"; `#chapter-description` = "1998. Uma banda…".
- Diff: `changes.diff` (baseline em `baseline/`).
- Capturas: `creditos-antes.png` e `creditos-depois.png` (seção de créditos, mesma rolagem e viewport 1345×635).

## Limitações

- **Sem captura visual dos trechos de Londres.** O cartão de capítulo só aparece durante a exploração e o `<noscript>` só renderiza sem JavaScript; a tela principal já exibe o texto de `src/content.js`. A evidência desses itens é textual (diff e HTML servido).
- Ainda aparece "Londres" em `src/app.js:406`, `src/discoveries.js:22`, `src/world-data.js:62` e `:168`. Fora do escopo pedido (só `index.html`); contradizem o GZ-04. `src/content.js` já está corrigido.
- README linha 136: não achei no código um mecanismo de "foto ao longe"; a frase sobre integrantes e escultura pode estar desatualizada. Não verificado.
- README linha 49 ainda cita o diorama (histórico do piloto); não alterado.
- `docs/visual/mirante-noodle.jpg` (captura do diorama, citada no relatório) não foi tratada: não estava no escopo.
- Estado do servidor compartilhado preservado; testado só no Chromium desktop.
