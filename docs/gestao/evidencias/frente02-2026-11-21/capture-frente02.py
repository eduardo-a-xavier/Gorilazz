"""Captura e validacao automatizada da Frente 02 (Playwright + Chromium WebGL2 na porta 3000)."""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
base = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:3000'
report = {'failed_requests': [], 'bad_status': [], 'console_errors': []}

def boxes_overlap(a, b):
    if not a or not b: return False
    return not (a['x'] + a['width'] <= b['x'] + 1 or b['x'] + b['width'] <= a['x'] + 1 or
                a['y'] + a['height'] <= b['y'] + 1 or b['y'] + b['height'] <= a['y'] + 1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'])
    page = browser.new_page(viewport={'width': 1585, 'height': 746})
    page.on('requestfailed', lambda r: report['failed_requests'].append(r.url) if not r.url.endswith('.mp3') else None)
    page.on('response', lambda r: report['bad_status'].append([r.status, r.url]) if r.status >= 400 else None)
    page.on('console', lambda m: report['console_errors'].append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: report['console_errors'].append(str(e)))

    page.goto(base + '/?perf'); page.wait_for_load_state('networkidle')
    page.locator('#enter-world').click()
    page.wait_for_function("() => document.querySelector('#vehicle-status')?.dataset.loaded === 'true' && document.querySelector('#world canvas')?.dataset.pilot === 'glb'", timeout=15000)
    page.wait_for_timeout(500)

    # 1) Medicao de FPS real em WebGL2 com fauna ativa
    fps = page.evaluate("""() => new Promise(resolve => {
        let frames = 0;
        const start = performance.now();
        function tick() {
            frames++;
            if (performance.now() - start >= 1200) resolve(+(frames * 1000 / (performance.now() - start)).toFixed(1));
            else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    })""")
    report['fps_3p'] = fps

    # 2) Aves em idle e entrando em fuga quando o Geep avanca na Av. Kong Studios
    page.locator('#band-toggle').evaluate("el => { if (el.getAttribute('aria-pressed') === 'true') el.click(); }")
    page.evaluate("""() => {
        const g = window.__gorilazz;
        g.world.zoomBy(-0.22);
        g.vehicle.x = -7.8; g.vehicle.z = -12.0; g.vehicle.heading = 0.18; g.vehicle.speed = 7;
    }""")
    page.wait_for_timeout(320)
    page.screenshot(path=str(out / 'frente02-aves-fuga.png'), animations='disabled')
    page.evaluate("() => { window.__gorilazz.world.resetCamera(); }")

    # 3) Silhueta organica da cidade (mais alta no nucleo central, reduzindo nas bordas)
    page.evaluate("""() => {
        const g = window.__gorilazz;
        g.vehicle.x = 18; g.vehicle.z = 8; g.vehicle.heading = 0.28; g.vehicle.speed = 0;
        g.world.zoomBy(0.35);
    }""")
    page.wait_for_timeout(400)
    page.screenshot(path=str(out / 'frente02-cidade-silhueta.png'), animations='disabled')
    page.evaluate("() => { window.__gorilazz.world.resetCamera(); }")

    # 4) 1a pessoa (acionada pelo botao #first-person / tecla V para ativar #cockpit e .cabin-tools na HUD)
    page.evaluate("() => { const g = window.__gorilazz; g.vehicle.x = 0; g.vehicle.z = 0; g.vehicle.heading = 0; g.vehicle.speed = 0; }")
    page.locator('#first-person').evaluate("el => el.click()")
    page.wait_for_timeout(450)
    overlaps = {}
    for w, h in ((1585, 746), (1440, 900), (390, 844)):
        page.set_viewport_size({'width': w, 'height': h})
        page.wait_for_timeout(350)
        page.screenshot(path=str(out / f'frente02-1p-{w}x{h}.png'), animations='disabled')
        b_cabin = page.locator('.cabin-tools').bounding_box()
        b_radio = page.locator('#road-radio').bounding_box()
        b_map = page.locator('.mini-map').bounding_box()
        b_pedals = page.locator('.pedal-buttons').bounding_box() if w <= 700 else None
        overlaps[f'{w}x{h}'] = {
            'cabin_vs_radio': boxes_overlap(b_cabin, b_radio),
            'cabin_vs_map': boxes_overlap(b_cabin, b_map),
            'cabin_vs_pedals': boxes_overlap(b_cabin, b_pedals),
            'cabin_box': b_cabin,
            'radio_box': b_radio,
        }
    report['hud_overlaps'] = overlaps

    # 5) Troca de faixa no radio da HUD (tecla ]) e foco no modulo 3D do radio (tecla R)
    page.set_viewport_size({'width': 1440, 'height': 900})
    page.wait_for_timeout(250)
    track_before = page.locator('#road-radio-track').text_content()
    page.keyboard.press('BracketRight')
    page.wait_for_timeout(200)
    track_after = page.locator('#road-radio-track').text_content()
    report['radio_tracks'] = {'before': track_before, 'after': track_after}
    page.keyboard.press('KeyR')
    page.wait_for_timeout(450)
    page.screenshot(path=str(out / 'frente02-1p-radio-foco.png'), animations='disabled')
    page.keyboard.press('Escape')
    page.wait_for_timeout(200)

    # 6) Mapa completo na tecla M (abrir com M, capturar, fechar com Escape)
    page.keyboard.press('KeyM')
    page.wait_for_timeout(350)
    map_open = page.evaluate("() => !document.querySelector('#full-map-overlay').hidden")
    page.screenshot(path=str(out / 'frente02-mapa-m-aberto.png'), animations='disabled')
    page.keyboard.press('Escape')
    page.wait_for_timeout(200)
    map_closed = page.evaluate("() => document.querySelector('#full-map-overlay').hidden")
    report['full_map_m'] = {'opened_on_M': map_open, 'closed_on_Esc': map_closed}

    (out / 'frente02-relatorio.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    browser.close()

print(json.dumps(report, ensure_ascii=False, indent=2))
