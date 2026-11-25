// Assentamento de props no chão: a base da malha fica em GROUND_Y (m), sem flutuar nem afundar.
// Lógica pura, testável em Node. Usada por árvores e arbustos (environment.js e street-props.js).
export const GROUND_Y = -0.06;
// Translação em y que assenta uma malha cuja menor coordenada em y é `minY` (antes da escala) numa escala `scale`.
export function groundOffsetY(minY, scale = 1) {
  return GROUND_Y - (Number.isFinite(minY) ? minY : 0) * scale;
}
