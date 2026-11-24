// Tela do minigame rítmico de piano (2-D): diálogo acessível, canvas com notas caindo, teclado e toque.
// MP3 local sincronizado ao relógio de mídia; sintetizador em caso de falha.
import { PIANO_SONGS, PIANO_CREDIT, LANES, BEATS_PER_RUN, buildChart, createRun, feedbackFor, MESSAGES, SHAKE_MS } from './piano-game.js';

const KEYS = { d: 0, f: 1, j: 2, k: 3 };
const FREQ = [262, 330, 392, 523]; // notas de um acorde maior (C E G C): timbre próprio, não é melodia de faixa
const FALL_PX_PER_MS = .42;      // velocidade de queda
const HIT_Y = 400;               // linha de toque no canvas (480 px de altura)
const LEAD_S = .25;              // folga antes da primeira nota (s)

export function createPianoScreen({ dialog, onClose, onStart, onEnd }) {
  const canvas = dialog.querySelector('#piano-canvas');
  const ctx2d = canvas.getContext('2d');
  const scoreEl = dialog.querySelector('#piano-score');
  const comboEl = dialog.querySelector('#piano-combo');
  const messageEl = dialog.querySelector('#piano-message');
  const creditEl = dialog.querySelector('#piano-credit');
  const songsEl = dialog.querySelector('#piano-songs');
  const startButton = dialog.querySelector('#piano-start');
  let song = PIANO_SONGS[0], run = null, chart = null, raf = 0, audio = null, audioStart = 0, startPerf = 0, nodes = [];
  const recording = new Audio(); recording.preload = 'none';
  let useRecording = false, pending = false, session = 0, fallbackTimer = 0;
  let flashes = []; // colunas acesas: { lane, color, until } em performance.now()

  creditEl.textContent = PIANO_CREDIT;
  for (const item of PIANO_SONGS) {
    const button = document.createElement('button');
    button.type = 'button'; button.dataset.song = item.id; button.textContent = `${item.title} · ${item.bpm} BPM`;
    button.setAttribute('aria-pressed', String(item === song));
    button.addEventListener('click', () => { if (!pending && (!run || run.finished(now()))) selectSong(item); });
    songsEl.append(button);
  }
  function selectSong(next) {
    song = next;
    for (const button of songsEl.children) button.setAttribute('aria-pressed', String(button.dataset.song === song.id));
    draw(0); message(`${song.title}: ${song.bpm} BPM (referência). Enter ou Começar.`);
  }

  // O aviso fica no topo do palco: se o diálogo estiver rolado para os botões, leva o palco para a área visível.
  function message(text) {
    messageEl.textContent = text; messageEl.hidden = !text;
    if (text) messageEl.scrollIntoView?.({ block: 'nearest' });
  }
  function ensureAudio() {
    if (!audio) { const AC = window.AudioContext || window.webkitAudioContext; audio = AC ? new AC() : null; }
    audio?.resume?.();
    return audio;
  }
  // Tempo da partida em ms pelo relógio do navegador: é ele que julga os toques. Os sons são agendados no
  // relógio de áudio com a mesma folga (LEAD_S), então a diferença é a latência de saída (dezenas de ms, dentro das janelas).
  function now() { return run ? (useRecording ? recording.currentTime * 1000 : performance.now() - startPerf) : 0; }
  // Sons: uma nota curta por coluna (timbre de piano simples) e a batida do compasso (bumbo e chimbal).
  function schedule(chartData, t0) {
    const at = time => t0 + time / 1000;
    for (const note of chartData.notes) {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = 'triangle'; osc.frequency.value = FREQ[note.lane];
      gain.gain.setValueAtTime(0, at(note.time)); gain.gain.linearRampToValueAtTime(.18, at(note.time) + .01);
      gain.gain.exponentialRampToValueAtTime(.001, at(note.time) + .6);
      osc.connect(gain); gain.connect(audio.destination); osc.start(at(note.time)); osc.stop(at(note.time) + .65); nodes.push(osc);
    }
    for (let beat = 0; beat < BEATS_PER_RUN + 2; beat++) {
      const time = beat * chartData.stepMs, strong = beat % 4 === 0;
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = strong ? 'sine' : 'square';
      osc.frequency.setValueAtTime(strong ? 110 : 1800, at(time));
      if (strong) osc.frequency.exponentialRampToValueAtTime(45, at(time) + .15);
      gain.gain.setValueAtTime(strong ? .35 : .04, at(time)); gain.gain.exponentialRampToValueAtTime(.001, at(time) + (strong ? .2 : .03));
      osc.connect(gain); gain.connect(audio.destination); osc.start(at(time)); osc.stop(at(time) + .25); nodes.push(osc);
    }
  }
  function stopAudio() {
    for (const node of nodes) { try { node.stop(); } catch { /* já parou */ } }
    nodes = [];
  }
  // Erro: dois tons a um semitom de distância (dissonância curta), tocados já, sem esperar a partitura.
  function playError() {
    if (!audio) return;
    const t0 = audio.currentTime;
    for (const [type, freq] of [['sawtooth', 146], ['square', 155]]) {
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.type = type; osc.frequency.value = freq;
      gain.gain.setValueAtTime(.12, t0); gain.gain.exponentialRampToValueAtTime(.001, t0 + .25);
      osc.connect(gain); gain.connect(audio.destination); osc.start(t0); osc.stop(t0 + .26); nodes.push(osc);
    }
  }
  // Pega os resultados novos da partida e acende a coluna, treme a tela no erro e mostra a mensagem.
  function processEvents() {
    if (!run) return;
    for (const event of run.drainEvents()) {
      const fx = feedbackFor(event.result);
      flashes.push({ lane: event.lane, color: fx.color, until: performance.now() + fx.ms });
      message(MESSAGES[event.result]);
      if (fx.shake) { shake(); playError(); }
    }
  }
  function shake() {
    canvas.classList.remove('shake'); void canvas.offsetWidth; canvas.classList.add('shake');
    setTimeout(() => canvas.classList.remove('shake'), SHAKE_MS);
  }

  function draw(time) {
    const w = canvas.width, h = canvas.height, laneW = w / LANES.length;
    const nowPerf = performance.now();
    flashes = flashes.filter(flash => flash.until > nowPerf);
    ctx2d.fillStyle = '#070d0f'; ctx2d.fillRect(0, 0, w, h);
    for (let i = 0; i < LANES.length; i++) {
      ctx2d.fillStyle = i % 2 ? '#132026' : '#101b1f'; ctx2d.fillRect(i * laneW, 0, laneW, h);
    }
    for (const flash of flashes) {
      const remaining = (flash.until - nowPerf) / 300;
      ctx2d.globalAlpha = Math.min(1, .35 + .65 * remaining);
      ctx2d.fillStyle = flash.color; ctx2d.fillRect(flash.lane * laneW, 0, laneW, h);
      ctx2d.globalAlpha = 1;
    }
    // Divisórias nítidas entre as pistas e o rótulo de cada coluna.
    ctx2d.fillStyle = '#3c5a62';
    for (let i = 1; i < LANES.length; i++) ctx2d.fillRect(Math.round(i * laneW) - 1, 0, 2, h);
    ctx2d.fillStyle = '#c4dc9d'; ctx2d.font = 'bold 22px monospace'; ctx2d.textAlign = 'center';
    for (let i = 0; i < LANES.length; i++) ctx2d.fillText(LANES[i], i * laneW + laneW / 2, h - 10);
    ctx2d.fillStyle = '#ffcc4d'; ctx2d.fillRect(0, HIT_Y, w, 3);
    const source = run ? run.chart : chart;
    if (source) for (const note of source.notes) {
      const judged = run?.pending[note.id]?.judged;
      if (judged) continue;
      const y = HIT_Y - (note.time - time) * FALL_PX_PER_MS;
      if (y < -20 || y > h + 20) continue;
      ctx2d.fillStyle = '#f5a9c6'; ctx2d.beginPath(); ctx2d.roundRect(note.lane * laneW + 10, y - 9, laneW - 20, 18, 9); ctx2d.fill();
    }
    scoreEl.textContent = String(run?.score ?? 0).padStart(5, '0');
    comboEl.textContent = String(run?.combo ?? 0);
  }

  function frame() {
    raf = requestAnimationFrame(frame);
    const time = now();
    const done = run && run.tick(time);
    processEvents();
    if (done) return finish();
    draw(time);
  }
  function begin() {
    if (pending || run && !run.finished(now())) return;
    stopAudio(); flashes = []; onStart?.();
    chart = buildChart(song.bpm); run = null; pending = true; useRecording = false;
    const token = ++session;
    const a = ensureAudio();
    message('Carregando áudio…');
    function launch(withRecording) {
      if (token !== session || !pending) return;
      clearTimeout(fallbackTimer); pending = false; useRecording = withRecording;
      if (!withRecording) { recording.pause(); recording.removeAttribute('src'); recording.load(); }
      run = createRun(chart); startPerf = performance.now();
      if (!withRecording && a) { audioStart = a.currentTime + LEAD_S; schedule(chart, audioStart); startPerf += LEAD_S * 1000; }
      message(''); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
    }
    recording.onplaying = () => launch(true);
    recording.onerror = () => launch(false);
    recording.src = song.url;
    fallbackTimer = setTimeout(() => launch(false), 2500);
    recording.play().catch(() => launch(false));
  }
  function finish() {
    cancelAnimationFrame(raf); raf = 0; stopAudio(); recording.pause(); useRecording = false; draw(chart.durationMs);
    // As colunas acesas no último toque continuam por alguns frames depois do fim.
    setTimeout(() => { if (!raf && run) draw(chart.durationMs); }, 320);
    const c = run.counts;
    message(`Fim · ${run.score} pontos · Perfeito ${c.perfect} · Bom ${c.good} · Perdidas ${c.miss} · Erros ${c.wrong} · Combo máx. ${run.maxCombo}. Enter para jogar de novo ou Sair.`);
  }
  // Toque numa coluna: acerto, erro (tecla sem nota na janela) ou nada se a partida não está rodando.
  function hit(lane) {
    if (!run || run.finished(now())) return;
    run.hit(lane, now());
    processEvents();
  }
  function stop() { session++; pending = false; clearTimeout(fallbackTimer); recording.pause(); recording.removeAttribute('src'); recording.load(); useRecording = false; cancelAnimationFrame(raf); raf = 0; stopAudio(); }

  function open() {
    stop(); run = null; chart = null; message('');
    draw(0); selectSong(song);
    dialog.showModal();
    startButton.focus();
  }
  dialog.addEventListener('close', () => { stop(); onEnd?.(); onClose?.(); });
  startButton.addEventListener('click', begin);
  dialog.querySelector('#piano-exit').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', event => {
    // Esc não chega aqui: a pilha (src/escape-stack.js) fecha o minigame pela janela.
    const key = event.key.toLowerCase();
    if (key in KEYS) { event.preventDefault(); if (!event.repeat) hit(KEYS[key]); return; }
    if (key === 'enter' && (!run || run.finished(now()))) { event.preventDefault(); begin(); }
  });
  for (const button of dialog.querySelectorAll('[data-lane]')) {
    button.addEventListener('pointerdown', event => { event.preventDefault(); hit(Number(button.dataset.lane)); });
  }
  draw(0);
  return { open, get run() { return run; }, get song() { return song; } };
}
