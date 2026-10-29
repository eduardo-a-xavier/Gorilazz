import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
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
test('peças fornecidas são GLBs locais estáticos reduzidos, com texturas incorporadas',async()=>{
  for(const [name,maximum] of [['2d-sculpture.glb',35000],['noodle-diorama.glb',50000]]){
    const data=await glb(name);assert.ok(triangles(data)<=maximum);assert.ok(triangles(data)>10000);
    assert.equal(data.skins?.length||0,0);assert.equal(data.animations?.length||0,0);
    assert.ok(data.images.length>0);assert.ok(data.images.every(image=>Number.isInteger(image.bufferView)&&!image.uri));
    for(const image of data.images){
      const view=data.bufferViews[image.bufferView];const bytes=data.binary.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
      // The shipping exports use JPEG; rejecting oversized source textures
      // prevents a small GLB transfer from hiding hundreds of MiB in GPU images.
      assert.equal(bytes.readUInt16BE(0),0xffd8);let found=false;
      for(let i=2;i<bytes.length;){const marker=bytes[i+1],size=bytes.readUInt16BE(i+2);if([0xc0,0xc1,0xc2].includes(marker)){assert.ok(bytes.readUInt16BE(i+5)<=1024&&bytes.readUInt16BE(i+7)<=1024);found=true;break;}i+=size+2;}
      assert.ok(found,'dimensões da textura JPEG devem estar presentes');
    }
    assert.ok(data.meshes.every(mesh=>mesh.primitives.every(p=>p.attributes.TEXCOORD_0!==undefined)));
  }
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
