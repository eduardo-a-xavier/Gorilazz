import asyncio
import json
import os
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"

async def test_tour():
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
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        await page.goto("http://localhost:3000/?perf", wait_until="networkidle")
        await page.wait_for_timeout(1500)
        await page.click("#enter-world")
        await page.wait_for_timeout(800)
        await page.click("#onboarding-start")
        await page.wait_for_timeout(800)
        
        # Pressionar #guided-toggle para iniciar do ponto de partida oficial
        await page.click("#guided-toggle")
        
        tour_res = await page.evaluate("""() => {
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
                    if (performance.now() - start > 10000) {
                        clearInterval(timer);
                        resolve({ samples, offTrack, collisions, surface: v.surface, speed: v.speed });
                    }
                }, 100);
            });
        }""")
        print(f"Passeio Guiado limpo: {tour_res}")
        
        # Atualizar qa-revalidacao-20m-telemetria.json
        json_path = os.path.join(OUT_DIR, "qa-revalidacao-20m-telemetria.json")
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["tour_telemetry"] = tour_res
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_tour())
