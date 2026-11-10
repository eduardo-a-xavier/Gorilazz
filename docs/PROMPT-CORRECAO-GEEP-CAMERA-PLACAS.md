# Análise do vídeo e prompt de execução

Referência: `20261110-1418-07.9959735.mp4`, duração aproximada de 69,7 segundos, 1574 × 884, 30 quadros/s. Revisão visual por amostragem de 24 quadros distribuídos pelo vídeo, com ampliação dos momentos principais, cruzada com o código atual. Não é uma medição de FPS do aplicativo nem uma análise de áudio. Quadros de apoio: `artifacts/video-review`.

## Diagnóstico com evidências

| Trecho aproximado | Observação | Interpretação / prioridade |
| --- | --- | --- |
| 00–15 s | Gramado visível abaixo do painel e entre os braços; banco e painel parecem peças soltas | P0. Cabine incompleta, não apenas problema de câmera |
| 00–15 s | Braço direito se estende até o rádio; articulação é angular e mão fica pouco convincente | P1. Rever alcance, comprimento dos segmentos e alvos de contato |
| 17–35 s | Colunas do para-brisa grossas, painel largo, retrovisor sem imagem | P1. Ajustar proporções ao Geep; retrovisor precisa de função ou tratamento coerente |
| 26–32 s | Velocidade exibida chega a 108 km/h numa cidade compacta | P1. Avaliar facilidade de parar e perceber histórias, sem inferir que a física está defeituosa só pelo vídeo |
| 37–44 s | Mural “1998” e cartazes amarelos usam linguagens visuais distintas; parte baixa do mural fica escondida pelo painel quando o carro chega perto | P1. Diferenciar descoberta de decoração e melhorar ponto de leitura |
| 40–49 s | Cursor de mão aparece sobre mural e fachada; o cenário não fornece uma resposta local clara | O código usa `grab` para arrastar a câmera. Não confundir essa mão com indicação de link nem afirmar mudança de material causada por hover |
| 52–69 s | Aproximação de árvores, cerca e cemitério; olhar lateral/superior revela estrutura muito simplificada da cabine | P1. Validar superfícies internas em todo o alcance da câmera e colisões dos objetos sólidos |
| Diversos momentos | Rádio aparece no painel 3D e no canto da interface; pequenas instruções competem com o mundo | P1. Reduzir duplicação mantendo controles acessíveis por teclado e toque |

### Causas confirmadas no código

- `src/scene.js`, atualização da câmera: `car.visible = !firstPerson` oculta o Geep na primeira pessoa; `cabin.root.visible = firstPerson` mostra outro conjunto de geometria.
- `src/cabin.js`: cabine feita majoritariamente com caixas; há painel e laterais parciais, mas não assoalho contínuo. `reuse()` reaproveita apenas peças selecionadas de bancos e volante; as peças recebem centralização e escala própria.
- `src/scene.js`: o FOV interno é 76 graus e o olhar alcança aproximadamente −0,84 a +0,48 rad de pitch, antes dos ajustes de enquadramento. Esses parâmetros expõem a área incompleta; limitar o olhar sozinho não resolve a ausência de geometria.
- `src/scene.js`, `sign()`: a mesma textura é aplicada ao material de uma caixa inteira. Isso merece correção por face; não comprova que essa placa específica é a apontada no vídeo.
- O mural “1998” usa um plano sobre uma parede. Placas de rua, murais, letreiros e placas de integrantes são implementados por caminhos diferentes em `scene.js`, `roads.js` e `city.js`.
- `src/landmarks.js` declara que seus marcos não têm colisão. Isso explica a necessidade de testar os objetos sólidos do cemitério, sem transformar o fantasma em obstáculo sólido.
- O GLB possui peças de carroceria, bancos, volante e motor. É necessário inspecioná-las visualmente e seus transforms antes de decidir o que reaproveitar. Nomes do arquivo bruto podem ser normalizados pelo GLTFLoader.

O vídeo permanece na câmera interna nos quadros examinados: a diferença exata de aparência entre duas vistas não foi medida por uma comparação filmada lado a lado. A separação estrutural entre os modelos está confirmada no código.

## Prompt pronto para execução

Você vai corrigir o projeto Gorilazz em `E:\Gorilazz-Relatorio`, com foco na entrega de 30/11/2026. Atue como desenvolvedor Three.js e artista técnico: implemente, teste e apresente evidências visuais. O resultado precisa fazer a câmera interna parecer parte do mesmo Geep visto de fora e tornar as placas coerentes, legíveis e previsíveis.

### 1. Contexto e preservação

Leia as instruções locais e o código atual antes de editar. Inspecione o estado do Git e preserve alterações existentes. Não reverta trabalho de outras etapas. O vídeo de referência está em `C:\Users\dudu2\AppData\Local\Packages\Microsoft.ScreenSketch_8wekyb3d8bbwe\TempState\Recordings\20261110-1418-07.9959735.mp4`; os quadros extraídos estão em `artifacts/video-review`.

Revise principalmente `src/cabin.js`, `src/scene.js`, `src/app.js`, `src/world.css`, `src/roads.js`, `src/city.js`, `src/landmarks.js`, `src/world-data.js` e `src/driving.js`. O veículo de referência é `assets/models/gorillaz-geep.glb`. Leia seus créditos e mantenha a atribuição de shabaev e a licença registrada.

Preserve direção livre, passeio guiado, diário, encontros, rádio, importação de arquivos, leitura direta, fallback sem 3D, movimento reduzido e uso por teclado/toque. Mantenha a stack existente; não faça uma migração de framework ou motor gráfico para resolver problemas locais.

### 2. P0 — Reconstruir a continuidade física do Geep

Primeiro inspecione o GLB: hierarquia, dimensões, orientação, bancos, volante, carroceria, texturas e superfícies visíveis por dentro. Produza capturas de referência externas e internas antes de alterar.

Defina um sistema de coordenadas comum para veículo, cabine e câmera. Prefira reaproveitar a carroceria adequada ou criar uma versão interna leve derivada das mesmas dimensões. Se o asset não tiver interior suficiente, complete somente as partes necessárias, com linguagem visual coerente com o modelo existente.

Construa assoalho opaco contínuo, divisória sob o painel, caixas de roda ou volumes internos necessários, soleiras, laterais internas, bases dos bancos e conexões entre as peças. O terreno não pode aparecer através de partes que deveriam ser sólidas. Preserve as aberturas reais do jipe; não transforme um Geep aberto em carro fechado inventando teto ou portas que não existem no modelo.

Faça painel, bancos, volante, moldura do para-brisa, capô visível e materiais pertencerem ao mesmo veículo. Preserve as transformações corretas ao extrair peças. Evite escalas independentes arbitrárias que produzam bancos ou volante incompatíveis com a carroceria.

Não considere resolvido apenas reduzindo o ângulo de olhar, cobrindo a tela com uma imagem, deixando tudo escuro ou ligando `DoubleSide` globalmente. Corrija geometria, normais, visibilidade e transforms na origem. Não descarte recursos compartilhados enquanto forem usados por outra vista.

### 3. P1 — Câmera, motorista e cabine

Posicione a câmera na altura dos olhos do motorista e alinhe o volante ao banco. Ajuste FOV e limites do olhar com capturas comparativas; não escolha valores apenas por aparência em uma resolução. O horizonte e a rua devem permanecer claros, sem o painel ocupar espaço excessivo.

Valide olhar para baixo, esquerda, direita e para o alto; modo do rádio; retorno à direção; frenagem, ré e curvas; alternância entre vistas e tela cheia. Nenhum ângulo permitido pode atravessar peças sólidas. Mudar a câmera não deve deslocar o carro, alterar sua escala, apagar o progresso ou interromper indevidamente o rádio.

Corrija os braços: comprimento dos segmentos consistente, cotovelos naturais e mãos apoiadas no volante sem atravessá-lo. No rádio, a mão direita só deve alcançar controles durante interação pertinente e voltar ao volante de modo previsível. Evite animação contínua de “apertar botões” sem ação correspondente. Movimento reduzido deve continuar funcional sem oscilações decorativas.

O retrovisor não deve parecer uma tela vazia sem propósito. Se um reflexo real for viável no orçamento gráfico, implemente com resolução e frequência controladas e exclusão de autorreflexão. Caso contrário, use um tratamento visual discreto e honesto; não deixe a correção principal depender desse efeito.

### 4. P1 — Placas, murais e feedback de interação

Faça um inventário dos objetos mostrados entre 37 e 49 segundos: mural “1998”, cartazes amarelos com estrelas, placas direcionais e letreiros próximos. Compare frente, verso, laterais e leitura a partir do banco do motorista. Não assuma que todo elemento gráfico deva ser clicável.

Estabeleça uma família visual com tipografia legível, margens, espessura e acabamento coerentes. Diferencie por função: sinalização orienta; descoberta convida à leitura; publicidade e murais decoram. Preserve a variedade temática sem misturar comportamentos.

Corrija UVs, proporção das artes, orientação e materiais por face. Frente deve ter a arte correta; laterais e verso devem ter acabamento próprio. Placas de dupla leitura precisam de texto orientado corretamente em cada lado. Evite texto esticado, espelhado, repetido na espessura, sangramento do atlas e cintilação entre superfícies sobrepostas. Ajuste filtros e resolução com base em distância real de leitura e custo de memória.

Posicione a informação principal em altura e distância legíveis. Marque uma área de parada confortável para que o motorista não precise encostar no mural e esconder seu texto atrás do painel.

Distinga `grab` para olhar ao redor de `pointer` para uma ação real. Apenas objetos interativos devem receber feedback de seleção. Se houver clique em descoberta, use a mesma ação do botão Explorar e respeite proximidade, velocidade e oclusão. Não abra conteúdo através de paredes, a longa distância ou depois de um gesto de arrastar. Mantenha E e o botão HTML como alternativas completas.

### 5. P1 — Colisões e interface

Reproduza a aproximação do muro, das árvores e da cerca do vídeo. Adicione colisores simples aos objetos que devem ser sólidos, compartilhando dados com a lógica do mundo. Não bloqueie ruas, destinos ou o grafo do passeio. Objetos decorativos deliberadamente atravessáveis, como o fantasma, podem continuar assim. Verifique colisão em velocidade elevada e recuperação de posição sem prender o carro.

Reavalie a velocidade de exploração na cidade compacta somente depois de testar a parada e a leitura das histórias. Preserve o caráter arcade; evite uma reescrita da física.

Na câmera interna, dê destaque ao rádio da cabine e torne a versão HTML complementar, compacta e acessível. Não duplique dois painéis completos simultaneamente. Mantenha volume, faixa, pausa e importação acessíveis sem exigir cliques precisos em 3D. As instruções não podem ficar sobre os botões do console nem obstruir a leitura de uma descoberta.

### 6. Ferramentas externas, se necessárias

Prefira edição e processamento locais. Blender pode ser usado para reparar/completar a malha e exportar GLB. Use distribuições oficiais e versões estáveis compatíveis, registre a versão e mantenha o original separado do derivado. Valide o GLB resultante com ferramentas oficiais do ecossistema Khronos quando disponíveis.

Não envie o vídeo, o repositório ou assets a conversores desconhecidos. Evite plugins executáveis sem procedência e downloads de modelos sem autoria/licença clara. Se um novo asset for realmente necessário, registre fonte, licença e adaptações e incorpore os recursos localmente. Não introduza dependência online para carregar a cabine ou as placas.

### 7. Verificação obrigatória

Execute `npm run check`, `npm test`, `python scripts/smoke-browser.py` e `python scripts/audit-delivery.py`, quando disponíveis. Acrescente testes apenas onde houver risco real: visibilidade entre câmeras, integração de colisores com rotas e regra de interação. Testes de lógica não substituem inspeção visual da cabine.

Capture antes/depois, no mesmo lugar e orientação, de: vista externa; visão interna frontal; assoalho; duas laterais; rádio; direção em curva; mural de frente e oblíquo; verso e lateral de placas; aproximação de parede e cerca. Grave um percurso curto repetindo os momentos relevantes do vídeo.

Confira 1440 × 900, 390 × 844 e 320 × 640, tela cheia, movimento reduzido, falha de carregamento do GLB e modo sem WebGL. Teste mouse, teclado e toque. Compare carga, chamadas de desenho e tempo de quadro antes/depois na mesma máquina e perfil. Não apresente os 30 fps do vídeo como desempenho medido da aplicação. Registre limitações de emulação e teste em aparelho real quando houver acesso.

### 8. Critérios de aceite

- Não se vê chão externo através de assoalho, painel ou laterais sólidos em nenhum ângulo permitido.
- O mesmo Geep é reconhecível ao alternar as câmeras: dimensões, bancos, volante, capô e acabamento são coerentes.
- Braços não se alongam artificialmente para o rádio nem atravessam peças nos movimentos testados.
- Placas têm frente, verso e espessura corretos; texto é legível sem encostar o carro; não há cintilação visível nos ângulos testados.
- Hover, clique, arrasto e Explorar têm comportamentos distintos e previsíveis.
- Cercas, troncos e muros definidos como sólidos impedem passagem sem bloquear o passeio guiado.
- Rádio, câmera, diário e direção continuam funcionando em desktop, telas pequenas e alternativas de acesso.
- Não há erros novos de console; testes relevantes passam; impacto de desempenho é documentado.

Entregue alterações implementadas, relação dos arquivos e assets modificados, capturas comparativas, resultado dos testes e pendências reais. Priorize P0, depois P1. Não expanda o mapa nem acrescente efeitos caros antes de fechar esses critérios.

## Referências oficiais para a implementação

- [Blender — importação/exportação glTF](https://docs.blender.org/manual/en/4.5/addons/import_export/scene_gltf2.html).
- [Three.js — materiais e faces renderizadas](https://threejs.org/docs/pages/Material.html).
- [Khronos — registro glTF](https://registry.khronos.org/glTF/).

Nenhum serviço externo recebeu o vídeo ou os arquivos do projeto nesta análise. Esta entrega contém análise e prompt; não aplica as correções descritas ao jogo.
