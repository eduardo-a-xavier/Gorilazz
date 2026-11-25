import test from 'node:test';
import assert from 'node:assert/strict';
import { ambientAnchors, particleLayout, totalParticles, PARTICLE_KINDS, PARTICLE_STYLE, particleAllowed } from '../src/ambient-particles.js';
import { readSoundOn, saveSoundOn, discoveryTones, discoveryGain, SOUND_KEY } from '../src/discovery-sound.js';
import { DISCOVERIES, MEMBER_LOCATIONS, roadGap } from '../src/world-data.js';

class MemoryStorage { constructor() { this.map = new Map(); } getItem(k) { return this.map.has(k) ? this.map.get(k) : null; } setItem(k, v) { this.map.set(k, String(v)); } }

test('partículas: poucas (até 60), três tipos, ancoradas no início, no moinho de Demon Days e na Av. Saturnz Barz', () => {
  assert.ok(totalParticles() <= 60, `total ${totalParticles()}`);
  const anchors = ambientAnchors();
  const mill = DISCOVERIES.find(item => item.id === 'demon-days');
  assert.equal(anchors.spore.x, mill.x);
  assert.equal(anchors.spore.z, mill.z);
  assert.deepEqual(anchors.dust, { x: 0, z: 0 });
  assert.ok(Math.hypot(anchors.spark.x, anchors.spark.z) > 10, 'faíscas longe do início');
});

test('posições determinísticas, dentro do raio e da faixa de altura de cada tipo', () => {
  for (const kind of Object.keys(PARTICLE_KINDS)) {
    const spec = PARTICLE_KINDS[kind];
    const anchor = { x: 5, z: -3 };
    const a = particleLayout(kind, anchor);
    const b = particleLayout(kind, anchor);
    assert.deepEqual(a, b, `${kind}: mesma semente, mesmas posições`);
    assert.equal(a.length, spec.count);
    for (const p of a) {
      assert.ok(Math.hypot(p.x - anchor.x, p.z - anchor.z) <= spec.radius + 1e-9, `${kind}: dentro do raio`);
      assert.ok(p.y >= spec.y[0] && p.y <= spec.y[1], `${kind}: altura na faixa`);
    }
  }
});

test('som de descoberta: opção salva; padrão ligado; dados corrompidos viram ligado', () => {
  const storage = new MemoryStorage();
  assert.equal(readSoundOn(storage), true, 'padrão ligado');
  saveSoundOn(storage, false);
  assert.equal(readSoundOn(storage), false, 'silenciado persiste');
  assert.ok(storage.getItem(SOUND_KEY).includes('"on":false'));
  storage.setItem(SOUND_KEY, '{quebrado');
  assert.equal(readSoundOn(storage), true, 'dado corrompido não quebra');
  assert.equal(readSoundOn(null), true, 'sem armazenamento: ligado');
});

test('som: dois tons ascendentes e curtos; mais baixo com o rádio tocando', () => {
  const [first, second] = discoveryTones();
  assert.ok(second.freq > first.freq, 'sobe');
  assert.ok(second.at + second.dur < .5, 'curto');
  assert.ok(discoveryGain(true) < discoveryGain(false), 'com o rádio tocando sai mais baixo');
  assert.ok(discoveryGain(false) <= .2, 'volume moderado');
});

test('partículas ambientes discretas: pequenas, opacidade <= 0,25 e nenhuma perto de palcos ou ruas', () => {
  assert.ok(PARTICLE_STYLE.size <= .42 * .3 + 1e-9 && PARTICLE_STYLE.opacity <= .25);
  const anchors = ambientAnchors();
  for (const kind of Object.keys(PARTICLE_KINDS)) for (const p of particleLayout(kind, anchors[kind]).filter(particleAllowed)) {
    for (const m of MEMBER_LOCATIONS) assert.ok(Math.hypot(m.x - p.x, m.z - p.z) >= 20, `${kind} perto de palco`);
    assert.ok(roadGap(p) >= 10, `${kind} perto da rua`);
  }
});
