"""Telemetria do passeio guiado (headless, /?perf). Grava amostras do Geep e do passeio em telemetria-<modo>.json.
Uso: python telemetria_passeio.py <3a|1a> [segundos_max]"""
import asyncio, json, os, subprocess, sys, time
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
MODE = sys.argv[1] if len(sys.argv) > 1 else "3a"; MAX_S = float(sys.argv[2]) if len(sys.argv) > 2 else 900
PORT = "3919"
async def main():
    SUB = os.environ.get("SUB") == "1"; base_path = "/Gorilazz" if SUB else ""
    if SUB:
        site = os.path.join(BASE, "artifacts", "tmp", "site-sub")
        subprocess.run(["node", os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "montar-site-estatico.mjs"), site], cwd=BASE, check=True, stdout=subprocess.DEVNULL)
        srv = subprocess.Popen(["node", os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs"), site, os.path.join(OUT, f"servidor-{MODE}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for _ in range(60):
            line = srv.stdout.readline()
            if "PORT=" in line: PORT_USED = int(line.strip().split("=")[1]); break
    else:
        PORT_USED = PORT
        srv = subprocess.Popen(["node", "server.mjs"], cwd=BASE, env=dict(os.environ, PORT=PORT), stdout=subprocess.DEVNULL)
    await asyncio.sleep(2)
    samples, events, errors = [], [], []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(headless=True, args=["--use-angle=d3d11", "--ignore-gpu-blocklist"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(f"pageerror: {e}"))
            bad = []
            page.on("response", lambda r: bad.append(f"{r.status} {r.url}") if r.status >= 400 else None)
            await page.goto(f"http://127.0.0.1:{PORT_USED}{base_path}/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=90000)
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); localStorage.removeItem('gorilazz.stops.v1'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(6)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); }")
            if MODE == "1a":
                await page.evaluate("() => { const fp = document.querySelector('#first-person'); if (fp && fp.getAttribute('aria-pressed') !== 'true') fp.click(); }")
            await page.evaluate("() => document.querySelector('#tour-toggle')?.click()")
            t0 = time.time(); last_idx = -2; shots = 0; shot_at = {'3a': [0, 4, 8], '1a': [0]}[MODE]; prev_hold = False
            while time.time() - t0 < MAX_S:
                s = await page.evaluate("""() => { const g = window.__gorilazz, v = g.vehicle, gu = g.guided ? g.guided() : null;
                  return { t: performance.now(), x: v.x, z: v.z, heading: v.heading, speed: v.speed,
                    index: gu ? gu.index : null, hold: gu ? !!gu.holdUntil : null, paused: gu ? gu.paused : null,
                    order: gu ? gu.order.map(o => o.id) : null, firstPerson: document.querySelector('#first-person')?.getAttribute('aria-pressed') === 'true',
                    stopsCount: document.querySelector('#stops-count')?.textContent ?? null, cardOpen: !document.querySelector('#guided-card')?.hidden, radio: g.radio ? g.radio.read() : null }; }""")
                samples.append(s)
                if s['hold'] and not prev_hold and s['index'] in shot_at and shots < len(shot_at):
                    await page.screenshot(path=os.path.join(OUT, f'frame-{MODE}-parada{s["index"]+1}.png')); shots += 1
                    events.append({'t': s['t'], 'event': 'screenshot', 'index': s['index']})
                prev_hold = bool(s['hold'])
                if s["index"] is not None and s["index"] != last_idx:
                    events.append({"t": s["t"], "event": "leg", "index": s["index"], "stop": s["order"][s["index"]] if s["order"] else None}); last_idx = s["index"]
                if s["index"] is None and len(samples) > 5 and samples[-2]["index"] is not None:
                    events.append({"t": s["t"], "event": "tour-ended"}); break
                await asyncio.sleep(0.25)
            await b.close()
    finally:
        srv.terminate()
    out = {"mode": MODE, "base_path": base_path or "/", "http_4xx": bad, "samples": samples, "events": events, "console_errors": errors, "duration_s": round(time.time() - t0, 1)}
    json.dump(out, open(os.path.join(OUT, f"telemetria-{MODE}.json" if not SUB else f"telemetria-{MODE}-subcaminho.json"), "w", encoding="utf-8"), ensure_ascii=False)
    print(json.dumps({"samples": len(samples), "events": len(events), "http_4xx": len(bad), "errors": errors[:5], "duration_s": out["duration_s"]}, ensure_ascii=False))
asyncio.run(main())
