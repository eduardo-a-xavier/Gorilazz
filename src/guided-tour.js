// Passeio guiado e contador de descobertas (9 paradas). Lógica pura, sem DOM nem Three.js; testada em Node.
// As 9 paradas são as eras da estrada (portais CITY_ERAS, 4) e os pontos de história (DISCOVERIES, 5).
// Título, ano e resumo vêm dos dados já existentes; nenhum texto novo é criado aqui.
export const TOUR_TOTAL = 9;
export const PROGRESS_KEY = 'gorilazz.stops.v1';
export const SLOW_ZONE_M = 24;    // zona curta de aproximação final antes da parada
export const STOP_HOLD_MS = 4500; // tempo parado em cada parada, com o card
export const ARRIVE_M = 12;       // distância para contar a parada como visitada
export const TOAST_MS = 2500;     // toasts e dicas somem sozinhos depois de 2,5 s

// Monta as paradas com os dados existentes. gates: ERA_GATES; cityEras: CITY_ERAS; eraTrackIds: track de cada era;
// discoveries: DISCOVERIES; tracks: lista de faixas (com id). Retorna paradas na ordem de dados (antes de ordenar).
export function buildStops({ gates, cityEras, eraTracks, discoveries, tracks }) {
  const trackIndex = id => tracks.findIndex(track => track.id === id);
  const eraStops = gates.map(gate => {
    const era = cityEras[gate.era];
    return { id: `era-${era.id}`, kind: 'era', title: era.title, year: era.years, summary: era.summary, x: gate.x, z: gate.z, trackIndex: Math.max(0, trackIndex(eraTracks[gate.era])) };
  });
  const historyStops = discoveries.map(point => ({ id: point.id, kind: 'historia', title: point.title, year: point.label, summary: point.text, x: point.x, z: point.z, trackIndex: point.track }));
  return [...eraStops, ...historyStops];
}

// Ordem fixa e cronológica do circuito pelos 4 Atos (1 -> 2 -> 3 -> 4):
// Ato 1 (2000–2006): era-explosao -> beginning -> demon-days
// Ato 2 (2007–2011): era-plastic
// Ato 3 (2012–2016): era-hiato -> live -> genres
// Ato 4 (2017–2026): era-reinvencao -> voices
export const TOUR_ORDER = Object.freeze([
  'era-explosao', 'beginning', 'demon-days',
  'era-plastic',
  'era-hiato', 'live', 'genres',
  'era-reinvencao', 'voices',
]);

export function orderTour(stops) {
  const byId = new Map(stops.map(stop => [stop.id, stop]));
  const fixed = TOUR_ORDER.map(id => byId.get(id)).filter(Boolean);
  const extra = stops.filter(stop => !TOUR_ORDER.includes(stop.id));
  return [...fixed, ...extra];
}

// Progresso persistido no localStorage (somente ids de paradas conhecidas; dados corrompidos viram vazio).
export function createStopProgress(storage, knownIds) {
  const known = new Set(knownIds);
  const load = () => {
    try {
      const data = JSON.parse(storage?.getItem(PROGRESS_KEY) ?? 'null');
      if (data?.version !== 1 || !Array.isArray(data.visited)) return new Set();
      return new Set(data.visited.filter(id => known.has(id)));
    } catch { return new Set(); }
  };
  const visited = load();
  const save = () => { try { storage?.setItem(PROGRESS_KEY, JSON.stringify({ version: 1, visited: [...visited] })); } catch { /* armazenamento bloqueado: o progresso vale só nesta aba */ } };
  return {
    has: id => visited.has(id),
    // Registra a visita; devolve true só na primeira vez (para o toast de 9/9 e o contador não contar em dobro).
    visit(id) { if (!known.has(id) || visited.has(id)) return false; visited.add(id); save(); return true; },
    get count() { return visited.size; },
    get total() { return known.size; },
    get complete() { return visited.size === known.size; },
    ids: () => [...visited],
  };
}

// Faixa do player local da Kong FM para cada parada (0 = Concreto, 1 = Maré de plástico). Só há essas duas faixas liberadas:
// a parada da era plástico toca Maré de plástico; as demais tocam Concreto.
export function localTrackFor(stop) { return stop?.id === 'era-plastic' ? 1 : 0; }

// Id da parada correspondente a uma interação com o mundo (tecla E): história ou portal de era. Outros tipos não contam.
export function stopIdFor(hit) {
  if (hit?.type === 'discovery') return hit.id;
  if (hit?.type === 'archive') return `era-${hit.id}`;
  return null;
}

// Velocidade máxima (m/s) conforme a distância da próxima parada: suave, sem degrau brusco.
export function speedCap(distance) {
  if (distance >= SLOW_ZONE_M) return Infinity;
  if (distance <= ARRIVE_M) return 1.5;
  return 1.5 + (16.5 - 1.5) * ((distance - ARRIVE_M) / (SLOW_ZONE_M - ARRIVE_M));
}

// Assumir o volante: qualquer tecla de direção encerra o passeio automático, sem zerar o progresso.
export const DRIVE_KEYS = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
export function takeOver(tour, key) {
  if (!tour?.active || !DRIVE_KEYS.includes(String(key).toLowerCase())) return tour;
  return { ...tour, active: false, takenOverAt: tour.index };
}

// Ducking do Kong FM perto dos palcos: o rádio abaixa para destacar o áudio espacial das caixas e o ambiente.
// Fator 1 longe do palco, DUCK_LEVEL colado a ele, com transição linear entre DUCK_OUTER_M e DUCK_INNER_M.
export const DUCK_LEVEL = 0.35, DUCK_INNER_M = 9, DUCK_OUTER_M = 18;
export function duckTarget(distanceToStage) {
  if (!Number.isFinite(distanceToStage) || distanceToStage >= DUCK_OUTER_M) return 1;
  if (distanceToStage <= DUCK_INNER_M) return DUCK_LEVEL;
  return DUCK_LEVEL + (1 - DUCK_LEVEL) * ((distanceToStage - DUCK_INNER_M) / (DUCK_OUTER_M - DUCK_INNER_M));
}
// Aproxima o fator atual do alvo em 1/tau segundos (suave, sem degrau): chamado por quadro com dt em segundos.
export function easeDuck(current, target, dt, tau = 0.45) {
  const k = 1 - Math.exp(-Math.max(0, dt) / tau);
  return current + (target - current) * k;
}
