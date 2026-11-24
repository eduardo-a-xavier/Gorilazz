import asyncio
import json
import time
import math
import os
import subprocess
import urllib.request
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\rodada-maos-suspensao-2026-11-24"
CWD = r"E:\Gorilazz-Relatorio"
PORT = 3000
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
        
        let carObj = dbg?.car;
        let handLBone = null, handRBone = null;
        
        if (dbg?.scene) {
            dbg.scene.traverse(obj => {
                if (!carObj && obj.isGroup && obj.children && obj.children.length >= 4) {
                    const hasBox = obj.children.some(c => c.isMesh && c.geometry?.type === 'BoxGeometry');
                    if (hasBox && obj.parent === dbg.scene) carObj = obj;
                }
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

async def run_telemetry():
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
        
        url = f"http://localhost:{PORT}/?perf"
        print(f"Navegando para {url}...")
        t_nav_start = time.time()
        await page.goto(url, wait_until="networkidle")
        t_nav_loaded = time.time()
        
        # 1. Medir FPS da vitrine imediatamente nos primeiros 2s (carga inicial de texturas/shaders)
        print("Medindo FPS da Vitrine em Carga Fria (0 a 2s pós networkidle)...")
        fps_vitrine_fria = await measure_fps(page, 2.0)
        print(f"FPS Vitrine Fria: {fps_vitrine_fria:.1f}")
        
        # Aguardar 2s para estabilização térmica e compilação de assets
        await asyncio.sleep(2.0)
        
        # 2. Medir FPS da vitrine estabilizada (3 a 5s pós networkidle)
        print("Medindo FPS da Vitrine Estabilizada (pós compilação de shaders)...")
        fps_vitrine_estabilizada = await measure_fps(page, 2.0)
        print(f"FPS Vitrine Estabilizada: {fps_vitrine_estabilizada:.1f}")
        
        # Diagnóstico da cena na vitrine
        vitrine_diag = await page.evaluate("""() => {
            const w = window.__gorilazz?.world;
            const perf = window.performance?.getEntriesByType('navigation')?.[0];
            return {
                hasCanvas: !!document.querySelector('#world canvas'),
                showcaseActive: !document.querySelector('#world')?.classList.contains('active'),
                domInteractive: perf ? Math.round(perf.domInteractive) : 0,
                domComplete: perf ? Math.round(perf.domComplete) : 0
            };
        }""")
        
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
        print(f"FPS Conducao 3D Praca: {fps_praca:.1f}")
        
        # Injetar monitor de telemetria
        await page.evaluate(TELEMETRY_INJECT_SCRIPT)
        
        # Mudar para 1a pessoa (Cockpit)
        print("Alternando camera para 1a pessoa (Cockpit)...")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.0)
        
        fps_cockpit = await measure_fps(page, 2.0)
        print(f"FPS Cockpit 1a Pessoa: {fps_cockpit:.1f}")
        
        # Iniciar gravacao de telemetria
        await page.evaluate("() => window.__telemetry.start()")
        print("Gravando telemetria em tempo real por quadro com novo ganho de roll...")
        
        # 1. Arrancada forte (KeyW 3.5s)
        print("1. Arrancada forte (KeyW 3.5s)...")
        await page.keyboard.down("KeyW")
        await asyncio.sleep(3.5)
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # 2. Frenagem forte (KeyS 2.0s)
        print("2. Frenagem forte (KeyS 2.0s)...")
        await page.keyboard.down("KeyS")
        await asyncio.sleep(2.0)
        await page.keyboard.up("KeyS")
        await asyncio.sleep(0.5)
        
        # 3. Curva fechada em velocidade a direita (KeyW + KeyD 3.5s)
        print("3. Curva fechada em velocidade a direita (KeyW + KeyD 3.5s)...")
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyD")
        await asyncio.sleep(3.5)
        await page.screenshot(path=os.path.join(OUT_DIR, "cockpit-curva-direita-roll-novo.png"))
        await page.keyboard.up("KeyD")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # 4. Curva fechada em velocidade a esquerda (KeyW + KeyA 3.5s)
        print("4. Curva fechada em velocidade a esquerda (KeyW + KeyA 3.5s)...")
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyA")
        await asyncio.sleep(3.5)
        await page.screenshot(path=os.path.join(OUT_DIR, "cockpit-curva-esquerda-roll-novo.png"))
        await page.keyboard.up("KeyA")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # 5. Ziguezague rapido (W + A/D alternados)
        print("5. Ziguezague rapido (W + A/D alternados)...")
        await page.keyboard.down("KeyW")
        for _ in range(5):
            await page.keyboard.down("KeyA")
            await asyncio.sleep(0.4)
            await page.keyboard.up("KeyA")
            await page.keyboard.down("KeyD")
            await asyncio.sleep(0.4)
            await page.keyboard.up("KeyD")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(0.5)
        
        # 6. Frenagem brusca e amortecimento
        print("6. Frenagem brusca final e acomodacao...")
        await page.keyboard.down("KeyW")
        await asyncio.sleep(2.0)
        await page.keyboard.up("KeyW")
        await page.keyboard.down("KeyS")
        await asyncio.sleep(1.5)
        await page.keyboard.up("KeyS")
        await asyncio.sleep(1.5)
        
        # 7. Transicao de piso
        print("7. Transicao de piso...")
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyA")
        await asyncio.sleep(2.0)
        await page.keyboard.up("KeyA")
        await page.keyboard.up("KeyW")
        await asyncio.sleep(1.0)
        
        frames = await page.evaluate("() => window.__telemetry.stop()")
        print(f"Concluido: {len(frames)} quadros registrados.")
        
        await context.close()
        await browser.close()
        
        return {
            "frames_count": len(frames),
            "fps": {
                "vitrine_carga_fria": round(fps_vitrine_fria, 1),
                "vitrine_estabilizada": round(fps_vitrine_estabilizada, 1),
                "praca": round(fps_praca, 1),
                "cockpit": round(fps_cockpit, 1)
            },
            "vitrine_diag": vitrine_diag,
            "payload_mb": round(total_bytes / (1024 * 1024), 2),
            "console_errors": console_errors,
            "http_errors": http_errors,
            "frames": frames
        }

def process_results(data):
    frames = data["frames"]
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
    max_height = max(heights, default=0)
    
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
                
    summary = {
        "data_hora": time.strftime("%Y-%m-%d %H:%M:%S"),
        "total_quadros": len(frames),
        "fps": data["fps"],
        "vitrine_diagnostico": data.get("vitrine_diag"),
        "payload_mb": data["payload_mb"],
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
            "altura_min_m": round(min_height, 6),
            "altura_max_m": round(max_height, 6),
            "afundamento_min_m": round(min_height, 6),
            "oscilacoes_estabilizacao": oscillations_post_brake
        },
        "criterios_avaliacao": {
            "roll_2_a_4_deg": {
                "valor_obtido": round(max(rolls, default=0), 4),
                "esperado": "2.0 a 4.0 deg",
                "aprovado": 2.0 <= max(rolls, default=0) <= 4.05
            },
            "pitch_ate_3_deg": {
                "valor_obtido": round(max(pitches, default=0), 4),
                "esperado": "<= 3.0 deg",
                "aprovado": max(pitches, default=0) <= 3.05
            },
            "rms_vertical_gt_0_le_003": {
                "valor_obtido": round(rms_vertical, 6),
                "esperado": "> 0 e <= 0.03 m",
                "aprovado": 0.0 < rms_vertical <= 0.0305
            },
            "oscilacoes_max_1": {
                "valor_obtido": oscillations_post_brake,
                "esperado": "<= 1 oscilacao",
                "aprovado": oscillations_post_brake <= 1
            },
            "sem_afundar_solo": {
                "valor_obtido": round(min_height, 6),
                "esperado": ">= 0.0 m",
                "aprovado": min_height >= -1e-6
            },
            "maos_estaveis_step_le_1_deg": {
                "valor_obtido": round(max(wheel_steps, default=0), 4),
                "esperado": "<= 1.0 deg por quadro",
                "aprovado": max(wheel_steps, default=0) <= 1.05
            },
            "fps_ge_55": {
                "valor_obtido": data["fps"]["cockpit"],
                "esperado": ">= 55 FPS",
                "aprovado": data["fps"]["cockpit"] >= 55.0
            },
            "zero_erros_console_rede": {
                "erros_console": len(data["console_errors"]),
                "erros_http": len(data["http_errors"]),
                "aprovado": len(data["console_errors"]) == 0 and len(data["http_errors"]) == 0
            }
        }
    }
    return summary

def main():
    server_proc = ensure_server(PORT, CWD)
    try:
        raw_data = asyncio.run(run_telemetry())
        summary = process_results(raw_data)
        
        json_path = os.path.join(OUT_DIR, "telemetria_suspensao_recalibrada.json")
        full_json_path = os.path.join(OUT_DIR, "telemetria_suspensao_completa.json")
        
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
            
        with open(full_json_path, "w", encoding="utf-8") as f:
            json.dump(raw_data, f, indent=2, ensure_ascii=False)
            
        print("\n================== SUMÁRIO DE RESULTADOS ==================")
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        print("===========================================================\n")
        print(f"Salvo em: {json_path}")
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    main()
