// Segurança no carregamento de modelos 3D: o carro e o piloto nunca podem ficar invisíveis por uma textura que falhou.
// Lógica sem DOM (testável em Node): tenta o GLB de novo uma vez e troca texturas quebradas por cor sólida.

// Caminho de textura: o GLTFLoader decodifica texturas embutidas pelo <img> (TextureLoader), que não faz fetch do blob.
// O ImageBitmapLoader (padrão no Chrome) faz fetch do blob e falha de forma intermitente no reload.
globalThis.__gltfForceImageElement = true;

export async function loadModelSafely(loader, url, { retries = 1, delay = 400, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), log = console } = {}) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await loader.loadAsync(url);
    } catch (error) {
      lastError = error;
      log.warn?.(`[modelo] ${url}: tentativa ${attempt + 1} falhou (${error?.message ?? error})`);
      if (attempt < retries) await sleep(delay);
    }
  }
  throw lastError;
}

const TEXTURE_SLOTS = ['map', 'normalMap', 'emissiveMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'alphaMap'];

// Textura sem imagem (falha de decodificação) vira "sem textura": o material continua visível com a cor base.
export function repairMaterials(root) {
  let repaired = 0;
  const seen = new Set();
  root.traverse(object => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || seen.has(material)) continue;
      seen.add(material);
      for (const slot of TEXTURE_SLOTS) {
        const texture = material[slot];
        if (texture && !texture.image) { material[slot] = null; material.needsUpdate = true; repaired++; }
      }
    }
  });
  return repaired;
}
