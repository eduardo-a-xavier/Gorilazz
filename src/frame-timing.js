// Tempo do quadro sem saltos: o delta é limitado a 50 ms, para que uma pausa do navegador (aba, GC, carregamento)
// não vire um passo gigante de física nem um salto de câmera. Lógica pura, testada em Node.
export const MAX_FRAME_DELTA_S = .05;
export function clampFrameDelta(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return 0;
  return Math.min(seconds, MAX_FRAME_DELTA_S);
}
