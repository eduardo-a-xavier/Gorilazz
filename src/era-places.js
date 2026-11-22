// Mapa era -> parada da viagem (descobertas de world-data.js) e estado dos botões de paginação.
// Lógica pura, testada em Node. O índice de cada era segue a ordem de `eras` em content.js
// (0: 1998–2001 ... 7: 2023); o valor é o índice em DISCOVERIES.
export const ERA_DISCOVERY = [0, 3, 2, 1, 4, 1, 2, 4];

export function discoveryIndexForEra(eraIndex) {
  return ERA_DISCOVERY[eraIndex] ?? 0;
}

// Anterior/próxima desabilitados nas pontas, em vez de dar a volta na lista.
export function eraNavState(index, total) {
  return { prev: index > 0, next: index < total - 1 };
}
