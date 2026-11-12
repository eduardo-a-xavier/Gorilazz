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
- As nove categorias abaixo do cenário e a galeria continuam disponíveis para consultar conteúdo diretamente. A seleção de clipes acompanha a região; clipes só carregam sob escolha.

## Modelos e créditos

O carro principal é **Gorrilaz Car BlockBench**, de **shabaev**, sob **CC BY 4.0**. O usuário forneceu o ZIP; o glTF foi convertido em `assets/models/gorillaz-geep.glb`, com as **14 imagens incorporadas**, mantendo malhas e materiais. Escala, orientação e pivôs das quatro rodas são ajustados em execução. A autoria, fonte, licença e adaptações estão na página e em `assets/models/GEEP-CREDITS.txt`.

O SUV Kenney sob CC0 é o veículo alternativo se o Geep não carregar; um veículo geométrico mantém a experiência se ambos falharem. Os dois SUVs Kenney também continuam disponíveis para download.

As referências escolhidas no Sketchfab têm páginas e prévias oficiais sob clique:

- **Gorrilaz Car BlockBench — shabaev**: incorporado na estrada; CC BY 4.0.
- **Flying windmill — zeee7**: sem download disponível, licença Standard. O moinho que aparece no circuito é uma criação geométrica **provisória autoral**, não o arquivo desse autor.
- **Gorillaz — Dudi Julianto**: referência de papercraft, sem download nem licença de reutilização informada na consulta. O arquivo não está incluído; os personagens do circuito usam o pacote Phase 7 enviado pelo usuário.

Fontes verificadas, hashes e atribuições completas: [REFERENCES.md](REFERENCES.md).

## Estrutura

O primeiro piloto visual inclui uma fachada de Kong Studios, materiais autorais, árvores instanciadas e duas peças fornecidas pelo usuário. Veja [as capturas e a avaliação dos anexos](docs/PILOTO-VISUAL.md). A escultura e o diorama são estáticos e foram otimizados; dois outros ZIPs ainda não puderam ser transferidos por excederem 32 MiB.

- `index.html`, `src/style.css`, `src/world.css`: página, controles, mapa, diário e diálogos responsivos.
- `src/app.js`: coordenação da exploração, fichas, conteúdo, câmera e rádio.
- `src/world-data.js`: regiões, ruas suaves, cruzamentos, descobertas, obstáculos e posições compartilhadas entre mapa, física e cena.
- `src/driving.js`: estado e física arcade do veículo, frenagem, ré deliberada e recuperação.
- `src/input.js`: teclado, pedais, múltiplos ponteiros e cancelamento de entradas.
- `src/discoveries.js`: proximidade espacial, visibilidade de interação e diário persistido.
- `src/navigation.js`: caminhos pelo grafo de ruas e comandos do passeio guiado.
- `src/scene.js`: Three.js, terreno, ruas, Geep, integrantes, moinho, rodas e câmera.
- `src/environment.js`, `src/materials.js`: cenário texturizado, assets da exposição e superfícies locais.
- `src/atmosphere.js`, `src/postfx.js`: céu, mar, mapa de ambiente e pós-processamento (bloom, vinheta, tone mapping).
- `scripts/build-visual-environment.py`: geração reproduzível da fachada, árvore e texturas autorais no Blender.
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

A versão integrada passou nos 39 testes e na verificação de sintaxe. O Chromium verificou carregamento dos modelos, descobertas e diálogos; a alternativa sem WebGL também passou pelo fluxo de condução, diário e recarregamento. A emulação móvel verificou pedais simultâneos, cancelamento de toque e ausência de transbordamento horizontal.

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

A seleção editorial reúne onze faixas. Para três escutas sem ID cadastrado, o botão abre uma busca pelo clipe oficial em vez de inventar um endereço de vídeo. As prévias existentes continuam sob clique e dependem do YouTube; sua reprodução externa não foi revalidada.

A renderização 3D e o tour pausam fora da seção da estrada; no celular, a renderização é limitada a aproximadamente 30 quadros por segundo. A perda do contexto WebGL mostra o mapa 2D, e a restauração reconecta a cena. Créditos e downloads permanecem disponíveis nos bastidores, com atribuições visíveis junto da banda.

As consultas ao site oficial e à Britannica foram bloqueadas pela política de rede desta instância. A revisão editorial está implementada, mas a conferência documental online permanece pendente. Consulte [HISTORY_REVIEW.md](HISTORY_REVIEW.md) para escopo, fontes indicadas, evidências e limitações.

## Evoluir e validar a interface

O roteiro agora oferece entrada por direção livre ou passeio guiado, escolha entre cinco destinos e orientação ao chegar. A leitura direta continua disponível na entrada.

Veja [o processo de evolução](docs/PROCESSO-DE-EVOLUCAO.md) para prioridades, critérios de aceitação e divisão dos módulos. Com o servidor ativo, `python scripts/smoke-browser.py` verifica os fluxos em desktop, telas de 390 e 320 px e modo sem 3D. Esse teste requer Python Playwright com Chromium; não é uma dependência da aplicação. As capturas ficam em `artifacts/browser`, ou na pasta definida por `SCREENSHOT_DIR`.

## Desempenho e qualidade gráfica

A cena escolhe o perfil gráfico sozinha e o ajusta enquanto roda. Para forçar um perfil, abra `http://localhost:3000/?qualidade=leve` ou `?qualidade=alta`.

- **Perfil alto (padrão em telas largas):** a cena é desenhada em HDR com MSAA e passa por um bloom próprio (`src/postfx.js`), que faz neon, telões, postes e marcadores brilharem. Sombras de 2048 px.
- **Perfil leve (padrão abaixo de 700 px):** sem pós-processamento, sombras de 1024 px e densidade de pixels limitada a 1,5.
- **Resolução adaptativa:** o intervalo real entre quadros é medido a cada segundo. Se o ritmo cai abaixo da meta, a densidade de pixels diminui até 0,7; se sobra folga, volta a subir. Persistindo a lentidão no piso, o bloom é desligado. O estado fica em `data-quality` e `data-pixel-ratio` no canvas.
- **Céu, mar e reflexos (`src/atmosphere.js`):** céu procedural com nuvens e sol, tingido pelas cores de cada bairro; o mesmo céu vira o mapa de ambiente que dá reflexo a vidro e metal; o mar tem ondulação animada. Nenhum arquivo novo é baixado.
- **Sombras:** redesenhadas em quadros alternados e presas à grade de texels, para não cintilar com o carro em movimento. Os prédios projetam sombra por volumes simples (uma caixa por prédio), não por todos os detalhes da fachada.
- **Menos chamadas de desenho:** ruas, cruzamentos, placas, pedras, moinho, objetos das histórias, carroceria do Geep e cada integrante são fundidos por material na carga.
- **Modelos densos ao longe:** integrantes, escultura e diorama são fotografados uma vez na carga; a mais de ~85 m da câmera a foto substitui a malha, e eles só entram no mapa de sombras a menos de 55 m do carro.
- **Câmera:** a câmera de viagem encurta o braço em vez de atravessar prédios e portais; com a banda reunida, procura um ângulo livre.
- **Servidor:** arquivos ficam em memória, textos seguem com gzip e o navegador revalida por ETag, então recarregar a página não baixa os ~19 MB de novo.

- **Banda mais leve:** a cena carrega `assets/models/gorillaz-phase7-web.glb` (3,3 MB, texturas WebP de 1024 px, ~104 mil triângulos), gerado do original com `gltf-transform` (`resize`, `webp`, `weld`, `simplify --ratio 0.5 --error 0.001`). O GLB original (9,3 MB) continua no projeto, para download e como alternativa se o reduzido não carregar.

### Ruas, referências e atropelamentos

- **Ruas (`src/roads.js`):** calçada elevada com meio-fio contínuo, rotatórias nos cruzamentos, faixas de borda, eixo duplo amarelo e divisão de pistas nas avenidas, faixas de pedestre, postes e placas de esquina. O traçado e a física não mudaram.
- **Nomes de rua:** cada rua leva o nome de uma faixa ou disco (Av. Clint Eastwood, Av. 19-2000, Rua Feel Good Inc., Av. Plastic Beach, Rua Stylo…), na placa e pintado no asfalto. Os nomes ficam em `ROAD_NAMES`, em `src/world-data.js`.
- **Marcos (`src/landmarks.js`):** a ilha rosa de Plastic Beach no mar a leste, o cemitério de Clint Eastwood com um fantasma azul perto de Kong e dois helicópteros de El Mañana rondando o moinho. São interpretações geométricas autorais, sem colisão.
- **Atropelamento:** bater em um integrante acima de ~11 km/h o lança na direção da viagem; ele gira, quica, escorrega, levanta tonto olhando para o carro e volta andando ao lugar. A câmera dá um tranco proporcional à velocidade. Com movimento reduzido, ele apenas dá um passo para o lado. É só visual: a física do carro não muda.

- **Placas dos integrantes:** cada placa mostra o retrato do próprio modelo, o nome e a função, com uma cor por integrante.
- **Motorista:** um boneco autoral nas cores do site vai sentado no Geep; gira os braços com o volante e olha para dentro da curva.
- **Cabine (`src/cabin.js`):** a 1ª pessoa mostra o interior do próprio Geep — carroceria, bancos, arco e volante do modelo — em vez de uma segunda cabine montada à parte; some apenas o boneco. O volante do modelo gira num eixo próprio, e a posição dos olhos, do aro e do banco é medida no GLB na carga. O módulo acrescenta só o que o modelo não traz: velocímetro, rádio, retrovisor e braços.
- **Braços:** dois ossos de comprimento fixo resolvidos por cinemática inversa. As mãos seguram o aro e acompanham o giro; com o rádio em foco (R), a direita repousa diante das teclas e avança só quando uma tecla é acionada.
- **Retrovisor:** mostra a imagem real de trás, em 256 × 96 px, atualizada a cada três quadros e só em 1ª pessoa.
- **Placas e interação:** placas têm chapa com borda própria e arte na frente e no verso. O cursor de ação aparece só onde um clique faz algo naquele momento (integrante ao alcance, peça da história próxima); clicar na peça equivale ao botão Explorar.
- **Colisões:** as peças das histórias (mural, arquivo, rádio, palco) e o cemitério são sólidos; o ponto de parada de cada história continua livre. O banco do mirante, que encosta no asfalto, ficou sem colisor para não travar a rua.
- **Cor por lugar:** o chão de cada bairro recebe a cor da sua época (a mesma do portal e do minimapa), com transição suave nas divisas. As fichas das histórias abrem com a cor do bairro e dizem "História n de 5 · Ato n"; as dos integrantes usam a cor de cada um, igual à da placa.
- **Pontos de valor:** cada história e cada integrante tem um facho de luz e uma etiqueta visíveis de longe — rosa para história a encontrar, verde depois de registrada no diário, cor própria para cada integrante. O minimapa mostra os integrantes como losangos e traz legenda.
- **Disposição:** histórias e integrantes são recuados a uma distância fixa da borda da rua mais próxima (9,5 m e 8,5 m) e giram para olhar para ela; a regra fica em `settle()` em `src/world-data.js`. Nada mais fica na calçada ou no asfalto.
- **Palcos de rua:** cada integrante se apresenta num tablado de paletes diante de um muro de concreto com o nome em spray, o retrato colado como lambe-lambe, caixas de som e objetos próprios (teclado e microfone, tambor de óleo e pneus, pedaleira e lanternas, bateria e toca-fitas).
- **Braços e instrumentos (`src/band-pose.js`):** os modelos Phase 7 chegam sem esqueleto e de braços abertos. Na carga, cada braço ganha dois ossos calculados (ombro → cotovelo → mão) e os vértices próximos desse eixo são girados na CPU, só para quem está a menos de 85 m da câmera. Noodle toca guitarra, Murdoc baixo, 2-D teclado com microfone e Russel bateria com baquetas; os instrumentos são modelados na escala do corpo e posicionados a partir das mãos. Com movimento reduzido, a pose fica parada.
- **Atalhos de vista:** botões "1ª pessoa · V" e "Tela cheia · F" ficam sempre visíveis no topo da cena; dois cliques no cenário também alternam a tela cheia.

`?perf` expõe `window.__gorilazz` (cena, renderizador e veículo) para medições no console. Os contadores `data-triangles` e `data-draw-calls` do canvas somam todas as passagens do quadro, inclusive sombras.

Não há banco de dados: o progresso fica em três chaves de `localStorage` (`gorilazz-discoveries-v1`, `gorilazz.world.v1` e a legada `gorilazz.journey.v1`), gravadas no máximo a cada 1,5 s durante a condução.

## Rádio local, câmera e tela cheia

No rádio da estrada, **Carregar músicas** aceita arquivos de áudio do computador. Depois da escolha, ▶ toca ou pausa, ←/→ mudam a faixa e a lista continua automaticamente ao terminar uma música. Os arquivos ficam só nesta aba e precisam ser selecionados novamente após recarregar. Os títulos editoriais do Gorillaz continuam com links para clipes. A aplicação não inclui gravações comerciais.

O botão ⛶ abre a experiência em tela cheia. Em **1ª pessoa**, arraste o volante ou use ←/→ para virar, mantendo W/S ou os pedais para acelerar e frear. Veja [o roteiro da experiência](docs/ROTEIRO-DA-EXPERIENCIA.md) para a relação entre mundo, histórias e próximas etapas.


## Cidade das épocas e cabine do Geep

O mapa do ZIP organiza a história em quatro bairros. No ato 1, os prédios de tijolo e o grafite apresentam a explosão de 2000–2006. O ato 2 usa cores pastel para a fase de Plastic Beach (2007–2011). No ato 3 aparecem vitrines fechadas e andaimes durante o hiato (2012–2016). As fachadas de vidro e o neon marcam a reinvenção no ato 4 (2017–2026). Os números no minimapa correspondem aos portais na rua. As cinco paradas do diário podem ser visitadas em qualquer ordem.

Entre no mundo e pressione **V** para sentar ao volante. Arraste a paisagem para olhar e **C** para centralizar. Ajuste sensibilidade e movimento em **Controles**. Pressione **R** para olhar o console e clicar em tocar, pausar, trocar faixa, ajustar volume ou abrir a lista. **Esc** devolve a visão da estrada.

A Kong FM começa pausada e inclui dois instrumentais originais, **Concreto** e **Maré de plástico**. O painel e o HUD controlam o mesmo áudio. A playlist também aceita arquivos do computador.
