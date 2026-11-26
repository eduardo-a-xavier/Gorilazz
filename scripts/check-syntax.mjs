import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export function collectSyntaxTargets(baseDir = root) {
  const targets = ['server.mjs'];
  function walk(relDir) {
    const entries = readdirSync(path.join(baseDir, relDir), { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const entry of entries) {
      if (entry.name === 'vendor') continue;
      const rel = path.posix.join(relDir, entry.name);
      if (entry.isDirectory()) walk(rel);
      else if (/\.(?:js|mjs)$/.test(entry.name)) targets.push(rel);
    }
  }
  walk('src');
  return targets;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const files = collectSyntaxTargets();
  for (const file of files) {
    const res = spawnSync(process.execPath, ['--check', path.join(root, file)], { stdio: 'inherit' });
    if (res.status !== 0) {
      console.error(`Falha de sintaxe em ${file}`);
      process.exit(res.status ?? 1);
    }
  }
  console.log(`check OK: ${files.length} arquivos validados`);
}
