import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
const routes = new Map([
  ['/src/atmosphere.js', ['src/atmosphere.js', 'text/javascript; charset=utf-8']],
  ['/src/band-pose.js', ['src/band-pose.js', 'text/javascript; charset=utf-8']],
  ['/src/pilot-rig.js', ['src/pilot-rig.js', 'text/javascript; charset=utf-8']],
  ['/src/fauna.js', ['src/fauna.js', 'text/javascript; charset=utf-8']],
  ['/src/onboarding.js', ['src/onboarding.js', 'text/javascript; charset=utf-8']],
  ['/src/onboarding.css', ['src/onboarding.css', 'text/css; charset=utf-8']],
  ['/src/arcade.js', ['src/arcade.js', 'text/javascript; charset=utf-8']],
  ['/src/arcade-screen.js', ['src/arcade-screen.js', 'text/javascript; charset=utf-8']],
  ['/src/arcade-cabinet.js', ['src/arcade-cabinet.js', 'text/javascript; charset=utf-8']],
  ['/src/arcade.css', ['src/arcade.css', 'text/css; charset=utf-8']],
  ['/src/landing-fixes.css', ['src/landing-fixes.css', 'text/css; charset=utf-8']],
  ['/src/era-places.js', ['src/era-places.js', 'text/javascript; charset=utf-8']],
  ['/src/world-loader.js', ['src/world-loader.js', 'text/javascript; charset=utf-8']],
  ['/src/model-safety.js', ['src/model-safety.js', 'text/javascript; charset=utf-8']],
  ['/src/discovery-scale.js', ['src/discovery-scale.js', 'text/javascript; charset=utf-8']],
  ['/src/art-panels.js', ['src/art-panels.js', 'text/javascript; charset=utf-8']],
  ['/src/street-props.js', ['src/street-props.js', 'text/javascript; charset=utf-8']],
  ['/src/vehicle-motion.js', ['src/vehicle-motion.js', 'text/javascript; charset=utf-8']],
  ['/src/easter-eggs.js', ['src/easter-eggs.js', 'text/javascript; charset=utf-8']],
  ['/src/street-props-plan.js', ['src/street-props-plan.js', 'text/javascript; charset=utf-8']],
  ['/src/escape-stack.js', ['src/escape-stack.js', 'text/javascript; charset=utf-8']],
  ['/src/piano-game.js', ['src/piano-game.js', 'text/javascript; charset=utf-8']],
  ['/src/piano-screen.js', ['src/piano-screen.js', 'text/javascript; charset=utf-8']],
  ['/src/member-viewer.js', ['src/member-viewer.js', 'text/javascript; charset=utf-8']],
  ['/src/guided-tour.js', ['src/guided-tour.js', 'text/javascript; charset=utf-8']],
  ['/src/frame-timing.js', ['src/frame-timing.js', 'text/javascript; charset=utf-8']],
  ['/src/radio-duck.js', ['src/radio-duck.js', 'text/javascript; charset=utf-8']],
  ['/src/sign-style.js', ['src/sign-style.js', 'text/javascript; charset=utf-8']],
  ['/assets/art/manifest.json', ['assets/art/manifest.json', 'application/json; charset=utf-8']],
  ['/assets/art/album-cracker-island-2023.webp', ['assets/art/album-cracker-island-2023.webp', 'image/webp']],
  ['/assets/art/album-demon-days-2005.webp', ['assets/art/album-demon-days-2005.webp', 'image/webp']],
  ['/assets/art/album-gorillaz-2001.webp', ['assets/art/album-gorillaz-2001.webp', 'image/webp']],
  ['/assets/art/album-humanz-2017.webp', ['assets/art/album-humanz-2017.webp', 'image/webp']],
  ['/assets/art/album-plastic-beach-2010.webp', ['assets/art/album-plastic-beach-2010.webp', 'image/webp']],
  ['/assets/art/album-song-machine-2020.webp', ['assets/art/album-song-machine-2020.webp', 'image/webp']],
  ['/assets/art/album-the-fall-2010.webp', ['assets/art/album-the-fall-2010.webp', 'image/webp']],
  ['/assets/art/album-the-now-now-2018.webp', ['assets/art/album-the-now-now-2018.webp', 'image/webp']],
  ['/assets/art/art-dare-2005.webp', ['assets/art/art-dare-2005.webp', 'image/webp']],
  ['/assets/art/art-feel-good-inc-2005.webp', ['assets/art/art-feel-good-inc-2005.webp', 'image/webp']],
  ['/assets/art/art-sleeping-powder-2017.webp', ['assets/art/art-sleeping-powder-2017.webp', 'image/webp']],
  ['/assets/art/art-stylo-2010.webp', ['assets/art/art-stylo-2010.webp', 'image/webp']],
  ['/assets/art/member-2d.webp', ['assets/art/member-2d.webp', 'image/webp']],
  ['/assets/art/member-murdoc.webp', ['assets/art/member-murdoc.webp', 'image/webp']],
  ['/assets/art/member-noodle.webp', ['assets/art/member-noodle.webp', 'image/webp']],
  ['/assets/art/member-russel.webp', ['assets/art/member-russel.webp', 'image/webp']],
  ['/assets/art/press-band-phase7.webp', ['assets/art/press-band-phase7.webp', 'image/webp']],
  ['/assets/art/press-creators-band.webp', ['assets/art/press-creators-band.webp', 'image/webp']],
  ['/assets/art/press-gorillaz-live.webp', ['assets/art/press-gorillaz-live.webp', 'image/webp']],
  ['/src/roads.js', ['src/roads.js', 'text/javascript; charset=utf-8']],
  ['/src/landmarks.js', ['src/landmarks.js', 'text/javascript; charset=utf-8']],
  ['/src/postfx.js', ['src/postfx.js', 'text/javascript; charset=utf-8']],
  ['/assets/models/gorillaz-phase7-web.glb', ['assets/models/gorillaz-phase7-web.glb', 'model/gltf-binary']],
  ['/assets/models/gorillaz-phase7-web-v3.glb', ['assets/models/gorillaz-phase7-web-v3.glb', 'model/gltf-binary']],
  ['/assets/models/gorillaz-phase7-web-v2.glb', ['assets/models/gorillaz-phase7-web-v2.glb', 'model/gltf-binary']],
  ['/assets/models/gorillaz-phase7-v2.glb', ['assets/models/gorillaz-phase7-v2.glb', 'model/gltf-binary']],
  ['/assets/models/noodle-guitar-v3.glb', ['assets/models/noodle-guitar-v3.glb', 'model/gltf-binary']],
  ['/assets/models/noodle-guitar-v2.glb', ['assets/models/noodle-guitar-v2.glb', 'model/gltf-binary']],
  ['/assets/models/noodle-stage-props-v2.glb', ['assets/models/noodle-stage-props-v2.glb', 'model/gltf-binary']],
  ['/src/city.js', ['src/city.js', 'text/javascript; charset=utf-8']],
  ['/src/cabin.js', ['src/cabin.js', 'text/javascript; charset=utf-8']],
  ['/assets/audio/clint-eastwood.mp3', ['assets/audio/clint-eastwood.mp3', 'audio/mpeg']],
  ['/assets/audio/feel-good-inc.mp3', ['assets/audio/feel-good-inc.mp3', 'audio/mpeg']],
  ['/assets/audio/on-melancholy-hill.mp3', ['assets/audio/on-melancholy-hill.mp3', 'audio/mpeg']],
  ['/assets/radio/concreto.mp3', ['assets/radio/concreto.mp3', 'audio/mpeg']],
  ['/assets/radio/mare.mp3', ['assets/radio/mare.mp3', 'audio/mpeg']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/src/style.css', ['src/style.css', 'text/css; charset=utf-8']],
  ['/src/world.css', ['src/world.css', 'text/css; charset=utf-8']],
  ['/src/editorial.css', ['src/editorial.css', 'text/css; charset=utf-8']],
  ['/src/content.js', ['src/content.js', 'text/javascript; charset=utf-8']],
  ['/src/progress.js', ['src/progress.js', 'text/javascript; charset=utf-8']],
  ['/src/local-radio.js', ['src/local-radio.js', 'text/javascript; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/scene.js', ['src/scene.js', 'text/javascript; charset=utf-8']],
  ['/src/environment.js', ['src/environment.js', 'text/javascript; charset=utf-8']],
  ['/src/materials.js', ['src/materials.js', 'text/javascript; charset=utf-8']],
  ['/assets/materials/asphalt-normal.png', ['assets/materials/asphalt-normal.png', 'image/png']],
  ['/assets/materials/asphalt-normal.webp', ['assets/materials/asphalt-normal.webp', 'image/webp']],
  ['/assets/materials/asphalt.png', ['assets/materials/asphalt.png', 'image/png']],
  ['/assets/materials/asphalt.webp', ['assets/materials/asphalt.webp', 'image/webp']],
  ['/assets/materials/brick.png', ['assets/materials/brick.png', 'image/png']],
  ['/assets/materials/brick.webp', ['assets/materials/brick.webp', 'image/webp']],
  ['/assets/materials/earth-normal.png', ['assets/materials/earth-normal.png', 'image/png']],
  ['/assets/materials/earth-normal.webp', ['assets/materials/earth-normal.webp', 'image/webp']],
  ['/assets/materials/earth.png', ['assets/materials/earth.png', 'image/png']],
  ['/assets/materials/earth.webp', ['assets/materials/earth.webp', 'image/webp']],
  ['/assets/materials/foliage-normal.png', ['assets/materials/foliage-normal.png', 'image/png']],
  ['/assets/materials/foliage-normal.webp', ['assets/materials/foliage-normal.webp', 'image/webp']],
  ['/assets/materials/foliage.png', ['assets/materials/foliage.png', 'image/png']],
  ['/assets/materials/foliage.webp', ['assets/materials/foliage.webp', 'image/webp']],
  ['/assets/materials/grass-normal.png', ['assets/materials/grass-normal.png', 'image/png']],
  ['/assets/materials/grass-normal.webp', ['assets/materials/grass-normal.webp', 'image/webp']],
  ['/assets/materials/grass.png', ['assets/materials/grass.png', 'image/png']],
  ['/assets/materials/grass.webp', ['assets/materials/grass.webp', 'image/webp']],
  ['/assets/materials/plaster-normal.png', ['assets/materials/plaster-normal.png', 'image/png']],
  ['/assets/materials/plaster-normal.webp', ['assets/materials/plaster-normal.webp', 'image/webp']],
  ['/assets/materials/plaster.png', ['assets/materials/plaster.png', 'image/png']],
  ['/assets/materials/plaster.webp', ['assets/materials/plaster.webp', 'image/webp']],
  ['/assets/materials/roof-normal.png', ['assets/materials/roof-normal.png', 'image/png']],
  ['/assets/materials/roof-normal.webp', ['assets/materials/roof-normal.webp', 'image/webp']],
  ['/assets/materials/roof.png', ['assets/materials/roof.png', 'image/png']],
  ['/assets/materials/roof.webp', ['assets/materials/roof.webp', 'image/webp']],
  ['/assets/materials/wood-normal.png', ['assets/materials/wood-normal.png', 'image/png']],
  ['/assets/materials/wood-normal.webp', ['assets/materials/wood-normal.webp', 'image/webp']],
  ['/assets/materials/wood.png', ['assets/materials/wood.png', 'image/png']],
  ['/assets/materials/wood.webp', ['assets/materials/wood.webp', 'image/webp']],
  ['/assets/environment/broadleaf-tree.glb', ['assets/environment/broadleaf-tree.glb', 'model/gltf-binary']],
  ['/assets/environment/kong-studio.glb', ['assets/environment/kong-studio.glb', 'model/gltf-binary']],
  ['/assets/environment/CREDITS.txt', ['assets/environment/CREDITS.txt', 'text/plain; charset=utf-8']],
  ['/src/route.js', ['src/route.js', 'text/javascript; charset=utf-8']],
  ['/src/world-data.js', ['src/world-data.js', 'text/javascript; charset=utf-8']],
  ['/src/driving.js', ['src/driving.js', 'text/javascript; charset=utf-8']],
  ['/src/journey-guide.js', ['src/journey-guide.js', 'text/javascript; charset=utf-8']],
  ['/src/input.js', ['src/input.js', 'text/javascript; charset=utf-8']],
  ['/src/discoveries.js', ['src/discoveries.js', 'text/javascript; charset=utf-8']],
  ['/src/discoveries-lore.js', ['src/discoveries-lore.js', 'text/javascript; charset=utf-8']],
  ['/src/discoveries-search.js', ['src/discoveries-search.js', 'text/javascript; charset=utf-8']],
  ['/src/discoveries-drawer.js', ['src/discoveries-drawer.js', 'text/javascript; charset=utf-8']],
  ['/src/minimap-art.js', ['src/minimap-art.js', 'text/javascript; charset=utf-8']],
  ['/src/world-cycle.js', ['src/world-cycle.js', 'text/javascript; charset=utf-8']],
  ['/src/ambient-particles.js', ['src/ambient-particles.js', 'text/javascript; charset=utf-8']],
  ['/src/discovery-sound.js', ['src/discovery-sound.js', 'text/javascript; charset=utf-8']],
  ['/src/navigation.js', ['src/navigation.js', 'text/javascript; charset=utf-8']],
  ['/src/vendor/GLTFLoader.js', ['src/vendor/GLTFLoader.js', 'text/javascript; charset=utf-8']],
  ['/src/vendor/BufferGeometryUtils.js', ['src/vendor/BufferGeometryUtils.js', 'text/javascript; charset=utf-8']],
  ['/assets/models/gorillaz-phase7.glb', ['assets/models/gorillaz-phase7.glb', 'model/gltf-binary']],
  ['/assets/models/PHASE7-CREDITS.txt', ['assets/models/PHASE7-CREDITS.txt', 'text/plain; charset=utf-8']],
  ['/assets/portraits/phase7-twod.png', ['assets/portraits/phase7-twod.png', 'image/png']],
  ['/assets/portraits/phase7-murdoc.png', ['assets/portraits/phase7-murdoc.png', 'image/png']],
  ['/assets/portraits/phase7-noodle.png', ['assets/portraits/phase7-noodle.png', 'image/png']],
  ['/assets/portraits/phase7-russel.png', ['assets/portraits/phase7-russel.png', 'image/png']],
  ['/assets/models/gorillaz-geep.glb', ['assets/models/gorillaz-geep.glb', 'model/gltf-binary']],
  ['/assets/models/GEEP-CREDITS.txt', ['assets/models/GEEP-CREDITS.txt', 'text/plain; charset=utf-8']],
  ['/assets/models/driver-pilot-v5.glb', ['assets/models/driver-pilot-v5.glb', 'model/gltf-binary']],
  ['/assets/models/driver-pilot-v4.glb', ['assets/models/driver-pilot-v4.glb', 'model/gltf-binary']],
  ['/assets/models/driver-pilot-v2.glb', ['assets/models/driver-pilot-v2.glb', 'model/gltf-binary']],
  ['/assets/models/driver-pilot.glb', ['assets/models/driver-pilot.glb', 'model/gltf-binary']],
  ['/assets/models/DRIVER-CREDITS.txt', ['assets/models/DRIVER-CREDITS.txt', 'text/plain; charset=utf-8']],
  ['/assets/models/kenney-suv.glb', ['assets/models/kenney-suv.glb', 'model/gltf-binary']],
  ['/assets/covers/gorillaz-2001.jpg', ['assets/covers/gorillaz-2001.jpg', 'image/jpeg']],
  ['/assets/covers/demon-days-2005.jpg', ['assets/covers/demon-days-2005.jpg', 'image/jpeg']],
  ['/assets/covers/plastic-beach-2010.jpg', ['assets/covers/plastic-beach-2010.jpg', 'image/jpeg']],
  ['/assets/covers/the-fall-2010.jpg', ['assets/covers/the-fall-2010.jpg', 'image/jpeg']],
  ['/assets/covers/humanz-2017.jpg', ['assets/covers/humanz-2017.jpg', 'image/jpeg']],
  ['/assets/covers/the-now-now-2018.jpg', ['assets/covers/the-now-now-2018.jpg', 'image/jpeg']],
  ['/assets/covers/song-machine-2020.jpg', ['assets/covers/song-machine-2020.jpg', 'image/jpeg']],
  ['/assets/covers/cracker-island-2023.jpg', ['assets/covers/cracker-island-2023.jpg', 'image/jpeg']],
  ['/assets/fonts/anton-latin.woff2', ['assets/fonts/anton-latin.woff2', 'font/woff2']],
  ['/assets/fonts/anton-latin-ext.woff2', ['assets/fonts/anton-latin-ext.woff2', 'font/woff2']],
  ['/assets/fonts/Anton-Regular.ttf', ['assets/fonts/Anton-Regular.ttf', 'font/ttf']],
  ['/assets/fonts/ANTON-OFL.txt', ['assets/fonts/ANTON-OFL.txt', 'text/plain; charset=utf-8']],
  ['/assets/models/kenney-suv-luxury.glb', ['assets/models/kenney-suv-luxury.glb', 'model/gltf-binary']],
  ['/assets/models/KENNEY-LICENSE.txt', ['assets/models/KENNEY-LICENSE.txt', 'text/plain; charset=utf-8']],
  ['/src/vendor/three.module.min.js', ['src/vendor/three.module.min.js', 'text/javascript; charset=utf-8']],
  ['/src/vendor/three.core.min.js', ['src/vendor/three.core.min.js', 'text/javascript; charset=utf-8']],
]);
const cache = new Map();
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('PORT inválida');
const server = http.createServer(async (req, res) => {
  const headers = { 'X-Content-Type-Options': 'nosniff' };
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405, { ...headers, Allow: 'GET, HEAD' }); return res.end();
  }
  let route;
  try { route = routes.get(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400, headers); return res.end('Requisição inválida'); }
  if (!route) { res.writeHead(404, headers); return res.end('Não encontrado'); }
  try {
    // Textos e GLB (-36% no conjunto medido) seguem comprimidos; PNG/JPG/MP3 já vêm comprimidos.
    // Cada arquivo fica em memória enquanto não muda no disco. O navegador revalida por ETag
    // (304 sem corpo) e textos seguem comprimidos: recarregar a página não baixa 19 MB de novo.
    const file = new URL(route[0], import.meta.url), { mtimeMs, size } = await stat(file);
    const etag = `"${size.toString(36)}-${Math.round(mtimeMs).toString(36)}"`;
    let entry = cache.get(route[0]);
    if (entry?.etag !== etag) {
      const body = await readFile(file);
      entry = { etag, body, gzip: /^(text\/|model\/gltf-binary)/.test(route[1]) && body.length > 1024 ? gzipSync(body) : null };
      cache.set(route[0], entry);
    }
    Object.assign(headers, { ETag: etag, 'Cache-Control': 'no-cache', Vary: 'Accept-Encoding' });
    // 304 nunca responde a um pedido com Range: o <audio> (rádio) precisa do trecho; revisita com ETag dava "não pôde ser reproduzido".
    if (!req.headers.range && req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    // Áudio: anuncia Accept-Ranges e responde 206 quando o navegador pede um trecho (alguns Chrome exigem para tocar MP3).
    if (/^audio\//.test(route[1])) {
      const total = entry.body.length;
      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
      if (range && (range[1] !== '' || range[2] !== '')) {
        const start = range[1] === '' ? Math.max(0, total - Number(range[2])) : Number(range[1]);
        const end = range[1] === '' || range[2] === '' ? total - 1 : Math.min(Number(range[2]), total - 1);
        if (start > end || start >= total) { res.writeHead(416, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes */${total}` }); return res.end(); }
        const slice = entry.body.subarray(start, end + 1);
        res.writeHead(206, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Type': route[1], 'Content-Length': slice.length, 'Content-Range': `bytes ${start}-${end}/${total}` });
        return res.end(req.method === 'HEAD' ? undefined : slice);
      }
      res.writeHead(200, { ...headers, 'Accept-Ranges': 'bytes', 'Content-Type': route[1], 'Content-Length': total });
      return res.end(req.method === 'HEAD' ? undefined : entry.body);
    }
    const compressed = entry.gzip && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '');
    const body = compressed ? entry.gzip : entry.body;
    res.writeHead(200, { ...headers, 'Content-Type': route[1], 'Content-Length': body.length, ...(compressed ? { 'Content-Encoding': 'gzip' } : {}) });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('Erro ao servir arquivo:', error.code);
    res.writeHead(500, headers); res.end('Erro interno');
  }
});
// Conexões keep-alive de 65 s: o padrão do Node (5 s) fecha sockets ociosos que o Chrome ainda reutiliza, e o reload vira "Failed to fetch".
server.keepAliveTimeout = 65000; server.headersTimeout = 66000;
server.listen(port, '0.0.0.0', () => console.log(`Gorilazz disponível na porta ${server.address().port}`));
