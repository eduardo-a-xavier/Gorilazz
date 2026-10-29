# Gorilazz — plano de mundo aberto, condução e descobertas

Status: primeira versão implementada em 29/10/2026 e integrada à revisão histórica do `main`. Inclui três regiões, direção livre, cinco descobertas, diário local, mapa, encontros explícitos e passeio guiado. Foram preservadas oito eras, onze faixas e a leitura ampliada. Posição e integrantes também ficam salvos, com recuperação dos integrantes da versão anterior. As seções abaixo registram a direção do projeto; expansões como cinco regiões, partículas, sons e derrapagem continuam futuras.

## Objetivo

Transformar a viagem em exploração livre de um mundo aberto compacto: dirigir o Geep, escolher caminhos, sair da estrada e descobrir lugares com histórias, músicas e integrantes da banda. Manter a identidade visual, os modelos e o rádio. As nove paradas atuais passam a organizar o conteúdo; deixam de determinar uma sequência espacial obrigatória.

Direção confirmada pelo usuário: poder ir atrás das coisas, atravessar o mundo e encontrar um ponto de história pelo caminho. A condução deve servir a essa descoberta.

## Diagnóstico do projeto

Repositório identificado: https://github.com/eduardo-a-xavier/Gorilazz. Base local analisada: `ec6b9eb`, branch `work`.

- `src/app.js`: A/D e setas alteram diretamente `position` a uma taxa fixa de `0.035` volta por segundo. Soltar o botão interrompe o movimento imediatamente. A viagem para uma parada usa outra taxa fixa, `0.17`. Não existe estado de velocidade, aceleração, frenagem ou direção independente.
- `src/route.js`: `routePose()` calcula um círculo de raio 58. O Geep sempre ocupa o centro da pista e sua orientação acompanha a tangente; o jogador não escolhe a trajetória.
- `src/scene.js`: a estrada é um `RingGeometry`, com bordas circulares. Rodas acompanham a distância percorrida, mas a oscilação do carro depende apenas de tempo e de um booleano `moving`.
- Os encontros são disparados por diferença de progresso na volta, sem considerar distância espacial ou velocidade. A ficha abre automaticamente, interrompendo a viagem.
- Há recursos que precisam continuar funcionando: tour, seleção de paradas, câmera orbital, câmera aérea, foco no moinho, banda ao redor, galeria, diálogos acessíveis e alternativa sem WebGL.

A principal mudança é separar os comandos do jogador do progresso de leitura da página. Posição e orientação pertencem ao veículo; o conteúdo é encontrado por proximidade com lugares reais no mapa. Uma porcentagem de volta deixa de ser o indicador principal.

## Experiência proposta

### Controles

| Ação | Computador | Celular |
| --- | --- | --- |
| Acelerar | W / seta para cima | Pedal de aceleração |
| Frear | S / seta para baixo | Pedal de freio |
| Virar | A/D / esquerda e direita | Dois botões de direção |
| Marcha à ré | Freio novamente após parar e soltar o comando | Mesmo comportamento no pedal |
| Interagir | E, perto de uma descoberta ou integrante | Botão contextual |
| Ver descobertas | Botão “Meu diário” | Mesmo botão |
| Reposicionar | Botão “Voltar ao caminho” | Mesmo botão |

O freio não deve engatar a ré no mesmo pressionamento usado para parar. Toques simultâneos devem permitir acelerar e virar. Se acelerador e freio forem pressionados juntos, o freio tem prioridade. Comandos não podem interferir com links, botões ou diálogos focados.

### Sensação de condução

1. A velocidade aumenta gradualmente com o acelerador.
2. Ao soltar, o carro continua por inércia e perde velocidade por resistência.
3. O freio reduz a velocidade sem inverter o sentido por acidente.
4. O volante retorna suavemente ao centro. Curvas ficam mais abertas em alta velocidade e mais fechadas em baixa velocidade.
5. Terra e grama oferecem resistência maior que as ruas, mas continuam transitáveis. Limites naturais e um botão de recuperação impedem perder o veículo.
6. A câmera antecipa a direção da viagem, incluindo marcha à ré, e acompanha o carro com suavidade.

Usar uma física arcade simples, com posição no plano, orientação e velocidade. Uma simulação completa de suspensão e pneus não é necessária para esta etapa.

Parâmetros iniciais para ajuste, considerando aproximadamente uma unidade de cena por metro: velocidade máxima de 22 m/s, ré de 6 m/s, aceleração de 6 m/s², frenagem de 12 m/s² e entre-eixos de aproximadamente 4 unidades, a confirmar pelos pivôs do Geep. São hipóteses de protótipo, não valores validados de jogabilidade.

### Mundo aberto e caminhos

Substituir o anel por uma ilha explorável com ruas conectadas, bifurcações, atalhos de terra e áreas abertas. O Geep usa coordenadas livres no mundo; estradas orientam e facilitam o deslocamento, sem prender o carro a uma linha.

Primeiro mapa sugerido, com identidade própria em cada região:

| Região | Papel na exploração | Descoberta sugerida |
| --- | --- | --- |
| Kong Studios / praça inicial | Aprender os controles e escolher entre dois caminhos visíveis | Primeiro painel de história |
| Bairro de murais | Curvas e ruas conectadas, com atalhos | Mural sobre a criação da banda |
| Mirante do moinho | Marco visível de longe para orientar a curiosidade | Ponto sobre a era Demon Days |
| Costa inspirada em Plastic Beach | Área aberta e caminho de terra | Instalação sobre os temas do álbum |
| Pátio de ensaio | Espaço para estacionar e conhecer integrantes | Fichas e sugestões de músicas |

As regiões são cenários autorais inspirados na estética do projeto; não devem apresentar lugares ou acontecimentos inventados como história oficial da banda. Na primeira entrega, implementar três áreas conectadas e cinco descobertas bem distribuídas; ampliar o mapa após validar a exploração.

Cada trecho de rua usa sua própria curva suave, com superfície, bordas e marcações geradas pela mesma geometria. Um grafo liga cruzamentos e acessos aos pontos de interesse para assistência de navegação. A física do veículo continua independente desse grafo.

Manter o primeiro terreno predominantemente plano. Colisões simples em construções, pedras e limites da ilha; grama e terra transitáveis. Criar mirantes, silhuetas e sinalização que ajudem a escolher caminhos sem depender o tempo todo de um mapa.

### Ciclo de descoberta

1. O visitante vê algo interessante: um mural, antena, construção, luz ou integrante.
2. Decide como chegar e dirige até o lugar, podendo mudar de ideia no caminho.
3. Ao se aproximar, surge uma dica discreta; em baixa velocidade, pode pressionar E ou tocar em “Explorar”.
4. Abre uma história curta, ficha ou sugestão de música, com opção de continuar lendo.
5. A descoberta entra no diário e o visitante escolhe o próximo rumo.

Exemplo: sair de Kong Studios, escolher uma rua lateral, encontrar um mural e descobrir como Damon Albarn e Jamie Hewlett criaram a banda; depois avistar o moinho e decidir seguir até ele.

Não exigir uma ordem de visita. O diário lista o que já foi encontrado e permite reler. Pontos desconhecidos podem aparecer como silhuetas ou sinais no próprio cenário; o mapa detalha os locais descobertos. O conteúdo acadêmico continua disponível pelo menu para quem prefere consultar sem dirigir.

Guardar descobertas e preferências em `localStorage`, com alternativa em memória se o armazenamento falhar e opção explícita de reiniciar o progresso. Não exigir conta ou servidor para esse progresso local.

### Encontros e paradas

- Distribuir integrantes e objetos de história por áreas de encontro no mundo, com identidade visual reconhecível.
- Exibir “E — conhecer Noodle”, por exemplo, quando o veículo estiver perto e em baixa velocidade. Usar distância no mundo, não apenas porcentagem de volta.
- Abrir a ficha ou história somente após a interação explícita. A galeria e o menu de conteúdo continuam dando acesso direto às informações.
- Aplicar limites simples ao redor dos personagens para evitar atravessá-los.
- Manter contador de personagens únicos, restauração de foco e anúncio acessível já existentes.
- Separar gatilhos de entrada e saída da área de interação para a dica não piscar no limite.

### Resposta visual

Mostrar velocidade, sentido de marcha e estado do freio em um painel discreto. Giro das rodas deve derivar da distância real percorrida, com rodas dianteiras orientadas pelo volante. Inclinação nas curvas e mergulho ao frear devem responder à dinâmica, com amplitudes pequenas.

Movimentos decorativos, balanço da câmera e efeitos de velocidade devem respeitar a preferência por movimento reduzido. Atualizações de velocidade não devem ser anunciadas continuamente por leitor de tela. Sons e partículas são complementos posteriores; não devem atrasar os controles básicos.

## Estrutura técnica proposta

Manter JavaScript modular e Three.js locais, sem nova dependência de execução. Separar dados de descobertas da construção visual do mundo.

| Arquivo | Responsabilidade |
| --- | --- |
| `src/input.js` — novo | Converter teclado e ponteiros em acelerador, freio, direção e interação; limpar entradas em blur, cancelamento e pausa. |
| `src/driving.js` — novo | Estado do Geep, aceleração, resistência, frenagem, ré e integração em passos fixos; sem dependência do DOM ou Three.js. |
| `src/route.js` — adaptar | Curvas das ruas, amostras, distância acumulada e projeção local para navegação assistida. |
| `src/world-data.js` — novo | Regiões, ruas, cruzamentos, pontos de interesse, marcos, obstáculos e locais seguros de recuperação. |
| `src/discoveries.js` — novo | IDs de descobertas, textos, referências, estado do diário e persistência local. |
| `src/navigation.js` — novo | Caminho pelo grafo de ruas, tour e direção assistida, produzindo os mesmos comandos da condução manual. |
| `src/interactions.js` — novo | Proximidade espacial dos pontos de interesse, velocidade e disponibilidade de interação. |
| `src/scene.js` — adaptar | Construir terreno, ruas e marcos; renderizar veículo, rodas, câmera e personagens a partir do estado físico. |
| `src/app.js` — simplificar | Coordenar exploração, diário, fichas, rádio e interface. |
| `index.html` e `src/style.css` — adaptar | Pedais, direção, painel de velocidade, dica contextual e disposição móvel. |
| `server.mjs` e `package.json` — adaptar | Permitir servir os novos módulos e incluí-los nas verificações existentes. |

Fluxo: **entrada → comandos → física → posição livre → regiões / pontos próximos → cena, interação e diário**.

Estado mínimo do veículo: `{ x, z, heading, speed, steering, acceleration, distanceTravelled }`. O sentido é representado pelo sinal de `speed`; `distanceTravelled` acumula deslocamento real para animação das rodas. Uma descoberta usa, por exemplo, `{ id, position, radius, type, title, contentId }`; a posição não depende do índice de um capítulo.

A física deve usar passo fixo, por exemplo 1/120 s, com acumulador e limite de recuperação após uma pausa. Ao ocultar a aba, abrir um diálogo ou perder o foco, limpar comandos e suspender a simulação; ao retomar, não executar o tempo acumulado. Paradas deliberadas, como abrir uma ficha, devem zerar a velocidade para evitar retomada inesperada.

Para assistência de navegação e classificação de piso, projetar a posição do veículo nas amostras das ruas próximas. Cruzamentos precisam de identificação de trechos e conexões explícitas no grafo. A projeção não deve reposicionar o carro nem limitar a exploração manual. Usar obstáculos simplificados e limites do mundo na física; reservar geometria detalhada para a cena.

## Navegação opcional, rádio e alternativa 2D

O visitante pode escolher um lugar descoberto e pedir uma rota. A indicação pode começar com uma seta ou caminho destacado; direção automática entra depois da exploração manual básica. Quando implementados, tour e viagem assistida devem usar o mesmo modelo físico: seguir ruas, reduzir nas curvas e frear ao chegar. Entrada manual cancela imediatamente a assistência. Abrir um diálogo suspende a simulação.

Preservar a seleção direta das nove categorias de conteúdo. O rádio acompanha regiões do mundo, com tolerância nas fronteiras para evitar alternância repetida; a descoberta também pode sugerir uma faixa sem interromper a escolha manual. Nenhuma mídia começa a tocar automaticamente.

Sem WebGL, oferecer uma representação 2D simplificada ou uma lista acessível de lugares e descobertas. A alternativa deve explicar seus controles e preservar acesso completo às fichas, histórias e diário.

## Etapas de entrega

### 1 — Condução básica

Criar entrada e física, integrar aceleração, freio, ré deliberada e direção. Preparar uma área simples de teste. Critério de conclusão: soltar o acelerador produz inércia, frear para o veículo e virar altera sua trajetória; comportamento consistente em diferentes taxas de quadros.

### 2 — Primeiro mundo explorável

Substituir o círculo por três áreas conectadas, com pelo menos duas escolhas de caminho e um atalho transitável fora do asfalto. Atualizar terreno, placas, personagens e câmera aérea. Critério: chegar a uma mesma descoberta por caminhos diferentes, sair e voltar à rua livremente e recuperar um carro preso.

### 3 — Exploração integrada

Distribuir cinco descobertas, implementar proximidade, interação explícita, diário e persistência local. Critério: visitar em qualquer ordem, reler uma história e recuperar descobertas após recarregar; passar perto em alta velocidade não abre um diálogo. Todas as categorias acadêmicas continuam acessíveis pelo menu.

### 4 — Acabamento e validação

Ajustar câmera, rodas, inclinação, painel e controles móveis. Testar movimento reduzido, teclado, diálogos, cancelamento de toque e alternativa 2D. Adicionar navegação assistida e recuperar os modos de câmera sobre o novo mundo. Só depois ampliar para cinco regiões e avaliar derrapagem, obstáculos móveis, áudio e desafios opcionais.

## Validação necessária na implementação

- Física: aceleração limitada, desaceleração por resistência, frenagem sem troca involuntária de sentido, ré deliberada, freio prioritário e estabilidade em 30/60/120 FPS.
- Mundo: conexões entre áreas, ruas alinhadas ao terreno, atalho transitável, limites, colisões simples e recuperação em local seguro. Substituir os testes que exigem raio constante pelos contratos das ruas e suas conexões.
- Navegação: encontrar caminhos no grafo, chegar a um destino, reduzir em curvas e cancelar assistência por comando manual, quando essa função for implementada.
- Interações e diário: proximidade real e velocidade baixa; não disparar através de obstáculos; descoberta única, visita fora de ordem, foco restaurado e persistência com armazenamento disponível ou bloqueado.
- Navegador: WebGL, carregamento e alternativas dos modelos, quatro pivôs de roda, pedais simultâneos, layout móvel e suspensão em aba oculta ou diálogo aberto.
- Servidor: os novos módulos precisam responder com MIME JavaScript; arquivos fora da lista permitida continuam inacessíveis.

## Verificação

Na base original `ec6b9eb`, os seis testes de geometria circular passaram. Na implementação integrada à revisão histórica `2adf21d`, `npm run check` e os 36 testes passaram, incluindo condução, encontros, navegação para os cinco destinos e persistência/migração do progresso.

O Chromium verificou os modelos locais, os quatro pivôs de roda, a descoberta explícita e os diálogos. A versão sem WebGL foi usada para verificar também aceleração, direção, freio, ré, releitura, recarregamento, navegação pelo diário e confirmação de reinício. A emulação móvel verificou largura da página, pedais simultâneos, cancelamento de toque e pausa ao perder o foco. Não houve teste em aparelho físico.

## Resultado esperado

O visitante sai dirigindo sem uma sequência obrigatória, vê algo interessante, procura um caminho e encontra uma história. Aceleração, freio e direção tornam essa busca agradável; o diário transforma a exploração em conhecimento que pode ser retomado depois. O primeiro objetivo é um mundo pequeno e interessante de explorar, com descobertas bem distribuídas.
