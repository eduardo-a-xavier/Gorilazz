import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { stat } from 'node:fs/promises';

function startServer() {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], { env: { ...process.env, PORT: '0' } });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.stdout.on('data', chunk => { const port = /porta (\d+)/.exec(String(chunk))?.[1]; if (port) resolve({ child, origin: `http://127.0.0.1:${port}` }); });
  });
}

test('servidor revalida por ETag, comprime texto e mantém a lista explícita de arquivos', async () => {
  const { child, origin } = await startServer();
  try {
    const first = await fetch(`${origin}/src/scene.js`, { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(first.status, 200);
    assert.equal(first.headers.get('content-encoding'), 'gzip');
    assert.match(await first.text(), /createWorld/);
    const etag = first.headers.get('etag'); assert.ok(etag);
    const again = await fetch(`${origin}/src/scene.js`, { headers: { 'If-None-Match': etag } });
    assert.equal(again.status, 304);
    const model = await fetch(`${origin}/assets/models/gorillaz-geep.glb`, { headers: { 'Accept-Encoding': 'gzip' } });
    assert.equal(model.headers.get('content-encoding'), 'gzip', 'GLB sai comprimido');
    const { size: glbSize } = await stat(new URL('../assets/models/gorillaz-geep.glb', import.meta.url));
    assert.equal((await model.arrayBuffer()).byteLength, glbSize, 'corpo decodificado tem o tamanho do arquivo');
    assert.ok(Number(model.headers.get('content-length')) < glbSize, 'transferência menor que o arquivo');
    for (const path of ['/src/atmosphere.js', '/src/postfx.js', '/src/roads.js', '/src/landmarks.js', '/src/pilot-rig.js', '/src/fauna.js', '/assets/models/gorillaz-phase7-web.glb', '/assets/models/driver-pilot-v2.glb', '/assets/models/driver-pilot.glb', '/assets/models/DRIVER-CREDITS.txt']) assert.equal((await fetch(origin + path)).status, 200);
    for (const slug of ['gorillaz-2001', 'demon-days-2005', 'plastic-beach-2010', 'the-fall-2010', 'humanz-2017', 'the-now-now-2018', 'song-machine-2020', 'cracker-island-2023']) {
      const res = await fetch(`${origin}/assets/covers/${slug}.jpg`);
      assert.equal(res.status, 200, `capa ${slug}.jpg`);
      assert.equal(res.headers.get('content-type'), 'image/jpeg');
    }
    for (const [path, type] of [['/assets/fonts/anton-latin.woff2', 'font/woff2'], ['/assets/fonts/anton-latin-ext.woff2', 'font/woff2'], ['/assets/fonts/Anton-Regular.ttf', 'font/ttf'], ['/assets/fonts/ANTON-OFL.txt', 'text/plain; charset=utf-8']]) {
      const res = await fetch(origin + path);
      assert.equal(res.status, 200, `fonte ${path} sem 404`);
      assert.equal(res.headers.get('content-type'), type);
    }
    // Texturas: WebP primeiro, PNG original como fallback (materials.js).
    for (const name of ['asphalt-normal', 'wood', 'grass-normal']) {
      const webp = await fetch(`${origin}/assets/materials/${name}.webp`);
      assert.equal(webp.status, 200, `webp ${name}`);
      assert.equal(webp.headers.get('content-type'), 'image/webp');
      const png = await fetch(`${origin}/assets/materials/${name}.png`);
      assert.equal(png.status, 200, `fallback png ${name}`);
      assert.equal(png.headers.get('content-type'), 'image/png');
    }
    for (const path of ['/src/onboarding.js', '/src/onboarding.css', '/src/arcade.js', '/src/arcade-screen.js', '/src/arcade-cabinet.js', '/src/arcade.css', '/src/landing-fixes.css', '/src/era-places.js']) assert.equal((await fetch(origin + path)).status, 200, path);
    // Artes do polimento (assets/art): manifesto JSON e WebP com o tipo correto.
    const manifest = await fetch(`${origin}/assets/art/manifest.json`);
    assert.equal(manifest.status, 200, 'manifesto de artes');
    assert.match(manifest.headers.get('content-type'), /application\/json/);
    for (const name of ['member-2d.webp', 'album-gorillaz-2001.webp', 'press-creators-band.webp']) {
      const art = await fetch(`${origin}/assets/art/${name}`);
      assert.equal(art.status, 200, name);
      assert.equal(art.headers.get('content-type'), 'image/webp');
    }
    // Áudio: Accept-Ranges e 206 para trechos (Chrome exige para tocar MP3 em alguns casos).
    const mp3 = await fetch(`${origin}/assets/radio/concreto.mp3`);
    assert.equal(mp3.status, 200);
    assert.equal(mp3.headers.get('accept-ranges'), 'bytes');
    const mp3Size = (await mp3.arrayBuffer()).byteLength;
    const part = await fetch(`${origin}/assets/radio/concreto.mp3`, { headers: { Range: 'bytes=0-99' } });
    assert.equal(part.status, 206);
    assert.equal(part.headers.get('content-range'), `bytes 0-99/${mp3Size}`);
    assert.equal((await part.arrayBuffer()).byteLength, 100);
    const tail = await fetch(`${origin}/assets/radio/concreto.mp3`, { headers: { Range: 'bytes=-50' } });
    assert.equal(tail.status, 206);
    assert.equal(tail.headers.get('content-range'), `bytes ${mp3Size - 50}-${mp3Size - 1}/${mp3Size}`);
    const outside = await fetch(`${origin}/assets/radio/concreto.mp3`, { headers: { Range: `bytes=${mp3Size + 10}-` } });
    assert.equal(outside.status, 416);
    // Revisita do rádio: o Chrome manda Range junto com If-None-Match; 304 sem corpo quebrava a reprodução.
    const revisit = await fetch(`${origin}/assets/radio/concreto.mp3`, { headers: { Range: 'bytes=0-', 'If-None-Match': mp3.headers.get('etag') } });
    assert.equal(revisit.status, 206);
    assert.equal((await revisit.arrayBuffer()).byteLength, mp3Size);
    for (const slug of ['clint-eastwood', 'feel-good-inc', 'on-melancholy-hill']) {
      const url = `${origin}/assets/audio/${slug}.mp3`;
      const head = await fetch(url, { method: 'HEAD' });
      assert.equal(head.status, 200); assert.equal(head.headers.get('content-type'), 'audio/mpeg');
      const part = await fetch(url, { headers: { Range: 'bytes=0-99' } });
      assert.equal(part.status, 206); assert.equal((await part.arrayBuffer()).byteLength, 100);
      assert.equal((await fetch(url, { headers: { 'If-None-Match': head.headers.get('etag') } })).status, 304);
    }
    for (const path of ['/package.json', '/server.mjs', '/src/../server.mjs', '/assets/environment/noodle-diorama.glb']) assert.equal((await fetch(origin + path)).status, 404);
  } finally { child.kill(); }
});
