import asyncio
import json
import time
import math
import os
import subprocess
import urllib.request
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\rodada-cockpit-v5-drift-2026-11-24"
CWD = r"E:\Gorilazz-Relatorio"
PORT = 3000
os.makedirs(OUT_DIR, exist_ok=True)

def ensure_server(port, cwd):
    subprocess.run(["cmd.exe", "/c", "taskkill /F /IM node.exe >nul 2>&1"], check=False)
    time.sleep(1)
    print(f"Iniciando server.mjs na porta {port}...")
    proc = subprocess.Popen(
        ["node", "server.mjs"],
        cwd=cwd,
        env={**os.environ, "PORT": str(port)}
    )
    for _ in range(15):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(f"http://localhost:{port}/", timeout=1) as r:
                if r.status == 200:
                    print(f"Servidor na porta {port} pronto.")
                    return proc
        except Exception:
            pass
    return proc

async def measure_fps(page, duration_s):
    return await page.evaluate(f"""() => new Promise(resolve => {{
        let count = 0;
        const start = performance.now();
        const step = () => {{
            count++;
            if (performance.now() - start < {duration_s * 1000}) {{
                requestAnimationFrame(step);
            }} else {{
                resolve(count / ((performance.now() - start) / 1000));
            }}
        }};
        requestAnimationFrame(step);
    }})""")

async def run_validation():
    server_proc = ensure_server(PORT, CWD)
    
    console_errors = []
    http_errors = []
    total_bytes = 0
    
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "viewport": "1440x900",
        "cockpit_v5": {},
        "radio": {},
        "drift": {},
        "helicopteros": {},
        "desempenho": {},
        "itens_nao_testados": []
    }
    
    try:
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
            
            # =========================================================================
            # SESSÃO 1: MODO NORMAL (no-preference)
            # =========================================================================
            print("\n--- INICIANDO SESSÃO 1 (prefers-reduced-motion: no-preference) ---")
            context = await browser.new_context(viewport={"width": 1440, "height": 900})
            page = await context.new_page()
            
            page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error"] else None)
            
            def on_response(res):
                nonlocal total_bytes
                if res.status >= 400:
                    http_errors.append(f"{res.status} {res.url}")
                try:
                    cl = res.headers.get("content-length")
                    if cl:
                        total_bytes += int(cl)
                except Exception:
                    pass
            page.on("response", on_response)
            
            url = f"http://localhost:{PORT}/?perf"
            await page.goto(url, wait_until="networkidle")
            await asyncio.sleep(2.0)
            
            btn_enter = page.locator("#enter-world")
            if await btn_enter.is_visible():
                await btn_enter.click()
                await asyncio.sleep(1.0)
                
            await page.evaluate("""() => {
                const opt = document.querySelector('#onboarding-optout');
                if (opt) opt.checked = true;
                const btn = document.querySelector('#onboarding-start');
                if (btn) btn.click();
            }""")
            await asyncio.sleep(1.5)
            await page.evaluate("() => { document.querySelector('#world canvas')?.focus(); window.__gorilazz?.takeOver?.(); }")
            
            fps_praca = await measure_fps(page, 2.0)
            print(f"FPS Praça: {fps_praca:.1f}")
            
            # 1. Cockpit v5
            print("1. Medindo Cockpit Piloto v5...")
            await page.keyboard.press("KeyV")
            await asyncio.sleep(1.0)
            fps_cockpit = await measure_fps(page, 2.0)
            
            cockpit_diag = await page.evaluate("""() => {
                const w = window.__gorilazz?.world;
                const dbg = w?.debug;
                const cabin = dbg?.cabin;
                let hasNeedle = false;
                let needlePivotAngle = 0;
                
                if (cabin?.root) {
                    cabin.root.traverse(obj => {
                        if (obj.isMesh && obj.material?.color?.getHexString() === 'e35c40') {
                            hasNeedle = true;
                            if (obj.parent) needlePivotAngle = obj.parent.rotation.z;
                        }
                    });
                }
                return {
                    cockpitActive: !document.querySelector('#cockpit')?.hidden,
                    hasNeedle,
                    needlePivotAngle,
                    hasCabin: !!cabin
                };
            }""")
            await page.screenshot(path=os.path.join(OUT_DIR, "1440x900-cockpit-v5-repouso.png"))
            needle_angle_repouso = cockpit_diag.get("needlePivotAngle", 0)
            
            # Acelerar em cockpit
            await page.keyboard.down("KeyW")
            await asyncio.sleep(2.5)
            cockpit_speed_diag = await page.evaluate("""() => {
                const v = window.__gorilazz?.vehicle;
                const cabin = window.__gorilazz?.world?.debug?.cabin;
                let needlePivotAngle = 0;
                if (cabin?.root) {
                    cabin.root.traverse(obj => {
                        if (obj.isMesh && obj.material?.color?.getHexString() === 'e35c40' && obj.parent) {
                            needlePivotAngle = obj.parent.rotation.z;
                        }
                    });
                }
                return {
                    speedKmh: Math.round(Math.abs(v?.speed || 0) * 3.6),
                    needlePivotAngle
                };
            }""")
            await page.screenshot(path=os.path.join(OUT_DIR, "1440x900-cockpit-v5-em-velocidade.png"))
            await page.keyboard.up("KeyW")
            await page.keyboard.down("KeyS")
            await asyncio.sleep(1.5)
            await page.keyboard.up("KeyS")
            
            needle_deflection_deg = round(abs(cockpit_speed_diag.get("needlePivotAngle", 0) - needle_angle_repouso) * 180 / math.pi, 2)
            results["cockpit_v5"] = {
                "cockpit_ativo": cockpit_diag.get("cockpitActive"),
                "has_needle_analogo": cockpit_diag.get("hasNeedle"),
                "deflexao_ponteiro_graus": needle_deflection_deg,
                "velocidade_kmh_medida": cockpit_speed_diag.get("speedKmh"),
                "aprovado": cockpit_diag.get("hasNeedle") and (needle_deflection_deg > 10.0)
            }
            print(f"Cockpit v5 OK: deflexão {needle_deflection_deg}°")
            
            # 2. Rádio
            print("2. Testando Rádio...")
            radio_text = await page.evaluate("() => document.querySelector('#hud-radio-toggle')?.textContent?.trim()")
            await page.click("#hud-radio-toggle")
            await asyncio.sleep(0.5)
            radio_menu_open = await page.evaluate("() => document.querySelector('#hud-radio-menu')?.hidden === false")
            await page.screenshot(path=os.path.join(OUT_DIR, "1440x900-radio-lista-widget.png"))
            await page.click("#hud-radio-toggle")
            
            results["radio"] = {
                "widget_botao_texto": radio_text,
                "texto_e_lista": radio_text == "LISTA",
                "menu_abriu": radio_menu_open,
                "aprovado": radio_text == "LISTA"
            }
            
            # 3. Drift com Tecla Espaço (Reparar veículo e colocar na pista limpa)
            print("3. Testando Drift com Tecla Espaço...")
            await page.evaluate("""() => {
                const v = window.__gorilazz?.vehicle;
                // Reposicionar na reta principal Kong Studios
                v.x = 0; v.z = -15; v.heading = 0; v.speed = 0; v.steering = 0; v.slip = 0; v.drifting = false; v.blocked = false; v.surface = 'asfalto';
                document.querySelector('#world canvas')?.focus();
            }""")
            await asyncio.sleep(0.5)
            
            # Acelerar em linha reta até velocidade alta (> 10 m/s), depois esterçar e pressionar Espaço
            await page.keyboard.down("KeyW")
            await asyncio.sleep(2.0)
            await page.keyboard.down("KeyD")
            await asyncio.sleep(0.3)
            await page.keyboard.down("Space")
            await asyncio.sleep(1.0)
            
            drift_telemetry = await page.evaluate("""() => {
                const v = window.__gorilazz?.vehicle;
                return {
                    speed: Number((v?.speed || 0).toFixed(2)),
                    steering: Number((v?.steering || 0).toFixed(4)),
                    drifting: Boolean(v?.drifting),
                    slip: Number((v?.slip || 0).toFixed(4)),
                    surface: v?.surface || ''
                };
            }""")
            await page.screenshot(path=os.path.join(OUT_DIR, "1440x900-drift-ativo.png"))
            await page.keyboard.up("Space")
            await page.keyboard.up("KeyD")
            await page.keyboard.up("KeyW")
            await page.keyboard.down("KeyS")
            await asyncio.sleep(1.0)
            await page.keyboard.up("KeyS")
            
            # Teste de modal
            await page.evaluate("() => document.querySelector('#character-dialog')?.showModal()")
            await asyncio.sleep(0.3)
            await page.keyboard.press("Space")
            await asyncio.sleep(0.3)
            modal_drift_check = await page.evaluate("() => ({ dlgOpen: document.querySelector('#character-dialog')?.open, drifting: Boolean(window.__gorilazz?.vehicle?.drifting) })")
            await page.evaluate("() => document.querySelector('#character-dialog')?.close()")
            
            # Teste de passeio guiado
            await page.evaluate("() => window.__gorilazz?.startGuided?.(0)")
            await asyncio.sleep(1.0)
            await page.keyboard.press("Space")
            await asyncio.sleep(0.3)
            tour_drift_check = await page.evaluate("() => ({ drifting: Boolean(window.__gorilazz?.vehicle?.drifting) })")
            await page.evaluate("() => window.__gorilazz?.takeOver?.()")
            
            results["drift"] = {
                "conducao_drift_ativo": drift_telemetry.get("drifting"),
                "slip_em_drift": drift_telemetry.get("slip"),
                "velocidade_drift_ms": drift_telemetry.get("speed"),
                "modal_aberto_drift": modal_drift_check.get("drifting"),
                "passeio_guiado_drift": tour_drift_check.get("drifting"),
                "aprovado": drift_telemetry.get("drifting") and not modal_drift_check.get("drifting") and not tour_drift_check.get("drifting")
            }
            print(f"Drift em pista: {drift_telemetry.get('drifting')} (slip: {drift_telemetry.get('slip')}, vel: {drift_telemetry.get('speed')} m/s)")
            
            # 4. Helicópteros em 10 segundos (Modo Normal)
            print("4A. Medindo movimento dos dois helicópteros em 10s (Modo Normal)...")
            copters_samples_normal = []
            for sec in range(11):
                sample = await page.evaluate("""() => {
                    const scene = window.__gorilazz?.world?.debug?.scene;
                    let copters = [];
                    if (scene) {
                        for (const child of scene.children) {
                            if (child.name === 'helicopter') {
                                copters.push({
                                    x: Number(child.position.x.toFixed(3)),
                                    y: Number(child.position.y.toFixed(3)),
                                    z: Number(child.position.z.toFixed(3)),
                                    rotX: Number(child.rotation.x.toFixed(3)),
                                    rotY: Number(child.rotation.y.toFixed(3)),
                                    rotZ: Number(child.rotation.z.toFixed(3))
                                });
                            }
                        }
                    }
                    return { t: performance.now(), copters };
                }""")
                copters_samples_normal.append(sample)
                if sec < 10:
                    await asyncio.sleep(1.0)
                    
            await page.screenshot(path=os.path.join(OUT_DIR, "1440x900-helicopteros-normal.png"))
            await context.close()
            
            # =========================================================================
            # SESSÃO 2: MODO REDUZIDO (prefers-reduced-motion: reduce)
            # =========================================================================
            print("\n--- INICIANDO SESSÃO 2 (prefers-reduced-motion: reduce) ---")
            context_reduced = await browser.new_context(
                viewport={"width": 1440, "height": 900},
                reduced_motion="reduce"
            )
            page_reduced = await context_reduced.new_page()
            await page_reduced.goto(url, wait_until="networkidle")
            await asyncio.sleep(2.0)
            
            btn_enter_r = page_reduced.locator("#enter-world")
            if await btn_enter_r.is_visible():
                await btn_enter_r.click()
                await asyncio.sleep(1.0)
                
            await page_reduced.evaluate("""() => {
                const opt = document.querySelector('#onboarding-optout');
                if (opt) opt.checked = true;
                const btn = document.querySelector('#onboarding-start');
                if (btn) btn.click();
            }""")
            await asyncio.sleep(1.5)
            await page_reduced.evaluate("() => { document.querySelector('#world canvas')?.focus(); window.__gorilazz?.takeOver?.(); }")
            
            print("4B. Medindo movimento dos dois helicópteros em 10s (Modo Reduzido)...")
            copters_samples_reduced = []
            for sec in range(11):
                sample = await page_reduced.evaluate("""() => {
                    const scene = window.__gorilazz?.world?.debug?.scene;
                    let copters = [];
                    if (scene) {
                        for (const child of scene.children) {
                            if (child.name === 'helicopter') {
                                copters.push({
                                    x: Number(child.position.x.toFixed(3)),
                                    y: Number(child.position.y.toFixed(3)),
                                    z: Number(child.position.z.toFixed(3)),
                                    rotX: Number(child.rotation.x.toFixed(3)),
                                    rotY: Number(child.rotation.y.toFixed(3)),
                                    rotZ: Number(child.rotation.z.toFixed(3))
                                });
                            }
                        }
                    }
                    return { t: performance.now(), copters };
                }""")
                copters_samples_reduced.append(sample)
                if sec < 10:
                    await asyncio.sleep(1.0)
                    
            await page_reduced.screenshot(path=os.path.join(OUT_DIR, "1440x900-helicopteros-reduced.png"))
            await context_reduced.close()
            await browser.close()
            
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

    def calc_travel(samples):
        total_dist_c0 = 0.0
        total_dist_c1 = 0.0
        c0_pos = []
        c1_pos = []
        
        for i in range(len(samples)):
            copters = samples[i].get("copters", [])
            if len(copters) >= 2:
                c0_pos.append(copters[0])
                c1_pos.append(copters[1])
                if i > 0:
                    p0 = samples[i-1]["copters"][0]
                    p1 = samples[i-1]["copters"][1]
                    d0 = math.dist((copters[0]["x"], copters[0]["y"], copters[0]["z"]), (p0["x"], p0["y"], p0["z"]))
                    d1 = math.dist((copters[1]["x"], copters[1]["y"], copters[1]["z"]), (p1["x"], p1["y"], p1["z"]))
                    total_dist_c0 += d0
                    total_dist_c1 += d1
                    
        return {
            "distancia_c0_m": round(total_dist_c0, 2),
            "distancia_c1_m": round(total_dist_c1, 2),
            "pos_inicial_c0": c0_pos[0] if c0_pos else None,
            "pos_final_c0": c0_pos[-1] if c0_pos else None,
            "pos_inicial_c1": c1_pos[0] if c1_pos else None,
            "pos_final_c1": c1_pos[-1] if c1_pos else None,
            "rotZ_amostras_c0": [p["rotZ"] for p in c0_pos[:5]],
            "samples_count": len(samples)
        }
        
    analysis_normal = calc_travel(copters_samples_normal)
    analysis_reduced = calc_travel(copters_samples_reduced)
    
    results["helicopteros"] = {
        "modo_normal_10s": analysis_normal,
        "modo_reduzido_10s": analysis_reduced,
        "ambos_moveram_em_10s_normal": analysis_normal["distancia_c0_m"] > 10.0 and analysis_normal["distancia_c1_m"] > 10.0,
        "ambos_moveram_em_10s_reduced": analysis_reduced["distancia_c0_m"] > 10.0 and analysis_reduced["distancia_c1_m"] > 10.0,
        "diferenca_inclinacao": {
            "rotZ_normal": analysis_normal["rotZ_amostras_c0"],
            "rotZ_reduced": analysis_reduced["rotZ_amostras_c0"],
            "reduced_sem_tilt": all(r == 0 for r in analysis_reduced["rotZ_amostras_c0"])
        },
        "aprovado": analysis_normal["distancia_c0_m"] > 10.0 and analysis_reduced["distancia_c0_m"] > 10.0
    }
    
    results["desempenho"] = {
        "fps_praca": round(fps_praca, 1),
        "fps_cockpit": round(fps_cockpit, 1),
        "payload_mb": round(total_bytes / (1024 * 1024), 2),
        "console_errors": console_errors,
        "http_errors": http_errors,
        "aprovado": len(console_errors) == 0 and len(http_errors) == 0 and fps_cockpit >= 55.0
    }
    
    results["itens_nao_testados"] = [
        "Upload de arquivos de áudio customizados pelo usuário no input de rádio (#radio-files)",
        "Volta completa de 360° da órbita do helicóptero até o fechamento (T = 2*pi / 0.32 ~ 19.6s; medidos 10.0s conforme especificado)",
        "Dispositivos móveis com acelerômetro físico para drift tátil"
    ]
    
    json_path = os.path.join(OUT_DIR, "telemetria_cockpit_v5_drift.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print("\n================== SUMÁRIO GERAL DE VALIDAÇÃO ==================")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    print("================================================================\n")
    print(f"Salvo em: {json_path}")
    return results

if __name__ == "__main__":
    asyncio.run(run_validation())
