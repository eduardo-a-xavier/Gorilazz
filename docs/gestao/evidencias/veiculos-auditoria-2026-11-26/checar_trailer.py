"""Raycast no solo sob o trailer do Easter egg (furgão 5,8 m) e sob o alce, no Chrome real sob /Gorilazz/."""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
SITE = os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
from audit_js import JS as AUDIT_JS
JS = AUDIT_JS.replace("async () => {", "async () => { window.__probePoints = true; ", 1)
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, "servidor-trailer.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
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
            res["trailer"] = await page.evaluate("""async () => {
              const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
              const scene = window.__gorilazz.world.debug.scene; const ray = new T.Raycaster();
              const surf = (x, z) => { ray.set(new T.Vector3(x, 60, z), new T.Vector3(0, -1, 0)); const h = ray.intersectObjects(scene.children, true).filter(q => q.object.isMesh && !/easter-trailer/.test(q.object.parent?.name || '') && !/street-cars/.test(q.object.name)); if (!h.length) return 'nenhum'; const o = h[0].object; let col = null; if (o.geometry.attributes.color && h[0].face) { const i = h[0].face.a; col = [o.geometry.attributes.color.getX(i), o.geometry.attributes.color.getY(i), o.geometry.attributes.color.getZ(i)].map(q => Math.round(q*255)); } return (o.name || o.parent?.name || o.type) + ' ' + JSON.stringify(col); };
              const tr = scene.getObjectByName('easter-trailer'); if (!tr) return 'sem trailer';
              const cx = tr.position.x, cz = tr.position.z, yaw = tr.rotation.y, L = 2.9, W = 1.25;
              const pts = [[0,0],[-W,-L],[W,-L],[W,L],[-W,L]].map(([a,b]) => [cx + a*Math.cos(yaw) + b*Math.sin(yaw), cz - a*Math.sin(yaw) + b*Math.cos(yaw)]);
              return pts.map(([x,z]) => [+x.toFixed(2), +z.toFixed(2), surf(x,z)]);
            }""")
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, "checar_trailer.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(json.dumps(res["trailer"], ensure_ascii=False))
asyncio.run(main())
