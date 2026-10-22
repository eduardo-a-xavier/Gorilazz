# Gorilazz — A estrada

Uma experiência acadêmica para explorar o universo Gorillaz em um circuito 3D: dirija o Geep, encontre os quatro integrantes, visite nove paradas e descubra oito sugestões de músicas.

## Executar na sua máquina

1. Instale **Node.js 20 ou superior**.
2. Abra o terminal na pasta `Gorilazz`.
3. Execute `npm run dev` (ou `npm start`). **Não precisa de `npm install`**.
4. Abra http://localhost:3000 no mesmo computador.

Mantenha o terminal aberto e use Ctrl+C para encerrar. A porta padrão é 3000; em shells compatíveis, `PORT=4000 npm start` escolhe outra. O servidor escuta em todas as interfaces e serve apenas os caminhos explicitamente permitidos.

## Explorar

- “Entrar no universo” abre a experiência sem iniciar música ou deslocamento automático.
- **← / → ou A / D**: avance e volte. No celular, segure os botões de direção; pelo teclado, foque um botão e segure Espaço ou Enter.
- O circuito fecha uma volta completa, em qualquer sentido. As nove paradas usam posições distintas; clicar em uma escolhe o caminho mais curto.
- Encontrar um integrante abre sua ficha e a sugestão de música. Escape, × ou “Voltar à estrada” fecham. Afaste-se antes de reencontrar o mesmo personagem.
- O contador registra personagens únicos, inclusive pelas fichas da galeria e da parada Personagens. Não é necessário dirigir para acessar as informações.
- “Tour automático” avança e pausa ao encontrar um integrante. Feche a ficha e ative o tour novamente para continuar.
- Arraste o cenário para girar e elevar a câmera. + / − ajustam a distância; ↺ e Home (com o cenário focado) restauram a câmera.
- “Ver circuito” mostra o anel por cima. “Ver moinho” aproxima o moinho provisório no centro. “Câmera orbital” gira em torno do veículo.
- “Banda ao redor” reúne os integrantes perto do carro. Dirigir devolve os personagens aos pontos de encontro.
- O rádio acompanha a região e também permite escolher músicas por anterior/próxima. “Abrir clipe” carrega o YouTube sob escolha, sem reprodução automática.

## Modelos e créditos

O carro principal é **Gorrilaz Car BlockBench**, de **shabaev**, sob **CC BY 4.0**. O usuário forneceu o ZIP; o glTF foi convertido em `assets/models/gorillaz-geep.glb`, com as **14 imagens incorporadas**, mantendo malhas e materiais. Escala, orientação e pivôs das quatro rodas são ajustados em execução. A autoria, fonte, licença e adaptações estão na página e em `assets/models/GEEP-CREDITS.txt`.

O SUV Kenney sob CC0 é o veículo alternativo se o Geep não carregar; um veículo geométrico mantém a experiência se ambos falharem. Os dois SUVs Kenney também continuam disponíveis para download.

As referências escolhidas no Sketchfab têm páginas e prévias oficiais sob clique:

- **Gorrilaz Car BlockBench — shabaev**: incorporado na estrada; CC BY 4.0.
- **Flying windmill — zeee7**: sem download disponível, licença Standard. O moinho que aparece no circuito é uma criação geométrica **provisória autoral**, não o arquivo desse autor.
- **Gorillaz — Dudi Julianto**: referência de papercraft, sem download nem licença de reutilização informada na consulta. O arquivo não está incluído; os personagens do circuito continuam sendo interpretações próprias.

Fontes verificadas, hashes e atribuições completas: [REFERENCES.md](REFERENCES.md).

## Arquivos

- `index.html`: página, cenário, fichas e diálogos de prévia.
- `src/style.css`: visual, responsividade e movimento reduzido.
- `src/app.js`: navegação, encontros, rádio, foco e prévias externas.
- `src/route.js`: posição, tangente, normalização e distâncias do circuito.
- `src/scene.js`: WebGL, modelos, iluminação, câmera e moinho provisório.
- `src/vendor/`: Three.js 0.180.0, GLTFLoader e BufferGeometryUtils, com licença MIT. Só os caminhos de importação dos auxiliares foram adaptados.
- `assets/models/`: GLB locais, créditos, licença Kenney e metadados públicos das referências.
- `tests/route.test.mjs`: seis testes de continuidade e geometria circular.
- `server.mjs`: servidor HTTP sem pacotes externos.

## Verificar

```sh
npm run check
npm test
```

A sintaxe e os seis testes de geometria passaram. O Geep convertido passou no **Khronos glTF Validator 2.0.0-dev.3.10**, sem erros, avisos ou informações de problema. Também foi verificado no Chromium o carregamento do modelo, quatro pivôs de roda, circuito nos dois sentidos, download GLB, layout móvel e fallback Kenney.

O moinho e a câmera foram verificados em WebGL. Os diálogos externos, créditos, Escape, limpeza de iframe e foco foram testados com respostas externas simuladas. A tentativa do visualizador real Sketchfab no Chromium apresentou erro de rede; não foi confirmada a renderização desses iframes nesta máquina. As páginas e os metadados da API puderam ser consultados por HTTP.

## Limitações

A cena e os arquivos incluídos funcionam com o servidor local, sem conexão externa. Vídeos, links e prévias do Sketchfab precisam de internet e dependem do serviço. Não há reprodução automática de música. O progresso reinicia ao recarregar.

Sem WebGL há uma estrada 2D com fichas e paradas. Sem JavaScript há um resumo básico. A preferência por movimento reduzido desativa órbita e animações decorativas; o deslocamento explícito continua disponível. Não foi certificada conformidade de acessibilidade, reprodução externa de vídeo ou compatibilidade com aparelhos físicos; a validação móvel usou emulação.

A discografia é um recorte inicial até 2023 e precisa de atualização. Textos introdutórios precisam de revisão para uso acadêmico final.

Projeto de **Eduardo Alves Xavier**, **Gedson de Souza Mancio Júnior** e **Rafael Machado Colnaghi**. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Projeto independente, sem vínculo oficial. Personagens esquemáticos e autorais; encontros cartunescos, sem violência gráfica.
