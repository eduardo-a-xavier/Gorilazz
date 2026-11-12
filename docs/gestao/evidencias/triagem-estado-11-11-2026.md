# Triagem do estado do backlog — 11/11/2026

## Escopo e base observada

Leitura somente de `README.md`, `docs/REVISAO-ENTREGA-30-NOVEMBRO.md`, `docs/gestao/`, referências e arquivos de implementação/documentação citados abaixo. Não foram executados testes, smoke, instalação, publicação ou submissão.

A branch local e `origin/main` apontam para `544f3f9` (`Reorganiza cabine, disposição do mundo e a banda tocando`). O único estado não rastreado observado é `docs/gestao/`; não foram encontrados outros arquivos modificados no `git status` desta inspeção. O arquivo `RTK.md` citado nas instruções não existe nem na raiz do projeto nem na pasta de trabalho do agente.

## Conferência por prioridade

| Backlog | Estado observado no repositório | Parecer |
| --- | --- | --- |
| GZ-01 — rubrica, formato, hospedagem | A revisão de 10/11 e `docs/gestao/DECISOES.md` dizem que esses dados não foram identificados. Eduardo respondeu nesta coordenação: “Ainda não definido”. | Bloqueado corretamente. Não assumir critérios. |
| GZ-02 — primeiro uso | `docs/REVISAO-ENTREGA-30-NOVEMBRO.md` registra ajustes de entrada e roteiro; as evidências antigas de browser cobrem chegada/diário em desktop e larguras móveis. Isso é automação/emulação, não observação de pessoa nova. | P0 segue relevante; estado ajustado para Em revisão até observação manual documentada. |
| GZ-03 — coerência editorial | `README.md` e `HISTORY_REVIEW.md` delimitam a cronologia em 1998–2023; a revisão de entrega aponta que a cidade contém referências até 2026 e requer distinguir os recortes. | P0 correto; falta conferir e consolidar a explicação visível ao visitante. |
| GZ-04 — fatos e fontes | `REFERENCES.md` registra limites de acesso a fontes oficiais e fontes secundárias como pontos de partida; `docs/REVISAO-ENTREGA-30-NOVEMBRO.md` diz que fatos e licenças não foram revalidados nesta etapa. | P0 correto; citações existentes não equivalem a conferência final. |
| GZ-05 — diorama Noodle | `assets/environment/manifest.json` mantém autor nulo, licença nula e atribuição “under identification”; `docs/PILOTO-VISUAL.md` diz que o candidato não foi confirmado e que não se inventou crédito. `assets/environment/CREDITS.txt` e o manifesto são os registros a revisar na solução. | P0 correto e pendência objetiva. |
| GZ-06 — aparelhos físicos | As revisões documentam emulação de viewport e explicitam que não substitui celular físico; não há aparelho Android identificado nem evidência de uso real nesta base examinada. | P0 correto; depende de aparelho e registro QA. |
| GZ-07 — versão publicada | A revisão de entrega declara que não houve auditoria de produção; hospedagem ainda não definida. | P0 correto, bloqueado por GZ-01. |
| GZ-11 — quinta descoberta | `src/journey-guide.js` contempla o estado em que as cinco histórias constam no diário. O backlog original juntava esse fechamento com a validação da primeira visita, embora a revisão de 10/11 classifique conclusão do percurso como P1. | Separado em P1 para manter prioridade e aceite coerentes com a revisão. A evidência de código não comprova ainda a validação de experiência/conteúdo final. |

## Registro da atualização

`docs/gestao/BACKLOG.md` agora deixa GZ-02 focado na validação com uma pessoa nova e atribui a tarefa a Engenharia Gorilazz e QA Gorilazz. A conclusão da quinta descoberta está separada como GZ-11 em P1. Nenhum critério acadêmico foi assumido. Os demais estados e prioridades permanecem como estavam, pois as evidências disponíveis sustentam que são tarefas pendentes.

## Limitações

Esta é uma triagem documental/local, não uma execução do produto nem uma validação externa. Os relatos anteriores no README e nas revisões foram lidos, não repetidos. A verificação de pessoa nova, aparelhos físicos, fontes online e hospedagem precisa de tarefa/autorização e dos recursos correspondentes. A autoria de commits permanece exclusivamente com Eduardo; nenhum commit/push/publicação foi feito.

## Complemento da auditoria de Engenharia Gorilazz

Leitura somente, sem testes ou alterações de código; as referências abaixo foram cruzadas com o código atual em 11/11.

- **GZ-02:** `index.html` oferece direção, passeio guiado e leitura. A auditoria aponta `src/app.js` e `src/journey-guide.js` como o fluxo de entrada/chegada. O encerramento é acionado pela interação de descoberta e há alternativas acessíveis; isso prova implementação, não compreensão por visitante novo. Mantida validação humana pendente, incluindo celular e alternativa sem WebGL quando disponíveis.
- **GZ-11:** `src/app.js` (linhas 216–242) mostra a conclusão após a quinta descoberta nova, com resumo e ações para diário e eras; `src/journey-guide.js` também tem estado para as cinco histórias no diário. A persistência é descrita em `README.md` e implementada no diário. Assim, GZ-11 é revisão de fluxo/progresso; não há base para abrir implementação antes da checagem. A linha de backlog foi atualizada para evitar sugerir que a tela ainda precisa ser criada.
- **GZ-03:** `index.html` já distingue a cronologia editorial 1998–2023 da cidade que cita lançamentos até 2026. Porém, `src/world-data.js` define 4 atos (Ato 4: 2017–2026) e 5 descobertas distribuídas em 3 regiões; as fichas usam `eraAt(point)` para ato/cor, enquanto o diário apresenta `REGIONS[point.region]`. `src/discoveries.js` contém quatro gravações por bairro/ato, e não oito eras. Há distinções de recorte, mas o mapeamento exibido ao visitante ainda requer revisão para evitar associações divergentes. Não se deve forçar equivalência um a um entre 8 eras, 4 atos, 3 regiões e 5 descobertas.

O backlog foi ajustado: GZ-03 passou a Em revisão; GZ-02 permanece Em revisão; GZ-11 P1 agora pede revisão do fluxo e só autoriza implementação se a auditoria encontrar uma lacuna. A definição da fonte editorial única e da regra de mapeamento continua necessária antes de alterar os dados compartilhados.

## Complemento da auditoria de QA Gorilazz

Auditoria de leitura, sem executar comandos nem alterar código. `package.json` declara `npm run check` (checagem sintática) e `npm test` (Node tests); os scripts `scripts/smoke-browser.py` e `scripts/audit-delivery.py` dependem de Playwright/local e guardam capturas. Nenhum deles foi executado nesta triagem. A revisão de 10/11 relata historicamente 41 testes aprovados, smoke em desktop/390/320/fallback e auditoria final nas larguras previstas; as capturas antigas existem, mas não há registro de execução atual em `docs/gestao/evidencias/testes/` além do README-modelo.

O código e os scripts não comprovam uso em computador/Android físicos, desempenho/FPS, rede real ou comportamento de publicação. Não há URL publicada na documentação examinada. Por isso GZ-06 segue aberto e GZ-07 foi marcado **Bloqueado — aguarda hospedagem/URL de GZ-01**. Quando Eduardo definir hospedagem e build alvo, QA poderá preparar o roteiro de sessão limpa; nenhuma visita ou teste remoto ocorreu nesta auditoria.

A auditoria confirma que não houve commit/push/publicação/submissão e que Eduardo continua sendo o único autor de commits. `RTK.md` e `AGENTS.md` não foram encontrados nos diretórios examinados.

## Complemento final da triagem de Engenharia Gorilazz

A segunda leitura do especialista confirma: GZ-02 está parcialmente implementado (três caminhos de entrada, roteiro/chegada e tela final), mas falta validar primeira visita e persistência ponta a ponta com pessoa nova. Referências: `index.html`, `src/app.js` (`openDiscovery()`, `discoveryFinale`, `persistJourney()`).

GZ-03 permanece parcialmente implementado: `index.html` distingue os recortes, mas o diário usa `DISCOVERIES[].region`, a ficha usa `eraAt(point)` e `src/discoveries.js` mantém quatro narrativas fixas de bairro/ato. Revisar consistência sem impor correspondência de um para um. Referências: `src/world-data.js` (`CITY_ERAS`, `eraAt`), `src/discoveries.js` (`archiveStops`) e `src/app.js` (`updateJournal()`, `openDiscovery()`).

GZ-05 permanece pendente: a cena carrega `noodle-diorama.glb`, mas autor e licença seguem nulos/sem identificação; os créditos visíveis indicam essa incerteza. Referências: `assets/environment/CREDITS.txt`, `assets/environment/manifest.json`, `src/environment.js` e `index.html`. Não atribuir origem nem licença sem confirmação; avaliar substituição por arte autoral se não for resolvido.

## Auditoria editorial de Pesquisa Gorilazz

Relatório do especialista recebido em 11/11/2026. As descobertas abaixo são **relatadas pelo especialista**, não foram reabertas/verificadas de forma independente pela Central nesta sessão. O trabalho foi leitura/pesquisa, sem edição, testes ou publicação.

### Fontes históricas e conteúdo

O agente relata ter consultado páginas oficiais que sustentam parte das datas: catálogo do álbum de estreia (26/03/2001), página do EP (novembro de 2000), página de The Fall (distribuição digital em 2010 e edição física em abril de 2011) e página de Demon Days (2005/participações). URLs informadas:

- [Gorillaz LP](https://store.gorillaz.com/products/gorillaz-lp)
- [Tomorrow Comes Today EP](https://usstore.gorillaz.com/products/tomorrow-comes-today-ep)
- [The Fall LP](https://store.gorillaz.com/products/the-fall-1-lp-black-copy)
- [Demon Days CD](https://usstore.gorillaz.com/products/demon-days-cd)
- [Site oficial Gorillaz](https://gorillaz.com/) e [catálogo oficial](https://usstore.gorillaz.com/collections/all-music)

A documentação do projeto já declara que checagem histórica online permanece pendente. A origem em 1998 precisa de fonte primária específica; datas/participações de eras e 11 faixas devem ter uma fonte direta por afirmação. Intenções/temas de músicas e clipes são interpretação editorial e precisam ser identificados como tal. Também precisam de fonte direta as fichas dos quatro integrantes, papéis, biografias e vozes; datas de vídeos oficiais; e qualquer dado comercial que venha a ser incluído. O recorte 1998–2023 pode continuar como recorte editorial fechado, separado explicitamente da ambientação da cidade que cita lançamentos até 2026. Não inventar estatísticas ou créditos.

### Assets e créditos ainda a conferir

- **Diorama Noodle (P0):** pacote `noodle.zip` incorporado; autor e licença não confirmados. A busca genérica/candidato visual não bastam. Tentar obter origem/licença junto a Eduardo; sem evidência compatível, substituir por arte própria antes de distribuir.
- **Escultura 2-D:** atribuição a Leam como publicador de scan, mas versão exata da licença não confirmada; não atribuir ao publicador a criação do personagem.
- **Geep shabaev e banda Phase 7/Redtricity:** README/REFERENCES registram CC BY 4.0, adaptações e fontes; conferir metadata/atribuição junto aos arquivos finais.
- **Kenney:** documentação usa cópia pública de terceiro; fonte oficial não abriu na verificação registrada. Confirmar origem/licença.
- **Flying windmill e Dudi Julianto:** referências não incorporadas; a primeira tem licença Standard sem download, a segunda sem licença pública consultada. Distinguir referências de assets autorizados.
- **Three.js/vendor, Toy Car e arquivos não inspecionados:** conferir texto de licença distribuído; Toy Car é apenas referência. Dois ZIPs recusados por tamanho não foram inspecionados nem incorporados.

O agente relata que créditos de áudio/arte/personagens não conferem por si sós permissão; manter o aviso de projeto independente e mapear direitos dos arquivos realmente distribuídos. Não remover créditos existentes.

### Próxima saída de Pesquisa

GZ-04 foi movido para **Em revisão**. O aceite agora pede tabela por afirmação com texto, fonte primária direta, trecho/página, URL, data de acesso e classificação Confirmado / Não confirmado / Interpretação. O formato final da bibliografia continua dependente da rubrica/norma, ainda não definida por Eduardo. A avaliação de licenças não é parecer jurídico; lacunas ficam explicitadas, não inferidas.

## Nota de estado de QA — GZ-06/GZ-07

QA Gorilazz recomenda manter ambos como P0 e `A fazer`: há capturas e smoke históricos em Chromium local/viewport, mas nenhum teste físico ou ensaio de URL publicado. A Central mantém GZ-06 como `A fazer` e GZ-07 como `Bloqueado — aguarda hospedagem/URL de GZ-01`, pois o aceite específico de GZ-07 requer uma URL publicada para abrir em sessão limpa. A prioridade P0 permanece inalterada; a divergência é somente sobre o estado até a dependência ficar disponível. Fontes locais: `README.md`, `docs/REVISAO-ENTREGA-30-NOVEMBRO.md`, `scripts/smoke-browser.py`, `scripts/audit-delivery.py` e capturas antigas em `artifacts/browser/` e `artifacts/delivery/`. Nenhuma dessas verificações foi repetida.
