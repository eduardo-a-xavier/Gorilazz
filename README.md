# Gorilazz — A estrada

Projeto acadêmico interativo independente sobre Gorillaz. HTML, CSS e JavaScript, com cenário e personagens geométricos autorais em WebGL, e veículo GLB Kenney sob CC0. Three.js 0.180.0 está incluído localmente em `src/vendor`, com licença MIT; não é necessário instalar pacotes nem carregar bibliotecas externas para executar.

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
- `src/scene.js`: câmera, iluminação, carregamento do SUV GLB, personagens e cenário WebGL.
- `src/vendor/`: Three.js 0.180.0 e licença MIT incluídos na distribuição.
- `server.mjs`: servidor HTTP com lista explícita de arquivos permitidos.
- `package.json`: comandos de execução e validação.

Execute `npm run check` para verificar a sintaxe do servidor e do JavaScript. Depois inicie o servidor e verifique `/`, `/src/style.css` e `/src/app.js`; rotas desconhecidas devem retornar 404. A verificação de sintaxe não substitui testes de navegador.

## Limitações e créditos

Protótipo acadêmico de Eduardo Alves Xavier, Gedson de Souza Mancio Júnior e Rafael Machado Colnaghi. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Sem vínculo oficial. O veículo é o SUV do Kenney Car Kit sob CC0. As figuras são interpretações autorais esquemáticas, não arte oficial. Colisões cartunescas, sem violência gráfica.

A discografia é um recorte inicial até 2023 e precisa de atualização; textos introdutórios precisam de revisão para uso acadêmico final. O suporte a teclado, diálogo nativo e foco visível não constitui certificação de acessibilidade. Validar com tecnologias assistivas e dispositivos reais antes de publicação final.

## Experiência 3D e apresentação

A viagem começa com os quatro integrantes ao redor do carro. “Banda ao redor” reúne ou devolve os personagens às suas posições na estrada. Clique em um personagem 3D ou nos cartões para abrir sua ficha. Os personagens são interpretações geométricas autorais, não reproduções oficiais. O SUV é um modelo Kenney sob CC0.

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

## Jipe e circuito circular

A estrada 3D agora fecha um círculo: é possível seguir dando voltas em qualquer sentido. A câmera acompanha o jipe na tangente das curvas. “Ver circuito” alterna entre acompanhamento e vista aérea do anel; arraste, zoom e restauração continuam disponíveis. A navegação por paradas escolhe o caminho mais curto.

O veículo padrão é `assets/models/kenney-suv.glb`, do **Kenney Car Kit**, sob **CC0**, com estepe e rodas separadas. Há uma segunda opção de download em `assets/models/kenney-suv-luxury.glb`. Ambos podem ser abertos em Blender ou outro editor compatível com glTF 2.0. A seção “Um jipe. Um mundo em volta.” contém os downloads no próprio site.

Veja [REFERENCES.md](REFERENCES.md) para fontes, autoria, licença e hashes SHA-256. O modelo padrão é servido localmente pelo `server.mjs`; nenhuma conexão externa é necessária para carregar o jipe. Se ele falhar, um veículo geométrico mantém a experiência disponível. O fallback sem WebGL usa a representação 2D, mantendo navegação e fichas.

`src/route.js` concentra posição, orientação, normalização e distância circular. A música e as paradas acompanham a posição dentro da volta; o progresso não é salvo ao recarregar.

Execute `npm test` para os seis testes do circuito: fechamento de volta, tangente do jipe, deslocamento lateral, nove posições distintas, caminho mais curto e encontros na emenda. A versão circular também foi validada no Chromium com carregamento do GLB local, vista aérea, passagem pela emenda nos dois sentidos, download real e fallback do veículo.

## Referências escolhidas no Sketchfab

A seção “As peças deste universo” apresenta os links escolhidos, autoria, licença e prévias oficiais sob escolha do visitante. O carro “Gorrilaz Car BlockBench”, de shabaev (CC BY 4.0), está disponível para download autenticado, mas seu arquivo ainda precisa ser fornecido para substituir o SUV local. O “Flying windmill”, de zeee7 (Standard), não oferece download. Os detalhes verificados estão em [REFERENCES.md](REFERENCES.md).

O botão “Ver moinho” aproxima a câmera de uma ilha flutuante com moinho **provisório autoral**, gerado localmente e com pás animadas. Não é o arquivo do Sketchfab. “Restaurar câmera” volta ao acompanhamento do jipe. Movimento reduzido interrompe as animações decorativas.

As prévias externas abrem em um diálogo, suspendem o deslocamento e restauram o foco ao fechar; fechar também remove o iframe. O conteúdo local permanece disponível sem internet. Não é necessário fornecer credenciais para executar o projeto; o bloqueio de autenticação se aplica apenas ao download pendente do carro no serviço externo.

Validação desta seleção: sintaxe e seis testes de geometria passaram; moinho e câmera foram verificados em WebGL no Chromium, inclusive layout móvel. Os diálogos, créditos, Escape, limpeza de iframe e foco passaram com respostas externas simuladas. A tentativa real do visualizador Sketchfab falhou no navegador deste ambiente; não se confirmou a renderização dos modelos externos. O fallback 2D também foi verificado atravessando a emenda em marcha à ré sem sair dos limites da estrada.
