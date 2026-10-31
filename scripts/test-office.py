"""Open-office drag/inspection and explicit intro-audio acceptance checks."""
from browser_controls import control, control_button
from playwright.sync_api import sync_playwright,expect
import os
BASE=os.environ.get("CLUBHOUSE_TEST_URL","http://127.0.0.1:4173").rstrip("/")
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
 page=b.new_page(viewport={'width':1440,'height':900},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE+'/',wait_until='networkidle');page.locator('[data-enter=sound]').click();c=page.locator('#world-canvas[data-ready=true]');c.wait_for(timeout=90000)
 page.screenshot(path='.superpowers/build/open-office-front.png');before=c.get_attribute('data-position')
 page.mouse.move(1120,420);page.mouse.down();page.mouse.move(650,510,steps=16);page.mouse.up();page.wait_for_timeout(100)
 assert c.get_attribute('data-position')!=before
 expect(page.locator('#desktop')).not_to_be_visible();page.screenshot(path='.superpowers/build/open-office-orbit.png')
 control(page,'#home-camera').click();control(page,'.desk-objects summary').click();control(page,'[data-prop=coffee]').click()
 expect(c).to_have_attribute('data-inspection','coffee');q=c.get_attribute('data-object-rotation');position=c.get_attribute('data-position')
 page.mouse.move(620,360);page.mouse.down();page.mouse.move(900,480,steps=16);page.mouse.up();page.wait_for_timeout(100)
 assert c.get_attribute('data-object-rotation')!=q;assert c.get_attribute('data-position')==position
 page.screenshot(path='.superpowers/build/open-office-coffee.png')
 page.locator('#put-back').click();expect(c).to_have_attribute('data-inspection','')
 control(page,'.desk-objects summary').click();control(page,'[data-prop=coffee]').click();expect(c).to_have_attribute('data-object-rotation',q)
 page.locator('[data-turn="35,0"]').click();expect(c).not_to_have_attribute('data-object-rotation',q)
 # Cancel while the pointer is still held, then release over the monitor.
 page.mouse.move(600,350);page.mouse.down();page.mouse.move(750,260,steps=10)
 page.keyboard.press('Escape');page.wait_for_timeout(100);page.mouse.up()
 expect(c).to_have_attribute('data-inspection','');expect(page.locator('#desktop')).not_to_be_visible()
 sound=b.new_page(viewport={'width':1440,'height':900});sound.add_init_script('window.__sounds=[];const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__sounds.push(this);return play.apply(this,arguments);};');sound.on('pageerror',lambda e:errors.append(str(e)))
 sound.goto(BASE+'/',wait_until='networkidle');assert sound.evaluate('__sounds.length')==0
 sound.locator('[data-enter=sound]').click();expect(sound.locator('#place-name')).to_have_attribute('data-introducing','true');expect(sound.locator('#place-name')).to_have_text("Hi, I'm Vu Luu.",timeout=10000)
 assert sound.evaluate('__sounds.some(a=>a.src.includes("typing-"))');assert sound.evaluate('__sounds.some(a=>a.src.includes("office.ogg"))')
 control(sound,'#enable-audio').click();assert sound.evaluate('__sounds.every(a=>a.paused||a.ended)')
 # Normal mouse-look pose must stay frozen when a held object is dragged.
 control(sound,'#home-camera').click();sound.locator('#world-canvas[data-ready=true]').wait_for(timeout=90000)
 normal=sound.locator('#world-canvas');sound.mouse.move(1050,300);sound.wait_for_timeout(1200)
 control(sound,'.desk-objects summary').click();control(sound,'[data-prop=book]').click();sound.wait_for_timeout(700)
 position=normal.get_attribute('data-position');q=normal.get_attribute('data-object-rotation')
 sound.mouse.move(600,370);sound.mouse.down();sound.mouse.move(850,440,steps=12);sound.mouse.up();sound.wait_for_timeout(100)
 assert normal.get_attribute('data-position')==position,'Object drag moved the camera'
 assert normal.get_attribute('data-object-rotation')!=q
 sound.locator('#put-back').click()
 control(sound,'#home-camera').click();expect(normal).to_have_attribute('data-traveling','false',timeout=10000)
 normal.focus();position=normal.get_attribute('data-position');sound.keyboard.press('ArrowRight')
 sound.wait_for_function('(p)=>document.querySelector("#world-canvas").dataset.position!==p',arg=position)
 # A manipulated camera pose survives opening a portfolio app and closing it.
 position=normal.get_attribute('data-position');sound.locator('.main-nav a[href="#projects"]').click();sound.get_by_role('button',name='Close My Projects',exact=True).click()
 expect(normal).to_have_attribute('data-position',position)
 assert not errors,errors
 print('Passed: centred open stage, scene drag, held-cup rotation/camera lock/return, keyboard rotation, typed name with explicit typing/office audio and mute.',flush=True)
 b.close()
