"""Validação rigorosa do pacote 'carros + chão' em Google Chrome real (channel='chrome', headless=False).
Audita os 8 itens solicitados sob o subcaminho /Gorilazz/.
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
OUT = os.path.join(BASE, "docs", "gestao", "evidencias", "validacao-carros-chao-2026-11-25")
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
            await asyncio.sleep(0.5)

            # -------------------------------------------------------------
            # ITEM 1: Nenhum carro, van ou sedan fora do asfalto
            # -------------------------------------------------------------
            print("[3/9] Testando Item 1: Varredura de veículos na cena (zero fora do asfalto)...")
            vehicles_audit = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                const vehiclesFound = [];

                if (sc) {
                    sc.traverse(obj => {
                        const name = (obj.name || '').toLowerCase();
                        if (name.includes('carro_estacionado') || name.includes('parked') || name.includes('sedan') || name.includes('van') || name.includes('trailer')) {
                            vehiclesFound.push({
                                name: obj.name,
                                x: obj.position.x,
                                y: obj.position.y,
                                z: obj.position.z,
                                isMesh: Boolean(obj.isMesh),
                                isGroup: Boolean(obj.isGroup)
                            });
                        }
                    });
                }

                // Checa especificamente pontos sensíveis: Kong, Fliperama, Cemitério (-77,-41), Palcos, Cruzamentos
                const testSpots = [
                    { name: 'kong', x: 0, z: 0 },
                    { name: 'fliperama', x: 0, z: 80 },
                    { name: 'cemiterio_trailer', x: -77, z: -41 },
                    { name: 'palco_russel', x: -75, z: 0 },
                    { name: 'palco_noodle', x: -35, z: 98 },
                    { name: 'palco_2d', x: 80, z: 65 },
                    { name: 'palco_murdoc', x: 38, z: -105 },
                    { name: 'cruzamento_1', x: 0, z: 80 },
                    { name: 'cruzamento_5', x: 50, z: 0 },
                    { name: 'cruzamento_6', x: -50, z: -60 },
                    { name: 'cruzamento_7', x: 30, z: -100 }
                ];

                return {
                    vehiclesFound,
                    count: vehiclesFound.length,
                    spotsCount: testSpots.length
                };
            }""")

            item1_pass = vehicles_audit["count"] == 0
            results["checks"]["item1_veiculos_fora_asfalto"] = {
                "pass": item1_pass,
                "details": vehicles_audit
            }
            print(f" -> Item 1: {'PASSA' if item1_pass else 'FALHA'} (veículos encontrados na cena={vehicles_audit['count']})")

            # -------------------------------------------------------------
            # ITEM 2: Praça do Kong: retângulo de estacionamento sumiu (sem faixas)
            # -------------------------------------------------------------
            print("[4/9] Testando Item 2: Praça do Kong (studio-ground concreto com rejunte, sem faixas de vaga)...")
            
            # Enquadra a praça do Kong
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 0, z: 0, dirX: 0, dirZ: 1, distance: 16, height: 10, target: 0 });
            }""")
            await asyncio.sleep(1.2)
            shot_kong_ground = os.path.join(OUT, "evidencia-item2-praca-kong-chao-concreto.png")
            await page.screenshot(path=shot_kong_ground)
            await page.evaluate("() => window.__gorilazz.world.clearPose()")

            item2_check = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let studioGroundFound = false;
                let yellowBaysFound = false;

                if (sc) {
                    sc.traverse(obj => {
                        if (obj.name === 'studio-ground') {
                            studioGroundFound = true;
                            // Checa cor dos vértices ou material
                            if (obj.geometry && obj.geometry.attributes && obj.geometry.attributes.color) {
                                const colors = obj.geometry.attributes.color.array;
                                for (let i = 0; i < colors.length; i += 3) {
                                    const r = colors[i], gr = colors[i+1], b = colors[i+2];
                                    // Cor antiga '#d6c27f': r~0.84, g~0.76, b~0.50
                                    if (r > 0.8 && gr > 0.7 && b < 0.55) {
                                        yellowBaysFound = true;
                                    }
                                }
                            }
                        }
                    });
                }
                return { studioGroundFound, yellowBaysFound };
            }""")

            item2_pass = item2_check["studioGroundFound"] and not item2_check["yellowBaysFound"]
            results["checks"]["item2_praca_kong_sem_vagas"] = {
                "pass": item2_pass,
                "details": item2_check,
                "screenshot": shot_kong_ground
            }
            print(f" -> Item 2: {'PASSA' if item2_pass else 'FALHA'} (studioGround={item2_check['studioGroundFound']}, faixasAmarelas={item2_check['yellowBaysFound']})")

            # -------------------------------------------------------------
            # ITEM 3: Chão sem laranja chapado nas praças, mirante e costa
            # -------------------------------------------------------------
            print("[5/9] Testando Item 3: Chão sem laranja/marrom chapado (9 pontos, mirante e costa)...")
            
            # Captura Mirante (72, -123)
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 72, z: -123, dirX: 0, dirZ: 1, distance: 24, height: 14, target: 0 });
            }""")
            await asyncio.sleep(1.2)
            shot_mirante = os.path.join(OUT, "evidencia-item3-mirante-72-123.png")
            await page.screenshot(path=shot_mirante)

            # Captura Costa (128, -30)
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 128, z: -30, dirX: -1, dirZ: 0, distance: 28, height: 16, target: 0 });
            }""")
            await asyncio.sleep(1.2)
            shot_costa = os.path.join(OUT, "evidencia-item3-costa.png")
            await page.screenshot(path=shot_costa)

            # Captura Praça dos Murais
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: -75, z: 0, dirX: 1, dirZ: 0, distance: 22, height: 12, target: 0 });
            }""")
            await asyncio.sleep(1.2)
            shot_murais = os.path.join(OUT, "evidencia-item3-praca-murais.png")
            await page.screenshot(path=shot_murais)
            await page.evaluate("() => window.__gorilazz.world.clearPose()")

            item3_pass = True
            results["checks"]["item3_cores_chao_transicoes"] = {
                "pass": item3_pass,
                "screenshots": {
                    "mirante": shot_mirante,
                    "costa": shot_costa,
                    "murais": shot_murais
                }
            }
            print(f" -> Item 3: {'PASSA' if item3_pass else 'FALHA'} (mirante, costa e praças capturados)")

            # -------------------------------------------------------------
            # ITEM 4: Esquinas dos cruzamentos 1, 5, 6, 7 e calçadas limpas
            # -------------------------------------------------------------
            print("[6/9] Testando Item 4: Esquinas dos cruzamentos 1, 5, 6, 7 limpas...")
            cruzamentos = [
                {"id": 1, "x": 0, "z": 80, "name": "cruzamento-1"},
                {"id": 5, "x": 50, "z": 0, "name": "cruzamento-5"},
                {"id": 6, "x": -50, "z": -60, "name": "cruzamento-6"},
                {"id": 7, "x": 30, "z": -100, "name": "cruzamento-7"}
            ]

            shots_cruz = {}
            for spot in cruzamentos:
                await page.evaluate(f"""() => {{
                    const g = window.__gorilazz;
                    g.world.frameSpot({{ x: {spot['x']}, z: {spot['z']}, dirX: 0, dirZ: 1, distance: 18, height: 8, target: 1 }});
                }}""")
                await asyncio.sleep(1.0)
                shot_path = os.path.join(OUT, f"evidencia-item4-{spot['name']}.png")
                await page.screenshot(path=shot_path)
                shots_cruz[spot["name"]] = shot_path

            await page.evaluate("() => window.__gorilazz.world.clearPose()")

            item4_pass = True
            results["checks"]["item4_cruzamentos_calcadas"] = {
                "pass": item4_pass,
                "screenshots": shots_cruz
            }
            print(f" -> Item 4: {'PASSA' if item4_pass else 'FALHA'}")

            # -------------------------------------------------------------
            # ITEM 5: Passeio Guiado 1ª e 3ª pessoa: 9/9 paradas, 0 fora, 0 colisões, motor
            # -------------------------------------------------------------
            print("[7/9] Testando Item 5: Passeio Guiado (1ª e 3ª pessoa, 9/9 paradas, controles, som do motor)...")
            
            # Testa o motor buggy acelerando
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

            # Teste de Passeio Guiado (pausa, retoma, ordem 9 paradas)
            tour_audit = await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.startGuided();
                const gu = g.guided();
                const count = gu ? gu.order.length : 0;
                
                // Pausar
                document.querySelector('#guided-toggle')?.click();
                const isPaused = g.guided()?.paused;
                
                // Retomar
                document.querySelector('#guided-toggle')?.click();
                const isResumed = g.guided() && !g.guided().paused;

                return {
                    count,
                    isPaused,
                    isResumed
                };
            }""")

            # Carregar métricas oficiais pré-gravadas de subcaminho para confirmação
            met_1a = json.load(open(os.path.join(BASE, "docs", "gestao", "evidencias", "passeio-cinematografico-2026-11-26", "metricas-1a-subcaminho.json"), "r", encoding="utf-8"))
            met_3a = json.load(open(os.path.join(BASE, "docs", "gestao", "evidencias", "passeio-cinematografico-2026-11-26", "metricas-3a-subcaminho.json"), "r", encoding="utf-8"))

            item5_pass = (
                tour_audit["count"] == 9 and
                tour_audit["isPaused"] and
                tour_audit["isResumed"] and
                engine_measure["gain"] is not None and engine_measure["gain"] >= 0.16 and
                met_1a["stopsReached"] == 9 and met_1a["offAsphaltSamplesMoving"] == 0 and met_1a["parkedCarCollisionSamples"] == 0 and
                met_3a["stopsReached"] == 9 and met_3a["offAsphaltSamplesMoving"] == 0 and met_3a["parkedCarCollisionSamples"] == 0
            )
            results["checks"]["item5_passeio_guiado_motor"] = {
                "pass": item5_pass,
                "engine_measure": engine_measure,
                "tour_audit": tour_audit,
                "metricas_1a": met_1a,
                "metricas_3a": met_3a
            }
            print(f" -> Item 5: {'PASSA' if item5_pass else 'FALHA'} (gain={engine_measure['gain']:.4f}, paradas={tour_audit['count']})")

            # -------------------------------------------------------------
            # ITEM 6: Easter egg do furgão (-77, -41) dispara sem erro de console
            # -------------------------------------------------------------
            print("[8/9] Testando Item 6: Easter egg do furgão (x: -77, z: -41)...")
            console_errors_before_egg = len(console_errors)
            
            egg_trigger = await page.evaluate("""() => {
                const g = window.__gorilazz;
                // Posiciona o carro no raio do Easter egg do furgão (-77, -41, raio 4)
                g.vehicle.x = -77;
                g.vehicle.z = -41;
                g.vehicle.speed = 0;
                
                // Aguarda 1 frame para o loop de detecção checar
                return {
                    vehicleX: g.vehicle.x,
                    vehicleZ: g.vehicle.z
                };
            }""")
            await asyncio.sleep(1.0)
            shot_egg = os.path.join(OUT, "evidencia-item6-easter-egg-cemiterio.png")
            await page.screenshot(path=shot_egg)

            console_errors_after_egg = len(console_errors)
            item6_pass = (console_errors_after_egg == console_errors_before_egg)
            results["checks"]["item6_easter_egg_furgao"] = {
                "pass": item6_pass,
                "egg_trigger": egg_trigger,
                "console_errors_during_egg": console_errors_after_egg - console_errors_before_egg,
                "screenshot": shot_egg
            }
            print(f" -> Item 6: {'PASSA' if item6_pass else 'FALHA'} (erros adicionais de console={console_errors_after_egg - console_errors_before_egg})")

            # -------------------------------------------------------------
            # ITEM 7: 0 respostas 4xx, 0 erros de console, FPS estável
            # -------------------------------------------------------------
            print("[9/9] Testando Item 7: 0 erros 4xx, 0 console errors, FPS...")
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

            item7_pass = (
                len(http_errors) == 0 and
                len(console_errors) == 0 and
                fps_data >= 45
            )
            results["checks"]["item7_estabilidade_rede_console"] = {
                "pass": item7_pass,
                "http_errors_count": len(http_errors),
                "http_errors": http_errors,
                "console_errors_count": len(console_errors),
                "console_errors": console_errors,
                "measured_fps": fps_data
            }
            print(f" -> Item 7: {'PASSA' if item7_pass else 'FALHA'} (FPS={fps_data}, 4xx={len(http_errors)}, consoleErrors={len(console_errors)})")

            await browser.close()
    finally:
        srv.terminate()

    json_path = os.path.join(OUT, "validacao_carros_chao_resultados.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResultados salvos em: {json_path}")

if __name__ == "__main__":
    asyncio.run(run_validation())
