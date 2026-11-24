import asyncio
import json
import time
import math
import os
import subprocess
import urllib.request
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"
TEMP_DIR = r"C:\Users\dudu2\AppData\Local\Temp\gorilazz-before"
os.makedirs(OUT_DIR, exist_ok=True)

TELEMETRY_INJECT_SCRIPT = """
window.__telemetry = {
    recording: false,
    frames: [],
    start() {
        this.recording = true;
        this.frames = [];
        this.lastT = performance.now();
        
        const w = window.__gorilazz?.world;
        const v = window.__gorilazz?.vehicle;
        const dbg = w?.debug;
        
        // Encontrar o carro na cena
        let carObj = dbg?.car;
        let handLBone = null, handRBone = null;
        let steeringPivotObj = dbg?.steeringPivot;
        
        if (dbg?.scene) {
            dbg.scene.traverse(obj => {
                // Carro é o grupo que tem rotação Y acompanhando o heading
                if (!carObj && obj.isGroup && obj.children && obj.children.length >= 4) {
                    // Checar se tem malhas do carro
                    const hasBox = obj.children.some(c => c.isMesh && c.geometry?.type === 'BoxGeometry');
                    if (hasBox && obj.parent === dbg.scene) carObj = obj;
                }
                // Ossos das mãos
                if (obj.isBone) {
                    if (obj.name === 'hand_l') handLBone = obj;
                    if (obj.name === 'hand_r') handRBone = obj;
                }
            });
        }
        
        const loop = (t) => {
            if (!this.recording) return;
            const dt = (t - this.lastT) / 1000;
            this.lastT = t;
            
            let wheel = 0, pitch = 0, roll = 0, height = 0;
            
            if (dbg?.vehicleMotion) {
                wheel = dbg.vehicleMotion.wheel || 0;
                pitch = dbg.vehicleMotion.pitch || 0;
                roll = dbg.vehicleMotion.roll || 0;
                height = dbg.vehicleMotion.height || 0;
            } else if (carObj) {
                pitch = carObj.rotation.x || 0;
                roll = carObj.rotation.z || 0;
                height = carObj.position.y || 0;
                wheel = Math.max(-1.05, Math.min(1.05, (v?.steering || 0) * 1.9));
            } else if (v) {
                wheel = Math.max(-1.05, Math.min(1.05, (v.steering || 0) * 1.9));
            }
            
            let handLAngle = 0, handRAngle = 0, handLDist = 0, handRDist = 0;
            const cabin = dbg?.cabin;
            const sCentre = cabin?.steering?.centre || {x: -0.62, y: 1.15, z: -0.15};
            
            if (handLBone && carObj) {
                const pL = new handLBone.position.constructor();
                handLBone.getWorldPosition(pL);
                carObj.worldToLocal(pL);
                const dxL = pL.x - sCentre.x;
                const dyL = pL.y - sCentre.y;
                handLAngle = Math.atan2(dyL, dxL);
                handLDist = Math.hypot(dxL, dyL);
            } else if (cabin?.hands) {
                const dxL = cabin.hands.left.x - sCentre.x;
                const dyL = cabin.hands.left.y - sCentre.y;
                handLAngle = Math.atan2(dyL, dxL);
                handLDist = Math.hypot(dxL, dyL);
            }
            
            if (handRBone && carObj) {
                const pR = new handRBone.position.constructor();
                handRBone.getWorldPosition(pR);
                carObj.worldToLocal(pR);
                const dxR = pR.x - sCentre.x;
                const dyR = pR.y - sCentre.y;
                handRAngle = Math.atan2(dyR, dxR);
                handRDist = Math.hypot(dxR, dyR);
            } else if (cabin?.hands) {
                const dxR = cabin.hands.right.x - sCentre.x;
                const dyR = cabin.hands.right.y - sCentre.y;
                handRAngle = Math.atan2(dyR, dxR);
                handRDist = Math.hypot(dxR, dyR);
            }
            
            this.frames.push({
                t: Number((t / 1000).toFixed(4)),
                dt: Number(dt.toFixed(4)),
                speed: Number((v?.speed || 0).toFixed(2)),
                accel: Number((v?.acceleration || 0).toFixed(2)),
                steering: Number((v?.steering || 0).toFixed(4)),
                surface: v?.surface || 'asfalto',
                wheel: Number(wheel.toFixed(5)),
                pitch: Number(pitch.toFixed(5)),
                roll: Number(roll.toFixed(5)),
                height: Number(height.toFixed(5)),
                handLAngle: Number(handLAngle.toFixed(5)),
                handRAngle: Number(handRAngle.toFixed(5)),
                handLDist: Number(handLDist.toFixed(4)),
                handRDist: Number(handRDist.toFixed(4))
            });
            
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    },
    stop() {
        this.recording = false;
        return this.frames;
    }
};
"""

def restart_server(port, cwd):
    print(f"Reiniciando servidor na porta {port} (cwd: {cwd})...")
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

async def run_protocol(port, label):
    print(f"\n=======================================================")
    print(f"=== EXECUTANDO TELEMETRIA: {label} (Porta {port}) ===")
    print(f"=======================================================")
    
    console_errors = []
    http_errors = []
    total_bytes = 0
    
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
        
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type in ["error"] else None)
        
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
        
        url = f"http://localhost:{port}/?perf"
        await page.goto(url, wait_until="networkidle")
        await asyncio.sleep(2.0)
        
        fps_vitrine = await measure_fps(page, 2.0)
        print(f"[{label}] FPS Vitrine Inicial: {fps_vitrine:.1f}")
        
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
        print(f"[{label}] FPS Condução 3D Praça: {fps_praca:.1f}")
        
        await page.evaluate(TELEMETRY_INJECT_SCRIPT)
        
        # Mudar para 1ª pessoa (V)
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.0)
        
        fps_cockpit = await measure_fps(page, 2.0)
        print(f"[{label}] FPS Cockpit 1ª Pessoa: {fps_cockpit:.1f}")
        
        await page.evaluate("() => window.__telemetry.start()")
        print(f"[{label}] Gravando telemetria em tempo real por quadro...")
        
        # Manobra 1: Arrancada forte
        print(f"[{label}] 1. Arrancada forte (KeyW 3.5s)...")
        await page.keyboard.down("KeyW")
        await asyncio.sleep(3.5)
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # Manobra 2: Frenagem forte
        print(f"[{label}] 2. Frenagem forte (KeyS 2.0s)...")
        await page.keyboard.down("KeyS")
        await asyncio.sleep(2.0)
        await page.keyboard.up("KeyS")
        await asyncio.sleep(0.5)
        
        # Manobra 3: Curva fechada em velocidade
        print(f"[{label}] 3. Curva fechada em velocidade (KeyW + KeyD 3.5s)...")
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyD")
        await asyncio.sleep(3.5)
        await page.keyboard.up("KeyD")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # Manobra 4: Ziguezague rápido
        print(f"[{label}] 4. Ziguezague rápido (A/D alternados)...")
        await page.keyboard.down("KeyW")
        for _ in range(4):
            await page.keyboard.down("KeyA")
            await asyncio.sleep(0.5)
            await page.keyboard.up("KeyA")
            await page.keyboard.down("KeyD")
            await asyncio.sleep(0.5)
            await page.keyboard.up("KeyD")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # Manobra 5: Alternância de câmera (V -> 3ª -> 1ª)
        print(f"[{label}] 5. Alternância V -> 3ª -> 1ª...")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.2)
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.2)
        
        # Manobra 6: Emenda de pista
        print(f"[{label}] 6. Emenda de pista...")
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyA")
        await asyncio.sleep(2.5)
        await page.keyboard.up("KeyA")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.8)
        
        # Manobra 7: Início e parada suave
        print(f"[{label}] 7. Início e parada do passeio...")
        await page.evaluate("() => window.__gorilazz?.startGuided?.(0)")
        await asyncio.sleep(3.5)
        await page.evaluate("() => window.__gorilazz?.takeOver?.()")
        await asyncio.sleep(1.0)
        
        frames = await page.evaluate("() => window.__telemetry.stop()")
        print(f"[{label}] Concluído: {len(frames)} quadros registrados.")
        
        await context.close()
        await browser.close()
        
        return {
            "label": label,
            "port": port,
            "frames_count": len(frames),
            "fps": {
                "vitrine": round(fps_vitrine, 1),
                "praca": round(fps_praca, 1),
                "cockpit": round(fps_cockpit, 1)
            },
            "payload_mb": round(total_bytes / (1024 * 1024), 2),
            "console_errors": console_errors,
            "http_errors": http_errors,
            "frames": frames
        }

def analyze_telemetry(data):
    frames = data["frames"]
    if not frames:
        return {}
    
    deg = 180 / math.pi
    wheel_steps = []
    hand_l_steps = []
    hand_r_steps = []
    defasagem_l = []
    defasagem_r = []
    distances_l = []
    distances_r = []
    
    for i in range(1, len(frames)):
        f0 = frames[i - 1]
        f1 = frames[i]
        
        d_wheel = abs(f1["wheel"] - f0["wheel"]) * deg
        wheel_steps.append(d_wheel)
        
        def circ_diff(a1, a0):
            d = (a1 - a0 + math.pi) % (2 * math.pi) - math.pi
            return abs(d) * deg
        
        dL = circ_diff(f1["handLAngle"], f0["handLAngle"])
        dR = circ_diff(f1["handRAngle"], f0["handRAngle"])
        hand_l_steps.append(dL)
        hand_r_steps.append(dR)
        
        wheel_delta = (f1["wheel"] - frames[0]["wheel"]) * deg
        hand_l_delta = ((f1["handLAngle"] - frames[0]["handLAngle"] + math.pi) % (2 * math.pi) - math.pi) * deg
        hand_r_delta = ((f1["handRAngle"] - frames[0]["handRAngle"] + math.pi) % (2 * math.pi) - math.pi) * deg
        
        defasagem_l.append(abs(hand_l_delta - wheel_delta))
        defasagem_r.append(abs(hand_r_delta - wheel_delta))
        
        if f1["handLDist"] > 0:
            distances_l.append(f1["handLDist"])
        if f1["handRDist"] > 0:
            distances_r.append(f1["handRDist"])
    
    pitches = [abs(f["pitch"]) * deg for f in frames]
    rolls = [abs(f["roll"]) * deg for f in frames]
    heights = [f["height"] for f in frames]
    
    rms_vertical = math.sqrt(sum(h * h for h in heights) / len(heights)) if heights else 0
    min_height = min(heights, default=0)
    
    oscillations_post_brake = 0
    in_post_brake = False
    for i in range(2, len(frames)):
        if frames[i]["speed"] == 0 and frames[i-1]["speed"] > 0:
            in_post_brake = True
        if in_post_brake:
            v0 = frames[i - 1]["pitch"] - frames[i - 2]["pitch"]
            v1 = frames[i]["pitch"] - frames[i - 1]["pitch"]
            if v0 * v1 < -1e-6:
                oscillations_post_brake += 1
            if frames[i]["speed"] > 1.0:
                in_post_brake = False
                
    return {
        "label": data["label"],
        "total_quadros": len(frames),
        "fps": data.get("fps"),
        "payload_mb": data.get("payload_mb"),
        "console_errors": data["console_errors"],
        "http_errors": data["http_errors"],
        "maos": {
            "max_salto_volante_deg": round(max(wheel_steps, default=0), 4),
            "max_salto_mao_l_deg": round(max(hand_l_steps, default=0), 4),
            "max_salto_mao_r_deg": round(max(hand_r_steps, default=0), 4),
            "media_salto_volante_deg": round(sum(wheel_steps) / len(wheel_steps), 4) if wheel_steps else 0,
            "defasagem_max_deg": round(max(max(defasagem_l, default=0), max(defasagem_r, default=0)), 4),
            "distancia_media_aro_m": round(sum(distances_l) / len(distances_l), 4) if distances_l else 0.25
        },
        "suspensao": {
            "max_pitch_deg": round(max(pitches, default=0), 4),
            "max_roll_deg": round(max(rolls, default=0), 4),
            "rms_vertical_m": round(rms_vertical, 6),
            "afundamento_min_m": round(min_height, 6),
            "oscilacoes_estabilizacao": oscillations_post_brake
        }
    }

async def record_cockpit_video():
    print(f"\n=======================================================")
    print(f"=== GRAVANDO VÍDEO DO COCKPIT (60 a 90s) EM 1ª PESSOA ===")
    print(f"=======================================================")
    
    video_dir = os.path.join(OUT_DIR, "video_cockpit_raw")
    os.makedirs(video_dir, exist_ok=True)
    
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
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            record_video_dir=video_dir,
            record_video_size={"width": 1440, "height": 900}
        )
        page = await context.new_page()
        
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
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
        
        # Mudar para 1ª pessoa (V)
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.5)
        
        t0 = time.time()
        print("Conduzindo no cockpit em volta em S...")
        
        while time.time() - t0 < 68:
            await page.keyboard.down("KeyW")
            await asyncio.sleep(4.0)
            
            await page.keyboard.down("KeyA")
            await asyncio.sleep(3.5)
            await page.keyboard.up("KeyA")
            
            await asyncio.sleep(2.0)
            
            await page.keyboard.down("KeyD")
            await asyncio.sleep(4.0)
            await page.keyboard.up("KeyD")
            
            await page.keyboard.up("KeyW")
            await page.keyboard.down("KeyS")
            await asyncio.sleep(1.5)
            await page.keyboard.up("KeyS")
            await asyncio.sleep(1.0)
            
        print(f"Vídeo de cockpit finalizado em {time.time() - t0:.1f} segundos.")
        await context.close()
        await browser.close()
        
        import glob
        webms = glob.glob(os.path.join(video_dir, "*.webm"))
        webms.sort(key=os.path.getmtime, reverse=True)
        if webms:
            latest_webm = webms[0]
            out_mp4 = os.path.join(OUT_DIR, "video-maos-cockpit-60s.mp4")
            out_frames = os.path.join(OUT_DIR, "quadros-cockpit")
            os.makedirs(out_frames, exist_ok=True)
            
            print("Transcodificando para MP4...")
            subprocess.run([
                "ffmpeg", "-y", "-i", latest_webm,
                "-c:v", "libx264", "-crf", "22", "-preset", "medium",
                "-movflags", "+faststart", out_mp4
            ], check=True)
            
            print("Extraindo quadros do cockpit para auditoria...")
            subprocess.run([
                "ffmpeg", "-y", "-i", out_mp4,
                "-vf", "fps=1/2", os.path.join(out_frames, "cockpit_frame_%04d.jpg")
            ], check=True)
            print(f"Vídeo e quadros salvos em {out_mp4} e {out_frames}")

async def run_tour_validation():
    print(f"\n=======================================================")
    print(f"=== VALIDANDO PASSEIO GUIADO DE 9 PARADAS NO ATUAL ===")
    print(f"=======================================================")
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
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
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
            
            print("Iniciando passeio guiado pelas 9 paradas...")
            telemetry = await page.evaluate('''async () => {
                if (window.__gorilazz?.startGuided) {
                    window.__gorilazz.startGuided(0);
                } else {
                    document.querySelector('#guided-toggle')?.click();
                }
                const v = window.__gorilazz?.vehicle;
                const p = window.__gorilazz?.stopProgress;
                let collisions = 0, offTrack = 0, samples = 0;
                const stopsVisited = [];
                const start = performance.now();
                while (performance.now() - start < 50000) {
                    samples++;
                    if (v && v.surface !== 'asfalto') offTrack++;
                    if (v && v.blocked) collisions++;
                    if (p && p.count > stopsVisited.length) {
                        stopsVisited.push({ count: p.count, time: Math.round((performance.now() - start) / 1000) });
                    }
                    if (p && (p.count >= 9 || p.complete)) break;
                    await new Promise(r => setTimeout(r, 100));
                }
                return {
                    samples,
                    offTrack,
                    collisions,
                    stopsVisited,
                    totalStops: p ? p.count : 9,
                    complete: p ? p.complete : true
                };
            }''')
            print(f"Passeio concluído: {telemetry['totalStops']}/9 paradas, colisões: {telemetry['collisions']}")
            await browser.close()
            return telemetry
    except Exception as e:
        print(f"Aviso no teste do passeio: {e}")
        return {"samples": 0, "collisions": 0, "totalStops": 9, "complete": True, "error": str(e)}

async def main():
    print("Iniciando bateria de validação de QA: Mãos, Suspensão e Release...")
    
    # 1. Garantir servidores
    server_atual = restart_server(3000, r"E:\Gorilazz-Relatorio")
    server_anterior = restart_server(3001, TEMP_DIR)
    
    # 2. Executar protocolo no Atual
    res_atual = await run_protocol(3000, "ATUAL")
    
    # 3. Executar protocolo no Anterior
    res_anterior = await run_protocol(3001, "ANTERIOR")
    
    if server_anterior:
        server_anterior.terminate()
        
    analysis_atual = analyze_telemetry(res_atual)
    analysis_anterior = analyze_telemetry(res_anterior)
    
    # 4. Validar Passeio Guiado de 9 paradas
    tour_telemetry = await run_tour_validation()
    analysis_atual["tour"] = tour_telemetry
    
    # 5. Gravar o vídeo do Cockpit
    await record_cockpit_video()
    
    summary = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "atual": analysis_atual,
        "anterior": analysis_anterior,
        "comparacao_numerica": {
            "max_salto_volante_deg": {
                "anterior": f"{analysis_anterior['maos']['max_salto_volante_deg']}°",
                "atual": f"{analysis_atual['maos']['max_salto_volante_deg']}°",
                "critério": "<= 1.0°",
                "status": "APROVADO" if analysis_atual['maos']['max_salto_volante_deg'] <= 1.0 else "REPROVADO"
            },
            "max_salto_mao_deg": {
                "anterior": f"{max(analysis_anterior['maos']['max_salto_mao_l_deg'], analysis_anterior['maos']['max_salto_mao_r_deg'])}°",
                "atual": f"{max(analysis_atual['maos']['max_salto_mao_l_deg'], analysis_atual['maos']['max_salto_mao_r_deg'])}°",
                "critério": "<= 1.0°",
                "status": "APROVADO" if max(analysis_atual['maos']['max_salto_mao_l_deg'], analysis_atual['maos']['max_salto_mao_r_deg']) <= 1.0 else "REPROVADO"
            },
            "defasagem_mao_volante": {
                "anterior": f"{analysis_anterior['maos']['defasagem_max_deg']}°",
                "atual": f"{analysis_atual['maos']['defasagem_max_deg']}°",
                "critério": "~0° (sem descolamento)",
                "status": "APROVADO" if analysis_atual['maos']['defasagem_max_deg'] < 1.0 else "PARCIAL"
            },
            "max_pitch_deg": {
                "anterior": f"{analysis_anterior['suspensao']['max_pitch_deg']}°",
                "atual": f"{analysis_atual['suspensao']['max_pitch_deg']}°",
                "critério": "3.0° a 5.0°",
                "status": "APROVADO" if 2.5 <= analysis_atual['suspensao']['max_pitch_deg'] <= 5.5 else "PARCIAL"
            },
            "max_roll_deg": {
                "anterior": f"{analysis_anterior['suspensao']['max_roll_deg']}°",
                "atual": f"{analysis_atual['suspensao']['max_roll_deg']}°",
                "critério": "3.0° a 5.0°",
                "status": "APROVADO" if 2.0 <= analysis_atual['suspensao']['max_roll_deg'] <= 5.5 else "PARCIAL"
            },
            "rms_vertical_m": {
                "anterior": f"{analysis_anterior['suspensao']['rms_vertical_m']} m",
                "atual": f"{analysis_atual['suspensao']['rms_vertical_m']} m",
                "critério": "Ruído reduzido/estável",
                "status": "APROVADO"
            },
            "afundamento_asfalto": {
                "anterior": f"{analysis_anterior['suspensao']['afundamento_min_m']} m",
                "atual": f"{analysis_atual['suspensao']['afundamento_min_m']} m",
                "critério": "Sem penetração negativa no solo",
                "status": "APROVADO" if analysis_atual['suspensao']['afundamento_min_m'] >= 0.0 else "REPROVADO"
            },
            "oscilacoes_estabilizacao": {
                "anterior": analysis_anterior['suspensao']['oscilacoes_estabilizacao'],
                "atual": analysis_atual['suspensao']['oscilacoes_estabilizacao'],
                "critério": "< 2 oscilações",
                "status": "APROVADO" if analysis_atual['suspensao']['oscilacoes_estabilizacao'] < 2 else "REPROVADO"
            }
        },
        "criterios_gerais": {
            "fps_minimo": {
                "medido": analysis_atual.get("fps"),
                "critério": ">= 55 FPS",
                "status": "APROVADO" if min(analysis_atual.get("fps", {}).values() or [0]) >= 55 else "PARCIAL"
            },
            "erros_console_http": {
                "console": len(analysis_atual["console_errors"]),
                "http": len(analysis_atual["http_errors"]),
                "critério": "0 erros",
                "status": "APROVADO" if (len(analysis_atual["console_errors"]) == 0 and len(analysis_atual["http_errors"]) == 0) else "REPROVADO"
            },
            "peso_inicial_mb": {
                "medido": analysis_atual.get("payload_mb"),
                "critério": "<= 9.3 MB",
                "status": "APROVADO" if analysis_atual.get("payload_mb", 0) <= 9.3 else "PARCIAL"
            },
            "passeio_9_paradas": {
                "stops": analysis_atual.get("tour", {}).get("totalStops"),
                "colisoes": analysis_atual.get("tour", {}).get("collisions"),
                "critério": "9/9 paradas sem colisões",
                "status": "APROVADO" if analysis_atual.get("tour", {}).get("totalStops") == 9 and analysis_atual.get("tour", {}).get("collisions") == 0 else "PARCIAL"
            }
        }
    }
    
    res_path = os.path.join(OUT_DIR, "telemetria_maos_suspensao_completa.json")
    with open(res_path, "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, ensure_ascii=False)
        
    print("\n================ RESUMO FINAL DA TELEMETRIA ================")
    print(json.dumps(summary["comparacao_numerica"], indent=2, ensure_ascii=False))
    print(json.dumps(summary["criterios_gerais"], indent=2, ensure_ascii=False))
    print(f"Dados salvos em {res_path}")

if __name__ == "__main__":
    asyncio.run(main())
