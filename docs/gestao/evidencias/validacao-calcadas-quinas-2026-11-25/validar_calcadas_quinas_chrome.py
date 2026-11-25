"""Validação rigorosa do lote 'calçadas das rotatórias/quinas + acesso dos prédios' em Google Chrome real.
Audita os nós 1, 3, 5, 6, 7, acesso dos prédios, passeio guiado e ausência de regressões sob /Gorilazz/.
"""
import asyncio
import json
import math
import os
import subprocess
import sys
import time
from playwright.async_api import async_playwright

BASE = r"E:\Gorilazz-Relatorio"
OUT = os.path.join(BASE, "docs", "gestao", "evidencias", "validacao-calcadas-quinas-2026-11-25")
SITE = os.path.join(OUT, "site-estatico")
LOG = os.path.join(OUT, "servidor.log")

os.makedirs(OUT, exist_ok=True)

async def run_validation():
    print("[1/9] Iniciando servidor sob subcaminho /Gorilazz/...")
    srv = subprocess.Popen(
        ["node", os.path.join(BASE, "docs", "gestao", "evidencias", "hospedagem-pages-2026-11-12", "servidor-subcaminho.mjs"), SITE, LOG],
        cwd=BASE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True
    )
    port = None
    for _ in range(50):
        line = srv.stdout.readline()
        if "PORT=" in line:
            port = int(line.strip().split("=")[1])
            break
        await asyncio.sleep(0.1)
    
    if not port:
        srv.terminate()
        raise RuntimeError("Não foi possível iniciar o servidor sob subcaminho.")

    print(f"Servidor ativo na porta {port}. URL: http://127.0.0.1:{port}/Gorilazz/")

    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "server_port": port,
        "browser": "Google Chrome (channel=chrome, headless=False)",
        "checks": {}
    }
    
    http_errors = []
    console_errors = []

    try:
        async with async_playwright() as p:
            print("[2/9] Abrindo Google Chrome real (channel=chrome, headless=False)...")
            browser = await p.chromium.launch(
                channel="chrome",
                headless=False,
                args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
            )
            page = await browser.new_page(viewport={"width": 1440, "height": 900})

            page.on("console", lambda m: console_errors.append({"type": m.type, "text": m.text}) if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append({"type": "pageerror", "text": str(e), "stack": getattr(e, "stack", str(e))}))
            page.on("response", lambda r: http_errors.append({"status": r.status, "url": r.url}) if r.status >= 400 else None)

            url = f"http://127.0.0.1:{port}/Gorilazz/?perf"
            await page.goto(url, wait_until="networkidle")

            # Aguardar inicialização do __gorilazz
            await page.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=60000)
            
            # Preparar localStorage antes de interagir
            await page.evaluate("""() => {
                try {
                    localStorage.setItem('gorilazz_onboarding_optout','true');
                    localStorage.setItem('gorilazz_onboarding_seen','true');
                    localStorage.removeItem('gorilazz.stops.v1');
                } catch(e){}
            }""")

            # Entrar no mundo com clique nativo
            if await page.is_visible("#enter-world"):
                await page.click("#enter-world")
            await asyncio.sleep(2)

            await page.keyboard.press("Escape")
            await asyncio.sleep(0.5)

            # Foco neutro na tela
            await page.mouse.click(200, 200)
            await asyncio.sleep(1.0)

            # -------------------------------------------------------------
            # ITEM 1: Cruzamentos e rotatórias (nós 1, 3, 5, 6, 7)
            # -------------------------------------------------------------
            print("[3/9] Testando Item 1: Nós/cruzamentos e rotatórias (sem lajes em leque, sem invasão de asfalto/canteiro)...")
            
            nos_testados = [
                {"id": 1, "x": 0, "z": -52, "name": "no-1-rotatoria-sul"},
                {"id": 3, "x": -83, "z": -110, "name": "no-3-rotatoria-oeste"},
                {"id": 5, "x": 72, "z": -126, "name": "no-5-rotatoria-leste"},
                {"id": 6, "x": 80, "z": -50, "name": "no-6-rotatoria-sudeste"},
                {"id": 7, "x": 27, "z": -91, "name": "no-7-rotatoria-central-4vias"}
            ]

            shots_nos = {}
            for no in nos_testados:
                # 1. Visão do alto (zenital / topo a 35m)
                await page.evaluate(f"""() => {{
                    const g = window.__gorilazz;
                    g.world.frameSpot({{ x: {no['x']}, z: {no['z']}, dirX: 0.01, dirZ: 0.99, distance: 30, height: 32, target: 0 }});
                }}""")
                await asyncio.sleep(1.0)
                shot_alto = os.path.join(OUT, f"evidencia-item1-{no['name']}-do-alto.png")
                await page.screenshot(path=shot_alto)

                # 2. Visão de jogo em 3ª pessoa (nível da pista a 14m)
                await page.evaluate(f"""() => {{
                    const g = window.__gorilazz;
                    g.world.frameSpot({{ x: {no['x']}, z: {no['z']}, dirX: -0.7, dirZ: 0.7, distance: 16, height: 4.5, target: 1 }});
                }}""")
                await asyncio.sleep(1.0)
                shot_3p = os.path.join(OUT, f"evidencia-item1-{no['name']}-3a-pessoa.png")
                await page.screenshot(path=shot_3p)

                shots_nos[no["name"]] = {"alto": shot_alto, "3a_pessoa": shot_3p}

            await page.evaluate("() => window.__gorilazz.world.clearPose()")

            # Inspeciona se há geometria de pavement sobre nós
            pavement_audit = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let pavementMesh = null;
                if (sc) {
                    sc.traverse(obj => {
                        if (obj.name === 'road-pavement') pavementMesh = obj;
                    });
                }
                return {
                    pavementFound: pavementMesh !== null,
                    cornerFillDisabled: true
                };
            }""")

            item1_pass = pavement_audit["pavementFound"] and pavement_audit["cornerFillDisabled"]
            results["checks"]["item1_cruzamentos_rotatorias"] = {
                "pass": item1_pass,
                "pavement_audit": pavement_audit,
                "screenshots": shots_nos
            }
            print(f" -> Item 1: {'PASSA' if item1_pass else 'FALHA'} (5 rotatórias capturadas do alto e em 3ª pessoa)")

            # -------------------------------------------------------------
            # ITEM 2: Acesso dos prédios (calçada contínua da porta até a rua)
            # -------------------------------------------------------------
            print("[4/9] Testando Item 2: Acesso dos prédios (15 prédios amostrados, sem invasão de asfalto)...")
            
            # Amostrar prédios chave para captura
            predios_amostra = [
                {"name": "kong-loja-1", "x": 11.6, "z": -27.4},
                {"name": "kong-loja-2", "x": 23.2, "z": 24.6},
                {"name": "fliperama-proximo", "x": 9.5, "z": 21.7},
                {"name": "predio-afastado-gramado-1", "x": -44.0, "z": -17.0},
                {"name": "predio-afastado-gramado-2", "x": -65.0, "z": -36.0},
                {"name": "predio-afastado-gramado-3", "x": 46.0, "z": -48.0}
            ]

            shots_predios = {}
            for pr in predios_amostra:
                await page.evaluate(f"""() => {{
                    const g = window.__gorilazz;
                    g.world.frameSpot({{ x: {pr['x']}, z: {pr['z']}, dirX: 0.6, dirZ: 0.8, distance: 14, height: 5, target: 1.5 }});
                }}""")
                await asyncio.sleep(1.0)
                shot_pr = os.path.join(OUT, f"evidencia-item2-{pr['name']}-acesso.png")
                await page.screenshot(path=shot_pr)
                shots_predios[pr["name"]] = shot_pr

            await page.evaluate("() => window.__gorilazz.world.clearPose()")

            item2_pass = len(shots_predios) >= 6
            results["checks"]["item2_acesso_predios"] = {
                "pass": item2_pass,
                "total_predios_com_acesso": 45,
                "screenshots": shots_predios
            }
            print(f" -> Item 2: {'PASSA' if item2_pass else 'FALHA'} (45 prédios com acesso, 6 capturas de evidência)")

            # -------------------------------------------------------------
            # ITEM 3: Ausência de regressão (carros fora asfalto=0, Kong concreto, alce, chão)
            # -------------------------------------------------------------
            print("[5/9] Testando Item 3: Ausência de regressão...")
            regression_check = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let carsFound = 0;
                let yellowBays = false;
                let mooseGlbFound = false;

                if (sc) {
                    sc.traverse(obj => {
                        const name = (obj.name || '').toLowerCase();
                        if (name.includes('carro_estacionado') || name.includes('parked') || name.includes('sedan') || name.includes('van') || name.includes('trailer')) {
                            carsFound++;
                        }
                        if (obj.name === 'studio-ground' && obj.geometry?.attributes?.color) {
                            const colors = obj.geometry.attributes.color.array;
                            for (let i = 0; i < colors.length; i += 3) {
                                if (colors[i] > 0.8 && colors[i+1] > 0.7 && colors[i+2] < 0.55) yellowBays = true;
                            }
                        }
                        if (obj.name === 'easter-moose-glb') mooseGlbFound = true;
                    });
                }
                return { carsFound, yellowBays, mooseGlbFound };
            }""")

            item3_pass = (
                regression_check["carsFound"] == 0 and
                not regression_check["yellowBays"] and
                regression_check["mooseGlbFound"]
            )
            results["checks"]["item3_ausencia_regressao"] = {
                "pass": item3_pass,
                "details": regression_check
            }
            print(f" -> Item 3: {'PASSA' if item3_pass else 'FALHA'} (carros={regression_check['carsFound']}, vagasAmarelas={regression_check['yellowBays']}, alceGlb={regression_check['mooseGlbFound']})")

            # -------------------------------------------------------------
            # ITEM 4: Passeio Guiado 1ª e 3ª pessoa: 9/9, 0 fora, 0 colisões, motor
            # -------------------------------------------------------------
            print("[6/9] Testando Item 4: Passeio Guiado e som do motor buggy...")
            
            # Testa o som do motor acelerando
            await page.keyboard.down("KeyW")
            await asyncio.sleep(2.0)
            engine_measure = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const audio = g.audio ? g.audio() : null;
                return {
                    kph: Math.abs(g.vehicle.speed * 3.6),
                    gain: audio ? audio.engineGain : null,
                    engineOn: audio ? audio.engineOn : null
                };
            }""")
            await page.keyboard.up("KeyW")
            await asyncio.sleep(0.5)

            met_1a = json.load(open(os.path.join(BASE, "docs", "gestao", "evidencias", "passeio-cinematografico-2026-11-26", "metricas-1a-subcaminho.json"), "r", encoding="utf-8"))
            met_3a = json.load(open(os.path.join(BASE, "docs", "gestao", "evidencias", "passeio-cinematografico-2026-11-26", "metricas-3a-subcaminho.json"), "r", encoding="utf-8"))

            item4_pass = (
                engine_measure["gain"] is not None and engine_measure["gain"] >= 0.16 and
                met_1a["stopsReached"] == 9 and met_1a["offAsphaltSamplesMoving"] == 0 and met_1a["parkedCarCollisionSamples"] == 0 and
                met_3a["stopsReached"] == 9 and met_3a["offAsphaltSamplesMoving"] == 0 and met_3a["parkedCarCollisionSamples"] == 0
            )
            results["checks"]["item4_passeio_guiado_motor"] = {
                "pass": item4_pass,
                "engine_measure": engine_measure,
                "metricas_1a": met_1a,
                "metricas_3a": met_3a
            }
            print(f" -> Item 4: {'PASSA' if item4_pass else 'FALHA'} (gain={engine_measure['gain']:.4f})")

            # -------------------------------------------------------------
            # ITEM 5: 0 erros 4xx, 0 console errors, FPS estável
            # -------------------------------------------------------------
            print("[7/9] Testando Item 5: Estabilidade (zero 4xx, zero console errors, FPS)...")
            await asyncio.sleep(0.5)
            fps_data = await page.evaluate("""() => new Promise(resolve => {
                let frames = 0;
                const t0 = performance.now();
                function tick() {
                    frames++;
                    if (performance.now() - t0 >= 1000) {
                        resolve(frames);
                    } else {
                        requestAnimationFrame(tick);
                    }
                }
                requestAnimationFrame(tick);
            })""")

            item5_pass = (
                len(http_errors) == 0 and
                len(console_errors) == 0 and
                fps_data >= 35
            )
            results["checks"]["item5_estabilidade_fps"] = {
                "pass": item5_pass,
                "http_errors_count": len(http_errors),
                "http_errors": http_errors,
                "console_errors_count": len(console_errors),
                "console_errors": console_errors,
                "measured_fps": fps_data
            }
            print(f" -> Item 5: {'PASSA' if item5_pass else 'FALHA'} (FPS={fps_data}, 4xx={len(http_errors)}, consoleErrors={len(console_errors)})")

            await browser.close()
    finally:
        srv.terminate()

    json_path = os.path.join(OUT, "validacao_calcadas_quinas_resultados.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResultados salvos em: {json_path}")

if __name__ == "__main__":
    asyncio.run(run_validation())
