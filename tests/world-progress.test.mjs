import test from 'node:test';
import assert from 'node:assert/strict';
import { loadJourney, loadWorldJourney, saveWorldJourney } from '../src/progress.js';
import { OBSTACLES } from '../src/world-data.js';
const memory = () => { const data = new Map(); return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value) }; };
test('posição livre e integrantes sobrevivem ao recarregamento sem restaurar velocidade', () => {
  const storage = memory(); saveWorldJourney(storage, {x: -12, z: -22, heading: .5, speed: 22}, new Set([2,0]));
  assert.deepEqual(loadWorldJourney(storage), {vehicle:{x:-12,z:-22,heading:.5},discovered:[2,0]});
});
test('posição inválida volta ao início e mantém os integrantes válidos', () => {
  const storage = memory(); storage.setItem('gorilazz.world.v1',JSON.stringify({version:1,vehicle:{x:999,z:0,heading:0},discovered:[0,0,2,7,-1,'1']}));
  assert.deepEqual(loadWorldJourney(storage), {vehicle:{x:0,z:0,heading:0},discovered:[0,2]});
  const obstacle=OBSTACLES[0]; saveWorldJourney(storage,{x:obstacle.x,z:obstacle.z,heading:0},new Set([3]));
  assert.deepEqual(loadWorldJourney(storage).vehicle,{x:0,z:0,heading:0});
});
test('progresso de integrantes da versão anterior permanece disponível para migração', () => {
  const storage=memory();storage.setItem('gorilazz.journey.v1',JSON.stringify({version:1,position:.7,discovered:[1,3]}));
  assert.equal(loadWorldJourney(storage),null);assert.deepEqual(loadJourney(storage).discovered,[1,3]);
});
test('persistência do mundo tolera dados quebrados e armazenamento bloqueado', () => {
  const storage=memory();storage.setItem('gorilazz.world.v1','broken');assert.equal(loadWorldJourney(storage),null);
  const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
  assert.equal(loadWorldJourney(blocked),null);assert.equal(saveWorldJourney(blocked,{x:0,z:0,heading:0},new Set()),false);
});
