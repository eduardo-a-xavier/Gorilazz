# Reduz o GLB bruto do TRELLIS sem ferramenta externa: textura 512x512 PNG -> JPEG (qualidade 88),
# índices uint32 -> uint16 (2.194 vértices), mesma malha e mesmo UV. Não altera a geometria.
# Uso: python -I reduzir-glb.py trellis-bruto.glb motorista-trellis.glb
import io, json, struct, sys
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
b = open(src, 'rb').read()
clen, _ = struct.unpack('<I4s', b[12:20]); j = json.loads(b[20:20 + clen])
blen, _ = struct.unpack('<I4s', b[20 + clen:28 + clen]); blob = b[28 + clen:28 + clen + blen]
acc, views = j['accessors'], j['bufferViews']
prim = j['meshes'][0]['primitives'][0]
part = lambda v: blob[views[v]['byteOffset']:views[v]['byteOffset'] + views[v]['byteLength']]
ia, pa, ua = acc[prim['indices']], acc[prim['attributes']['POSITION']], acc[prim['attributes']['TEXCOORD_0']]
idx = struct.unpack('<%dI' % ia['count'], part(ia['bufferView']))
assert max(idx) < 65536
idx16 = struct.pack('<%dH' % len(idx), *idx)
pos, uv = part(pa['bufferView']), part(ua['bufferView'])
png = part(j['images'][0]['bufferView'])
im = Image.open(io.BytesIO(png)).convert('RGB'); assert im.size == (512, 512), im.size
out = io.BytesIO(); im.save(out, 'JPEG', quality=88, optimize=True); jpg = out.getvalue()
pad = lambda d: d + b'\0' * (-len(d) % 4)
chunks = [pad(idx16), pad(pos), pad(uv), pad(jpg)]; off = 0; nv = []
lens = [len(idx16), len(pos), len(uv), len(jpg)]
for c, n in zip(chunks, lens): nv.append({'buffer': 0, 'byteOffset': off, 'byteLength': n}); off += len(c)
nv[0]['target'] = 34963; nv[1]['target'] = 34962; nv[2]['target'] = 34962
j['bufferViews'] = nv; ia['bufferView'] = 0; ia['componentType'] = 5123; pa['bufferView'] = 1; ua['bufferView'] = 2
j['images'][0] = {'bufferView': 3, 'mimeType': 'image/jpeg'}
j['buffers'] = [{'byteLength': off}]
j['asset']['generator'] = 'TRELLIS (trimesh) + reduzir-glb.py'
js = json.dumps(j, separators=(',', ':')).encode(); js += b' ' * (-len(js) % 4)
body = b''.join(chunks)
glb = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(body)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(body), b'BIN\0') + body
open(dst, 'wb').write(glb)
print({'bytes': len(glb), 'triangles': len(idx) // 3, 'vertices': pa['count'], 'textura': '512x512 JPEG', 'jpeg_bytes': len(jpg)})
