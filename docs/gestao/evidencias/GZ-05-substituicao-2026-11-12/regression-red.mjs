import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const root = new URL('../../../../',import.meta.url);
const baseline = await readFile(new URL('./baseline/server.mjs',import.meta.url),'utf8');
const source = baseline.replace('new URL(route[0], import.meta.url)',`new URL(route[0], ${JSON.stringify(root.href)})`);
const child = spawn(process.execPath,['--input-type=module','--eval',source],{env:{...process.env,PORT:'0'}});
try {
  const port = await new Promise((resolve,reject) => {
    child.once('error',reject);
    child.stdout.on('data',chunk => { const port = /porta (\d+)/.exec(String(chunk))?.[1]; if(port)resolve(port); });
    child.once('exit',code => reject(new Error(`servidor baseline encerrou: ${code}`)));
  });
  const response = await fetch(`http://127.0.0.1:${port}/assets/environment/noodle-diorama.glb`,{method:'HEAD'});
  console.log(`Baseline: HEAD diorama = ${response.status}; esperado pela regressão = 404`);
  assert.equal(response.status,404);
} finally {
  child.kill();
}
