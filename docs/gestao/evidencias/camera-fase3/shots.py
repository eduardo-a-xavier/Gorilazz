"""Capturas da Fase 3 (Playwright + Chromium com WebGL). Uso: python shots.py <pasta_saida> [url]
Gera: capas na secao de eras (+ falhas de rede), 1a pessoa parado/virando, 3a pessoa e banda."""
import json, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
base = sys.argv[2] if len(sys.argv) > 2 else 'http://localhost:3100'
covers_only = '--covers-only' in sys.argv
report = {'failed_requests': [], 'bad_status': [], 'console_errors': []}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
    page = browser.new_page(viewport={'width': 1280, 'height': 720})
    page.on('requestfailed', lambda r: report['failed_requests'].append(r.url))
    page.on('response', lambda r: report['bad_status'].append([r.status, r.url]) if r.status >= 400 else None)
    page.on('console', lambda m: report['console_errors'].append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: report['console_errors'].append(str(e)))
    page.goto(base + '/?perf'); page.wait_for_load_state('networkidle')
    # capas das 8 eras
    page.locator('#eras').scroll_into_view_if_needed(); page.wait_for_timeout(300)
    covers = []
    for i in range(8):
        page.locator('#era-menu button').nth(i).click(); page.wait_for_timeout(250)
        info = page.evaluate("() => { const i = document.querySelector('#era-cover img'); return i && {src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, w: i.naturalWidth, alt: i.alt, caption: document.querySelector('#era-cover figcaption').textContent} }")
        covers.append(info)
        if i in (0, 3, 7): page.locator('#era-panel').screenshot(path=str(out / f'eras-capa-{i + 1}.png'))
    report['covers'] = covers
    if not covers_only:
        # mundo
        page.locator('#enter-world').click(); page.wait_for_timeout(4000)
        page.screenshot(path=str(out / 'mundo-3p.png'))
        page.evaluate("() => { const g = window.__gorilazz; g.world.zoomBy(-0.28); }"); page.wait_for_timeout(900)
        page.screenshot(path=str(out / 'banda-poses.png'))
        page.evaluate("() => { const g = window.__gorilazz; g.world.resetCamera(); g.world.setFirstPerson(true); }"); page.wait_for_timeout(1000)
        # Inclina o olhar levemente para baixo (como no print do Eduardo) para enquadrar volante, velocimetro e bracos do piloto GLB
        canvas = page.locator('#world canvas')
        box = canvas.bounding_box()
        cx, cy = box['x'] + box['width'] * 0.5, box['y'] + box['height'] * 0.35
        page.mouse.move(cx, cy)
        page.mouse.down()
        page.mouse.move(cx, cy + 95, steps=8)
        page.mouse.up()
        page.wait_for_timeout(900)
        page.screenshot(path=str(out / 'primeira-pessoa-parado.png'))
        for name, steer in (('esq', -.8), ('dir', .8)):
            page.evaluate(f"() => {{ window.__gorilazz.vehicle.steering = {steer}; }}"); page.wait_for_timeout(900)
            page.screenshot(path=str(out / f'primeira-pessoa-{name}.png'))
        page.evaluate("() => { window.__gorilazz.vehicle.steering = 0; window.__gorilazz.world.setInteraction(true); }"); page.wait_for_timeout(900)
        page.screenshot(path=str(out / 'primeira-pessoa-radio.png'))
    (out / 'rede-capas.json').write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')
    browser.close()
print(json.dumps({k: (v if k != 'covers' else [c and (c['src'], c['ok']) for c in v]) for k, v in report.items()}, ensure_ascii=False, indent=1))
