import difflib, json
from pathlib import Path

folder = Path(__file__).resolve().parent
root = folder.parents[3]
names = ['src/environment.js','index.html','server.mjs','tests/server.test.mjs','tests/frequency-garden.test.mjs']
diff = []
sizes = {}
for name in names:
    path = root / name
    original = folder/'baseline'/path.name
    before = original.read_text(encoding='utf-8') if original.exists() else ''
    after = path.read_text(encoding='utf-8')
    diff.extend(difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+name,tofile='b/'+name))
    sizes[name] = dict(before=original.stat().st_size if original.exists() else 0,after=path.stat().st_size)
(folder/'changes.diff').write_text(''.join(diff),encoding='utf-8')
hash_before = json.loads((folder/'preserved-before.json').read_text(encoding='utf-8-sig'))
hash_after = json.loads((folder/'preserved-after.json').read_text(encoding='utf-8-sig'))
old_index = (folder/'baseline/index.html').read_text(encoding='utf-8')
new_index = (root/'index.html').read_text(encoding='utf-8')
old_credit = old_index.split('<div class="visual-credits">',1)[1].split('\n',1)[0]
new_credit = new_index.split('<div class="visual-credits">',1)[1].split('\n',1)[0]
old_credit = old_credit.replace('<a href="/assets/environment/noodle-diorama.glb" download>BAIXAR DIORAMA NOODLE ↓</a>','<span>DIORAMA ANTERIOR / DOWNLOAD RETIRADO</span>')
summary = dict(preservedHashesMatch=hash_before==hash_after,creditBlockUnchangedExceptDownload=old_credit==new_credit,
               fileSizes=sizes,geometry=dict(triangles=1396,meshes=12,uniqueGeometries=4,materials=4,bufferBytes=19432),
               original=dict(bytes=1251404,triangles=48000),
               browser=dict(oldModelPresent=False,oldAssetRequests=0,oldDownloadLinks=0,gardenPresent=True,
                            canvas=[941,380],camera=[107,10,-131],lookAt=[97,5.3,-144]),
               sharedServerOldRoute=dict(port=3000,pid=19020,status=200,bytes=1251404),
               tests=dict(checkExit=0,testExit=0,passed=45,baselineRegressionExit=1))
(folder/'summary.json').write_text(json.dumps(summary,indent=2),encoding='utf-8')
assert summary['preservedHashesMatch']
assert summary['creditBlockUnchangedExceptDownload']
print(json.dumps(summary,indent=2))
