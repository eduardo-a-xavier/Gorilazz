export function createLocalRadio({ input, playButton, previousButton, nextButton, title, album, status }) {
  const audio = new Audio();
  audio.preload = 'metadata';
  let files = [];
  let index = 0;
  let playing = false;

  function show() {
    if (!files.length) return;
    title.textContent = files[index].name.replace(/\.[^.]+$/, '');
    album.textContent = `${index + 1} / ${files.length} · Arquivo local`;
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pausar rádio' : 'Tocar rádio');
    status.textContent = playing ? 'Tocando arquivo local.' : 'Arquivo local pronto para tocar.';
  }
  async function play() {
    try {
      await audio.play();
      playing = true;
      show();
    } catch {
      playing = false;
      show();
      status.textContent = 'O áudio não pôde tocar. Escolha outro arquivo e pressione ▶.';
    }
  }
  function select(next) {
    if (!files.length) return false;
    index = (next + files.length) % files.length;
    audio.src = files[index].url;
    audio.load();
    show();
    if (playing) play();
    return true;
  }
  input.addEventListener('change', () => {
    audio.pause();
    for (const file of files) URL.revokeObjectURL(file.url);
    files = [...input.files].filter(file => file.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(file.name))
      .map(file => ({ name: file.name, url: URL.createObjectURL(file) }));
    index = 0;
    playing = false;
    if (files.length) { select(0); play(); }
    else status.textContent = 'Escolha arquivos de áudio para tocar na estrada.';
  });
  playButton.addEventListener('click', () => {
    if (!files.length) { input.click(); return; }
    if (playing) { audio.pause(); playing = false; show(); }
    else play();
  });
  previousButton.addEventListener('click', () => select(index - 1));
  nextButton.addEventListener('click', () => select(index + 1));
  audio.addEventListener('ended', () => { playing = true; select(index + 1); });
  audio.addEventListener('error', () => { playing = false; status.textContent = 'Este arquivo não pôde ser reproduzido.'; playButton.textContent = '▶'; });
  window.addEventListener('pagehide', () => { audio.pause(); for (const file of files) URL.revokeObjectURL(file.url); });
  return { hasFiles: () => files.length > 0, next: () => select(index + 1), previous: () => select(index - 1) };
}
