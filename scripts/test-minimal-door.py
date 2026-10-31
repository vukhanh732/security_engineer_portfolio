"""Default minimal scene chrome and actual animated-door navigation."""
from playwright.sync_api import sync_playwright,expect
import os
from pathlib import Path
BASE=os.environ.get("CLUBHOUSE_TEST_URL","http://127.0.0.1:4173").rstrip("/")
Path(".superpowers/build").mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/',wait_until='networkidle');page.locator('[data-enter=sound]').click()
 c=page.locator('#world-canvas[data-ready=true]');c.wait_for(timeout=90000)
 expect(page.locator('#scene-menu')).not_to_have_attribute('open','')
 for selector in ['#mouse-look','#enable-audio','#open-desktop','.view-controls','.world-settings','#room-description']:
  expect(page.locator(selector)).not_to_be_visible()
 page.screenshot(path='.superpowers/build/minimal-office-door.png')
 def pick(label):
  point=page.evaluate('''label=>{const c=document.querySelector('#world-canvas');for(let y=140;y<780;y+=12)for(let x=160;x<1400;x+=12){c.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y}));if(c.dataset.hover===label)return{x,y};}return null;}''',label)
  assert point,'No pick surface for '+label
  page.mouse.click(point['x'],point['y'])
 pick('Explore my hobbies');expect(c).to_have_attribute('data-node','hobbies')
 page.locator('#scene-menu > summary').click();expect(page.locator('#home-camera')).to_be_visible()
 page.keyboard.press('Escape');assert not page.locator('#scene-menu').evaluate('(e)=>e.open');expect(c).to_have_attribute('data-node','hobbies')
 pick('Back to my study');expect(c).to_have_attribute('data-node','study')
 page.locator('#scene-menu > summary').click();page.locator('#room-action').click();expect(c).to_have_attribute('data-node','hobbies');assert not page.locator('#scene-menu').evaluate('(e)=>e.open')
 page.locator('#scene-menu > summary').click();page.locator('#home-camera').click();expect(c).to_have_attribute('data-node','study')
 page.locator('#scene-menu > summary').click();page.locator('#open-desktop').click();expect(page.locator('#desktop')).to_be_visible();assert not page.locator('#scene-menu').evaluate('(e)=>e.open');page.keyboard.press('Escape')
 page.locator('#scene-menu > summary').click();page.locator('.desk-objects summary').click();page.locator('[data-prop=coffee]').click()
 expect(c).to_have_attribute('data-inspection','coffee');assert not page.locator('#scene-menu').evaluate('(e)=>e.open')
 expect(page.locator('#object-description')).not_to_be_visible();page.screenshot(path='.superpowers/build/minimal-office-inspection.png')
 page.locator('#put-back').click()
 page.locator('.main-nav a[href="#projects"]').click();expect(page.locator('[data-window=projects]')).to_be_visible();page.keyboard.press('Escape')
 page.emulate_media(reduced_motion='no-preference');page.wait_for_timeout(200)
 pick('Explore my hobbies');expect(c).to_have_attribute('data-traveling','true');page.wait_for_timeout(350);page.screenshot(path='.superpowers/build/minimal-door-open.png')
 expect(c).to_have_attribute('data-traveling','false',timeout=10000)
 assert not errors,errors
 print('Passed: minimal default, door picks/round trip/opening, More keyboard dismissal, inspection and recruiter shortcuts.',flush=True)
 b.close()
