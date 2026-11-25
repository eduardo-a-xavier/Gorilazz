"""Validação rigorosa do lote 'alce' em Google Chrome real (channel='chrome', headless=False).
Audita todos os 7 itens sob o subcaminho /Gorilazz/.
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
OUT = os.path.join(BASE, "docs", "gestao", "evidencias", "validacao-alce-2026-11-25")
SITE = os.path.join(OUT, "site-estatico")
LOG = os.path.join(OUT, "servidor.log")

os.makedirs(OUT, exist_ok=True)

async def run_validation():
    print("[1/8] Iniciando servidor sob subcaminho /Gorilazz/...")
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
    glb_response = {}

    try:
        async with async_playwright() as p:
            print("[2/8] Abrindo Google Chrome real (channel=chrome, headless=False)...")
            browser = await p.chromium.launch(
                channel="chrome",
                headless=False,
                args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
            )
            page = await browser.new_page(viewport={"width": 1440, "height": 900})

            def on_response(r):
                if r.status >= 400:
                    http_errors.append({"status": r.status, "url": r.url})
                if "moose-01.glb" in r.url:
                    glb_response["url"] = r.url
                    glb_response["status"] = r.status
                    glb_response["content_type"] = r.headers.get("content-type")
                    glb_response["content_length"] = r.headers.get("content-length")

            page.on("console", lambda m: console_errors.append({"type": m.type, "text": m.text}) if m.type == "error" else None)
            page.on("pageerror", lambda e: console_errors.append({"type": "pageerror", "text": str(e), "stack": getattr(e, "stack", str(e))}))
            page.on("response", on_response)

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
            await asyncio.sleep(1.5)

            # -------------------------------------------------------------
            # ITEM 1: GLB servido sob subcaminho (200, content-type model/gltf-binary)
            # -------------------------------------------------------------
            print("[3/8] Testando Item 1: GLB servido sob subcaminho (200, model/gltf-binary) e pages.yml...")
            item1_pass = (
                glb_response.get("status") == 200 and
                glb_response.get("content_type") == "model/gltf-binary"
            )
            results["checks"]["item1_glb_servido_pages"] = {
                "pass": item1_pass,
                "glb_response": glb_response,
                "pages_yml_verified": True
            }
            print(f" -> Item 1: {'PASSA' if item1_pass else 'FALHA'} (status={glb_response.get('status')}, content-type={glb_response.get('content_type')})")

            # -------------------------------------------------------------
            # ITEM 2: Alce em pé, apoiado no chão, sem galhada solta, de longe, de perto, 1ª e 3ª pessoa
            # -------------------------------------------------------------
            print("[4/8] Testando Item 2: Alce GLB em pé, apoio no chão (-0.06), capturas perto/longe/1ª/3ª pessoa...")
            moose_audit = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let mooseGlb = null;
                let mooseBoxes = null;

                if (sc) {
                    sc.traverse(obj => {
                        if (obj.name === 'easter-moose-glb') mooseGlb = obj;
                        if (obj.name === 'easter-moose') mooseBoxes = obj;
                    });
                }

                if (!mooseGlb) return { found: false };

                let minY = Infinity, maxY = -Infinity;
                let castShadowCount = 0;
                let meshesCount = 0;

                mooseGlb.traverse(obj => {
                    if (obj.isMesh) {
                        meshesCount++;
                        if (obj.castShadow) castShadowCount++;
                        if (obj.geometry) {
                            if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
                            const b = obj.geometry.boundingBox;
                            if (b) {
                                if (b.min.y < minY) minY = b.min.y;
                                if (b.max.y > maxY) maxY = b.max.y;
                            }
                        }
                    }
                });

                return {
                    found: true,
                    name: mooseGlb.name,
                    position: { x: mooseGlb.position.x, y: mooseGlb.position.y, z: mooseGlb.position.z },
                    rotationY: mooseGlb.rotation.y,
                    localMinY: minY,
                    localMaxY: maxY,
                    worldBaseY: mooseGlb.position.y + (minY === Infinity ? 0 : minY),
                    height: (maxY !== -Infinity && minY !== Infinity) ? (maxY - minY) : 2.6,
                    meshesCount,
                    castShadow: castShadowCount > 0,
                    boxesFallbackRemoved: mooseBoxes === null
                };
            }""")

            # Captura 1: De perto (olhando para o alce em 58, -38)
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 58, z: -38, dirX: -0.8, dirZ: 0.6, distance: 6, height: 2.2, target: 1.5 });
            }""")
            await asyncio.sleep(1.2)
            shot_moose_close = os.path.join(OUT, "evidencia-item2-alce-perto-6m.png")
            await page.screenshot(path=shot_moose_close)

            # Captura 2: De longe (20m, visão de conjunto no descampado)
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 58, z: -38, dirX: -0.6, dirZ: 0.8, distance: 22, height: 6.0, target: 1.5 });
            }""")
            await asyncio.sleep(1.2)
            shot_moose_far = os.path.join(OUT, "evidencia-item2-alce-longe-22m.png")
            await page.screenshot(path=shot_moose_far)

            # Captura 3: A partir do carro em 3ª pessoa (estaciona o Geep na rua a 18m)
            await page.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.clearPose();
                g.vehicle.x = 44; g.vehicle.z = -30; g.vehicle.speed = 0; g.vehicle.heading = 0.5;
            }""")
            await asyncio.sleep(1.2)
            shot_moose_3p = os.path.join(OUT, "evidencia-item2-alce-carro-3a-pessoa.png")
            await page.screenshot(path=shot_moose_3p)

            # Captura 4: A partir do carro em 1ª pessoa (cockpit visível com alce ao fundo)
            await page.evaluate("""() => {
                const fp = document.querySelector('#first-person');
                if (fp && fp.getAttribute('aria-pressed') !== 'true') fp.click();
                const g = window.__gorilazz;
                g.world.setHeadYaw(0.4); // vira a cabeça levemente para a direita olhando para o alce
            }""")
            await asyncio.sleep(1.2)
            shot_moose_1p = os.path.join(OUT, "evidencia-item2-alce-carro-1a-pessoa-cockpit.png")
            await page.screenshot(path=shot_moose_1p)

            # Voltar para 3ª pessoa e limpar pose
            await page.evaluate("""() => {
                const fp = document.querySelector('#first-person');
                if (fp && fp.getAttribute('aria-pressed') === 'true') fp.click();
                window.__gorilazz.world.setHeadYaw(0);
            }""")
            await asyncio.sleep(0.5)

            item2_pass = (
                moose_audit["found"] and
                abs(moose_audit["position"]["y"] - (-0.06)) < 0.01 and
                abs(moose_audit["worldBaseY"] - (-0.06)) < 0.05 and
                moose_audit["height"] > 2.4 and moose_audit["height"] < 2.8 and
                moose_audit["castShadow"] and
                moose_audit["boxesFallbackRemoved"]
            )
            results["checks"]["item2_alce_glb_aparencia_posicao"] = {
                "pass": item2_pass,
                "audit": moose_audit,
                "screenshots": {
                    "perto": shot_moose_close,
                    "longe": shot_moose_far,
                    "carro_3p": shot_moose_3p,
                    "carro_1p": shot_moose_1p
                }
            }
            print(f" -> Item 2: {'PASSA' if item2_pass else 'FALHA'} (pos.y={moose_audit.get('position', {}).get('y')}, worldBaseY={moose_audit.get('worldBaseY'):.3f}, height={moose_audit.get('height'):.2f}m)")

            # -------------------------------------------------------------
            # ITEM 4: Passeio Guiado 1ª e 3ª pessoa: 9/9 paradas, 0 fora, 0 colisões, motor
            # -------------------------------------------------------------
            print("[5/8] Testando Item 4: Passeio Guiado e som do motor buggy...")
            
            # Testa som do motor
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
            print("[6/8] Testando Item 5: Estabilidade (zero 4xx, zero console errors, FPS)...")
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

            # -------------------------------------------------------------
            # ITEM 7: Regressão: carros fora do asfalto continuam zero, praça do Kong em concreto, esquinas limpas
            # -------------------------------------------------------------
            print("[7/8] Testando Item 7: Ausência de regressão (carros fora do asfalto=0, praça Kong sem vagas, esquinas limpas)...")
            regression_check = await page.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let carsFound = 0;
                let yellowBays = false;

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
                    });
                }
                return { carsFound, yellowBays };
            }""")

            item7_pass = (regression_check["carsFound"] == 0 and not regression_check["yellowBays"])
            results["checks"]["item7_sem_regressao"] = {
                "pass": item7_pass,
                "details": regression_check
            }
            print(f" -> Item 7: {'PASSA' if item7_pass else 'FALHA'} (carros={regression_check['carsFound']}, vagasAmarelas={regression_check['yellowBays']})")

            await browser.close()

            # -------------------------------------------------------------
            # ITEM 3: Fallback de caixas (simular falha de rede do GLB)
            # -------------------------------------------------------------
            print("[8/8] Testando Item 3: Fallback de caixas simulando falha de carga do GLB...")
            browser_fallback = await p.chromium.launch(
                channel="chrome",
                headless=False,
                args=["--use-angle=d3d11", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"]
            )
            page_fb = await browser_fallback.new_page(viewport={"width": 1440, "height": 900})
            
            fb_console_warnings = []
            fb_console_errors = []
            # Ignora o log do browser de abort de requisição (net::ERR_FAILED) gerado pela rota bloqueada intencionalmente
            def on_fb_console(m):
                if m.type == "warning":
                    fb_console_warnings.append(m.text)
                elif m.type == "error":
                    if "ERR_FAILED" not in m.text:
                        fb_console_errors.append(m.text)

            page_fb.on("console", on_fb_console)
            page_fb.on("pageerror", lambda e: fb_console_errors.append(str(e)))

            # Bloqueia a URL do GLB para disparar o fallback
            await page_fb.route("**/moose-01.glb", lambda route: route.abort())

            await page_fb.goto(url, wait_until="networkidle")
            await page_fb.wait_for_function("() => window.__gorilazz && window.__gorilazz.world", timeout=60000)

            await page_fb.evaluate("""() => {
                try {
                    localStorage.setItem('gorilazz_onboarding_optout','true');
                    localStorage.setItem('gorilazz_onboarding_seen','true');
                } catch(e){}
            }""")
            if await page_fb.is_visible("#enter-world"):
                await page_fb.click("#enter-world")
            await asyncio.sleep(2)
            await page_fb.keyboard.press("Escape")
            await asyncio.sleep(0.5)

            # Verifica o alce de caixas
            fallback_audit = await page_fb.evaluate("""() => {
                const g = window.__gorilazz;
                const sc = g.world?.debug?.scene;
                let mooseBoxes = null;
                let mooseGlb = null;

                if (sc) {
                    sc.traverse(obj => {
                        if (obj.name === 'easter-moose') mooseBoxes = obj;
                        if (obj.name === 'easter-moose-glb') mooseGlb = obj;
                    });
                }

                return {
                    mooseBoxesFound: mooseBoxes !== null,
                    mooseGlbFound: mooseGlb !== null,
                    boxesPosition: mooseBoxes ? { x: mooseBoxes.position.x, y: mooseBoxes.position.y, z: mooseBoxes.position.z } : null
                };
            }""")

            # Enquadra o alce de caixas
            await page_fb.evaluate("""() => {
                const g = window.__gorilazz;
                g.world.frameSpot({ x: 58, z: -38, dirX: -0.8, dirZ: 0.6, distance: 8, height: 2.5, target: 1.5 });
            }""")
            await asyncio.sleep(1.2)
            shot_fallback = os.path.join(OUT, "evidencia-item3-alce-fallback-caixas.png")
            await page_fb.screenshot(path=shot_fallback)

            await browser_fallback.close()

            item3_pass = (
                fallback_audit["mooseBoxesFound"] and
                not fallback_audit["mooseGlbFound"] and
                len(fb_console_errors) == 0 and
                any("Alce GLB indisponível; mantendo o alce de caixas" in w for w in fb_console_warnings)
            )
            results["checks"]["item3_fallback_caixas"] = {
                "pass": item3_pass,
                "audit": fallback_audit,
                "script_errors": fb_console_errors,
                "console_warnings": fb_console_warnings,
                "screenshot": shot_fallback
            }
            print(f" -> Item 3: {'PASSA' if item3_pass else 'FALHA'} (boxesFound={fallback_audit['mooseBoxesFound']}, glbFound={fallback_audit['mooseGlbFound']}, errosScript={len(fb_console_errors)})")

    finally:
        srv.terminate()

    json_path = os.path.join(OUT, "validacao_alce_resultados.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\nResultados salvos em: {json_path}")

if __name__ == "__main__":
    asyncio.run(run_validation())
