import asyncio
import time
import json
from playwright.async_api import async_playwright

async def run_tour_check():
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
        await page.click('#enter-world')
        await page.wait_for_timeout(800)
        await page.click('#onboarding-start')
        await page.wait_for_timeout(800)

        # Iniciar o passeio guiado clicando em #guided-toggle
        print("Iniciando o Passeio Guiado clicando em #guided-toggle...")
        await page.click('#guided-toggle')
        
        # Monitorar telemetria durante a rota
        telemetry = await page.evaluate('''async () => {
            const v = window.__gorilazz.vehicle;
            const p = window.__gorilazz.stopProgress;
            
            let offTrack = 0;
            let collisions = 0;
            let samples = 0;
            const stopsVisited = [];
            
            const start = performance.now();
            // Acompanhar o percurso por até 60 segundos
            while (performance.now() - start < 60000) {
                samples++;
                if (v.surface !== 'asfalto') {
                    offTrack++;
                }
                if (v.blocked) {
                    collisions++;
                }
                if (p && p.count > stopsVisited.length) {
                    stopsVisited.push({ count: p.count, time: Math.round((performance.now() - start) / 1000) });
                }
                if (p && p.complete) {
                    break;
                }
                await new Promise(r => setTimeout(r, 100));
            }

            return {
                samples,
                offTrack,
                collisions,
                stopsVisited,
                totalStops: p ? p.count : 0,
                complete: p ? p.complete : false
            };
        }''')
        
        print("Resultado do Passeio Guiado:", json.dumps(telemetry, indent=2))
        
        with open(r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24\tour_telemetria.json", "w") as f:
            json.dump(telemetry, f, indent=2)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(run_tour_check())
