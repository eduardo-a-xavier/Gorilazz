import test from 'node:test';
import assert from 'node:assert/strict';
import { eras, tracks, sources, memberStories, eraForProgress, trackById, listeningUrl, EDITORIAL_SCOPE } from '../src/content.js';

test('o recorte tem oito eras distintas e não se apresenta como discografia atual', () => {
  assert.equal(EDITORIAL_SCOPE, '1998–2023'); assert.equal(eras.length, 8);
  assert.equal(new Set(eras.map(era => era.id)).size, 8);
  assert.ok(eras.every(era => era.year >= 2001 && era.year <= 2023));
  assert.match(eras.at(-1).real, /não uma afirmação/);
});
test('cada era tem duas camadas de narrativa, fonte e uma escuta válida', () => {
  for (const [index, era] of eras.entries()) {
    assert.ok(era.real.length > 100 && era.fiction.length > 70 && era.insight.length > 40);
    assert.ok(era.refs.length > 0 && era.refs.every(id => sources.some(source => source.id === id)));
    assert.equal(trackById(era.track).era, index);
  }
});
test('The Fall distingue digital e físico sem duplicar o álbum', () => {
  const fall = eras.filter(era => era.id === 'the-fall'); assert.equal(fall.length, 1);
  assert.match(fall[0].real, /digitalmente em 2010/); assert.match(fall[0].real, /física em 2011/);
});
test('a era corresponde à posição circular inclusive em marcha à ré', () => {
  assert.equal(eraForProgress(0),0); assert.equal(eraForProgress(.25),2); assert.equal(eraForProgress(.875),7);
  assert.equal(eraForProgress(1),0); assert.equal(eraForProgress(-.125),7); assert.equal(eraForProgress(2.25),2);
});
test('faixas sem ID de vídeo cadastrado abrem uma busca em vez de um embed inventado', () => {
  for (const track of tracks) {
    const url = new URL(listeningUrl(track)); assert.equal(url.protocol,'https:');
    if (track.video) { assert.match(track.video,/^[a-zA-Z0-9_-]{11}$/); assert.equal(url.searchParams.get('v'),track.video); }
    else { assert.equal(url.pathname,'/results'); assert.ok(url.searchParams.get('search_query').includes(track.name)); }
  }
  assert.equal(new Set(tracks.map(track => track.id)).size,tracks.length);
});
test('cada integrante aponta para uma ficha e escuta existentes', () => {
  assert.equal(memberStories.length,4);
  for(const story of memberStories) { assert.ok(story.detail.length>50); assert.ok(tracks.some(track=>track.id===story.track)); }
});
