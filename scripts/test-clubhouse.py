"""Browser acceptance checks. Run against a static server on port 4173.

Requires Python Playwright and its Chromium browser. No changes are submitted
to the contact form and no external services are written to.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('CLUBHOUSE_TEST_URL', 'http://127.0.0.1:4173')
OUT = Path('.superpowers/build')
OUT.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, args=['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 1440, 'height': 900}, device_scale_factor=1)
    context.add_init_script('''window.__played = []; const originalPlay = HTMLMediaElement.prototype.play; HTMLMediaElement.prototype.play = function(){window.__played.push(this); return originalPlay.apply(this, arguments);};''')
    page = context.new_page()
    policy = re.search(r'Content-Security-Policy = "([^"]+)"', Path('netlify.toml').read_text()).group(1)
    def production_headers(route):
        response = route.fetch()
        route.fulfill(response=response, headers={**response.headers, 'Content-Security-Policy': policy})
    page.route(BASE+'/', production_headers)
    errors, missing = [], []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: missing.append(r.url) if r.status >= 400 and r.url.startswith(BASE) else None)
    page.goto(BASE, wait_until='networkidle')
    page.locator('#world-canvas[data-ready=true]').wait_for(timeout=45000)
    expect(page.locator('.world')).to_have_class(re.compile('is-ready'))
    assert page.evaluate('window.__played.length') == 0, 'Sound started without activation'
    page.screenshot(path=str(OUT/'home-desktop.png'), full_page=True, animations='disabled')
    # Native scene movement and camera controls.
    page.get_by_role('button', name='Explore the room', exact=True).click()
    canvas = page.locator('#world-canvas')
    start = canvas.get_attribute('data-position')
    page.keyboard.down('s')
    page.wait_for_function('() => document.querySelector("#world-canvas").dataset.position !== ' + repr(start))
    page.keyboard.up('s')
    moved = canvas.get_attribute('data-position')
    assert moved != start
    page.get_by_role('button', name='Home', exact=True).click()
    canvas.focus()
    page.keyboard.down('w')
    page.wait_for_timeout(4500)
    page.keyboard.up('w')
    x, z = map(float, canvas.get_attribute('data-position').split(','))
    assert -3.5 < z < .7, f'Explorer crossed desk collision boundary: {x}, {z}'
    page.get_by_role('button', name='Home', exact=True).click()
    camera = canvas.get_attribute('data-camera')
    box = canvas.bounding_box()
    page.mouse.move(box['x']+box['width']*.45, box['y']+box['height']*.3)
    page.mouse.down(); page.mouse.move(box['x']+box['width']*.65, box['y']+box['height']*.35, steps=8); page.mouse.up()
    page.wait_for_function('() => document.querySelector("#world-canvas").dataset.camera !== ' + repr(camera))
    page.get_by_role('button', name='Home', exact=True).click()
    # Portfolio shortcuts remain reachable even while a dialog is open.
    page.locator('.main-nav a[href="#projects"]').click()
    expect(page.locator('#content-panel #projects')).to_be_visible()
    expect(page.get_by_text('Featured · redesign in progress', exact=True)).to_be_visible()
    page.locator('.panel-nav a[href="#experience"]').click()
    expect(page.locator('#content-panel #experience')).to_be_visible()
    expect(page.locator('.panel-nav a[href="resume.pdf"]')).to_be_visible()
    page.go_back()
    expect(page.locator('#content-panel #projects')).to_be_visible()
    page.keyboard.press('Escape')
    expect(page.locator('#content-panel')).not_to_be_visible()
    # Poker: keyboard hold, one draw, reveal, and another hand.
    page.locator('[data-landmark="poker"]').click()
    page.locator('#your-hand button').first.wait_for()
    card = page.locator('#your-hand button').first
    original = card.locator('img').get_attribute('src')
    card.focus(); page.keyboard.press('Space')
    expect(page.locator('#your-hand button').first).to_be_focused()
    expect(page.locator('#your-hand button').first).to_have_attribute('aria-pressed', 'true')
    page.get_by_role('button', name='Draw 4 & reveal', exact=True).click()
    expect(page.locator('#poker-draw')).to_be_disabled()
    assert page.locator('#your-hand img').first.get_attribute('src') == original
    assert all('Back' not in src for src in page.locator('#house-hand img').evaluate_all('(images)=>images.map(i=>i.src)'))
    assert len(set(page.locator('.playing-card img').evaluate_all('(images)=>images.map(i=>i.src)'))) == 10
    page.get_by_role('button', name='New hand', exact=True).click()
    expect(page.get_by_role('button', name='Draw 5 & reveal', exact=True)).to_be_enabled()
    page.screenshot(path=str(OUT/'poker-desktop.png'), full_page=True, animations='disabled')
    page.keyboard.press('Escape')
    # Badminton: serve, actual opponent return, missed point, pause and reset.
    page.locator('[data-landmark="badminton"]').click()
    game = page.locator('.badminton-canvas')
    game.wait_for()
    page.get_by_role('button', name='Serve / swing', exact=True).click()
    page.wait_for_function('() => document.querySelector(".badminton-canvas").dataset.receiver === "player"')
    landing_x = float(game.get_attribute('data-target-x'))
    bounds = game.bounding_box()
    page.mouse.move(bounds['x'] + (150 + landing_x * 600) / 900 * bounds['width'], bounds['y'] + (30 + .87 * 530) / 600 * bounds['height'])
    page.mouse.down(); page.mouse.up()
    for _ in range(12):
        page.keyboard.press('Space')
        page.wait_for_timeout(140)
    assert int(game.get_attribute('data-rally')) >= 3, 'Player could not return the shuttle'
    page.wait_for_function('() => document.querySelector("#bot-score").textContent !== "0"', timeout=12000)
    page.get_by_role('button', name='Pause', exact=True).click()
    expect(page.get_by_role('button', name='Resume', exact=True)).to_be_visible()
    page.get_by_role('button', name='New match', exact=True).click()
    expect(page.locator('#your-score')).to_have_text('0'); expect(page.locator('#bot-score')).to_have_text('0')
    page.screenshot(path=str(OUT/'badminton-desktop.png'), full_page=True, animations='disabled')
    page.keyboard.press('Escape')
    # Audio is real playback, and each volume applies independently.
    page.get_by_role('button', name='Enable sound', exact=True).click()
    page.wait_for_function('() => window.__played.some(a=>a.src.includes("sunset-walk") && !a.paused && a.currentTime>0)')
    page.locator('.world-settings a[href="#sound"]').click()
    page.get_by_label('Background music').fill('8')
    page.get_by_label('Sound effects').fill('0')
    assert page.evaluate('window.__played.find(a=>a.src.includes("sunset-walk")).volume') == .08
    page.locator('#audio-master').click()
    assert page.evaluate('window.__played.every(a=>a.paused || a.ended)')
    page.keyboard.press('Escape')
    # Form keys do not move the explorer; the Netlify form is retained.
    position = canvas.get_attribute('data-position')
    page.locator('.main-nav a[href="#contact"]').click()
    page.get_by_label('Name', exact=True).fill('Browser check')
    page.get_by_label('Message', exact=True).fill('WASD and arrow keys stay in this field.')
    page.keyboard.press('ArrowLeft')
    assert canvas.get_attribute('data-position') == position
    assert page.locator('form').get_attribute('data-netlify') == 'true'
    expect(page.locator('a[href="tel:+61424725899"]')).to_be_visible()
    page.keyboard.press('Escape')
    # Existing aliases work; static view restores every section.
    page.goto(BASE+'/#skills', wait_until='networkidle')
    expect(page.locator('#content-panel #about')).to_be_visible()
    page.keyboard.press('Escape')
    page.get_by_role('button', name='Simple view', exact=True).click()
    expect(page.locator('#main-content #projects')).to_be_visible()
    expect(page.locator('#main-content #experience')).to_be_visible()
    expect(page.locator('#badminton-mount a[href="#badminton"]')).to_be_visible()
    expect(page.locator('#poker-mount a[href="#poker"]')).to_be_visible()
    page.reload(wait_until='networkidle')
    assert page.get_by_label('Background music').input_value() == '8'
    assert page.get_by_label('Sound effects').input_value() == '0'
    # Mobile starts with readable projects; room and games are still reachable.
    mobile = context.new_page()
    mobile.set_viewport_size({'width': 390, 'height': 844})
    mobile.goto(BASE, wait_until='networkidle')
    expect(mobile.locator('#main-content #projects')).to_be_visible()
    assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
    mobile.screenshot(path=str(OUT/'home-mobile.png'), full_page=True, animations='disabled')
    mobile.get_by_role('button', name='Explore 3D clubhouse', exact=True).click()
    mobile.locator('#world-canvas[data-ready=true]').wait_for(timeout=45000)
    mobile.get_by_role('button', name='Explore the room', exact=True).click()
    expect(mobile.get_by_role('button', name='Move forward', exact=True)).to_be_visible()
    mobile.screenshot(path=str(OUT/'room-mobile.png'), full_page=True, animations='disabled')
    mobile.goto(BASE+'/#poker', wait_until='networkidle')
    mobile.locator('#your-hand button').first.wait_for()
    mobile.screenshot(path=str(OUT/'poker-mobile.png'), full_page=True, animations='disabled')
    # The inner-page mobile menu uses the new readable palette.
    mobile.goto(BASE+'/braintrain.html', wait_until='networkidle')
    mobile.get_by_role('button', name='Toggle menu', exact=True).click()
    expect(mobile.locator('.mobile-panel')).to_be_visible()
    assert mobile.locator('.mobile-link').first.evaluate('(e)=>getComputedStyle(e).color') == 'rgb(55, 75, 57)'
    mobile.screenshot(path=str(OUT/'inner-mobile.png'), full_page=True, animations='disabled')
    # Ordinary content survives without JavaScript and failed WebGL.
    nojs = browser.new_context(java_script_enabled=False, viewport={'width': 1280, 'height': 800})
    plain = nojs.new_page(); plain.goto(BASE, wait_until='networkidle')
    expect(plain.locator('#projects')).to_be_visible(); expect(plain.locator('#experience')).to_be_visible()
    plain.screenshot(path=str(OUT/'no-javascript.png'), full_page=True)
    failing = browser.new_context(viewport={'width': 1280, 'height': 800})
    failing.add_init_script('const get=HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes("webgl")?null:get.call(this,type,...args)}')
    fallback = failing.new_page(); fallback.goto(BASE, wait_until='networkidle')
    fallback.wait_for_function('() => document.body.classList.contains("simple-view")')
    expect(fallback.locator('#projects')).to_be_visible()
    assert not errors, errors
    assert not missing, missing
    print('Verified: 3D movement/collisions/orbit, panel navigation/history/focus, complete poker round, badminton return/scoring/reset, audio playback/mute/volumes, forms, aliases, mobile/inner menu, no-JS and WebGL failure.')
    browser.close()
