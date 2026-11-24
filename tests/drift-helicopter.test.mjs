import test from 'node:test';
import assert from 'node:assert/strict';
import { createVehicle, stepVehicle } from '../src/driving.js';
import { advanceHelicopterClock } from '../src/landmarks.js';

function sample(steer, drift = false) {
 const v = createVehicle(), rows = [];
 for (let i = 0; i < 240; i++) {
   v.x = 0; v.z = 0; v.speed = 14;
   stepVehicle(v,{steer:i<120 ? steer : 0,drift:i<120 && drift},1/120);
   rows.push({steering:v.steering,slip:v.slip,drifting:v.drifting});
 }
 return rows;
}
test('A e D têm a mesma curva de esterço e retorno em velocidade igual', () => {
 const a=sample(1), d=sample(-1);
 for (let i=0;i<a.length;i++) assert.ok(Math.abs(a[i].steering+d[i].steering)<1e-12);
 assert.ok(Math.abs(a[119].steering)>.1);
 assert.equal(a[239].steering,0);
});
test('drift limita slip a 15 graus e retorna ao soltar', () => {
 const rows=sample(1,true), peak=Math.max(...rows.map(r=>Math.abs(r.slip)));
 assert.ok(rows.some(r=>r.drifting)); assert.ok(peak>0 && peak<=Math.PI/12);
 assert.ok(Math.abs(rows[239].slip)<peak*.01);
});
test('relógio dos helicópteros avança com delta limitado', () => {
 let time=0; for(let i=0;i<600;i++)time=advanceHelicopterClock(time,1/60);
 assert.ok(Math.abs(time-10)<1e-9);
 assert.equal(advanceHelicopterClock(0,10),.05); assert.equal(advanceHelicopterClock(2,NaN),2);
});
