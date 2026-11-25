# Scenery A–E — entrega verificada

20 modelos GLB originais, sem downloads ou texturas externas, criados no Blender em modo background. Licenca dos modelos: original / CC0-1.0. As duas pastas scenery contem copias identicas, incluindo manifesto, referencias, hashes e sheets.

| Bloco | Conteudo | GLBs | Bytes dos GLBs |
|---|---|---:|---:|
| A | 3 arvores, 2 arbustos, 3 rochas; banco e poste antecipados | 10 | 176,772 |
| B | Pombo com walk, peck e fly em loop | 1 | 39,480 |
| C | Baixo com alca, bateria completa, teclado com cavalete/microfone | 3 | 378,692 |
| D | Caixa dupla, torre de som, gabinete KONG com screen separado | 3 | 265,256 |
| E | Sedan, van e barreira viaria; banco e poste no A | 3 | 231,152 |

## Contratos de integracao

Todos: metros, Y-up, escala aplicada, normais e cores de vertice. Uma malha por modelo estatico; excecao arcade com screen separado. Um material por modelo, exceto arcade com dois. Origem no solo/base; instrumentos ja posicionados no espaco normalizado do personagem, com root nos pes, sem recentralizar bounding box. Objetos animados do pombo mantem pivos locais, com root na base. Rochas preservam faces facetadas; superficies organicas usam shade smooth.

Pombo: animacoes de 1 s, transforms das partes (sem skin), clipes nomeados walk/peck/fly. Cada clip tem primeiro/ultimo quadro iguais, conferidos no GLB. Para repetir no Three.js, usar AnimationMixer/LoopRepeat.

Instrumentos: ver INTEGRACAO-instrumentos.md e sockets_gltf no manifesto. Contatos exatamente iguais a SPECS de band-pose.js, conferidos apos exportacao e reimportacao. Manter baquetas dinamicas existentes e guitarra noodle-guitar-v3.glb. Alinhamento animado e interpenetracao da alca/personagem nao foram testados no jogo.

Arcade: screen e uma malha plana separada, com UV 0–1 e material Screen_ReplaceWithGameTexture; dimensoes 1,4 x 1,05 m, centro (0,2.65,0.68), rotacao X=-0.25 e frente +Z. Preservar escala NON_DISCOVERY_PROP_SCALE aplicada pelo grupo existente, sem aplica-la duas vezes. A Engenharia deve usar a textura atual no material da tela, sem manter uma segunda tela procedural sobreposta. Corpo de 1,8 x 3,6 x 1,3 m, com marquise ate y=4,46.

Carros: cenario estatico, frente +Z, rodas incorporadas a malha; nao sao veiculos dirigiveis nem possuem animacoes de roda.

## Verificacao

Leitura independente do GLB: tamanho, indices, triangulos, materiais, cores, dados de animacao finitos, loops, identidade das escalas, coordenadas dos sockets, hashes e igualdade das copias. Reimportacao Blender em processo separado: 20/20 PASS, comando com --python-exit-code 1, exit code 0. Dez casos de regressao geometricos PASS (sete orientacoes de cilindro e tres caixas finas). Os blocos B–E nao possuem triangulos degenerados apos a correcao de orientacao e do limite de chanfro.

Comandos e logs em scenery-evidence: build_scenery.py, render_scenery.py, build_block_b/c/d/e.py e validate_all_blocks.py, sempre blender.exe -b --factory-startup --python ..., janelas ocultas e prioridade BelowNormal. Renders Cycles CPU, 24 samples e denoise. Arquivos .blend, scripts e PNGs individuais ficam fora da pasta scenery para respeitar o limite total.

Renders: scenery-sheet-1440x900.jpg cobre A (inclui banco/poste); block-B/C/D/E-sheet.jpg cobre cada bloco; scenery-before-after.jpg compara primitivas antigas e modelos novos. Arvore e arbusto antigos reproduzem street-props.js; rocha antiga e ilustrativa. Enquadramentos individuais no catalogo nao representam escala relativa.

Sem git, edicao de src, GUI ou navegador. Os processos Blender iniciados pela tarefa encerraram; um Blender que ja existia antes foi preservado. Nao foi realizada integracao, teste de InstancedMesh, collision em runtime ou verificacao no navegador.
