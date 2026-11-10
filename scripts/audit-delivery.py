"""Targeted delivery checks; run against npm run dev with Python Playwright."""
from pathlib import Path
from playwright.sync_api import sync_playwright

output = Path('artifacts/delivery')
output.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for width, height in [(1440, 1000), (390, 844), (320, 640)]:
        page = browser.new_page(viewport={'width': width, 'height': height},
                                has_touch=width < 700, reduced_motion='reduce')
        page.route('**/src/scene.js', lambda route: route.abort())
        page.goto('http://localhost:3000')
        page.wait_for_load_state('networkidle')
        page.locator('#enter-world').click()
        assert page.locator('#hud-navigation').is_hidden()
        assert page.locator('#journey-action').is_visible()
        assert page.locator('#journey-status').is_visible()
        assert page.locator('#drive-hud').get_attribute('role') == 'group'
        if width < 700:
            assert page.locator('[data-drive=throttle]').is_visible()
        page.locator('#hud-radio-toggle').click()
        page.locator('.radio-import').focus()
        # Sem esta pausa o Enter chega cedo demais e o seletor não abre no Chromium headless;
        # com clique, Enter ou Espaço após a pausa ele abre. A causa da corrida não foi isolada.
        page.wait_for_timeout(200)
        with page.expect_file_chooser() as chooser:
            page.keyboard.press('Enter')
        chooser.value.set_files([])
        page.keyboard.press('Escape')
        page.locator('#hud-nav').click()
        page.locator('#route-toggle').click()
        page.screenshot(path=str(output / f'audit-{width}-menu.png'))
        page.keyboard.press('Escape')
        assert page.locator('#hud-navigation').is_hidden()
        assert page.locator('#hud-nav').evaluate('(e) => e === document.activeElement')
        page.locator('#eras').scroll_into_view_if_needed()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert page.locator('.era-introduction').evaluate('(e) => parseFloat(getComputedStyle(e).fontSize)') >= 15
        page.screenshot(path=str(output / f'audit-{width}-reading.png'))
        print(f'{width}: visible next action, keyboard upload, focus, touch controls and reading OK', flush=True)
        page.close()
    browser.close()
