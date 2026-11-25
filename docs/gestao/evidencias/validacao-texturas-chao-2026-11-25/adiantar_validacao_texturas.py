import asyncio, json, os, subprocess, sys
from playwright.async_api import async_playwright

BASE = r"E:\Gorilazz-Relatorio"
OUT = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\validacao-texturas-chao-2026-11-25"
SUBSRV = os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs")

async def main():
    log_path = os.path.join(OUT, "servidor.log")
    srv = subprocess.Popen(["node", SUBSRV, BASE, log_path], cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    port = None
    for _ in range(60):
        line = srv.stdout.readline()
        if "PORT=" in line:
            port = int(line.strip().split("=")[1])
            break
    print(f"Servidor iniciado na porta {port}")

    results = {
        "http_4xx": [],
        "console_errors": [],
        "paving_loaded": False,
        "paving_normal_loaded": False,
        "pombos": {},
        "discos_praca": {},
        "texturas_chao": {},
        "regressoes": {},
        "fps_3a": None,
        "fps_1a": None,
        "screenshots": {}
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
                    results["http_4xx"].append(f"{r.status} {r.url}")
                if "paving.webp" in r.url and r.status == 200:
                    results["paving_loaded"] = True
                if "paving-normal.webp" in r.url and r.status == 200:
                    results["paving_normal_loaded"] = True

            page.on("response", on_resp)
            page.on("console", lambda m: results["console_errors"].append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: results["console_errors"].append(f"pageerror: {e}"))

            print("Carregando /Gorilazz/?perf...")
            await page.goto(f"http://127.0.0.1:{port}/Gorilazz/?perf", wait_until="networkidle")
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=120000)

            # Entrar no mundo e fechar onboarding
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

            # Aguardar carregamento de árvores e modelos
            await page.wait_for_function("() => window.__gorilazz.world.debug.streetProps.group.userData.treesGlbLoaded === true", timeout=180000)
            await asyncio.sleep(5)

            # 1. Auditoria de Pombos (Fauna)
            print("Auditando fauna / pombos...")
            pombos_info = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const fauna = g.world.debug.fauna;
                if (!fauna) return { error: 'fauna debug não encontrado' };
                const count = fauna.birds ? fauna.birds.length : 0;
                const perches = {};
                if (fauna.birds) {
                    for (const b of fauna.birds) {
                        perches[b.perch] = (perches[b.perch] || 0) + 1;
                    }
                }
                return { count, perches };
            }""")
            results["pombos"] = pombos_info

            # 2. Auditoria dos Discos Coloridos das Praças
            print("Auditando discos de praças...")
            discos_info = await page.evaluate("""async () => {
                const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
                const scene = window.__gorilazz.world.debug.scene;
                let foundPlazaCylinder = false;
                let foundPlazaDisks = [];
                scene.traverse(o => {
                    if (o.isMesh && o.geometry && o.geometry.type === 'CylinderGeometry') {
                        const params = o.geometry.parameters;
                        if (params && params.radiusTop >= 15 && params.radiusBottom >= 15 && params.height <= 0.1) {
                            foundPlazaCylinder = true;
                            foundPlazaDisks.push({ name: o.name, pos: o.position, material: o.material?.type });
                        }
                    }
                });
                return { foundPlazaCylinder, foundPlazaDisks };
            }""")
            results["discos_praca"] = discos_info

            # 3. Auditoria de Texturas e Amostragem de Cor na Calçada
            print("Amostrando cor da calçada e chão...")
            cor_calcada = await page.evaluate("""async () => {
                const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
                const scene = window.__gorilazz.world.debug.scene;
                // Encontrar material de calçada ou raycast em pontos de calçada
                const ray = new T.Raycaster();
                const sidewalkPoints = [
                    { x: 0, z: -35 },
                    { x: -10, z: -25 },
                    { x: 10, z: -25 },
                    { x: 0, z: -65 }
                ];
                const samples = [];
                for (const pt of sidewalkPoints) {
                    ray.set(new T.Vector3(pt.x, 10, pt.z), new T.Vector3(0, -1, 0));
                    const hits = ray.intersectObjects(scene.children, true).filter(h => h.object.isMesh);
                    if (hits.length > 0) {
                        const h = hits[0];
                        const mat = h.object.material;
                        const col = mat && mat.color ? [Math.round(mat.color.r * 255), Math.round(mat.color.g * 255), Math.round(mat.color.b * 255)] : null;
                        samples.push({
                            point: pt,
                            meshName: h.object.name,
                            y: h.point.y,
                            color: col,
                            hasMap: !!(mat && mat.map),
                            mapName: mat && mat.map && mat.map.name ? mat.map.name : null
                        });
                    }
                }
                return samples;
            }""")
            results["texturas_chao"]["calcada_samples"] = cor_calcada

            # 4. Auditoria de Regressões (Carros fora do asfalto, Alce GLB, Prédios com acesso)
            print("Auditando ausência de regressões...")
            regressoes = await page.evaluate("""async () => {
                const T = await import(new URL('src/vendor/three.module.min.js', location.href).href);
                const { CITY_LOTS, roadGap, accessPad } = await import(new URL('src/world-data.js', location.href).href);
                const scene = window.__gorilazz.world.debug.scene;
                
                // Alce
                const moose = scene.getObjectByName('easter-moose-glb');
                const mooseVisible = !!(moose && moose.visible);

                // Carros fora do asfalto (pela rotação e posição de streetProps)
                let parkedCarsCount = 0;
                let parkedCarsOffAsphalt = 0;
                const cars = [];
                scene.traverse(o => { if (o.isInstancedMesh && /street-cars/.test(o.name)) cars.push(o); });
                const v = new T.Vector3(), q = new T.Quaternion(), s = new T.Vector3(), mat = new T.Matrix4();
                for (const mesh of cars) {
                    for (let i = 0; i < mesh.count; i++) {
                        mesh.getMatrixAt(i, mat); mat.decompose(v, q, s);
                        parkedCarsCount++;
                        if (roadGap({ x: v.x, z: v.z }) > 0.05) {
                            parkedCarsOffAsphalt++;
                        }
                    }
                }

                // Acesso aos prédios
                let buildingsWithAccess = 0;
                for (const lot of CITY_LOTS.filter(l => !l.landmark)) {
                    if (accessPad(lot, 0)) buildingsWithAccess++;
                }

                // Praça do Kong piso
                const studioGround = scene.getObjectByName('studio-ground');
                const hasStudioGround = !!studioGround;

                // Motor e áudio
                const g = window.__gorilazz;
                const vehicleMotion = g.world.debug.vehicleMotion;

                return {
                    mooseVisible,
                    parkedCarsCount,
                    parkedCarsOffAsphalt,
                    buildingsWithAccess,
                    hasStudioGround
                };
            }""")
            results["regressoes"] = regressoes

            # 5. Capturas de Tela em Pontos Relevantes
            print("Capturando prints de evidência...")
            test_spots = [
                ("praca_kong", {"x": 0.0, "z": -30.0, "dirX": 0.7, "dirZ": 0.7, "distance": 11.0, "height": 4.0, "target": 0.8}),
                ("fliperama", {"x": -13.5, "z": -10.0, "dirX": 0.7, "dirZ": -0.7, "distance": 10.0, "height": 4.0, "target": 0.8}),
                ("palco_murdoc_terra", {"x": -51.8, "z": -127.7, "dirX": -0.7, "dirZ": -0.7, "distance": 12.0, "height": 5.0, "target": 0.8}),
                ("palco_noodle_grama", {"x": 34.8, "z": -118.3, "dirX": 0.66, "dirZ": 0.75, "distance": 12.0, "height": 5.0, "target": 0.8}),
                ("calcada_detalhe_baixa", {"x": 0.0, "z": -40.0, "dirX": 0.0, "dirZ": -1.0, "distance": 4.0, "height": 1.2, "target": 0.0})
            ]

            for name, spot in test_spots:
                await page.evaluate("""(spot) => {
                    const g = window.__gorilazz;
                    g.vehicle.x = -75; g.vehicle.z = 35; g.vehicle.speed = 0;
                    g.world.frameSpot(spot);
                    for (let i = 0; i < 40; i++) g.world.update(g.vehicle, performance.now() + i * 16.6, false, false, false, g.known, null);
                }""", spot)
                await asyncio.sleep(2.5)
                shot_path = os.path.join(OUT, f"evidencia_{name}_1440x900.png")
                await page.screenshot(path=shot_path)
                results["screenshots"][name] = shot_path

            # 6. Teste de Câmera 1ª Pessoa e FPS
            print("Testando 1ª pessoa e medindo FPS...")
            await page.evaluate("""() => {
                document.querySelector('#first-person')?.click();
            }""")
            await asyncio.sleep(2)
            shot_1a = os.path.join(OUT, "evidencia_1a_pessoa_cockpit_1440x900.png")
            await page.screenshot(path=shot_1a)
            results["screenshots"]["cockpit_1a"] = shot_1a

            fps_1a = await page.evaluate("""() => new Promise(r => {
                let n = 0; const t0 = performance.now();
                const f = () => {
                    n++;
                    if (performance.now() - t0 < 4000) requestAnimationFrame(f);
                    else r(Math.round(n / ((performance.now() - t0) / 1000)));
                };
                requestAnimationFrame(f);
            })""")
            results["fps_1a"] = fps_1a

            # Voltar para 3ª pessoa e medir FPS
            await page.evaluate("""() => {
                document.querySelector('#first-person')?.click();
            }""")
            await asyncio.sleep(2)
            fps_3a = await page.evaluate("""() => new Promise(r => {
                let n = 0; const t0 = performance.now();
                const f = () => {
                    n++;
                    if (performance.now() - t0 < 4000) requestAnimationFrame(f);
                    else r(Math.round(n / ((performance.now() - t0) / 1000)));
                };
                requestAnimationFrame(f);
            })""")
            results["fps_3a"] = fps_3a

            # 7. Teste de UI: Mapa M e Onboarding
            print("Testando Mapa M e botões de interface...")
            await page.keyboard.press("KeyM")
            await asyncio.sleep(1)
            map_open = await page.evaluate("() => !document.querySelector('#full-map-overlay')?.hidden")
            await page.keyboard.press("Escape")
            await asyncio.sleep(1)
            map_closed = await page.evaluate("() => !!document.querySelector('#full-map-overlay')?.hidden")
            results["mapa_m_ok"] = map_open and map_closed

            await browser.close()
    finally:
        srv.terminate()

    json_path = os.path.join(OUT, "adiantamento_validacao_resultados.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print("Concluído. Resultados salvos em", json_path)

if __name__ == "__main__":
    asyncio.run(main())
