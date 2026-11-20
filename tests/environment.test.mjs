import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { TREE_LOCATIONS, VISUAL_LANDMARKS, nearestRoad, distance, DISCOVERIES } from '../src/world-data.js';

async function glb(name) {
  const bytes=await readFile(new URL(`../assets/environment/${name}`,import.meta.url));
  assert.equal(bytes.toString('ascii',0,4),'glTF');assert.equal(bytes.readUInt32LE(4),2);assert.equal(bytes.readUInt32LE(8),bytes.length);
  assert.ok(bytes.length<5*1024*1024,`${name}: entrega não deve carregar os originais pesados`);
  const data=JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12)).trim());
  data.binary=bytes.subarray(28+bytes.readUInt32LE(12));return data;
}
function triangles(data) {
  return data.meshes.reduce((sum,mesh)=>sum+mesh.primitives.reduce((n,p)=>n+data.accessors[p.indices??p.attributes.POSITION].count/3,0),0);
}
test('scan de 2-D não integra a versão de entrega',async()=>{
  await assert.rejects(access(new URL('../assets/environment/2d-sculpture.glb',import.meta.url)));
  const environment=await readFile(new URL('../src/environment.js',import.meta.url),'utf8');
  const server=await readFile(new URL('../server.mjs',import.meta.url),'utf8');
  assert.ok(!environment.includes('2d-sculpture.glb'));
  assert.ok(!server.includes('2d-sculpture.glb'));
});
test('fachada e vegetação autorais usam poucos grupos de material e GLB válido',async()=>{
  const studio=await glb('kong-studio.glb'),tree=await glb('broadleaf-tree.glb');
  assert.ok(studio.meshes.length<=10);assert.ok(tree.meshes.length<=3);
  assert.ok(triangles(studio)<30000);assert.ok(triangles(tree)<5000);
});
test('novos volumes da exposição e árvores preservam os caminhos de exploração',()=>{
  for(const point of Object.values(VISUAL_LANDMARKS)){
    assert.ok(nearestRoad(point).distance>point.radius+3);
    assert.ok(DISCOVERIES.every(discovery=>distance(point,discovery)>point.radius+3));
  }
  assert.ok(TREE_LOCATIONS.length>10);
  for(const point of TREE_LOCATIONS){assert.ok(nearestRoad(point).distance>=15);assert.ok(DISCOVERIES.every(d=>distance(point,d)>=15));}
});

