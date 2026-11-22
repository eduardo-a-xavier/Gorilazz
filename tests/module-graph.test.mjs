import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Garante que todo arquivo que o app carrega (imports estáticos e dinâmicos, CSS, HTML e assets literais)
// é servido pelo server.mjs com 200. Um módulo esquecido na lista de rotas quebra o 3D silenciosamente.
const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const IMPORT_RE = /(?:import|export)\s+(?:[^'"();]*?\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]|import\(\s*['"](\.{1,2}\/[^'"]+)['"]\s*\)/g;
const ASSET_RE = /['"`](\.{0,2}\/?(?:assets|src)\/[^'"`$\s{}]+\.(?:png|jpe?g|webp|glb|mp3|woff2|ttf|txt|css|js|mjs|svg))['"`]/g;
const CSS_URL_RE = /url\(\s*['"]?([^'")\s]+)['"]?\s*\)/g;
const HTML_REF_RE = /(?:src|href)="(\.\/[^"]+)"/g;

async function text(file) { return readFile(path.join(root, file), 'utf8'); }

function toRoute(relPath) { return '/' + relPath.split(path.sep).join('/').replace(/\\/g, '/'); }

async function collect() {
  const seen = new Set();
  const queue = ['src/app.js'];
  const extra = new Set();
  while (queue.length) {
    const file = queue.shift();
    if (seen.has(file)) continue;
    seen.add(file);
    const source = await text(file);
    const dir = path.posix.dirname(file);
    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      for (const match of source.matchAll(IMPORT_RE)) {
        const spec = match[1] ?? match[2];
        queue.push(path.posix.normalize(path.posix.join(dir, spec)));
      }
      for (const match of source.matchAll(ASSET_RE)) {
        const spec = match[1];
        // Em JS, caminhos de fetch/Image/loader são resolvidos a partir do documento (raiz), não da pasta do arquivo.
        const target = path.posix.normalize(spec.replace(/^\/+/, '').replace(/^\.\//, ''));
        extra.add(target.replace(/^\.\//, ''));
      }
    }
    if (file.endsWith('.css')) {
      for (const match of source.matchAll(CSS_URL_RE)) {
        const spec = match[1];
        if (/^(data:|https?:|#)/.test(spec)) continue;
        extra.add(path.posix.normalize(path.posix.join(dir, spec)));
      }
    }
  }
  // Ponto de entrada da página: CSS e JS referenciados por index.html.
  const html = await text('index.html');
  for (const match of html.matchAll(HTML_REF_RE)) extra.add(path.posix.normalize(match[1].replace(/^\.\//, '')));
  // Assets literais de conteúdo (capas, fontes) usados em src/content.js e nos CSS.
  for (const file of extra) seen.add(file);
  return [...seen].filter(file => /\.(js|mjs|css|png|jpe?g|webp|glb|mp3|woff2|ttf|txt|svg)$/.test(file)).sort();
}

function startServer() {
  const child = spawn(process.execPath, [path.join(root, 'server.mjs')], { env: { ...process.env, PORT: '0' } });
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.stdout.on('data', chunk => { const port = /porta (\d+)/.exec(String(chunk))?.[1]; if (port) resolve({ child, origin: `http://127.0.0.1:${port}` }); });
  });
}

test('todo módulo, CSS, asset e referência de index.html que o app carrega é servido com 200', async () => {
  const files = await collect();
  assert.ok(files.includes('src/app.js'));
  assert.ok(files.includes('src/world-loader.js'), 'o grafo alcança o carregador do 3D');
  assert.ok(files.includes('src/scene.js'), 'o import dinâmico do 3D entra no grafo');
  const { child, origin } = await startServer();
  try {
    const missing = [];
    for (const file of files) {
      const response = await fetch(origin + toRoute(file));
      if (response.status !== 200) missing.push(`${response.status} ${toRoute(file)}`);
    }
    assert.deepEqual(missing, [], `arquivos que o app carrega e o servidor não serve:\n${missing.join('\n')}`);
  } finally { child.kill(); }
});

test('o servidor serve todos os arquivos de src/ (nenhum módulo novo fica sem rota)', async () => {
  const srcFiles = (await readdir(path.join(root, 'src'), { withFileTypes: true }))
    .filter(entry => entry.isFile() && /\.(js|css)$/.test(entry.name)).map(entry => `src/${entry.name}`);
  const { child, origin } = await startServer();
  try {
    const missing = [];
    for (const file of srcFiles) {
      const response = await fetch(origin + toRoute(file));
      if (response.status !== 200) missing.push(`${response.status} ${toRoute(file)}`);
    }
    assert.deepEqual(missing, [], `src/ com arquivos sem rota:\n${missing.join('\n')}`);
  } finally { child.kill(); }
});
