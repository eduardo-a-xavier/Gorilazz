from pathlib import Path
root = Path(__file__).resolve().parents[4]
path = root/'index.html'
html = path.read_bytes().decode('utf-8')
replacements = {
  'aria-label="Rádio da viagem"': 'aria-label="Kong FM: áudio local"',
  '<span>Kong FM</span>': '<span>Kong FM · áudio local</span>',
  'aria-label="Tocar ou pausar rádio"': 'aria-label="Tocar ou pausar Kong FM" aria-describedby="kong-fm-help"',
  '>Carregar músicas</button>': '>Escolher áudio do aparelho</button>',
  '<a id="road-radio-listen" href="#radio">Clipe oficial ↗</a>': '<a id="road-radio-listen" href="#radio">Ver clipes do Gorillaz ↓</a><p id="kong-fm-help">Toca aqui: dois instrumentais do projeto ou seus arquivos de áudio. Clipes do Gorillaz ficam na seção abaixo.</p><p id="road-radio-status" role="status"></p>',
  'TRANSMISSÃO DIRETA DE KONG STUDIOS / <span id="track-number">': 'CLIPES DO GORILLAZ · YOUTUBE / <span id="track-number">',
  '<button id="play-track">▶ ABRIR CLIPE</button>': '<button id="play-track">▶ VER CLIPE DO YOUTUBE</button>',
  '>OUVIR NO YOUTUBE ↗</a>': '>ABRIR NO YOUTUBE ↗</a>',
  'Você escolhe quando ouvir. O clipe usa YouTube e requer internet.': 'Clipe do YouTube nesta página. Precisa de internet e reprodução manual.',
}
for before, after in replacements.items():
    assert html.count(before) == 1, before
    html = html.replace(before,after)
path.write_bytes(html.encode('utf-8'))
