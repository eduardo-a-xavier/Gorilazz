"""Teste de integração (Playwright, não entra no npm test): o destino da era aparece na HUD após o clique em
EXPLORAR, persiste com a boas-vindas aberta e depois de fechá-la, e o carro avança em direção à parada.
Uso: python scripts/verify-era-hud.py http://127.0.0.1:3000 [pasta_de_prints]"""
import sys, json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

base = sys.argv[1]
out = Path(sys.argv[2]) if len(sys.argv) > 2 else None
if out: out.mkdir(parents=True, exist_ok=True)
CASES = [(1, 'A paisagem de Demon Days'), (2, 'Um som sem fronteiras')]  # era 2005 e era 2010 (Plastic Beach)
FAILS = []

def hud(page):
    return page.evaluate("() => ({ title: document.querySelector('#journey-title').textContent, status: document.querySelector('#journey-status').textContent, meter: document.querySelector('#journey-distance').textContent, dialog: document.querySelector('dialog[open]')?.id || null, speed: window.__gorilazz ? Math.abs(window.__gorilazz.vehicle.speed) : null })")

def meters(text):
    m = re.search(r'(\d+) m', text or ''); return int(m.group(1)) if m else None

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    for era_button, expected in CASES:
        page = browser.new_page(viewport={'width': 1585, 'height': 746})
        page.on('pageerror', lambda e: FAILS.append(f'pageerror {e}'))
        page.goto(base + '/?perf'); page.wait_for_load_state('networkidle')   # primeira visita: sem flag de boas-vindas
        page.evaluate(f"() => document.querySelector('#era-menu button:nth-child({era_button + 1})').click()")
        page.evaluate("() => document.querySelector('#era-drive').click()")
        page.wait_for_timeout(1500)
        a = hud(page)
        if a['title'] != expected or a['dialog'] != 'onboarding-dialog':
            FAILS.append(f'{expected}: após o clique, HUD={a["title"]!r}, dialog={a["dialog"]}')
        # fecha as boas-vindas pelo botão, como o usuário
        page.evaluate("() => document.querySelector('#onboarding-start').click()")
        page.wait_for_timeout(4000)
        b = hud(page)
        if b['title'] != expected: FAILS.append(f'{expected}: 4 s depois de fechar a boas-vindas, HUD={b["title"]!r}')
        if b['status'] != 'A caminho': FAILS.append(f'{expected}: status {b["status"]!r} (esperado "A caminho")')
        page.evaluate("() => document.querySelector('#jogo').scrollIntoView()"); page.wait_for_timeout(1500)
        c = hud(page)
        if c['title'] != expected: FAILS.append(f'{expected}: após rolar, HUD={c["title"]!r}')
        if meters(c['meter']) is not None and meters(b['meter']) is not None and not meters(c['meter']) < meters(a['meter'] or c['meter']) + 1:
            FAILS.append(f'{expected}: distância não diminuiu ({a["meter"]} → {c["meter"]})')
        # rola longe do mundo (o laço pausa) e volta: a rota da era deve continuar e a distância cair
        page.evaluate("() => window.scrollTo(0, 2500)"); page.wait_for_timeout(2000)
        far = hud(page)
        if far['title'] != expected: FAILS.append(f'{expected}: longe do mundo, HUD={far["title"]!r}')
        if far['status'] != 'A caminho': FAILS.append(f'{expected}: longe do mundo, status {far["status"]!r}')
        page.evaluate("() => document.querySelector('#jogo').scrollIntoView()"); page.wait_for_timeout(2000)
        back = hud(page)
        if back['title'] != expected or back['status'] != 'A caminho': FAILS.append(f'{expected}: ao voltar, HUD={back["title"]!r} / {back["status"]!r}')
        if meters(back['meter']) is not None and meters(far['meter']) is not None and not meters(back['meter']) < meters(far['meter']) + 1:
            FAILS.append(f'{expected}: distância não avançou após voltar ({far["meter"]} → {back["meter"]})')
        print(expected, '| longe:', far['meter'], '| voltou:', back['meter'])
        if out: page.screenshot(path=str(out / f'hud-{expected.replace(" ", "-")}.png'))
        print(expected, '| após clique:', a['title'], '|', a['status'], '|', a['meter'], '| 4 s depois:', b['meter'], '| após rolar:', c['meter'])
        page.close()
    browser.close()
if FAILS:
    print('FALHAS:'); [print(' -', f) for f in FAILS]; sys.exit(1)
print('OK: destino da era persiste na HUD com a boas-vindas aberta, após fechá-la e após rolar.')
