// Minigame rítmico de piano do 2-D: lógica pura (sem DOM nem áudio), testada em Node.
// BPMs de referência confirmados pela Pesquisa Gorilazz (docs/gestao/minigame-piano-bpm.md, compasso 4/4).
// O áudio é sintetizado (Web Audio) no BPM indicado: não há trecho nem melodia das faixas.
export const PIANO_SONGS = [
  { id: 'tomorrow', title: 'Tomorrow Comes Today', bpm: 93 },
  { id: 'clint', title: 'Clint Eastwood', bpm: 84 },
  { id: 'omh', title: 'On Melancholy Hill', bpm: 120 },
];
export const PIANO_CREDIT = 'Áudio sintetizado próprio · BPMs de referência · uso acadêmico';
export const LANES = ['D', 'F', 'J', 'K'];
export const JUDGE_MS = { perfect: 50, good: 120 }; // janelas de acerto (ms, a partir do instante da nota)
export const POINTS = { perfect: 300, good: 100 };
export const BEATS_PER_RUN = 48; // 12 compassos de 4/4

export function beatMs(bpm) { return 60000 / bpm; }

// Lista de notas: a cada tempo do compasso uma nota (ou nenhuma), em colunas escolhidas por semente fixa.
export function buildChart(bpm, { beats = BEATS_PER_RUN, seed = 7, lead = 2 } = {}) {
  let s = seed >>> 0;
  const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const step = beatMs(bpm), notes = [];
  let lastLane = -1;
  for (let beat = 0; beat < beats; beat++) {
    const onBeat = beat % 4 === 0;
    if (!onBeat && rnd() < .35) continue; // off-beats às vezes ficam vazios
    let lane = Math.floor(rnd() * LANES.length);
    if (lane === lastLane) lane = (lane + 1) % LANES.length;
    notes.push({ time: (lead + beat) * step, lane, id: notes.length });
    lastLane = lane;
  }
  return { bpm, stepMs: step, notes, durationMs: (lead + beats) * step };
}

// Classificação de um toque em relação ao instante da nota.
export function judge(noteTime, hitTime) {
  const d = Math.abs(hitTime - noteTime);
  if (d <= JUDGE_MS.perfect) return 'perfect';
  if (d <= JUDGE_MS.good) return 'good';
  return null;
}

// Estado de uma partida: toques, erros (tecla sem nota na janela, "wrong"), notas que passaram (miss), combo, pontuação.
// Cada resultado vira um evento { result, lane } em state.events; a tela lê com drainEvents() para pintar a coluna.
export function createRun(chart) {
  const pending = chart.notes.map(note => ({ ...note, judged: null }));
  const state = { pending, score: 0, combo: 0, maxCombo: 0, counts: { perfect: 0, good: 0, miss: 0, wrong: 0 }, chart, events: [] };
  // Toque numa coluna: escolhe a nota pendente mais próxima dentro da janela "good". Sem nota ali, é erro.
  state.hit = (lane, now) => {
    let best = null;
    for (const note of pending) {
      if (note.judged || note.lane !== lane) continue;
      const d = Math.abs(now - note.time);
      if (d <= JUDGE_MS.good && (!best || d < Math.abs(now - best.time))) best = note;
    }
    if (!best) { register('wrong', lane); return 'wrong'; }
    const result = judge(best.time, now);
    best.judged = result;
    register(result, lane);
    return result;
  };
  // Notas cujo tempo de janela já passou viram miss (quem não toca perde o combo).
  state.tick = now => {
    for (const note of pending) {
      if (!note.judged && now > note.time + JUDGE_MS.good) { note.judged = 'miss'; register('miss', note.lane); }
    }
    return state.finished(now);
  };
  state.finished = now => pending.every(note => note.judged) || now > chart.durationMs + JUDGE_MS.good;
  state.drainEvents = () => state.events.splice(0);
  function register(result, lane) {
    state.counts[result]++;
    state.events.push({ result, lane });
    if (result === 'miss' || result === 'wrong') { state.combo = 0; return; }
    state.combo++;
    state.maxCombo = Math.max(state.maxCombo, state.combo);
    state.score += POINTS[result] + Math.min(state.combo, 50);
  }
  return state;
}

// Feedback visual: erro (tecla errada ou nota perdida) pinta a coluna inteira de vermelho e treme a tela;
// acerto acende a coluna em verde/ciano. Durações em ms.
export const ERROR_COLOR = '#FF2A2A';
export const HIT_COLOR = '#3CFFC4';
export const FLASH_MS = { error: 300, hit: 180 };
export const SHAKE_MS = 150;
export const MESSAGES = { perfect: 'PERFEITO', good: 'BOM', miss: 'ERRO: nota perdida', wrong: 'ERRO: tecla errada' };
export function feedbackFor(result) {
  if (result === 'perfect' || result === 'good') return { color: HIT_COLOR, ms: FLASH_MS.hit, shake: false };
  return { color: ERROR_COLOR, ms: FLASH_MS.error, shake: true };
}
