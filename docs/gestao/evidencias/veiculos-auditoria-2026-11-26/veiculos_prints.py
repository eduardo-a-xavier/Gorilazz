"""Prints dos dois ângulos do Eduardo + auditoria real dos veículos, no Chrome real sob /Gorilazz/. Uso: python veiculos_prints.py <rotulo> <pasta_site>"""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
LABEL, SITE = sys.argv[1], sys.argv[2]
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
SPOTS = {
  "print1_vans_praca_kong": {"x": -12.2, "z": -18.35, "dirX": -0.7, "dirZ": 0.7, "distance": 9.0, "height": 3.0, "target": 0.8},
  "print2_sedan_calcada_fliperama": {"x": -44.87, "z": -49.68, "dirX": 0.6, "dirZ": -0.8, "distance": 9.0, "height": 3.5, "target": 0.8},
  "varredura_praca_kong": {"x": 0.0, "z": -30.0, "dirX": 0.5, "dirZ": 0.87, "distance": 16.0, "height": 6.0, "target": 0.0},
}
# Varredura 360°: 4 direções em cada praça (Kong e Fliperama).
for cname, (cx, cz) in {"kong": (0.0, -30.0), "fliperama": (-13.5, -10.0)}.items():
    for k, (dx, dz) in enumerate([(1, 0), (0, 1), (-1, 0), (0, -1)]):
        SPOTS[f"varredura360_{cname}_{k}"] = {"x": cx, "z": cz, "dirX": dx, "dirZ": dz, "distance": 6.0, "height": 2.2, "target": 1.0}
sys.path.insert(0, OUT)
from audit_js import JS as AUDIT_JS
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, f"servidor-{LABEL}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    res = {"label": LABEL, "http_4xx": [], "console_errors": [], "fps": None}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            page.on("response", lambda r: res["http_4xx"].append(f"{r.status} {r.url}") if r.status >= 400 else None)
            page.on("console", lambda m: res["console_errors"].append(m.text) if m.type == "error" else None)
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(3)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); const bt = document.querySelector('#band-toggle'); if (bt && bt.getAttribute('aria-pressed') === 'true') bt.click(); }")
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.treesGlbLoaded === true", timeout=180000)
            await asyncio.sleep(8)
            res["veiculos"] = await page.evaluate(AUDIT_JS)
            for name, spot in SPOTS.items():
                await page.evaluate("""(spot) => { const g = window.__gorilazz; g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0; g.world.frameSpot(spot); for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null); }""", spot)
                await asyncio.sleep(4)
                await page.screenshot(path=os.path.join(OUT, f"{LABEL}_{name}_1440x900.png"))
            res["fps"] = await page.evaluate("() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })")
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, f"prints_{LABEL}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(LABEL, "veiculos", len(res.get("veiculos", [])), "4xx", len(res["http_4xx"]), "console", len(res["console_errors"]), "fps", res["fps"])
asyncio.run(main())
