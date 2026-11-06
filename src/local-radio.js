const station = [
  { name: 'Concreto', artist: 'Kong FM · instrumental original', url: '/assets/radio/concreto.mp3' },
  { name: 'Maré de plástico', artist: 'Kong FM · instrumental original', url: '/assets/radio/mare.mp3' },
];

export function createLocalRadio({ input, playButton, previousButton, nextButton, title, album, status }) {
  const playlist = document.createElement('select');
  playlist.setAttribute('aria-label', 'Escolher e tocar faixa');
  document.querySelector('#road-radio').append(playlist);
  const audio = new Audio();
  audio.preload = 'metadata';
  let tracks = station.slice();
  let index = 0;
  function show() {
    const track = tracks[index];
    title.textContent = track.name;
    album.textContent = track.artist;
    playButton.textContent = audio.paused ? '▶' : 'Ⅱ';
    playButton.setAttribute('aria-label', audio.paused ? 'Tocar rádio' : 'Pausar rádio');
    playlist.value = String(index);
  }
  function rebuildList() {
    playlist.replaceChildren(...tracks.map((track, i) => new Option(track.name, String(i))));
  }
  function play() {
    audio.play().catch(error => {
      if (error.name !== 'AbortError') status.textContent = 'Falha na reprodução. Tente outra faixa.';
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
    louder() { audio.volume = Math.min(1, audio.volume + .1); },
    quieter() { audio.volume = Math.max(0, audio.volume - .1); },
  };
  playlist.onchange = () => select(Number(playlist.value), true);
  input.onchange = () => {
    const files = [...input.files].filter(f => f.type.startsWith('audio/') || /\.(mp3|m4a|ogg|wav)$/i.test(f.name));
    if (!files.length) return;
    const old = tracks.slice(station.length);
    tracks = station.concat(files.map(f => ({ name: f.name.replace(/\.[^.]+$/, ''), artist: 'Arquivo local', url: URL.createObjectURL(f) })));
    rebuildList(); select(station.length, true);
    for (const track of old) URL.revokeObjectURL(track.url);
  };
  playButton.onclick = actions.play;
  previousButton.onclick = actions.prev;
  nextButton.onclick = actions.next;
  audio.onplay = audio.onpause = show;
  audio.onended = () => select(index + 1, true);
  audio.onerror = () => { status.textContent = 'Este arquivo não pôde ser reproduzido.'; show(); };
  const volumeControl = document.createElement('label');
  volumeControl.className = 'radio-volume';
  const volume = document.createElement('input');
  volume.type = 'range'; volume.min = '0'; volume.max = '100'; volume.value = '65';
  volumeControl.append('Volume ', volume);
  playlist.after(volumeControl);
  volume.oninput = () => { audio.volume = Number(volume.value) / 100; };
  audio.onvolumechange = () => { volume.value = String(Math.round(audio.volume * 100)); };
  audio.volume = .65;
  rebuildList(); select(0, false);
  return {
    actions, playlist,
    read: () => ({ ...tracks[index], playing: !audio.paused, seconds: Math.floor(audio.currentTime), volume: Math.round(audio.volume * 100) }),
  };
}
