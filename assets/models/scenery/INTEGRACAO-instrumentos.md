# Instrumentos — coordenadas e contatos

Instanciar o root com posicao/rotacao/escala identidade dentro de visual, depois da normalizacao de bake; as malhas ja estao nas coordenadas locais de band-pose.js. Nao recentralizar a malha pela bounding box. Origem do root = pes do personagem. O baixo fica suspenso pela alca, com a altura ja incorporada nas coordenadas; nao apoia no solo.

Baixo: socket_hand_neck_R = (0.33,1.10,0.28), socket_hand_strum_L = (-0.04,0.90,0.19); mesma base ortonormal e anchor (0.02,0.92,0.20) do fallback. Neck/strum sao pontos de contato; a Engenharia pode obter a posicao mundial destes nos. Alca original acompanha o ombro, sem teste de interpenetracao no personagem.

Bateria: socket_pad_R/L = (+/-0.30,0.93,0.20), sobre os dois tons. Bumbo, caixa, 2 tons, surdo, 2 pratos e hi-hat. Nao inclui baquetas: manter as baquetas dinamicas de band-pose.js. A caixa permanece em (0,0.73,0.32) como no fallback.

Teclado: socket_pad_R/L = (+/-0.22,0.89,0.18), teclado de 0.98 m com cavalete e microfone. pad_R/L sao aliases. Superficie das teclas brancas em y=0.89; teclas pretas recuadas em z. Nao alterar SPECS para a troca destes assets.

Um material de cores de vertice por GLB. Preservar COLOR_0 e os normais ao criar InstancedMesh. Guitarra noodle-guitar-v3.glb nao foi alterada. Compatibilidade conferida por coordenadas exportadas e geometria; animacao em cena/collision com personagens exige integracao pela Engenharia, nao testada nesta entrega.
