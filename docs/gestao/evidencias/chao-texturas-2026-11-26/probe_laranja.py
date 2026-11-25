"""Acha a malha laranja/marrom/verde do chão: raycast em grade, agrupa por material (cor, mapa) e área."""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
JS = """async () => {
  const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
  const scene = window.__gorilazz.world.debug.scene; const ray = new T.Raycaster();
  const groups = {};
  const pts = [];
  for (let x = -60; x <= 10; x += 2) for (let z = -60; z <= 10; z += 2) pts.push([x, z]);
  for (const [x, z] of pts) {
    ray.set(new T.Vector3(x, 60, z), new T.Vector3(0, -1, 0));
    const h = ray.intersectObjects(scene.children, true).filter(q => q.object.isMesh && q.point.y < 0.5);
    if (!h.length) continue;
    const o = h[0].object, m = o.material; const mat = Array.isArray(m) ? m[0] : m;
    const c = mat.color ? [mat.color.r, mat.color.g, mat.color.b].map(v => Math.round(v * 255)) : null;
    const key = (mat.uuid || '') + '|' + (o.name || o.parent?.name || o.type);
    if (!groups[key]) groups[key] = { mesh: o.name || o.parent?.name || o.type, material: mat.type, color: c, map: !!mat.map, vertexColors: !!mat.vertexColors, pontos: 0, xmin: 1e9, xmax: -1e9, zmin: 1e9, zmax: -1e9, y: +h[0].point.y.toFixed(3) };
    const g = groups[key]; g.pontos++; g.xmin = Math.min(g.xmin, x); g.xmax = Math.max(g.xmax, x); g.zmin = Math.min(g.zmin, z); g.zmax = Math.max(g.zmax, z);
  }
  return Object.values(groups).sort((a, b) => b.pontos - a.pontos);
}"""
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, "servidor-laranja.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
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
            await asyncio.sleep(4)
            res["grupos"] = await page.evaluate(JS)
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, "probe_laranja.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    for g in res["grupos"][:12]: print(g)
asyncio.run(main())
