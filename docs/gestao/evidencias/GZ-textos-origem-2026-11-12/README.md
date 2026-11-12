# Correções de texto de origem (Londres, EST. 1998, teclados, slogan) — 12/11/2026

Aprovado por Eduardo via maricota, conforme `../verificacao-origem-12-11-2026.md`. Somente texto; sem mudança de estrutura, layout ou lógica. Sem commit, push, publicação ou reinício do servidor.

## Alterações (`changes.diff`; baseline em `baseline/`)

| # | Arquivo | Antes | Depois |
| --- | --- | --- | --- |
| 1 | `index.html` cabeçalho | EST. 1998 — SEM DESTINO FINAL | DESDE 1998 — SEM DESTINO FINAL |
| 2a | `src/app.js:406` | "Gorillaz nasceu em Londres, em 1998, da parceria entre…" e "Londres, 1998. Albarn e Hewlett começam…" | "Gorillaz surgiu em 1998, a partir da colaboração entre Damon Albarn e Jamie Hewlett." e "1998. Albarn e Hewlett começam…" |
| 2b | `src/world-data.js:62` | "Em Londres, em 1998, Damon Albarn e Jamie Hewlett criaram Gorillaz." | "Gorillaz surgiu em 1998, a partir da colaboração entre Damon Albarn e Jamie Hewlett." |
| 2c | `src/discoveries.js:22` | "Em 1998, … imaginaram uma banda de desenho enquanto dividiam um apartamento em Londres." | "Segundo a imprensa, … imaginaram uma banda de desenho enquanto dividiam um apartamento no oeste de Londres; Gorillaz surgiu em 1998." |
| 3 | `index.html` noscript | 2-D (voz e teclados) | 2-D (voz) |
| 4 | `index.html` cartão de capítulo | "1998. Uma banda que nunca precisou existir para mudar a música." | "1998. Uma banda virtual surgida da colaboração entre Albarn e Hewlett." (sustentada pela VICE) |
| 5 | `src/world-data.js:168` | "…a Londres decadente de Kong Studios." | "…uma leitura do projeto para o bairro de Kong Studios." |

## Validação

- `npm run check`: saída 0. `npm test`: 49 de 49 (`check.log`, `test.log`).
- Navegador (localhost:3000, mesma rolagem e viewport 1345×635): cabeçalho `DESDE 1998 — SEM DESTINO FINAL`; `#chapter-description` e `DISCOVERIES[beginning].text` com o texto novo (módulos recarregados).
- Preservados (SHA-256 igual): `README.md`, `src/content.js`, `src/scene.js`, `assets/environment/CREDITS.txt`, `manifest.json`.
- Capturas: `cabecalho-antes.png` e `cabecalho-depois.png`.

## Limitações e pendências

- **Capturas só do cabeçalho.** Os outros trechos aparecem em fichas, no noscript ou no cartão de capítulo, que dependem de estado do jogo. Para eles a evidência é textual (diff e leitura do módulo no navegador).
- **"Voz e teclados" ainda aparece** em `src/app.js:12` (cartão "01 / VOZ E TECLADOS 2-D" e descrição), `src/scene.js:212` ("VOCAL · TECLADOS"), `src/world-data.js:65` ("2-D canta e toca teclados") e `src/content.js:46` ("tecladista"). Fora do pedido (só `index.html`); a verificação de origem diz que "teclados" não tem fonte primária. Falta decidir.
- **Fonte de `world-data.js:62`** aponta para `https://www.gorillaz.com/`, que a Pesquisa não verificou como suporte desse trecho. Não alterei o campo.
- O novo texto de 2c atribui o apartamento à imprensa, mas a data exata do apartamento varia entre fontes; a frase só liga 1998 ao surgimento da banda.
- Não testei outros navegadores nem a ficha aberta durante a viagem.
