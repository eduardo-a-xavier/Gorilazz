# Verificação de origem — Gorillaz A3

**Consulta:** 12/11/2026. Somente pesquisa; nenhum arquivo do projeto foi editado. Convenção: *confirmado* = fonte primária (palavras dos criadores ou site/material oficial da banda) ou fonte jornalística que cita o criador diretamente; *não confirmado* = só fonte secundária ou ausência de fonte; *interpretação* = leitura editorial do projeto.

Observação sobre "fonte primária": não encontrei, nesta consulta, página oficial da banda que fixe cidade ou ano de criação. A entrevista VICE com Jamie Hewlett é o relato mais direto (testemunho de co-criador, via jornalista). Duas tentativas de abrir a transcrição NPR (https://www.npr.org/transcripts/nx-s1-5677672) falharam (erro de conexão); ela não foi lida.

## 1. Origem: 1998 e Londres

| Fato | Fonte e trecho | Status |
| --- | --- | --- |
| Gorillaz surgiu em 1998 | [VICE, entrevista com Hewlett](https://www.vice.com/en/article/gorillaz-co-creator-jamie-hewlett-just-wanted-to-draw-comics/): "And then, in 1998, came Gorillaz." Hewlett: "Damon [Albarn] started talking about Gorillaz…" | **Confirmado** (testemunho do co-criador; sem mês/dia) |
| Albarn e Hewlett dividiam um apartamento no **oeste de Londres** quando a ideia surgiu | VICE (narração do jornalista, não fala de Hewlett): "him and Albarn moved into a flat together in west London"; "Watching MTV, the two decided…". Reforço secundário: [Flood, 12/12/2025](https://floodmagazine.com/212789/the-house-gorillaz-built-flood-13-cover/): "West London circa 1998… in their shared Westbourne Grove bachelor pad". | **Não confirmado em fonte primária.** Há apoio jornalístico para "oeste de Londres"; nenhuma fonte oficial/criador direta para "Londres" como local de criação. |
| Gorillaz "nasceu em Londres" (cidade como local de criação, com data) | Nenhuma fonte consultada afirma isso nesses termos. A VICE liga 1998 e o apartamento no oeste de Londres em frases separadas. | **Não confirmado.** |

Correção ao GZ-04: o inventário diz que a VICE "não localiza" a criação. Ao reler, a VICE menciona o apartamento em "west London". O que ela não faz é afirmar, em fala dos criadores, que a banda foi criada "em Londres, em 1998". A decisão de remover "em Londres" continua prudente; se Eduardo quiser manter o local, a redação mais defensável é: "criada por Damon Albarn e Jamie Hewlett, que na época dividiam um apartamento no oeste de Londres (segundo a imprensa)", com a fonte visível.

Redação mínima sem risco: "Gorillaz surgiu em 1998, por iniciativa de Damon Albarn e Jamie Hewlett."

## 2. "EST. 1998" × "DESDE 1998"

- Ano: sustentado pela VICE (item 1, **confirmado**, com atribuição ao relato de Hewlett).
- "EST." (established) sugere fundação formal ou data oficial; as fontes só dão "surgiu em 1998" por relato oral. **"DESDE 1998" é a formulação mais precisa e neutra.** "EST. 1998" não é erro factual grosseiro; é mais forte do que a evidência. Escolha editorial.

## 3. Slogan "nunca precisou existir para mudar a música"

Nenhuma fonte encontrada. A motivação relatada pela VICE é outra: criar uma banda fictícia para satirizar a falta de substância que viam na MTV. **Não confirmado / interpretação** (slogan editorial). Se for apresentado como fato histórico, remover ou trocar por texto sustentado.

## 4. 2-D: "voz e teclados" ou só voz

| Fonte | O que diz | Tipo |
| --- | --- | --- |
| [Biografia de imprensa](https://www.nastylittleman.com/artists/gorillaz/) | "bassist Murdoc Niccals, singer 2D, drummer Russel Hobbs and Japanese guitar prodigy Noodle". Sem menção a teclados. | Material de imprensa da banda (primária) |
| [FAQ oficial Kong Studios](https://gorillaz.com/Kongstudiosfaqs/) | Não menciona instrumentos de 2-D. | Site oficial |
| [Wikipedia, 2-D (character)](https://en.wikipedia.org/wiki/2-D_(character)) | "2-D (vocals, keyboards, melodica; vocals provided by Albarn)". A frase não tem citação em linha (verificado só na parte lida da página). Também listado por terceiros (Tunefind, TV Tropes). | Secundária |

**Voz: confirmado. Teclados: não confirmado em fonte primária** (só fontes secundárias; plausível, mas sem prova oficial). Recomendação: "2-D (voz)", ou manter "teclados" só com fonte primária adicional (por exemplo, crédito de álbum ou página oficial).

## 5. Quatro trechos com "Londres" no código

| Local | Texto | Status |
| --- | --- | --- |
| `src/app.js:406` (a linha tem duas ocorrências) | "Gorillaz nasceu em Londres, em 1998, da parceria entre Damon Albarn e Jamie Hewlett…" e "Londres, 1998. Albarn e Hewlett começam um projeto…" | **1998 confirmado; "nasceu em Londres" não confirmado** (item 1). |
| `src/discoveries.js:22` | "Em 1998, Damon Albarn e Jamie Hewlett imaginaram uma banda de desenho enquanto dividiam um apartamento em Londres." | **Parcialmente apoiado:** apartamento no oeste de Londres e a ideia da banda aparecem na VICE e na Flood (jornalismo, não fonte primária). A data exata do apartamento varia entre fontes (1997 ou 1998 em páginas derivadas da Wikipedia). Status: **não confirmado em fonte primária**; aceitável só com atribuição à imprensa. Os outros fatos dessa ficha (EP em 2000, turnê atrás de tela) não foram verificados aqui. |
| `src/world-data.js:62` | "Em Londres, em 1998, Damon Albarn e Jamie Hewlett criaram Gorillaz." (fonte citada: https://www.gorillaz.com/) | **1998 confirmado; "Em Londres" não confirmado.** O link citado é a home da banda, que não sustenta esse trecho (não verifiquei a home integralmente; a página FAQ consultada não o faz). |
| `src/world-data.js:168` | "a Londres decadente de Kong Studios" | **Interpretação.** Kong Studios é apresentado pelo site oficial como "A virtual gathering place for fans" e "The band's HQ since early 2000"; a biografia de imprensa diz "Based at Kong Studios in West London" (ficção/universo da banda). "Decadente" é leitura visual do projeto. Não é fato histórico sobre uma cidade real. |

## Limites

- Não abri a home gorillaz.com nem outras páginas oficiais além das citadas; a transcrição NPR não carregou.
- Não há fonte primária direta (fala de Albarn/Hewlett ou página oficial) para "Londres" como local de criação. Fontes consultadas: VICE, Flood, nastylittleman.com, gorillaz.com/Kongstudiosfaqs, Wikipedia (secundária, marcada como tal).
- Wikipedia e Tunefind não são fonte primária e só aparecem como pista.
