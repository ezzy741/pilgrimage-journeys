#!/usr/bin/env python3
"""Run against an isolated staging server, never create production bookings."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:3115'
OUT = Path('verification')
OUT.mkdir(exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', headless=True,
        args=['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    for width in [390, 768, 1440]:
        page = browser.new_page(viewport={'width': width, 'height': 1000}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='networkidle')
        page.get_by_role('heading', name='Visit Hijaz', exact=True).wait_for()
        assert page.locator('.vh-landmark-card').count() == 15
        overflow = page.evaluate('document.documentElement.scrollWidth > innerWidth')
        assert not overflow, f'Horizontal overflow at {width}'
        page.screenshot(path=str(OUT / f'staged-home-{width}.png'), full_page=True)
        results.append({'width': width, 'overflow': overflow, 'pageErrors': errors})
        assert not errors, errors
        page.close()
    page = browser.new_page(viewport={'width': 1280, 'height': 900})
    page.goto(BASE, wait_until='networkidle')
    departure = page.get_by_role('combobox', name='Departure', exact=True)
    departure.fill('Haram')
    page.get_by_role('option', name='Masjid al-Haram Makkah', exact=True).click()
    destination = page.get_by_role('combobox', name='Destination', exact=True)
    destination.fill('Taneem')
    page.get_by_role('option', name='Masjid al-Taneem Makkah', exact=True).click()
    assert departure.input_value() == 'Masjid al-Haram'
    assert destination.input_value() == 'Masjid al-Taneem'
    page.get_by_role('spinbutton', name='Maximum estimate', exact=True).fill('140')
    assert page.locator('.vh-landmark-card').count() == 4
    page.get_by_role('searchbox', name='Search a landmark or city', exact=True).fill('Quba')
    assert page.locator('.vh-landmark-card').count() == 1
    page.locator('.vh-landmark-card').click()
    page.wait_for_url('**/ziyarat/madinah?stop=quba')
    assert page.get_by_role('checkbox', checked=True).count() == 1
    assert 'Masjid Quba' in page.get_by_role('checkbox', checked=True).locator('..').inner_text()
    assert '135 SAR' in page.locator('form').inner_text()
    assert 'Manual quote required' not in page.locator('form').inner_text()
    page.goto(BASE, wait_until='networkidle')
    page.get_by_role('button', name='العربية', exact=True).click()
    page.get_by_role('combobox', name='الانطلاق', exact=True).fill('الحرام')
    assert page.get_by_role('option').count() > 0
    assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    results.append({'localSearch': 'passed EN and AR', 'maximumEstimateFilter': 'passed',
                    'stopLinkAndFare': 'Quba 135 SAR',
                    'webgl2': page.evaluate('!!document.createElement("canvas").getContext("webgl2")'),
                    'mapCanvasCount': page.locator('.maplibregl-canvas').count()})
    page.screenshot(path=str(OUT / 'staged-map-arabic.png'), full_page=True)
    browser.close()
print(json.dumps(results, indent=2))
