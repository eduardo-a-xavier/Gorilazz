import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
    assert.equal(model.headers.get('content-encoding'), null);
    assert.equal(Number(model.headers.get('content-length')), (await model.arrayBuffer()).byteLength);
    for (const path of ['/src/atmosphere.js', '/src/postfx.js', '/src/roads.js', '/src/landmarks.js', '/assets/models/gorillaz-phase7-web.glb']) assert.equal((await fetch(origin + path)).status, 200);
    for (const path of ['/package.json', '/server.mjs', '/src/../server.mjs']) assert.equal((await fetch(origin + path)).status, 404);
  } finally { child.kill(); }
});
