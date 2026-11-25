export const station = [
  { name: 'Clint Eastwood', artist: 'Gorillaz · Gorillaz (2001)', url: './assets/audio/clint-eastwood.mp3' },
  { name: 'Feel Good Inc.', artist: 'Gorillaz · Demon Days (2005)', url: './assets/audio/feel-good-inc.mp3' },
  { name: 'On Melancholy Hill', artist: 'Gorillaz · Plastic Beach (2010)', url: './assets/audio/on-melancholy-hill.mp3' },
  { name: 'Concreto', artist: 'Kong FM · instrumental original', url: './assets/radio/concreto.mp3' },
  { name: 'Maré de plástico', artist: 'Kong FM · instrumental original', url: './assets/radio/mare.mp3' },
];

export function createLocalRadio({ input, playButton, previousButton, nextButton, title, album, status }) {
  let base = .65, duck = 1; // volume escolhido pelo usuário e fator de ducking (passeio)
  const apply = () => { audio.volume = base * duck; };
  const playlist = document.createElement('select');
  playlist.setAttribute('aria-label', 'Escolher e tocar áudio na Kong FM');
  document.querySelector('#road-radio').append(playlist);
  const audio = new Audio();
  audio.preload = 'none';
  let tracks = station.slice();
  let index = 0;
  // Erro de carregamento: tenta de novo uma vez (rede/cache instável) e depois mostra o motivo real.
  let retried = false;
  const failedTracks = new Set();   // faixas que falharam mesmo após a tentativa extra
  let fallbackCtx = null, fallbackTimer = 0;
  const REASONS = { 1: 'reprodução interrompida', 2: 'falha de rede', 3: 'arquivo corrompido ou não decodificado', 4: 'formato ou caminho não suportado' };
  function show() {
    const track = tracks[index];
    title.textContent = track.name;
    album.textContent = `${String(index + 1).padStart(2, '0')}/${String(tracks.length).padStart(2, '0')} · ${track.artist}`;
    playButton.textContent = audio.paused ? '▶' : 'Ⅱ';
    const label = audio.paused ? 'Tocar Kong FM aqui' : 'Pausar Kong FM';
    playButton.setAttribute('aria-label', label); playButton.title = label;
    playlist.value = String(index);
  }
  function rebuildList() {
    playlist.replaceChildren(...tracks.map((track, i) => new Option(track.name, String(i))));
  }
  // Sintetizador de reserva (Web Audio): só toca quando todas as faixas falharam. Notas curtas em loop.
  function fallbackTone(on) {
    if (!on) { clearInterval(fallbackTimer); fallbackTimer = 0; fallbackCtx?.suspend?.(); return; }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) { status.textContent = 'Este navegador não tem áudio de reserva. Tente outro navegador.'; return; }
    fallbackCtx ??= new AudioCtx();
    fallbackCtx.resume?.();
    const notes = [220, 277, 330, 277]; let step = 0;
    fallbackTimer = setInterval(() => {
      const osc = fallbackCtx.createOscillator(), gain = fallbackCtx.createGain();
      osc.frequency.value = notes[step++ % notes.length]; gain.gain.value = .06;
      osc.connect(gain); gain.connect(fallbackCtx.destination);
      osc.start(); osc.stop(fallbackCtx.currentTime + .35);
    }, 420);
  }
  function play() {
    if (fallbackTimer) { fallbackTone(false); show(); return; }
    if (failedTracks.size >= tracks.length) { failedTracks.clear(); }
    audio.play().catch(error => {
      if (error.name !== 'AbortError') status.textContent = 'Falha na reprodução. Toque de novo para tentar outra vez.';
    });
  }
  function select(next, autoplay = !audio.paused) {
    index = (next + tracks.length) % tracks.length;
    audio.src = tracks[index].url;
    show();
    if (autoplay) play();
  }
  const actions = {
    play() { if (audio.paused) play(); else audio.pause(); },
    next() { select(index + 1); }, prev() { select(index - 1); },
    louder() { base = Math.min(1, base + .1); apply(); },
    quieter() { base = Math.max(0, base - .1); apply(); },
  };
  playlist.onchange = () => select(Number(playlist.value), true);
  input.onchange = () => {
    const files = [...input.files].filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(f.name));
    if (!files.length) return;
    const old = tracks.slice(station.length);
    tracks = station.concat(files.map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), artist: 'Arquivo local', url: URL.createObjectURL(f) })));
    rebuildList(); select(station.length, true);
    for (const track of old) URL.revokeObjectURL(track.url);
    failedTracks.clear();
  };
  playButton.onclick = actions.play;
  previousButton.onclick = actions.prev;
  nextButton.onclick = actions.next;
  audio.onplay = audio.onpause = show;
  audio.onended = () => select(index + 1, true);
  audio.oncanplay = () => { retried = false; failedTracks.delete(index); };
  audio.onerror = () => {
    const code = audio.error?.code ?? 0;
    if (!retried) {
      retried = true; status.textContent = 'Carregando a faixa de novo…';
      setTimeout(() => { audio.src = tracks[index].url; audio.load(); }, 700);
    } else {
      failedTracks.add(index);
      const reason = `${REASONS[code] ?? 'motivo desconhecido'}, código ${code}`;
      // Falha tratada com avanço ou áudio de reserva, sem erro no console.
      retried = false;
      if (failedTracks.size < tracks.length) {
        // Pula para a próxima faixa que ainda não falhou, sem travar na mensagem de erro.
        status.textContent = `${tracks[index].name} não tocou (${reason}). Indo para a próxima faixa.`;
        let next = (index + 1) % tracks.length;
        while (failedTracks.has(next)) next = (next + 1) % tracks.length;
        select(next, true);
      } else {
        status.textContent = `Nenhuma faixa pôde tocar (${reason}). Tocando um áudio de reserva; toque ▶ para parar.`;
        fallbackTone(true);
      }
    }
    show();
  };
  const volumeControl = document.createElement('label');
  volumeControl.className = 'radio-volume';
  const volume = document.createElement('input');
  volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.value = '65';
  volumeControl.append('Volume ', volume);
  playlist.after(volumeControl);
  volume.oninput = () => { base = Number(volume.value) / 100; apply(); };
  audio.onvolumechange = () => { volume.value = String(Math.round(base * 100)); };
  base = .65; apply();
  rebuildList(); select(0, false);
  return {
    actions, playlist, select,
    isPlaying: () => !audio.paused, pause: () => { if (!audio.paused) audio.pause(); }, play: () => { if (audio.paused) play(); },
    read: () => ({ ...tracks[index], index, total: tracks.length, playing: !audio.paused, seconds: Math.floor(audio.currentTime), volume: Math.round(base * 100), duck: Math.round(duck * 100), ducked: duck < 1 }),
    // Ducking (passeio nos palcos): reduz o volume do Kong FM por um fator 0..1 sem mudar o volume escolhido pelo usuário.
    setDuck(factor) { duck = Math.max(0, Math.min(1, factor)); apply(); },
  };
}
