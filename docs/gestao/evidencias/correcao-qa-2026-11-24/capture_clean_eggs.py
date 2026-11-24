import asyncio
import os
import math
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"

async def capture_clean_eggs():
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

        # Entrar no 3D
        await page.click('#enter-world')
        await page.wait_for_timeout(800)
        await page.click('#onboarding-start')
        await page.wait_for_timeout(800)

        # Aguardar banda Phase 7
        await page.wait_for_function('''() => {
            const status = document.querySelector('#band-status');
            return status && status.dataset.loaded === 'true';
        }''', timeout=20000)

        # Assumir o volante
        await page.keyboard.press('KeyW')
        await page.wait_for_timeout(500)

        # 1. Alce
        print("Enquadrando Alce...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            world.frameSpot({ x: 58, z: -38, dirX: 0.7, dirZ: 0.7, distance: 7.5, height: 2.3, target: 2.0 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-alce.png"))

        # 2. Trailer Winnebago (olhando a lateral com placa e luzes)
        print("Enquadrando Trailer Winnebago...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            world.frameSpot({ x: -77, z: -41, dirX: 0.35, dirZ: 0.93, distance: 9.0, height: 2.2, target: 1.8 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-trailer.png"))

        # 3. Reject False Icons
        print("Enquadrando Reject False Icons...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            const obj = world.debug.scene.getObjectByName('easter-reject');
            const rotY = obj.rotation.y;
            const nx = Math.sin(rotY), nz = Math.cos(rotY);
            world.frameSpot({ x: -101, z: -110, dirX: nx, dirZ: nz, distance: 5.0, height: 1.8, target: 1.8 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-reject.png"))

        # 4. Save Us From Him
        print("Enquadrando Save Us From Him...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            const obj = world.debug.scene.getObjectByName('easter-save');
            const rotY = obj.rotation.y;
            const nx = Math.sin(rotY), nz = Math.cos(rotY);
            // Pequeno ângulo para desviar de qualquer tronco
            world.frameSpot({ x: 106, z: -110, dirX: nx * 0.9 + 0.3, dirZ: nz * 0.9 - 0.2, distance: 4.8, height: 1.8, target: 1.8 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-save.png"))

        # 5. Pazuzu
        print("Enquadrando Pazuzu...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            const obj = world.debug.scene.getObjectByName('easter-pazuzu');
            const rotY = obj.rotation.y;
            const nx = Math.sin(rotY), nz = Math.cos(rotY);
            world.frameSpot({ x: -98, z: -122, dirX: nx, dirZ: nz, distance: 5.0, height: 1.8, target: 1.8 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-pazuzu.png"))

        # 6. Aviso Zumbis do Kong Studios
        print("Enquadrando Aviso Zumbis do Kong Studios...")
        await page.evaluate('''() => {
            const world = window.__gorilazz.world;
            const obj = world.debug.scene.getObjectByName('easter-zombies');
            const rotY = obj.rotation.y;
            const nx = Math.sin(rotY), nz = Math.cos(rotY);
            world.frameSpot({ x: -5, z: -85, dirX: nx, dirZ: nz, distance: 5.0, height: 1.8, target: 1.8 });
        }''')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT_DIR, "02-easter-egg-zumbis.png"))

        # 7. Menu [H] aberto exibindo rótulo da Buzina
        print("Enquadrando menu [H]...")
        await page.evaluate('() => window.__gorilazz.world.clearPose()')
        await page.keyboard.press('KeyH')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(OUT_DIR, "03-menu-h-buzina.png"))

        print("Capturas concluídas com sucesso!")
        await browser.close()

if __name__ == '__main__':
    asyncio.run(capture_clean_eggs())
