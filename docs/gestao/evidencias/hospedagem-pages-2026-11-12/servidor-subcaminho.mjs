import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize, resolve, sep } from 'node:path';
import { writeFileSync, appendFileSync } from 'node:fs';
const root = resolve(process.argv[2]), log = process.argv[3], prefix = '/Gorilazz/';
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.glb':'model/gltf-binary', '.mp3':'audio/mpeg', '.txt':'text/plain; charset=utf-8', '.json':'application/json' };
writeFileSync(log, '');
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x'); let status = 404, size = 0;
  try {
    if (url.pathname === '/Gorilazz') { status = 301; res.writeHead(301, { Location: prefix }); return res.end(); }
    if (url.pathname.startsWith(prefix)) {
      let rel = decodeURIComponent(url.pathname.slice(prefix.length)) || 'index.html';
      if (rel.endsWith('/')) rel += 'index.html';
      const file = join(root, normalize(rel));
      if (file.startsWith(root + sep)) {
        const body = await readFile(file); status = 200; size = body.length;
        res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Content-Length': body.length, 'Cache-Control': 'max-age=600' });
        return res.end(req.method === 'HEAD' ? undefined : body);
      }
    }
  } catch {} finally { appendFileSync(log, `${status} ${req.method} ${url.pathname}${url.search} ${size}\n`); }
  if (!res.headersSent) { res.writeHead(404); res.end('404'); }
});
server.listen(0, '127.0.0.1', () => console.log('PORT=' + server.address().port));
