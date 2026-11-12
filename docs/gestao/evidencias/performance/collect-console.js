// Abra localhost:3000/?perf, aguarde os modelos e use o console do navegador.
// Conta renders publicados pelo app, e não callbacks de requestAnimationFrame.
// Execute uma amostra por vez, mantendo a aba visível e sem mudar a câmera.
window.collectPerformance = function (label, seconds = 10) {
  const { renderer } = window.__gorilazz.world.debug;
  const canvas = renderer.domElement;
  const frames = [], samples = [], started = performance.now();
  const observer = new MutationObserver(() => {
    frames.push(performance.now());
    samples.push({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries,
      heap: performance.memory?.usedJSHeapSize, ratio: renderer.getPixelRatio() });
  });
  observer.observe(canvas, { attributes: true, attributeFilter: ['data-triangles'] });
  return new Promise(resolve => setTimeout(() => {
    observer.disconnect();
    const intervals = frames.slice(1).map((value, i) => value - frames[i]);
    const sorted = intervals.slice().sort((a, b) => a - b);
    const result = { label, seconds: (performance.now() - started) / 1000,
      fps: (frames.length - 1) * 1000 / (frames.at(-1) - frames[0]),
      p50: sorted[Math.floor(sorted.length * .5)], p95: sorted[Math.floor(sorted.length * .95)],
      frames, intervals, samples, visibility: document.visibilityState,
      focused: document.hasFocus(), quality: canvas.dataset.quality,
      canvas: [canvas.width, canvas.height] };
    console.log(result); resolve(result);
  }, seconds * 1000));
};
