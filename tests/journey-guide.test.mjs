import test from 'node:test';
import assert from 'node:assert/strict';
import { createJourneyGuide } from '../src/journey-guide.js';
import { DISCOVERIES, REGIONS, MEMBER_LOCATIONS, regionAt } from '../src/world-data.js';

// DOM mínimo: o guia só usa textContent, hidden, atributos, listeners e filhos.
class El {
  constructor(tag = 'div') { this.tagName = tag; this.textContent = ''; this.hidden = false; this.attrs = {}; this.listeners = {}; this.children = []; this.sub = {}; }
  addEventListener(type, fn) { (this.listeners[type] ??= []).push(fn); }
  dispatch(type, event = {}) { for (const fn of this.listeners[type] ?? []) fn(event); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  removeAttribute(k) { delete this.attrs[k]; }
  append(...nodes) { this.children.push(...nodes); }
  focus() {}
  querySelector(selector) { return this.sub[selector] ??= new El(); }
}

function setup() {
  const root = new El();
  globalThis.document = { createElement: tag => new El(tag), querySelector: selector => (selector === '#journey' ? root : null) };
  const navigated = [];
  let stopped = 0, explored = 0;
  const guide = createJourneyGuide({ points: DISCOVERIES, regions: REGIONS, onNavigate: point => navigated.push(point), onStop: () => stopped++, onExplore: () => explored++ });
  return { root, guide, navigated, counts: () => ({ stopped, explored }) };
}

// Mesmos alvos que src/app.js monta no mapa M (overlay de regiões, histórias e integrantes).
function mapTargets() {
  const regionTargets = REGIONS.map((r, i) => ({ x: r.x, z: r.z, title: r.name, region: i }));
  const memberTargets = MEMBER_LOCATIONS.map((m, i) => ({ ...m, title: ['2-D', 'Murdoc', 'Noodle', 'Russel'][i], region: regionAt(m) }));
  const discoveryTargets = DISCOVERIES.map(d => d);
  return { regionTargets, memberTargets, discoveryTargets };
}

test('alvos do mapa M (regiões, integrantes e histórias) têm região válida e atualizam o guia sem TypeError', () => {
  const { root, guide } = setup();
  const { regionTargets, memberTargets, discoveryTargets } = mapTargets();
  for (const target of [...regionTargets, ...memberTargets, ...discoveryTargets]) {
    assert.doesNotThrow(() => guide.update({ vehicle: { x: 0, z: 0, speed: 0 }, known: new Set(), destination: target, nearby: null }));
    const region = REGIONS[target.region];
    assert.ok(region, `${target.title} precisa de region válido`);
    assert.match(root.sub['#journey-distance'].textContent, new RegExp(`^${region.name} · \\d+ m`));
    assert.equal(root.sub['#journey-title'].textContent, target.title);
  }
  for (const target of memberTargets) assert.ok(Number.isInteger(target.region) && target.region >= 0 && target.region < REGIONS.length);
});

test('alvo sem região válida não derruba o guia: mostra só a distância', () => {
  const { root, guide } = setup();
  assert.doesNotThrow(() => guide.update({ vehicle: { x: 0, z: 0, speed: 0 }, known: new Set(), destination: { x: 10, z: 10, title: 'Sem região' }, nearby: null }));
  assert.match(root.sub['#journey-distance'].textContent, /^\d+ m em linha reta$/);
});

test('clique em item da lista do roteiro chama onNavigate com a história escolhida', () => {
  const { root, guide, navigated } = setup();
  guide.update({ vehicle: { x: 0, z: 0, speed: 0 }, known: new Set(), destination: null, nearby: null });
  const items = root.sub['#route-list'].children;
  assert.equal(items.length, DISCOVERIES.length);
  items[2].children[0].dispatch('click');
  assert.equal(navigated.length, 1);
  assert.equal(navigated[0].id, DISCOVERIES[2].id);
});
