// Regras do ciclo sair/voltar do modo 3D: lógica pura, testada em Node. app.js aplica as ações na página.
// Sair: fecha diálogos, para o carro e libera a rolagem. Voltar: fecha diálogos, trava a rolagem, recalcula a
// visibilidade e devolve o foco ao jogo. O mundo continua montado (o renderer não é destruído).

// O mundo está visível quando alguma parte do retângulo cai dentro da janela.
export function isWorldVisible(rect, viewport) {
  return rect.height > 0 && rect.width > 0 && rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width;
}

export function exitPlan({ dialogsOpen, mode3d }) {
  if (!mode3d) return [];
  return [...(dialogsOpen > 0 ? ['closeDialogs'] : []), 'stopCar', 'unlockScroll'];
}

export function returnPlan({ dialogsOpen }) {
  return [...(dialogsOpen > 0 ? ['closeDialogs'] : []), 'lockScroll', 'refreshVisibility', 'focusWorld'];
}

// Ao sair da tela cheia com o 3D ativo, o navegador restaura a rolagem antiga: o mundo volta ao topo.
export function realignAfterFullscreen({ fullscreen, mode3d }) {
  return !fullscreen && mode3d;
}
