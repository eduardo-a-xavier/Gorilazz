import { readFileSync, mkdirSync, copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
const out = process.argv[2];
const source = readFileSync('server.mjs', 'utf8');
const files = new Set([...source.matchAll(/\['\/[^']*',\s*\['([^']+)'/g)].map(m => m[1]));
if (files.size < 50) throw new Error('Lista de rotas inesperada: ' + files.size);
for (const file of files) {
  if (!existsSync(file)) throw new Error('Arquivo ausente: ' + file);
  mkdirSync(join(out, dirname(file)), { recursive: true });
  copyFileSync(file, join(out, file));
}
writeFileSync(join(out, '.nojekyll'), '');
console.log(files.size + ' arquivos copiados');
