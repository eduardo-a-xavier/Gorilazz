"""9 descobertas pelo E (sem passeio) no Chrome real: cada parada soma uma vez, repetir não soma, mapa mostra ✓, persiste após recarregar.
Uso: counter_check.py OUT_DIR"""
import json, sys
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
SPOTS = [  # {id, x, z}: posição do carro (parado) de onde o E alcança a parada; calculada a partir de world-data
  {"id": "beginning", "x": -18, "z": -29}, {"id": "voices", "x": -100.4, "z": -89.5}, {"id": "genres", "x": -51.4, "z": -117.8},
  {"id": "demon-days", "x": 72.8, "z": -146.5}, {"id": "live", "x": 15.3, "z": -106.9},
  {"id": "explosao", "x": 15.91, "z": 2.22}, {"id": "plastic", "x": 87.75, "z": -68.86}, {"id": "hiato", "x": 8.02, "z": -164.44},
  {"id": "reinvencao", "x": -57.31, "z": -62.13},
]
RES = {'passos': [], 'erros': []}
def count(page): return page.evaluate("() => window.__gorilazz.stopProgress.count")
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    page = b.new_page(viewport={'width': 1440, 'height': 900})
    page.on('pageerror', lambda e: RES['erros'].append(f'pageerror {e}'))
    page.on('console', lambda m: RES['erros'].append(f'console {m.text}') if m.type == 'error' else None)
    page.on('response', lambda r: RES['erros'].append(f'HTTP {r.status} {r.url}') if r.status >= 400 else None)
    page.goto('http://localhost:3000/?perf'); page.wait_for_load_state('networkidle')
    page.evaluate("() => document.querySelector('#enter-world').click()"); page.wait_for_timeout(1500)
    page.evaluate("() => { const d = document.querySelector('#onboarding-dialog'); if (d?.open) document.querySelector('#onboarding-start').click(); }")
    prev = count(page)
    RES['inicio'] = prev
    for spot in SPOTS:
        page.evaluate(f"() => {{ const v = window.__gorilazz.vehicle; v.x = {spot['x']}; v.z = {spot['z']}; v.speed = 0; v.heading = 0; }}")
        page.wait_for_timeout(900)
        page.keyboard.press('e'); page.wait_for_timeout(900)
        now = count(page)
        dialogs = page.evaluate("() => [...document.querySelectorAll('dialog[open]')].map(d => d.id)")
        RES['passos'].append({'parada': spot['id'], 'contador_antes': prev, 'contador_depois': now, 'somou_uma_vez': now == prev + 1, 'dialogos': dialogs})
        prev = now
        page.keyboard.press('Escape'); page.wait_for_timeout(500)  # um Escape fecha só o modal; o segundo sairia do 3D
        RES['passos'][-1]['3d_depois_do_esc'] = page.evaluate("() => document.documentElement.classList.contains('mode-3d')")
    # repetir o E numa parada já contada não soma de novo
    page.evaluate(f"() => {{ const v = window.__gorilazz.vehicle; v.x = {SPOTS[0]['x']}; v.z = {SPOTS[0]['z']}; v.speed = 0; }}"); page.wait_for_timeout(900)
    page.keyboard.press('e'); page.wait_for_timeout(700); page.keyboard.press('Escape'); page.wait_for_timeout(400)
    RES['repeticao_nao_soma'] = count(page) == prev
    RES['hud_texto'] = page.evaluate("() => document.querySelector('#stops-count').textContent")
    # mapa completo (M): ✓ nas 9 paradas
    page.evaluate("() => { const o = document.querySelector('#full-map-overlay'); if (o) o.hidden = false; }"); page.wait_for_timeout(300)
    RES['mapa_marcas'] = page.evaluate("() => [...document.querySelectorAll('.tour-stops .dest-tag')].map(t => t.textContent).join('')")
    page.screenshot(path=str(out / 'mapa-9-de-9-1440x900.png'))
    page.evaluate("() => { const o = document.querySelector('#full-map-overlay'); if (o) o.hidden = true; }")
    page.screenshot(path=str(out / 'hud-9-de-9-1440x900.png'), clip={'x': 560, 'y': 70, 'width': 320, 'height': 60})
    # persistência
    page.reload(); page.wait_for_load_state('networkidle'); page.wait_for_timeout(1200)
    page.wait_for_function("() => window.__gorilazz", timeout=60000)
    RES['apos_recarregar'] = count(page)
    RES['hud_apos_recarregar'] = page.evaluate("() => document.querySelector('#stops-count').textContent")
    b.close()
RES['ok_todas_somaram_uma_vez'] = all(s['somou_uma_vez'] for s in RES['passos'])
print(json.dumps(RES, ensure_ascii=False, indent=1))
