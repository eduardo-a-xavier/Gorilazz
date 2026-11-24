// Central de Descobertas: busca, filtros e status das fichas. Lógica pura (sem DOM), testada em Node.
// As fichas (DISCOVERY_LORE) vêm de src/discoveries-lore.js; o estado "descoberto" vem do contador (stopProgress).
export const FILTERS = ['Todas', 'Eras', 'Personagens', 'Bastidores'];

// Texto para comparar sem acento e sem maiúsculas ("Jamie Hewlett" = "jamie hewlett").
export const normalizeText = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

// Busca por palavra-chave: título, período, texto, palavras-chave e tags. Todas as palavras digitadas precisam aparecer.
export function matchesQuery(entry, query) {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = normalizeText([entry.title, entry.period, entry.text, ...(entry.keywords ?? []), ...(entry.tags ?? [])].join(' '));
  return words.every(word => haystack.includes(word));
}

// Filtro rápido por tag ("Todas" não filtra).
export function matchesFilter(entry, filter = 'Todas') {
  return filter === 'Todas' || (entry.tags ?? []).includes(filter);
}

export function filterEntries(entries, { query = '', filter = 'Todas' } = {}) {
  return entries.filter(entry => matchesFilter(entry, filter) && matchesQuery(entry, query));
}

// Estado de uma ficha: descoberta (texto completo) ou bloqueada (só título e dica).
export function statusFor(entry, visitedIds) {
  const discovered = Boolean(visitedIds && visitedIds.has(entry.stopId));
  return { discovered, label: discovered ? 'Descoberto' : 'Bloqueado — Clique para ir até lá' };
}

// "Ficção da banda": fichas cujo período ou texto diz isso (lore), para não confundir com fato real.
export function isBandFiction(entry) {
  return /ficção/i.test(`${entry.period ?? ''} ${entry.text ?? ''}`);
}

// Dica de uma ficha bloqueada: não revela o texto, só orienta até o ponto no mapa.
export function hintFor(entry) {
  return `Pista: encontre o ponto de história no mapa (${entry.period}).`;
}
