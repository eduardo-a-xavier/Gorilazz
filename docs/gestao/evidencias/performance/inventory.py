"""Inventário local reproduzível; não altera assets. Python + Pillow."""
import io, json, struct
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
OUT = Path(__file__).resolve().parent
models, textures = [], []
for path in sorted((ROOT / 'assets').rglob('*')):
    if not path.is_file():
        continue
    rel = path.relative_to(ROOT).as_posix()
    if path.suffix.lower() in ('.png', '.jpg', '.jpeg', '.webp'):
        with Image.open(path) as image:
            w, h = image.size
            textures.append(dict(path=rel, bytes=path.stat().st_size, width=w, height=h,
                                 rgba8_mips_estimate=w*h*4*4/3))
    if path.suffix.lower() != '.glb':
        continue
    data = path.read_bytes()
    length, kind = struct.unpack_from('<II', data, 12)
    gltf = json.loads(data[20:20+length])
    pos = 20 + length
    binary = b''
    if pos < len(data):
        bin_len, _ = struct.unpack_from('<II', data, pos)
        binary = data[pos+8:pos+8+bin_len]
    images = []
    for image in gltf.get('images', []):
        if 'bufferView' not in image:
            images.append(dict(uri=image.get('uri')))
            continue
        view = gltf['bufferViews'][image['bufferView']]
        offset = view.get('byteOffset', 0)
        with Image.open(io.BytesIO(binary[offset:offset+view['byteLength']])) as im:
            w, h = im.size
            images.append(dict(bytes=view['byteLength'], width=w, height=h,
                               rgba8_mips_estimate=w*h*4*4/3))
    primitives = [p for mesh in gltf.get('meshes', []) for p in mesh['primitives']]
    triangles = sum(gltf['accessors'][p.get('indices', p['attributes']['POSITION'])]['count']//3
                    for p in primitives if p.get('mode', 4) == 4)
    models.append(dict(path=rel, bytes=len(data), meshes=len(gltf.get('meshes', [])),
                       primitives=len(primitives), triangles=triangles, images=images))
(OUT/'inventory.json').write_text(json.dumps(dict(models=models, textures=textures), indent=2), encoding='utf-8')
print(f'{len(models)} GLBs, {len(textures)} imagens externas; inventory.json gravado')
