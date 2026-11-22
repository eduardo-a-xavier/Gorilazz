"""Capturas de 1a pessoa (parado, esq, dir, radio) nas 3 resolucoes exigidas (1585x746, 1440x900, 390x844)
apenas ativando a 1a pessoa (V / setFirstPerson(true)), sem arraste manual, mais outdoor do Ato 4."""
import os, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
port = '3145'
srv = subprocess.Popen(['node', 'server.mjs'], env={**os.environ, 'PORT': port}, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
time.sleep(0.8)
base = f'http://127.0.0.1:{port}'
sizes = [(1585, 746), (1440, 900), (390, 844)]

try:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=['--ignore-gpu-blocklist', '--enable-gpu-rasterization'])
        page = browser.new_page(viewport={'width': 1585, 'height': 746})
        page.goto(base + '/?perf'); page.wait_for_load_state('networkidle')
        page.locator('#enter-world').click()
        page.wait_for_function("() => document.querySelector('#vehicle-status')?.dataset.loaded === 'true' && document.querySelector('#world canvas')?.dataset.pilot === 'glb'", timeout=15000)
        page.evaluate("() => { window.__gorilazz.world.setFirstPerson(true); }")
        page.wait_for_timeout(450)
        for w, h in sizes:
            page.set_viewport_size({'width': w, 'height': h})
            page.wait_for_timeout(300)
            for name, steer in (('parado', 0), ('esq', 0.65), ('dir', -0.65)):
                # Mantem steering fixo durante os quadros de renderizacao (sem decair por stepVehicle)
                page.evaluate(f"() => {{ window.__gorilazz.world.setInteraction(false); window.__steerLock = {steer}; if (!window.__steerHooked) {{ window.__steerHooked = true; const v = window.__gorilazz.vehicle; Object.defineProperty(v, 'steering', {{ get() {{ return window.__steerLock ?? 0; }}, set() {{}} }}); }} }}")
                page.wait_for_timeout(280)
                path = out / f'1p-{w}x{h}-{name}.png'
                page.screenshot(path=str(path), animations='disabled')
                print('SAVED:', path)
            page.evaluate("() => { window.__steerLock = 0; window.__gorilazz.world.setInteraction(true); }")
            page.wait_for_timeout(400)
            path = out / f'1p-{w}x{h}-radio.png'
            page.screenshot(path=str(path), animations='disabled')
            print('SAVED:', path)
            page.evaluate("() => { window.__gorilazz.world.setInteraction(false); }")
        # Outdoor Ato 4 sem letras cortadas
        page.set_viewport_size({'width': 1440, 'height': 900})
        page.evaluate("() => { const g = window.__gorilazz; g.world.setFirstPerson(false); g.vehicle.x = -26; g.vehicle.z = -126; g.vehicle.heading = 0.42; }")
        page.wait_for_timeout(600)
        out_path = out / 'outdoors-ato4.png'
        page.screenshot(path=str(out_path), animations='disabled')
        print('SAVED:', out_path)
        browser.close()
finally:
    srv.terminate()
