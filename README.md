# Gorilazz — A estrada

Projeto acadêmico interativo independente sobre Gorillaz. HTML, CSS e JavaScript, com cenário 3D WebGL e modelos geométricos autorais. Three.js 0.180.0 está incluído localmente em `src/vendor`, com licença MIT; não é necessário instalar pacotes nem carregar bibliotecas externas para executar.

## Executar

1. Instale Node.js 20 ou superior.
2. Abra o terminal na pasta `Gorilazz`.
3. Execute `npm run dev` (ou `npm start`). Não é necessário `npm install`.
4. Abra http://localhost:3000 no mesmo computador.

Use `PORT=4000 npm start` para escolher outra porta em shells compatíveis. O servidor escuta em todas as interfaces; use as configurações de rede adequadas ao ambiente.

## Explorar

- Setas esquerda/direita ou A/D avançam e voltam pela estrada; os botões na tela aceitam toque e podem ser mantidos pressionados. Pelo teclado, foque um botão e segure Espaço ou Enter.
- Encontrar um personagem abre sua ficha. Escape, × e “Voltar à estrada” fecham o diálogo. Afaste o carro antes de reencontrar o mesmo personagem.
- O contador registra personagens únicos, inclusive pelas fichas abertas pelo menu. O progresso é local à página e reinicia ao recarregar.
- As nove paradas são botões de navegação. Todas as fichas também estão na parada Personagens.
- Sem JavaScript há um resumo básico; dirigir e trocar paradas exigem JavaScript. Não há reprodução automática de música.

## Arquivos e validação

- `index.html`: estrutura semântica, cenário e diálogo.
- `src/style.css`: visual, responsividade e preferência por movimento reduzido.
- `src/app.js`: movimento por tempo, encontros, fichas, rádio, tour e paradas.
- `src/scene.js`: câmera, iluminação, carro, personagens e cenário WebGL gerados localmente.
- `src/vendor/`: Three.js 0.180.0 e licença MIT incluídos na distribuição.
- `server.mjs`: servidor HTTP com lista explícita de arquivos permitidos.
- `package.json`: comandos de execução e validação.

Execute `npm run check` para verificar a sintaxe do servidor e do JavaScript. Depois inicie o servidor e verifique `/`, `/src/style.css` e `/src/app.js`; rotas desconhecidas devem retornar 404. A verificação de sintaxe não substitui testes de navegador.

## Limitações e créditos

Protótipo acadêmico de Eduardo Alves Xavier, Gedson de Souza Mancio Júnior e Rafael Machado Colnaghi. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Sem vínculo oficial. O carro e as figuras são interpretações autorais esquemáticas, não arte oficial. Colisões cartunescas, sem violência gráfica.

A discografia é um recorte inicial até 2023 e precisa de atualização; textos introdutórios precisam de revisão para uso acadêmico final. O suporte a teclado, diálogo nativo e foco visível não constitui certificação de acessibilidade. Validar com tecnologias assistivas e dispositivos reais antes de publicação final.

## Experiência 3D e apresentação

A viagem começa com os quatro integrantes ao redor do carro. “Banda ao redor” reúne ou devolve os personagens às suas posições na estrada. Clique em um personagem 3D ou nos cartões para abrir sua ficha. Modelos são interpretações geométricas autorais, não reproduções oficiais.

“Tour automático” avança pela estrada e pausa ao encontrar um personagem; feche a ficha e ative novamente para continuar a apresentação. “Câmera orbital” gira ao redor do carro; clique novamente para voltar à câmera de viagem. Escolher uma das nove paradas leva o carro até a região correspondente. O rádio acompanha a região com oito sugestões de músicas; anterior/próxima permitem explorar a seleção independentemente.

“Abrir clipe” carrega um player do YouTube apenas após a ação do visitante, sem reprodução automática. É necessário acesso à internet para o vídeo e a disponibilidade pode variar conforme região, rede ou permissões de incorporação. Há também um link direto para cada vídeo. A estrada, o conteúdo e a seleção de músicas funcionam offline com o servidor local.

WebGL é necessário para o cenário 3D. Se indisponível, a estrada 2D original é exibida e as fichas e paradas continuam acessíveis. A preferência por movimento reduzido desativa a órbita automática e animações decorativas; o deslocamento comandado pelo visitante permanece funcional.

Validação da edição 3D: sintaxe e rotas HTTP; navegador Chromium com renderização WebGL por software para tour, câmera, colisão, fichas, contador, rádio, incorporação opt-in, layout móvel e movimento reduzido. Emulação móvel não substitui testes em aparelhos físicos. A reprodução dos vídeos externos e a acessibilidade com leitores de tela não foram certificadas.

## Edição imersiva

A experiência abre diretamente no mundo 3D, com uma ilha de apresentação, portais, discos flutuantes e os quatro integrantes ao redor do carro. “Entrar no universo” libera a exploração sem iniciar som ou deslocamento automático.

- Arraste o cenário horizontalmente para girar a câmera e verticalmente para ajustar a altura. Os botões +, − e ↺ aproximam, afastam e restauram a vista. Com o cenário focado, Home também restaura a câmera.
- A câmera acompanha o carro com interpolação; a atmosfera muda entre regiões. Movimento reduzido elimina a interpolação e as animações decorativas, preservando a navegação explícita.
- Os nove botões numerados dentro do cenário levam às paradas. “Abrir esta parada” leva ao conteúdo textual e posiciona o foco no painel.
- Setas/A/D, botões de direção, tour e câmera orbital continuam disponíveis. No celular, a faixa de paradas pode ser deslizada horizontalmente.
- Se WebGL falhar, a estrada 2D e os conteúdos permanecem; controles exclusivos da câmera 3D ficam desativados.

A direção desta edição prioriza exploração e câmera em um universo musical, conforme a referência indicada pelo usuário, “Yamê: The Molazone”. O site de referência não pôde ser inspecionado neste ambiente; a implementação é autoral, sem reutilização de código ou arquivos daquele site.
