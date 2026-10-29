import http from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/src/style.css', ['src/style.css', 'text/css; charset=utf-8']],
  ['/src/world.css', ['src/world.css', 'text/css; charset=utf-8']],
  ['/src/editorial.css', ['src/editorial.css', 'text/css; charset=utf-8']],
  ['/src/content.js', ['src/content.js', 'text/javascript; charset=utf-8']],
  ['/src/progress.js', ['src/progress.js', 'text/javascript; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/scene.js', ['src/scene.js', 'text/javascript; charset=utf-8']],
  ['/src/environment.js', ['src/environment.js', 'text/javascript; charset=utf-8']],
  ['/src/materials.js', ['src/materials.js', 'text/javascript; charset=utf-8']],
  ['/assets/materials/asphalt-normal.png', ['assets/materials/asphalt-normal.png', 'image/png']],
  ['/assets/materials/asphalt.png', ['assets/materials/asphalt.png', 'image/png']],
  ['/assets/materials/brick.png', ['assets/materials/brick.png', 'image/png']],
  ['/assets/materials/earth-normal.png', ['assets/materials/earth-normal.png', 'image/png']],
  ['/assets/materials/earth.png', ['assets/materials/earth.png', 'image/png']],
  ['/assets/materials/foliage-normal.png', ['assets/materials/foliage-normal.png', 'image/png']],
  ['/assets/materials/foliage.png', ['assets/materials/foliage.png', 'image/png']],
  ['/assets/materials/grass-normal.png', ['assets/materials/grass-normal.png', 'image/png']],
  ['/assets/materials/grass.png', ['assets/materials/grass.png', 'image/png']],
  ['/assets/materials/plaster-normal.png', ['assets/materials/plaster-normal.png', 'image/png']],
  ['/assets/materials/plaster.png', ['assets/materials/plaster.png', 'image/png']],
  ['/assets/materials/roof-normal.png', ['assets/materials/roof-normal.png', 'image/png']],
  ['/assets/materials/roof.png', ['assets/materials/roof.png', 'image/png']],
  ['/assets/materials/wood-normal.png', ['assets/materials/wood-normal.png', 'image/png']],
  ['/assets/materials/wood.png', ['assets/materials/wood.png', 'image/png']],
  ['/assets/environment/2d-sculpture.glb', ['assets/environment/2d-sculpture.glb', 'model/gltf-binary']],
  ['/assets/environment/broadleaf-tree.glb', ['assets/environment/broadleaf-tree.glb', 'model/gltf-binary']],
  ['/assets/environment/kong-studio.glb', ['assets/environment/kong-studio.glb', 'model/gltf-binary']],
  ['/assets/environment/noodle-diorama.glb', ['assets/environment/noodle-diorama.glb', 'model/gltf-binary']],
  ['/assets/environment/CREDITS.txt', ['assets/environment/CREDITS.txt', 'text/plain; charset=utf-8']],
  ['/src/route.js', ['src/route.js', 'text/javascript; charset=utf-8']],
  ['/src/world-data.js', ['src/world-data.js', 'text/javascript; charset=utf-8']],
  ['/src/driving.js', ['src/driving.js', 'text/javascript; charset=utf-8']],
  ['/src/input.js', ['src/input.js', 'text/javascript; charset=utf-8']],
  ['/src/discoveries.js', ['src/discoveries.js', 'text/javascript; charset=utf-8']],
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
  ['/assets/models/kenney-suv.glb', ['assets/models/kenney-suv.glb', 'model/gltf-binary']],
  ['/assets/models/kenney-suv-luxury.glb', ['assets/models/kenney-suv-luxury.glb', 'model/gltf-binary']],
  ['/assets/models/KENNEY-LICENSE.txt', ['assets/models/KENNEY-LICENSE.txt', 'text/plain; charset=utf-8']],
  ['/src/vendor/three.module.min.js', ['src/vendor/three.module.min.js', 'text/javascript; charset=utf-8']],
  ['/src/vendor/three.core.min.js', ['src/vendor/three.core.min.js', 'text/javascript; charset=utf-8']],
]);
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
    const body = await readFile(new URL(route[0], import.meta.url));
    res.writeHead(200, { ...headers, 'Content-Type': route[1], 'Content-Length': body.length });
    res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    console.error('Erro ao servir arquivo:', error.code);
    res.writeHead(500, headers); res.end('Erro interno');
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Gorilazz disponível na porta ${server.address().port}`));
