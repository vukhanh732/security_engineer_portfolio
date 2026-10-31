"""Touch viewport, sound-default entry and small-phone inspection regressions."""
from browser_controls import control, control_button
from playwright.sync_api import sync_playwright,expect
import os
from pathlib import Path
BASE=os.environ.get("CLUBHOUSE_TEST_URL","http://127.0.0.1:4173").rstrip("/")
Path(".superpowers/build").mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 errors=[]
 for width,height in [(320,568),(390,844),(768,1024),(1024,768)]:
  context=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=width<768,reduced_motion='reduce')
  page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto(BASE+'/',wait_until='networkidle')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),str((width,height))
  assert page.locator('[data-enter=quiet]').count()==0
  if width<768:
   expect(page.locator('#main-content #projects')).to_be_visible()
   page.locator('#mobile-enter').click()
  else:page.get_by_role('button',name='Enter office ↗',exact=True).click()
  expect(page.locator('#office-entry')).not_to_be_visible()
  expect(control(page,'#enable-audio')).to_have_text('Mute sound',timeout=10000)
  c=page.locator('#world-canvas[data-ready=true]');c.wait_for(timeout=90000)
  page.locator('.main-nav a[href="#projects"]').click();expect(page.locator('[data-window=projects]')).to_be_visible()
  assert page.locator('[data-window=projects]').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
  page.keyboard.press('Escape')
  control(page,'.desk-objects summary').click();control(page,'[data-prop=coffee]').click()
  expect(page.locator('#object-inspector')).to_be_visible()
  panel=page.locator('#object-inspector');assert panel.evaluate('(e)=>e.scrollHeight<=e.clientHeight+1')
  for turn_button in page.locator('#object-turn button').all():
   assert turn_button.evaluate('(e)=>{const r=e.getBoundingClientRect();const h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===h||e.contains(h)}'), 'Rotation button obscured'
  page.screenshot(path=f'.superpowers/build/responsive-entry-{width}.png')
  control(page,'#enable-audio').click();expect(control(page,'#enable-audio')).to_have_text('Enable sound')
  page.locator('#scene-menu > summary').click();page.locator('#put-back').click()
  print('Passed:',width,height,'readable layout, one-step sound-on entry, Projects, inspection and mute',flush=True)
  context.close()
 assert not errors,errors
 browser.close()
