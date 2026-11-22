// Tela do fliperama: diálogo acessível, laço de quadros, teclado, toque (D-pad) e sprites autorais em canvas.
// A regra do jogo está em arcade.js; aqui só há apresentação e entrada.
// Sprites: o Geep (vista de cima, autoral) e os quatro integrantes como fantasmas, com rosto desenhado em código.
import { createArcade, readTop, recordScore, mazeDotCount } from './arcade.js';

const CELL = 30;
const COLORS = { wall: '#1b3a55', wallEdge: '#4d7699', dot: '#f1efda', power: '#ffcc4d', ink: '#111415', mint: '#c4dc9d', geep: '#e2d8c0', glass: '#3a68d8' };
const KEY_DIRS = { arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right' };
const ANGLE = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 };

// Rosto de um integrante: cabeça, franja no estilo de cada um, olhos e boca; corpo com barra ondulada (fantasma).
function drawCharacter(ctx, cx, cy, g, frightened, now) {
  const r = CELL * .4, bob = Math.sin(now / 140 + cx) * 1.2;
  ctx.save(); ctx.translate(cx, cy + bob);
  // corpo (camisa) com barra ondulada
  ctx.fillStyle = frightened ? COLORS.glass : g.shirt;
  ctx.beginPath(); ctx.moveTo(-r, r * .1); ctx.lineTo(-r, r * .95);
  for (let i = 0; i < 4; i++) ctx.lineTo(-r + (i + .5) * (2 * r / 4), r * .95 + (i % 2 ? -4 : 3));
  ctx.lineTo(r, r * .95); ctx.lineTo(r, r * .1); ctx.arc(0, r * .1, r, 0, Math.PI); ctx.closePath(); ctx.fill();
  // cabeça
  ctx.fillStyle = frightened ? '#f1efda' : g.skin;
  ctx.beginPath(); ctx.arc(0, -r * .32, r * .72, 0, Math.PI * 2); ctx.fill();
  // cabelo
  if (!frightened) {
    ctx.fillStyle = g.hair; ctx.beginPath();
    if (g.hairStyle === 'bob') { ctx.arc(0, -r * .38, r * .76, Math.PI, 0); ctx.lineTo(r * .76, -r * .2); ctx.lineTo(-r * .76, -r * .2); }
    else if (g.hairStyle === 'swept') { ctx.moveTo(-r * .72, -r * .4); ctx.quadraticCurveTo(0, -r * 1.25, r * .72, -r * .45); ctx.lineTo(r * .3, -r * .62); ctx.quadraticCurveTo(0, -r * .9, -r * .72, -r * .25); }
    else if (g.hairStyle === 'long') { ctx.arc(0, -r * .4, r * .78, Math.PI, 0); ctx.lineTo(r * .78, r * .42); ctx.lineTo(r * .5, r * .3); ctx.lineTo(r * .5, -r * .25); ctx.lineTo(-r * .5, -r * .25); ctx.lineTo(-r * .5, r * .3); ctx.lineTo(-r * .78, r * .42); }
    else { ctx.arc(0, -r * .5, r * .72, Math.PI, 0); ctx.lineTo(r * .72, -r * .45); ctx.lineTo(-r * .72, -r * .45); }
    ctx.closePath(); ctx.fill();
  }
  // olhos e boca
  if (frightened) {
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-r * .4, -r * .2); ctx.lineTo(-r * .18, -r * .05); ctx.moveTo(r * .18, -r * .05); ctx.lineTo(r * .4, -r * .2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * .4, r * .3); for (let i = 0; i < 4; i++) ctx.lineTo(-r * .4 + (i + 1) * r * .2, r * .3 + (i % 2 ? -3 : 3)); ctx.stroke();
  } else {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(-r * .3, -r * .28, r * .18, r * .22, 0, 0, Math.PI * 2); ctx.ellipse(r * .3, -r * .28, r * .18, r * .22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.ink; ctx.beginPath(); ctx.arc(-r * .28, -r * .24, r * .08, 0, Math.PI * 2); ctx.arc(r * .32, -r * .24, r * .08, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, -r * .05, r * .2, .2, Math.PI - .2); ctx.stroke();
  }
  ctx.restore();
}

// Geep em vista de cima (autoral): carroceria creme, vidros azuis, faixa verde e faróis.
function drawGeep(ctx, cx, cy, dir) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(ANGLE[dir ?? 'up'] ?? 0);
  const w = CELL * .62, h = CELL * .86;
  ctx.fillStyle = '#1b1f20';
  for (const [x, y] of [[-w / 2 - 2, -h * .3], [w / 2 - 2, -h * .3], [-w / 2 - 2, h * .22], [w / 2 - 2, h * .22]]) ctx.fillRect(x, y, 5, 9); // rodas
  ctx.fillStyle = COLORS.geep; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COLORS.glass;
  ctx.beginPath(); ctx.roundRect(-w * .36, -h * .34, w * .72, h * .26, 3); ctx.fill(); // para-brisa
  ctx.beginPath(); ctx.roundRect(-w * .36, h * .12, w * .72, h * .18, 3); ctx.fill();  // vidro traseiro
  ctx.fillStyle = COLORS.mint; ctx.fillRect(-w / 2 + 2, -h * .04, w - 4, 3);            // faixa
  ctx.fillStyle = '#ffe9a6';
  ctx.beginPath(); ctx.arc(-w * .3, -h / 2 + 3, 2.4, 0, Math.PI * 2); ctx.arc(w * .3, -h / 2 + 3, 2.4, 0, Math.PI * 2); ctx.fill(); // faróis
  ctx.restore();
}

export function createArcadeScreen({ dialog, onClose, storage = globalThis.localStorage }) {
  const game = createArcade();
  const canvas = dialog.querySelector('#arcade-canvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = dialog.querySelector('#arcade-score');
  const livesEl = dialog.querySelector('#arcade-lives');
  const messageEl = dialog.querySelector('#arcade-message');
  const panel = dialog.querySelector('#arcade-panel');
  const panelTitle = dialog.querySelector('#arcade-panel-title');
  const panelText = dialog.querySelector('#arcade-panel-text');
  const top5El = dialog.querySelector('#arcade-top5');
  const startButton = dialog.querySelector('#arcade-start');
  let raf = 0, last = 0, lastHud = '', lastStatus = '', recorded = false;

  function message(text) { messageEl.textContent = text; messageEl.hidden = !text; }
  function renderTop(list) {
    const items = list.length ? list.map(entry => `${String(entry.score).padStart(5, '0')}${entry.date ? ` · ${entry.date}` : ''}`) : ['Ainda sem pontuações. Jogue para entrar no Top 5.'];
    top5El.replaceChildren(...items.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
  }
  // Painel sobre o labirinto: começo (ready), vitória (clear) e fim de jogo (over), sempre com o Top 5 salvo.
  function showPanel(status) {
    const finished = status === 'over' || status === 'clear';
    const ready = status === 'ready' || status === 'closed';
    panel.hidden = !(finished || ready);
    if (panel.hidden) return;
    if (status === 'clear') { panelTitle.textContent = 'VITÓRIA!'; panelText.textContent = `Você coletou todos os pontos. Pontuação ${game.score}. Enter para jogar de novo.`; }
    else if (status === 'over') { panelTitle.textContent = 'FIM DE JOGO'; panelText.textContent = `Pontuação ${game.score}. Enter para jogar de novo.`; }
    else { panelTitle.textContent = 'COLETOR DO LABIRINTO'; panelText.textContent = 'Colete todos os pontos sem ser pego. Enter ou Jogar para começar.'; }
    renderTop(readTop(storage));
  }
  function onStatus(status) {
    if ((status === 'over' || status === 'clear') && !recorded) { recorded = true; recordScore(storage, game.score); }
    showPanel(status);
  }
  // Antes de começar, o objetivo mostra o total do labirinto; durante o jogo, o que resta.
  function setGoal(started) {
    const goal = dialog.querySelector('#arcade-goal');
    if (!started) goal.innerHTML = `Objetivo: colete todos os <strong id="arcade-left">${mazeDotCount()}</strong> pontos sem ser pego.`;
    else goal.innerHTML = `Objetivo: colete todos os pontos sem ser pego. Restam <strong id="arcade-left">${game.dots}</strong>`;
  }
  function hud() {
    const key = `${game.score}|${game.lives}|${game.dots}`;
    if (key === lastHud) return; lastHud = key;
    scoreEl.textContent = String(game.score).padStart(5, '0'); livesEl.textContent = '♥'.repeat(Math.max(0, game.lives));
    const left = dialog.querySelector('#arcade-left');
    if (left && game.status !== 'ready' && game.status !== 'closed') left.textContent = String(game.dots);
  }
  function drawMaze(grid, now) {
    for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
      const cell = grid[y][x], px = x * CELL, py = y * CELL;
      if (cell === '#') { ctx.fillStyle = COLORS.wall; ctx.fillRect(px, py, CELL, CELL); ctx.strokeStyle = COLORS.wallEdge; ctx.lineWidth = 1.5; ctx.strokeRect(px + 1, py + 1, CELL - 2, CELL - 2); }
      else if (cell === '.') { ctx.fillStyle = COLORS.dot; ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, 2.8, 0, Math.PI * 2); ctx.fill(); }
      else if (cell === 'o') { const pulse = 5 + Math.sin(now / 150) * 1.5; ctx.fillStyle = COLORS.power; ctx.beginPath(); ctx.arc(px + CELL / 2, py + CELL / 2, pulse, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  function draw(now = performance.now()) {
    const s = game.snapshot();
    ctx.fillStyle = '#0b1214'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (s.grid.length) drawMaze(s.grid, now);
    if (s.player) drawGeep(ctx, s.player.x * CELL + CELL / 2, s.player.y * CELL + CELL / 2, s.player.dir ?? 'up');
    for (const ghost of s.ghosts ?? []) drawCharacter(ctx, ghost.x * CELL + CELL / 2, ghost.y * CELL + CELL / 2, ghost, s.fright > 0, now);
    hud();
  }
  function frame(now) {
    raf = requestAnimationFrame(frame);
    game.update(last ? now - last : 0); last = now;
    draw(now);
    const status = game.status;
    if (status !== lastStatus) { lastStatus = status; onStatus(status); }
    message(status === 'paused' ? 'PAUSA · P para continuar' : '');
  }
  function startLoop() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } }
  function stopLoop() { cancelAnimationFrame(raf); raf = 0; }

  function begin() {
    if (game.status === 'playing' || game.status === 'paused') { if (game.status === 'paused') game.resume(); return; }
    game.start(); setGoal(true); lastHud = ''; recorded = false; lastStatus = 'playing'; message(''); showPanel('playing'); startLoop();
  }
  function open() {
    game.quit(); // partida anterior não continua ao reabrir
    lastHud = ''; lastStatus = 'closed'; recorded = false;
    dialog.showModal(); setGoal(false); draw(); showPanel('ready'); message('');
    // Em tela cheia, o Chrome entrega o Esc à página só com o bloqueio de teclado: assim o Esc fecha o fliperama e não sai da tela cheia.
    if (document.fullscreenElement) navigator.keyboard?.lock?.(['Escape']).catch(() => {});
    startButton.focus();
  }
  dialog.addEventListener('close', () => { stopLoop(); game.quit(); last = 0; navigator.keyboard?.unlock?.(); onClose?.(); });
  startButton.addEventListener('click', begin);
  dialog.querySelector('#arcade-exit').addEventListener('click', () => dialog.close());

  // Teclado: setas/WASD dirigem, P pausa, Enter começa. Esc fecha SÓ o fliperama: o evento para aqui (não chega ao Esc que sai do 3D ou fecha outros painéis).
  // Esc não chega aqui: a pilha (src/escape-stack.js) fecha o fliperama pela janela.
  dialog.addEventListener('keydown', event => {
    const key = event.key.toLowerCase();
    if (KEY_DIRS[key]) { event.preventDefault(); game.setDirection(KEY_DIRS[key]); return; }
    if (key === 'p') { event.preventDefault(); if (game.status === 'playing') game.pause(); else if (game.status === 'paused') game.resume(); return; }
    if (key === 'enter' && game.status !== 'playing' && game.status !== 'paused') { event.preventDefault(); begin(); }
  });
  // Controles de toque (D-pad).
  for (const button of dialog.querySelectorAll('[data-arcade-dir]')) {
    const dir = button.dataset.arcadeDir;
    button.addEventListener('pointerdown', event => { event.preventDefault(); game.setDirection(dir); if (game.status !== 'playing' && game.status !== 'paused') begin(); });
  }
  draw();
  return { open, get status() { return game.status; }, snapshot: () => game.snapshot() }; // snapshot: usado por ?perf e pelos testes de navegador
}
