"""Auditoria real dos veículos estacionados no Chrome (channel chrome) sob /Gorilazz/.
Lê as instâncias de carros da cena e faz raycast para baixo no centro e nos 4 cantos de cada um: o que é o solo ali."""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
LABEL = sys.argv[1] if len(sys.argv) > 1 else "depois"
SITE = sys.argv[2] if len(sys.argv) > 2 else os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
from audit_js import JS

async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, f"servidor-{LABEL}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    res = {"label": LABEL, "http_4xx": [], "console_errors": []}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            page.on("response", lambda r: res["http_4xx"].append(f"{r.status} {r.url}") if r.status >= 400 else None)
            page.on("console", lambda m: res["console_errors"].append(m.text) if m.type == "error" else None)
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(3)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); }")
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.carsGlbLoaded === true", timeout=180000)
            await asyncio.sleep(2)
            res["veiculos"] = await page.evaluate(JS)
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, f"veiculos_{LABEL}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(len(res["veiculos"]), "veiculos; 4xx", len(res["http_4xx"]), "console", len(res["console_errors"]))
asyncio.run(main())
