# Roteiro de evolução do Gorilazz

## Percurso jogável

O visitante entra em Kong Studios, aprende a dirigir e escolhe uma das cinco histórias do mapa. As descobertas podem ser feitas em qualquer ordem. A primeira parada apresenta a criação da banda, a segunda apresenta os quatro integrantes, a terceira compara gêneros, a quarta liga Demon Days ao moinho e a quinta aborda os shows. Cada parada exige parar e escolher **Explorar**. O diário guarda o que foi encontrado.

A linha do tempo abaixo do mundo organiza oito eras entre 1998 e 2023. Ela separa fatos sobre músicos e lançamentos da ficção dos personagens. A cena usa modelos Phase 7 em todas as eras, então a troca de atmosfera não pretende representar os figurinos históricos de cada período.

## Camadas do mundo

1. **Condução.** O carro, a câmera e a física são atualizados em passos fixos. A rua mais próxima determina asfalto ou terra. O passeio guiado usa o grafo compartilhado com o mapa.
2. **Encontros.** Objetos e integrantes usam coordenadas compartilhadas por mapa, interação e cena. A ficha só abre depois de uma ação do visitante.
3. **Rádio.** As faixas editoriais mostram nome, disco e clipe. O rádio de arquivos locais reproduz áudio escolhido pelo visitante, mantém a reprodução durante a direção e avança ao fim da faixa. Arquivos locais precisam ser selecionados novamente após recarregar a página.
4. **Apresentação.** O cenário 3D concentra a experiência. Roteiro, rádio e instrumentos aparecem conforme a ação. Tela cheia usa a seção do jogo para manter controles e conteúdo acessíveis.

## O que foi melhorado nesta etapa

- Ruas mais largas, cruzamentos correspondentes e traçado visual menos apertado.
- Perspectiva interna com volante manipulável por ponteiro ou teclado.
- Rádio local contínuo, troca de músicas, tela cheia e instrumentos compactos.
- Fachadas com portas e faixas de base para diferenciar edifícios próximos à estrada.
- Reações e movimento dos integrantes geométricos quando o modelo Phase 7 estiver indisponível.

## Próximas entregas

1. **Arte da cidade.** Criar uma planta de cada região, com quadras, fachadas, calçadas, placas e pontos de referência próprios. A aceitação é reconhecer Kong, murais e moinho sem ler o HUD.
2. **Personagens.** Obter modelos com rigs e clipes autorizados. O GLB Phase 7 atual é estático, então movimentos reais de tocar guitarra e bateria exigem re-rigging ou novos arquivos. Verificar licença, autoria e custo de renderização antes da importação.
3. **Música.** Se houver autorização para distribuir as gravações, colocar os arquivos em `assets/audio` e cadastrar a lista no servidor. Cada faixa deve ter origem e licença registradas. Sem essa autorização, a importação local mantém a escuta privada no navegador.
4. **Polimento.** Testar em celular real, medir tempo de quadro, memória e tempo de carregamento. Ajustar nível de detalhe e quantidade de objetos segundo essas medidas.

Para qualquer mudança, executar `npm run check`, `npm test` e o fluxo de navegador em desktop, celular e modo sem 3D. Inspecionar ao menos uma captura da estrada e uma da perspectiva interna.

## Estradas e bairros

O mapa, o asfalto e a condução usam as mesmas três larguras: 15 unidades nas avenidas, 13 no acesso ao estúdio e 10 nas ligações secundárias. As marcas centrais seguem a distância percorrida pela curva. Calçadas, acostamentos e postes acompanham as tangentes. As fachadas do bairro dos murais recebem pintura lateral; os prédios do mirante têm marquises em tom de argila. O relevo distante é visual e a área dirigível continua plana.

A aceleração perde força à medida que o carro ganha velocidade. O volante retorna ao centro mais rápido do que entra na curva, e a câmera de viagem olha mais à frente conforme a velocidade. A frenagem muda a cor do arco do velocímetro.

Toda a geometria nova foi criada em código. Arbustos usam instâncias e elementos urbanos estáticos são agrupados por material. Os 39 testes incluem frenagem, colisão, ré e chegada aos cinco destinos. [Captura da avenida em Kong](visual/avenida-kong.jpg). Contadores de renderização variam conforme o enquadramento; o desempenho em celular físico ainda precisa ser medido.
