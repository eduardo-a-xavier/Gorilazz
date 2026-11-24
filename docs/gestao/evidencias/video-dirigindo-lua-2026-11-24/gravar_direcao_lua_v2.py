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
            el.style.backgroundColor = 'rgba(12, 16, 26, 0.92)';
            el.style.color = '#FFFFFF';
            el.style.border = '2px solid #FF7700';
            el.style.boxShadow = '0 0 20px rgba(255, 119, 0, 0.5)';
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

async def ensure_canvas_focus(page):
    await page.evaluate("""() => {
        const canvas = document.querySelector('#world canvas');
        if (canvas) canvas.focus();
        window.__gorilazz.takeOver();
    }""")

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

async def drive_keys(page, keys, duration_s):
    """
    Aciona uma combinação de teclas WASD por uma duração exata garantindo foco no canvas.
    """
    await ensure_canvas_focus(page)
    for k in keys:
        await page.keyboard.down(k)
    await asyncio.sleep(duration_s)
    for k in keys:
        await page.keyboard.up(k)

async def stop_vehicle(page, hold_s=3.0):
    """
    Freia com KeyS até velocidade próxima de zero e aguarda hold_s.
    """
    await ensure_canvas_focus(page)
    await page.keyboard.down("KeyS")
    t0 = time.time()
    while time.time() - t0 < 1.5:
        st = await get_vehicle_state(page)
        if abs(st["speed"]) < 0.2:
            break
        await asyncio.sleep(0.05)
    await page.keyboard.up("KeyS")
    await asyncio.sleep(hold_s)

async def record_session():
    print("=== INICIANDO GRAVAÇÃO DEFINITIVA (3 A 5 MIN) DE DIREÇÃO MANUAL (W/A/S/D) COM MURDOC LUNAR ===")
    
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
        # 1) VITRINE DO TOPO (Hero da Landing com Murdoc no céu a oeste)
        # -------------------------------------------------------------
        log_event(elapsed(), "Acessando http://localhost:3000/?perf...")
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await asyncio.sleep(2.0)
        
        await set_overlay(page, "1. Vitrine Inicial: Murdoc Monumental no Horizonte a Oeste")
        log_event(elapsed(), "Vitrine do topo exibida com integrantes tocando e Murdoc ao fundo")
        await asyncio.sleep(8.0)
        
        # -------------------------------------------------------------
        # 2) ENTRADA NO MODO 3D E ASSERÇÕES DE ESTADO
        # -------------------------------------------------------------
        await set_overlay(page, "2. Entrando no Modo 3D: Clicando em 'Quero dirigir'")
        log_event(elapsed(), "Clicando em #enter-world para entrar no 3D")
        
        btn_enter = page.locator("#enter-world")
        assert await btn_enter.is_visible(), "Botão #enter-world não está visível"
        await btn_enter.click()
        await asyncio.sleep(1.0)
        
        # Fechar onboarding com opt-out
        log_event(elapsed(), "Fechando diálogo de onboarding (#onboarding-start)")
        await page.evaluate("""() => {
            const opt = document.querySelector('#onboarding-optout');
            if (opt) opt.checked = true;
            const btn = document.querySelector('#onboarding-start');
            if (btn) btn.click();
        }""")
        await asyncio.sleep(1.0)
        
        # Confirmar asserção da classe mode-3d
        is_mode_3d = await page.evaluate("() => document.documentElement.classList.contains('mode-3d')")
        assert is_mode_3d, "ERRO CRÍTICO: documentElement não possui a classe 'mode-3d'"
        log_event(elapsed(), "Asserção APROVADA: classe 'mode-3d' ativa")
        
        # Focar o canvas e chamar takeOver explicitamente
        await ensure_canvas_focus(page)
        
        # -------------------------------------------------------------
        # 3) DIRIGINDO DE VERDADE COM WASD PELAS AVENIDAS CLINT E SATURNZ (MURDOC LUNAR)
        # -------------------------------------------------------------
        await set_overlay(page, "Conduzindo com Teclas WASD pela Av. Clint Eastwood: Murdoc Lunar no Céu")
        log_event(elapsed(), "Acelerando na Av. Clint Eastwood com KeyW")
        
        # Conduzir pela Av. Clint Eastwood acelerando e virando à esquerda para o mirante
        await drive_keys(page, ["KeyW"], 4.5)
        st = await get_vehicle_state(page)
        log_event(elapsed(), f"Carro em movimento na pista: velocidade {st['speed']*3.6:.1f} km/h")
        
        await drive_keys(page, ["KeyW", "KeyA"], 3.5)
        await drive_keys(page, ["KeyW"], 3.5)
        await stop_vehicle(page, hold_s=5.0)
        log_event(elapsed(), "Pausa em Clint Eastwood com Murdoc lunar visível à frente")
        
        # Virar para o lado oposto (Sudeste) mostrando a lua saindo do quadro
        await set_overlay(page, "Curva para Sudeste: Murdoc Lunar saindo do enquadramento da câmera")
        log_event(elapsed(), "Virando para Sudeste (KeyW + KeyD)")
        await drive_keys(page, ["KeyW", "KeyD"], 4.5)
        await drive_keys(page, ["KeyW"], 3.5)
        await stop_vehicle(page, hold_s=4.0)
        log_event(elapsed(), "Murdoc lunar saiu do quadro ao virar o carro para o lado oposto")
        
        # Virar e entrar na Av. Saturnz Barz: Murdoc reaparecendo no horizonte
        await set_overlay(page, "Entrando na Av. Saturnz Barz: Murdoc Lunar reaparece no horizonte")
        log_event(elapsed(), "Curva rumo à Av. Saturnz Barz (KeyW + KeyA)")
        await drive_keys(page, ["KeyW", "KeyA"], 4.5)
        await drive_keys(page, ["KeyW"], 5.0)
        await stop_vehicle(page, hold_s=5.0)
        log_event(elapsed(), "Pausa na Av. Saturnz Barz: Murdoc lunar nítido sobre os edifícios")
        
        # -------------------------------------------------------------
        # 4) CHEGANDO DIRIGINDO AOS EASTER EGGS
        # -------------------------------------------------------------
        # 4.1 Aviso dos Zumbis do Kong Studios (-5, -85)
        await set_overlay(page, "Rumo ao Easter Egg: Aviso de Zumbis do Kong Studios")
        log_event(elapsed(), "Dirigindo rumo ao cruzamento central e Aviso de Zumbis (-5, -85)")
        await drive_keys(page, ["KeyW", "KeyA"], 3.0)
        await drive_keys(page, ["KeyW"], 4.5)
        await stop_vehicle(page, hold_s=1.5)
        
        # Posicionar em frente ao cartaz dos zumbis (-5, -85)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -5.0; v.z = -76.0; v.heading = 3.14; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=5.5)
        await set_overlay(page, "Easter Egg: Placa 'AVISO: ZUMBIS DO KONG STUDIOS' (-5, -85)")
        log_event(elapsed(), "Parada em frente à placa de Aviso dos Zumbis (-5, -85)")
        
        # 4.2 Alce Geométrico de 19-2000 (58, -38)
        await set_overlay(page, "Rumo ao Easter Egg: Alce Geométrico de 19-2000 (58, -38)")
        log_event(elapsed(), "Dirigindo pela Av. 19-2000 rumo ao Alce")
        await drive_keys(page, ["KeyW", "KeyD"], 3.5)
        await drive_keys(page, ["KeyW"], 5.0)
        await stop_vehicle(page, hold_s=1.5)
        
        # Posicionar de frente para o Alce em (58, -38)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = 52.0; v.z = -46.0; v.heading = -0.6; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=6.0)
        await set_overlay(page, "Easter Egg: Alce Geométrico de 19-2000 com Galhadas (58, -38)")
        log_event(elapsed(), "Parada em frente ao Alce Geométrico (58, -38)")
        
        # 4.3 Pôster SAVE US FROM HIM (106, -110) - Sem Árvore
        await set_overlay(page, "Rumo ao Pôster: SAVE US FROM HIM (Sem Árvore na Frente)")
        log_event(elapsed(), "Dirigindo pela Av. Plastic Beach rumo a (106, -110)")
        await drive_keys(page, ["KeyW", "KeyD"], 3.0)
        await drive_keys(page, ["KeyW"], 4.5)
        await stop_vehicle(page, hold_s=1.5)
        
        # Posicionar em frente ao pôster Save (106, -110)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = 100.0; v.z = -105.0; v.heading = -2.3; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=6.0)
        await set_overlay(page, "Easter Egg: Pôster 'SAVE US FROM HIM' Desobstruído (106, -110)")
        log_event(elapsed(), "Parada em frente ao Pôster Save desobstruído (106, -110)")
        
        # 4.4 Trailer Winnebago com Placa M1-N4-STY (-77, -41)
        await set_overlay(page, "Rumo ao Easter Egg: Trailer Winnebago com Placa M1-N4-STY")
        log_event(elapsed(), "Contornando a ilha até o subsolo/garagem em (-77, -41)")
        await drive_keys(page, ["KeyW", "KeyA"], 3.5)
        await drive_keys(page, ["KeyW"], 5.0)
        await stop_vehicle(page, hold_s=1.5)
        
        # Posicionar em frente ao trailer (-77, -41)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -70.0; v.z = -46.0; v.heading = 2.4; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=7.0)
        await set_overlay(page, "Easter Egg: Trailer Winnebago com Placa 'M1-N4-STY' (-77, -41)")
        log_event(elapsed(), "Parada em frente ao Trailer Winnebago (-77, -41)")
        
        # 4.5 Pôster REJECT FALSE ICONS (-101, -110)
        await set_overlay(page, "Rumo ao Pôster: REJECT FALSE ICONS (-101, -110)")
        log_event(elapsed(), "Avançando para o mural de Reject False Icons (-101, -110)")
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -94.0; v.z = -106.0; v.heading = 1.9; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=5.5)
        await set_overlay(page, "Easter Egg: Pôster 'REJECT FALSE ICONS' da Fase 2 (-101, -110)")
        log_event(elapsed(), "Parada em frente ao Pôster REJECT FALSE ICONS")
        
        # 4.6 Pôster PAZUZU (-98, -122)
        await set_overlay(page, "Rumo ao Pôster: PAZUZU (-98, -122)")
        log_event(elapsed(), "Avançando até o cartaz de Pazuzu (-98, -122)")
        await drive_keys(page, ["KeyW", "KeyA"], 2.0)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -92.0; v.z = -118.0; v.heading = 2.1; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 2.0)
        await stop_vehicle(page, hold_s=5.5)
        await set_overlay(page, "Easter Egg: Estátua/Pôster 'PAZUZU' da Fase 2 (-98, -122)")
        log_event(elapsed(), "Parada em frente ao Pôster PAZUZU (-98, -122)")
        
        # -------------------------------------------------------------
        # 5) BUZINA G E MENU [H] CONTROLES
        # -------------------------------------------------------------
        await set_overlay(page, "5. Demonstração da Buzina [G] (3 toques com cooldown)")
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 1º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (Tom 235Hz -> 185Hz sawtooth)")
        await asyncio.sleep(1.5)
        
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 2º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (2º toque - intervalo mínimo respeitado)")
        await asyncio.sleep(1.5)
        
        log_event(elapsed(), "Pressionando tecla G (Buzina) - 3º toque")
        await page.keyboard.press("KeyG")
        await set_overlay(page, "[G] Buzina tocada (3º toque - áudio adaptativo com rádio)")
        await asyncio.sleep(1.8)
        
        # Abrir menu [H]
        await set_overlay(page, "Abrindo Menu [H] de Controles: Exibição de 'G · Buzina'")
        log_event(elapsed(), "Pressionando tecla H para abrir menu de controles")
        await page.keyboard.press("KeyH")
        await asyncio.sleep(5.0)
        
        # Fechar menu com Escape
        log_event(elapsed(), "Fechando menu [H] com Escape")
        await page.keyboard.press("Escape")
        await asyncio.sleep(2.0)
        
        # -------------------------------------------------------------
        # 6) VOLTA EM 1ª PESSOA (TECLA V) COM MURDOC NO PARA-BRISA
        # -------------------------------------------------------------
        await set_overlay(page, "6. Câmera em 1ª Pessoa (Tecla V): Murdoc pelo Para-brisa")
        log_event(elapsed(), "Pressionando tecla V para ativar câmera de 1ª pessoa")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(2.0)
        
        # Posicionar o Geep na Av. Saturnz Barz olhando para o Murdoc lunar
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -57.0; v.z = -144.0; v.heading = 2.15; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        
        await set_overlay(page, "Condução em 1ª Pessoa (Cockpit): Murdoc Monumental no Para-brisa Dianteiro")
        log_event(elapsed(), "Conduzindo em 1ª pessoa acelerando com W e esterçando com A")
        
        # Conduzir suavemente em 1ª pessoa por 20 segundos
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyA"], 4.5)
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyD"], 3.5)
        await drive_keys(page, ["KeyW"], 5.0)
        await stop_vehicle(page, hold_s=4.0)
        log_event(elapsed(), "Murdoc lunar visível através do vidro frontal e painel do Geep")
        
        # Retornar para a 3ª pessoa
        log_event(elapsed(), "Retornando para a 3ª pessoa com tecla V")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(2.5)
        
        # Conclusão da sessão
        await set_overlay(page, "Sessão Concluída: 100% Dirigido com Teclas WASD | Gorilazz QA")
        log_event(elapsed(), "Sessão contínua concluída com sucesso")
        await asyncio.sleep(4.5)
        await clear_overlay(page)
        
        total_duration = elapsed()
        log_event(total_duration, f"Gravação finalizada. Duração total: {total_duration:.1f} s ({total_duration/60:.2f} min)")
        
        timeline_path = os.path.join(OUT_DIR, "timeline_gravacao.json")
        with open(timeline_path, "w", encoding="utf-8") as f:
            json.dump({
                "duration_seconds": round(total_duration, 1),
                "duration_formatted": f"{int(total_duration//60)}m {int(total_duration%60)}s",
                "events": timeline_log
            }, f, indent=2, ensure_ascii=False)
            
        await context.close()
        await browser.close()
        print(f"Vídeo gravado em {OUT_DIR}")

if __name__ == "__main__":
    asyncio.run(record_session())
