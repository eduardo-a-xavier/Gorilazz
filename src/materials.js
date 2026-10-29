import * as THREE from './vendor/three.module.min.js';

// Original baked surfaces. Textures are local and share a small material cache.
export function createSurfaceLibrary() {
  const loader = new THREE.TextureLoader(), cache = new Map();
  const definitions = {
    asphalt: ['#9baba3', .96], earth: ['#b9b19b', 1], grass: ['#b6c69d', 1],
    plaster: ['#e3dfca', .94], brick: ['#dbc2ad', .97], wood: ['#d6c7a1', .91],
    foliage: ['#c1d0a7', .94], roof: ['#b3c6bd', .85],
  };
  return {
    get(name, repeatX = 1, repeatY = repeatX) {
      const key = `${name}/${repeatX}/${repeatY}`;
      if (cache.has(key)) return cache.get(key);
      const [color, roughness] = definitions[name] || definitions.plaster;
      const map = loader.load(`/assets/materials/${name}.png`); map.colorSpace = THREE.SRGBColorSpace;
      map.wrapS = map.wrapT = THREE.RepeatWrapping; map.repeat.set(repeatX, repeatY); map.anisotropy = 4;
      const result = new THREE.MeshStandardMaterial({map, color, roughness, metalness:0});
      if (name !== 'brick') {
        const normalMap = loader.load(`/assets/materials/${name}-normal.png`);
        normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping; normalMap.repeat.copy(map.repeat);
        result.normalMap = normalMap; result.normalScale.set(.16,.16);
      }
      cache.set(key,result); return result;
    },
  };
}

export function letteringTexture(lines, {background='#242b28', color='#e6dfc5', width=1024, height=384, accent='#df9ca9'} = {}) {
  const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
  const ctx=canvas.getContext('2d');ctx.fillStyle=background;ctx.fillRect(0,0,width,height);
  ctx.strokeStyle=accent;ctx.lineWidth=3;ctx.strokeRect(18,18,width-36,height-36);
  ctx.fillStyle=color;ctx.textAlign='center';
  lines.split('|').forEach((line,i,array)=>{
    ctx.font=`${i===0?'bold':'normal'} ${array.length>1?(i===0?height*.27:height*.13):height*.3}px monospace`;
    ctx.fillText(line,width/2,array.length===1?height*.6:height*(i===0?.48:.77),width*.90);
  });
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;return texture;
}
