# Run with python3 tests/hairline-browser.py after starting http.server 8787 at repo root. Requires Playwright and Chromium.
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1280,'height':1000});errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
 page.goto('http://127.0.0.1:8787/demos/hairline/');page.wait_for_timeout(1000)
 assert page.locator('.document-tray-list button').count()==5
 page.locator('.document-tray-list button').nth(2).click();assert page.locator('.document-tray-detail h3').inner_text()=='Modelo de potencial'
 page.locator('.document-tray-stage').focus();page.keyboard.press('ArrowRight');assert page.locator('.document-tray-detail h3').inner_text()=='Memoria del proyecto'
 with page.expect_popup() as info:page.locator('.document-tray-detail a').click()
 pop=info.value;assert pop.locator('h1').inner_text()=='Memoria del proyecto';pop.close()
 page.locator('#many').click();page.get_by_role('button',name='Siguientes').click();assert page.locator('.document-tray-list button').count()==3
 assert page.locator('.document-tray-detail a').is_hidden()
 page.locator('#empty').click();assert page.locator('svg').count()==0
 page.locator('#normal').click();page.wait_for_timeout(900)
 page.screenshot(path='/tmp/hairline-desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.emulate_media(reduced_motion='reduce');page.reload();page.wait_for_timeout(700)
 page.locator('.document-tray-list button').nth(4).click();assert page.locator('.document-tray-detail h3').inner_text()=='Presentación de alternativas'
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/tmp/hairline-mobile.png',full_page=True)
 assert not errors, errors
 print('PASS: selection, keyboard, document opening, pagination, empty, rebuild, mobile, reduced-motion, no console errors')
 b.close()
