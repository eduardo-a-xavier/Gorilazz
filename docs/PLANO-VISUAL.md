# Gorilazz — plano de evolução visual

Data: 29/10/2026. Base analisada: `5371fcc`. Status: pesquisa e planejamento; este documento não altera o visual em execução.

## 1. Direção recomendada

Construir um mundo 3D ilustrado, com atmosfera urbana, materiais gastos, vegetação orgânica e elementos surreais. A referência de linguagem é o encontro entre animação, capas de disco, grafite e cenografia musical. O Geep e a banda devem parecer habitantes do mesmo mundo.

A qualidade virá da combinação de silhueta, textura, composição e luz. Aumentar apenas a quantidade de polígonos não resolve a aparência de protótipo. Detalhes pequenos podem ser desenhados ou gravados nas texturas; volume de verdade fica onde muda a silhueta ou aparece perto da câmera.

Decisões iniciais:

- Priorizar modelos texturizados e materiais com acabamento ilustrado, com desgaste e contraste moderados.
- Usar verde acinzentado, creme, concreto e ferrugem como base; rosa e azul como acentos de música e descoberta.
- Preservar as três regiões e a condução livre. Concentrar o detalhe nos caminhos e lugares visitáveis.
- Adotar uma combinação de bibliotecas gratuitas e peças autorais modeladas no Blender, disponível neste ambiente.
- Manter Three.js 0.180.0 e os modelos atuais como ponto de partida. Complementos deverão ser compatíveis com essa versão.
- Definir o padrão em uma pequena área de Kong Studios antes de produzir o restante do cenário.

## 2. Diagnóstico real do projeto

| Elemento | Estado encontrado | Mudança necessária |
| --- | --- | --- |
| Terreno | Uma caixa de cor lisa, com superfície plana | Materiais de solo, transições e uma borda de ilha convincente |
| Construções | Caixas com faixas de janelas | Fachadas modulares, portas, telhados, detalhes de escala e textura |
| Vegetação | Troncos cilíndricos e copas cônicas | Árvores com copa orgânica, arbustos, grama em grupos e variação controlada |
| Estradas | Faixas de geometria com cor uniforme; sem UVs de textura | UVs por distância, asfalto, acostamento, marcas e cruzamentos sem sobreposição visível |
| Descobertas | Cinco variações do mesmo pedestal com placa e cristal | Cinco objetos de cena diferentes, relacionados ao conteúdo |
| Céu e água | Fundo de cor, disco solar e caixa azul | Céu coerente com a iluminação; costa e água com variação sutil |
| Luz | Luz hemisférica, direcional e sombras já configuradas | Ajustar relações de luz, ambiente, contraste e sombras de contato |
| Materiais gerados | Mesmo acabamento para quase tudo: roughness .65, metalness .12 | Acabamento específico para concreto, tinta, borracha, madeira, vegetação e metal |
| Geep | Modelo externo texturizado e rodas separadas | Integrar ao novo cenário; melhorar leitura dos materiais e contato com o chão |
| Banda | Modelos texturizados, exportados estáticos | Harmonizar iluminação, preparar níveis de detalhe e avaliar poses/animação separadamente |

O gerenciamento de cor sRGB, ACES e sombras já existe. A revisão deve calibrar essa base e acrescentar materiais e geometria, evitando reconstruir recursos que já funcionam.

### Medição dos modelos existentes

Valores obtidos lendo os GLBs locais. Triângulos e primitivas são somas das definições das malhas, não uma medição de triângulos visíveis ou chamadas de desenho em um quadro.

| Modelo | Arquivo | Triângulos | Primitivas | Texturas |
| --- | ---: | ---: | ---: | --- |
| Geep | 0,75 MiB | 6.264 | 37 | 14 imagens, de 128 a 1024 px |
| Quatro integrantes Phase 7 | 9,09 MiB | 171.423 | 25 | Quatro imagens de 2048 × 2048 |

As quatro texturas da banda ocupariam aproximadamente **85,3 MiB** como RGBA8 com uma cadeia completa de mipmaps. É uma estimativa desse armazenamento, não uma leitura da memória real da GPU. O tamanho do GLB transferido não representa o custo total em memória.

Geep e banda não contêm animações nem skins no GLB atual. A banda tem detalhe geométrico suficiente para não ser a primeira candidata a receber mais polígonos; o cenário é a maior oportunidade de melhoria.

## 3. Pesquisa de recursos e decisão de uso

Páginas oficiais consultadas em 29/10/2026. Nesta etapa nenhum pacote foi baixado ou incorporado. A seleção final exige examinar o arquivo, o visual e a licença da versão efetivamente obtida.

| Recurso pesquisado | Uso proposto | Decisão |
| --- | --- | --- |
| [Poly Haven — Asphalt 02](https://polyhaven.com/a/asphalt_02) | Base de asfalto, normal e rugosidade | Candidato ao piloto; preparar versão 1K e reduzir contraste para o estilo ilustrado |
| [Poly Haven — Red Plaster Weathered](https://polyhaven.com/a/red_plaster_weathered) | Reboco gasto de fachadas e muro do primeiro mural | Candidato; recolorir e controlar a escala do desgaste |
| [Poly Haven — Overcast Soil, Pure Sky](https://polyhaven.com/a/overcast_soil_puresky) | Luz ambiente e reflexos suaves | Candidato em resolução baixa; o céu visível pode continuar sendo autoral |
| [ambientCG](https://ambientcg.com/) | Concreto, terra, madeira e superfícies complementares | Selecionar apenas o conjunto mínimo que combine com o piloto |
| [Quaternius — Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html) | Árvores, rochas, arbustos e plantas texturizados | Avaliar a edição Standard como biblioteca inicial; adaptar escala e paleta |
| [Quaternius no itch.io](https://quaternius.itch.io/stylized-nature-megakit) | Conferência das edições e acesso ao pacote | A edição gratuita contém parte do conjunto. Modelos e shaders extras de outras edições não são pressupostos do plano |
| [Poly Haven — Street Lamp 01](https://polyhaven.com/a/street_lamp_01) | Referência de acabamento e detalhe de objetos urbanos | A página informa cerca de 31 mil triângulos. A versão original não é adequada para repetição extensiva neste mapa; considerar uma versão simplificada ou peça autoral |

[Poly Haven](https://polyhaven.com/license) e [ambientCG](https://docs.ambientcg.com/license/) publicam seus assets sob CC0. As páginas específicas do Nature MegaKit consultadas também indicam CC0. Registrar a licença do ZIP efetivamente selecionado e preservar autoria e origem no projeto. Um shader fornecido para Unity, Unreal ou Godot precisará de adaptação para Three.js.

O moinho anteriormente escolhido no Sketchfab permanece uma referência sem arquivo incorporado; os registros locais indicam que ele não tinha download disponível. O caminho previsto é produzir um moinho autoral mais bem acabado ou selecionar outro modelo com distribuição autorizada. Não depender do arquivo desse visualizador.

### Estratégia de custo

O escopo inicial usa recursos gratuitos e modelagem autoral. Pacotes pagos são opcionais; não são necessários para começar. Não foi feita compra, contratação ou estimativa de preço para modelagem externa. O esforço principal será selecionar, adaptar, modelar as peças de destaque e integrar o conjunto.

## 4. Identidade de cada região

| Região | Aparência desejada | Peças prioritárias |
| --- | --- | --- |
| Kong Studios | Pátio musical urbano, usado e habitável | Entrada do estúdio, portão, parede de tijolo/reboco, cabos, caixas de som, luminárias, pôsteres e calçada |
| Bairro dos murais | Rua estreita com camadas de pintura e sinais de ocupação | Fachadas com variações, portas e vitrines simples, murais autorais, cartazes, bancos, caixas e vegetação nos cantos |
| Mirante do moinho | Paisagem aberta, orgânica e levemente surreal | Moinho de silhueta trabalhada, madeira e tecido nas pás, rochas irregulares, arbustos, gramado e mirante |

Cada área precisa ser reconhecível mesmo com os nomes e marcadores da interface ocultos. As cores das eras podem atuar como iluminação e acentos; evitar repintar todo o solo de uma única cor quando uma era muda.

### Kit mínimo de cenário

- Uma entrada de estúdio e um moinho como peças de destaque.
- Três módulos de fachada, com duas variações de acabamento cada, portas, janelas, cobertura e cantos arredondados onde aparecem de perto.
- Quatro árvores, três arbustos, três grupos de grama e quatro rochas selecionados da biblioteca ou produzidos para o projeto.
- Oito tipos de objetos pequenos: poste, banco, caixote, lixeira, amplificador, cabo enrolado, suporte de cartaz e cercado.
- Cinco objetos únicos de descoberta.
- Materiais compartilhados e texturas em atlas quando isso não prejudicar a legibilidade.

As quantidades são metas de variedade para a primeira versão artística, não uma lista de modelos já adquiridos.

## 5. Dar forma às cinco descobertas

| Descoberta atual | Nova apresentação no cenário | Sinal de interação |
| --- | --- | --- |
| Duas mentes, um universo | Muro ilustrado com desenho, data e cartazes sobre a criação da banda | Pequeno destaque ao se aproximar |
| Quatro rostos, muitas histórias | Arquivo de fotografias e fichas em uma vitrine ou painel | Moldura e luz de leitura |
| Um som sem fronteiras | Rádio de rua com caixas de som e discos | Mostrador aceso e movimento discreto |
| A paisagem de Demon Days | Mirante com banco e painel baixo diante do moinho | Marco de visita integrado ao lugar |
| Quando o desenho encontra o palco | Pequeno palco de ensaio com instrumentos e amplificadores | Luminária ou placa do espaço |

Substituir as placas gigantes repetidas por sinalização com escala humana. O objeto e sua composição devem despertar a curiosidade; o botão Explorar continua indicando a ação disponível. Manter E, baixa velocidade, diário, contador e ordem livre.

Murais e pôsteres devem ser autorais ou usar imagens com permissão adequada. As fontes históricas continuam identificando o que é fato, narrativa virtual e interpretação do projeto.

## 6. Materiais, terreno e iluminação

### Materiais

Criar uma biblioteca pequena: asfalto, concreto, reboco, tijolo, terra, grama, madeira, tinta, metal, borracha e vidro simplificado. Usar metalness zero nos materiais não metálicos e rugosidade ajustada por superfície. Dar relevo aparente com normal maps e desgaste controlado, preservando a leitura gráfica dos personagens.

Mapas de cor devem usar sRGB; normal, rugosidade e outros dados devem usar o tratamento de dados apropriado. Conferir as UVs utilizadas pelos mapas e manter texel density consistente. Os modelos importados podem ter configurações diferentes das geometrias geradas.

As ruas hoje não possuem UVs. Gerar coordenadas usando largura e distância acumulada: a textura deve acompanhar o caminho sem esticar em curvas. Corrigir o encontro dos trechos nas bifurcações para evitar cintilação de superfícies sobrepostas. Marcas, rachaduras e cartazes podem ser decals ou elementos de um atlas.

### Terreno e costa

Primeiro aplicar solo com transições entre asfalto, terra e vegetação. Usar grupos de plantas para esconder encontros artificiais e bordas rígidas, sem bloquear as rotas. Dar à costa uma silhueta autoral, com rochas e margem, em vez de deixar a caixa do terreno exposta.

No piloto, manter o piso dirigível plano. Relevo transitável depende de uma função de altura compartilhada entre solo, Geep, rodas, câmera, pontos de interesse, recuperação e navegação. Colinas decorativas devem ficar fora da área de condução e ter limites coerentes; não criar morros que o carro atravesse visualmente.

### Luz e atmosfera

- Uma luz principal com sombras, ambiente suave e contraste suficiente para separar personagem, carro e fundo.
- Avaliar o HDRI selecionado para ambiente/reflexos, filtrado com [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html). O fundo visível pode ser um céu ilustrado, preservando a identidade visual.
- Ajustar sombras próximas ao carro e aos integrantes; usar oclusão de contato ou luz/sombra gravada nas peças estáticas quando adequado.
- Diferenciar luzes decorativas emissivas de luzes que realmente iluminam a cena. Limitar luzes dinâmicas locais, especialmente no celular.
- Nuvens, brisa e água discreta acrescentam vida. Devem respeitar movimento reduzido.
- Bloom seletivo e outros efeitos de pós-processamento só entram após a cena básica estar bonita e o custo medido. Interface e textos devem permanecer nítidos.

## 7. Geep e integrantes

Manter reconhecimento, texturas e créditos dos modelos existentes. No Geep, revisar vidro, borracha, pintura, normais e sombras; avaliar pequenos chanfros apenas nas bordas próximas que precisarem de silhueta melhor. Aplicar suavização por peça, preservando vincos intencionais.

Na banda, harmonizar luz e cor, evitar aspecto plástico e melhorar contato dos pés com o chão. Criar versões de detalhe reduzido para distância e celular, comparando rosto e silhueta. Os nomes, raízes e metadados `memberIndex` precisam sobreviver à exportação.

O GLB atual da banda não tem rig. Animações de braços, caminhada ou rosto exigem recuperar o FBX original com rig ou preparar um novo rig autorizado. A conversão do GLB estático por si só não recupera animações. Até essa etapa, usar poses trabalhadas e movimento sutil dos grupos. O Geep deve conservar os pivôs e a hierarquia das rodas.

## 8. Desempenho como requisito de arte

Orçamentos iniciais para orientar o piloto; são metas a medir, não desempenho já obtido em aparelhos físicos.

| Indicador | Celular / qualidade leve | Desktop / qualidade padrão |
| --- | --- | --- |
| Meta de fluidez | 30 FPS; observar p95 de tempo de quadro próximo de 33 ms | 60 FPS; observar p95 próximo de 17 ms |
| Triângulos visíveis no quadro | Aproximadamente 250 mil | Aproximadamente 650 mil |
| Chamadas de desenho do passe principal | Aproximadamente 150 | Aproximadamente 250 |
| Texturas comuns | 512–1024 px | 1024–2048 px |
| Mapas de sombra | Uma luz, até 1024 | Uma luz, até 2048 se o piloto justificar |
| Pós-processamento | Desligado ou mínimo | Efeitos discretos após medição |
| Perfil de resolução | DPR inicial limitado a 1–1,25 | DPR inicial limitado a 1,5 |

Sombras e outros passes aumentam o trabalho total além das chamadas do passe principal. Medir também o total. Memória real de GPU não é exposta de forma portátil por todos os navegadores; usar inventário de texturas, estimativas e observação de perdas de contexto.

Medidas necessárias:

1. Registrar `renderer.info`, tempo de quadro, transferências e resolução em um percurso fixo, com cache frio e quente.
2. Preparar versões 1K da banda para celular e níveis de detalhe; testar uma redução para cerca de 60–90 mil triângulos nos quatro integrantes em conjunto nas versões mais leves, preservando rostos e silhuetas.
3. Usar [KTX2/Basis](https://threejs.org/docs/pages/KTX2Loader.html) onde trouxer ganho, com loader e transcoder locais. WebP/JPEG reduz transferência, mas não equivale automaticamente a reduzir memória de textura na GPU.
4. Repetir vegetação e objetos compatíveis com [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html), em grupos por material e por setor. Particionar grupos grandes para manter descarte por área útil.
5. Reutilizar geometrias, materiais e atlas; carregar modelos de detalhe por região e liberá-los com controle de referências.
6. Reduzir transparência sobreposta em copas e grama. Preferir recorte quando apropriado e medir o custo de pixels.
7. Escolher um mecanismo de compressão geométrica quando necessário, medindo carregamento e decodificação. Não instalar vários decodificadores sem ganho demonstrado.

O resultado deve oferecer qualidade leve, padrão e seleção automática conservadora. Se um asset falhar, usar uma alternativa simplificada daquele objeto; preservar o mapa e a exploração.

## 9. Pipeline de produção

**Selecionar referência → conferir arquivo/licença → adaptar no Blender → configurar UVs e materiais → exportar GLB → otimizar → validar → integrar → comparar no navegador.**

O [glTF Transform](https://gltf-transform.dev/cli) oferece ferramentas de inspeção, simplificação, reaproveitamento e tratamento de texturas. Avaliar transformações por asset. Operações de junção e achatamento não podem destruir rodas, raízes dos integrantes ou identificadores de interação.

Manter originais e arquivos de trabalho fora dos arquivos servidos pelo jogo; distribuir apenas exportações finais necessárias. Versionar um manifesto com fonte, autor, licença, adaptações, tamanho, textura, número de triângulos e variantes.

Carregar assets localmente. Complementos Three.js, shaders adaptados, transcoders JS/WASM e licenças devem ser incluídos de forma consistente com a versão instalada. Atualizar a lista explícita de arquivos do servidor e os tipos de conteúdo, incluindo WASM e KTX2 quando utilizados.

### Organização sugerida

| Local | Responsabilidade |
| --- | --- |
| `assets/environment/` | Exportações finais por região |
| `assets/materials/` | Texturas compartilhadas e atlas |
| `assets/environment/manifest.json` | Origem, licença, variantes e orçamento de cada asset |
| `src/assets.js` | Carregamento, cache, variantes e descarte |
| `src/materials.js` | Configuração de mapas e acabamentos |
| `src/lighting.js` | Ambiente, luz principal, sombras e perfis |
| `src/environment.js` | Instâncias, decoração e composição por região |
| `src/quality.js` | Perfil leve/padrão e limites de resolução |
| `src/scene.js` | Coordenação visual, câmera, Geep e personagens |
| `src/world-data.js` | Posições, áreas, obstáculos e relação com as descobertas |

Essa divisão deve ocorrer à medida que os recursos forem implementados, sem criar módulos vazios apenas para cumprir a estrutura.

## 10. Etapas e critérios de conclusão

| Etapa | Entrega concreta | Critério para concluir |
| --- | --- | --- |
| 1. Auditoria e direção | Capturas atuais, medições, amostras de material e seleção de assets | Fontes e licenças registradas; câmera e percurso de comparação definidos |
| 2. Piloto de Kong Studios | Entrada do estúdio, um muro de descoberta, rua, vegetação e luz final | Uma captura em jogo apresenta materiais, profundidade, escala e identidade coerentes; percurso continua dirigível |
| 3. Expansão artística | Bairro, mirante, moinho e cinco descobertas distintas | Regiões reconhecíveis sem seus rótulos; objetos de história diferentes entre si |
| 4. Integração de personagens | Materiais calibrados, poses, contato com solo e variantes leves | Personagens e carro combinam com o cenário; nomes, rodas e interações preservados |
| 5. Otimização e acabamento | Qualidade leve/padrão, compressão selecionada, animação ambiente e efeitos medidos | Percurso completo dentro dos orçamentos acordados em hardware de referência |
| 6. Validação e entrega | Comparativo antes/depois, créditos, testes, capturas e commit | Cinco descobertas acessíveis, navegação sem bloqueio, diário e histórico preservados |

Ordem de maior retorno visual: **chão e paredes → vegetação → luz e contato → objetos de descoberta → peças de destaque → animação e efeitos**. O piloto combina as primeiras frentes para que elas sejam avaliadas juntas.

O esforço maior está nas peças autorais e na adaptação artística, não em instalar bibliotecas. A duração depende da qualidade dos assets escolhidos e da disponibilidade dos arquivos originais; estimar calendário após concluir o piloto e seu inventário.

## 11. Verificação de qualidade

- Capturar os mesmos enquadramentos antes/depois: saída de Kong, curva do bairro, aproximação do moinho e encontro com um integrante.
- Comparar qualidade leve e padrão com exposição e câmera consistentes.
- Conferir escala de portas, calçadas, árvores e objetos em relação ao carro e aos integrantes.
- Verificar textura sem estiramento, cintilação, vazamento de luz, transparência quebrada ou sombras destacadas dos pés.
- Executar um passeio aos cinco destinos: decoração e novas fachadas não podem bloquear ruas, atalhos, aproximação ou botão Explorar.
- Atualizar obstáculos e limites conforme os modelos reais; geometria visual e colisão precisam concordar.
- Preservar as oito eras, onze faixas, leitura sem jogo, diário, posição salva e compatibilidade com progresso anterior.
- Verificar teclado, pedais simultâneos, diálogos, movimento reduzido, contexto WebGL perdido/restaurado e alternativa 2D.
- Medir em um celular físico e em um desktop com hardware identificado. Emulação de tela e renderização por software não comprovam desempenho nesses aparelhos.
- Rodar os testes existentes e acrescentar apenas verificações necessárias para loaders, variantes e comportamento novo.

## 12. Primeiro pacote de implementação

O primeiro trabalho executável deve entregar **Kong Studios com acabamento final dentro de um recorte pequeno do mapa**: asfalto e solo texturizados, fachada autoral, muro da primeira história, árvores selecionadas, luz ambiente e sombras ajustadas. Incluir versões leves, créditos e uma comparação com o estado atual.

Esse recorte define a qualidade a repetir. A expansão pelo mapa vem depois de verificar o resultado visual e os custos reais. O objetivo é que o visitante veja um lugar com personalidade e tenha vontade de dirigir até a próxima descoberta.
