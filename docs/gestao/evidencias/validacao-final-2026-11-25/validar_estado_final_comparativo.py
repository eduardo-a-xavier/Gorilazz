import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright

BASE = r"E:\Gorilazz-Relatorio"
OUT = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\validacao-final-2026-11-25"
SITE_ANTES = os.path.join(OUT, "site-publicado-6a3d855")
SITE_DEPOIS = BASE
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")

# Mesmos spots calibrados pela Engenharia em juncao-calcada-2026-11-25
SPOTS = {
    "no1_rotatoria_sul": {"x": 0.0, "z": -52.0, "dirX": 0.7, "dirZ": 0.7, "distance": 13.0, "height": 6.0, "target": 0.0},
    "topo_no1_rotatoria_sul": {"x": 0.0, "z": -52.0, "dirX": 0.01, "dirZ": 0.01, "distance": 3.0, "height": 34.0, "target": 0.0},
    "no3_rotatoria_oeste": {"x": -83.0, "z": -110.0, "dirX": 0.7, "dirZ": 0.7, "distance": 13.0, "height": 6.0, "target": 0.0},
    "topo_no3_rotatoria_oeste": {"x": -83.0, "z": -110.0, "dirX": 0.01, "dirZ": 0.01, "distance": 3.0, "height": 34.0, "target": 0.0},
    "no5_rotatoria_leste": {"x": 72.0, "z": -126.0, "dirX": -0.7, "dirZ": 0.7, "distance": 13.0, "height": 6.0, "target": 0.0},
    "topo_no5_rotatoria_leste": {"x": 72.0, "z": -126.0, "dirX": 0.01, "dirZ": 0.01, "distance": 3.0, "height": 34.0, "target": 0.0},
    "no6_rotatoria_sudeste": {"x": 80.0, "z": -50.0, "dirX": -0.7, "dirZ": 0.7, "distance": 13.0, "height": 6.0, "target": 0.0},
    "topo_no6_rotatoria_sudeste": {"x": 80.0, "z": -50.0, "dirX": 0.01, "dirZ": 0.01, "distance": 3.0, "height": 34.0, "target": 0.0},
    "no7_rotatoria_central": {"x": 27.0, "z": -91.0, "dirX": -0.7, "dirZ": 0.7, "distance": 13.0, "height": 6.0, "target": 0.0},
    "topo_no7_rotatoria_central": {"x": 27.0, "z": -91.0, "dirX": 0.01, "dirZ": 0.01, "distance": 3.0, "height": 34.0, "target": 0.0},
}

async def capture_site(label, site_dir):
    log_file = os.path.join(OUT, f"servidor_{label}.log")
    srv = subprocess.Popen(["node", SUBSRV, site_dir, log_file], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line:
            port = int(line.strip().split("=")[1])
            break
    print(f"[{label}] Servidor iniciado na porta {port}")

    data = {
        "label": label,
        "port": port,
        "http_4xx": [],
        "console_errors": [],
        "screenshots": {},
        "fps_3a": None,
        "fps_1a": None,
        "paving_loaded": False,
        "paving_normal_loaded": False,
    }

    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                channel="chrome",
                headless=False,
                args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--window-size=1440,900"]
            )
            page = await browser.new_page(viewport={"width": 1440, "height": 900})

            def on_resp(r):
                if r.status >= 400:
                    data["http_4xx"].append(f"{r.status} {r.url}")
                if "paving.webp" in r.url and r.status == 200:
                    data["paving_loaded"] = True
                if "paving-normal.webp" in r.url and r.status == 200:
                    data["paving_normal_loaded"] = True

            page.on("response", on_resp)
            page.on("console", lambda m: data["console_errors"].append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: data["console_errors"].append(f"pageerror: {e}"))

            print(f"[{label}] Abrindo /Gorilazz/?perf...")
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)

            # Entrar no mundo
            await page.evaluate("""() => {
                try {
                    localStorage.setItem('gorilazz_onboarding_optout','true');
                    localStorage.setItem('gorilazz_onboarding_seen','true');
                } catch (e) {}
                document.querySelector('#enter-world')?.click();
            }""")
            await asyncio.sleep(2)
            await page.evaluate("""() => {
                document.querySelectorAll('dialog').forEach(d => { try { d.close(); } catch (e) {} d.style.display = 'none'; });
                document.querySelector('#onboarding-start')?.click();
                const bt = document.querySelector('#band-toggle');
                if (bt && bt.getAttribute('aria-pressed') === 'true') bt.click();
            }""")

            # Aguardar carregamento de modelos
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.treesGlbLoaded === true", timeout=180000)
            await asyncio.sleep(5)

            # Capturar cada um dos 10 spots
            for name, spot in SPOTS.items():
                print(f"[{label}] Capturando spot {name}...")
                await page.evaluate("""(spot) => {
                    const g = window.__gorilazz;
                    g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0;
                    g.world.frameSpot(spot);
                    for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null);
                }""", spot)
                await asyncio.sleep(3.5)
                shot_path = os.path.join(OUT, f"{label}_{name}_1440x900.png")
                await page.screenshot(path=shot_path)
                data["screenshots"][name] = shot_path

            # Medir FPS 3a pessoa
            fps_3a = await page.evaluate("""() => new Promise(r => {
                let n = 0; const t0 = performance.now();
                const f = () => {
                    n++;
                    if (performance.now() - t0 < 4000) requestAnimationFrame(f);
                    else r(Math.round(n / ((performance.now() - t0) / 1000)));
                };
                requestAnimationFrame(f);
            })""")
            data["fps_3a"] = fps_3a

            # Medir FPS 1a pessoa
            await page.evaluate("() => document.querySelector('#first-person')?.click()")
            await asyncio.sleep(2)
            fps_1a = await page.evaluate("""() => new Promise(r => {
                let n = 0; const t0 = performance.now();
                const f = () => {
                    n++;
                    if (performance.now() - t0 < 4000) requestAnimationFrame(f);
                    else r(Math.round(n / ((performance.now() - t0) / 1000)));
                };
                requestAnimationFrame(f);
            })""")
            data["fps_1a"] = fps_1a

            # Voltar para 3a pessoa
            await page.evaluate("() => document.querySelector('#first-person')?.click()")
            await asyncio.sleep(1)

            # Se for DEPOIS, fazemos as checagens aprofundadas de regressão e interações
            if label == "depois":
                print("[depois] Executando checagens de regressão geral e UI...")
                reg = await page.evaluate("""async () => {
                    const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
                    const { CITY_LOTS, roadGap, accessPad } = await import(new URL('src/world-data.js', location.href).href);
                    const scene = window.__gorilazz.world.debug.scene;
                    
                    // Alce
                    const moose = scene.getObjectByName('easter-moose-glb');
                    const mooseVisible = !!(moose && moose.visible);

                    // Carros fora do asfalto
                    let parkedCarsOffAsphalt = 0;
                    const cars = [];
                    scene.traverse(o => { if (o.isInstancedMesh && /street-cars/.test(o.name)) cars.push(o); });
                    const v = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(), mat = new T.Matrix4();
                    for (const mesh of cars) {
                        for (let i = 0; i < mesh.count; i++) {
                            mesh.getMatrixAt(i, mat); mat.decompose(v, q, s);
                            if (roadGap({ x: v.x, z: v.z }) > 0.05) parkedCarsOffAsphalt++;
                        }
                    }

                    // Acesso dos prédios
                    let buildingsWithAccess = 0;
                    for (const lot of CITY_LOTS.filter(l => !l.landmark)) {
                        if (accessPad(lot, 0)) buildingsWithAccess++;
                    }

                    // Praça do Kong
                    const studioGround = scene.getObjectByName('studio-ground');

                    // Fauna pombos
                    const fauna = window.__gorilazz.world.debug.fauna;
                    const birdsCount = fauna && fauna.flock ? fauna.flock.length : 0;

                    // Áudio e motor
                    const motion = window.__gorilazz.world.debug.vehicleMotion;
                    const engineGain = motion ? motion.engineGain : null;

                    return {
                        mooseVisible,
                        parkedCarsOffAsphalt,
                        buildingsWithAccess,
                        hasStudioGround: !!studioGround,
                        birdsCount,
                        engineGain
                    };
                }""")
                data["regressoes"] = reg

                # Teste Mapa M
                await page.keyboard.press("KeyM")
                await asyncio.sleep(1)
                map_open = await page.evaluate("() => !document.querySelector('#full-map-overlay')?.hidden")
                await page.keyboard.press("Escape")
                await asyncio.sleep(1)
                map_closed = await page.evaluate("() => !!document.querySelector('#full-map-overlay')?.hidden")
                data["mapa_m_ok"] = map_open and map_closed

                # Teste Fliperama
                data["arcade_button_found"] = await page.evaluate("() => !!document.querySelector('#arcade-screen, .arcade-screen, dialog#arcade-dialog')")

                # Teste Passeio Guiado (start e pause)
                await page.evaluate("() => document.querySelector('#start-guided')?.click()")
                await asyncio.sleep(2)
                guided_active = await page.evaluate("() => !!window.__gorilazz.guidedActive || !!document.querySelector('#guided-bar')")
                data["guided_tour_tested"] = guided_active

            await browser.close()
    finally:
        srv.terminate()

    return data

async def main():
    print("=== INICIANDO VALIDAÇÃO DO ESTADO PUBLICADO (ANTES: 6a3d855) ===")
    antes = await capture_site("antes_publicado", SITE_ANTES)

    print("=== INICIANDO VALIDAÇÃO DO ESTADO ATUAL COM JUNÇÕES (DEPOIS) ===")
    depois = await capture_site("depois_juncoes", SITE_DEPOIS)

    consolidado = {
        "antes_publicado": antes,
        "depois_juncoes": depois
    }

    json_path = os.path.join(OUT, "relatorio_comparativo_final.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)
    print("Relatório comparativo salvo com sucesso em", json_path)

if __name__ == "__main__":
    asyncio.run(main())
