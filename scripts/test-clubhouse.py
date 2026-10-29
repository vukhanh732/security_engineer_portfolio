"""Connected-study acceptance checks against a local static server.

Requires Python Playwright + Chromium. Never submits the contact form.
Set CLUBHOUSE_TEST_URL to override http://127.0.0.1:4173.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CLUBHOUSE_TEST_URL', 'http://127.0.0.1:4173').rstrip('/')
OUT = Path('.superpowers/build')
OUT.mkdir(parents=True, exist_ok=True)
POLICY = re.search(r'Content-Security-Policy = "([^"]+)"', Path('netlify.toml').read_text()).group(1)

def expect_landing(page):
    expect(page.locator('#desktop')).to_be_visible()
    assert page.locator('[data-window]:visible').count() == 0, 'Computer skipped the wallpaper'
    expect(page.locator('#start-button')).to_be_focused()

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    context.add_init_script('''window.__played=[];const originalPlay=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){window.__played.push(this);return originalPlay.apply(this,arguments);};''')
    errors, missing = [], []

    def instrument(page):
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: missing.append(r.url) if r.status >= 400 and r.url.startswith(BASE) else None)
        def headers(route):
            response = route.fetch()
            route.fulfill(response=response, headers={**response.headers, 'Content-Security-Policy': POLICY})
        page.route(re.compile(re.escape(BASE) + r'/(?:$|index\.html(?:\?.*)?$)'), headers)
        return page

    page = instrument(context.new_page())
    page.goto(BASE, wait_until='networkidle')
    assert page.evaluate('window.__played.length') == 0, 'Audio started without activation'
    assert not page.evaluate('performance.getEntriesByType("resource").some(r=>r.name.includes("/assets/desk/"))'), 'Heavy scene loaded before intent'
    # The primary computer works immediately, before 3D has initialized.
    page.locator('#explore').click()
    expect_landing(page)
    assert not page.evaluate('performance.getEntriesByType("resource").some(r=>r.name.includes("/assets/desk/"))')
    page.keyboard.press('Escape')
    # Recruiter shortcuts work without downloading the renderer or room assets.
    page.locator('.main-nav a[href="#projects"]').click()
    projects = page.locator('[data-window=projects]')
    expect(projects).to_be_visible()
    assert 'maximized' in projects.get_attribute('class')
    expect(projects.locator('[data-project-file=braintrain]')).to_be_visible()
    for name in ['sentrynode', 'wazuh', 'gatekeeper', 'braintrain']:
        projects.locator('[data-project='+name+']').click()
        expect(projects.locator('[data-project-file='+name+']')).to_be_visible()
        assert projects.locator('[data-project-file]:visible').count() == 1
    assert not page.evaluate('performance.getEntriesByType("resource").some(r=>r.name.includes("/assets/desk/"))')
    page.screenshot(path=str(OUT/'projects-desktop.png'))
    projects.locator('a[href="#experience"]').click()
    experience = page.locator('[data-window=experience]')
    expect(experience).to_be_visible()
    assert float(experience.locator('.timeline-list').first.evaluate('(e)=>getComputedStyle(e).fontSize').replace('px','')) >= 17
    expect(experience.get_by_text('Cybercore Solutions', exact=True)).to_be_visible()
    page.screenshot(path=str(OUT/'experience-desktop.png'))
    page.go_back()
    expect(projects).to_have_class(re.compile('is-active'))
    # Keyboard focus raises a previously covered window.
    experience.locator('h2').focus()
    expect(experience).to_have_class(re.compile('is-active'))
    projects.locator('h2').focus()
    expect(projects).to_have_class(re.compile('is-active'))
    # Independent windows preserve their contents when minimized/restored.
    page.get_by_role('button', name='Minimize My Projects', exact=True).first.click()
    expect(projects).not_to_be_visible()
    page.locator('[data-task=projects]').click()
    expect(projects).to_be_visible()
    page.get_by_role('button', name='Restore My Projects', exact=True).click()
    assert 'maximized' not in projects.get_attribute('class')
    bar = projects.locator('.title-bar')
    rect = bar.bounding_box()
    page.mouse.move(rect['x']+80, rect['y']+15);page.mouse.down();page.mouse.move(rect['x']+135,rect['y']+65,steps=5);page.mouse.up()
    assert projects.evaluate('(e)=>e.style.left')
    page.get_by_role('button', name='Maximize My Projects', exact=True).click()
    assert projects.evaluate('(e)=>e.style.left') == ''
    page.get_by_role('button', name='Close My Projects', exact=True).click()
    expect(projects).to_have_count(0)
    assert page.locator('#main-content #projects').count() == 1
    assert page.locator('#projects [data-project-file][hidden]').count() == 0
    page.keyboard.press('Escape')
    expect(page.locator('#desktop')).not_to_be_visible()
    # Complete poker round, keyboard hold, cards stay unique, redeal.
    page.goto(BASE+'/#poker', wait_until='networkidle')
    page.locator('#your-hand button').first.wait_for()
    card = page.locator('#your-hand button').first
    original = card.locator('img').get_attribute('src')
    card.focus();page.keyboard.press('Space')
    expect(page.locator('#your-hand button').first).to_be_focused()
    expect(page.locator('#your-hand button').first).to_have_attribute('aria-pressed','true')
    page.get_by_role('button',name='Draw 4 & reveal',exact=True).click()
    expect(page.locator('#poker-draw')).to_be_disabled()
    assert page.locator('#your-hand img').first.get_attribute('src') == original
    faces = page.locator('.playing-card img').evaluate_all('(images)=>images.map(i=>i.src)')
    assert len(faces) == 10 and len(set(faces)) == 10 and all('Back' not in src for src in faces)
    page.get_by_role('button',name='New hand',exact=True).click()
    page.screenshot(path=str(OUT/'poker-desktop.png'))
    page.keyboard.press('Escape')
    # Badminton plays a real rally and pauses when its window is minimized.
    page.goto(BASE+'/#badminton', wait_until='networkidle')
    game=page.locator('.badminton-canvas');game.wait_for()
    page.get_by_role('button',name='Serve / swing',exact=True).click()
    page.wait_for_function('() => document.querySelector(".badminton-canvas").dataset.receiver === "player"')
    landing=float(game.get_attribute('data-target-x'));bounds=game.bounding_box()
    page.mouse.click(bounds['x']+(150+landing*600)/900*bounds['width'],bounds['y']+(30+.87*530)/600*bounds['height'])
    for _ in range(12):
        page.keyboard.press('Space');page.wait_for_timeout(140)
    assert int(game.get_attribute('data-rally')) >= 3, 'Player could not return the shuttle'
    page.wait_for_function('() => document.querySelector("#bot-score").textContent !== "0"',timeout=12000)
    page.get_by_role('button',name='Minimize Badminton',exact=True).first.click()
    score=page.locator('#bot-score').text_content();page.wait_for_timeout(300)
    assert page.locator('#bot-score').text_content() == score
    page.locator('[data-task=badminton]').click()
    page.get_by_role('button',name='New match',exact=True).click()
    expect(page.locator('#your-score')).to_have_text('0');expect(page.locator('#bot-score')).to_have_text('0')
    page.screenshot(path=str(OUT/'badminton-desktop.png'))
    page.get_by_role('button',name='Close Badminton',exact=True).click()
    assert page.locator('.badminton-canvas').count() == 0
    page.keyboard.press('Escape')
    # Audio activation, remembered independent volumes, mute and hidden-tab pause.
    page.get_by_role('button',name='Enable sound',exact=True).first.click()
    page.wait_for_function('() => window.__played.some(a=>a.src.includes("sunset-walk")&&!a.paused&&a.currentTime>0)')
    page.locator('.world-settings a[href="#sound"]').click()
    page.get_by_label('Background music').fill('8');page.get_by_label('Sound effects').fill('0')
    assert page.evaluate('window.__played.find(a=>a.src.includes("sunset-walk")).volume') == .08
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
    assert page.evaluate('window.__played.every(a=>a.paused||a.ended)')
    page.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
    page.locator('#audio-master').click()
    assert page.evaluate('window.__played.every(a=>a.paused||a.ended)')
    page.keyboard.press('Escape')
    # Contact form structure and inputs stay intact through reparenting.
    page.locator('.main-nav a[href="#contact"]').click()
    page.get_by_label('Name',exact=True).fill('Browser check')
    page.get_by_label('Message',exact=True).fill('Arrow keys and WASD stay in this field.')
    page.keyboard.press('ArrowLeft')
    assert page.locator('form[name=contact]').get_attribute('data-netlify') == 'true'
    expect(page.locator('a[href="tel:+61424725899"]')).to_be_visible()
    page.keyboard.press('Escape')
    page.goto(BASE+'/#%E0%A4%A',wait_until='networkidle')
    page.locator('.main-nav a[href="#projects"]').click()
    expect(page.locator('[data-window=projects]')).to_be_visible()
    page.keyboard.press('Escape')
    # Existing aliases and simple view restore the actual sections, all games.
    page.goto(BASE+'/#skills',wait_until='networkidle')
    expect(page.locator('[data-window=about] #skills')).to_be_visible()
    page.keyboard.press('Escape')
    page.get_by_role('button',name='Simple view',exact=True).click()
    expect(page.locator('#main-content #projects')).to_be_visible()
    expect(page.locator('#main-content #experience')).to_be_visible()
    expect(page.locator('#badminton-mount a[href="#badminton"]')).to_be_visible()
    expect(page.locator('#poker-mount a[href="#poker"]')).to_be_visible()
    assert page.locator('#main-content [data-project-file][hidden]').count() == 0
    page.get_by_role('button',name='Computer',exact=True).click()
    expect_landing(page)
    page.locator('.desktop-icons [data-app=projects]').click()
    expect(page.locator('[data-window=projects]')).to_be_visible()
    page.locator('[data-window=projects] a[href="#experience"]').click()
    expect(page.locator('[data-window=experience]')).to_be_visible()
    page.get_by_role('button',name='Back to the room ↙',exact=True).click()
    expect(page.locator('#main-content #projects')).to_be_visible()
    expect(page.locator('#main-content #experience')).to_be_visible()
    # Escape also cancels destinations queued before createScene resolves.
    scene_stub='''export async function createScene(options){await new Promise(resolve=>window.__releaseScene=resolve);const api={go(name){window.__trips=(window.__trips||[]).concat(name);return Promise.resolve(true)},useComputer(){window.__opened=true;options.onInteract('projects')},setActive(){},setQuality(){},setStill(){},getState(){return{node:'study'}}};options.canvas.dataset.ready='true';options.onReady(true);return api;}'''
    for selector, open_desktop in [('#explore',False),('[data-room=gym]',False),('[data-room=gym]',True)]:
        pending=instrument(context.new_page())
        pending.route('**/js/clubhouse-scene.js*',lambda route:route.fulfill(status=200,content_type='text/javascript',body=scene_stub))
        pending.goto(BASE,wait_until='networkidle');pending.locator('.world').dispatch_event('pointermove')
        pending.wait_for_function('() => typeof window.__releaseScene === "function"')
        pending.locator(selector).click()
        if open_desktop:
            pending.get_by_role('button',name='Computer',exact=True).click()
            expect_landing(pending)
        pending.keyboard.press('Escape');pending.evaluate('window.__releaseScene()')
        pending.locator('#world-canvas[data-ready=true]').wait_for()
        pending.wait_for_timeout(100)
        assert pending.evaluate('!window.__opened && !window.__trips'), 'Escape failed to cancel a pending destination'
        expect(pending.locator('#desktop')).not_to_be_visible()
        pending.close()
    # Mobile starts with readable HTML, downloads no room/preview, no overflow.
    mobile=instrument(context.new_page());mobile.set_viewport_size({'width':390,'height':844})
    mobile.goto(BASE,wait_until='networkidle')
    expect(mobile.locator('#main-content #projects')).to_be_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth<=innerWidth')
    assert not mobile.evaluate('performance.getEntriesByType("resource").some(r=>r.name.includes("/assets/desk/")||r.name.includes("desk-preview.webp"))')
    mobile.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
    mobile.get_by_role('button',name='Computer',exact=True).click()
    expect_landing(mobile)
    mobile.screenshot(path=str(OUT/'computer-landing-mobile.png'))
    mobile.locator('.desktop-icons [data-app=projects]').click()
    expect(mobile.locator('[data-window=projects]')).to_be_visible()
    assert mobile.locator('[data-window=projects]').evaluate('(e)=>e.scrollWidth<=e.clientWidth')
    mobile.screenshot(path=str(OUT/'desktop-mobile.png'))
    mobile.keyboard.press('Escape')
    mobile.goto(BASE+'/#poker',wait_until='networkidle');mobile.locator('#your-hand button').first.wait_for()
    mobile.screenshot(path=str(OUT/'poker-mobile.png'),full_page=True)
    mobile.goto(BASE+'/braintrain.html',wait_until='networkidle');mobile.get_by_role('button',name='Toggle menu',exact=True).click()
    expect(mobile.locator('.mobile-panel')).to_be_visible();mobile.screenshot(path=str(OUT/'inner-mobile.png'),full_page=True)
    print('Passed: desktop, history, games, audio, forms, aliases, simple/mobile views.',flush=True)
    # Real room, all destinations, reading/visibility suspension and reduced motion.
    room_context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce',device_scale_factor=2)
    room=instrument(room_context.new_page())
    held=[]
    room.route('**/desk/world.glb',lambda route:held.append(route))
    room.goto(BASE,wait_until='domcontentloaded');room.locator('.world').hover()
    canvas=room.locator('#world-canvas')
    for _ in range(200):
        if held: break
        room.wait_for_timeout(100)
    assert held, 'Room load did not reach the furniture request'
    room.locator('.main-nav a[href="#experience"]').click();room.wait_for_timeout(300)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(700)
    assert canvas.get_attribute('data-renders') == renders, 'Pending room load rendered behind a recruiter app'
    assert canvas.get_attribute('data-ready') is None
    for request in held:request.continue_()
    room.locator('#world-canvas[data-ready=true]').wait_for(timeout=120000)
    room.keyboard.press('Escape')
    artwork=room.evaluate('performance.getEntriesByType("resource").filter(r=>r.name.includes("/assets/desk/"))')
    assert len(artwork)==6, 'Desk artwork request count exceeded its budget'
    assert sum(r['encodedBodySize'] for r in artwork)<2_000_000, 'Desk artwork exceeds 2 MB'
    assert not room.evaluate('performance.getEntriesByType("resource").some(r=>/HDRLoader|SSAOPass|EffectComposer|assets\/study/.test(r.name))'), 'Heavy rendering path was requested'
    assert canvas.evaluate('(c)=>c.width===Math.round(c.clientWidth*2)&&c.height===Math.round(c.clientHeight*2)'), 'Retina canvas was undersized'
    for name in ['gym','badminton','lounge','study']:
        room.locator('[data-room='+name+']').click()
        expect(canvas).to_have_attribute('data-location',name)
        expect(canvas).to_have_attribute('data-traveling','false')
        room.wait_for_timeout(150);room.screenshot(path=str(OUT/('room-'+name+'.png')))
        if name == 'badminton':
            room.get_by_role('button',name='Play a match ↗',exact=True).click()
            expect(room.locator('[data-window=badminton]')).to_be_visible()
            room.keyboard.press('Escape')
            expect(canvas).to_have_attribute('data-node','badminton')
    # Actual desk/computer picking opens the desktop, as well as its text control.
    point=room.evaluate('''() => {const c=document.querySelector('#world-canvas');for(let y=330;y<650;y+=30)for(let x=400;x<1000;x+=30){c.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y}));if(c.dataset.hover==='Use the computer')return {x,y};}return null;}''')
    assert point, 'The computer/desk had no usable interaction surface'
    room.locator('[data-room=gym]').click();canvas.focus();room.keyboard.press('e')
    room.wait_for_timeout(100)
    expect(canvas).to_have_attribute('data-location','gym')
    expect(room.locator('#desktop')).not_to_be_visible()
    room.locator('[data-room=study]').click()
    room.mouse.click(point['x'],point['y'])
    expect_landing(room)
    room.keyboard.press('Escape')
    room.get_by_role('button',name='Home, return to the desk',exact=True).click()
    room.locator('.main-nav a[href="#experience"]').click();room.wait_for_timeout(300)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(700)
    assert canvas.get_attribute('data-renders') == renders, 'Room rendered while reading'
    room.keyboard.press('Escape')
    style=room.add_style_tag(content='.site-header,.world-toolbar,.clubhouse-footer,.room-heading,.world-loading,.skip-link,.world:after{display:none!important}')
    room.screenshot(path=str(OUT/'study-loading-source.png'))
    style.evaluate('(e)=>e.remove()')
    room.set_viewport_size({'width':1280,'height':720});room.wait_for_timeout(250)
    room.screenshot(path=str(OUT/'room-laptop.png'))
    room.get_by_role('button',name='Use computer ↗',exact=True).click()
    expect_landing(room)
    room.screenshot(path=str(OUT/'desktop-laptop.png'))
    room.keyboard.press('Escape')
    # Real animated travel can be interrupted and reversed without stale actions.
    room.emulate_media(reduced_motion='no-preference')
    room.locator('[data-room=gym]').click();room.wait_for_timeout(300)
    room.locator('[data-room=badminton]').click();room.wait_for_timeout(300)
    room.locator('[data-room=study]').click()
    expect(canvas).to_have_attribute('data-node','study',timeout=30000)
    expect(canvas).to_have_attribute('data-traveling','false',timeout=30000)
    room.locator('[data-room=gym]').click();room.wait_for_timeout(200)
    room.locator('.main-nav a[href="#projects"]').click();room.keyboard.press('Escape')
    room.wait_for_timeout(1200)
    expect(room.locator('#desktop')).not_to_be_visible()
    # Changing accessibility preferences during a computer approach preserves intent.
    room.get_by_role('button',name='Use computer ↗',exact=True).click()
    expect(canvas).to_have_attribute('data-traveling','true')
    room.emulate_media(reduced_motion='reduce')
    expect_landing(room)
    room.keyboard.press('Escape')
    room.locator('.world-settings a[href="#help"]').click();room.locator('#quality-toggle').click()
    expect(canvas).to_have_attribute('data-quality','low')
    room.keyboard.press('Escape')
    before=int(canvas.get_attribute('data-renders'))
    room.get_by_role('button',name='Home, return to the desk',exact=True).click()
    room.wait_for_function('(before) => Number(document.querySelector("#world-canvas").dataset.renders)>before',arg=before)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(600)
    assert canvas.get_attribute('data-renders')==renders, 'Idle baked scene kept rendering'
    # Props work from keyboard-friendly controls and from the actual meshes.
    room.set_viewport_size({'width':1440,'height':900})
    room.get_by_role('button',name='Home, return to the desk',exact=True).click()
    def prop(name):
        room.locator('.desk-objects summary').click()
        room.locator('[data-prop='+name+']').click()
        expect(canvas).to_have_attribute('data-inspection', name)
        expect(room.locator('#put-back')).to_be_focused()
    for name, label in [('drawer','Open or close the drawer'),('coffee','Pick up the coffee cup'),('book','Pick up the textbook'),('plant','Give the plant a nudge')]:
        # Find each object's own raycast surface without changing the camera.
        point=room.evaluate('''(label) => {const c=document.querySelector('#world-canvas');for(let y=200;y<770;y+=8)for(let x=360;x<1100;x+=8){c.dispatchEvent(new PointerEvent('pointermove',{clientX:x,clientY:y}));if(c.dataset.hover===label)return {x,y};}return null;}''',label)
        assert point, 'No clickable mesh for '+name
        room.mouse.click(point['x'],point['y'])
        expect(canvas).to_have_attribute('data-inspection',name)
        expect(room.locator('#object-inspector')).to_be_visible()
        if name == 'drawer': expect(canvas).to_have_attribute('data-drawer','true')
        if name == 'coffee': expect(room.locator('#object-description')).to_have_text('Hmmm, just a regular coffee cup.')
        room.screenshot(path=str(OUT/('inspect-'+name+'.png')))
        room.keyboard.press('Escape')
        expect(room.locator('#object-inspector')).not_to_be_visible()
        expect(canvas).to_have_attribute('data-inspection','')
    expect(canvas).to_have_attribute('data-drawer','false')
    # Reduced motion suppresses camera following and plant sway.
    neutral=canvas.get_attribute('data-position')
    room.mouse.move(1200,200);room.wait_for_timeout(150)
    assert canvas.get_attribute('data-position')==neutral
    prop('plant');expect(canvas).to_have_attribute('data-plant-motion','false')
    room.locator('#put-back').click()
    # With normal motion the camera follows, settles, and stops rendering.
    room.emulate_media(reduced_motion='no-preference')
    room.mouse.move(1200,200)
    room.wait_for_function('(before) => document.querySelector("#world-canvas").dataset.position !== before',arg=neutral)
    room.wait_for_timeout(1500)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(350)
    assert canvas.get_attribute('data-renders')==renders, 'Mouse-follow never settled'
    room.mouse.move(300,400);room.wait_for_timeout(1500)
    assert canvas.get_attribute('data-position')!=neutral
    # Picking up one object returns the previous one; the camera stays still.
    prop('coffee');room.wait_for_timeout(800)
    position=canvas.get_attribute('data-position')
    room.mouse.move(1200,200);room.wait_for_timeout(150)
    assert canvas.get_attribute('data-position')==position, 'Camera moved during inspection'
    prop('book');room.wait_for_timeout(800)
    room.locator('#put-back').click();room.wait_for_timeout(1500)
    prop('plant');expect(canvas).to_have_attribute('data-plant-motion','true')
    expect(canvas).to_have_attribute('data-plant-motion','false',timeout=5000)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(350)
    assert canvas.get_attribute('data-renders')==renders, 'Plant kept rendering after sway'
    room.locator('#put-back').click()
    # Accessibility changes finish active object animation immediately.
    prop('coffee');room.emulate_media(reduced_motion='reduce');room.wait_for_timeout(200)
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(350)
    assert canvas.get_attribute('data-renders')==renders
    room.locator('#put-back').click()
    # Leaving the scene or hiding the tab safely returns held objects.
    prop('book');room.locator('[data-room=gym]').click()
    expect(room.locator('#object-inspector')).not_to_be_visible()
    room.locator('[data-room=study]').click();prop('coffee')
    room.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>true});document.dispatchEvent(new Event("visibilitychange"))')
    expect(room.locator('#object-inspector')).not_to_be_visible()
    renders=canvas.get_attribute('data-renders');room.wait_for_timeout(350)
    assert canvas.get_attribute('data-renders')==renders
    room.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
    # An open drawer survives a visit away, and can then be closed by clicking.
    prop('drawer');room.locator('[data-room=gym]').click();room.locator('[data-room=study]').click()
    expect(canvas).to_have_attribute('data-drawer','true')
    room.locator('.desk-objects summary').click();room.locator('[data-prop=drawer]').click()
    expect(canvas).to_have_attribute('data-drawer','false')
    # Re-entering the computer lands on wallpaper even with existing windows.
    room.locator('.main-nav a[href="#projects"]').click()
    room.locator('[data-project=wazuh]').click();room.keyboard.press('Escape')
    room.get_by_role('button',name='Computer',exact=True).click();expect_landing(room)
    room.locator('[data-task=projects]').click()
    expect(room.locator('[data-window=projects] [data-project-file=wazuh]')).to_be_visible()
    room.screenshot(path=str(OUT/'projects-personal.png'))
    room.keyboard.press('Escape')
    room.get_by_role('button',name='Home, return to the desk',exact=True).click()
    room.emulate_media(reduced_motion='no-preference')
    # A prop chosen during travel cancels the old destination, including a
    # pending computer approach. The last explicit selection wins.
    for destination in ['#explore','[data-room=gym]']:
        room.locator(destination).click()
        expect(canvas).to_have_attribute('data-traveling','true')
        room.evaluate('document.querySelector(".desk-objects").open=true;document.querySelector("[data-prop=coffee]").click()')
        expect(canvas).to_have_attribute('data-inspection','coffee',timeout=5000)
        expect(canvas).to_have_attribute('data-location','study')
        expect(room.locator('#desktop')).not_to_be_visible()
        room.locator('#put-back').click()
    # Cancel after a fade has already revealed its destination. Resuming must
    # preserve that composition rather than restoring the prior scene's pose.
    room.locator('[data-room=gym]').click()
    room.wait_for_function('() => {const c=document.querySelector("#world-canvas");return c.dataset.node==="gym"&&c.dataset.traveling==="true";}')
    position=room.evaluate('''() => {const c=document.querySelector('#world-canvas');const position=c.dataset.position;Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));return position;}''')
    room.wait_for_timeout(150)
    room.evaluate('Object.defineProperty(document,"hidden",{configurable:true,get:()=>false});document.dispatchEvent(new Event("visibilitychange"))')
    room.wait_for_timeout(200)
    assert canvas.get_attribute('data-position')==position, 'Interrupted fade restored a stale camera pose'
    expect(canvas).to_have_attribute('data-location','gym')
    # Phone inspection fits around the header/panel, including short screens.
    room.emulate_media(reduced_motion='reduce')
    room.locator('[data-room=study]').click()
    for height in [844,568]:
        room.set_viewport_size({'width':390,'height':height})
        prop('book')
        panel=room.locator('#object-inspector')
        assert panel.evaluate('(e)=>e.scrollHeight<=e.clientHeight+1'), 'Inspection action was clipped on a short phone'
        assert room.evaluate('document.documentElement.scrollWidth<=innerWidth')
        room.screenshot(path=str(OUT/('inspect-phone-'+str(height)+'.png')))
        room.locator('#put-back').click()
    prop('coffee');room.set_viewport_size({'width':844,'height':390})
    expect(room.locator('#object-inspector')).not_to_be_visible()
    expect(canvas).to_have_attribute('data-inspection','')
    print('Passed: destinations, travel, picking, parallax, props, reduced motion, idle/hidden suspension and wallpaper landing.',flush=True)
    room_context.close()
    # A failed enhancement dependency exposes the ordinary portfolio, rather than
    # leaving the fixed loading image over otherwise functional HTML.
    failed_module=browser.new_context(viewport={'width':1280,'height':800})
    module_page=failed_module.new_page()
    module_page.route('**/js/desktop.js*',lambda route:route.abort())
    module_page.goto(BASE,wait_until='networkidle')
    expect(module_page.locator('html')).not_to_have_class(re.compile(r'\bjs\b'))
    module_page.locator('.main-nav a[href="#projects"]').click()
    heading=module_page.locator('#projects h2')
    expect(heading).to_be_in_viewport()
    assert heading.evaluate('(e)=>{const r=e.getBoundingClientRect();return document.elementFromPoint(r.left+10,r.top+10)===e;}')
    failed_module.close()
    # Ordinary content survives no JavaScript, failed WebGL and missing desk artwork.
    nojs=browser.new_context(java_script_enabled=False,viewport={'width':1280,'height':800})
    plain=instrument(nojs.new_page());plain.goto(BASE,wait_until='networkidle')
    expect(plain.locator('#projects')).to_be_visible();expect(plain.locator('#experience')).to_be_visible()
    plain.screenshot(path=str(OUT/'no-javascript.png'))
    failing=browser.new_context(viewport={'width':1280,'height':800})
    failing.add_init_script('const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes("webgl")?null:get.call(this,type,...args)}')
    fallback=instrument(failing.new_page());fallback.goto(BASE,wait_until='networkidle');fallback.locator('.world').dispatch_event('pointermove')
    fallback.wait_for_function('() => document.body.classList.contains("simple-view")')
    expect(fallback.locator('#main-content #projects')).to_be_visible()
    broken_context=browser.new_context(viewport={'width':1280,'height':720},reduced_motion='reduce')
    broken=instrument(broken_context.new_page());broken.route('**/desk/decor.glb',lambda route:route.abort())
    broken.goto(BASE,wait_until='networkidle');broken.locator('.world').dispatch_event('pointermove');broken.wait_for_function('() => document.body.classList.contains("simple-view")')
    expect(broken.locator('#main-content #projects')).to_be_visible()
    assert not errors, errors
    assert not missing, missing
    print('Passed: production CSP, no-JS, failed WebGL, missing desk artwork; no runtime errors or unexpected missing assets.',flush=True)
    browser.close()
