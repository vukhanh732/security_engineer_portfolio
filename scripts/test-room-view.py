"""Room return, zoom, mouse look and activity affordance acceptance checks."""
from browser_controls import control, control_button
import os
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
BASE=os.environ.get('CLUBHOUSE_TEST_URL','http://127.0.0.1:4173').rstrip('/')
OUT=Path('.superpowers/build'); OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,args=['--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce')
    page=context.new_page();errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE,wait_until='networkidle');page.locator('.world').hover()
    canvas=page.locator('#world-canvas[data-ready=true]');canvas.wait_for(timeout=90000)
    page.screenshot(path=str(OUT/'refined-study.png'))
    control(page,'#zoom-in').click();control(page,'#zoom-in').click()
    expect(canvas).to_have_attribute('data-zoom','1.300')
    page.mouse.move(700,450);page.mouse.wheel(0,120)
    expect(canvas).to_have_attribute('data-zoom','1.180')
    control(page,'[data-room=hobbies]').click();expect(canvas).to_have_attribute('data-node','hobbies')
    assert page.locator('[data-room]').evaluate_all('(items)=>items.every(e=>e.tagName==="BUTTON")'), 'Room state leaked into destination controls'
    expect(page.locator('.activity-marker:visible')).to_have_count(3)
    page.screenshot(path=str(OUT/'refined-hobbies.png'))
    # A direct room activity returns to exactly its originating composition and zoom.
    before=canvas.get_attribute('data-position')
    page.locator('[data-room-activity=badminton]').hover()
    expect(page.locator('#world-hint')).to_have_text('Play badminton')
    page.locator('[data-room-activity=badminton]').click()
    expect(page.locator('[data-window=badminton]')).to_be_visible()
    page.get_by_role('button',name='Close Badminton',exact=True).click()
    expect(page.locator('#desktop')).not_to_be_visible()
    expect(canvas).to_have_attribute('data-node','hobbies')
    expect(canvas).to_have_attribute('data-position',before)
    expect(canvas).to_have_attribute('data-zoom','1.180')
    # Closing from a closer destination, and Escape from poker, keep that destination.
    control(page,'[data-room=badminton]').click()
    control_button(page,'Play a match ↗').click()
    page.get_by_role('button',name='Close Badminton',exact=True).click()
    expect(canvas).to_have_attribute('data-node','badminton')
    expect(page.locator('#desktop')).not_to_be_visible()
    control(page,'[data-room=lounge]').click()
    control_button(page,'Deal a hand ↗').click()
    page.keyboard.press('Escape')
    expect(canvas).to_have_attribute('data-node','lounge')
    expect(canvas).to_have_attribute('data-zoom','1.180')
    # Computer-launched apps close to the desktop; leaving it restores the gym.
    control(page,'[data-room=gym]').click()
    control(page,'#explore').click();expect(page.locator('#desktop')).to_be_visible()
    page.locator('.desktop-icons [data-app=projects]').click()
    page.get_by_role('button',name='Close My Projects',exact=True).click()
    expect(page.locator('#desktop')).to_be_visible()
    control_button(page,'Back to the room ↙').click()
    expect(canvas).to_have_attribute('data-node','gym')
    expect(canvas).to_have_attribute('data-zoom','1.180')
    page.locator('.main-nav a[href="#experience"]').click()
    page.get_by_role('button',name='Close Experience.txt',exact=True).click()
    expect(page.locator('#desktop')).not_to_be_visible()
    expect(canvas).to_have_attribute('data-node','gym')
    # Mouse look responds visibly, can be disabled, and stops rendering after settling.
    control(page,'#home-camera').click();expect(canvas).to_have_attribute('data-zoom','1.000')
    # History uses the same return snapshot as Escape, including computer zoom reset.
    control(page,'[data-room=hobbies]').click()
    control(page,'#zoom-in').click()
    control(page,'#explore').click();expect(page.locator('#desktop')).to_be_visible()
    page.go_back()
    expect(page.locator('#desktop')).not_to_be_visible()
    expect(canvas).to_have_attribute('data-node','hobbies')
    expect(canvas).to_have_attribute('data-zoom','1.150')
    # Returning after orientation/viewport changes adapts the saved framing.
    before=[float(n) for n in canvas.get_attribute('data-position').split(',')]
    control(page,'#explore').click();expect(page.locator('#desktop')).to_be_visible()
    page.set_viewport_size({'width':390,'height':844})
    control_button(page,'Back to the room ↙').click()
    expect(canvas).to_have_attribute('data-node','hobbies')
    expect(canvas).to_have_attribute('data-zoom','1.150')
    after=[float(n) for n in canvas.get_attribute('data-position').split(',')]
    assert after[0]>before[0]*1.5,'Restored framing did not adapt to a narrow screen'
    page.set_viewport_size({'width':1440,'height':900})
    control(page,'#home-camera').click();expect(canvas).to_have_attribute('data-node','study')
    original=canvas.get_attribute('data-position')
    page.mouse.move(200,300);page.wait_for_timeout(150)
    assert canvas.get_attribute('data-position')==original,'Reduced motion moved the view'
    page.emulate_media(reduced_motion='no-preference')
    expect(control(page,'#mouse-look')).to_have_attribute('aria-pressed','true')
    page.mouse.move(300,300);page.wait_for_timeout(1500)
    left=[float(n) for n in canvas.get_attribute('data-position').split(',')]
    page.mouse.move(1200,300);page.wait_for_timeout(1500)
    right=[float(n) for n in canvas.get_attribute('data-position').split(',')]
    assert sum((a-b)**2 for a,b in zip(left,right))>.8,'Mouse orbit was imperceptible'
    renders=canvas.get_attribute('data-renders');page.wait_for_timeout(350)
    assert canvas.get_attribute('data-renders')==renders,'Mouse look never settled'
    control(page,'#mouse-look').click();page.wait_for_timeout(1500)
    still=canvas.get_attribute('data-position')
    page.mouse.move(500,400);page.wait_for_timeout(150)
    assert canvas.get_attribute('data-position')==still
    page.emulate_media(reduced_motion='reduce')
    for _ in range(12):
        if control(page,'#zoom-in').is_disabled():break
        control(page,'#zoom-in').click()
    expect(canvas).to_have_attribute('data-zoom','1.650')
    control(page,'.desk-objects summary').click();control(page,'[data-prop=book]').click()
    expect(page.locator('#object-inspector')).to_be_visible()
    page.screenshot(path=str(OUT/'refined-inspection-zoom.png'))
    page.locator('#put-back').click()
    for _ in range(12):
        if control(page,'#zoom-out').is_disabled():break
        control(page,'#zoom-out').click()
    expect(canvas).to_have_attribute('data-zoom','0.800')
    control(page,'#home-camera').click();expect(canvas).to_have_attribute('data-zoom','1.000')
    # Labels stay usable in the optional phone scene.
    mobile=context.new_page();mobile.set_viewport_size({'width':390,'height':844})
    mobile.on('pageerror',lambda e:errors.append(str(e)))
    mobile.goto(BASE,wait_until='networkidle')
    mobile.locator('#mobile-enter').click()
    mobile.locator('#world-canvas[data-ready=true]').wait_for(timeout=90000)
    control(mobile,'[data-room=hobbies]').click()
    expect(mobile.locator('.activity-marker:visible')).to_have_count(3)
    boxes=mobile.locator('.activity-marker:visible').all()
    for item in boxes:
        rect=item.bounding_box();assert rect['x']>=0 and rect['x']+rect['width']<=390
        assert rect['height']>=44
    mobile.screenshot(path=str(OUT/'refined-hobbies-phone.png'))
    mobile.locator('[data-room-activity=poker]').click()
    expect(mobile.locator('[data-window=poker]')).to_be_visible()
    mobile.get_by_role('button',name='Close Five-card draw',exact=True).click()
    expect(mobile.locator('#desktop')).not_to_be_visible()
    for width,height in [(390,568),(844,390),(1024,768)]:
        mobile.set_viewport_size({'width':width,'height':height})
        mobile.wait_for_timeout(200)
        for selector in ['#zoom-in','#zoom-out','[data-room-activity=badminton]','[data-room-activity=gym]','[data-room-activity=poker]']:
            item=control(mobile,selector) if selector.startswith('#zoom') else mobile.locator(selector)
            if not selector.startswith('#zoom') and mobile.locator('#scene-menu').evaluate('(e)=>e.open'):
                mobile.locator('#scene-menu > summary').click()
            assert item.evaluate('''(e)=>{const r=e.getBoundingClientRect();const hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return e===hit||e.contains(hit);}'''), 'Control covered by chrome: '+selector+' at '+str((width,height))
        mobile.screenshot(path=str(OUT/('refined-controls-'+str(width)+'-'+str(height)+'.png')))
    assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not errors,errors
    print('Passed: activity/computer close origins, exact view+zoom return, wheel/button bounds, visible mouse orbit, still/reduced motion, idle suspension, zoomed inspection and phone activity labels.',flush=True)
    browser.close()
