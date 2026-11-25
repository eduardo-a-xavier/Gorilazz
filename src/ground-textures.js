// Texturas procedurais leves para o chão (sem arquivo novo): ladrilho de calçada com rejunte e variação de tom,
// e variação determinística de cor por triângulo para grama e praças. Puro (sem DOM), testável em Node.

// Padrão de ladrilho RGBA: placas de `slab` px com rejunte escuro de `grout` px, tom levemente variável por placa.
export function slabPixels(size = 256, slabs = 4, grout = 3) {
  const data = new Uint8Array(size * size * 4);
  const step = size / slabs;
  let seed = 9173;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const tones = Array.from({ length: slabs * slabs }, () => 0.94 + rnd() * 0.10);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 4;
    const cx = Math.floor(x / step), cy = Math.floor(y / step);
    const lx = x % step, ly = y % step;
    const onJoint = lx < grout || ly < grout;
    // Textura fina: pequenas manchas determinísticas dentro de cada placa.
    const speck = 0.97 + 0.06 * (((x * 73856093) ^ (y * 19349663)) % 97) / 97;
    const tone = onJoint ? 0.66 : tones[cy * slabs + cx] * speck;
    data[i] = Math.round(232 * tone); data[i + 1] = Math.round(226 * tone); data[i + 2] = Math.round(212 * tone); data[i + 3] = 255;
  }
  return data;
}

// Fator de tom determinístico em [1 - amp, 1 + amp] para um triângulo de coordenadas (x, z).
export function toneJitter(x, z, amp = 0.05) {
  const h = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  return 1 + (((h - Math.floor(h)) * 2) - 1) * amp;
}

export function createSlabTexture(THREE) {
  const size = 256, data = slabPixels(size, 4, 3);
  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.needsUpdate = true;
  return texture;
}
