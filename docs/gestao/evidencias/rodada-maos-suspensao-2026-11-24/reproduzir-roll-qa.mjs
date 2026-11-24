import { readFileSync, writeFileSync } from 'node:fs';
import { createVehicleMotion, updateVehicleMotion } from '../../../../src/vehicle-motion.js';
const base = JSON.parse(readFileSync(new URL('./telemetria_suspensao_completa.json',import.meta.url),'utf8'));
const state = createVehicleMotion();
const frames = base.frames.map(f => {
  updateVehicleMotion(state, {steering:f.steering,speed:f.speed,acceleration:f.accel,surface:f.surface}, f.dt);
  return {t:f.t,dt:f.dt,speed:f.speed,steering:f.steering,rollOriginal:f.roll,rollReproduzido:state.roll};
});
const peak = f => Math.max(...frames.map(x=>Math.abs(f(x))))*180/Math.PI;
const result={metodo:'Reprodução offline dos sinais capturados pela QA; não é nova condução nem medição de FPS.',picoAnteriorGraus:peak(f=>f.rollOriginal),picoReproduzidoGraus:peak(f=>f.rollReproduzido),frames};
writeFileSync(new URL('./roll-reproducao-telemetria-qa.json',import.meta.url),JSON.stringify(result,null,2));
console.log(JSON.stringify({picoAnteriorGraus:result.picoAnteriorGraus,picoReproduzidoGraus:result.picoReproduzidoGraus}));
