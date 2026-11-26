"""Smoke E2E em Chromium headless sob /Gorilazz/ (simulação fiel do GitHub Pages).
Exige: 0 erros de console/página, 0 HTTP >= 400, mundo 3D carregado e Passeio Guiado
iniciando com a TOUR_ORDER fixa de 9 paradas.
"""
import http.server
import os
import socketserver
import sys
import threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
EXPECTED_TOUR_ORDER = [
    "era-explosao",
    "beginning",
    "era-reinvencao",
    "voices",
    "genres",
    "live",
    "era-hiato",
    "demon-days",
    "era-plastic",
]


class SubpathHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def translate_path(self, path):
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == "/Gorilazz" or clean == "/Gorilazz/":
            clean = "/index.html"
        elif clean.startswith("/Gorilazz/"):
            clean = clean[len("/Gorilazz"):]
        return super().translate_path(clean)

    def log_message(self, format, *args):
        pass


def start_server():
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", 0), SubpathHandler)
    httpd.daemon_threads = True
    port = httpd.server_address[1]
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    return httpd, port


def main():
    httpd, port = start_server()
    url = f"http://127.0.0.1:{port}/Gorilazz/?perf=1"
    console_errors = []
    http_errors = []

    try:
        with sync_playwright() as p:
            args = [
                "--use-gl=angle",
                "--use-angle=swiftshader",
                "--enable-webgl",
                "--ignore-gpu-blocklist",
            ]
            use_chrome = os.environ.get("USE_CHROME") == "1"
            browser = (
                p.chromium.launch(headless=True, channel="chrome")
                if use_chrome
                else p.chromium.launch(headless=True, args=args)
            )
            page = browser.new_page(viewport={"width": 1280, "height": 720})
            page.on("pageerror", lambda err: console_errors.append(f"pageerror: {err}"))
            page.on(
                "console",
                lambda msg: console_errors.append(f"console.{msg.type}: {msg.text}")
                if msg.type == "error"
                else None,
            )
            page.on(
                "response",
                lambda res: http_errors.append(f"{res.status} {res.url}")
                if res.status >= 400
                else None,
            )

            page.goto(url, wait_until="networkidle", timeout=60000)
            page.wait_for_function(
                "() => Boolean(window.__gorilazz && window.__gorilazz.world && window.__gorilazz.cameraState)",
                timeout=30000,
            )

            # Inicia o Passeio Guiado e valida a TOUR_ORDER fixa de 9 paradas.
            page.locator("#start-guided").click()
            page.wait_for_function(
                "() => Boolean(window.__gorilazz.guided() && window.__gorilazz.guided().order)",
                timeout=15000,
            )
            order = page.evaluate("() => window.__gorilazz.guided().order.map(s => s.id)")
            assert order == EXPECTED_TOUR_ORDER, f"TOUR_ORDER divergente: {order}"
            assert page.locator("#jogo").get_attribute("data-touring") == "true"

            # Fecha o diálogo de onboarding (caso abra em perfil limpo) antes de testar WASD.
            page.wait_for_timeout(450)
            page.evaluate("() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); }")
            page.wait_for_timeout(100)

            # WASD assume o volante instantaneamente e encerra o passeio.
            page.keyboard.down("w")
            page.wait_for_timeout(200)
            page.keyboard.up("w")
            assert page.locator("#jogo").get_attribute("data-touring") == "false"

            browser.close()
    finally:
        httpd.shutdown()

    assert not console_errors, f"Erros de console/página: {console_errors}"
    assert not http_errors, f"Respostas HTTP >= 400: {http_errors}"
    print(f"CI SMOKE OK: /Gorilazz/ carregado, TOUR_ORDER={len(EXPECTED_TOUR_ORDER)}/9, 0 console errors, 0 HTTP >= 400")


if __name__ == "__main__":
    main()
