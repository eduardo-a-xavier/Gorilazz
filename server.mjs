import http from 'node:http';
import { readFile } from 'node:fs/promises';
const routes = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/index.html', ['index.html', 'text/html; charset=utf-8']],
  ['/src/style.css', ['src/style.css', 'text/css; charset=utf-8']],
  ['/src/app.js', ['src/app.js', 'text/javascript; charset=utf-8']],
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
