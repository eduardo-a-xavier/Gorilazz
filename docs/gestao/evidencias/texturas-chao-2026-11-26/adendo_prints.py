"""Prints de chão no Chrome real sob /Gorilazz/ + FPS 3ª e 1ª pessoa + erros. Uso: python texturas_prints.py <rotulo> <pasta_site>"""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
LABEL, SITE = sys.argv[1], sys.argv[2]
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
SPOTS = {
  "praca_kong_baixa": {"x": -12.2, "z": -18.35, "dirX": -0.7, "dirZ": 0.7, "distance": 9.0, "height": 2.2, "target": 0.6},
  "praca_kong_alta": {"x": 0.0, "z": -5.0, "dirX": 0.6, "dirZ": 0.8, "distance": 22.0, "height": 9.0, "target": 0.0},
  "murais_alta": {"x": -80.0, "z": -88.0, "dirX": 0.6, "dirZ": 0.8, "distance": 22.0, "height": 9.0, "target": 0.0},
  "mirante_alta": {"x": 72.0, "z": -123.0, "dirX": 0.5, "dirZ": 0.87, "distance": 22.0, "height": 9.0, "target": 0.0},
}
FPS_JS = "() => new Promise(r => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else r(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })"
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, f"servidor-{LABEL}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    res = {"label": LABEL, "http_4xx": [], "console_errors": [], "fps": {}}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            page.on("response", lambda r: res["http_4xx"].append(f"{r.status} {r.url}") if r.status >= 400 else None)
            page.on("console", lambda m: res["console_errors"].append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: res["console_errors"].append(f"pageerror: {e}"))
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(3)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); const bt = document.querySelector('#band-toggle'); if (bt && bt.getAttribute('aria-pressed') === 'true') bt.click(); }")
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.treesGlbLoaded === true", timeout=180000)
            await asyncio.sleep(8)
            res["fps"]["3a_parado"] = await page.evaluate(FPS_JS)
            for name, spot in SPOTS.items():
                await page.evaluate("""(spot) => { const g = window.__gorilazz; g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0; g.world.frameSpot(spot); for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null); }""", spot)
                await asyncio.sleep(4)
                await page.screenshot(path=os.path.join(OUT, f"{LABEL}_{name}_1440x900.png"))
            await page.evaluate("() => { const g = window.__gorilazz; g.world.clearPose(); g.vehicle.x = 47.0; g.vehicle.z = -22.0; g.vehicle.speed = 0; g.vehicle.heading = 0; }")
            await asyncio.sleep(3)
            await page.evaluate("() => { const fp = document.querySelector('#first-person'); if (fp && fp.getAttribute('aria-pressed') !== 'true') fp.click(); }")
            await asyncio.sleep(3)
            res["fps"]["1a"] = await page.evaluate(FPS_JS)
            await page.screenshot(path=os.path.join(OUT, f"{LABEL}_cockpit_1440x900.png"))
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, f"prints_{LABEL}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(LABEL, "4xx", len(res["http_4xx"]), "console", len(res["console_errors"]), "fps", res["fps"], res["http_4xx"][:2], res["console_errors"][:2])
asyncio.run(main())
