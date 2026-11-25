import os
import sys
import time
import json
import subprocess
import re
from playwright.sync_api import sync_playwright

EVIDENCIAS_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\fechamento-final-2026-11-26"
SITE_DIR = os.path.join(EVIDENCIAS_DIR, "site-estatico")
LOG_PATH = os.path.join(EVIDENCIAS_DIR, "servidor.log")
SERVER_SCRIPT = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\hospedagem-pages-2026-11-12\servidor-subcaminho.mjs"

def run_validation():
    print("Iniciando servidor subcaminho...")
    server_cmd = ["node", SERVER_SCRIPT, SITE_DIR, LOG_PATH]
    proc = subprocess.Popen(
        server_cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        bufsize=1
    )

    port = None
    deadline = time.time() + 10
    while time.time() < deadline:
        line = proc.stdout.readline()
        if not line:
            time.sleep(0.1)
            continue
        print(f"[Server Stdout] {line.strip()}")
        m = re.search(r"PORT=(\d+)", line)
        if m:
            port = int(m.group(1))
            break

    if not port:
        proc.kill()
        raise RuntimeError("Não foi possível obter a porta do servidor subcaminho.")

    base_url = f"http://127.0.0.1:{port}/Gorilazz/"
    print(f"Servidor subcaminho ativo na porta {port}: {base_url}")

    results = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "base_url": base_url,
        "http_responses": {
            "total": 0,
            "status_200_304": 0,
            "status_4xx_5xx": [],
        },
        "forbidden_assets_checked": {
            "png_in_materials": [],
            "gorillaz_phase7_glb": [],
            "kenney_suv_luxury_glb": []
        },
        "console_errors": [],
        "page_errors": [],
        "download_links_checked": [],
        "audio_tests": [],
        "piano_test": None,
        "screenshots": {},
        "verdict": "PENDING"
    }

    try:
        with sync_playwright() as p:
            print("Lançando Chromium headless com D3D11...")
            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--use-gl=angle",
                    "--use-angle=d3d11",
                    "--enable-webgl",
                    "--ignore-gpu-blocklist",
                    "--autoplay-policy=no-user-gesture-required"
                ]
            )
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                device_scale_factor=1.0
            )
            page = context.new_page()

            # Listeners
            def on_response(response):
                results["http_responses"]["total"] += 1
                url = response.url
                status = response.status
                if 200 <= status < 400:
                    results["http_responses"]["status_200_304"] += 1
                else:
                    results["http_responses"]["status_4xx_5xx"].append({"url": url, "status": status})

                # Verificar assets proibidos / removidos
                if "/assets/materials/" in url and url.endswith(".png"):
                    results["forbidden_assets_checked"]["png_in_materials"].append(url)
                if "gorillaz-phase7.glb" in url:
                    results["forbidden_assets_checked"]["gorillaz_phase7_glb"].append(url)
                if "kenney-suv-luxury.glb" in url:
                    results["forbidden_assets_checked"]["kenney_suv_luxury_glb"].append(url)

            def on_console(msg):
                if msg.type == "error":
                    results["console_errors"].append(msg.text)

            def on_pageerror(err):
                results["page_errors"].append(str(err))

            page.on("response", on_response)
            page.on("console", on_console)
            page.on("pageerror", on_pageerror)

            print(f"Navegando para {base_url}?perf...")
            page.goto(f"{base_url}?perf", wait_until="domcontentloaded", timeout=30000)

            # Aguardar __gorilazz
            print("Aguardando carregamento de window.__gorilazz...")
            page.wait_for_function("() => Boolean(window.__gorilazz && window.__gorilazz.world)", timeout=25000)
            page.wait_for_timeout(3000)

            # Entrar no mundo 3D
            print("Entrando no mundo 3D...")
            page.evaluate("""() => {
                const driveBtn = document.querySelector('#garage-action-drive');
                if (driveBtn) driveBtn.click();
            }""")
            page.wait_for_timeout(2000)

            # 1. Validar links locais de download no index.html
            print("Validando links locais de download no index.html...")
            links = page.evaluate("""() => {
                const anchors = Array.from(document.querySelectorAll('a[href]'));
                return anchors
                    .map(a => a.getAttribute('href'))
                    .filter(href => href && !href.startsWith('http') && !href.startsWith('#'));
            }""")

            for href in set(links):
                test_url = base_url + href.lstrip("./")
                resp = context.request.get(test_url)
                status = resp.status
                results["download_links_checked"].append({
                    "href": href,
                    "resolved_url": test_url,
                    "status": status,
                    "ok": (200 <= status < 400)
                })

            # 2. Testar áudios locais (os 3 MP3s)
            print("Testando reprodução e decodificação dos 3 MP3s em assets/audio/...")
            mp3_list = [
                "/Gorilazz/assets/audio/clint-eastwood.mp3",
                "/Gorilazz/assets/audio/feel-good-inc.mp3",
                "/Gorilazz/assets/audio/on-melancholy-hill.mp3"
            ]

            audio_results = page.evaluate("""async (urls) => {
                const out = [];
                for (const url of urls) {
                    try {
                        const a = new Audio(url);
                        a.preload = 'auto';
                        const p = new Promise((resolve) => {
                            a.oncanplaythrough = () => resolve({ url, success: true, duration: a.duration });
                            a.onerror = (e) => resolve({ url, success: false, error: a.error ? a.error.code : 'unknown' });
                            setTimeout(() => resolve({ url, success: a.readyState >= 2, duration: a.duration, timeout: true }), 4000);
                        });
                        a.load();
                        const res = await p;
                        out.push(res);
                    } catch (err) {
                        out.push({ url, success: false, error: String(err) });
                    }
                }
                return out;
            }""", mp3_list)
            results["audio_tests"] = audio_results

            # 3. Testar Rádio Kong FM
            print("Testando interação com o rádio Kong FM...")
            page.evaluate("""() => {
                if (window.__gorilazz && window.__gorilazz.radio) {
                    window.__gorilazz.radio.play();
                }
            }""")
            page.wait_for_timeout(1000)

            # 4. Testar Piano Screen
            print("Testando minigame do Piano...")
            piano_res = page.evaluate("""() => {
                try {
                    if (window.__gorilazz && window.__gorilazz.piano) {
                        window.__gorilazz.piano.open();
                        const dialog = document.querySelector('#piano-dialog');
                        const isOpen = dialog && dialog.open;
                        const canvas = document.querySelector('#piano-canvas');
                        const canvasOk = canvas && canvas.width > 0;
                        dialog.close();
                        return { tested: true, dialogOpened: isOpen, canvasValid: canvasOk };
                    }
                    return { tested: false, reason: 'piano not exposed' };
                } catch (e) {
                    return { tested: false, error: String(e) };
                }
            }""")
            results["piano_test"] = piano_res

            # 5. Capturas de tela e conferência visual
            print("Posicionando câmera e capturando screenshots...")

            # Screenshot 1: Palco do Murdoc (baixo novo)
            # Murdoc: MEMBER_LOCATIONS[1] -> x: -55, z: -131
            print("Capturando Palco Murdoc (baixo novo)...")
            page.evaluate("""() => {
                const v = window.__gorilazz.vehicle;
                v.x = -55.0;
                v.z = -122.5;
                v.heading = Math.PI;
                v.speed = 0;
                window.__gorilazz.world.resetCamera();
            }""")
            page.wait_for_timeout(3000)
            murdoc_path = os.path.join(EVIDENCIAS_DIR, "01-palco-murdoc-baixo.png")
            page.screenshot(path=murdoc_path)
            results["screenshots"]["01-palco-murdoc-baixo"] = murdoc_path

            # Screenshot 2: Palco da Noodle (guitarra nova)
            # Noodle: MEMBER_LOCATIONS[2] -> x: 42, z: -110
            print("Capturando Palco Noodle (guitarra nova)...")
            page.evaluate("""() => {
                const v = window.__gorilazz.vehicle;
                v.x = 42.0;
                v.z = -101.5;
                v.heading = Math.PI;
                v.speed = 0;
                window.__gorilazz.world.resetCamera();
            }""")
            page.wait_for_timeout(3000)
            noodle_path = os.path.join(EVIDENCIAS_DIR, "02-palco-noodle-guitarra.png")
            page.screenshot(path=noodle_path)
            results["screenshots"]["02-palco-noodle-guitarra"] = noodle_path

            # Screenshot 3: Calçadas com ladrilho/concreto
            # Nó 1 (x: 0, z: -52) calçada ao lado da pista
            print("Capturando Calçadas com ladrilho/concreto...")
            page.evaluate("""() => {
                const v = window.__gorilazz.vehicle;
                v.x = 2.0;
                v.z = -50.0;
                v.heading = 0.2;
                v.speed = 0;
                window.__gorilazz.world.resetCamera();
            }""")
            page.wait_for_timeout(2000)
            calcadas_path = os.path.join(EVIDENCIAS_DIR, "03-calcadas-ladrilho.png")
            page.screenshot(path=calcadas_path)
            results["screenshots"]["03-calcadas-ladrilho"] = calcadas_path

            # Screenshot 4: Esquinas nós 1, 5, 6, 7 e verificação de resíduo nós 1 e 6
            # Vista aérea abrangendo todo o circuito e cruzamentos
            print("Capturando Vista Aérea das Esquinas nós 1, 5, 6, 7...")
            page.evaluate("""() => {
                const overviewBtn = document.querySelector('#garage-action-overview');
                if (overviewBtn) overviewBtn.click();
            }""")
            page.wait_for_timeout(3000)
            esquinas_path = os.path.join(EVIDENCIAS_DIR, "04-esquinas-nos-1-5-6-7.png")
            page.screenshot(path=esquinas_path)
            results["screenshots"]["04-esquinas-nos-1-5-6-7"] = esquinas_path

            # Avaliação de Veredito
            bad_downloads = [d for d in results["download_links_checked"] if not d["ok"]]
            bad_audio = [a for a in results["audio_tests"] if not a["success"]]
            bad_forbidden = (
                len(results["forbidden_assets_checked"]["png_in_materials"]) > 0 or
                len(results["forbidden_assets_checked"]["gorillaz_phase7_glb"]) > 0 or
                len(results["forbidden_assets_checked"]["kenney_suv_luxury_glb"]) > 0
            )

            passed = (
                len(results["http_responses"]["status_4xx_5xx"]) == 0 and
                len(results["console_errors"]) == 0 and
                len(results["page_errors"]) == 0 and
                len(bad_downloads) == 0 and
                len(bad_audio) == 0 and
                not bad_forbidden
            )

            results["verdict"] = "PASSA" if passed else "NÃO PASSA"
            print(f"Validação concluída! Veredito: {results['verdict']}")

            browser.close()

    finally:
        print("Encerrando processo do servidor subcaminho...")
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()

    # Salvar JSON
    json_path = os.path.join(EVIDENCIAS_DIR, "validacao_congelamento_final.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Resultados gravados em {json_path}")

    return results

if __name__ == "__main__":
    res = run_validation()
    sys.exit(0 if res["verdict"] == "PASSA" else 1)
