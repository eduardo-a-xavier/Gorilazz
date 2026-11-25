"""Varredura de 12 pontos no Chrome real sob /Gorilazz/: print + superfície real do solo (raycast). Uso: python varredura_chao.py <rotulo> <pasta_site>"""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
LABEL, SITE = sys.argv[1], sys.argv[2]
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
PONTOS = [
  ("01_praca_kong", 0.0, -30.0, 0.7, 0.7, 9.0),
  ("02_fliperama", -13.5, -10.0, 0.7, -0.7, 9.0),
  ("03_cruzamento_1", 0.0, -52.0, 0.7, 0.7, 11.0),
  ("04_cruzamento_3", -83.0, -110.0, 0.7, 0.7, 11.0),
  ("05_cruzamento_5", 72.0, -126.0, -0.7, 0.7, 11.0),
  ("06_cruzamento_6", 80.0, -50.0, 0.7, 0.7, 11.0),
  ("07_palco_murdoc", -51.8, -127.7, -0.7, -0.7, 9.5),
  ("08_palco_noodle", 34.8, -118.3, 0.66, 0.75, 9.5),
  ("09_palco_2d", -62.4, -76.1, 0.7, -0.7, 9.5),
  ("10_palco_russel", 59.0, -102.6, -0.7, 0.7, 9.5),
  ("11_borda_oeste", -118.0, -70.0, 0.8, 0.6, 9.0),
  ("12_borda_leste", 120.0, -40.0, -0.8, -0.6, 9.0),
]

SURF = """(p) => { return null; }"""
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, f"servidor-{LABEL}.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    res = {"label": LABEL, "pontos": [], "http_4xx": [], "console_errors": []}
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
            await asyncio.sleep(6)
            for name, x, z, dx, dz, dist in PONTOS:
                spot = {"x": x, "z": z, "dirX": dx, "dirZ": dz, "distance": dist, "height": 3.0, "target": 0.8}
                await page.evaluate("""(spot) => { const g = window.__gorilazz; g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0; g.world.frameSpot(spot); for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null); }""", spot)
                await asyncio.sleep(3.5)
                await page.screenshot(path=os.path.join(OUT, f"{LABEL}_{name}_1440x900.png"))
                surf = await page.evaluate("""async (pt) => {
                  const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
                  const scene = window.__gorilazz.world.debug.scene; const ray = new T.Raycaster();
                  const out = [];
                  for (const [ox, oz] of [[0,0],[3,0],[-3,0],[0,3],[0,-3]]) {
                    ray.set(new T.Vector3(pt.x + ox, 60, pt.z + oz), new T.Vector3(0, -1, 0));
                    const h = ray.intersectObjects(scene.children, true).filter(q => q.object.isMesh && q.point.y < 0.5 && !/street-|ambient|drive-fx|cabin|guitar|bass|noodle|murdoc|bush|tree/.test((q.object.name || '') + (q.object.parent?.name || '')));
                    if (!h.length) { out.push('nenhum'); continue; }
                    const o = h[0].object; let col = null;
                    if (o.geometry.attributes.color && h[0].face) { const i = h[0].face.a; col = [o.geometry.attributes.color.getX(i), o.geometry.attributes.color.getY(i), o.geometry.attributes.color.getZ(i)].map(q => Math.round(q*255)); }
                    out.push((o.name || o.parent?.name || o.type) + (col ? ' ' + JSON.stringify(col) : ''));
                  }
                  return out; }""", {"x": x, "z": z})
                res["pontos"].append({"ponto": name, "x": x, "z": z, "superficie_centro_e_4_pontos": surf})
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, f"varredura_{LABEL}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(LABEL, len(res["pontos"]), "pontos; 4xx", len(res["http_4xx"]), "console", len(res["console_errors"]))
asyncio.run(main())
