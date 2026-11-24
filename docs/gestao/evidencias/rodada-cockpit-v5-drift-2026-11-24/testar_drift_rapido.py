import asyncio
import json
import time
import os
import subprocess
import urllib.request
from playwright.async_api import async_playwright

PORT = 3000
CWD = r"E:\Gorilazz-Relatorio"

def ensure_server(port, cwd):
    subprocess.run(["cmd.exe", "/c", "taskkill /F /IM node.exe >nul 2>&1"], check=False)
    time.sleep(1)
    print(f"Iniciando server.mjs na porta {port}...")
    proc = subprocess.Popen(
        ["node", "server.mjs"],
        cwd=cwd,
        env={**os.environ, "PORT": str(port)}
    )
    for _ in range(15):
        time.sleep(0.5)
        try:
            with urllib.request.urlopen(f"http://localhost:{port}/", timeout=1) as r:
                if r.status == 200:
                    print(f"Servidor na porta {port} pronto.")
                    return proc
        except Exception:
            pass
    return proc

async def main():
    server_proc = ensure_server(PORT, CWD)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=False)
            page = await browser.new_page(viewport={"width": 1440, "height": 900})
            await page.goto("http://localhost:3000/?perf")
            await asyncio.sleep(2.0)
            
            btn = page.locator("#enter-world")
            if await btn.is_visible():
                await btn.click()
                await asyncio.sleep(1.0)
                
            await page.evaluate("""() => {
                const opt = document.querySelector('#onboarding-optout');
                if (opt) opt.checked = true;
                const btn = document.querySelector('#onboarding-start');
                if (btn) btn.click();
                window.__gorilazz?.takeOver?.();
                document.querySelector('#recover-car')?.click();
                document.querySelector('#world canvas')?.focus();
            }""")
            await asyncio.sleep(1.0)
            
            print("Acelerando na reta livre...")
            await page.keyboard.down("KeyW")
            await asyncio.sleep(2.5)
            
            print("Entrando na curva com KeyD e acionando Espaço...")
            await page.keyboard.down("KeyD")
            await asyncio.sleep(0.3)
            await page.keyboard.down("Space")
            
            samples = []
            for i in range(12):
                await asyncio.sleep(0.15)
                res = await page.evaluate("""() => {
                    const v = window.__gorilazz?.vehicle;
                    return {
                        speed: Number((v?.speed || 0).toFixed(2)),
                        steering: Number((v?.steering || 0).toFixed(4)),
                        drifting: Boolean(v?.drifting),
                        slip: Number((v?.slip || 0).toFixed(4)),
                        surface: v?.surface || '',
                        blocked: Boolean(v?.blocked)
                    };
                }""")
                samples.append(res)
                print(f"[{i}] {res}")
                
            await page.keyboard.up("Space")
            await page.keyboard.up("KeyD")
            await page.keyboard.up("KeyW")
            
            await page.screenshot(path=r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\rodada-cockpit-v5-drift-2026-11-24\1440x900-drift-ativo.png")
            await browser.close()
            
            any_drift = any(s["drifting"] for s in samples)
            max_slip = max(abs(s["slip"]) for s in samples)
            print(f"\nDrift atingido: {any_drift}, Slip máximo: {max_slip}")
            return {"samples": samples, "any_drift": any_drift, "max_slip": max_slip}
    finally:
        if server_proc:
            try:
                server_proc.terminate()
            except Exception:
                pass

if __name__ == "__main__":
    asyncio.run(main())
