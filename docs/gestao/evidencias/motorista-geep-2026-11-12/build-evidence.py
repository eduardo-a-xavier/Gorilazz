import difflib, hashlib, json, subprocess
from pathlib import Path

folder = Path(__file__).resolve().parent
root = folder.parents[3]
before = (folder/'baseline/scene.js').read_text(encoding='utf-8')
after = (root/'src/scene.js').read_text(encoding='utf-8')
diff = list(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/src/scene.js',tofile='b/src/scene.js'))
test = (root/'tests/driver.test.mjs').read_text(encoding='utf-8')
diff += difflib.unified_diff([],test.splitlines(True),fromfile='/dev/null',tofile='b/tests/driver.test.mjs')
(folder/'changes.diff').write_text(''.join(diff),encoding='utf-8')
records = json.loads((folder/'preserved-before.json').read_text(encoding='utf-8-sig'))
assert all(hashlib.sha256(Path(row['Path']).read_bytes()).hexdigest().upper()==row['Hash'] for row in records)
start, end = '  function installVehicle(gltf, kind) {', '  async function loadVehicle()'
assert before.split(start,1)[1].split(end,1)[0] == after.split(start,1)[1].split(end,1)[0]
start, end = '  const car = new THREE.Group();', '  // Motorista:'
assert before.split(start,1)[1].split(end,1)[0] == after.split(start,1)[1].split(end,1)[0]
code = """import * as T from './src/vendor/three.module.min.js';import {createDriver} from './src/scene.js';
const colors=new Map(), material=c=>{if(!colors.has(c))colors.set(c,new T.MeshStandardMaterial({color:c}));return colors.get(c)};
const {driver}=createDriver(material), geometries=new Set();let meshes=0,triangles=0;
driver.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;geometries.add(o.geometry)}});
console.log(JSON.stringify({meshes,triangles,materials:colors.size,uniqueGeometries:geometries.size,geometryBufferBytes:[...geometries].reduce((n,g)=>n+(g.index?.array.byteLength??0)+Object.values(g.attributes).reduce((m,a)=>m+a.array.byteLength,0),0)}));"""
geometry = json.loads(subprocess.check_output(['node','--input-type=module','-e',code],cwd=root,text=True))
summary = dict(preservedHashesMatch=True,carConstructionAndInstallPreserved=True,
               before=dict(meshes=17,triangles=1428,geometryBufferBytes=44472,sceneBytes=(folder/'baseline/scene.js').stat().st_size),
               after=dict(**geometry,sceneBytes=(root/'src/scene.js').stat().st_size,newAssetFiles=0),
               tests=dict(checkExit=0,testExit=0,passed=49,regressionBeforeExit=1),
               capture=dict(viewport=[1345,635],buffer=[1345,543],fov=35,pixelRatio=1,
                            driverLocalCamera=[-1.45,2.95,-2.25],driverLocalTarget=[0,1.9,-.02],
                            worldCamera=[-15.442696109087981,4.097083338894441,-22.91715896608864],
                            driverSeatPosition=[-.6213311375716657,.49808333889444034,.41534367008364126],scale=1.22))
(folder/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
print(json.dumps(summary,indent=2))
