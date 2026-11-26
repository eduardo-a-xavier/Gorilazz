// Enquadramento da câmera de chegada em cada parada do Passeio Guiado (módulo puro: sem DOM nem Three).
// Pórtico de era: trave a 8,6 m e totem até ~11,6 m. A pose abaixo põe o pórtico inteiro na faixa livre da tela
// (topo a ~22% do topo, base a ~74%), longe do HUD superior e do cartão inferior.
export const ERA_STOP_FRAME = Object.freeze({ distance: 26, height: 4, target: 5.25 });
// Descobertas (murais, palcos, mirante, rádio): objetos baixos e largos, um pouco mais de recuo que a pose antiga (9 m).
export const HISTORY_STOP_FRAME = Object.freeze({ distance: 11, height: 3.4, target: 2.2 });
// Ajuste fino por parada, se a geometria real pedir. Vazio por padrão.
export const STOP_FRAME_BY_ID = Object.freeze({});
export const VERTICAL_FOV_DEG = 46;

export function stopFrame(stopItem) {
  return STOP_FRAME_BY_ID[stopItem.id] ?? (stopItem.kind === 'era' ? ERA_STOP_FRAME : HISTORY_STOP_FRAME);
}

// Fração da altura da tela (0 = topo, 1 = base) em que aparece o ponto (0, y) vertical, a `frame.distance` da câmera.
export function screenFractionFromTop(frame, y, fovDeg = VERTICAL_FOV_DEG) {
  const half = Math.tan(fovDeg * Math.PI / 360);
  const pitch = Math.atan2(frame.target - frame.height, frame.distance);
  const rel = Math.atan2(y - frame.height, frame.distance) - pitch;
  return 0.5 - Math.tan(rel) / (2 * half);
}
