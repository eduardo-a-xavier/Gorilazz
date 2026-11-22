// Pilha de prioridade da tecla Esc: o item aberto mais acima recebe o Esc e os de baixo não são afetados.
// Ordem: modal > minigame (fliperama, piano) > mapa > painel do rádio > jogo (sai do 3D). Lógica pura, testada em Node.
export const ESC_ORDER = ['modal', 'minigame', 'map', 'panel', 'game'];

// Qual item deve receber o Esc, dado o que está aberto agora (ou null se nada tratar a tecla).
export function escapeTarget(open) {
  return ESC_ORDER.find(name => open[name]) ?? null;
}

// Trata o evento: se há item aberto, cancela o Esc (preventDefault + stopImmediatePropagation) e fecha só esse item.
export function handleEscape(event, { open, close }) {
  if (event.key !== 'Escape') return null;
  const target = escapeTarget(open());
  if (!target) return null;
  event.preventDefault();
  event.stopImmediatePropagation();
  close[target]?.();
  return target;
}
