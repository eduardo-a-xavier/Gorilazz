"""Run against npm run dev. Requires Python Playwright and its Chromium browser."""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

url = os.environ.get('TEST_URL', 'http://localhost:3000')
output = Path(os.environ.get('SCREENSHOT_DIR', 'artifacts/browser'))
output.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    for name, width, height in [('desktop', 1440, 1000), ('mobile', 390, 844), ('small', 320, 640), ('fallback', 390, 844)]:
        selected = os.environ.get('TEST_VIEWPORTS', '').split(',')
        if selected != [''] and name not in selected:
            continue
        page = browser.new_page(viewport={'width': width, 'height': height}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        if name == 'fallback':
            page.route('**/src/scene.js', lambda route: route.abort())
        page.goto(url)
        page.wait_for_load_state('networkidle')
        page.screenshot(path=str(output / f'{name}-entry.png'))
        assert page.locator('#jogo').get_attribute('data-entered') == 'false'
        page.keyboard.press('ArrowDown')
        assert page.locator('#jogo').get_attribute('data-entered') == 'false'
        page.locator('#start-guided').click()
        page.wait_for_timeout(250)
        assert page.locator('#jogo').get_attribute('data-touring') == 'true'
        page.screenshot(path=str(output / f'{name}-journey.png'))
        page.locator('#journey-action').click()
        page.locator('#route-toggle').click()
        assert page.locator('#route-list button').count() == 5
        page.screenshot(path=str(output / f'{name}-route.png'))
        page.locator('#route-list button').nth(3).click()
        page.wait_for_timeout(100)
        assert 'Demon Days' in page.locator('#journey-title').inner_text()
        assert page.locator('#jogo').get_attribute('data-touring') == 'true'
        # Explicit manual input must cancel the tour.
        page.locator('[data-drive="throttle"]').focus()
        page.keyboard.down('Space')
        page.wait_for_timeout(100)
        page.keyboard.up('Space')
        assert page.locator('#jogo').get_attribute('data-touring') == 'false'
        page.locator('#eras').scroll_into_view_if_needed()
        page.wait_for_timeout(200)
        page.evaluate('document.activeElement.blur()')
        assert page.locator('#jogo').evaluate('(element) => element.getBoundingClientRect().bottom <= 0')
        before = page.locator('#drive-hud').get_attribute('data-x')
        page.keyboard.down('ArrowUp')
        page.wait_for_timeout(100)
        page.keyboard.up('ArrowUp')
        assert page.locator('#drive-hud').get_attribute('data-x') == before
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        assert not errors, errors
        print(f'{name}: OK', flush=True)
        page.close()
    page = browser.new_page()
    page.route('**/src/scene.js', lambda route: route.abort())
    page.add_init_script("localStorage.setItem('gorilazz.world.v1', JSON.stringify({version:1, vehicle:{x:-16,z:-25,heading:0}, discovered:[]}))")
    page.goto(url)
    page.wait_for_load_state('networkidle')
    page.locator('#enter-world').click()
    page.wait_for_timeout(200)
    assert page.locator('#journey-status').inner_text() == 'Você chegou'
    page.locator('#journey-action').click()
    assert page.locator('#discovery-dialog').is_visible()
    assert 'Nova descoberta' in page.locator('#discovery-saved').inner_text()
    assert page.locator('#journal-count').inner_text() == '1 / 5'
    print('arrival and journal: OK', flush=True)
    browser.close()
