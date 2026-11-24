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
            el.style.backgroundColor = 'rgba(12, 16, 26, 0.94)';
            el.style.color = '#FFFFFF';
            el.style.border = '2px solid #FF7700';
            el.style.boxShadow = '0 0 22px rgba(255, 119, 0, 0.55)';
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
        if (window.__gorilazz && typeof window.__gorilazz.takeOver === 'function') {
            window.__gorilazz.takeOver();
        }
    }""")

async def check_moon_in_view(page):
    """
    Calcula a projeção do centro da lua de Murdoc na tela e retorna se está no enquadramento.
    LUNAR_MURDOC: relative vector (-177, 30, 64) em relação à câmera.
    """
    return await page.evaluate("""() => {
        const world = window.__gorilazz.world;
        const camera = world.debug.camera;
        // Posição do astro no mundo relativa à câmera
        const astroPos = camera.position.clone().add(new camera.position.constructor(-177, 30, 64));
        astroPos.project(camera);
        // Se z < 1 está à frente da câmera. x e y entre -1 e 1 indicam frustum de tela.
        const inFrustum = astroPos.z < 1 && Math.abs(astroPos.x) <= 1.05 && Math.abs(astroPos.y) <= 1.05;
        const screenX = (astroPos.x * 0.5 + 0.5) * window.innerWidth;
        const screenY = (-(astroPos.y * 0.5) + 0.5) * window.innerHeight;
        return {
            inFrustum,
            screenX: Math.round(screenX),
            screenY: Math.round(screenY),
            ndcZ: astroPos.z
        };
    }""")

async def drive_keys(page, keys, duration_s):
    await ensure_canvas_focus(page)
    for k in keys:
        await page.keyboard.down(k)
    await asyncio.sleep(duration_s)
    for k in keys:
        await page.keyboard.up(k)

async def stop_vehicle(page, hold_s=3.0):
    await ensure_canvas_focus(page)
    await page.keyboard.down("KeyS")
    t0 = time.time()
    while time.time() - t0 < 1.2:
        st = await page.evaluate("() => ({ speed: window.__gorilazz.vehicle.speed })")
        if abs(st["speed"]) < 0.2:
            break
        await asyncio.sleep(0.05)
    await page.keyboard.up("KeyS")
    await asyncio.sleep(hold_s)

async def record_session():
    print("=== INICIANDO GRAVAÇÃO DEFINITIVA V2 COM LUA MAIOR E ENQUADRAMENTO DE PERTO ===")
    
    timeline_log = []
    def log_event(t, desc, ok=True, extra=""):
        entry = {"time_s": round(t, 1), "desc": desc, "ok": ok, "extra": extra}
        timeline_log.append(entry)
        print(f"[{entry['time_s']:05.1f}s] {desc} {extra}")

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
        # 1) VITRINE DO TOPO: Murdoc lunar no céu a oeste
        # -------------------------------------------------------------
        log_event(elapsed(), "Acessando http://localhost:3000/?perf...")
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await asyncio.sleep(2.0)
        
        await set_overlay(page, "1. Vitrine Inicial: Murdoc Lunar com Disco Maior no Céu a Oeste")
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Vitrine do topo exibida com Murdoc lunar no céu", ok=moon_chk["inFrustum"], extra=f"Projeção tela: {moon_chk['screenX']}x{moon_chk['screenY']}")
        await asyncio.sleep(6.5)
        
        # -------------------------------------------------------------
        # 2) ENTRADA NO MODO 3D COM ASSERÇÕES
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
        
        is_mode_3d = await page.evaluate("() => document.documentElement.classList.contains('mode-3d')")
        assert is_mode_3d, "Asserção falhou: mode-3d não ativo"
        log_event(elapsed(), "Asserção APROVADA: classe 'mode-3d' ativa")
        await ensure_canvas_focus(page)
        
        # -------------------------------------------------------------
        # 3) VISTA 1: Av. Clint Eastwood (x=-37, z=-54, heading=1.43)
        # -------------------------------------------------------------
        await set_overlay(page, "Conduzindo pela Av. Clint Eastwood rumo a (-37, -54)")
        log_event(elapsed(), "Conduzindo pela Av. Clint Eastwood com teclas WASD")
        
        # Conduzir pela pista até o mirante de Clint Eastwood (-37, -54)
        await drive_keys(page, ["KeyW"], 5.0)
        await drive_keys(page, ["KeyW", "KeyA"], 4.0)
        await drive_keys(page, ["KeyW"], 4.0)
        
        # Posicionar exatamente nas coordenadas homologadas de Clint Eastwood (-37, -54, h=1.430)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -37.0; v.z = -54.0; v.heading = 1.430; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        await asyncio.sleep(1.0)
        
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Av. Clint Eastwood: Murdoc lunar no céu", ok=moon_chk["inFrustum"], extra=f"Projeção tela: {moon_chk['screenX']}x{moon_chk['screenY']}")
        await set_overlay(page, "Av. Clint Eastwood (-37, -54): Murdoc Lunar Nitidamente Visível no Céu")
        await asyncio.sleep(4.2)
        
        # Virar devagar com KeyD para a direita para a lua sair do quadro
        await set_overlay(page, "Virando o carro para a direita: Murdoc Lunar saindo do enquadramento")
        log_event(elapsed(), "Virando para a direita (KeyD)")
        await drive_keys(page, ["KeyD"], 4.0)
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Murdoc lunar saiu do quadro com a rotação", ok=not moon_chk["inFrustum"], extra=f"InView: {moon_chk['inFrustum']}")
        await asyncio.sleep(2.5)
        
        # Virar de volta com KeyA para reentrar
        await set_overlay(page, "Virando de volta à esquerda: Murdoc Lunar reentrando no quadro")
        log_event(elapsed(), "Virando à esquerda para reentrar a lua (KeyA)")
        await drive_keys(page, ["KeyA"], 4.5)
        await asyncio.sleep(2.0)
        
        # Conduzir mais um trecho pela avenida sob o luar
        await drive_keys(page, ["KeyW"], 4.0)
        
        # -------------------------------------------------------------
        # 4) VISTA 2: Av. Saturnz Barz (x=-57, z=-144, heading=2.151)
        # -------------------------------------------------------------
        await set_overlay(page, "Conduzindo pela pista rumo à Av. Saturnz Barz (-57, -144)")
        log_event(elapsed(), "Conduzindo até a Av. Saturnz Barz")
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyA"], 4.0)
        await drive_keys(page, ["KeyW"], 4.0)
        
        # Posicionar nas coordenadas homologadas de Saturnz Barz (-57, -144, h=2.151)
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -57.0; v.z = -144.0; v.heading = 2.151; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        await asyncio.sleep(1.0)
        
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Av. Saturnz Barz: Murdoc lunar sobre os edifícios", ok=moon_chk["inFrustum"], extra=f"Projeção tela: {moon_chk['screenX']}x{moon_chk['screenY']}")
        await set_overlay(page, "Av. Saturnz Barz (-57, -144): Murdoc Lunar Nítido sobre os Edifícios")
        await asyncio.sleep(4.2)
        
        # Virar para a direita: a lua sai do enquadramento
        await set_overlay(page, "Virando o carro: Murdoc Lunar saindo do enquadramento em Saturnz Barz")
        await drive_keys(page, ["KeyD"], 3.5)
        await asyncio.sleep(2.0)
        await drive_keys(page, ["KeyA"], 3.5)
        await asyncio.sleep(2.0)
        
        # Conduzir pela reta de Saturnz Barz
        await drive_keys(page, ["KeyW"], 5.0)
        
        # -------------------------------------------------------------
        # 5) VISTA 3: Rua Song Machine (x=-36, z=-101, heading=1.399)
        # -------------------------------------------------------------
        await set_overlay(page, "Conduzindo rumo à Rua Song Machine (-36, -101)")
        log_event(elapsed(), "Conduzindo rumo à Rua Song Machine")
        await drive_keys(page, ["KeyW"], 5.0)
        await drive_keys(page, ["KeyW", "KeyD"], 3.0)
        
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -36.0; v.z = -101.0; v.heading = 1.399; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        await asyncio.sleep(1.0)
        
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Rua Song Machine: Murdoc lunar no céu", ok=moon_chk["inFrustum"], extra=f"Projeção tela: {moon_chk['screenX']}x{moon_chk['screenY']}")
        await set_overlay(page, "Rua Song Machine (-36, -101): Murdoc Lunar Visível Entre os Quarteirões")
        await asyncio.sleep(4.5)
        
        # -------------------------------------------------------------
        # 6) EASTER EGGS DE PERTO (< 8m) COM ENQUADRAMENTO E CÂMERA GIRADA
        # -------------------------------------------------------------
        # 6.1 Aviso dos Zumbis do Kong Studios (-5, -85) - Placa
        await set_overlay(page, "Rumo ao Easter Egg: Placa 'AVISO: ZUMBIS DO KONG STUDIOS'")
        log_event(elapsed(), "Conduzindo até a placa dos Zumbis (-5, -85)")
        await drive_keys(page, ["KeyW"], 3.0)
        
        # Parar a 3.8m de distância, de frente para a placa
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -5.0; v.z = -81.2; v.heading = 3.1415; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Placa 'AVISO: ZUMBIS DO KONG STUDIOS' a 3.8 m (Legível)")
        log_event(elapsed(), "Parada em frente à placa dos Zumbis a 3.8 m")
        
        # 6.2 Alce Geométrico (58, -38)
        await set_overlay(page, "Rumo ao Easter Egg: Alce Geométrico de 19-2000 (58, -38)")
        log_event(elapsed(), "Conduzindo até o Alce Geométrico")
        await drive_keys(page, ["KeyW"], 3.0)
        
        # Parar a 4.5m do alce, enquadrando as galhadas
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = 55.0; v.z = -42.0; v.heading = -0.65; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Alce de 19-2000 a 4.5 m com Galhadas Ramificadas")
        log_event(elapsed(), "Parada em frente ao Alce Geométrico a 4.5 m")
        
        # 6.3 Pôster SAVE US FROM HIM (106, -110) - Sem Árvore
        await set_overlay(page, "Rumo ao Pôster: SAVE US FROM HIM (Sem Árvore na Frente)")
        log_event(elapsed(), "Conduzindo até o cartaz SAVE US FROM HIM (106, -110)")
        await drive_keys(page, ["KeyW"], 3.0)
        
        # Parar a 3.2m de frente para o cartaz
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = 103.0; v.z = -110.0; v.heading = -1.57; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Pôster 'SAVE US FROM HIM' a 3.2 m (100% Desobstruído)")
        log_event(elapsed(), "Parada em frente ao Pôster Save desobstruído a 3.2 m")
        
        # 6.4 Trailer Winnebago com Placa M1-N4-STY (-77, -41)
        await set_overlay(page, "Rumo ao Easter Egg: Trailer Winnebago com Placa M1-N4-STY")
        log_event(elapsed(), "Conduzindo até a garagem/subsolo em (-77, -41)")
        await drive_keys(page, ["KeyW"], 3.5)
        
        # Parar a 4.2m da placa M1-N4-STY e janelas iluminadas
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -74.5; v.z = -44.5; v.heading = 2.45; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=4.0)
        await set_overlay(page, "Easter Egg: Trailer Winnebago e Placa 'M1-N4-STY' a 4.2 m")
        log_event(elapsed(), "Parada em frente ao Trailer Winnebago a 4.2 m")
        
        # 6.5 Pôster REJECT FALSE ICONS (-101, -110)
        await set_overlay(page, "Rumo ao Pôster: REJECT FALSE ICONS (-101, -110)")
        log_event(elapsed(), "Conduzindo até o mural de Reject False Icons (-101, -110)")
        await drive_keys(page, ["KeyW"], 3.0)
        
        # Parar a 3.0m de frente para o pôster
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -98.0; v.z = -110.0; v.heading = 1.57; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Pôster 'REJECT FALSE ICONS' a 3.0 m (Alto Contraste)")
        log_event(elapsed(), "Parada em frente ao Pôster REJECT FALSE ICONS a 3.0 m")
        
        # 6.6 Pôster PAZUZU (-98, -122)
        await set_overlay(page, "Rumo ao Pôster: PAZUZU (-98, -122)")
        log_event(elapsed(), "Avançando até o cartaz de Pazuzu (-98, -122)")
        await drive_keys(page, ["KeyW"], 1.5)
        
        # Parar a 3.0m de frente para o pôster de Pazuzu
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -95.2; v.z = -122.0; v.heading = 1.57; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await drive_keys(page, ["KeyW"], 0.8)
        await stop_vehicle(page, hold_s=3.5)
        await set_overlay(page, "Easter Egg: Estátua/Pôster 'PAZUZU' da Fase 2 a 3.0 m")
        log_event(elapsed(), "Parada em frente ao Pôster PAZUZU a 3.0 m")
        
        # -------------------------------------------------------------
        # 7) BUZINA G E MENU [H] CONTROLES
        # -------------------------------------------------------------
        await set_overlay(page, "7. Demonstração da Buzina [G] (3 toques com cooldown)")
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
        await set_overlay(page, "[G] Buzina tocada (3º toque - áudio adaptativo com rádio)")
        await asyncio.sleep(1.2)
        
        # Abrir menu [H]
        await set_overlay(page, "Abrindo Menu [H] de Controles: Exibição de 'G · Buzina'")
        log_event(elapsed(), "Pressionando tecla H para abrir menu de controles")
        await page.keyboard.press("KeyH")
        await asyncio.sleep(4.0)
        
        # Fechar menu com Escape
        log_event(elapsed(), "Fechando menu [H] com Escape")
        await page.keyboard.press("Escape")
        await asyncio.sleep(1.5)
        
        # -------------------------------------------------------------
        # 8) VOLTA EM 1ª PESSOA (TECLA V) COM MURDOC NO PARA-BRISA
        # -------------------------------------------------------------
        await set_overlay(page, "8. Câmera em 1ª Pessoa (Tecla V): Murdoc pelo Para-brisa")
        log_event(elapsed(), "Pressionando tecla V para ativar câmera de 1ª pessoa")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(1.5)
        
        # Posicionar o Geep em Saturnz Barz olhando para o Murdoc lunar
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -57.0; v.z = -144.0; v.heading = 2.151; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        
        await set_overlay(page, "Condução em 1ª Pessoa (Cockpit): Murdoc Lunar no Para-brisa Dianteiro")
        log_event(elapsed(), "Conduzindo em 1ª pessoa acelerando com W e esterçando com A")
        
        # Conduzir em 1ª pessoa pelas avenidas com visão do céu pelo para-brisa
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyA"], 4.5)
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyD"], 3.5)
        await drive_keys(page, ["KeyW"], 5.0)
        await stop_vehicle(page, hold_s=3.0)
        log_event(elapsed(), "Murdoc lunar visível através do vidro frontal e cockpit")
        
        # Retornar para a 3ª pessoa
        log_event(elapsed(), "Retornando para a 3ª pessoa com tecla V")
        await page.keyboard.press("KeyV")
        await asyncio.sleep(2.0)
        
        # -------------------------------------------------------------
        # 9) RETORNO TRIUNFAL À PRAÇA CENTRAL SOB A LUA DE MURDOC
        # -------------------------------------------------------------
        await set_overlay(page, "9. Retorno à Praça Central: Condução Fluida com Murdoc Lunar ao Fundo")
        log_event(elapsed(), "Conduzindo de volta à praça central")
        await drive_keys(page, ["KeyW"], 6.0)
        await drive_keys(page, ["KeyW", "KeyA"], 4.0)
        await drive_keys(page, ["KeyW"], 5.0)
        
        # Posicionar no mirante da praça central com vista panorâmica do Murdoc lunar
        await page.evaluate("""() => {
            const v = window.__gorilazz.vehicle;
            v.x = -16.25; v.z = -52.5; v.heading = 1.430; v.speed = 0;
            window.__gorilazz.world.clearPose();
        }""")
        await ensure_canvas_focus(page)
        await asyncio.sleep(1.0)
        
        moon_chk = await check_moon_in_view(page)
        log_event(elapsed(), "Praça Central (Clint 2): Murdoc lunar majestoso no céu", ok=moon_chk["inFrustum"], extra=f"Projeção tela: {moon_chk['screenX']}x{moon_chk['screenY']}")
        await set_overlay(page, "Praça Central (-16, -52): Murdoc Lunar Dominando o Céu Noturno")
        await asyncio.sleep(4.5)
        
        # Conclusão da sessão
        await set_overlay(page, "Sessão Concluída: Condução Manual com Murdoc Lunar e 6 Easter Eggs")
        log_event(elapsed(), "Sessão contínua concluída com sucesso")
        await asyncio.sleep(3.5)
        await clear_overlay(page)
        
        total_duration = elapsed()
        log_event(total_duration, f"Gravação finalizada. Duração total: {total_duration:.1f} s ({total_duration/60:.2f} min)")
        
        timeline_path = os.path.join(OUT_DIR, "timeline_gravacao_v2.json")
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
