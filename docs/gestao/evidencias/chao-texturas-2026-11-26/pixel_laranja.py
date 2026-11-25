"""Raycast pela câmera nos pixels laranjas do print1 (mesmo ângulo): qual malha/material está ali."""
import asyncio, json, os, subprocess
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
SPOT = {"x": -12.2, "z": -18.35, "dirX": -0.7, "dirZ": 0.7, "distance": 9.0, "height": 3.0, "target": 0.8}
PIXELS = [(300, 420), (120, 360), (60, 700), (420, 620), (220, 760), (500, 400), (100, 480)]
JS = """async (args) => {
  const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
  const g = window.__gorilazz; const cam = g.world.debug.camera; const scene = g.world.debug.scene;
  const ray = new T.Raycaster(); const out = [];
  for (const [px, py] of args.pixels) {
    const ndc = new T.Vector2((px / 1440) * 2 - 1, -(py / 900) * 2 + 1);
    ray.setFromCamera(ndc, cam);
    const h = ray.intersectObjects(scene.children, true).filter(q => q.object.isMesh && !/street-|cabin|ambient|drive-fx/.test(q.object.name + (q.object.parent?.name || '')));
    if (!h.length) { out.push([px, py, 'nenhum']); continue; }
    const o = h[0].object, m = Array.isArray(o.material) ? o.material[0] : o.material;
    out.push([px, py, { mesh: o.name, parent: o.parent?.name, type: m.type, color: m.color ? [m.color.r, m.color.g, m.color.b].map(v => Math.round(v*255)) : null, map: !!m.map, y: +h[0].point.y.toFixed(3), x: +h[0].point.x.toFixed(2), z: +h[0].point.z.toFixed(2) }]);
  }
  return out;
}"""
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, "servidor-pixel.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line: port = int(line.strip().split("=")[1]); break
    res = {}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(channel="chrome", headless=False, args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"])
            page = await b.new_page(viewport={"width": 1440, "height": 900})
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)
            await page.evaluate("() => { try { localStorage.setItem('gorilazz_onboarding_optout','true'); localStorage.setItem('gorilazz_onboarding_seen','true'); } catch (e) {} document.querySelector('#enter-world')?.click(); }")
            await asyncio.sleep(3)
            await page.evaluate("() => { document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; }); document.querySelector('#onboarding-start')?.click(); }")
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.treesGlbLoaded === true", timeout=180000)
            await page.evaluate("""(spot) => { const g = window.__gorilazz; g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0; g.world.frameSpot(spot); for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null); }""", SPOT)
            await asyncio.sleep(5)
            res["pixels"] = await page.evaluate(JS, {"pixels": PIXELS})
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, "pixel_laranja.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for r in res["pixels"]: print(r)
asyncio.run(main())
