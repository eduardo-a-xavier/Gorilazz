# Gorilazz — Um mundo para descobrir

Uma experiência acadêmica de exploração em um mundo aberto compacto inspirado no universo Gorillaz. Dirija o Geep livremente, escolha caminhos entre três regiões, encontre cinco histórias e conheça os quatro integrantes. As nove categorias de conteúdo continuam acessíveis sem jogar.

## Executar

Requer **Node.js 20 ou superior**. Na pasta `Gorilazz`, execute:

```sh
npm run dev
```

Abra http://localhost:3000 no mesmo computador. Não é necessário instalar dependências. A porta pode ser alterada com `PORT=4000 npm start` em shells compatíveis. O servidor serve somente arquivos de uma lista explícita.

## Dirigir e explorar

- “Entrar no universo” revela os controles; não inicia música nem deslocamento automático.
- **W / ↑:** acelerar. **S / ↓:** frear. **A/D / ←/→:** virar. Soltar o acelerador mantém inércia e reduz a velocidade gradualmente.
- **Marcha à ré:** pare com o freio, solte o comando e pressione novamente. Segurar o freio continuamente não engata a ré. O freio tem prioridade sobre o acelerador.
- No celular, segure os botões de direção e os pedais. Toques simultâneos permitem acelerar e virar. Botões focados também aceitam Espaço ou Enter.
- O terreno fora do asfalto é transitável e oferece mais resistência. Construções, integrantes e limites da ilha têm colisões simplificadas. “Voltar ao caminho” recupera o carro na rua mais próxima.
- O mapa tem **Kong Studios**, **Bairro dos murais** e **Mirante do moinho**, ligados por ruas curvas, cruzamentos, voltas alternativas e atalhos pelo terreno. Não existe ordem obrigatória de visita.
- Ao encontrar um objeto de história ou integrante, reduza a velocidade e pressione **E** ou o botão **Explorar**. Passar perto não abre uma ficha automaticamente.
- As cinco histórias abordam a criação da banda, seus integrantes, gêneros musicais, Demon Days e apresentações ao vivo. O cenário é autoral e não representa geografia oficial de Gorillaz.
- **Diário:** releia descobertas e peça um passeio até um lugar já encontrado. O botão “Consultar conteúdo” também permite ler histórias ainda não encontradas, sem marcá-las como descobertas.
- As descobertas ficam em `localStorage` neste navegador. Há confirmação em dois cliques para reiniciar o diário. Se o armazenamento estiver bloqueado, o diário continua funcionando em memória. A posição do Geep e os integrantes encontrados também são salvos; o progresso de integrantes da versão anterior é recuperado. A velocidade não é restaurada ao reabrir a página.
- **Passeio guiado:** dirige até a próxima história não encontrada e para para você explorar. Acelerar, frear ou virar assume imediatamente a direção. O passeio não abre histórias nem reproduz música automaticamente.
- Arraste o cenário para olhar ao redor; +/− ajustam a distância. ↺ e Home restauram a câmera. “Ver mundo” mostra a ilha por cima; “Ver moinho” enquadra o marco. A câmera de viagem acompanha também a marcha à ré.
- “Banda ao redor” reúne os integrantes junto ao Geep. Dirigir os devolve aos locais de encontro.
- Abrir um diálogo, ocultar a aba ou perder o foco limpa comandos e interrompe o veículo. O tempo em pausa não é recuperado pela física.
- As nove categorias abaixo do cenário e a galeria continuam disponíveis para consultar conteúdo diretamente. O rádio acompanha a região e permite escolher faixas; clipes só carregam sob escolha.

## Modelos e créditos

O carro principal é **Gorrilaz Car BlockBench**, de **shabaev**, sob **CC BY 4.0**. O usuário forneceu o ZIP; o glTF foi convertido em `assets/models/gorillaz-geep.glb`, com as **14 imagens incorporadas**, mantendo malhas e materiais. Escala, orientação e pivôs das quatro rodas são ajustados em execução. A autoria, fonte, licença e adaptações estão na página e em `assets/models/GEEP-CREDITS.txt`.

O SUV Kenney sob CC0 é o veículo alternativo se o Geep não carregar; um veículo geométrico mantém a experiência se ambos falharem. Os dois SUVs Kenney também continuam disponíveis para download.

As referências escolhidas no Sketchfab têm páginas e prévias oficiais sob clique:

- **Gorrilaz Car BlockBench — shabaev**: incorporado na estrada; CC BY 4.0.
- **Flying windmill — zeee7**: sem download disponível, licença Standard. O moinho que aparece no circuito é uma criação geométrica **provisória autoral**, não o arquivo desse autor.
- **Gorillaz — Dudi Julianto**: referência de papercraft, sem download nem licença de reutilização informada na consulta. O arquivo não está incluído; os personagens do circuito usam o pacote Phase 7 enviado pelo usuário.

Fontes verificadas, hashes e atribuições completas: [REFERENCES.md](REFERENCES.md).

## Estrutura

- `index.html`, `src/style.css`, `src/world.css`: página, controles, mapa, diário e diálogos responsivos.
- `src/app.js`: coordenação da exploração, fichas, conteúdo, câmera e rádio.
- `src/world-data.js`: regiões, ruas suaves, cruzamentos, descobertas, obstáculos e posições compartilhadas entre mapa, física e cena.
- `src/driving.js`: estado e física arcade do veículo, frenagem, ré deliberada e recuperação.
- `src/input.js`: teclado, pedais, múltiplos ponteiros e cancelamento de entradas.
- `src/discoveries.js`: proximidade espacial, visibilidade de interação e diário persistido.
- `src/navigation.js`: caminhos pelo grafo de ruas e comandos do passeio guiado.
- `src/scene.js`: Three.js, terreno, ruas, Geep, integrantes, moinho, rodas e câmera.
- `src/content.js`, `src/editorial.css`: oito eras de 1998–2023, onze faixas e conteúdo histórico ampliado.
- `src/progress.js`: persistência da posição no mundo e dos integrantes, com leitura do progresso anterior.
- `src/route.js`: utilitários circulares legados, mantidos para compatibilidade com os dados da representação anterior; não controlam o Geep do mundo aberto.
- `src/vendor/`: Three.js 0.180.0 e auxiliares locais, com licença MIT.
- `assets/`: modelos, retratos e créditos preservados.
- `tests/`: testes de condução, mapa, encontros, diário, navegação e geometria legada.
- `docs/PLANO-INTERACAO.md`: direção do projeto e etapas de evolução.

## Verificar

```sh
npm run check
npm test
```

A física roda em passos fixos de 1/120 s, independentemente da renderização. Os testes cobrem inércia, freio e ré, direção, estabilidade entre passos de simulação, limites, colisões, conexão das ruas, persistência opcional e chegada aos cinco destinos pelo passeio guiado. Os modelos existentes não foram modificados nesta etapa.

A versão integrada passou nos 36 testes e na verificação de sintaxe. O Chromium verificou carregamento dos modelos, descobertas e diálogos; a alternativa sem WebGL também passou pelo fluxo de condução, diário e recarregamento. A emulação móvel verificou pedais simultâneos, cancelamento de toque e ausência de transbordamento horizontal.

## Limitações

Este é um primeiro mundo aberto pequeno, com três regiões e cinco descobertas. A condução e as colisões são arcade, sem suspensão física completa, tráfego ou navegação a pé. Novas regiões, relevo, sons e derrapagem ficam para etapas posteriores.

Sem WebGL, o mapa 2D, a condução simplificada, o diário e o conteúdo continuam acessíveis. Sem JavaScript há um resumo básico. A preferência por movimento reduzido desativa órbita e oscilações decorativas, preservando a direção explícita.

Cena e arquivos incluídos funcionam localmente; vídeos e prévias Sketchfab dependem de internet. Não há reprodução automática. Os testes de navegador desta implementação usam Chromium e emulação móvel; não substituem validação em aparelhos físicos.

A discografia é um recorte inicial até 2023 e precisa de atualização. Os textos introdutórios precisam de revisão para uso acadêmico final. O moinho é uma interpretação geométrica provisória autoral.

Projeto de **Eduardo Alves Xavier**, **Gedson de Souza Mancio Júnior** e **Rafael Machado Colnaghi**. Universo criado por Jamie Hewlett e Damon Albarn: https://www.gorillaz.com/. Projeto acadêmico independente, sem vínculo oficial. Autorias e adaptações dos modelos externos estão creditadas na página.

## Banda Phase 7 incorporada

O ZIP `the-gorillaz-band-phase-7.zip` contém os quatro integrantes em FBX e quatro texturas PNG de 2048 × 2048. Foi convertido para `assets/models/gorillaz-phase7.glb`, com as texturas embutidas e raízes identificadas para 2-D, Murdoc, Noodle e Russel. A escala comum preserva as proporções entre eles. Os modelos substituem as figuras geométricas na estrada, no modo “Banda ao redor”, na galeria e nas fichas.

A publicação correspondente é **The Gorillaz band (phase 7)**, de **Redtricity**, com **CC BY 4.0** indicada no Sketchfab. Sua descrição atribui os modelos originais ao Gorillaz. Créditos e adaptações: `assets/models/PHASE7-CREDITS.txt` e [REFERENCES.md](REFERENCES.md).

As poses dos braços de 2-D, Murdoc e Noodle foram ajustadas nos rigs; as malhas avaliadas foram aplicadas para exportação estática. O pacote não traz clipes de animação. O GLB da aplicação não mantém os rigs: usa movimento suave dos grupos, desativado com movimento reduzido. Russel mantém a pose do arquivo. Os quatro retratos da galeria foram renderizados desses mesmos modelos.

Se o GLB da banda não carregar, as quatro figuras geométricas continuam funcionando como alternativa, com as mesmas fichas e controles. Os retratos também têm alternativa SVG se a imagem falhar. O moinho continua sendo a geometria provisória autoral, pois o modelo Sketchfab escolhido não oferece download.

No celular, o botão de câmera abre os controles de vista e zoom; Escape ou um toque fora os recolhe. A vista inicial mantém os quatro integrantes enquadrados.

Validação da banda: o GLB Phase 7 passou no Khronos glTF Validator sem erros, avisos ou informações de problema. No Chromium foram verificados os quatro modelos junto ao Geep, os quatro retratos e fichas correspondentes, clique na malha da Noodle, contador sem duplicação, encontro no circuito, restauração do foco, layout e controles de câmera móveis e alternativa geométrica ao bloquear o GLB.

## Revisão histórica e de experiência


A linha do tempo apresenta oito eras de **1998–2023**, com história real, narrativa virtual, uma interpretação para o mundo e sugestões de escuta. É um recorte editorial, sem afirmar que não existam lançamentos posteriores. As nove paradas temáticas continuam disponíveis e foram ampliadas; o menu de leitura não move o carro nem troca o texto sozinho. O botão de uma era leva a um local relacionado no mundo aberto.

The Fall distingue a disponibilização digital de 2010 da edição física de 2011. As fichas separam personagens de intérpretes e colaboradores reais; o Geep é relacionado a 19-2000, e o moinho à ideia visual de Feel Good Inc. Os modelos Phase 7 permanecem em todas as eras, como informado na página.

O rádio tem onze faixas. Para três escutas sem ID cadastrado, o botão abre uma busca pelo clipe oficial em vez de inventar um endereço de vídeo. As prévias existentes continuam sob clique e dependem do YouTube; sua reprodução externa não foi revalidada.

A renderização 3D e o tour pausam fora da seção da estrada; no celular, a renderização é limitada a aproximadamente 30 quadros por segundo. A perda do contexto WebGL mostra o mapa 2D, e a restauração reconecta a cena. Créditos e downloads permanecem disponíveis nos bastidores, com atribuições visíveis junto da banda.

As consultas ao site oficial e à Britannica foram bloqueadas pela política de rede desta instância. A revisão editorial está implementada, mas a conferência documental online permanece pendente. Consulte [HISTORY_REVIEW.md](HISTORY_REVIEW.md) para escopo, fontes indicadas, evidências e limitações.
