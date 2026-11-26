// Controlador de áudio: Kong FM local, player editorial, ducking por proximidade, motor procedural, buzina e botões de som.
import { createLocalRadio } from './local-radio.js';
import { readSoundOn, saveSoundOn, playDiscovery, hornAllowed, playHorn, createEngineSound } from './discovery-sound.js';
import { duckTarget, easeDuck } from './guided-tour.js';
import { REGIONS, MEMBER_LOCATIONS, distance } from './world-data.js';
import { eras, tracks, listeningUrl } from './content.js';

export function createAudioController({
  storage,
  vehicle,
  isEntered,
  isWorldVisible,
  isModalOpen,
  isGuidedPaused,
  isBlockedForHorn,
  stop,
  setTour,
  clearDestination,
}) {
  let discoverySoundOn = readSoundOn(storage);
  let audioCtx = null;
  let lastHorn = -Infinity;
  let engine = null;
  let engineOn = true;
  let masterMuted = false;
  let duckLevel = 1;
  let trackIndex = 0;
  let manualTrack = false;

  try { engineOn = storage?.getItem('gorilazz.engine.v1') !== 'off'; } catch { /* valor padrão */ }

  const localRadio = createLocalRadio({
    input: document.querySelector('#radio-files'),
    playButton: document.querySelector('#road-radio-play'),
    previousButton: document.querySelector('#road-radio-prev'),
    nextButton: document.querySelector('#road-radio-next'),
    title: document.querySelector('#road-radio-track'),
    album: document.querySelector('#road-radio-album'),
    status: document.querySelector('#road-radio-status'),
  });

  function startEngineAfterGesture(event) {
    if (!event.isTrusted || !isEntered() || engine) return;
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      if (!masterMuted) audioCtx.resume();
      engine = createEngineSound(audioCtx, { plazas: REGIONS, stages: MEMBER_LOCATIONS });
    } catch { /* navegador sem Web Audio */ }
  }
  document.addEventListener('click', startEngineAfterGesture);
  document.addEventListener('keydown', startEngineAfterGesture);
  document.addEventListener('visibilitychange', () => { if (document.hidden) engine?.update(0, false); });

  function playDiscoverySound() {
    if (!discoverySoundOn || masterMuted) return;
    try {
      audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
      audioCtx.resume?.();
      playDiscovery(audioCtx, { radioPlaying: Boolean(localRadio?.isPlaying?.()) });
    } catch { /* sem WebAudio: segue sem som */ }
  }

  function tryHorn() {
    const now = performance.now();
    if (hornAllowed({
      entered: isEntered(),
      visible: isWorldVisible() && document.documentElement.classList.contains('mode-3d'),
      blocked: isModalOpen() || isBlockedForHorn(),
      soundOn: discoverySoundOn,
      now,
      lastPlayed: lastHorn,
    })) {
      try {
        audioCtx ??= new (window.AudioContext || window.webkitAudioContext)();
        audioCtx.resume?.();
        playHorn(audioCtx, { radioPlaying: Boolean(localRadio?.isPlaying?.()) });
        lastHorn = now;
      } catch { /* sem WebAudio */ }
    }
  }

  function updateFrame(delta, paused) {
    const entered = isEntered();
    engine?.update(
      vehicle.speed,
      engineOn && entered && !paused && document.documentElement.classList.contains('mode-3d') && !isGuidedPaused(),
      { x: vehicle.x, z: vehicle.z, radioPlaying: Boolean(localRadio?.isPlaying?.()) },
    );
    // Ducking do Kong FM perto dos palcos: suave por quadro, restaura ao sair (guided-tour.js: duckTarget/easeDuck).
    if (localRadio && entered && !paused) {
      const near = Math.min(...MEMBER_LOCATIONS.map(m => distance(vehicle, m)));
      duckLevel = easeDuck(duckLevel, duckTarget(near), delta);
      localRadio.setDuck?.(masterMuted ? 0 : duckLevel);
    }
  }

  // Player editorial (#radio) e fila de faixas.
  const trackQueue = document.querySelector('#track-queue');
  if (trackQueue) {
    tracks.forEach((track, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.innerHTML = `<span>${String(i + 1).padStart(2, '0')}</span>${track.name}`;
      btn.addEventListener('click', () => { manualTrack = true; setTrack(i); });
      trackQueue.append(btn);
    });
  }

  function setTrack(index) {
    trackIndex = (index + tracks.length) % tracks.length;
    const track = tracks[trackIndex];
    document.querySelector('#radio-title').textContent = track.name;
    document.querySelector('#track-album').textContent = `${track.album} · ${track.year}`;
    document.querySelector('#track-description').textContent = track.text;
    document.querySelector('#track-number').textContent = `${String(trackIndex + 1).padStart(2, '0')} — ${String(tracks.length).padStart(2, '0')}`;
    document.querySelector('#listen-link').href = listeningUrl(track);
    document.querySelector('#listen-link').textContent = track.video ? 'ABRIR NO YOUTUBE ↗' : 'BUSCAR NO YOUTUBE ↗';
    document.querySelector('#track-era').textContent = `NA VIAGEM / ${eras[track.era].album.toUpperCase()}`;
    document.querySelector('#track-status').textContent = track.video ? 'Clipe do YouTube nesta página. Precisa de internet e reprodução manual.' : 'Abre uma busca no YouTube em nova aba. Esta faixa não tem player incorporado.';
    const radioSection = document.querySelector('#radio');
    radioSection.style.setProperty('--record-color', track.color);
    radioSection.classList.remove('video-open');
    document.querySelector('#video-slot').replaceChildren();
    document.querySelector('#play-track').textContent = track.video ? '▶ VER CLIPE DO YOUTUBE' : 'BUSCAR NO YOUTUBE ↗';
    if (trackQueue) [...trackQueue.children].forEach((btn, i) => btn.setAttribute('aria-current', String(i === trackIndex)));
  }

  document.querySelector('#previous-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex - 1); });
  document.querySelector('#next-track').addEventListener('click', () => { manualTrack = true; setTrack(trackIndex + 1); });
  document.querySelector('#play-track').addEventListener('click', () => {
    const slot = document.querySelector('#video-slot');
    const radioSection = document.querySelector('#radio');
    if (!tracks[trackIndex].video) { window.open(listeningUrl(tracks[trackIndex]), '_blank', 'noopener,noreferrer'); return; }
    if (slot.firstChild) { slot.replaceChildren(); radioSection.classList.remove('video-open'); document.querySelector('#play-track').textContent = '▶ VER CLIPE DO YOUTUBE'; return; }
    setTour(false); stop(); clearDestination();
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${tracks[trackIndex].video}`;
    iframe.title = `Clipe de ${tracks[trackIndex].name} — Gorillaz`;
    iframe.allow = 'encrypted-media; picture-in-picture; fullscreen';
    iframe.allowFullscreen = true; iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    const fallback = document.createElement('div');
    fallback.className = 'embed-fallback';
    fallback.innerHTML = `<span>Se o vídeo não carregar na sua rede, assista diretamente no YouTube:</span><a href="${listeningUrl(tracks[trackIndex])}" target="_blank" rel="noopener noreferrer">Abrir ${tracks[trackIndex].name} no YouTube ↗</a>`;
    slot.append(iframe, fallback); radioSection.classList.add('video-open'); document.querySelector('#play-track').textContent = '× FECHAR CLIPE';
  });

  // Botões de som dentro do menu do rádio (#hud-radio-menu) e do painel de controles.
  const radioMenu = document.createElement('div');
  radioMenu.id = 'hud-radio-menu';
  document.querySelector('.radio-import').addEventListener('click', () => document.querySelector('#radio-files').click());
  document.querySelector('#road-radio').append(radioMenu);

  const engineButton = document.createElement('button'); engineButton.type = 'button';
  function paintEngineButton() { engineButton.textContent = `Motor: ${engineOn ? 'ligado' : 'silenciado'}`; engineButton.setAttribute('aria-pressed', String(engineOn)); }
  engineButton.addEventListener('click', () => { engineOn = !engineOn; try { storage?.setItem('gorilazz.engine.v1', engineOn ? 'on' : 'off'); } catch { /* sem armazenamento */ } paintEngineButton(); });
  paintEngineButton(); radioMenu.append(engineButton);

  // Som geral: suspende o AudioContext (motor, palcos, pombos e descobertas) e silencia o Kong FM junto.
  const muteButton = document.createElement('button'); muteButton.type = 'button'; muteButton.id = 'master-mute';
  function paintMuteButton() { muteButton.textContent = `Som: ${masterMuted ? 'mudo' : 'ligado'}`; muteButton.setAttribute('aria-pressed', String(masterMuted)); }
  muteButton.addEventListener('click', () => {
    masterMuted = !masterMuted;
    if (audioCtx) { try { if (masterMuted) audioCtx.suspend(); else audioCtx.resume(); } catch { /* sem WebAudio */ } }
    localRadio?.setDuck?.(masterMuted ? 0 : duckLevel);
    paintMuteButton();
  });
  paintMuteButton(); radioMenu.append(muteButton);

  for (const selector of ['#kong-fm-help', '.radio-import', '#road-radio-listen', '#road-radio select', '.radio-volume']) {
    radioMenu.append(document.querySelector(selector));
  }

  const soundButton = document.createElement('button'); soundButton.type = 'button'; soundButton.id = 'discovery-sound-toggle';
  const paintSoundButton = () => { soundButton.textContent = `Som de descoberta: ${discoverySoundOn ? 'ligado' : 'desligado'}`; soundButton.setAttribute('aria-pressed', String(discoverySoundOn)); };
  soundButton.addEventListener('click', () => { discoverySoundOn = !discoverySoundOn; saveSoundOn(storage, discoverySoundOn); paintSoundButton(); });
  paintSoundButton();

  function debugState() {
    return {
      context: audioCtx?.state ?? null,
      engine: Boolean(engine),
      engineGain: engine ? Number(engine.gainValue().toFixed(4)) : null,
      engineOn,
      masterMuted,
    };
  }

  return {
    localRadio,
    radioMenu,
    soundButton,
    get trackIndex() { return trackIndex; },
    get manualTrack() { return manualTrack; },
    setManualTrack(value) { manualTrack = Boolean(value); },
    setTrack,
    playDiscoverySound,
    tryHorn,
    updateFrame,
    debugState,
  };
}
