import * as THREE from './vendor/three.module.min.js';

// Original baked surfaces. Textures are local and share a small material cache.
export function createSurfaceLibrary() {
  const loader = new THREE.TextureLoader(), cache = new Map(), images = new Map();
  // Uma imagem por URL: cada combinação de repetição usa um clone, que compartilha o mesmo Source
  // (e a mesma textura na GPU) mas mantém repeat próprio. Um clone criado antes do fim do download
  // é marcado para envio à GPU assim que a imagem chega. clone() já chama needsUpdate; sem imagem isso
  // geraria o aviso "Texture marked for update but no image data found", então a versão volta a 0.
  function sharedTexture(url, repeatX, repeatY) {
    let entry = images.get(url), texture;
    if (!entry) {
      entry = { loaded: false, clones: [] };
      // WebP lossless primeiro (~36% menor); se falhar, volta ao PNG original sem mudar o material.
      const markLoaded = () => { entry.loaded = true; for (const clone of entry.clones) clone.needsUpdate = true; };
      texture = entry.base = loader.load(url.replace(/\.png$/, '.webp'), markLoaded, undefined, () => {
        loader.load(url, source => { entry.base.image = source.image; entry.base.needsUpdate = true; markLoaded(); });
      });
      images.set(url, entry);
    } else {
      texture = entry.base.clone();
      if (!entry.loaded) { texture.version = 0; entry.clones.push(texture); }
    }
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(repeatX, repeatY);
    return texture;
  }
  const definitions = {
    asphalt: ['#dfe3dc', .93], earth: ['#b9b19b', 1], grass: ['#b6c69d', 1],
    plaster: ['#e3dfca', .94], brick: ['#dbc2ad', .97], wood: ['#d6c7a1', .91],
    foliage: ['#c1d0a7', .94], roof: ['#b3c6bd', .85],
  };
  return {
    get(name, repeatX = 1, repeatY = repeatX) {
      const key = `${name}/${repeatX}/${repeatY}`;
      if (cache.has(key)) return cache.get(key);
      const [color, roughness] = definitions[name] || definitions.plaster;
      const map = sharedTexture(`./assets/materials/${name}.png`, repeatX, repeatY); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
      const result = new THREE.MeshStandardMaterial({map, color, roughness, metalness:0});
      if (name !== 'brick') {
        const normalMap = sharedTexture(`./assets/materials/${name}-normal.png`, repeatX, repeatY);
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
