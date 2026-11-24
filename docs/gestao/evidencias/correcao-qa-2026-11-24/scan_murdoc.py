import asyncio
import math
import json
from playwright.async_api import async_playwright

async def scan():
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
        await page.evaluate('''() => {
            const btn = document.querySelector('#entry-tour');
            if (btn) btn.click();
            const dlg = document.querySelector('#onboarding-dialog');
            if (dlg) dlg.close();
        }''')
        await page.wait_for_function('''() => {
            const status = document.querySelector('#band-status');
            return status && status.dataset.loaded === 'true';
        }''', timeout=20000)

        spots = [
            {'road': 'Saturnz Barz', 'x': -75, 'z': -125},
            {'road': 'Saturnz Barz', 'x': -65, 'z': -135},
            {'road': 'Saturnz Barz', 'x': -50, 'z': -145},
            {'road': 'Saturnz Barz', 'x': -30, 'z': -152},
            {'road': 'Humanz', 'x': -83, 'z': -105},
            {'road': 'Humanz', 'x': -80, 'z': -90},
            {'road': 'Humanz', 'x': -75, 'z': -75},
            {'road': 'Humanz', 'x': -73, 'z': -62},
            {'road': 'Clint Eastwood', 'x': -65, 'z': -60},
            {'road': 'Clint Eastwood', 'x': -45, 'z': -55},
            {'road': 'Clint Eastwood', 'x': -25, 'z': -53},
            {'road': 'Song Machine', 'x': -75, 'z': -108},
            {'road': 'Song Machine', 'x': -55, 'z': -104},
            {'road': 'Song Machine', 'x': -35, 'z': -100},
            {'road': 'Kong Studios', 'x': 0, 'z': -40},
            {'road': 'Kong Studios', 'x': -2, 'z': -20},
        ]

        results = []
        for s in spots:
            dx = -165 - s['x']
            dz = -140 - s['z']
            h = math.atan2(-dx, -dz)
            
            # Posicionar veículo e esperar alguns frames para a câmera de 3ª pessoa atualizar
            await page.evaluate(f'''() => {{
                const v = window.__gorilazz.vehicle;
                v.x = {s['x']};
                v.z = {s['z']};
                v.heading = {h};
                v.speed = 0;
                window.__gorilazz.world.clearPose();
            }}''')
            await page.wait_for_timeout(400)
            
            res = await page.evaluate('''() => {
                const camera = window.__gorilazz.world.debug.camera;
                const headPos = new camera.position.constructor(-165, 36, -140);
                const chestPos = new camera.position.constructor(-165, 24, -140);
                
                const projHead = headPos.clone().project(camera);
                const projChest = chestPos.clone().project(camera);
                
                const inFrustum = (projHead.x >= -1.0 && projHead.x <= 1.0 && projHead.y >= -1.0 && projHead.y <= 1.0 && projHead.z >= 0 && projHead.z <= 1) ||
                                  (projChest.x >= -1.0 && projChest.x <= 1.0 && projChest.y >= -1.0 && projChest.y <= 1.0 && projChest.z >= 0 && projChest.z <= 1);
                
                const camDist = camera.position.distanceTo(headPos);
                return {
                    inFrustum,
                    projHead: { x: +projHead.x.toFixed(2), y: +projHead.y.toFixed(2), z: +projHead.z.toFixed(2) },
                    camDist: +camDist.toFixed(1),
                    camPos: { x: +camera.position.x.toFixed(1), y: +camera.position.y.toFixed(1), z: +camera.position.z.toFixed(1) },
                    camRot: { x: +camera.rotation.x.toFixed(2), y: +camera.rotation.y.toFixed(2) }
                };
            }''')
            
            res['road'] = s['road']
            res['x'] = s['x']
            res['z'] = s['z']
            results.append(res)
            print(f"{s['road']} ({s['x']}, {s['z']}): inFrustum={res['inFrustum']}, proj={res['projHead']}, dist={res['camDist']}m")

        with open(r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24\scan_results.json", "w") as f:
            json.dump(results, f, indent=2)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(scan())
