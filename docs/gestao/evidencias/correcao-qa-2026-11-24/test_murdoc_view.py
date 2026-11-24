import asyncio
import math
import os
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"

async def test_takeover_and_view():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            channel='chrome',
            headless=False,
            args=[
                '--enable-webgl',
                '--ignore-gpu-blocklist',
                '--use-gl=angle',
                '--use-angle=d3d11',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding',
            ]
        )
        page = await browser.new_page(viewport={'width': 1440, 'height': 900})
        await page.goto('http://localhost:3000/?perf')
        await page.wait_for_timeout(2000)

        # Clicar em "Quero dirigir"
        await page.click('#enter-world')
        await page.wait_for_timeout(800)

        # Clicar em "Começar a dirigir" no onboarding
        await page.click('#onboarding-start')
        await page.wait_for_timeout(800)

        # Aguardar banda Phase 7
        await page.wait_for_function('''() => {
            const status = document.querySelector('#band-status');
            return status && status.dataset.loaded === 'true';
        }''', timeout=20000)

        # Chamar takeOver() para assumir a direção (showcase = false)
        print("Assumindo a direção com window.__gorilazz.takeOver()...")
        await page.evaluate('''() => {
            window.__gorilazz.takeOver();
        }''')
        await page.wait_for_timeout(500)

        # Posições de avenidas para olhar Murdoc Colossal (-165, 0, -140)
        # Avenida 1: Av. Saturnz Barz (-65, -135)
        # Avenida 2: Av. Clint Eastwood (-60, -58)
        # Avenida 3: Rua Song Machine (-75, -108)
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
                "x": -60.0,
                "z": -58.0,
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

        for av in avenidas:
            dx = -165.0 - av["x"]
            dz = -140.0 - av["z"]
            h = math.atan2(-dx, -dz)
            print(f"Posicionando carro na {av['nome']} ({av['x']}, {av['z']}) com heading {h:.2f}...")

            await page.evaluate(f'''() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {av['x']};
                v.z = {av['z']};
                v.heading = {h};
                v.speed = 0;
                v.steering = 0;
                window.__gorilazz.world.clearPose();
            }}''')

            # Aguardar frames para a câmera atualizar no loop principal
            await page.wait_for_timeout(2000)

            shot_path = os.path.join(OUT_DIR, av["file"])
            await page.screenshot(path=shot_path)
            print(f"  -> Print capturado: {shot_path}")

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_takeover_and_view())
