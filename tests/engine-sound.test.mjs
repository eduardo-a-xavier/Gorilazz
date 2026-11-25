import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngineSound, engineRpmForSpeed, spatialAttenuation } from '../src/discovery-sound.js';
function param() { return {value:0,calls:[],setTargetAtTime(...v){this.calls.push(v);}}; }
function node() { return {frequency:param(),gain:param(),connect(){},disconnect(){},start(){this.started=true;},stop(){this.stopped=true;}}; }
test('motor aumenta frequência com velocidade e silencia por rampa', () => {
 const osc=node(), filter=node(), gain=node();
 const context={currentTime:10,destination:{},createOscillator:()=>osc,createBiquadFilter:()=>filter,createGain:()=>gain};
 const engine=createEngineSound(context); assert.equal(osc.started,true); assert.equal(gain.gain.value,0);
 engine.update(0,true); engine.update(20,true); assert.ok(osc.frequency.calls[1][0]>osc.frequency.calls[0][0]);
 engine.update(0,false); assert.equal(gain.gain.calls.at(-1)[0],0); engine.dispose(); assert.equal(osc.stopped,true);
});

test('transição de marchas/RPM e atenuação espacial de pombos e caixas de palco respeitam distância, rádio e mute', () => {
 assert.equal(engineRpmForSpeed(0).gear, 1);
 assert.equal(engineRpmForSpeed(30).gear, 2);
 assert.equal(engineRpmForSpeed(55).gear, 3);
 assert.equal(engineRpmForSpeed(80).gear, 4);
 assert.ok(spatialAttenuation({ x: 0, z: 0 }, { x: 0, z: 0 }, 30) === 1);
 assert.ok(spatialAttenuation({ x: 15, z: 0 }, { x: 0, z: 0 }, 30) === .25);
 assert.equal(spatialAttenuation({ x: 35, z: 0 }, { x: 0, z: 0 }, 30), 0);
 const oscs = [], gains = [], filters = [];
 const context = {
   currentTime: 5,
   destination: {},
   createOscillator: () => { const n = node(); oscs.push(n); return n; },
   createBiquadFilter: () => { const n = node(); filters.push(n); return n; },
   createGain: () => { const n = node(); gains.push(n); return n; },
 };
 const engine = createEngineSound(context, { plazas: [{ x: 0, z: -5 }], stages: [{ x: 40, z: -100 }] });
 assert.equal(oscs.length, 5, 'fundamental + sub + harmônico + palco + pombos');
 engine.update(12, true, { x: 0, z: -5, radioPlaying: false });
 const stageGain = gains[3], birdGain = gains[4];
 assert.ok(birdGain.gain.calls.at(-1)[0] > 0, 'pombos audíveis perto da praça');
 assert.equal(stageGain.gain.calls.at(-1)[0], 0, 'palco silencioso longe');
 engine.update(12, true, { x: 40, z: -100, radioPlaying: true });
 assert.ok(stageGain.gain.calls.at(-1)[0] > 0, 'caixas do palco audíveis perto do palco com ducking do rádio');
 engine.update(12, false, { x: 40, z: -100, radioPlaying: false });
 assert.equal(stageGain.gain.calls.at(-1)[0], 0, 'mute global zera som espacial dos palcos');
 assert.equal(birdGain.gain.calls.at(-1)[0], 0, 'mute global zera som ambiente dos pombos');
 engine.dispose();
});
