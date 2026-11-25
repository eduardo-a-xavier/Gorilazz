"""Cockpit em 1ª pessoa com a exposição nova + FPS medido em Chrome real sob /Gorilazz/."""
import asyncio, json, os, subprocess
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
FPS_JS = "() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 5000) requestAnimationFrame(f); else res(Math.round(n / ((performance.now() - t0) / 1000))); }; requestAnimationFrame(f); })"
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, "servidor-cockpit.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    out = {"http_4xx": [], "console_errors": []}
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
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); }")
            out["fps_3a_drive"] = await page.evaluate(FPS_JS)
            await page.evaluate("() => { const fp = document.querySelector('#first-person'); if (fp && fp.getAttribute('aria-pressed') !== 'true') fp.click(); }")
            await asyncio.sleep(3)
            out["fps_1a"] = await page.evaluate(FPS_JS)
            await page.screenshot(path=os.path.join(OUT, "cockpit_depois_exposicao_1440x900.png"))
            await b.close()
    finally:
        srv.terminate()
    json.dump(out, open(os.path.join(OUT, "cockpit_fps.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(out, ensure_ascii=False))
asyncio.run(main())
