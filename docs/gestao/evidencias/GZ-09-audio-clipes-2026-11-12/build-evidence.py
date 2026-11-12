import difflib, hashlib, json
from pathlib import Path

folder = Path(__file__).resolve().parent
root = folder.parents[3]
names = ['index.html','src/app.js','src/local-radio.js','src/world.css']
diff = []
sizes = {}
for name in names:
    original = folder/'baseline'/Path(name).name
    current = root/name
    before = original.read_text(encoding='utf-8')
    after = current.read_text(encoding='utf-8')
    diff += difflib.unified_diff(before.splitlines(True),after.splitlines(True),fromfile='a/'+name,tofile='b/'+name)
    sizes[name] = dict(before=original.stat().st_size,after=current.stat().st_size)
(folder/'changes.diff').write_text(''.join(diff),encoding='utf-8')
records = json.loads((folder/'preserved-before.json').read_text(encoding='utf-8-sig'))
assert all(hashlib.sha256(Path(row['Path']).read_bytes()).hexdigest().upper()==row['Hash'] for row in records)
before = (folder/'baseline/index.html').read_bytes().decode('utf-8')
after = (root/'index.html').read_bytes().decode('utf-8')
marker = 'id="backstage"'
assert before[before.index(marker):] == after[after.index(marker):]
before_app = (folder/'baseline/app.js').read_text(encoding='utf-8')
after_app = (root/'src/app.js').read_text(encoding='utf-8')
assert [line for line in before_app.splitlines() if 'Ato espacial:' in line] == [line for line in after_app.splitlines() if 'Ato espacial:' in line]
summary = dict(preservedHashesMatch=True,creditsHtmlTailPreserved=True,previousJournalChangePreserved=True,fileSizes=sizes,
               validation=dict(checkExit=0,testExit=0,testsPassed=46),
               browser=dict(initialVideoFrames=0,localPlayLabel='Pausar Kong FM',localPauseLabel='Tocar Kong FM aqui',
                            localTrack='Concreto',videoFramesWhileLocalPlaying=0,
                            embed='https://www.youtube-nocookie.com/embed/1V_xRb0x9aw',embedAutoplayParameter=False,
                            videoFramesAfterClose=0,buttonAfterClose='▶ VER CLIPE DO YOUTUBE',
                            searchTrack='Revolving Doors',searchOpenedNewTab=True,
                            searchUrl='https://www.youtube.com/results?search_query=Gorillaz+Revolving+Doors+official',
                            hudLinkDestination='#radio',mobileLinkVisible=True,mobileHorizontalOverflow=False),
               limitations=['Reprodução completa do YouTube não confirmada; googlevideo/doubleclick com ERR_NAME_NOT_RESOLVED e fonte externa com ERR_CACHE_MISS.',
                            'Não foram testados importação de arquivo real, arquivo inválido, Android físico, leitor de tela ou controles 3D da cabine.'])
(folder/'summary.json').write_text(json.dumps(summary,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(summary,indent=2,ensure_ascii=True))
