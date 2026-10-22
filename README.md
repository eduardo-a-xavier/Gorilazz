# Gorilazz — A estrada

Projeto acadêmico interativo independente sobre Gorillaz. HTML, CSS e JavaScript puro, com ilustrações esquemáticas autorais em SVG e CSS, sem imagens, fontes ou dependências externas obrigatórias.

## Executar

1. Instale Node.js 20 ou superior.
2. Abra o terminal na pasta `Gorilazz`.
3. Execute `npm run dev` (ou `npm start`). Não é necessário `npm install`.
4. Abra http://localhost:3000 no mesmo computador.

Use `PORT=4000 npm start` para escolher outra porta em shells compatíveis. O servidor escuta em todas as interfaces; use as configurações de rede adequadas ao ambiente.

## Explorar

- Setas esquerda/direita ou A/D movem o carro; os botões na tela aceitam toque e podem ser mantidos pressionados. Pelo teclado, foque um botão e segure Espaço ou Enter.
- Encontrar um personagem abre sua ficha. Escape, × e “Voltar à estrada” fecham o diálogo. Afaste o carro antes de reencontrar o mesmo personagem.
- O contador registra personagens únicos, inclusive pelas fichas abertas pelo menu. O progresso é local à página e reinicia ao recarregar.
- As nove paradas são botões de navegação. Todas as fichas também estão na parada Personagens.
- Sem JavaScript há um resumo básico; dirigir e trocar paradas exigem JavaScript. Não há reprodução automática de música.

## Arquivos e validação

- `index.html`: estrutura semântica, cenário e diálogo.
- `src/style.css`: visual, responsividade e preferência por movimento reduzido.
- `src/app.js`: movimento por tempo, encontros, fichas e paradas.
- `server.mjs`: servidor HTTP com lista explícita de arquivos permitidos.
- `package.json`: comandos de execução e validação.

Execute `npm run check` para verificar a sintaxe do servidor e do JavaScript. Depois inicie o servidor e verifique `/`, `/src/style.css` e `/src/app.js`; rotas desconhecidas devem retornar 404. A verificação de sintaxe não substitui testes de navegador.

## Limitações e créditos

Protótipo acadêmico de Eduardo Alves Xavier, Gedson de Souza Mancio Júnior e Rafael Machado Colnaghi. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Sem vínculo oficial. O carro e as figuras são interpretações autorais esquemáticas, não arte oficial. Colisões cartunescas, sem violência gráfica.

A discografia é um recorte inicial até 2023 e precisa de atualização; textos introdutórios precisam de revisão para uso acadêmico final. O suporte a teclado, diálogo nativo e foco visível não constitui certificação de acessibilidade. Validar com tecnologias assistivas e dispositivos reais antes de publicação final.
