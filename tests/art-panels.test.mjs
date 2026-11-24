import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { artForDiscovery, shouldLoadArt, creditLine, ART_LOAD_RADIUS } from '../src/art-panels.js';
import { DISCOVERIES } from '../src/world-data.js';

const manifest = JSON.parse(await readFile(new URL('../assets/art/manifest.json', import.meta.url), 'utf8'));

test('toda descoberta tem arte e crédito no manifesto', () => {
  for (const point of DISCOVERIES) {
    const art = artForDiscovery(manifest, point.id);
    assert.ok(art, `${point.id} sem arte`);
    assert.match(art.path, /^\.\/assets\/art\/.+\.webp$/);
    assert.ok(art.credit && art.credit.length > 10, `${point.id} sem crédito`);
  }
});

test('os arquivos das artes existem, são WebP e cabem no limite de 150 KB', async () => {
  for (const point of DISCOVERIES) {
    const { path } = artForDiscovery(manifest, point.id);
    const file = new URL(`../${path.slice(2)}`, import.meta.url);
    const { size } = await stat(file);
    assert.ok(size <= 150 * 1024, `${path} tem ${size} bytes`);
    const head = (await readFile(file)).subarray(8, 12).toString('ascii');
    assert.equal(head, 'WEBP', `${path} não é WebP`);
  }
});

test('arte só baixa perto do ponto e uma única vez', () => {
  const point = { x: 0, z: 0 };
  assert.equal(shouldLoadArt({ x: 100, z: 0 }, point, false), false);
  assert.equal(shouldLoadArt({ x: ART_LOAD_RADIUS - 1, z: 0 }, point, false), true);
  assert.equal(shouldLoadArt({ x: 1, z: 0 }, point, true), false, 'já pedida não pede de novo');
});

test('crédito aparece no cartão com o texto de uso acadêmico do manifesto', () => {
  assert.match(creditLine(artForDiscovery(manifest, 'voices')), /^Imagem: /);
  assert.equal(creditLine(null), '');
});

test('outdoors de era: capas em 256 px, alinhamento 1:1 entre AD_COVERS e ERA_ART, créditos <= 45 chars e recorte 1998–2023', async () => {
  const { ERA_ADS, AD_COVERS, ERA_ART, AD_COVER_SIZE, AD_CREDIT_KEYS } = await import('../src/city.js');
  const { eraBillboardCredits } = await import('../src/content.js');
  assert.equal(AD_COVER_SIZE, 256);
  assert.equal(ERA_ADS.length, 4);
  assert.equal(AD_COVERS.length, 4);
  assert.equal(ERA_ART.length, 4);
  for (let era = 0; era < 4; era++) {
    assert.equal(AD_COVERS[era].length, ERA_ADS[era].length, `era ${era}: tamanho de AD_COVERS`);
    assert.equal(ERA_ART[era].length, ERA_ADS[era].length, `era ${era}: tamanho de ERA_ART`);
    assert.equal(AD_CREDIT_KEYS[era].length, ERA_ADS[era].length, `era ${era}: tamanho de AD_CREDIT_KEYS`);
    for (let k = 0; k < ERA_ADS[era].length; k++) {
      const text = ERA_ADS[era][k];
      assert.ok(!/2026|THE MOUNTAIN/i.test(text), `outdoor fora do recorte 1998–2023: ${text}`);
      const cover = AD_COVERS[era][k], art = ERA_ART[era][k];
      assert.equal(Boolean(cover), Boolean(art), `era ${era}[${k}]: desalinhamento entre AD_COVERS (${cover}) e ERA_ART (${art})`);
      if (cover && art) {
        const yearMatch = /(20\d{2})/.exec(cover);
        if (yearMatch) assert.ok(art.includes(yearMatch[1]), `era ${era}[${k}]: capa ${cover} não bate com arte ${art}`);
      }
      const credit = eraBillboardCredits[AD_CREDIT_KEYS[era][k]];
      assert.ok(credit && credit.length <= 45, `crédito inválido para era ${era}[${k}]: ${credit}`);
    }
  }
});
