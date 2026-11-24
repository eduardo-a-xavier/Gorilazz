import asyncio
import os
from playwright.async_api import async_playwright

OUT_DIR = r"E:\Gorilazz-Relatorio\docs\gestao\evidencias\correcao-qa-2026-11-24"

async def test_horn_sound():
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

        # Assumir o volante
        await page.keyboard.press('KeyW')
        await page.wait_for_timeout(500)

        # Focar no mundo
        await page.click('#world')
        await page.wait_for_timeout(300)

        # Injetar interceptor de WebAudio para capturar chamadas exatas de playHorn
        horn_data = await page.evaluate('''async () => {
            const events = [];
            
            // Interceptar criação de Oscillator e Gain no AudioContext existente ou novo
            const OrigAudioContext = window.AudioContext || window.webkitAudioContext;
            const instrumentContext = (ctx) => {
                if (ctx.__instrumented) return;
                ctx.__instrumented = true;
                const origCreateOsc = ctx.createOscillator;
                ctx.createOscillator = function() {
                    const osc = origCreateOsc.apply(this, arguments);
                    const origSetVal = osc.frequency.setValueAtTime;
                    const origExpRamp = osc.frequency.exponentialRampToValueAtTime;
                    osc.frequency.setValueAtTime = function(val, t) {
                        events.push({ type: 'freq_set', val, t });
                        return origSetVal.apply(this, arguments);
                    };
                    osc.frequency.exponentialRampToValueAtTime = function(val, t) {
                        events.push({ type: 'freq_ramp', val, t });
                        return origExpRamp.apply(this, arguments);
                    };
                    const origStart = osc.start;
                    osc.start = function(t) {
                        events.push({ type: 'osc_start', t, oscType: osc.type });
                        return origStart.apply(this, arguments);
                    };
                    return osc;
                };
            };

            // Instrumentar instâncias
            window.AudioContext = class extends OrigAudioContext {
                constructor() {
                    super();
                    instrumentContext(this);
                }
            };
            // Também instrumentar qualquer instância já ativa
            return { ready: true };
        }''')

        # Teste 1: Pressionar tecla 'g' via Playwright keyboard
        print("Pressionando tecla 'g'...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(200)

        # Teste 2: Cooldown imediato (<800ms)
        print("Pressionando tecla 'g' imediatamente (<800ms)...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(200)

        # Teste 3: Aguardar 850ms e pressionar de novo
        print("Aguardando 850ms...")
        await page.wait_for_timeout(850)
        print("Pressionando tecla 'g' após 850ms...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(200)

        # Teste 4: Abrir menu [H] e tentar tocar
        print("Abrindo menu [H]...")
        await page.keyboard.press('KeyH')
        await page.wait_for_timeout(600)
        print("Tentando tocar com menu [H] aberto...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(200)

        # Fechar menu com Escape
        print("Fechando menu [H] com Escape...")
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(600)

        # Teste 5: Abrir mapa M e tentar tocar
        print("Abrindo mapa [M]...")
        await page.keyboard.press('KeyM')
        await page.wait_for_timeout(600)
        print("Tentando tocar com mapa [M] aberto...")
        await page.keyboard.press('g')
        await page.wait_for_timeout(200)

        # Fechar mapa com Escape
        print("Fechando mapa com Escape...")
        await page.keyboard.press('Escape')
        await page.wait_for_timeout(600)

        # Coletar estatísticas de áudio e estado do jogo
        results = await page.evaluate('''() => {
            // Verificar no estado interno do app.js
            const menu = document.querySelector('#journey');
            const map = document.querySelector('#full-map-overlay');
            const hornText = [...menu.querySelectorAll('p')].find(p => p.textContent.includes('Buzina'))?.textContent;
            return {
                menuHidden: menu.hidden,
                mapHidden: map.hidden,
                hornLabel: hornText
            };
        }''')
        print("Resultados de estado da buzina:", results)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(test_horn_sound())
