import os
import sys
import time
import json
import math
import asyncio
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"
os.makedirs(OUT_DIR, exist_ok=True)

async def run_audit():
    print("=== INICIANDO AUDITORIA TÉCNICA OFICIAL DE EASTER EGGS & MURDOC COLOSSAL ===")
    telemetry = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "murdoc_colossal": {},
        "easter_eggs": {},
        "horn_g": {},
        "clearances": {},
        "guided_tour": {},
        "fps_performance": {},
        "regressions": {},
        "bundle_weights": {},
        "console_errors": [],
        "http_errors": []
    }

    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel="chrome",
            headless=False,
            args=[
                "--enable-webgl",
                "--ignore-gpu-blocklist",
                "--use-gl=angle",
                "--use-angle=d3d11",
                "--disable-background-timer-throttling",
                "--disable-backgrounding-occluded-windows",
                "--disable-renderer-backgrounding",
                "--no-sandbox"
            ]
        )
        context = await browser.new_context(viewport={"width": 1440, "height": 900})
        page = await context.new_page()

        page.on("console", lambda msg: telemetry["console_errors"].append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: telemetry["console_errors"].append(str(err)))

        transfer_bytes = 0
        async def on_response(res):
            nonlocal transfer_bytes
            if res.status >= 400:
                telemetry["http_errors"].append(f"{res.status} {res.url}")
            try:
                headers = await res.all_headers()
                cl = headers.get("content-length")
                if cl:
                    transfer_bytes += int(cl)
            except:
                pass
        page.on("response", on_response)

        print("[1/7] Carregando a aplicação com ?perf...")
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await page.wait_for_timeout(2000)

        # Entrar no 3D
        print("Entrando no modo 3D...")
        await page.evaluate("""() => {
            const entryBtn = document.querySelector('#entry-tour');
            if (entryBtn) entryBtn.click();
        }""")
        await page.wait_for_timeout(1000)

        # Fechar onboarding se aberto
        await page.evaluate("""() => {
            const dlg = document.querySelector('#onboarding-dialog');
            if (dlg && dlg.open) {
                const closeBtn = dlg.querySelector('#onboarding-close') || dlg.querySelector('button');
                if (closeBtn) closeBtn.click();
                else dlg.close();
            }
        }""")
        await page.wait_for_timeout(1000)

        # Aguardar carregamento da banda Phase 7 e Murdoc Colossal
        print("Aguardando carregamento da banda Phase 7...")
        await page.wait_for_function("""() => {
            const status = document.querySelector('#band-status');
            return status && status.dataset.loaded === 'true';
        }""", timeout=25000)

        await page.wait_for_timeout(1500)

        # =========================================================================
        # ITEM 1: MURDOC COLOSSAL (Inspeção 3D & Prints de 3 Avenidas Diferentes)
        # =========================================================================
        print("\n--- ITEM 1: MURDOC COLOSSAL ---")
        colossal_info = await page.evaluate("""() => {
            const world = window.__gorilazz.world;
            const scene = world.debug.scene;
            const colossal = scene.getObjectByName('murdoc-colossal');
            if (!colossal) return { found: false };

            let hasRim = false;
            let hasEyes = false;
            let meshColor = null;
            let rimColor = null;
            let eyeColor = null;
            let meshCount = 0;

            colossal.traverse(obj => {
                if (obj.isMesh) {
                    meshCount++;
                    if (obj.material && obj.material.side === 1) { // THREE.BackSide === 1
                        hasRim = true;
                        rimColor = '#' + obj.material.color.getHexString();
                    } else if (obj.geometry && obj.geometry.type === 'SphereGeometry') {
                        hasEyes = true;
                        eyeColor = '#' + obj.material.color.getHexString();
                    } else if (obj.material && obj.material.color) {
                        meshColor = '#' + obj.material.color.getHexString();
                    }
                }
            });

            return {
                found: true,
                position: { x: colossal.position.x, y: colossal.position.y, z: colossal.position.z },
                rotation: colossal.rotation.y,
                scale: colossal.scale.x,
                meshCount,
                hasRim,
                rimColor,
                hasEyes,
                eyeColor,
                meshColor
            };
        }""")
        print(f"Murdoc Colossal estrutura: {colossal_info}")
        telemetry["murdoc_colossal"] = colossal_info

        # Definir 3 avenidas reais onde o carro trafega e tem vista da silhueta colossal de 48m atrás dos prédios:
        # Murdoc está em (-165, 0, -140).
        # Avenida 1: Av. Saturnz Barz (Sul) em (-65, -135)
        # Avenida 2: Av. Clint Eastwood (Norte-Oeste) em (-55, -57)
        # Avenida 3: Rua Song Machine / Av. Humanz em (-75, -108)
        avenidas = [
            {
                "id": "av_saturnz_barz",
                "nome": "Av. Saturnz Barz (Sul)",
                "x": -65.0,
                "z": -135.0,
                "file": "01-murdoc-colossal-av-saturnz-barz.png"
            },
            {
                "id": "av_clint_eastwood",
                "nome": "Av. Clint Eastwood (Noroeste)",
                "x": -55.0,
                "z": -57.0,
                "file": "01-murdoc-colossal-av-clint-eastwood.png"
            },
            {
                "id": "rua_song_machine",
                "nome": "Rua Song Machine (Centro-Oeste)",
                "x": -75.0,
                "z": -108.0,
                "file": "01-murdoc-colossal-rua-song-machine.png"
            }
        ]

        target_x = -165.0
        target_z = -140.0

        for av in avenidas:
            dx = target_x - av["x"]
            dz = target_z - av["z"]
            # Compensar o ângulo de visualização da câmera de viagem (~0.16 rad)
            h = math.atan2(-dx, -dz) + 0.16
            print(f"Posicionando carro na {av['nome']} ({av['x']}, {av['z']}) com heading {h:.2f}...")

            await page.evaluate(f"""() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {av['x']};
                v.z = {av['z']};
                v.heading = {h};
                v.speed = 0;
                v.steering = 0;
                window.__gorilazz.world.clearPose();
            }}""")

            # Aguardar renderização e câmera seguir
            await page.wait_for_timeout(1500)

            shot_path = os.path.join(OUT_DIR, av["file"])
            await page.screenshot(path=shot_path)
            print(f"  -> Print salvo: {shot_path}")
            av["screenshot"] = av["file"]

        telemetry["murdoc_colossal"]["avenidas"] = avenidas

        # =========================================================================
        # ITEM 2: CADA EASTER EGG DE PERTO (Prints e Análise Visual)
        # =========================================================================
        print("\n--- ITEM 2: EASTER EGGS DE PERTO ---")
        easter_eggs_targets = [
            {
                "id": "alce",
                "nome": "Alce Geométrico (58, -38)",
                "spot_x": 58,
                "spot_z": -38,
                "dist": 8.5,
                "dirX": 0.8,
                "dirZ": 0.6,
                "height": 2.6,
                "target": 2.0,
                "file": "02-easter-egg-alce.png"
            },
            {
                "id": "trailer",
                "nome": "Trailer Winnebago com placa M1-N4-STY (-77, -41)",
                "spot_x": -77,
                "spot_z": -41,
                "dist": 9.5,
                "dirX": 0.7,
                "dirZ": 0.7,
                "height": 2.8,
                "target": 1.8,
                "file": "02-easter-egg-trailer.png"
            },
            {
                "id": "reject",
                "nome": "Grafite REJECT FALSE ICONS (-101, -110)",
                "spot_x": -101,
                "spot_z": -110,
                "dist": 5.5,
                "dirX": 0.6,
                "dirZ": 0.8,
                "height": 2.0,
                "target": 1.8,
                "file": "02-easter-egg-reject.png"
            },
            {
                "id": "save",
                "nome": "Grafite SAVE US FROM HIM (106, -110)",
                "spot_x": 106,
                "spot_z": -110,
                "dist": 5.5,
                "dirX": -0.6,
                "dirZ": 0.8,
                "height": 2.0,
                "target": 1.8,
                "file": "02-easter-egg-save.png"
            },
            {
                "id": "pazuzu",
                "nome": "Cartaz PAZUZU (-98, -122)",
                "spot_x": -98,
                "spot_z": -122,
                "dist": 5.5,
                "dirX": 0.7,
                "dirZ": 0.7,
                "height": 2.0,
                "target": 1.8,
                "file": "02-easter-egg-pazuzu.png"
            },
            {
                "id": "zombies",
                "nome": "Aviso ZUMBIS DO KONG STUDIOS (-5, -85)",
                "spot_x": -5,
                "spot_z": -85,
                "dist": 5.5,
                "dirX": 0.2,
                "dirZ": 0.95,
                "height": 2.0,
                "target": 1.8,
                "file": "02-easter-egg-zumbis.png"
            }
        ]

        for egg in easter_eggs_targets:
            print(f"Enquadrando easter egg {egg['id']} em ({egg['spot_x']}, {egg['spot_z']})...")
            await page.evaluate(f"""() => {{
                const world = window.__gorilazz.world;
                world.frameSpot({{
                    x: {egg['spot_x']},
                    z: {egg['spot_z']},
                    dirX: {egg['dirX']},
                    dirZ: {egg['dirZ']},
                    distance: {egg['dist']},
                    height: {egg['height']},
                    target: {egg['target']}
                }});
            }}""")
            await page.wait_for_timeout(1000)
            shot_path = os.path.join(OUT_DIR, egg["file"])
            await page.screenshot(path=shot_path)
            print(f"  -> Print capturado: {shot_path}")
            egg["screenshot"] = egg["file"]

        telemetry["easter_eggs"]["items"] = easter_eggs_targets

        # Resetar pose
        await page.evaluate("() => window.__gorilazz.world.clearPose()")
        await page.wait_for_timeout(500)

        # =========================================================================
        # ITEM 3: BUZINA G (Menu [H], Áudio, Cooldown e Bloqueios)
        # =========================================================================
        print("\n--- ITEM 3: BUZINA G ---")
        await page.keyboard.press("KeyH")
        await page.wait_for_timeout(600)

        horn_menu_label = await page.evaluate("""() => {
            const panel = document.querySelector('#journey');
            if (!panel) return null;
            const pTags = [...panel.querySelectorAll('p, span, div')];
            const hornTag = pTags.find(el => el.textContent.includes('Buzina') || el.textContent.includes('G ·'));
            return {
                open: !panel.hidden,
                text: hornTag ? hornTag.textContent.trim() : null,
                panel_text: panel.innerText
            };
        }""")
        print(f"Rótulo no menu [H]: {horn_menu_label['text']}")
        
        shot_path = os.path.join(OUT_DIR, "03-menu-h-buzina.png")
        await page.screenshot(path=shot_path)
        print(f"  -> Print do menu [H] capturado: {shot_path}")

        # Fechar o menu com Escape
        await page.keyboard.press("Escape")
        await page.wait_for_timeout(500)

        horn_tests = await page.evaluate("""async () => {
            let oscCount = 0;
            let lastFreq = null;
            let lastOscType = null;
            
            const OriginalOsc = window.AudioContext.prototype.createOscillator;
            window.AudioContext.prototype.createOscillator = function() {
                oscCount++;
                const osc = OriginalOsc.apply(this, arguments);
                lastOscType = osc.type;
                const origSetVal = osc.frequency.setValueAtTime;
                osc.frequency.setValueAtTime = function(val, time) {
                    lastFreq = val;
                    return origSetVal.apply(this, arguments);
                };
                return osc;
            };

            const results = {};

            // 1. Acionar tecla G normalmente
            const c0 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.press_1_osc = oscCount - c0;
            results.osc_type = lastOscType;
            results.start_freq = lastFreq;

            // 2. Cooldown imediato (< 800ms)
            const c1 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.cooldown_fast_osc = oscCount - c1; // Deve ser 0

            // 3. Após cooldown (> 800ms)
            await new Promise(r => setTimeout(r, 850));
            const c2 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.cooldown_after_850ms_osc = oscCount - c2; // Deve ser 1

            // 4. Bloqueio com menu [H] aberto
            document.querySelector('#journey').hidden = false;
            await new Promise(r => setTimeout(r, 850));
            const c3 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.blocked_with_menu_h = (oscCount - c3 === 0);
            document.querySelector('#journey').hidden = true;

            // 5. Bloqueio com mapa [M] aberto
            document.querySelector('#full-map-overlay').hidden = false;
            await new Promise(r => setTimeout(r, 850));
            const c4 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.blocked_with_map_m = (oscCount - c4 === 0);
            document.querySelector('#full-map-overlay').hidden = true;

            // 6. Bloqueio com modal aberto
            const dlg = document.querySelector('#character-dialog');
            dlg.showModal();
            await new Promise(r => setTimeout(r, 850));
            const c5 = oscCount;
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', code: 'KeyG', bubbles: true }));
            await new Promise(r => setTimeout(r, 120));
            results.blocked_with_modal = (oscCount - c5 === 0);
            dlg.close();

            // Restaurar prototype original
            window.AudioContext.prototype.createOscillator = OriginalOsc;

            return results;
        }""")
        print(f"Resultados dos testes de som da Buzina G: {horn_tests}")
        telemetry["horn_g"] = {
            "menu_label": horn_menu_label,
            "sound_tests": horn_tests
        }

        # =========================================================================
        # ITEM 4: DISTÂNCIAS DA PISTA, PALCOS E PASSEIO GUIADO
        # =========================================================================
        print("\n--- ITEM 4: DISTÂNCIAS E PASSEIO GUIADO ---")
        # Iniciar passeio guiado das 9 paradas e monitorar
        print("Iniciando Passeio Guiado autônomo (9 paradas)...")
        tour_result = await page.evaluate("""async () => {
            const v = window.__gorilazz.vehicle;
            const p = window.__gorilazz.stopProgress;
            
            window.__gorilazz.startGuided();
            
            let offTrack = 0;
            let collisions = 0;
            let steps = 0;
            let maxStopReached = 0;

            const startTime = performance.now();
            while (performance.now() - startTime < 35000) {
                steps++;
                if (v.surface !== 'asfalto') offTrack++;
                if (v.blocked) collisions++;
                if (p && p.count > maxStopReached) maxStopReached = p.count;
                if (p && p.complete) break;
                await new Promise(r => setTimeout(r, 100));
            }

            window.__gorilazz.takeOver();

            return {
                steps,
                offTrack,
                collisions,
                maxStopReached,
                complete: p ? p.complete : false
            };
        }""")
        print(f"Resultado do Passeio Guiado: {tour_result}")
        telemetry["guided_tour"] = tour_result

        # =========================================================================
        # ITEM 5: FPS NOS 3 PONTOS + PERTO DO COLOSSAL (JANELA VISÍVEL)
        # =========================================================================
        print("\n--- ITEM 5: MEDIÇÃO DE FPS E FRAMETIMES ---")
        fps_points = [
            {"id": "mural_1", "nome": "Mural 1 (Início)", "x": 0.0, "z": -10.0, "heading": 0.0},
            {"id": "palco_central", "nome": "Palco Central / Praça", "x": 10.0, "z": -50.0, "heading": -1.2},
            {"id": "centro_cidade", "nome": "Centro da Cidade / Cruzamento", "x": -50.0, "z": -90.0, "heading": 1.5},
            {"id": "perto_colossal", "nome": "Perto do Murdoc Colossal", "x": -75.0, "z": -135.0, "heading": 2.2}
        ]

        fps_results = {}
        for pt in fps_points:
            print(f"Medindo FPS em {pt['nome']}...")
            await page.evaluate(f"""() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {pt['x']};
                v.z = {pt['z']};
                v.heading = {pt['heading']};
                v.speed = 0;
                window.__gorilazz.world.clearPose();
            }}""")
            await page.wait_for_timeout(600)

            sample = await page.evaluate("""async () => {
                const samples = [];
                let last = performance.now();
                return new Promise(resolve => {
                    function step(now) {
                        const dt = now - last;
                        last = now;
                        samples.push(dt);
                        if (samples.length >= 120) {
                            const deltas = samples.slice(1);
                            deltas.sort((a, b) => a - b);
                            const avgDelta = deltas.reduce((s, v) => s + v, 0) / deltas.length;
                            const fps = 1000 / avgDelta;
                            const p50 = deltas[Math.floor(deltas.length * 0.50)];
                            const p95 = deltas[Math.floor(deltas.length * 0.95)];
                            const p99 = deltas[Math.floor(deltas.length * 0.99)];
                            resolve({ fps: +fps.toFixed(1), p50: +p50.toFixed(2), p95: +p95.toFixed(2), p99: +p99.toFixed(2), count: deltas.length });
                        } else {
                            requestAnimationFrame(step);
                        }
                    }
                    requestAnimationFrame(step);
                });
            }""")
            print(f"  -> FPS: {sample['fps']} (p50: {sample['p50']}ms, p95: {sample['p95']}ms, p99: {sample['p99']}ms)")
            fps_results[pt["id"]] = {**pt, **sample}

        telemetry["fps_performance"] = fps_results

        # =========================================================================
        # ITEM 6: REGRESSÕES
        # =========================================================================
        print("\n--- ITEM 6: REGRESSÕES ---")
        reg_tests = await page.evaluate("""() => {
            const results = {};
            const topBar = document.querySelector('.world-top-row') || document.querySelector('#world-hud');
            results.hud_exists = Boolean(topBar);
            
            const stopsCount = document.querySelector('#stops-count');
            results.stops_count_text = stopsCount ? stopsCount.textContent.trim() : null;

            const tourToggle = document.querySelector('#guided-tour-toggle');
            results.tour_btn_text = tourToggle ? tourToggle.textContent.trim() : null;

            const pilotCockpit = document.querySelector('#cockpit');
            results.cockpit_exists = Boolean(pilotCockpit);

            const pianoDlg = document.querySelector('#piano-dialog');
            const arcadeDlg = document.querySelector('#arcade-dialog');
            results.piano_available = Boolean(pianoDlg);
            results.arcade_available = Boolean(arcadeDlg);

            const drawer = document.querySelector('#discoveries-drawer');
            results.drawer_available = Boolean(drawer);

            return results;
        }""")
        print(f"Regressões verificadas: {reg_tests}")
        telemetry["regressions"] = reg_tests

        # Peso transferido
        telemetry["bundle_weights"]["total_bytes"] = transfer_bytes
        telemetry["bundle_weights"]["total_mb"] = +(transfer_bytes / (1024 * 1024)).toFixed(2)
        print(f"Peso total transferido na sessão: {telemetry['bundle_weights']['total_mb']} MB")

        # Salvar telemetria
        telemetry_file = os.path.join(OUT_DIR, "qa-easter-eggs-telemetria.json")
        with open(telemetry_file, "w", encoding="utf-8") as f:
            json.dump(telemetry, f, indent=2, ensure_ascii=False)
        print(f"\nTelemetria gravada com sucesso em: {telemetry_file}")

        await browser.close()
        print("=== AUDITORIA COMPLETA CONCLUÍDA ===")

if __name__ == "__main__":
    asyncio.run(run_audit())
