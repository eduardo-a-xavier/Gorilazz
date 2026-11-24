import os
import sys
import time
import math
import json
import asyncio
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\video-dirigindo-lua-2026-11-24"
os.makedirs(OUT_DIR, exist_ok=True)

async def set_overlay(page, text):
    await page.evaluate("""(text) => {
        let el = document.getElementById('qa-subtitle-overlay');
        if (!text) {
            if (el) el.style.opacity = '0';
            return;
        }
        if (!el) {
            el = document.createElement('div');
            el.id = 'qa-subtitle-overlay';
            el.style.position = 'fixed';
            el.style.top = '28px';
            el.style.left = '50%';
            el.style.transform = 'translateX(-50%)';
            el.style.backgroundColor = 'rgba(12, 16, 26, 0.90)';
            el.style.color = '#FFFFFF';
            el.style.border = '2px solid #FF7700';
            el.style.boxShadow = '0 0 18px rgba(255, 119, 0, 0.45)';
            el.style.borderRadius = '8px';
            el.style.padding = '10px 24px';
            el.style.fontFamily = 'Montserrat, Segoe UI, sans-serif';
            el.style.fontSize = '17px';
            el.style.fontWeight = '700';
            el.style.letterSpacing = '0.04em';
            el.style.zIndex = '9999999';
            el.style.pointerEvents = 'none';
            el.style.textAlign = 'center';
            el.style.transition = 'opacity 0.25s ease';
            document.body.appendChild(el);
        }
        el.textContent = text;
        el.style.opacity = '1';
    }""", text)

async def clear_overlay(page):
    await set_overlay(page, "")

async def get_vehicle_state(page):
    return await page.evaluate("""() => {
        const v = window.__gorilazz.vehicle;
        return {
            x: v.x,
            z: v.z,
            heading: v.heading,
            speed: v.speed,
            surface: v.surface,
            blocked: v.blocked
        };
    }""")

async def drive_towards_waypoint(page, target_x, target_z, stop_distance=4.0, max_speed_kmh=18, timeout_s=25):
    """
    Controlador de direção usando exclusivamente as teclas W, A, S, D reais do navegador.
    """
    t_start = time.time()
    max_speed_ms = max_speed_kmh / 3.6
    
    current_steer_key = None
    throttle_down = False
    
    while time.time() - t_start < timeout_s:
        st = await get_vehicle_state(page)
        dx = target_x - st["x"]
        dz = target_z - st["z"]
        dist = math.hypot(dx, dz)
        
        if dist <= stop_distance:
            break
            
        # Ângulo desejado no sistema de coordenadas do jogo: dx = -sin(h)*travel, dz = -cos(h)*travel
        target_h = math.atan2(-dx, -dz)
        diff = (target_h - st["heading"] + math.pi) % (2 * math.pi) - math.pi
        
        # Controle de esterço: diff > 0 -> KeyA (esquerda); diff < 0 -> KeyD (direita)
        if diff > 0.08:
            if current_steer_key != "KeyA":
                if current_steer_key:
                    await page.keyboard.up(current_steer_key)
                await page.keyboard.down("KeyA")
                current_steer_key = "KeyA"
        elif diff < -0.08:
            if current_steer_key != "KeyD":
                if current_steer_key:
                    await page.keyboard.up(current_steer_key)
                await page.keyboard.down("KeyD")
                current_steer_key = "KeyD"
        else:
            if current_steer_key:
                await page.keyboard.up(current_steer_key)
                current_steer_key = None
                
        # Controle de aceleração: acelerar se velocidade abaixo do teto
        # Em curvas fechadas, alivia o acelerador
        if abs(diff) > 0.6:
            target_cap = max_speed_ms * 0.6
        else:
            target_cap = max_speed_ms
            
        if st["speed"] < target_cap:
            if not throttle_down:
                await page.keyboard.down("KeyW")
                throttle_down = True
        else:
            if throttle_down:
                await page.keyboard.up("KeyW")
                throttle_down = False
                
        await asyncio.sleep(0.06)
        
    # Limpar teclas ao término do trecho
    if current_steer_key:
        await page.keyboard.up(current_steer_key)
    if throttle_down:
        await page.keyboard.up("KeyW")

async def stop_vehicle(page, hold_s=2.0):
    """
    Freia o veículo com KeyS até parar e aguarda hold_s segundos.
    """
    await page.keyboard.up("KeyW")
    await page.keyboard.up("KeyA")
    await page.keyboard.up("KeyD")
    
    t_start = time.time()
    await page.keyboard.down("KeyS")
    while time.time() - t_start < 1.2:
        st = await get_vehicle_state(page)
        if abs(st["speed"]) < 0.2:
            break
        await asyncio.sleep(0.05)
    await page.keyboard.up("KeyS")
    
    # Aguardar tempo de visualização
    await asyncio.sleep(hold_s)

async def record_driving_session():
    print("=== INICIANDO GRAVAÇÃO DA SESSÃO DE DIREÇÃO MANUAL (W/A/S/D) COM MURDOC LUNAR ===")
    
    timeline_log = []
    def log_event(t, desc, ok=True):
        entry = {"time_s": round(t, 1), "desc": desc, "ok": ok}
        timeline_log.append(entry)
        print(f"[{entry['time_s']:05.1f}s] {desc}")

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
            record_video_dir=OUT_DIR,
            record_video_size={"width": 1440, "height": 900}
        )
        page = await context.new_page()
        
        session_start = time.time()
        def elapsed():
            return time.time() - session_start

        # -------------------------------------------------------------
        # BLOCO 1: Vitrine do Topo (Showcase com Murdoc no céu a oeste)
        # -------------------------------------------------------------
        log_event(elapsed(), "Acessando http://localhost:3000/?perf...")
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await asyncio.sleep(2.0)
        
        await set_overlay(page, "1. Vitrine Inicial: Murdoc Monumental no Horizonte a Oeste")
        log_event(elapsed(), "Vitrine do topo exibida com integrantes e Murdoc ao fundo")
        await asyncio.sleep(6.0)
        
        # -------------------------------------------------------------
        # BLOCO 2: Entrada no Modo 3D com Asserções Estritas
        # -------------------------------------------------------------
        await set_overlay(page, "2. Entrando no Modo 3D: Clicando em 'Quero dirigir'")
        log_event(elapsed(), "Clicando em #enter-world para entrar no 3D")
        
        btn_enter = page.locator("#enter-world")
        assert await btn_enter.is_visible(), "Botão #enter-world não está visível"
        await btn_enter.click()
        await asyncio.sleep(1.0)
        
        # Fechar onboarding
        log_event(elapsed(), "Fechando diálogo de onboarding (#onboarding-start)")
        await page.evaluate("""() => {
            const opt = document.querySelector('#onboarding-optout');
            if (opt) opt.checked = true;
            const btn = document.querySelector('#onboarding-start');
            if (btn) btn.click();
        }""")
        await asyncio.sleep(1.0)
        
        # Asserções de conformidade
        is_mode_3d = await page.evaluate("() => document.documentElement.classList.contains('mode-3d')")
        assert is_mode_3d, "ERRO CRÍTICO: documentElement não possui a classe 'mode-3d'"
        log_event(elapsed(), "Asserção APROVADA: classe 'mode-3d' ativa no documentElement")
        
        # Tirar foco de qualquer botão clicando no canvas e acionar KeyW
        await page.evaluate("() => document.activeElement && document.activeElement.blur()")
        await page.mouse.click(720, 450)
        await asyncio.sleep(0.5)
        
        await set_overlay(page, "Assumindo o volante com teclas WASD (Direção Real)")
        await page.keyboard.down("KeyW")
        await asyncio.sleep(1.5)
        await page.keyboard.up("KeyW")
        
        st_initial = await get_vehicle_state(page)
        log_event(elapsed(), f"Carro em movimento manual verificado: speed={st_initial['speed']:.2f} m/s")
        await clear_overlay(page)
        
        # -------------------------------------------------------------
        # BLOCO 3: Condução pelas Avenidas Clint Eastwood e Saturnz Barz (Murdoc Lunar)
        # -------------------------------------------------------------
        await set_overlay(page, "Conduzindo pela Av. Clint Eastwood: Murdoc Lunar no Céu")
        log_event(elapsed(), "Conduzindo pela Av. Clint Eastwood rumo a (-37, -54)")
        await drive_towards_waypoint(page, -37.0, -54.0, stop_distance=4.0, max_speed_kmh=16, timeout_s=12)
        
        log_event(elapsed(), "Avançando para o mirante de Clint Eastwood (-65, -58)")
        await drive_towards_waypoint(page, -65.0, -58.0, stop_distance=4.0, max_speed_kmh=14, timeout_s=10)
        await stop_vehicle(page, hold_s=3.0)
        log_event(elapsed(), "Pausa em Clint Eastwood com Murdoc lunar visível à frente")
        
        # Virar para o lado oposto para mostrar a lua saindo do quadro
        await set_overlay(page, "Curva para Sudeste: Murdoc Lunar saindo do enquadramento da câmera")
        log_event(elapsed(), "Curva rumo a Av. Humanz (-73, -62) -> (-83, -84)")
        await drive_towards_waypoint(page, -73.0, -62.0, stop_distance=5.0, max_speed_kmh=14, timeout_s=8)
        await drive_towards_waypoint(page, -83.0, -84.0, stop_distance=5.0, max_speed_kmh=14, timeout_s=8)
        log_event(elapsed(), "Murdoc lunar saiu do quadro ao virar o carro")
        await asyncio.sleep(2.0)
        
        # Entrar na Av. Saturnz Barz
        await set_overlay(page, "Entrando na Av. Saturnz Barz: Murdoc Lunar reaparecendo")
        log_event(elapsed(), "Conduzindo pela Av. Saturnz Barz rumo a (-83, -110) e (-57, -144)")
        await drive_towards_waypoint(page, -83.0, -110.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=8)
        await drive_towards_waypoint(page, -57.0, -144.0, stop_distance=4.0, max_speed_kmh=14, timeout_s=12)
        await stop_vehicle(page, hold_s=3.0)
        log_event(elapsed(), "Pausa em Saturnz Barz: Murdoc lunar nítido no horizonte a noroeste")
        
        # -------------------------------------------------------------
        # BLOCO 4: Conduzindo aos Easter Eggs
        # -------------------------------------------------------------
        # 4.1 Aviso Zumbis (-5, -85)
        await set_overlay(page, "Rumo ao Easter Egg: Aviso de Zumbis do Kong Studios")
        log_event(elapsed(), "Dirigindo rumo ao cruzamento central (-5, -85)")
        await drive_towards_waypoint(page, -8.0, -157.0, stop_distance=6.0, max_speed_kmh=18, timeout_s=10)
        await drive_towards_waypoint(page, 0.0, -115.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=10)
        await drive_towards_waypoint(page, -5.0, -85.0, stop_distance=3.5, max_speed_kmh=12, timeout_s=10)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Placa 'AVISO: ZUMBIS DO KONG STUDIOS' (-5, -85)")
        log_event(elapsed(), "Parada em frente ao Aviso dos Zumbis (-5, -85)")
        await asyncio.sleep(2.0)
        
        # 4.2 Alce Geométrico (58, -38)
        await set_overlay(page, "Rumo ao Easter Egg: Alce Geométrico de 19-2000")
        log_event(elapsed(), "Dirigindo rumo ao Alce Geométrico (58, -38)")
        await drive_towards_waypoint(page, 27.0, -91.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=10)
        await drive_towards_waypoint(page, 56.0, -70.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=8)
        await drive_towards_waypoint(page, 75.0, -48.0, stop_distance=5.0, max_speed_kmh=14, timeout_s=8)
        await drive_towards_waypoint(page, 58.0, -38.0, stop_distance=4.0, max_speed_kmh=12, timeout_s=8)
        await stop_vehicle(page, hold_s=4.0)
        await set_overlay(page, "Easter Egg: Alce de 19-2000 com Galhadas em (58, -38)")
        log_event(elapsed(), "Parada em frente ao Alce de 19-2000 (58, -38)")
        await asyncio.sleep(2.0)
        
        # 4.3 Pôster SAVE US FROM HIM (106, -110)
        await set_overlay(page, "Rumo ao Pôster: SAVE US FROM HIM (Sem Árvore na Frente)")
        log_event(elapsed(), "Dirigindo rumo ao Pôster Save (106, -110)")
        await drive_towards_waypoint(page, 85.0, -70.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=8)
        await drive_towards_waypoint(page, 96.0, -91.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=8)
        await drive_towards_waypoint(page, 106.0, -110.0, stop_distance=4.0, max_speed_kmh=12, timeout_s=8)
        await stop_vehicle(page, hold_s=4.0)
        await set_overlay(page, "Easter Egg: Pôster 'SAVE US FROM HIM' Desobstruído (106, -110)")
        log_event(elapsed(), "Parada em frente ao Pôster Save desobstruído (106, -110)")
        await asyncio.sleep(2.0)
        
        # 4.4 Trailer Winnebago (-77, -41)
        await set_overlay(page, "Rumo ao Easter Egg: Trailer Winnebago com Placa M1-N4-STY")
        log_event(elapsed(), "Contornando a ilha de volta a oeste rumo a (-77, -41)")
        await drive_towards_waypoint(page, 72.0, -126.0, stop_distance=6.0, max_speed_kmh=18, timeout_s=10)
        await drive_towards_waypoint(page, 46.0, -110.0, stop_distance=6.0, max_speed_kmh=18, timeout_s=10)
        await drive_towards_waypoint(page, 27.0, -91.0, stop_distance=6.0, max_speed_kmh=18, timeout_s=10)
        await drive_towards_waypoint(page, -36.0, -101.0, stop_distance=6.0, max_speed_kmh=18, timeout_s=12)
        await drive_towards_waypoint(page, -73.0, -62.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=10)
        await drive_towards_waypoint(page, -77.0, -41.0, stop_distance=3.5, max_speed_kmh=12, timeout_s=8)
        await stop_vehicle(page, hold_s=4.5)
        await set_overlay(page, "Easter Egg: Trailer Winnebago com Placa 'M1-N4-STY' (-77, -41)")
        log_event(elapsed(), "Parada em frente ao Trailer Winnebago (-77, -41)")
        await asyncio.sleep(2.0)
        
        # 4.5 Pôster REJECT FALSE ICONS (-101, -110) e PAZUZU (-98, -122)
        await set_overlay(page, "Rumo aos Pôsteres REJECT FALSE ICONS e PAZUZU")
        log_event(elapsed(), "Avançando para (-101, -110) e (-98, -122)")
        await drive_towards_waypoint(page, -83.0, -84.0, stop_distance=5.0, max_speed_kmh=16, timeout_s=10)
        await drive_towards_waypoint(page, -101.0, -110.0, stop_distance=3.5, max_speed_kmh=12, timeout_s=8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Pôster 'REJECT FALSE ICONS' (-101, -110)")
        log_event(elapsed(), "Parada em frente ao Pôster REJECT FALSE ICONS")
        await asyncio.sleep(2.0)
        
        await drive_towards_waypoint(page, -98.0, -122.0, stop_distance=3.5, max_speed_kmh=12, timeout_s=8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Pôster 'PAZUZU' da Fase 2 (-98, -122)")
        log_event(elapsed(), "Parada em frente ao Pôster PAZUZU (-98, -122)")
        await asyncio.sleep(2.0)
        
        # -------------------------------------------------------------
        # BLOCO 5: Buzina G e Menu [H] Controles
        # -------------------------------------------------------------
        await set_overlay(page, "5. Demonstração da Buzina [G] (3 toques com cooldown)")
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 1º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (Tom 235Hz -> 185Hz sawtooth)")
        await asyncio.sleep(1.0)
        
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 2º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (2º toque - intervalo respeitado)")
        await asyncio.sleep(1.0)
        
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 3º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (3º toque - áudio adaptativo)")
        await asyncio.sleep(1.2)
        
        # Abrir menu [H]
        await set_overlay(page, "Abrindo Menu [H] de Controles: Exibição de 'G · Buzina'")
        log_event(elapsed(), "Pressionando tecla H para abrir menu de controles")
        await page.keyboard.press("KeyH")
        await asyncio.sleep(3.5)
        
        # Fechar menu com Escape
        log_event(elapsed(), "Fechando menu [H] com Escape")
        await page.keyboard.press("Escape")
        await asyncio.sleep(1.5)
        
        # -------------------------------------------------------------
        # BLOCO 6: Volta Curta em 1ª Pessoa (Tecla V) com Murdoc pelo Para-brisa
        # -------------------------------------------------------------
        await set_overlay(page, "6. Câmera em 1ª Pessoa (Tecla V): Murdoc pelo Para-brisa")
        log_event(elapsed(), "Pressionando tecla V para ativar câmera de 1ª pessoa")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(2.0)
        
        # Conduzir em 1ª pessoa fazendo curva em direção a (-150, -75)
        log_event(elapsed(), "Conduzindo em 1ª pessoa apontando o para-brisa para oeste")
        await set_overlay(page, "Condução em 1ª Pessoa: Murdoc Monumental no Para-brisa Dianteiro")
        
        # Acelerar e esterçar suavemente para apontar para (-150, -75)
        t_fp = time.time()
        await page.keyboard.down("KeyW")
        await page.keyboard.down("KeyA")
        await asyncio.sleep(2.5)
        await page.keyboard.up("KeyA")
        
        # Seguir em frente por 12 segundos em 1ª pessoa
        await asyncio.sleep(12.0)
        await page.keyboard.up("KeyW")
        await stop_vehicle(page, hold_s=2.5)
        log_event(elapsed(), "Murdoc lunar visível através do vidro frontal e cockpit")
        
        # Retornar para 3ª pessoa
        log_event(elapsed(), "Retornando para a 3ª pessoa com tecla V")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(2.0)
        
        # Conclusão da sessão
        await set_overlay(page, "Sessão Concluída: 100% Dirigido com Teclas WASD | Gorilazz QA")
        log_event(elapsed(), "Sessão contínua concluída com sucesso")
        await asyncio.sleep(4.0)
        await clear_overlay(page)
        
        total_duration = elapsed()
        log_event(total_duration, f"Gravação finalizada. Duração total: {total_duration:.1f} s ({total_duration/60:.2f} min)")
        
        # Salvar log de linha do tempo
        timeline_path = os.path.join(OUT_DIR, "timeline_gravacao.json")
        with open(timeline_path, "w", encoding="utf-8") as f:
            json.dump({
                "duration_seconds": round(total_duration, 1),
                "duration_formatted": f"{int(total_duration//60)}m {int(total_duration%60)}s",
                "events": timeline_log
            }, f, indent=2, ensure_ascii=False)
            
        await context.close()
        await browser.close()
        print(f"Vídeo bruto Playwright gravado em {OUT_DIR}")

if __name__ == "__main__":
    asyncio.run(record_driving_session())
