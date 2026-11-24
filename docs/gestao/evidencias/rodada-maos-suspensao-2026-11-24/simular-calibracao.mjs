import { createVehicleMotion, updateVehicleMotion } from '../../../../src/vehicle-motion.js';
import { writeFileSync } from 'node:fs';
const cases = {
  arrancada: t => ({ speed: Math.min(15,t*6), steering:0, acceleration:t<2.5?6:0, surface:'asfalto' }),
  frenagem: t => ({ speed: Math.max(0,18-t*12), steering:0, acceleration:t<1.5?-12:0, surface:'asfalto' }),
  curva: t => ({ speed:14, steering:t<2?.4:0, acceleration:0, surface:'asfalto' }),
  emenda: t => ({ speed:14, steering:0, acceleration:0, surface:t<1?'asfalto':'terra' }),
  passeio: t => ({ speed:t<1?t*6:t<3?6:Math.max(0,6-(t-3)*6), steering:0, acceleration:t<1?6:t<3?0:t<4?-6:0, surface:'asfalto' }),
};
const result={metodo:'Simulação determinística dos sinais de entrada; não é condução real nem FPS.',dt:1/60,cenarios:{}};
for (const [name,input] of Object.entries(cases)) {
 const state=createVehicleMotion(),frames=[];
 for(let i=0;i<360;i++){const t=i/60,v=input(t);updateVehicleMotion(state,v,1/60);frames.push({t, ...v,pitch:state.pitch,roll:state.roll,height:state.height,wheel:state.wheel});}
 result.cenarios[name]={maxPitchDeg:Math.max(...frames.map(f=>Math.abs(f.pitch)))*180/Math.PI,maxRollDeg:Math.max(...frames.map(f=>Math.abs(f.roll)))*180/Math.PI,maxHeightM:Math.max(...frames.map(f=>f.height)),rmsHeightM:Math.sqrt(frames.reduce((sum,f)=>sum+f.height*f.height,0)/frames.length),frames};
}
writeFileSync(new URL('./suspensao-calibrada-simulacao.json',import.meta.url),JSON.stringify(result,null,2));
for(const [name,c] of Object.entries(result.cenarios)) console.log(name,JSON.stringify({pitch:c.maxPitchDeg,roll:c.maxRollDeg,height:c.maxHeightM,rms:c.rmsHeightM}));

