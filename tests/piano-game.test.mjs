import test from 'node:test';
import assert from 'node:assert/strict';
import { PIANO_SONGS, PIANO_CREDIT, LANES, JUDGE_MS, POINTS, beatMs, buildChart, judge, createRun } from '../src/piano-game.js';

test('BPMs das faixas são os de referência confirmados (4/4), sem valores em double-time', () => {
  const bpm = Object.fromEntries(PIANO_SONGS.map(song => [song.title, song.bpm]));
  assert.deepEqual(bpm, { 'Tomorrow Comes Today': 93, 'Clint Eastwood': 84, 'On Melancholy Hill': 120 });
  for (const wrong of [186, 168, 160]) assert.ok(!PIANO_SONGS.some(song => song.bpm === wrong), `BPM ${wrong} (double-time) não deve ser usado`);
});

test('o crédito de áudio é o acordado: sintetizado, com referência de BPM e uso acadêmico', () => {
  assert.equal(PIANO_CREDIT, 'Áudio sintetizado próprio · BPMs de referência · uso acadêmico');
});

test('duração de um tempo segue o BPM', () => {
  assert.ok(Math.abs(beatMs(93) - 645.16) < .01);
  assert.ok(Math.abs(beatMs(84) - 714.29) < .01);
  assert.equal(beatMs(120), 500);
});

test('a partitura é determinística, usa só as 4 colunas e não repete a coluna em tempos seguidos', () => {
  const a = buildChart(93), b = buildChart(93);
  assert.deepEqual(a, b);
  assert.ok(a.notes.length > 20, `notas: ${a.notes.length}`);
  for (let i = 0; i < a.notes.length; i++) {
    assert.ok(a.notes[i].lane >= 0 && a.notes[i].lane < LANES.length);
    if (i > 0) assert.notEqual(a.notes[i].lane, a.notes[i - 1].lane, 'mesma coluna em tempos seguidos');
  }
});

test('os tempos das notas seguem o BPM da faixa', () => {
  const chart = buildChart(120, { lead: 0 });
  for (const note of chart.notes) assert.ok(Math.abs(note.time / 500 - Math.round(note.time / 500)) < 1e-9, `nota fora do tempo: ${note.time}`);
});

test('janelas de acerto: Perfect até 50 ms, Good até 120 ms, depois disso nada', () => {
  assert.equal(judge(1000, 1000), 'perfect');
  assert.equal(judge(1000, 1000 + JUDGE_MS.perfect), 'perfect');
  assert.equal(judge(1000, 1000 + JUDGE_MS.perfect + 1), 'good');
  assert.equal(judge(1000, 1000 - JUDGE_MS.good), 'good');
  assert.equal(judge(1000, 1000 + JUDGE_MS.good + 1), null);
});

function miniChart() {
  return { bpm: 120, stepMs: 500, durationMs: 3000, notes: [{ time: 500, lane: 0, id: 0 }, { time: 1000, lane: 2, id: 1 }, { time: 1500, lane: 0, id: 2 }] };
}

test('acertar notas soma pontos com combo; errar zera o combo e conta como miss', () => {
  const run = createRun(miniChart());
  assert.equal(run.hit(0, 500), 'perfect');
  assert.equal(run.hit(2, 1000 + 80), 'good');
  assert.equal(run.counts.perfect, 1); assert.equal(run.counts.good, 1);
  assert.equal(run.combo, 2); assert.equal(run.maxCombo, 2);
  assert.equal(run.score, POINTS.perfect + 1 + POINTS.good + 2);
  run.tick(1500 + 200); // a nota de 1500 passou da janela sem toque
  assert.equal(run.counts.miss, 1);
  assert.equal(run.combo, 0, 'miss zera o combo');
});

test('toque na coluna errada ou fora da janela é erro (wrong), nunca acerto', () => {
  const run = createRun(miniChart());
  assert.equal(run.hit(1, 500), 'wrong', 'coluna errada');
  assert.equal(run.hit(0, 500 + JUDGE_MS.good + 10), 'wrong', 'fora da janela');
  assert.equal(run.counts.perfect + run.counts.good + run.counts.miss, 0);
  assert.equal(run.counts.wrong, 2);
});

test('cada nota é julgada uma única vez e a partida termina quando todas são resolvidas', () => {
  const run = createRun(miniChart());
  assert.equal(run.hit(0, 500), 'perfect');
  assert.equal(run.hit(0, 500), 'wrong', 'a mesma nota não conta duas vezes (o toque extra é erro)');
  assert.equal(run.counts.perfect, 1);
  assert.equal(run.finished(0), false);
  run.hit(2, 1000); run.tick(1500 + 200);
  assert.equal(run.tick(1500 + 200), true, 'todas as notas resolvidas');
});

test('a pontuação do combo tem teto (+50), para não premiar sequências infinitas', () => {
  const chart = { bpm: 120, stepMs: 500, durationMs: 60000, notes: Array.from({ length: 80 }, (_, i) => ({ time: 500 * (i + 1), lane: i % 4, id: i })) };
  const run = createRun(chart);
  for (const note of chart.notes) run.hit(note.lane, note.time);
  assert.equal(run.maxCombo, 80);
  assert.equal(run.score, chart.notes.reduce((sum, _, i) => sum + POINTS.perfect + Math.min(i + 1, 50), 0));
});

import { feedbackFor, ERROR_COLOR, HIT_COLOR, SHAKE_MS, MESSAGES } from '../src/piano-game.js';

test('tecla errada (sem nota na janela) conta como erro: zera o combo, não pontua e gera evento vermelho na coluna', () => {
  const chart = { bpm: 120, stepMs: 500, notes: [{ time: 1000, lane: 2, id: 0 }], durationMs: 3000 };
  const run = createRun(chart);
  run.hit(0, 1000); // acerto: coluna 0 não tem nota, então já é erro
  assert.equal(run.counts.wrong, 1);
  assert.equal(run.combo, 0);
  assert.equal(run.score, 0);
  assert.deepEqual(run.drainEvents(), [{ result: 'wrong', lane: 0 }]);
  assert.deepEqual(run.drainEvents(), [], 'drainEvents esvazia a fila');
});

test('nota que passa da janela sem toque é erro na própria coluna e zera o combo', () => {
  const chart = { bpm: 120, stepMs: 500, notes: [{ time: 1000, lane: 1, id: 0 }, { time: 1500, lane: 3, id: 1 }], durationMs: 3000 };
  const run = createRun(chart);
  run.hit(3, 1500); // combo 1
  assert.equal(run.combo, 1);
  run.tick(1000 + 121 + 1); // a primeira nota passou sem toque
  assert.equal(run.counts.miss, 1);
  assert.equal(run.combo, 0, 'o miss zera o combo');
  const events = run.drainEvents();
  assert.ok(events.some(e => e.result === 'miss' && e.lane === 1), 'miss com a coluna da nota');
});

test('acerto dentro da janela mantém o combo e gera evento de acerto (sem vermelho)', () => {
  const chart = { bpm: 120, stepMs: 500, notes: [{ time: 1000, lane: 2, id: 0 }], durationMs: 3000 };
  const run = createRun(chart);
  assert.equal(run.hit(2, 1020), 'perfect');
  assert.equal(run.combo, 1);
  assert.equal(run.counts.wrong, 0);
  assert.deepEqual(run.drainEvents(), [{ result: 'perfect', lane: 2 }]);
});

test('feedback: erro e nota perdida são vermelhos e tremem; acerto é verde/ciano sem tremor, com mensagem em português', () => {
  for (const result of ['wrong', 'miss']) {
    const fx = feedbackFor(result);
    assert.equal(fx.color, ERROR_COLOR);
    assert.equal(ERROR_COLOR, '#FF2A2A');
    assert.equal(fx.shake, true);
    assert.ok(fx.ms >= 250);
  }
  for (const result of ['perfect', 'good']) {
    const fx = feedbackFor(result);
    assert.equal(fx.color, HIT_COLOR);
    assert.equal(fx.shake, false);
  }
  assert.equal(SHAKE_MS, 150);
  assert.equal(MESSAGES.perfect, 'PERFEITO');
  assert.equal(MESSAGES.good, 'BOM');
});
