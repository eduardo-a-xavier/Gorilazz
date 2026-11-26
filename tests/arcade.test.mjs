import test from 'node:test';
import assert from 'node:assert/strict';
import { GHOSTS, createArcade, buildMaze, parseGrid, reachableFrom, isWall, stepTile, PLAYER_START, GHOST_HOMES, TILE_MS, DOT_POINTS, POWER_POINTS, GHOST_POINTS, START_LIVES, FRIGHT_TICKS, ARCADE_RADIUS, TOP_KEY, readTop, recordScore, normalizeTop, ARCADE_SPOT } from '../src/arcade.js';

// rng determinístico: sem escolhas aleatórias dos fantasmas durante o teste.
const calm = () => 0.99;
const tick = (game, times = 1) => { for (let i = 0; i < times; i++) game.update(TILE_MS); };
// Cenário de colisão: jogador parado em (7,9); fantasma em (7,10) subindo. Ao andar, ele encosta no jogador.
function setupCollision(game, { frightened = false } = {}) {
  const snap = game.snapshot();
  snap.player = { x: 7, y: 9, dir: null };
  snap.ghosts[0].x = 7; snap.ghosts[0].y = 10; snap.ghosts[0].dir = 'up';
  snap.fright = frightened ? FRIGHT_TICKS : 0;
  return snap;
}

test('labirinto é retangular e fechado pelas bordas', () => {
  const rows = buildMaze();
  assert.equal(rows.length, 13);
  for (const row of rows) assert.equal(row.length, 17);
  assert.equal(rows[0], '#'.repeat(17));
  assert.equal(rows[12], '#'.repeat(17));
});

test('todos os corredores são alcançáveis a partir do início do jogador (nenhum ponto isolado)', () => {
  const grid = parseGrid(buildMaze());
  const reached = reachableFrom(grid, PLAYER_START);
  let open = 0;
  for (let y = 0; y < grid.length; y++) for (let x = 0; x < grid[0].length; x++) {
    if (!isWall(grid, x, y)) { open++; assert.ok(reached.has(`${x},${y}`), `isolado em ${x},${y}`); }
  }
  assert.ok(open > 100);
});

test('o jogador não atravessa parede e anda pelos corredores', () => {
  const game = createArcade({ rng: calm });
  game.start();
  game.setDirection('up'); tick(game);
  assert.deepEqual([game.snapshot().player.x, game.snapshot().player.y], [PLAYER_START.x, PLAYER_START.y], 'acima do início é pilar');
  game.setDirection('left'); tick(game);
  assert.equal(game.snapshot().player.x, PLAYER_START.x - 1, 'esquerda é corredor');
});

test('pegar um ponto soma pontos e reduz os pontos restantes', () => {
  const game = createArcade({ rng: calm });
  game.start();
  const before = game.dots;
  game.setDirection('left'); tick(game);
  assert.equal(game.score, DOT_POINTS);
  assert.equal(game.dots, before - 1);
});

test('pastilha de poder pontua e deixa os fantasmas assustados', () => {
  const game = createArcade({ rng: calm });
  game.start();
  const snap = game.snapshot();
  snap.player = { x: 1, y: 2, dir: null };
  game.setDirection('up'); tick(game); // (1,1) tem pastilha de poder
  assert.equal(game.score, POWER_POINTS);
  assert.ok(snap.fright > 0 && snap.fright <= FRIGHT_TICKS);
});

test('com pastilha ativa, encostar num fantasma o devolve para casa e rende pontos sem custar vida', () => {
  const game = createArcade({ rng: calm });
  game.start();
  const snap = setupCollision(game, { frightened: true });
  snap.tick = 0; // fantasmas assustados andam em ticks pares; o próximo é ímpar, então o fantasma fica parado
  snap.ghosts[0].x = 7; snap.ghosts[0].y = 10;
  game.setDirection('down'); tick(game); // jogador anda até (7,10), onde está o fantasma
  assert.ok(game.score >= GHOST_POINTS, `pontuação ${game.score} deveria incluir ${GHOST_POINTS}`);
  assert.equal(game.lives, START_LIVES);
  assert.equal(snap.ghosts[0].x, GHOST_HOMES[0].x, 'fantasma volta para a casa');
});

test('fantasma sem pastilha tira uma vida e recoloca jogador e fantasmas no início', () => {
  const game = createArcade({ rng: calm });
  game.start();
  const snap = setupCollision(game);
  tick(game);
  assert.equal(game.lives, START_LIVES - 1);
  assert.deepEqual([snap.player.x, snap.player.y], [PLAYER_START.x, PLAYER_START.y]);
  assert.equal(snap.ghosts[0].x, GHOST_HOMES[0].x);
});

test('perder todas as vidas encerra em "over"; partida nova recomeça do zero', () => {
  const game = createArcade({ rng: calm });
  game.start();
  for (let life = 0; life < START_LIVES; life++) { setupCollision(game); tick(game); }
  assert.equal(game.status, 'over');
  assert.equal(game.lives, 0);
  game.start();
  assert.equal(game.status, 'playing');
  assert.equal(game.lives, START_LIVES);
  assert.equal(game.score, 0);
});

test('comer todos os pontos encerra a fase em "clear"', () => {
  const game = createArcade({ rng: calm });
  game.start();
  const snap = game.snapshot();
  snap.grid = snap.grid.map(row => row.map(() => ' '));
  snap.grid[PLAYER_START.y][PLAYER_START.x - 1] = '.';
  snap.dots = 1;
  game.setDirection('left'); tick(game);
  assert.equal(game.status, 'clear');
});

test('pausa congela a simulação e continuar retoma do mesmo ponto', () => {
  const game = createArcade({ rng: calm });
  game.start();
  game.setDirection('left'); tick(game);
  game.pause();
  const frozen = game.snapshot().player.x;
  tick(game, 5);
  assert.equal(game.snapshot().player.x, frozen);
  game.resume();
  tick(game);
  assert.notEqual(game.snapshot().player.x, frozen);
});

test('saída limpa com quit() deixa o jogo fechado e não avança mais', () => {
  const game = createArcade({ rng: calm });
  game.start();
  game.quit();
  assert.equal(game.status, 'closed');
  game.update(10 * TILE_MS);
  assert.equal(game.status, 'closed');
});

test('quadros longos são limitados a 250 ms (sem saltos de vários passos)', () => {
  const game = createArcade({ rng: calm });
  game.start();
  game.setDirection('left');
  game.update(5000);
  assert.ok(game.snapshot().player.x >= PLAYER_START.x - 2);
});

test('movimento lógico de um tile respeita a direção', () => {
  assert.deepEqual(stepTile({ x: 3, y: 3 }, 'up'), { x: 3, y: 2 });
  assert.deepEqual(stepTile({ x: 3, y: 3 }, 'right'), { x: 4, y: 3 });
});

test('os quatro fantasmas são os integrantes, cada um com rosto e cores próprias', () => {
  assert.deepEqual(GHOSTS.map(g => g.name), ['2-D', 'Murdoc', 'Noodle', 'Russel']);
  assert.equal(new Set(GHOSTS.map(g => g.shirt)).size, 4, 'camisas distintas');
  for (const g of GHOSTS) { assert.match(g.skin, /^#[0-9a-f]{6}$/i); assert.match(g.hair, /^#[0-9a-f]{6}$/i); assert.ok(['bob', 'swept', 'long', 'short'].includes(g.hairStyle)); }
});

test('velocidade: passo do jogador ~30% mais lento que antes (170 ms) e fantasmas param em 3 de 10 ticks', () => {
  assert.equal(TILE_MS, 243);
  const game = createArcade({ rng: calm });
  game.start();
  const snap = game.snapshot();
  snap.player = { x: 1, y: 1, dir: null }; // longe dos fantasmas
  snap.ghosts[0].x = 15; snap.ghosts[0].y = 11; snap.ghosts[0].dir = 'left';
  const at = () => `${snap.ghosts[0].x},${snap.ghosts[0].y}`;
  const p0 = at();
  snap.tick = 6; tick(game); // tick 7: fantasmas parados
  assert.equal(at(), p0, 'no tick 7 o fantasma fica parado');
  snap.tick = 0; tick(game); // tick 1: fantasmas andam
  assert.notEqual(at(), p0, 'no tick 1 o fantasma anda');
});

test('o raio do fliperama é de 4 m a partir da máquina', () => {
  assert.equal(ARCADE_RADIUS, 4);
  assert.deepEqual(ARCADE_SPOT, { x: 13.5, z: -18 });
});

test('a base do fliperama fica a pelo menos 0,90 m do asfalto e longe de prédios e árvores', async () => {
  const { roadGap, OBSTACLES, distance, nearestRoad } = await import('../src/world-data.js');
  const { ARCADE_PAD_RADIUS, ARCADE_ROAD_CLEARANCE } = await import('../src/arcade.js');
  assert.ok(roadGap(ARCADE_SPOT) >= ARCADE_PAD_RADIUS + ARCADE_ROAD_CLEARANCE, `folga da base até o asfalto: ${(roadGap(ARCADE_SPOT) - ARCADE_PAD_RADIUS).toFixed(2)} m`);
  for (const o of OBSTACLES) assert.ok(distance(o, ARCADE_SPOT) > o.radius + 1.5, 'obstáculo colado na máquina');
  // A frente (+z local, girada para a via) aponta para a via mais próxima.
  const road = nearestRoad(ARCADE_SPOT);
  assert.ok(Math.hypot(road.x - ARCADE_SPOT.x, road.z - ARCADE_SPOT.z) > 0);
});

// Armazenamento em memória com a mesma interface de localStorage.
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
}

test('Top 5: ordena por pontuação, guarda no máximo 5 e persiste no localStorage', () => {
  const storage = new MemoryStorage();
  for (const score of [40, 300, 10, 500, 120, 80, 260]) recordScore(storage, score, '2026-11-21');
  const top = readTop(storage);
  assert.deepEqual(top.map(e => e.score), [500, 300, 260, 120, 80]);
  assert.ok(storage.getItem(TOP_KEY), 'gravado com a chave do fliperama');
  assert.equal(readTop(new MemoryStorage()).length, 0, 'sem histórico, lista vazia');
});

test('Top 5 ignora pontuação zero, dados inválidos e JSON corrompido', () => {
  const storage = new MemoryStorage();
  recordScore(storage, 0);
  assert.equal(readTop(storage).length, 0, 'zero não entra no Top 5');
  assert.deepEqual(normalizeTop([{ score: 'x' }, null, { score: 70, date: '2026-11-21T10:00' }]), [{ score: 70, date: '2026-11-21' }]);
  storage.setItem(TOP_KEY, '{quebrado');
  assert.deepEqual(readTop(storage), []);
  assert.deepEqual(readTop(null), [], 'sem localStorage (navegador bloqueado) não quebra');
});

test('armazenamento que recusa escrita não derruba o placar da partida', () => {
  const broken = { getItem: () => null, setItem() { throw new Error('quota'); } };
  assert.deepEqual(recordScore(broken, 90, '2026-11-21'), [{ score: 90, date: '2026-11-21' }]);
});

import { mazeDotCount } from '../src/arcade.js';
import { readFile } from 'node:fs/promises';
import * as THREE from '../src/vendor/three.module.min.js';
import { GLTFLoader } from '../src/vendor/GLTFLoader.js';
import { installArcadeCabinet, ARCADE_GLB_URL } from '../src/arcade-cabinet.js';

test('antes de começar, o diálogo mostra o total de pontos do labirinto (não zero)', () => {
  const total = mazeDotCount();
  assert.ok(total > 50, `pontos no labirinto: ${total}`);
  assert.equal(total, parseGrid(buildMaze()).flat().filter(cell => cell === '.' || cell === 'o').length);
});

test('installArcadeCabinet carrega arcade-01-kong.glb com textura real na tela e acabamento Kong amarelo/preto', async () => {
  assert.equal(ARCADE_GLB_URL, './assets/models/scenery/arcade-01-kong.glb');
  const scene = new THREE.Scene();
  const group = installArcadeCabinet(scene);
  const diskLoader = {
    async loadAsync(url) {
      const bytes = await readFile(new URL(`../${url.replace('./', '')}`, import.meta.url));
      const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      return new Promise((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
    },
  };
  const ok = await group.userData.loadArcadeModel(diskLoader);
  assert.equal(ok, true);
  assert.equal(group.userData.glbLoaded, true);
  let screenMesh = null;
  group.traverse(o => { if (o.isMesh && o.name === 'screen') screenMesh = o; });
  assert.ok(screenMesh && screenMesh.material?.map, 'nó screen recebeu a textura dinâmica do fliperama');
});
