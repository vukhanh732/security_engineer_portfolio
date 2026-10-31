"""Open the secondary controls disclosure as a visitor would, when needed."""
def reveal(page, target):
    if target.count() and not target.first.is_visible():
        if target.first.evaluate('(e)=>!!e.closest("#scene-menu")'):
            menu=page.locator('#scene-menu')
            if not menu.evaluate('(e)=>e.open'):
                menu.locator(':scope > summary').click()
    return target

def control(page, selector):
    return reveal(page,page.locator(selector))

def control_button(page, name):
    return reveal(page,page.get_by_role('button',name=name,exact=True,include_hidden=True))
