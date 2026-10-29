# Gorilazz — A estrada

Uma experiência acadêmica para explorar o universo Gorillaz em um circuito 3D: dirija o Geep, encontre os quatro integrantes, visite nove paradas, explore oito eras de 1998 a 2023 e descubra onze sugestões de músicas.

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
- **Gorillaz — Dudi Julianto**: referência de papercraft, sem download nem licença de reutilização informada na consulta. O arquivo não está incluído; os personagens do circuito usam o pacote Phase 7 enviado pelo usuário.

Fontes verificadas, hashes e atribuições completas: [REFERENCES.md](REFERENCES.md).

## Arquivos

- `index.html`: página, cenário, fichas e diálogos de prévia.
- `src/style.css`: visual, responsividade e movimento reduzido.
- `src/app.js`: navegação, encontros, rádio, foco e prévias externas.
- `src/content.js`: eras, faixas, perfis e referências históricas.
- `src/progress.js`: leitura e gravação tolerante a falhas do progresso local.
- `src/editorial.css`: linha do tempo, painéis de leitura e bastidores recolhíveis.
- `src/route.js`: posição, tangente, normalização e distâncias do circuito.
- `src/scene.js`: WebGL, modelos, iluminação, câmera e moinho provisório.
- `src/vendor/`: Three.js 0.180.0, GLTFLoader e BufferGeometryUtils, com licença MIT. Só os caminhos de importação dos auxiliares foram adaptados.
- `assets/models/`: GLB do Geep e da banda, modelos alternativos, créditos e metadados públicos das referências.
- `assets/portraits/`: quatro retratos renderizados dos modelos Phase 7 para galeria e fichas.
- `tests/`: 17 testes de geometria circular, integridade do conteúdo e progresso local.
- `server.mjs`: servidor HTTP sem pacotes externos.

## Verificar

```sh
npm run check
npm test
```

A sintaxe e os 17 testes automatizados passaram, incluindo seis testes da geometria do circuito. O Geep convertido passou no **Khronos glTF Validator 2.0.0-dev.3.10**, sem erros, avisos ou informações de problema. Também foi verificado no Chromium o carregamento do modelo, quatro pivôs de roda, circuito nos dois sentidos, download GLB, layout móvel e fallback Kenney.

O moinho e a câmera foram verificados em WebGL. Os diálogos externos, créditos, Escape, limpeza de iframe e foco foram testados com respostas externas simuladas. A tentativa do visualizador real Sketchfab no Chromium apresentou erro de rede; não foi confirmada a renderização desses iframes nesta máquina. As páginas e os metadados da API puderam ser consultados por HTTP.

## Limitações

A cena e os arquivos incluídos funcionam com o servidor local, sem conexão externa. Vídeos, links e prévias do Sketchfab precisam de internet e dependem do serviço. Não há reprodução automática de música. A posição e os integrantes encontrados ficam salvos neste navegador quando o armazenamento local está disponível. “Reiniciar viagem” apaga esse progresso local. Se o navegador bloquear o armazenamento, a experiência continua funcionando durante a sessão.

Sem WebGL há uma estrada 2D com fichas e paradas. Sem JavaScript há um resumo básico. A preferência por movimento reduzido desativa órbita e animações decorativas; o deslocamento explícito continua disponível. Não foi certificada conformidade de acessibilidade, reprodução externa de vídeo ou compatibilidade com aparelhos físicos; a validação móvel usou emulação.

A discografia é um recorte inicial até 2023 e precisa de atualização. Textos introdutórios precisam de revisão para uso acadêmico final.

Projeto de **Eduardo Alves Xavier**, **Gedson de Souza Mancio Júnior** e **Rafael Machado Colnaghi**. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Projeto independente, sem vínculo oficial. Modelos externos e adaptações creditados na página; figuras geométricas autorais apenas como alternativa. Encontros cartunescos, sem violência gráfica.

## Banda Phase 7 incorporada

O ZIP `the-gorillaz-band-phase-7.zip` contém os quatro integrantes em FBX e quatro texturas PNG de 2048 × 2048. Foi convertido para `assets/models/gorillaz-phase7.glb`, com as texturas embutidas e raízes identificadas para 2-D, Murdoc, Noodle e Russel. A escala comum preserva as proporções entre eles. Os modelos substituem as figuras geométricas na estrada, no modo “Banda ao redor”, na galeria e nas fichas.

A publicação correspondente é **The Gorillaz band (phase 7)**, de **Redtricity**, com **CC BY 4.0** indicada no Sketchfab. Sua descrição atribui os modelos originais ao Gorillaz. Créditos e adaptações: `assets/models/PHASE7-CREDITS.txt` e [REFERENCES.md](REFERENCES.md).

As poses dos braços de 2-D, Murdoc e Noodle foram ajustadas nos rigs; as malhas avaliadas foram aplicadas para exportação estática. O pacote não traz clipes de animação. O GLB da aplicação não mantém os rigs: usa movimento suave dos grupos, desativado com movimento reduzido. Russel mantém a pose do arquivo. Os quatro retratos da galeria foram renderizados desses mesmos modelos.

Se o GLB da banda não carregar, as quatro figuras geométricas continuam funcionando como alternativa, com as mesmas fichas e controles. Os retratos também têm alternativa SVG se a imagem falhar. O moinho continua sendo a geometria provisória autoral, pois o modelo Sketchfab escolhido não oferece download.

No celular, o botão de câmera abre os controles de vista e zoom; Escape ou um toque fora os recolhe. A vista inicial mantém os quatro integrantes enquadrados.

Validação da banda: o GLB Phase 7 passou no Khronos glTF Validator sem erros, avisos ou informações de problema. No Chromium foram verificados os quatro modelos junto ao Geep, os quatro retratos e fichas correspondentes, clique na malha da Noodle, contador sem duplicação, encontro no circuito, restauração do foco, layout e controles de câmera móveis e alternativa geométrica ao bloquear o GLB.

## Revisão histórica e de experiência

A linha do tempo apresenta oito eras de **1998–2023**, com história real, narrativa virtual, uma interpretação para o circuito e sugestões de escuta. É um recorte editorial, sem afirmar que não existam lançamentos posteriores. As nove paradas temáticas continuam disponíveis e foram ampliadas; o menu de leitura não move o carro nem troca o texto sozinho. Os botões explícitos de viagem levam à estrada.

The Fall distingue a disponibilização digital de 2010 da edição física de 2011. As fichas separam personagens de intérpretes e colaboradores reais; o Geep é relacionado a 19-2000, e o moinho à ideia visual de Feel Good Inc. Os modelos Phase 7 permanecem em todas as eras, como informado na página.

O rádio tem onze faixas. Para três escutas sem ID cadastrado, o botão abre uma busca pelo clipe oficial em vez de inventar um endereço de vídeo. As prévias existentes continuam sob clique e dependem do YouTube; sua reprodução externa não foi revalidada.

A renderização 3D e o tour pausam fora da seção da estrada; no celular, a renderização é limitada a aproximadamente 30 quadros por segundo. A perda do contexto WebGL mostra a alternativa 2D, e a restauração reconecta a cena. Créditos e downloads permanecem disponíveis nos bastidores, com atribuições visíveis junto da banda.

As consultas ao site oficial e à Britannica foram bloqueadas pela política de rede desta instância. A revisão editorial está implementada, mas a conferência documental online permanece pendente. Consulte [HISTORY_REVIEW.md](HISTORY_REVIEW.md) para escopo, fontes indicadas, evidências e limitações.
