import test from 'node:test';
import assert from 'node:assert/strict';
import { station } from '../src/local-radio.js';
import { PIANO_SONGS } from '../src/piano-game.js';
import { readFileSync, existsSync } from 'node:fs';

test('Kong FM oferece cinco faixas relativas e piano usa três gravações locais', () => {
  assert.equal(station.length,5);
  for (const item of station) { assert.match(item.url,/^\.\/assets\//); assert.ok(existsSync(item.url)); }
  assert.equal(PIANO_SONGS.length,3);
  for (const song of PIANO_SONGS) assert.ok(station.some(track=>track.url===song.url));
});
test('rádio e piano não carregam MP3 antecipadamente e piano prevê fallback', () => {
  assert.match(readFileSync('src/local-radio.js','utf8'), /audio\.preload\s*=\s*'none'/);
  const piano=readFileSync('src/piano-screen.js','utf8');
  assert.match(piano,/recording\.preload\s*=\s*'none'/);
  assert.match(piano,/recording\.onplaying\s*=\s*\(\)\s*=>\s*launch\(true\)/);
  assert.match(piano,/recording\.onerror\s*=\s*\(\)\s*=>\s*launch\(false\)/);
});
