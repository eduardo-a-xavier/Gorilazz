// Escala dos painéis de história (murais, arquivos, rádio, palco). Lógica pura, testada em Node.
// O piso, o anel e o farol não escalam; só os objetos de cenário, para ficarem legíveis de dentro do carro.
export const DISCOVERY_PROP_SCALE = 1.5;
// Bancas, palcos de integrantes, fliperama, totens de portal e placas fora das descobertas (folga >= 1,4 m da pista).
export const NON_DISCOVERY_PROP_SCALE = 1.5;
// Totem direcional à beira da pista (9.5, -40.5, heading 1.2): 1,5x com folga de 2,26 m do asfalto e 1,66 m do prédio vizinho.
export const ROAD_SIGN_SCALE = 1.5;
// Alcance máximo de um painel ampliado a partir do centro do ponto (m): mural 8,8 m ampliado + recuo do painel.
export const DISCOVERY_PROP_REACH = 8;
// Largura máxima de uma pista (m). A folga mínima entre o ponto e o asfalto precisa cobrir o alcance dos painéis.
export const MAX_ROAD_HALF_WIDTH = 5;
