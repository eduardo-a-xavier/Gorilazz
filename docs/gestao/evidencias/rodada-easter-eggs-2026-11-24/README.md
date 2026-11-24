# Easter eggs — andamento parcial

Murdoc colossal reaproveita as texturas do modelo Phase 7 já carregado e cópias da geometria. As imagens `murdoc-avenida-1.png` e `murdoc-avenida-2.png` são enquadramentos de depuração; não comprovam visibilidade durante a direção. O contorno e os olhos ainda precisam de avaliação visual no percurso.

Alce e trailer são modelos geométricos simples. `alce.png` mostra o protótipo; `trailer-rascunho.png` e `cartaz-rascunho.png` antecedem os últimos ajustes visuais. Os quatro cartazes compartilham um atlas de textura. Faltam capturas finais dos quatro cartazes, do trailer e comparações antes/depois.

A distância calculada entre as bases e a borda da pista é de 8,40 m para o alce, 9,86 m para o trailer e entre 3,84 m e 9,68 m para os cartazes. A menor distância entre centros e palcos é 38,02 m. Esses cálculos não substituem o passeio nem a revisão de obstrução visual.

A tecla G produz um tom sintetizado curto, com intervalo mínimo de 800 ms. No navegador foi observado um oscilador em dois acionamentos imediatos e nenhum novo com mapa, menu, ajuda ou silêncio ativo; o rótulo aparece em `menu-buzina.png`. Não foi avaliada a semelhança auditiva com risada e melódica.

`npm run check` passou e `npm test` passou com 209 testes. FPS, p95/p99, peso inicial, erros completos de rede e passeio de nove paradas permanecem pendentes: o navegador em segundo plano limitou os quadros, invalidando a medição de FPS.

## Créditos

Easter eggs do mapa 3D: homenagens autorais criadas pela equipe do projeto, inspiradas na obra e no universo fictício do Gorillaz (1998–2023), sem uso de arquivos originais da banda. O modelo Phase 7 preexistente tem créditos próprios no projeto. A placa M1-N4-STY é licença criativa do projeto, sem confirmação como placa oficial. O aviso de zumbis é criação autoral inspirada no universo fictício. Referências: `docs/gestao/easter-eggs-referencias.md`.

## Correção de olhos e cartaz

O carregador normaliza `murdoc_Murdoc_Head.smd` para `murdoc_Murdoc_Headsmd`; a identificação agora aceita ambas as formas. `murdoc-olhos-debug.png` mostra os dois pontos âmbar de uma câmera de depuração, não do trajeto. `save-sem-arvore.png` mostra o cartaz após excluir a árvore que coincidia com ele do plano de props.

Foi testado o colossal com 82 m em (-148, -120), mas a cabeça ficou fora do quadro na câmera normal da Clint Eastwood. A escala e posição anteriores foram restauradas; a visibilidade nas três avenidas continua pendente. Não se mediu FPS nem p95/p99 depois desta correção. `npm run check` e `npm test` passaram (211 testes); o passeio de nove paradas não foi refeito nesta rodada.

## Landmark monumental de 20 m

O antigo de 48 m em (-165, -140) foi substituído pelo landmark monumental de 20 m em (-150, -75), com o mesmo modelo e texturas, olhos âmbar, contorno e névoa. A mudança responde ao enquadramento baixo da câmera de terceira pessoa e à obstrução pelos prédios. A caixa real medida na cena vai de X -153,13 a -147,12, fora do limite dirigível X -135. A folga calculada do centro até a borda do asfalto é 60,06 m; com raio conservador de 5 m, a folga é 55,06 m. O palco mais próximo fica a 87,61 m do centro.

Capturas em terceira pessoa: `landmark-clint-20m.png` (veículo -37, -54; direção 1,430 rad), `landmark-saturnz-20m.png` (-57, -144; 2,151 rad) e `landmark-song-20m.png` (-36, -101; 1,399 rad). Usam movimento reduzido para estabilizar a câmera. Os testes de raio ao centro da cabeça não encontraram bloqueio em Clint e Saturnz; em Song Machine encontraram um prédio. Porém nas capturas a figura não se destaca claramente, e as duas primeiras não comprovam o aceite visual. Uma varredura de 12 rotações e três inclinações (-0,15, 0 e +0,15 rad) não desobstruiu o centro da cabeça em Song Machine; a rotação original foi mantida. Um raio à cabeça não substitui a verificação da silhueta completa.

`npm run check` e `npm test` passaram (212 testes). Não foram medidos FPS e p95/p99 nesta versão: o navegador em segundo plano limita os quadros. O passeio de nove paradas e a ausência de obstrução visual de todos os palcos e descobertas não foram verificados nesta rodada.

## Murdoc lunar

O landmark no chão foi removido. Um busto usa a geometria e as texturas do Murdoc já carregado, sem pernas e sapatos, com olhos âmbar e contorno no material. Um halo procedural dispensa arquivo de textura. O grupo acompanha a posição da câmera, preservando a direção fixa do astro; seus materiais não usam névoa, e os prédios são desenhados por cima. O halo usa teste de profundidade para não cobrir prédios. Como a lua, ele sai do quadro quando a câmera aponta em outra direção.

Para mostrar o céu na câmera de viagem e na vitrine, o campo de visão de terceira pessoa passou de 46° para 75° e o alvo vertical foi elevado de 2 m para 8 m. Isso altera o enquadramento do jogo e requer avaliação em movimento, inclusive em celular; as capturas isoladas não comprovam ausência de regressão. Primeira pessoa, vista aérea e mirante mantêm seus próprios campos de visão.

Capturas de 1440x900: `lunar-vitrine.png` e quatro vistas com movimento reduzido para estabilizar a câmera: `lunar-clint.png` (-37, -54; direção 1,430), `lunar-saturnz-1.png` (-57, -144; 2,151), `lunar-song.png` (-36, -101; 1,399) e `lunar-saturnz-2.png` (-73,06, -126,19; 2,15). Não são evidência de um passeio contínuo, nem cobrem todos os estados de dia/noite ou direções.

Uma comparação pontual do renderer com o grupo oculto e visível acrescentou 9 chamadas de desenho e 20.862 triângulos naquela vista; não é uma medição de FPS. O navegador em segundo plano limita os quadros, portanto FPS e p95/p99 permanecem sem medição válida. Peso inicial e percurso completo também não foram medidos. Não houve diagnósticos novos na navegação observada; isso não substitui o aceite completo de erros. `npm run check` e `npm test` passaram (213 testes).

## Disco lunar ampliado e câmera

O busto agora aparece sobre um disco escuro procedural. O disco tem diâmetro angular calculado de aproximadamente 20,8°, sem arquivo de textura novo. O centro ficou a cerca de 9° de elevação, abaixo dos 20°–35° da proposta anterior: com a câmera mais estreita, elevá-lo mais cortava a parte superior. Prédios continuam sendo desenhados por cima e podem esconder parte do disco; na vitrine, um prédio cobre parte do rosto.

O FOV de viagem mudou de 75° para 60°. O alvo vertical mudou de 8 m para 7 m; valores de 4–5 m foram testados por projeção, mas deixaram o disco maior cortado ou muito atrás dos prédios. A vitrine também recebeu deslocamento de câmera e alvo para afastar o disco do texto. A primeira pessoa segue com FOV de 75° no desktop, confirmado no navegador. O enquadramento ainda precisa de revisão da sensação de direção em movimento e em telas móveis.

Comparação estática: `lunar-clint.png` é a versão anterior com FOV 75°; `lua-maior-clint-1.png` é a nova no mesmo ponto (-37, -54; direção 1,430). Outras imagens: `lua-maior-clint-2.png` (-16,25, -52,5; 1,43), `lua-maior-saturnz.png` (-57, -144; 2,151), `lua-maior-song.png` (-36, -101; 1,399) e `lua-maior-vitrine.png` (posição inicial). As imagens usam movimento reduzido e teleporte para estabilizar os pontos; não provam a experiência do passeio. Em direções opostas a lua fixa sai do enquadramento.

`npm run check` e `npm test` passaram (214 testes). O navegador disponível limita quadros em segundo plano: FPS, p95/p99 e percurso de nove paradas não foram medidos nesta versão. Não houve diagnóstico novo durante as capturas, sem caracterizar uma auditoria completa de erros.
