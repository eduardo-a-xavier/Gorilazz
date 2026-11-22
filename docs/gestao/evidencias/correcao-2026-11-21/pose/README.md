# Pose da banda no palco (1440x900, câmera de depuração `?perf`)

Antes/depois de cada integrante, mesmo enquadramento (`framePerson`, HUD escondido). Os "antes" foram capturados com o contato de mãos desligado (mesmo rig de antes); a guitarra v2 e os props continuam nos dois.

- **2-D (teclado):** `2d-antes` / `2d-depois` (vista de frente). Antes, as mãos ficavam ~20 cm acima das teclas, com uma mão no ar. Depois, as duas mãos tocam as teclas na altura da cintura (`SPECS[0].contact`), com o tronco inclinado 2,3° e o olhar para as teclas.
- **Noodle (guitarra):** `noodle-antes` / `noodle-depois` (vista de costas, a frente do modelo não é visível daquele ponto). Antes, a mão da escala ficava solta; depois, as mãos vão para os sockets da guitarra v2 (`socket_hand_neck_R` e `socket_hand_strum_L`, do `noodle-guitar-fit.json`).
- **Russel (bateria):** `russel-antes` / `russel-depois` (vista de trás e de lado). Antes, o braço esticava para cima; depois, as baquetas descem até a caixa (`SPECS[3].contact`), com o olhar para a bateria.

Limites: não foi possível enquadrar a frente da Noodle nem do Russel (prédios bloqueiam a câmera no lado da frente). Contato, sticks e fenda estão validados por posição e por essas vistas, não por uma foto de frente. Murdoc não mudou.
