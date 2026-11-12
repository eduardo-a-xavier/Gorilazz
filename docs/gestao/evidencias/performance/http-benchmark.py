"""Transferência integral localhost (servidor já quente); não mede parsing/render."""
import json, time, urllib.request
from pathlib import Path
OUT = Path(__file__).resolve().parent
inventory = json.loads((OUT/'inventory.json').read_text(encoding='utf-8'))
paths = [m['path'] for m in inventory['models'] if m['path'] not in
         ('assets/models/gorillaz-phase7.glb', 'assets/models/kenney-suv.glb', 'assets/models/kenney-suv-luxury.glb')]
paths += [t['path'] for t in inventory['textures'] if '/materials/' in t['path'] or '/portraits/' in t['path']]
results = []
for repeat in range(3):
    for path in paths:
        start = time.perf_counter()
        with urllib.request.urlopen('http://127.0.0.1:3000/'+path, timeout=10) as response:
            body = response.read()
            results.append(dict(repeat=repeat+1, path=path, status=response.status, bytes=len(body),
                                ms=(time.perf_counter()-start)*1000, etag=response.headers.get('ETag')))
(OUT/'http.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
print(f'{len(results)} respostas integrais; sem If-None-Match; servidor não reiniciado')
