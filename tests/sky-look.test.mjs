import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceSkyLook } from '../src/scene.js';
test('olhar para céu só sobe após 1,5 s parado ou com L, e retorna ao andar', () => {
 const s={stopped:0,amount:0}; for(let i=0;i<80;i++) assert.equal(advanceSkyLook(s,1/60,0,false),0);
 for(let i=0;i<80;i++) advanceSkyLook(s,1/60,0,false); assert.ok(s.amount>.8 && s.amount<=1);
 for(let i=0;i<65;i++) advanceSkyLook(s,1/60,5,false); assert.ok(s.amount<1e-8);
 for(let i=0;i<65;i++) advanceSkyLook(s,1/60,5,true); assert.ok(s.amount>.99);
 assert.ok(advanceSkyLook({stopped:0,amount:0},10,5,true)<=.01);
});
