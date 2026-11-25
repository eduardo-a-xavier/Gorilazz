"""Varredura geométrica no Chrome real: lista TODA malha/instância da cena com tamanho de veículo (fonte qualquer)."""
import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright
BASE = r"E:\Gorilazz-Relatorio"; OUT = os.path.dirname(os.path.abspath(__file__))
SITE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "artifacts", "tmp", "site-sub")
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")
JS = """async () => {
  const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
  const scene = window.__gorilazz.world.debug.scene;
  const out = []; const box = new T.Box3(), m = new T.Matrix4(), v = new T.Vector3();
  const sizeOk = s => s.y >= 0.9 && s.y <= 2.8 && Math.max(s.x, s.z) >= 3.2 && Math.max(s.x, s.z) <= 7.5 && Math.min(s.x, s.z) >= 1.4 && Math.min(s.x, s.z) <= 3.9;
  scene.traverse(o => {
    if (!o.isMesh || !o.geometry) return;
    if (o.isInstancedMesh) {
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m); const g = o.geometry; g.computeBoundingBox();
        box.copy(g.boundingBox).applyMatrix4(o.matrixWorld.clone().multiply(m));
        const s = box.getSize(new T.Vector3()); if (!sizeOk(s)) continue;
        const c = box.getCenter(new T.Vector3());
        out.push({ name: o.name, instance: i, x: +c.x.toFixed(2), z: +c.z.toFixed(2), y: +box.min.y.toFixed(3), size: [s.x, s.y, s.z].map(q => +q.toFixed(2)) });
      }
    } else {
      o.geometry.computeBoundingBox(); box.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld);
      const s = box.getSize(new T.Vector3()); if (!sizeOk(s)) return;
      const c = box.getCenter(new T.Vector3());
      const chain = []; let p = o; while (p) { chain.push(p.name || p.type); p = p.parent; }
      const col = o.material && o.material.color ? [o.material.color.r, o.material.color.g, o.material.color.b].map(q => Math.round(q*255)) : null;
      out.push({ name: o.name || o.type, instance: null, chain: chain.slice(0, 5).join(' < '), color: col, x: +c.x.toFixed(2), z: +c.z.toFixed(2), y: +box.min.y.toFixed(3), size: [s.x, s.y, s.z].map(q => +q.toFixed(2)) });
    }
  });
  return out;
}"""
async def main():
    srv = subprocess.Popen(["node", SUBSRV, SITE, os.path.join(OUT, "servidor-probe.log")], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
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
            await asyncio.sleep(6)
            res["achados"] = await page.evaluate(JS)
            await b.close()
    finally:
        srv.terminate()
    json.dump(res, open(os.path.join(OUT, "probe_veiculos.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print(Counter(a["name"] for a in res["achados"]).most_common(20))
    print(len(res["achados"]), "achados")
asyncio.run(main())
