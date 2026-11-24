import test from 'node:test';
import assert from 'node:assert/strict';
import { DISCOVERY_LORE } from '../src/discoveries-lore.js';
import { filterEntries, matchesQuery, matchesFilter, statusFor, isBandFiction, hintFor, normalizeText, FILTERS } from '../src/discoveries-search.js';
import { buildStops } from '../src/guided-tour.js';
import { ERA_GATES, CITY_ERAS, DISCOVERIES } from '../src/world-data.js';
import { tracks } from '../src/content.js';

const ids = entries => entries.map(entry => entry.id).sort();
const stops = buildStops({ gates: ERA_GATES, cityEras: CITY_ERAS, eraTracks: ['clint', 'melancholy', 'revolving', 'saturnz'], discoveries: DISCOVERIES, tracks });

test('são 9 fichas, uma por parada do passeio, com ids únicos e fonte com data', () => {
  assert.equal(DISCOVERY_LORE.length, 9);
  assert.equal(new Set(DISCOVERY_LORE.map(entry => entry.id)).size, 9);
  const stopIds = new Set(stops.map(stop => stop.id));
  for (const entry of DISCOVERY_LORE) {
    assert.ok(stopIds.has(entry.stopId), `ficha ${entry.id} aponta para uma parada real (${entry.stopId})`);
    assert.match(entry.source.accessed, /^\d{4}-\d{2}-\d{2}$/, `${entry.id}: data de acesso`);
    assert.match(entry.source.url, /^https:\/\//, `${entry.id}: fonte https`);
  }
});

test('busca ignora maiúsculas e acentos e exige todas as palavras digitadas', () => {
  assert.deepEqual(ids(filterEntries(DISCOVERY_LORE, { query: 'kong' })).length >= 1, true);
  assert.ok(filterEntries(DISCOVERY_LORE, { query: 'JAMIE hewlett' }).length >= 1, 'nome com maiúsculas');
  assert.equal(normalizeText('Grammy Ação'), 'grammy acao');
  assert.equal(matchesQuery(DISCOVERY_LORE.find(entry => entry.id === 'kong-studios'), 'kong estúdios'), false, 'palavra inexistente não passa');
  assert.equal(filterEntries(DISCOVERY_LORE, { query: 'palavra-que-nao-existe-xyz' }).length, 0);
  assert.equal(filterEntries(DISCOVERY_LORE, { query: '   ' }).length, 9, 'busca vazia mostra tudo');
});

test('filtros rápidos por tag: Todas mostra as 9; cada tag filtra só o que tem a tag', () => {
  assert.equal(filterEntries(DISCOVERY_LORE, { filter: 'Todas' }).length, 9);
  for (const filter of FILTERS.slice(1)) {
    const result = filterEntries(DISCOVERY_LORE, { filter });
    assert.ok(result.length >= 1, `${filter} tem fichas`);
    assert.ok(result.every(entry => entry.tags.includes(filter)), `${filter}: só fichas com a tag`);
  }
  assert.equal(matchesFilter({ tags: ['Eras'] }, 'Personagens'), false);
});

test('estado descoberto mostra o texto; bloqueado mostra título e dica, com o botão "Ir até lá"', () => {
  const visited = new Set(['beginning']);
  const found = DISCOVERY_LORE.find(entry => entry.stopId === 'beginning');
  const locked = DISCOVERY_LORE.find(entry => entry.stopId === 'era-hiato');
  assert.deepEqual(statusFor(found, visited), { discovered: true, label: 'Descoberto' });
  assert.equal(statusFor(locked, visited).discovered, false);
  assert.equal(statusFor(locked, visited).label, 'Bloqueado — Clique para ir até lá');
  assert.match(hintFor(locked), /^Pista:/, 'dica sem o texto da ficha');
  assert.ok(!hintFor(locked).includes(locked.text.slice(0, 40)), 'dica não revela o texto');
  assert.equal(statusFor(locked, new Set()).discovered, false, 'sem visitas, tudo bloqueado');
});

test('ficção da banda é marcada quando o texto ou o período diz isso', () => {
  const twod = DISCOVERY_LORE.find(entry => entry.id === '2d-black-eyes');
  const mtv = DISCOVERY_LORE.find(entry => entry.id === 'mtv-origin');
  assert.equal(isBandFiction(twod), true);
  assert.equal(isBandFiction(mtv), false);
});
