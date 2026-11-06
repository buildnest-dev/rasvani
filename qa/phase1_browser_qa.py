from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'prototype-phase-1'
html = (SITE / 'index.html').read_text(encoding='utf-8').replace('<head>', '<head><base href="http://127.0.0.1:4173/">')
results = {}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])
    for name, viewport in [('desktop', {'width':1440,'height':1000}), ('tablet', {'width':820,'height':1000}), ('mobile', {'width':390,'height':844})]:
        page = browser.new_page(viewport=viewport)
        errors, asset_responses = [], []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('console', lambda message: errors.append(message.text) if message.type == 'error' else None)
        page.route('**/assets/*', lambda route: route.fulfill(path=str(SITE/'assets'/route.request.url.split('/assets/')[-1])))
        page.on('response', lambda response: asset_responses.append({'url':response.url,'status':response.status}) if '/assets/' in response.url else None)
        page.set_content(html, wait_until='load')
        page.screenshot(path=str(SITE/f'qa-{name}.png'), full_page=True, timeout=30000)
        checks = {}
        for selector, key in [('#searchBtn','search_panel'),('#cartBtn','bag_panel'),('[data-panel="producer"]','producer_panel'),('[data-panel="admin"]','admin_panel')]:
            page.locator(selector).first.click(timeout=3000)
            checks[key] = page.locator('#panel.open').count() == 1
            page.keyboard.press('Escape')
        page.locator('[data-open-regions]').first.click()
        count = page.locator('[data-select-region]').count()
        page.locator('[data-select-region="Bihar"]').click()
        checks['region_selector'] = count == 36 and page.locator('#panelTitle').inner_text() == 'Bihar'
        page.keyboard.press('Escape')
        page.locator('#searchBtn').click(); page.locator('#searchInput').fill('Bihar')
        search_text = page.locator('#searchResults').inner_text()
        page.locator('[data-result="Region"]').click()
        checks['search_result'] = 'Bihar' in search_text and page.locator('#panelTitle').inner_text() == 'Bihar'
        page.keyboard.press('Escape')
        page.locator('[data-product="Traditional pantry selection"]').click()
        checks['product_detail'] = page.locator('#panelTitle').inner_text() == 'Traditional pantry selection'
        page.locator('#detailAdd').click(); page.locator('[data-plus]').click()
        plus_ok = 'Qty 2' in page.locator('#panel').inner_text()
        page.locator('[data-minus]').click(); minus_ok = 'Qty 1' in page.locator('#panel').inner_text()
        page.locator('#clearBag').click(); clear_ok = 'empty' in page.locator('#panel').inner_text().lower()
        checks['bag_quantity_and_clear'] = plus_ok and minus_ok and clear_ok
        page.keyboard.press('Escape')
        page.locator('#searchBtn').focus(); page.locator('#searchBtn').click(); page.keyboard.press('Escape')
        checks['escape_and_focus_restore'] = page.locator('#panel.open').count() == 0 and page.evaluate('document.activeElement.id') == 'searchBtn'
        if viewport['width'] <= 850:
            page.locator('.mobilemenu').click()
            checks['mobile_menu'] = page.locator('.mobile-nav-links').count() == 1
            page.locator('[data-mobile-account]').click()
            checks['mobile_account'] = page.locator('#panelTitle').inner_text() == 'Your Rasvani account'
            page.keyboard.press('Escape')
        page.locator('[data-panel="retailers"]').last.click()
        checks['retailer_journey'] = page.locator('#panelTitle').inner_text() == 'Retailer and business buyer journey'
        page.keyboard.press('Escape')
        width = page.evaluate('document.documentElement.scrollWidth')
        results[name] = {'viewport':viewport,'document_width':width,'no_horizontal_overflow':width==viewport['width'],'assets_loaded_200':sum(x['status']==200 for x in asset_responses),'checks':checks,'console_errors':errors}
        page.close()
    browser.close()
for width in [320,360,375,768,1024]:
    with sync_playwright() as p:
        browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
        page=browser.new_page(viewport={'width':width,'height':800})
        page.set_content(html,wait_until='load')
        actual=page.evaluate('document.documentElement.scrollWidth')
        results[f'overflow_{width}']={'viewport_width':width,'document_width':actual,'passed':actual==width}
        page.close();browser.close()
passed=True
for item in results.values():
    if 'checks' in item: passed &= item['no_horizontal_overflow'] and item['assets_loaded_200']==10 and not item['console_errors'] and all(item['checks'].values())
    else: passed &= item['passed']
results['overall_pass']=bool(passed)
(SITE/'PHASE_1_BROWSER_QA_RESULTS.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps(results,indent=2))
if not passed: raise SystemExit(1)
