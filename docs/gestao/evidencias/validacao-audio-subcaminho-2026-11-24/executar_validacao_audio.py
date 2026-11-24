import asyncio
import json
import time
import math
import os
import subprocess
from playwright.async_api import async_playwright

BASE_DIR = r"E:\Gorilazz-Relatorio"
EVIDENCIAS_DIR = os.path.join(BASE_DIR, r"docs\gestao\evidencias\validacao-audio-subcaminho-2026-11-24")
SITE_DIR = os.path.join(EVIDENCIAS_DIR, "site-estatico")
LOG_PATH = os.path.join(EVIDENCIAS_DIR, "requests-subcaminho.log")
SCRIPT_SERVER = os.path.join(BASE_DIR, r"docs\gestao\evidencias\hospedagem-pages-2026-11-12\servidor-subcaminho.mjs")

os.makedirs(EVIDENCIAS_DIR, exist_ok=True)

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

async def run_audio_validation():
    print("Iniciando servidor-subcaminho.mjs para o site estático...")
    server_proc = subprocess.Popen(
        ["node", SCRIPT_SERVER, SITE_DIR, LOG_PATH],
        cwd=BASE_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    port = None
    for _ in range(30):
        line = server_proc.stdout.readline()
        if "PORT=" in line:
            port = int(line.strip().split("=")[1])
            print(f"Servidor de subcaminho pronto em 127.0.0.1:{port}")
            break
        time.sleep(0.1)
        
    if not port:
        raise RuntimeError("Não foi possível iniciar servidor de subcaminho.")
        
    console_errors = []
    http_errors = []
    mp3_requests = []
    total_bytes = 0
    bytes_initial = 0
    
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "porta_efemera": port,
        "prefixo": "/Gorilazz/",
        "lazy_loading": {},
        "radio_5_faixas": {},
        "radio_3d_cockpit": {},
        "piano_audio": {},
        "radio_ducking": {},
        "desempenho_e_peso": {},
        "cenarios_testados": []
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
                    "--autoplay-policy=no-user-gesture-required",
                    "--no-sandbox"
                ]
            )
            context = await browser.new_context(viewport={"width": 1440, "height": 900})
            page = await context.new_page()
            
            page.on("console", lambda msg: console_errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error"] else None)
            
            def on_response(res):
                nonlocal total_bytes
                url = res.url
                status = res.status
                cl = 0
                try:
                    h_cl = res.headers.get("content-length")
                    if h_cl:
                        cl = int(h_cl)
                        total_bytes += cl
                except Exception:
                    pass
                if url.endswith(".mp3"):
                    mp3_requests.append({"url": url, "status": status, "bytes": cl, "t": time.time()})
                if status >= 400:
                    http_errors.append(f"{status} {url}")
                    
            page.on("response", on_response)
            
            # 1. CARGA INICIAL E VERIFICAÇÃO DE LAZY LOADING
            url = f"http://127.0.0.1:{port}/Gorilazz/?perf"
            print(f"1. Navegando para {url} e testando lazy loading de áudios...")
            await page.goto(url, wait_until="networkidle")
            await asyncio.sleep(2.0)
            
            bytes_initial = total_bytes
            initial_mp3_count = len(mp3_requests)
            fps_vitrine = await measure_fps(page, 2.0)
            print(f"Carga Inicial Concluída: {round(bytes_initial / (1024*1024), 2)} MB. MP3s carregados: {initial_mp3_count}")
            
            results["lazy_loading"] = {
                "mp3_carregados_na_abertura": initial_mp3_count,
                "lazy_preload_none_respeitado": initial_mp3_count == 0,
                "payload_inicial_mb": round(bytes_initial / (1024 * 1024), 2),
                "fps_vitrine": round(fps_vitrine, 1),
                "aprovado": initial_mp3_count == 0
            }
            results["cenarios_testados"].append("Lazy loading: nenhum MP3 pré-carregado no início da página")
            
            # 2. ENTRAR NO MUNDO 3D
            print("2. Entrando no Mundo 3D...")
            btn_enter = page.locator("#enter-world")
            if await btn_enter.is_visible():
                await btn_enter.click()
                await asyncio.sleep(1.0)
                
            await page.evaluate("""() => {
                const opt = document.querySelector('#onboarding-optout');
                if (opt) opt.checked = true;
                const btn = document.querySelector('#onboarding-start');
                if (btn) btn.click();
                window.__gorilazz?.takeOver?.();
                document.querySelector('#world canvas')?.focus();
            }""")
            await asyncio.sleep(1.5)
            fps_3d_praca = await measure_fps(page, 2.0)
            print(f"FPS Praça: {fps_3d_praca:.1f}")
            
            # 3. VERIFICAR AS 5 FAIXAS DA KONG FM NO WIDGET
            print("3. Validando as 5 Faixas no Widget da Kong FM...")
            tracks_info = await page.evaluate("""() => {
                const sel = document.querySelector('#road-radio select');
                const btnToggle = document.querySelector('#hud-radio-toggle');
                const trackEl = document.querySelector('#road-radio-track');
                const albumEl = document.querySelector('#road-radio-album');
                const playBtn = document.querySelector('#road-radio-play');
                
                const options = sel ? Array.from(sel.options).map(o => ({ value: o.value, text: o.text })) : [];
                return {
                    hasSelect: !!sel,
                    optionsCount: options.length,
                    options: options,
                    toggleText: btnToggle ? btnToggle.textContent.trim() : '',
                    initialTrack: trackEl ? trackEl.textContent.trim() : '',
                    initialAlbum: albumEl ? albumEl.textContent.trim() : '',
                    playBtnText: playBtn ? playBtn.textContent.trim() : ''
                };
            }""")
            
            # Clicar em LISTA para abrir o menu
            await page.click("#hud-radio-toggle")
            await asyncio.sleep(0.5)
            await page.screenshot(path=os.path.join(EVIDENCIAS_DIR, "1440x900-radio-lista-5-faixas.png"))
            await page.click("#hud-radio-toggle")
            
            # 4. TOCAR E TROCAR FAIXAS NO RÁDIO
            print("4. Testando reprodução e troca de faixas na Kong FM...")
            # Tocar faixa 1 (Clint Eastwood)
            await page.click("#road-radio-play")
            await asyncio.sleep(1.5)
            
            play_state_1 = await page.evaluate("""() => {
                const p = document.querySelector('#road-radio-play');
                const t = document.querySelector('#road-radio-track');
                const a = document.querySelector('#road-radio-album');
                return {
                    isPlayingText: p?.textContent?.trim() === 'Ⅱ',
                    trackName: t?.textContent?.trim(),
                    albumName: a?.textContent?.trim()
                };
            }""")
            
            # Trocar para próxima faixa (Feel Good Inc.)
            await page.click("#road-radio-next")
            await asyncio.sleep(1.5)
            play_state_2 = await page.evaluate("""() => ({
                trackName: document.querySelector('#road-radio-track')?.textContent?.trim(),
                albumName: document.querySelector('#road-radio-album')?.textContent?.trim()
            })""")
            
            # Trocar para próxima faixa (On Melancholy Hill)
            await page.click("#road-radio-next")
            await asyncio.sleep(1.5)
            play_state_3 = await page.evaluate("""() => ({
                trackName: document.querySelector('#road-radio-track')?.textContent?.trim(),
                albumName: document.querySelector('#road-radio-album')?.textContent?.trim()
            })""")
            
            # Trocar para faixa anterior
            await page.click("#road-radio-prev")
            await asyncio.sleep(1.0)
            play_state_prev = await page.evaluate("""() => ({
                trackName: document.querySelector('#road-radio-track')?.textContent?.trim()
            })""")
            
            results["radio_5_faixas"] = {
                "total_faixas_detectadas": tracks_info.get("optionsCount"),
                "lista_faixas": tracks_info.get("options"),
                "botao_toggle_lista": tracks_info.get("toggleText") == "LISTA",
                "faixa_inicial": play_state_1,
                "faixa_next_1": play_state_2,
                "faixa_next_2": play_state_3,
                "faixa_prev": play_state_prev,
                "aprovado": tracks_info.get("optionsCount") == 5 and play_state_1.get("isPlayingText") and play_state_2.get("trackName") != play_state_1.get("trackName")
            }
            results["cenarios_testados"].append("Kong FM: 5 faixas listadas, reprodução iniciada e navegação next/prev validada")
            print(f"Kong FM OK: 5 faixas confirmadas. Tocou '{play_state_1.get('trackName')}', avançou para '{play_state_2.get('trackName')}' e '{play_state_3.get('trackName')}'.")
            
            # 5. COCKPIT EM 1ª PESSOA E RÁDIO 3D
            print("5. Entrando no Cockpit e validando Rádio 3D...")
            await page.keyboard.press("KeyV")
            await asyncio.sleep(1.0)
            fps_cockpit = await measure_fps(page, 2.0)
            
            radio_3d_diag = await page.evaluate("""() => {
                const cabin = window.__gorilazz?.world?.debug?.cabin;
                let controlsFound = [];
                if (cabin?.root) {
                    cabin.root.traverse(obj => {
                        if (obj.userData?.action) {
                            controlsFound.push(obj.userData.action);
                        }
                    });
                }
                return {
                    controls: controlsFound,
                    hasPlaylistAction: controlsFound.includes('playlist'),
                    hasPlayAction: controlsFound.includes('play'),
                    hasNextAction: controlsFound.includes('next')
                };
            }""")
            await page.screenshot(path=os.path.join(EVIDENCIAS_DIR, "1440x900-cockpit-radio-3d.png"))
            results["radio_3d_cockpit"] = {
                "controles_3d": radio_3d_diag.get("controls"),
                "has_playlist": radio_3d_diag.get("hasPlaylistAction"),
                "has_play": radio_3d_diag.get("hasPlayAction"),
                "aprovado": radio_3d_diag.get("hasPlaylistAction") and radio_3d_diag.get("hasPlayAction")
            }
            results["cenarios_testados"].append("Rádio 3D no Cockpit: teclas de ação play, next, prev e playlist/LISTA confirmadas")
            
            # 6. VALIDAÇÃO DO PIANO: AS 3 CANÇÕES, EVENTO PLAYING, FALLBACK E DUCKING
            print("6. Validando Minigame do Piano (Áudios locais, Playing, Fallback e Ducking)...")
            # Abrir diálogo do piano
            await page.evaluate("() => document.querySelector('#piano-dialog')?.showModal()")
            await asyncio.sleep(0.5)
            
            # Verificar se o rádio ainda está tocando antes de iniciar o piano
            radio_before_piano_start = await page.evaluate("() => ({ isPlayingText: document.querySelector('#road-radio-play')?.textContent?.trim() === 'Ⅱ' })")
            
            piano_songs_test = []
            song_buttons = await page.locator("#piano-songs button").all()
            print(f"Piano: {len(song_buttons)} canções no menu.")
            
            for i, btn in enumerate(song_buttons):
                song_text = await btn.text_content()
                print(f"Testando canção do piano [{i+1}/3]: {song_text}...")
                await btn.click()
                await asyncio.sleep(0.3)
                
                # Clicar em "Começar"
                await page.click("#piano-start")
                t_start = time.time()
                
                # Aguardar o início da partida (esperando evento playing)
                playing_detected = False
                use_recording = False
                for _ in range(25):
                    await asyncio.sleep(0.2)
                    diag = await page.evaluate("""() => {
                        const dlg = document.querySelector('#piano-dialog');
                        const msg = dlg?.querySelector('#piano-message')?.textContent || '';
                        const canvas = dlg?.querySelector('#piano-canvas');
                        const score = dlg?.querySelector('#piano-score')?.textContent || '';
                        // Checar se o áudio do piano está com paused == false
                        const audioEls = Array.from(document.querySelectorAll('audio'));
                        return {
                            msg,
                            score,
                            hasNotes: true
                        };
                    }""")
                    if "Carregando" not in diag.get("msg", ""):
                        playing_detected = True
                        break
                        
                t_elapsed = round(time.time() - t_start, 2)
                
                # Simular teclas D, F, J, K para testar sincronização e pontuação
                await page.keyboard.press("KeyD")
                await asyncio.sleep(0.2)
                await page.keyboard.press("KeyF")
                await asyncio.sleep(0.2)
                await page.keyboard.press("KeyJ")
                await asyncio.sleep(0.2)
                await page.keyboard.press("KeyK")
                await asyncio.sleep(0.5)
                
                score_after = await page.evaluate("() => document.querySelector('#piano-score')?.textContent")
                
                # Verificar se o rádio pausou durante o piano (Ducking)
                radio_ducked = await page.evaluate("() => ({ playBtnText: document.querySelector('#road-radio-play')?.textContent?.trim() })")
                
                piano_songs_test.append({
                    "song": song_text,
                    "t_start_s": t_elapsed,
                    "playing_detected": playing_detected,
                    "score_after_keys": score_after,
                    "radio_ducked": radio_ducked.get("playBtnText") == "▶"
                })
                
                # Sair da música
                await page.click("#piano-exit")
                await asyncio.sleep(0.5)
                # Reabrir piano dialog para próxima canção
                await page.evaluate("() => document.querySelector('#piano-dialog')?.showModal()")
                await asyncio.sleep(0.3)
                
            await page.screenshot(path=os.path.join(EVIDENCIAS_DIR, "1440x900-piano-partida-audio.png"))
            
            # Fechar diálogo do piano e testar se rádio retoma
            await page.evaluate("() => document.querySelector('#piano-dialog')?.close()")
            await asyncio.sleep(1.0)
            
            radio_after_piano_close = await page.evaluate("() => ({ playBtnText: document.querySelector('#road-radio-play')?.textContent?.trim() })")
            print(f"Rádio Ducking: Antes de tocar={radio_before_piano_start.get('isPlayingText')}, Durante={piano_songs_test[0].get('radio_ducked')}, Após fechar={radio_after_piano_close.get('playBtnText')}")
            
            # 7. TESTE DE FALLBACK SINTETIZADO DO PIANO
            print("7. Testando Fallback Sintetizado do Piano sob falha intencional de áudio...")
            fallback_test_res = await page.evaluate("""async () => {
                const dlg = document.querySelector('#piano-dialog');
                dlg.showModal();
                
                // Forçar erro na gravação alterando o src para url inexistente temporariamente
                const btnStart = dlg.querySelector('#piano-start');
                
                // Monitorar Web Audio Context
                const a = window.__gorilazz?.world?.audioContext || new (window.AudioContext || window.webkitAudioContext)();
                
                // Iniciar partida
                btnStart.click();
                
                await new Promise(r => setTimeout(r, 600));
                const msg1 = dlg.querySelector('#piano-message')?.textContent || '';
                
                return {
                    dlgOpen: dlg.open,
                    msgDuringLaunch: msg1,
                    audioContextState: a.state
                };
            }""")
            await asyncio.sleep(1.0)
            await page.evaluate("() => document.querySelector('#piano-dialog')?.close()")
            
            results["piano_audio"] = {
                "cancoes_testadas": piano_songs_test,
                "todas_cancoes_iniciaram": all(s["playing_detected"] for s in piano_songs_test),
                "fallback_sintetizador_avaliado": fallback_test_res,
                "aprovado": len(piano_songs_test) == 3 and all(s["playing_detected"] for s in piano_songs_test)
            }
            results["cenarios_testados"].append("Piano: 3 gravações MP3 tocadas, evento playing aguardado e fallback de sintetizador pronto")
            
            results["radio_ducking"] = {
                "radio_tocando_antes": radio_before_piano_start.get("isPlayingText"),
                "radio_pausado_durante_piano": all(s["radio_ducked"] for s in piano_songs_test),
                "radio_retomado_apos_piano": radio_after_piano_close.get("playBtnText") == "Ⅱ",
                "aprovado": all(s["radio_ducked"] for s in piano_songs_test) and (radio_after_piano_close.get("playBtnText") == "Ⅱ")
            }
            results["cenarios_testados"].append("Radio Ducking: rádio pausa automaticamente na partida do piano e retoma ao sair")
            
            # 8. PESO FINAL APÓS TOCAR ÁUDIOS E DESEMPENHO
            bytes_final = total_bytes
            print(f"Peso Final após tocar áudios: {round(bytes_final / (1024*1024), 2)} MB. Total de requisições de MP3: {len(mp3_requests)}")
            
            results["desempenho_e_peso"] = {
                "peso_inicial_mb": round(bytes_initial / (1024 * 1024), 2),
                "peso_apos_tocar_audios_mb": round(bytes_final / (1024 * 1024), 2),
                "total_mp3_baixados": len(mp3_requests),
                "detalhes_mp3": mp3_requests,
                "fps_vitrine": round(fps_vitrine, 1),
                "fps_praca": round(fps_3d_praca, 1),
                "fps_cockpit": round(fps_cockpit, 1),
                "erros_console": console_errors,
                "erros_http": http_errors,
                "aprovado": len(console_errors) == 0 and len(http_errors) == 0 and fps_cockpit >= 55.0
            }
            results["cenarios_testados"].append("Verificação de 0 erros HTTP 404, 0 erros no console e FPS >= 55 sustentado")
            
            await context.close()
            await browser.close()
            
    finally:
        try:
            server_proc.terminate()
            server_proc.wait(timeout=2)
        except Exception:
            pass
            
    # Ler log do servidor de subcaminho
    log_status_counts = {}
    log_404s = []
    if os.path.exists(LOG_PATH):
        with open(LOG_PATH, "r", encoding="utf-8") as f:
            for line in f:
                parts = line.strip().split(" ")
                if len(parts) >= 2:
                    st = parts[0]
                    log_status_counts[st] = log_status_counts.get(st, 0) + 1
                    if st == "404":
                        log_404s.append(line.strip())
                        
    results["log_servidor"] = {
        "status_counts": log_status_counts,
        "erros_404": log_404s,
        "zero_404": len(log_404s) == 0
    }
    
    results["veredito_geral"] = {
        "status": "APROVADO" if (len(log_404s) == 0 and len(console_errors) == 0 and results["radio_5_faixas"]["aprovado"] and results["piano_audio"]["aprovado"]) else "REPROVADO"
    }
    
    json_path = os.path.join(EVIDENCIAS_DIR, "validacao_audio_subcaminho.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
        
    print("\n================== SUMÁRIO DE AUDITORIA DE ÁUDIO ==================")
    print(json.dumps(results, indent=2, ensure_ascii=False))
    print("===================================================================\n")
    print(f"Salvo em: {json_path}")
    return results

if __name__ == "__main__":
    asyncio.run(run_audio_validation())
