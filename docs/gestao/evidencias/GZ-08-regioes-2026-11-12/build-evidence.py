import difflib, hashlib, json, shutil, subprocess
from pathlib import Path

folder = Path(__file__).resolve().parent
root = folder.parents[3]
before = (folder/'baseline/environment.js').read_text(encoding='utf-8')
after = (root/'src/environment.js').read_text(encoding='utf-8')
diff = list(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/src/environment.js',tofile='b/src/environment.js'))
test = (root/'tests/regional-grounds.test.mjs').read_text(encoding='utf-8')
diff += difflib.unified_diff([],test.splitlines(True),fromfile='/dev/null',tofile='b/tests/regional-grounds.test.mjs')
(folder/'changes.diff').write_text(''.join(diff),encoding='utf-8')
records = json.loads((folder/'preserved-before.json').read_text(encoding='utf-8-sig'))
assert all(hashlib.sha256(Path(row['Path']).read_bytes()).hexdigest().upper()==row['Hash'] for row in records)
code = """import {createRegionalGrounds} from './src/environment.js';
const g=createRegionalGrounds(); console.log(JSON.stringify(g.children.map(m=>({name:m.name,
triangles:m.geometry.attributes.position.count/3,geometryBytes:Object.values(m.geometry.attributes).reduce((n,a)=>n+a.array.byteLength,0)}))));"""
geometry = json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=root,text=True))
summary = dict(preservedHashesMatch=True,geometry=geometry,triangles=sum(m['triangles'] for m in geometry),
               geometryBytes=sum(m['geometryBytes'] for m in geometry),materials=1,textures=0,
               environmentBytes=dict(before=(folder/'baseline/environment.js').stat().st_size,after=(root/'src/environment.js').stat().st_size),
               tests=dict(checkExit=0,testExit=0,passed=46,regressionBeforeExit=1),
               capture=dict(viewport=[1345,635],canvasCss=[1345,543],drawingBuffer=[941,380],pixelRatio=.7,
                            studio=dict(camera=[36,58,35],target=[-4,0,-5]),
                            coast=dict(camera=[145,40,35],target=[116,0,-15]),
                            lookout=dict(camera=[110,42,-83],target=[72,0,-123])))
(folder/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
