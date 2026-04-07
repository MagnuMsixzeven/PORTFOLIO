"""
Gera screenshots dos projetos Flask para o portfólio.
Execute: python capturar_screenshots.py

Requer: pip install playwright
        playwright install chromium
"""
import asyncio
import subprocess
import sys
import time
import os
from pathlib import Path

BASE = Path(__file__).parent.parent
SCREENSHOTS = Path(__file__).parent / 'screenshots'
SCREENSHOTS.mkdir(exist_ok=True)

PYTHON = sys.executable

APPS = {
    'techos':     {'path': BASE / 'Projeto_Assistencia_TC',          'port': 5056},
    'barberbook': {'path': BASE / 'Projeto_Barbearia' / 'barberbook', 'port': 5001},
    'mercadinho': {'path': BASE / '_Projeto_Mercadinho',              'port': 5055},
    'clinica':    {'path': BASE / 'projeto_Clinica',                  'port': 5050},
}

def start_apps():
    procs = {}
    for name, info in APPS.items():
        env = os.environ.copy()
        env['FLASK_ENV'] = 'production'
        env['APP_PORT'] = str(info['port'])
        p = subprocess.Popen(
            [PYTHON, 'app.py'],
            cwd=info['path'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            env=env,
        )
        procs[name] = p
        print(f'  Iniciando {name} na porta {info["port"]} (PID {p.pid})...')
    return procs


async def screenshot_all():
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        print('\nERRO: Playwright não instalado.')
        print('Execute: pip install playwright && playwright install chromium')
        return False

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        ctx = await browser.new_context(viewport={'width': 1280, 'height': 800})
        page = await ctx.new_page()

        # ── 1. TechOS — página de login ────────────────────────────
        print('  Capturando TechOS (login)...')
        await page.goto('http://localhost:5056/login', wait_until='networkidle', timeout=15000)
        await page.screenshot(path=str(SCREENSHOTS / 'techos_login.png'))
        print('  ✓ techos_login.png')

        # ── 2. BarberBook — landing ─────────────────────────────────
        print('  Capturando BarberBook (landing)...')
        await page.goto('http://localhost:5001/', wait_until='networkidle', timeout=15000)
        await page.screenshot(path=str(SCREENSHOTS / 'barberbook_landing.png'))
        print('  ✓ barberbook_landing.png')

        # ── 3. Mercadinho — dashboard (login automático) ────────────
        print('  Capturando Mercadinho (dashboard)...')
        await page.goto('http://localhost:5055/login', wait_until='networkidle', timeout=15000)
        await page.fill('[name=usuario]', 'admin')
        await page.fill('[name=senha]', 'admin')
        await page.click('[type=submit]')
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path=str(SCREENSHOTS / 'mercadinho_dashboard.png'))
        print('  ✓ mercadinho_dashboard.png')

        # ── 4. Clínica — landing pública ────────────────────────────
        print('  Capturando Clínica (landing)...')
        await page.goto('http://localhost:5050/', wait_until='networkidle', timeout=15000)
        await page.screenshot(path=str(SCREENSHOTS / 'clinica_landing.png'))
        print('  ✓ clinica_landing.png')

        # ── 5. Clínica — painel admin (login automático) ────────────
        print('  Capturando Clínica (admin)...')
        await page.goto('http://localhost:5050/login', wait_until='networkidle', timeout=15000)
        await page.fill('[name=login]', 'admin')
        await page.fill('[name=senha]', 'admin123')
        await page.click('[type=submit]')
        await page.wait_for_load_state('networkidle')
        await page.screenshot(path=str(SCREENSHOTS / 'clinica_admin.png'))
        print('  ✓ clinica_admin.png')

        await browser.close()
    return True


def main():
    print('=== Gerador de Screenshots do Portfólio ===\n')

    print('[1/3] Iniciando servidores Flask...')
    procs = start_apps()

    print('[2/3] Aguardando servidores ficarem prontos (8s)...')
    time.sleep(8)

    print('[3/3] Capturando screenshots...')
    ok = asyncio.run(screenshot_all())

    print('\nEncerrando servidores...')
    for name, p in procs.items():
        p.terminate()
        print(f'  Parado: {name}')

    if ok:
        print(f'\nPronto! Screenshots salvas em: {SCREENSHOTS}')
    else:
        print('\nFalhou. Verifique o erro acima.')


if __name__ == '__main__':
    main()
