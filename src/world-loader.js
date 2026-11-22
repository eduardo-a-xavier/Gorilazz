// Carregamento do mundo 3D com diagnóstico. Lógica pura (sem DOM): app.js mostra o aviso e o botão.
// Tenta de novo sozinho (com atraso curto) antes de desistir, e entrega a mensagem real do último erro.
export function createWorldLoader({
  importScene,            // () => Promise<módulo com createWorld>
  mount,                  // (módulo) => mundo (pode ser assíncrono); roda com o contêiner já limpo
  reset = () => {},       // limpa o contêiner antes de cada tentativa (createWorld já pode ter criado um canvas)
  onStatus = () => {},    // texto de progresso ("Recarregando o 3D…")
  onReady = () => {},     // (mundo) quando deu certo
  onFail = () => {},      // (erro) depois da última tentativa
  delays = [600, 1500],   // esperas antes das tentativas extras: 2 retentativas automáticas
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)),
  log = console,
} = {}) {
  let attempt = 0, busy = false, lastError = null;

  async function run() {
    if (busy) return null;
    busy = true;
    try {
      for (let i = 0; i <= delays.length; i++) {
        attempt = i + 1;
        if (i > 0) {
          onStatus(`Recarregando o 3D (tentativa ${i + 1} de ${delays.length + 1})…`);
          await sleep(delays[i - 1]);
        }
        try {
          reset();
          const scene = await importScene();
          const world = await mount(scene);
          onReady(world);
          return world;
        } catch (error) {
          lastError = error;
          log.error?.(`[3D] tentativa ${attempt} falhou: ${error?.message ?? error}`, error?.stack ?? '');
        }
      }
      onFail(lastError);
      return null;
    } finally {
      busy = false;
    }
  }

  return { run, get attempts() { return attempt; }, get lastError() { return lastError; } };
}
