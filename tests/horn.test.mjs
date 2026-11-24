import test from 'node:test';
import assert from 'node:assert/strict';
import { hornAllowed, playHorn } from '../src/discovery-sound.js';

test('buzina respeita entrada, camadas, silêncio e intervalo', () => {
  const state = { entered: true, visible: true, blocked: false, soundOn: true, now: 1000, lastPlayed: 0 };
  assert.equal(hornAllowed(state), true);
  for (const change of [{ entered: false }, { visible: false }, { blocked: true }, { soundOn: false }, { now: 799 }]) {
    assert.equal(hornAllowed({ ...state, ...change }), false);
  }
});

test('buzina sintetiza um tom curto sem alterar o rádio', () => {
  const events = [];
  const param = { setValueAtTime: (...args) => events.push(['set', ...args]), exponentialRampToValueAtTime: (...args) => events.push(['exp', ...args]), linearRampToValueAtTime: (...args) => events.push(['linear', ...args]) };
  const ctx = { currentTime: 1, destination: {}, createOscillator: () => ({ frequency: param, connect() {}, start: t => events.push(['start', t]), stop: t => events.push(['stop', t]) }), createGain: () => ({ gain: param, connect() {} }) };
  playHorn(ctx, { radioPlaying: true });
  assert.ok(events.some(e => e[0] === 'linear' && e[1] === .035));
  assert.ok(events.some(e => e[0] === 'stop' && e[1] === 1.26));
});
