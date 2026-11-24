import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineSound } from '../src/discovery-sound.js';
function param() { return {value:0,calls:[],setTargetAtTime(...v){this.calls.push(v);}}; }
function node() { return {frequency:param(),gain:param(),connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}}; }
test('motor aumenta frequência com velocidade e silencia por rampa', () => {
 const osc=node(), filter=node(), gain=node();
 const context={currentTime:10,destination:{},createOscillator:()=>osc,createBiquadFilter:()=>filter,createGain:()=>gain};
 const engine=createEngineSound(context); assert.equal(osc.started,true); assert.equal(gain.gain.value,0);
 engine.update(0,true); engine.update(20,true); assert.ok(osc.frequency.calls[1][0]>osc.frequency.calls[0][0]);
 engine.update(0,false); assert.equal(gain.gain.calls.at(-1)[0],0); engine.dispose(); assert.equal(osc.stopped,true);
});
