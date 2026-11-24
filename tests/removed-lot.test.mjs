import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, CITY_LOTS, DISCOVERIES, ERA_GATES, MEMBER_LOCATIONS, OBSTACLES, REMOVED_ISOLATED_LOT } from '../src/world-data.js';
import { EASTER_EGG_POSITIONS } from '../src/easter-eggs.js';
const distance = p => Math.hypot(p.x - REMOVED_ISOLATED_LOT.x, p.z - REMOVED_ISOLATED_LOT.z);
test('lote isolado removido não deixa colisor e mantém pontos relevantes afastados', () => {
 assert.ok(!BUILDINGS.some(p=>distance(p)<.01));
 assert.ok(!CITY_LOTS.some(p=>distance(p)<.01));
 assert.ok(!OBSTACLES.some(p=>distance(p)<.01));
 for (const p of [...DISCOVERIES,...ERA_GATES,...MEMBER_LOCATIONS,...EASTER_EGG_POSITIONS]) assert.ok(distance(p)>16);
});
