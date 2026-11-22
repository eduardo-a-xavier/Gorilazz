import test from 'node:test';
import assert from 'node:assert/strict';
import { createWorldLoader } from '../src/world-loader.js';

const quiet = { error() {} };
const noWait = async () => {};

test('carrega de primeira: uma tentativa, sem aviso de falha', async () => {
  let ready = 0, failed = 0, resets = 0;
  const loader = createWorldLoader({
    importScene: async () => ({ createWorld: () => 'mundo' }),
    mount: scene => scene.createWorld(),
    reset: () => resets++, onReady: () => ready++, onFail: () => failed++, sleep: noWait, log: quiet,
  });
  assert.equal(await loader.run(), 'mundo');
  assert.equal(loader.attempts, 1);
  assert.equal(ready, 1); assert.equal(failed, 0); assert.equal(resets, 1);
});

test('falha uma vez e recupera sozinho na segunda tentativa, com o contêiner limpo antes de cada uma', async () => {
  let calls = 0, resets = 0;
  const loader = createWorldLoader({
    importScene: async () => ({}),
    mount: () => { if (++calls === 1) throw new Error('WebGL indisponível'); return 'ok'; },
    reset: () => resets++, sleep: noWait, log: quiet,
  });
  assert.equal(await loader.run(), 'ok');
  assert.equal(loader.attempts, 2);
  assert.equal(resets, 2, 'limpa antes de cada tentativa');
});

test('depois de todas as tentativas, entrega a mensagem real do último erro', async () => {
  let failure = null, attempts = 0;
  const loader = createWorldLoader({
    importScene: async () => ({}),
    mount: () => { attempts++; throw new Error(`shader falhou (tentativa ${attempts})`); },
    onFail: error => { failure = error; }, sleep: noWait, log: quiet,
  });
  assert.equal(await loader.run(), null);
  assert.equal(loader.attempts, 3, 'uma tentativa + duas retentativas');
  assert.equal(failure.message, 'shader falhou (tentativa 3)', 'a mensagem é a do último erro, não genérica');
});

test('falha ao importar o módulo também conta como tentativa e vira erro com mensagem', async () => {
  let failure = null;
  const loader = createWorldLoader({
    importScene: async () => { throw new TypeError('Failed to fetch dynamically imported module: scene.js'); },
    mount: () => 'nunca', onFail: error => { failure = error; }, sleep: noWait, log: quiet,
  });
  await loader.run();
  assert.match(failure.message, /Failed to fetch dynamically imported module/);
});

test('o botão "Tentar de novo" (run de novo) recupera depois de a causa sumir', async () => {
  let broken = true, ready = 0;
  const loader = createWorldLoader({
    importScene: async () => ({}),
    mount: () => { if (broken) throw new Error('falha temporária'); return 'mundo'; },
    onReady: () => ready++, onFail: () => {}, sleep: noWait, log: quiet,
  });
  assert.equal(await loader.run(), null);
  broken = false;
  assert.equal(await loader.run(), 'mundo');
  assert.equal(ready, 1);
});

test('chamada repetida enquanto carrega não monta o mundo duas vezes', async () => {
  let mounts = 0;
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const loader = createWorldLoader({
    importScene: async () => ({}),
    mount: async () => { mounts++; await gate; return 'mundo'; },
    sleep: noWait, log: quiet,
  });
  const first = loader.run();
  assert.equal(await loader.run(), null, 'segunda chamada é ignorada enquanto a primeira roda');
  release();
  assert.equal(await first, 'mundo');
  assert.equal(mounts, 1);
});

test('o progresso das retentativas é informado em onStatus', async () => {
  const statuses = [];
  let calls = 0;
  const loader = createWorldLoader({
    importScene: async () => ({}),
    mount: () => { if (++calls < 3) throw new Error('x'); return 'ok'; },
    onStatus: text => statuses.push(text), sleep: noWait, log: quiet,
  });
  await loader.run();
  assert.equal(statuses.length, 2);
  assert.match(statuses[0], /tentativa 2 de 3/);
});
