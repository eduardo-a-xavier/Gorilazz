// Fliperama único de Kong Studios: minigame de coletar pontos em labirinto com fantasmas autorais.
// Lógica pura, sem DOM nem Three.js, para ser testada em Node. Desenho e teclado ficam em arcade-screen.js.
// Labirinto, regras e personagens são originais; não usam sprites ou mapas do jogo clássico.

// Máquina na calçada leste da Av. Kong Studios, separada do Jardim/Ecos e do Mural 1, com folga >= 0,90 m do asfalto.
export const ARCADE_SPOT = { x: 13.5, z: -18 }; // mesmo ponto da máquina 3D (arcade-cabinet.js), perto de Kong Studios, fora da estrada
export const ARCADE_PAD_RADIUS = 4.7; // base de piso, igual à dos pontos de história (scene.js)
export const ARCADE_ROAD_CLEARANCE = .9; // m: folga mínima entre a base e o asfalto
export const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
const REVERSE = { up: 'down', down: 'up', left: 'right', right: 'left' };
export const TILE_MS = 243;          // duração de um passo do jogador (~30% mais lento que 170 ms)
export const GHOST_IDLE_EVERY = 10, GHOST_IDLE_TICKS = 3; // fantasmas ficam parados em 3 de cada 10 ticks (~70% da velocidade do jogador)
export const FRIGHT_TICKS = 24;      // ~5,8 s com pastilha de poder
export const ARCADE_RADIUS = 4;      // m: a pílula "E / JOGAR FLIPERAMA" aparece e o fliperama abre só a menos de 4 m da máquina
export const TOP_KEY = 'gorilazz-fliperama-top5', TOP_SIZE = 5;
export const START_LIVES = 3;
export const DOT_POINTS = 10, POWER_POINTS = 50, GHOST_POINTS = 200;

// Personagens do labirinto: rostos autorais em canvas, com as cores da paleta do projeto (app.js) para cada integrante.
// Fantasmas são os quatro integrantes (sem imagens oficiais e sem sprites do jogo clássico).
export const GHOSTS = [
  { id: 'azul', name: '2-D', skin: '#e2d8c0', hair: '#3a68d8', hairStyle: 'bob', shirt: '#f2559c' },
  { id: 'verde', name: 'Murdoc', skin: '#91a568', hair: '#141414', hairStyle: 'swept', shirt: '#373737' },
  { id: 'rosa', name: 'Noodle', skin: '#e2d8c0', hair: '#f5a9c6', hairStyle: 'long', shirt: '#3a68d8' },
  { id: 'creme', name: 'Russel', skin: '#986b50', hair: '#141414', hairStyle: 'short', shirt: '#e2d8c0' },
];

const W = 17, H = 13;
const HOUSE = { x0: 6, x1: 10, y0: 5, y1: 7 };
export const PLAYER_START = { x: 8, y: 9 };
export const GHOST_HOMES = [{ x: 7, y: 6 }, { x: 8, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 5 }];

// Labirinto de pilares: bordas e colunas/linhas pares são paredes; o resto são corredores com pontos.
export function buildMaze() {
  const rows = [];
  for (let y = 0; y < H; y++) {
    let row = '';
    for (let x = 0; x < W; x++) {
      const edge = x === 0 || y === 0 || x === W - 1 || y === H - 1;
      const pillar = x % 2 === 0 && y % 2 === 0;
      row += edge || pillar ? '#' : '.';
    }
    rows.push(row.split(''));
  }
  for (let y = HOUSE.y0; y <= HOUSE.y1; y++) for (let x = HOUSE.x0; x <= HOUSE.x1; x++) rows[y][x] = ' ';
  rows[PLAYER_START.y][PLAYER_START.x] = ' ';
  for (const [x, y] of [[1, 1], [W - 2, 1], [1, H - 2], [W - 2, H - 2]]) rows[y][x] = 'o';
  return rows.map(row => row.join(''));
}

export function parseGrid(rows) {
  return rows.map(row => row.split(''));
}

export function isWall(grid, x, y) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[0].length) return true;
  return grid[y][x] === '#';
}

export function stepTile(pos, dir) {
  const d = DIRS[dir];
  return { x: pos.x + d.x, y: pos.y + d.y };
}

// Quantidade de tiles alcançáveis a partir de um ponto (usada nos testes para garantir que nenhum ponto fica isolado).
export function reachableFrom(grid, start) {
  const seen = new Set([`${start.x},${start.y}`]), queue = [start];
  while (queue.length) {
    const cur = queue.shift();
    for (const dir of Object.keys(DIRS)) {
      const next = stepTile(cur, dir), key = `${next.x},${next.y}`;
      if (isWall(grid, next.x, next.y) || seen.has(key)) continue;
      seen.add(key); queue.push(next);
    }
  }
  return seen;
}

// Pontos do labirinto antes de começar (para mostrar "colete todos os N pontos" no diálogo).
export function mazeDotCount() {
  let n = 0; for (const row of parseGrid(buildMaze())) for (const cell of row) if (cell === '.' || cell === 'o') n++;
  return n;
}

export function createArcade({ rng = Math.random } = {}) {
  const state = { status: 'ready', score: 0, lives: START_LIVES, dots: 0, grid: [], player: null, ghosts: [], fright: 0, eaten: 0, tick: 0, acc: 0, want: null };

  function countDots(grid) {
    let n = 0; for (const row of grid) for (const cell of row) if (cell === '.' || cell === 'o') n++; return n;
  }
  function placeEntities() {
    state.player = { x: PLAYER_START.x, y: PLAYER_START.y, dir: null };
    state.ghosts = GHOSTS.map((ghost, i) => ({ ...ghost, x: GHOST_HOMES[i].x, y: GHOST_HOMES[i].y, dir: 'up', home: GHOST_HOMES[i] }));
    state.fright = 0; state.eaten = 0; state.want = null; state.acc = 0;
  }
  function newGame() {
    state.grid = parseGrid(buildMaze());
    state.score = 0; state.lives = START_LIVES; state.tick = 0;
    state.dots = countDots(state.grid);
    placeEntities();
    state.status = 'playing';
  }
  function setDirection(dir) { if (DIRS[dir]) state.want = dir; }
  function canMove(pos, dir) { const next = stepTile(pos, dir); return !isWall(state.grid, next.x, next.y); }

  function stepPlayer() {
    const p = state.player;
    if (state.want && canMove(p, state.want)) p.dir = state.want;
    if (!p.dir) return;
    if (!canMove(p, p.dir)) { p.dir = null; return; }
    const next = stepTile(p, p.dir); p.x = next.x; p.y = next.y;
    const cell = state.grid[p.y][p.x];
    if (cell === '.') { state.score += DOT_POINTS; state.dots--; state.grid[p.y][p.x] = ' '; }
    else if (cell === 'o') {
      state.score += POWER_POINTS; state.dots--; state.grid[p.y][p.x] = ' ';
      state.fright = FRIGHT_TICKS; state.eaten = 0;
    }
    if (state.dots === 0) state.status = 'clear';
  }

  function ghostChoice(ghost, frightened) {
    const p = state.player;
    const options = Object.keys(DIRS).filter(dir => dir !== REVERSE[ghost.dir] && canMove(ghost, dir));
    const pool = options.length ? options : Object.keys(DIRS).filter(dir => canMove(ghost, dir));
    if (!pool.length) return null;
    if (!frightened && rng() < .12) return pool[Math.floor(rng() * pool.length)];
    const dist = dir => { const n = stepTile(ghost, dir); return Math.abs(n.x - p.x) + Math.abs(n.y - p.y); };
    return pool.reduce((best, dir) => {
      const score = frightened ? -dist(dir) : dist(dir);
      return best === null || score < best.score ? { dir, score } : best;
    }, null).dir;
  }

  function stepGhosts() {
    if (state.tick % GHOST_IDLE_EVERY >= GHOST_IDLE_EVERY - GHOST_IDLE_TICKS) return; // velocidade dos fantasmas: ~70% da do jogador
    const frightened = state.fright > 0;
    for (const ghost of state.ghosts) {
      if (frightened && state.tick % 2) continue; // fantasmas assustados andam mais devagar
      const dir = ghostChoice(ghost, frightened);
      if (!dir) continue;
      const next = stepTile(ghost, dir); ghost.x = next.x; ghost.y = next.y; ghost.dir = dir;
    }
  }

  function resolveCollisions() {
    const p = state.player;
    for (const ghost of state.ghosts) {
      if (ghost.x !== p.x || ghost.y !== p.y) continue;
      if (state.fright > 0) {
        state.score += GHOST_POINTS * 2 ** state.eaten; state.eaten++;
        ghost.x = ghost.home.x; ghost.y = ghost.home.y; ghost.dir = 'up';
      } else {
        state.lives--;
        if (state.lives <= 0) { state.status = 'over'; return; }
        placeEntities();
        return;
      }
    }
  }

  function tick() {
    state.tick++;
    stepPlayer();
    if (state.status !== 'playing') return;
    stepGhosts();
    resolveCollisions();
    if (state.status === 'playing' && state.fright > 0) state.fright--;
  }

  return {
    get status() { return state.status; },
    get score() { return state.score; },
    get lives() { return state.lives; },
    get dots() { return state.dots; },
    snapshot() { return state; },
    start() { if (state.status === 'playing') return; newGame(); },
    pause() { if (state.status === 'playing') state.status = 'paused'; },
    resume() { if (state.status === 'paused') state.status = 'playing'; },
    quit() { state.status = 'closed'; },
    setDirection,
    // Avança a simulação em passos fixos de TILE_MS; quadros longos não geram saltos bruscos.
    update(dtMs) {
      if (state.status !== 'playing') return;
      state.acc += Math.min(dtMs, 250);
      while (state.acc >= TILE_MS && state.status === 'playing') { state.acc -= TILE_MS; tick(); }
    },
  };
}

// Top 5 do fliperama no localStorage: pontuações ordenadas, sem dados inválidos. Lógica pura, testada em Node.
export function normalizeTop(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(entry => entry && Number.isFinite(entry.score) && entry.score > 0)
    .map(entry => ({ score: Math.floor(entry.score), date: typeof entry.date === 'string' ? entry.date.slice(0, 10) : '' }))
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_SIZE);
}
export function readTop(storage) {
  try { return normalizeTop(JSON.parse(storage?.getItem(TOP_KEY) ?? '[]')); } catch { return []; }
}
export function recordScore(storage, score, date = new Date().toISOString().slice(0, 10)) {
  const list = normalizeTop([...readTop(storage), { score, date }]);
  try { storage?.setItem(TOP_KEY, JSON.stringify(list)); } catch { /* armazenamento cheio ou bloqueado: o placar só some ao recarregar */ }
  return list;
}
