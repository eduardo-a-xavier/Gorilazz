"""Gráficos reproduzíveis a partir das medições e do inventário. Requer matplotlib."""
import json, statistics
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
OUT = Path(__file__).resolve().parent
data = json.loads((OUT/'measurements.json').read_text())
inventory = json.loads((OUT/'inventory.json').read_text())
http = json.loads((OUT/'http.json').read_text())
plt.rcParams.update({'font.size': 10})
fig, axes = plt.subplots(2, 2, figsize=(15, 11))
runs = data['runs']
names = [r['label'] for r in runs]
axes[0,0].barh(names, [r['fps'] for r in runs], color='#247b9e')
axes[0,0].set(xlabel='Quadros renderizados / segundo', title='Sessão local compartilhada: FPS observado')
axes[0,0].invert_yaxis()
axes[0,1].barh(names, [r['calls'][1] for r in runs], color='#c66f28')
axes[0,1].set(xlabel='Chamadas por quadro (mediana; inclui sombras e pós)', title='Vista aérea aumenta as chamadas de desenho')
axes[0,1].invert_yaxis()
models = sorted(inventory['models'], key=lambda m:m['bytes'])
axes[1,0].barh([Path(m['path']).name for m in models], [m['bytes']/2**20 for m in models],color='#247b9e')
axes[1,0].set(xlabel='MiB em disco', title='GLBs: original e alternativas também inventariados')
axes[1,1].barh([Path(m['path']).name for m in models], [sum(i.get('rgba8_mips_estimate',0) for i in m['images'])/2**20 for m in models],color='#6a965a')
axes[1,1].set(xlabel='MiB estimados (RGBA8 + mipmaps)', title='Estimativa das imagens embutidas; não é VRAM medida')
for ax in axes.flat:
    ax.spines[['top','right']].set_visible(False)
fig.tight_layout()
fig.savefig(OUT/'overview.png',dpi=160)
fig.savefig(OUT/'overview.svg')
fig, axes = plt.subplots(1, 2, figsize=(14,5))
for r in runs[:2]:
    axes[0].plot(range(1,len(r['bins'])+1),r['bins'],marker='o',label=r['label'])
axes[0].set(xlabel='Segundo da amostra',ylabel='Renders observados na janela de 1 s',title='Variação entre duas amostras desktop',ylim=(0,None))
axes[0].legend()
axes[1].barh(names, [r['heap'][1]/2**20 for r in runs],color='#6a965a')
axes[1].set(xlabel='MiB de heap JavaScript (mediana)',title='Heap não inclui memória GPU; coleta de lixo varia')
axes[1].invert_yaxis()
fig.tight_layout();fig.savefig(OUT/'frames-memory.png',dpi=160)
summary=[]
for rep in (1,2,3):
    rows=[r for r in http if r['repeat']==rep]
    summary.append(dict(repeat=rep,bytes=sum(r['bytes'] for r in rows),sumMs=sum(r['ms'] for r in rows),medianRequestMs=statistics.median(r['ms'] for r in rows)))
(OUT/'http-summary.json').write_text(json.dumps(summary,indent=2))
fig, ax = plt.subplots(figsize=(8,4))
ax.bar([str(s['repeat']) for s in summary], [s['sumMs'] for s in summary], color='#247b9e')
ax.set(xlabel='Rodada (25 assets por rodada)', ylabel='Soma dos tempos sequenciais (ms)',
       title='HTTP IPv4 local: corpos integrais, servidor já quente')
fig.tight_layout();fig.savefig(OUT/'http-assets.png',dpi=160)
print(summary)
