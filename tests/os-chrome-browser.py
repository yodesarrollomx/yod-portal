# Start a static server at repo root, then YOD_TEST_BASE=http://127.0.0.1:8787 python3 tests/os-chrome-browser.py
import os
from pathlib import Path
from playwright.sync_api import sync_playwright
BASE=os.environ.get('YOD_TEST_BASE','http://127.0.0.1:8790/yod-portal')
OUT=Path('/workspace/scratch/os-chrome');OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=b.new_page(viewport={'width':1440,'height':1000});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/*',lambda r:r.continue_() if r.request.url.startswith(BASE) else r.abort())
 page.goto(BASE+'/os/design-preview.html');page.wait_for_selector('.nav-item .ui-glyph[data-hairline]');page.wait_for_timeout(400)
 assert page.locator('.ui-sidebar-toggle').count()==1
 assert page.locator('.nav-item .ui-glyph').count()==12
 assert page.locator('.module-icon .ui-glyph').count()==6
 assert page.locator('.ui-brand-full').evaluate('(e)=>e.complete&&e.naturalWidth>0')
 assert page.locator('.sidebar').bounding_box()['width']==268
 page.screenshot(path=str(OUT/'expanded.png'),full_page=True)
 # Actual geometry responds to the parent card, not a uniform CSS translation.
 def geometry(node): return node.locator('svg').evaluate('(e)=>e.innerHTML')
 for system in ['SYS-DESPACHO','SYS-POTENCIALES','SYS-TAREAS','SYS-OBRA']:
  card=page.locator('.module-card[data-system-id="'+system+'"]');card.scroll_into_view_if_needed()
  page.mouse.move(1400,100);page.wait_for_timeout(550);before=geometry(card)
  box=card.bounding_box();page.mouse.move(box['x']+box['width']*.55,box['y']+box['height']*.4);page.wait_for_timeout(600)
  assert geometry(card)!=before,system+' must respond with geometry'
 page.mouse.move(1400,100);page.wait_for_timeout(650)
 card=page.locator('.module-card[data-system-id="SYS-POTENCIALES"]');stable=geometry(card);page.wait_for_timeout(300);assert geometry(card)==stable
 page.emulate_media(reduced_motion='reduce');page.wait_for_timeout(100);stable=geometry(card);card.hover();page.wait_for_timeout(250);assert geometry(card)==stable
 page.emulate_media(reduced_motion='no-preference');page.mouse.move(1400,100)
 page.evaluate('scrollTo(0,0)')

 page.get_by_role('button',name='Contraer barra lateral',exact=True).click();page.wait_for_timeout(280)
 assert page.locator('.sidebar').bounding_box()['width']==80
 assert page.locator('.ui-brand-mark').is_visible()
 assert page.locator('.nav-item .ui-glyph').first.is_visible()
 nav=page.get_by_role('link',name='PPP',exact=True).first;nav.focus();assert page.get_by_role('tooltip').inner_text()=='PPP'
 assert page.locator('.ui-glyph[tabindex]').count()==0
 page.screenshot(path=str(OUT/'compact.png'),full_page=True)
 page.reload();page.wait_for_timeout(300);assert page.locator('.app-shell').evaluate('(e)=>e.classList.contains("ui-compact")')
 # Dynamically refreshed catalog keeps accessible names and disabled states; no fabricated destinations.
 page.evaluate('''()=>{let n=document.createElement('span');n.className='nav-item nav-item-off';n.setAttribute('aria-disabled','true');n.innerHTML='<i class="ti ti-map-2"></i><span>PPP sin acceso</span>';document.getElementById('preview-nav').append(n);}''');page.wait_for_timeout(150)
 assert page.locator('[aria-label="PPP sin acceso"]').get_attribute('aria-disabled')=='true';assert page.locator('[aria-label="PPP sin acceso"]').get_attribute('href') is None
 page.get_by_role('button',name='Expandir barra lateral',exact=True).click();page.set_viewport_size({'width':950,'height':900});page.wait_for_timeout(300);assert page.locator('.sidebar').bounding_box()['width']==268
 page.emulate_media(reduced_motion='reduce');page.get_by_role('link',name='PPP',exact=True).first.hover();assert page.locator('.nav-item .ui-glyph path').first.evaluate('(e)=>getComputedStyle(e).transitionDuration')=='0s'
 page.set_viewport_size({'width':390,'height':844});page.wait_for_timeout(250);page.get_by_role('button',name='Abrir menú',exact=True).click();assert page.locator('.sidebar').bounding_box()['x']==0
 page.screenshot(path=str(OUT/'mobile.png'),full_page=True)
 page.locator('.ui-sidebar-toggle').click();assert not page.locator('.app-shell').evaluate('(e)=>e.classList.contains("nav-open")')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 # Shared board shell markup, same module, no server or board writes.
 page.set_viewport_size({'width':1280,'height':900});page.goto(BASE+'/os/design-preview.html');
 page.evaluate('''()=>{let l=document.createElement('link');l.rel='stylesheet';l.href='shell.css';document.head.append(l);let s=document.createElement('div');s.className='yod-shell';s.innerHTML='<aside class="yod-sidebar"><a class="yod-brand" href="#"><b>YOD</b><span>OS</span></a><nav class="yod-nav"><a class="yod-nav-item" href="#board"><i class="ti ti-wallet"></i><span>Flujo</span></a></nav><div class="yod-foot"><div class="yod-avatar">YO</div><div class="yod-id">Equipo</div></div></aside><main class="yod-main"><input id="retained" value="Trabajo sin guardar"></main>';document.querySelector('.app-shell').remove();document.body.append(s);YodChrome.refresh();}''');page.wait_for_timeout(100)
 page.get_by_role('button',name='Contraer barra lateral',exact=True).click();page.wait_for_timeout(250);assert page.locator('#retained').input_value()=='Trabajo sin guardar';assert page.locator('.yod-sidebar').bounding_box()['width']==80
 assert page.get_by_role('link',name='Flujo',exact=True).get_attribute('href')=='#board'
 page.evaluate('YodChrome.refresh()');assert page.locator('.ui-sidebar-toggle').count()==1
 # The actual OS DOM keeps its iframe and unsaved content during width changes.
 import re
 raw=Path('os/index.html').read_text()
 raw=re.sub(r'<script\b[^>]*>.*?</script>','',raw,flags=re.S)
 raw=raw.replace('</head>','<script src="ui-chrome.js?v=1" defer></script></head>')
 page.route(BASE+'/os/index.html',lambda r:r.fulfill(content_type='text/html',body=raw))
 page.goto(BASE+'/os/index.html');page.wait_for_timeout(150)
 page.evaluate("let f=document.querySelector('#board-frame');f.srcdoc='<input id=entry value=Retenido>';f.hidden=false")
 page.wait_for_timeout(100)
 frame=page.frame_locator('#board-frame');frame.locator('#entry').fill('Sin guardar')
 page.locator('.ui-sidebar-toggle').click();page.wait_for_timeout(250)
 assert frame.locator('#entry').input_value()=='Sin guardar'
 assert page.locator('#nav-modules .nav-item').count()==0
 assert not errors,errors
 print('PASS: branded assets, 12 nav icons, cards, expand/collapse, persistence, tooltips, keyboard, disabled access, 950px, mobile, reduced motion, shared-shell content retention')
 b.close()
