"""Prints e medição de áudio no Chrome real sob /Gorilazz/: antes (commit 16ab193) e depois. Uso: python prints_saneamento.py <antes|depois> <pasta_do_site>"""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
LABEL, SITE = sys.argv[1], sys.argv[2]
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
SPOTS = {
  "praca_kong": {"x": 4.0, "z": -36.0, "dirX": 0.8, "dirZ": 0.6, "distance": 9.0, "height": 2.2, "target": 0.6},
  "praca_kong_longe": {"x": 12.0, "z": -22.0, "dirX": 0.9, "dirZ": -0.3, "distance": 11.0, "height": 2.6, "target": 0.8},
  "esquina_cruzamento1": {"x": 0.0, "z": -52.0, "dirX": 0.71, "dirZ": 0.71, "distance": 13.0, "height": 6.0, "target": 0.0},
  "palco_murdoc": {"x": -51.8, "z": -127.7, "dirX": -0.70, "dirZ": -0.71, "distance": 9.5, "height": 2.7, "target": 1.9},
}
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, f"servidor-{LABEL}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    out = {"label": LABEL, "http_4xx": [], "console_errors": []}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            page.on("response", lambda r: out["http_4xx"].append(f"{r.status} {r.url}") if r.status >= 400 else None)
            page.on("console", lambda m: out["console_errors"].append(m.text) if m.type == "error" else None)
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(6)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); const bt = document.querySelector('#band-toggle'); if (bt && bt.getAttribute('aria-pressed') === 'true') bt.click(); }")
            await page.evaluate("() => document.querySelector('#world canvas')?.focus()")
            await page.keyboard.down("w"); await asyncio.sleep(2.0); await page.keyboard.up("w")
            out["audio_w"] = await page.evaluate("() => window.__gorilazz.audio ? window.__gorilazz.audio() : null")
            await asyncio.sleep(10)
            out["fps_3a"] = await page.evaluate("() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })")
            for name, spot in SPOTS.items():
                await page.evaluate("""(spot) => { const g = window.__gorilazz; g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0; g.world.frameSpot(spot); for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null); }""", spot)
                await asyncio.sleep(4)
                await page.screenshot(path=os.path.join(OUT, f"{LABEL}_{name}_1440x900.png"))
            await b.close()
    finally:
        srv.terminate()
    json.dump(out, open(os.path.join(OUT, f"{LABEL}_prints.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False)[:800])
asyncio.run(main())
