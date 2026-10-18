#!/usr/bin/env python3
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    page = browser.new_page(viewport={'width': 1280, 'height': 1000})
    failures = []
    page.on('requestfailed', lambda request: failures.append({'url': request.url, 'failure': request.failure}))
    page.goto('http://127.0.0.1:3115/', wait_until='networkidle')
    page.locator('#map').scroll_into_view_if_needed()
    page.wait_for_timeout(8000)
    print('map alerts:', page.locator('#map [role="alert"]').all_text_contents(), flush=True)
    print('map loading:', page.get_by_text('Loading map…', exact=True).count(), flush=True)
    print('canvas:', page.locator('.maplibregl-canvas').count(), flush=True)
    print('request failures:', failures[:12], flush=True)
    page.locator('#map').screenshot(path='verification/map-render-check.png')
    assert page.locator('.maplibregl-canvas').count() == 1
    assert page.get_by_text('Loading map…', exact=True).count() == 0
    assert page.locator('#map [role="alert"]').count() == 0
    page.get_by_role('button', name='Set departure pin', exact=True).click()
    page.locator('.maplibregl-canvas').click(position={'x': 400, 'y': 150})
    assert 'Not selected' in page.locator('#map').inner_text()
    assert 'Reset pin' in page.locator('#map').inner_text()
    print('PASS rendered free map and clicked departure pin', flush=True)
    browser.close()
