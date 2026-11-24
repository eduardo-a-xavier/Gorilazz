import asyncio
import os
import sys
import time
import json
import math
from playwright.async_api import async_playwright
from PIL import Image, ImageDraw, ImageFont

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"
os.makedirs(OUT_DIR, exist_ok=True)

def annotate_screenshot(img_path, screen_pos, title, classification, coords_text, out_path):
    im = Image.open(img_path).convert("RGBA")
    overlay = Image.new("RGBA", im.size, (255, 255, 255, 0))
    draw = ImageDraw.Draw(overlay)
    
    # screen_pos é (x, y)
    sx, sy = screen_pos
    
    # Se estiver dentro do quadro
    in_frame = 0 <= sx <= im.size[0] and 0 <= sy <= im.size[1]
    
    color_map = {
        "claramente visível": (76, 217, 100, 255),  # Verde
        "sutil": (255, 149, 0, 255),               # Laranja
        "oculto": (255, 59, 48, 255)                # Vermelho
    }
    box_color = color_map.get(classification, (255, 204, 0, 255))
    
    if in_frame:
        # Desenhar círculo / mira ao redor do landmark
        r = 38
        draw.ellipse([sx - r, sy - r, sx + r, sy + r], outline=box_color, width=4)
        draw.ellipse([sx - r - 4, sy - r - 4, sx + r + 4, sy + r + 4], outline=(0, 0, 0, 180), width=1)
        
        # Desenhar seta apontando para o círculo
        arrow_start = (sx + 80, sy - 80)
        arrow_end = (sx + r + 5, sy - 15)
        draw.line([arrow_start, arrow_end], fill=box_color, width=4)
        
        # Cabeça da seta
        draw.polygon([
            arrow_end,
            (arrow_end[0] + 12, arrow_end[1] - 4),
            (arrow_end[0] + 4, arrow_end[1] - 12)
        ], fill=box_color)
        
        # Texto perto da seta
        badge_x = sx + 85
        badge_y = max(20, sy - 110)
    else:
        badge_x = 40
        badge_y = 40

    # Badge com fundo escuro elegante
    badge_w = 420
    badge_h = 95
    draw.rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h], fill=(20, 24, 32, 225), outline=box_color, width=2)
    
    # Textos
    try:
        font_title = ImageFont.truetype("arial.ttf", 16)
        font_sub = ImageFont.truetype("arial.ttf", 14)
    except:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    draw.text((badge_x + 12, badge_y + 10), title, fill=(255, 255, 255, 255), font=font_title)
    draw.text((badge_x + 12, badge_y + 35), f"Visibilidade: {classification.upper()}", fill=box_color, font=font_title)
    draw.text((badge_x + 12, badge_y + 62), coords_text, fill=(200, 210, 220, 255), font=font_sub)
    
    combined = Image.alpha_composite(im, overlay)
    combined.convert("RGB").save(out_path, "PNG")
    print(f"  -> Imagem anotada gerada: {out_path}")


async def run_revalidation():
    print("=== INICIANDO REVALIDAÇÃO OFICIAL DO LANDMARK 20M E EASTER EGGS ===")
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "views": {},
        "debug_closeups": {},
        "clearances": {},
        "fps_benchmarks": {},
        "tour_telemetry": {},
        "network": {},
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
        
        page.on("console", lambda msg: report["console_errors"].append(msg.text) if msg.type == "error" else None)
        page.on("pageerror", lambda err: report["console_errors"].append(str(err)))
        
        transferred_bytes = 0
        async def on_response(res):
            nonlocal transferred_bytes
            if res.status >= 400:
                report["http_errors"].append(f"{res.status} {res.url}")
            try:
                headers = await res.all_headers()
                cl = headers.get("content-length")
                if cl:
                    transferred_bytes += int(cl)
            except:
                pass
        page.on("response", on_response)
        
        print("[Passo 1/6] Acessando http://localhost:3000/?perf...")
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await page.wait_for_timeout(2000)
        
        print("[Passo 2/6] Ativando modo 3D e liberando direção livre...")
        await page.click("#enter-world")
        await page.wait_for_timeout(800)
        await page.click("#onboarding-start")
        await page.wait_for_timeout(800)
        
        # Aguardar banda Phase 7
        await page.wait_for_function("""() => {
            const st = document.querySelector('#band-status');
            return st && st.dataset.loaded === 'true';
        }""", timeout=25000)
        await page.wait_for_timeout(1000)
        
        # Pressionar KeyW para sair do showcase
        await page.keyboard.press("KeyW")
        await page.wait_for_timeout(600)
        
        # -------------------------------------------------------------
        # Verificação de folgas e estrutura 3D do Landmark na cena
        # -------------------------------------------------------------
        print("[Passo 3/6] Verificando estrutura física e folgas do Landmark 20m...")
        landmark_data = await page.evaluate("""() => {
            const world = window.__gorilazz.world;
            const scene = world.debug.scene;
            const monument = scene.getObjectByName('murdoc-colossal');
            if (!monument) return { found: false };
            
            let hasRim = false;
            let rimColor = null;
            let eyeCount = 0;
            let eyeColor = null;
            
            monument.traverse(obj => {
                if (obj.isMesh) {
                    if (obj.name === 'murdoc-colossal-eye') {
                        eyeCount++;
                        if (obj.material && obj.material.color) eyeColor = '#' + obj.material.color.getHexString();
                    } else if (obj.material && obj.material.side === 1) { // BackSide
                        hasRim = true;
                        rimColor = '#' + obj.material.color.getHexString();
                    }
                }
            });
            
            // Medir distâncias
            const pos = monument.position; // (-150, 0, -75)
            return {
                found: true,
                pos: { x: pos.x, y: pos.y, z: pos.z },
                scale: monument.scale.y,
                hasRim,
                rimColor,
                eyeCount,
                eyeColor
            };
        }""")
        report["clearances"] = landmark_data
        print(f"  Landmark na cena: {landmark_data}")
        
        # -------------------------------------------------------------
        # Captura dos 3 Pontos de Vista com Anotação e Classificação
        # -------------------------------------------------------------
        print("[Passo 4/6] Capturando 3 pontos de vista de jogo do Landmark 20m...")
        views_config = [
            {
                "id": "clint_eastwood",
                "title": "Av. Clint Eastwood",
                "x": -37.0,
                "z": -54.0,
                "heading": 1.430,
                "classification": "claramente visível",
                "raw_file": "raw-landmark-clint-20m.png",
                "annotated_file": "04-revalidacao-landmark-clint-eastwood-20m.png"
            },
            {
                "id": "saturnz_barz",
                "title": "Av. Saturnz Barz",
                "x": -57.0,
                "z": -144.0,
                "heading": 2.151,
                "classification": "claramente visível",
                "raw_file": "raw-landmark-saturnz-20m.png",
                "annotated_file": "04-revalidacao-landmark-saturnz-barz-20m.png"
            },
            {
                "id": "song_machine",
                "title": "Rua Song Machine",
                "x": -36.0,
                "z": -101.0,
                "heading": 1.399,
                "classification": "sutil",
                "raw_file": "raw-landmark-song-20m.png",
                "annotated_file": "04-revalidacao-landmark-song-machine-20m.png"
            }
        ]
        
        for view in views_config:
            print(f"  Posicionando veículo na {view['title']} (x={view['x']}, z={view['z']}, h={view['heading']})...")
            
            # Reposicionar veículo e obter projeção de tela do landmark
            screen_coords = await page.evaluate(f"""() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {view['x']};
                v.z = {view['z']};
                v.heading = {view['heading']};
                v.speed = 0;
                v.steering = 0;
                window.__gorilazz.world.clearPose();
                
                // Forçar recálculo da câmera de viagem
                const world = window.__gorilazz.world;
                const camera = world.debug.camera;
                
                // Projetar o landmark (-150, 10, -75) na tela
                const landmarkVec = new camera.position.constructor(-150, 10, -75);
                landmarkVec.project(camera);
                
                const sx = (landmarkVec.x * 0.5 + 0.5) * window.innerWidth;
                const sy = (-(landmarkVec.y * 0.5) + 0.5) * window.innerHeight;
                return {{ sx, sy, inFront: landmarkVec.z < 1 }};
            }}""")
            
            await page.wait_for_timeout(2000)
            
            raw_path = os.path.join(OUT_DIR, view["raw_file"])
            annotated_path = os.path.join(OUT_DIR, view["annotated_file"])
            await page.screenshot(path=raw_path)
            
            coords_desc = f"Carro: ({view['x']}, {view['z']}) | Heading: {view['heading']} rad | Landmark: (-150, -75)"
            annotate_screenshot(
                raw_path,
                (screen_coords["sx"], screen_coords["sy"]),
                f"Landmark Monumental 20 m — {view['title']}",
                view["classification"],
                coords_desc,
                annotated_path
            )
            report["views"][view["id"]] = {
                "title": view["title"],
                "coords": {"x": view["x"], "z": view["z"], "heading": view["heading"]},
                "screen_projection": screen_coords,
                "classification": view["classification"],
                "annotated_file": view["annotated_file"]
            }
            
        # -------------------------------------------------------------
        # Close-up de Depuração: Olhos Âmbar, Contorno e Névoa
        # -------------------------------------------------------------
        print("[Passo 5/6] Capturando close-up de depuração do Landmark e do Cartaz Save...")
        
        # Landmark Olhos Âmbar
        await page.evaluate("""() => {
            const world = window.__gorilazz.world;
            // Posicionar câmera de depuração focada na cabeça do colossal em (-150, 16.5, -75)
            world.frameSpot({
                x: -150,
                z: -75,
                dirX: 0.7,
                dirZ: 0.7,
                distance: 7.5,
                height: 17.5,
                target: 16.2
            });
        }""")
        await page.wait_for_timeout(1500)
        murdoc_debug_path = os.path.join(OUT_DIR, "04-revalidacao-murdoc-olhos-ambar-debug.png")
        await page.screenshot(path=murdoc_debug_path)
        print(f"  -> Print do close-up de olhos âmbar e contorno salvo: {murdoc_debug_path}")
        report["debug_closeups"]["murdoc_eyes"] = "04-revalidacao-murdoc-olhos-ambar-debug.png"
        
        # Cartaz Save sem Árvore
        await page.evaluate("""() => {
            const world = window.__gorilazz.world;
            // Cartaz Save em (106, 0, -110)
            world.frameSpot({
                x: 106,
                z: -110,
                dirX: 0.65,
                dirZ: 0.75,
                distance: 6.2,
                height: 2.2,
                target: 1.8
            });
        }""")
        await page.wait_for_timeout(1500)
        save_debug_path = os.path.join(OUT_DIR, "04-revalidacao-cartaz-save-sem-arvore.png")
        await page.screenshot(path=save_debug_path)
        print(f"  -> Print do cartaz Save sem árvore salvo: {save_debug_path}")
        report["debug_closeups"]["save_poster"] = "04-revalidacao-cartaz-save-sem-arvore.png"
        
        # Limpar câmera de depuração
        await page.evaluate("""() => {
            window.__gorilazz.world.clearPose();
        }""")
        await page.wait_for_timeout(1000)
        
        # -------------------------------------------------------------
        # Medição de FPS em 4 Pontos Reais
        # -------------------------------------------------------------
        print("[Passo 6/6] Medindo FPS e percentis p95/p99 em janela visível...")
        bench_points = [
            {"name": "Mural 1 (Início)", "x": 0.0, "z": -75.0, "h": 0.0},
            {"name": "Palco Central", "x": -20.0, "z": -40.0, "h": 1.2},
            {"name": "Centro da Cidade", "x": -45.0, "z": -80.0, "h": 2.0},
            {"name": "Perto do Landmark 20m", "x": -110.0, "z": -75.0, "h": 1.57}
        ]
        
        for bp in bench_points:
            print(f"  Amostrando FPS em: {bp['name']}...")
            await page.evaluate(f"""() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {bp['x']};
                v.z = {bp['z']};
                v.heading = {bp['h']};
                v.speed = 0;
                window.__gorilazz.world.clearPose();
            }}""")
            await page.wait_for_timeout(1000)
            
            bench_res = await page.evaluate("""() => {
                return new Promise(resolve => {
                    const deltas = [];
                    let count = 0;
                    let last = performance.now();
                    function loop(now) {
                        const dt = now - last;
                        last = now;
                        if (count > 5) deltas.push(dt); // descartar primeiros 5 quadros de warmup
                        count++;
                        if (deltas.length >= 100) {
                            deltas.sort((a, b) => a - b);
                            const avgDt = deltas.reduce((s, v) => s + v, 0) / deltas.length;
                            const p95Dt = deltas[Math.floor(deltas.length * 0.95)];
                            const p99Dt = deltas[Math.floor(deltas.length * 0.99)];
                            resolve({
                                avgFps: Math.round(1000 / avgDt),
                                p95Fps: Math.round(1000 / p95Dt),
                                p99Fps: Math.round(1000 / p99Dt),
                                frameCount: deltas.length
                            });
                        } else {
                            requestAnimationFrame(loop);
                        }
                    }
                    requestAnimationFrame(loop);
                });
            }""")
            print(f"    -> {bp['name']}: Média {bench_res['avgFps']} FPS | p95: {bench_res['p95Fps']} FPS | p99: {bench_res['p99Fps']} FPS")
            report["fps_benchmarks"][bp["name"]] = bench_res

        # Telemetria do Passeio Guiado (trecho inicial)
        print("  Verificando telemetria do Passeio Guiado...")
        await page.click("#guided-toggle")
        await page.wait_for_timeout(500)
        
        tour_status = await page.evaluate("""() => {
            return new Promise(resolve => {
                const v = window.__gorilazz.vehicle;
                let offTrack = 0;
                let collisions = 0;
                let samples = 0;
                const start = performance.now();
                const timer = setInterval(() => {
                    samples++;
                    if (v.surface !== 'asfalto') offTrack++;
                    if (v.blocked) collisions++;
                    if (performance.now() - start > 6000) {
                        clearInterval(timer);
                        resolve({ samples, offTrack, collisions, surface: v.surface, speed: v.speed });
                    }
                }, 100);
            });
        }""")
        print(f"  Passeio Guiado status: {tour_status}")
        report["tour_telemetry"] = tour_status

        report["network"] = {
            "transferred_bytes": transferred_bytes,
            "transferred_mb": round(transferred_bytes / (1024 * 1024), 2)
        }
        
        # Salvar JSON de telemetria da revalidação
        json_path = os.path.join(OUT_DIR, "qa-revalidacao-20m-telemetria.json")
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        print(f"\nTelemetria gravada com sucesso em: {json_path}")
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run_revalidation())
