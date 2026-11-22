import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Variante B do motorista (diagnóstico ?motorista=trellis): GLB gerado com o TRELLIS e reduzido.
test('GLB do motorista TRELLIS respeita o orçamento e está nas rotas do servidor', async () => {
  const bytes = await readFile(new URL('../assets/models/motorista-trellis.glb', import.meta.url));
  assert.equal(bytes.toString('latin1', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.ok(bytes.length <= 300 * 1024, `arquivo com ${bytes.length} bytes`);
  const jsonLength = bytes.readUInt32LE(12), json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  assert.equal(json.meshes.length, 1);
  assert.equal(json.materials.length, 1);
  assert.equal(json.images.length, 1);
  assert.equal(json.images[0].mimeType, 'image/jpeg');
  const triangles = json.accessors[json.meshes[0].primitives[0].indices].count / 3;
  assert.ok(triangles > 0 && triangles <= 3000, `${triangles} triângulos`);
  assert.ok(!json.buffers.some(buffer => buffer.uri), 'sem arquivos externos');
  // Dimensões da textura JPEG (marcador SOF): no máximo 512 × 512.
  const view = json.bufferViews[json.images[0].bufferView], binary = 20 + jsonLength + 8 + view.byteOffset;
  const jpeg = bytes.subarray(binary, binary + view.byteLength);
  let at = 2, size = null;
  while (at < jpeg.length) {
    const marker = jpeg[at + 1], length = jpeg.readUInt16BE(at + 2);
    if (marker >= 0xc0 && marker <= 0xc2) { size = [jpeg.readUInt16BE(at + 7), jpeg.readUInt16BE(at + 5)]; break; }
    at += 2 + length;
  }
  assert.ok(size && size[0] <= 512 && size[1] <= 512, `textura ${size}`);
  const server = await readFile(new URL('../server.mjs', import.meta.url), 'utf8');
  assert.match(server, /'\/assets\/models\/motorista-trellis\.glb'/);
});
