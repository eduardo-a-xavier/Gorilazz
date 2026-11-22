"""Direção manual perto de árvores (curvas em zigue-zague), Chrome real. Conta amostras em que a câmera
atravessa uma copa (esfera de 2,2 m a 3,7 m de altura). MODE=antes desliga o bloqueio de árvores (flag temporário).
Uso: MODE=antes|depois tree_drive.py OUT_JSON"""
import json, os, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

out = Path(sys.argv[1]); out.parent.mkdir(parents=True, exist_ok=True)
MODE = os.environ.get('MODE', 'depois')
PEN = """() => { const c = window.__gorilazz.world.debug.camera.position, v = window.__gorilazz.vehicle; let hits = 0, near = 0;
  const seg = (px,py,pz,qx,qy,qz,cx,cy,cz) => { const dx=qx-px, dy=qy-py, dz=qz-pz; const L2=dx*dx+dy*dy+dz*dz || 1; let t=((cx-px)*dx+(cy-py)*dy+(cz-pz)*dz)/L2; t=Math.max(0,Math.min(1,t)); return Math.hypot(px+dx*t-cx, py+dy*t-cy, pz+dz*t-cz); };
  for (const t of window.__gorilazz.trees) { if (Math.hypot(t.x-v.x, t.z-v.z) > 50) continue; const d = seg(v.x,2.4,v.z,c.x,c.y,c.z,t.x,3.7,t.z); if (d < 2.2) { hits++; window.__hitd = (window.__hitd || []).concat([Math.hypot(t.x-v.x, t.z-v.z)]); } if (d < 3.5) near++; }
  return { hits, near, cam: [c.x, c.z], car: [v.x, v.z] }; }"""
DIST = "() => { const d = window.__hitd || []; window.__hitd = []; return d; }"
HITD = []
RES = {'modo': MODE, 'dist_carro_arvore_nas_travessias_m': HITD, 'amostras': 0, 'amostras_atravessando': 0, 'amostras_perto_3_5m': 0, 'cenarios': []}
with sync_playwright() as p:
    b = p.chromium.launch(channel='chrome', headless=True, args=['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist'])
    page = b.new_page(viewport={'width': 1440, 'height': 900})
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
    if MODE == 'antes': page.add_init_script('window.__TEMP_NO_TREES = true')
    page.goto('http://localhost:3000/?perf'); page.wait_for_load_state('networkidle')
    page.evaluate("() => document.querySelector('#enter-world').click()"); page.wait_for_timeout(1500)
    page.evaluate("() => { const d = document.querySelector('#onboarding-dialog'); if (d?.open) document.querySelector('#onboarding-start').click(); }")
    trees = page.evaluate("() => window.__gorilazz.trees.map(t => [t.x, t.z])")
    # Escolhe 8 árvores espalhadas; em cada uma, o carro começa a 9 m e dirige em zigue-zague por ~5 s.
    picks = trees[::max(1, len(trees) // 16)][:16]
    for idx, (tx, tz) in enumerate(picks):
        ang = (idx * 0.9) % 6.283
        sx, sz = tx + 9 * __import__('math').cos(ang), tz + 9 * __import__('math').sin(ang)
        page.evaluate(f"() => {{ const v = window.__gorilazz.vehicle; v.x = {sx}; v.z = {sz}; v.speed = 0; v.heading = {ang + 3.14159}; v.steering = 0; }}")
        page.wait_for_timeout(600)
        page.keyboard.down('w')
        t0 = time.time(); pen = 0; n = 0; near = 0
        while time.time() - t0 < 5.0:
            phase = int((time.time() - t0) / 1.2) % 2
            page.keyboard.down('a' if phase == 0 else 'd')
            s = page.evaluate(PEN); n += 1
            pen += 1 if s['hits'] > 0 else 0; near += 1 if s['near'] > 0 else 0
            if s['hits'] > 0: HITD.extend(page.evaluate(DIST))
            page.wait_for_timeout(120)
            page.keyboard.up('a' if phase == 0 else 'd')
        page.keyboard.up('w'); page.keyboard.up('a'); page.keyboard.up('d')
        page.wait_for_timeout(300)
        RES['cenarios'].append({'arvore': [round(tx, 1), round(tz, 1)], 'amostras': n, 'atravessando': pen, 'perto_3_5m': near})
        RES['amostras'] += n; RES['amostras_atravessando'] += pen; RES['amostras_perto_3_5m'] += near
    RES['dist_carro_arvore_nas_travessias_m'] = [round(x, 1) for x in HITD]
    RES['erros'] = errs[:5]
    b.close()
out.write_text(json.dumps(RES, ensure_ascii=False, indent=1), encoding='utf-8')
print(json.dumps({k: RES[k] for k in ['modo', 'amostras', 'amostras_atravessando', 'amostras_perto_3_5m', 'erros']}, ensure_ascii=False))
