# Connected Study Implementation Plan

> **For agentic workers:** Implement this plan task by task in the current session. The user explicitly authorized completion without further input on 2026-10-29. Obtain an independent final review before delivery.

**Goal:** Replace the open-floor clubhouse with a believable connected study, gym, badminton hall and card lounge, and a working retro desktop.

**Architecture:** Retain ordinary HTML as the source of professional content. Move its sections into accessible, independent desktop windows only while enhanced; lazy-load a self-hosted Three.js building on intent. Route camera movement through an explicit graph of door thresholds so interrupted travel stays inside the building.

**Tech Stack:** Static HTML/CSS/JavaScript, pinned Three.js 0.186.1, Python Playwright, Node built-in assertions.

**Spec:** `docs/superpowers/specs/2026-10-29-connected-study-design.md`

## Global Constraints

- Keep the static HTML/CSS/JavaScript architecture and pinned local Three.js runtime.
- Runtime must not depend on third-party asset APIs or CDNs.
- Existing hash aliases, browser history, contact form behavior, case-study URLs, and source facts remain functional.
- BrainTrain's redesign stays explicitly unpublished.
- Keep explicit Enable sound activation, separate remembered music/effects volumes, mute, and hidden-tab pause.
- Camera motion is immediate under reduced motion.
- Keep the existing workflow and thresholds intact; run additional tests locally.
- Public origin: https://security-vu.netlify.app/. Push to the existing main branch without force.

## Review Focus

- Interrupt/reverse camera travel repeatedly: routes still pass through door openings.
- Minimize/close/switch desktop windows during asynchronous game loading: no orphan game or stale focus.
- Hidden tabs, reading windows and Simple view: room lighting/render work pauses; game timers stop.
- Missing textures/models or unavailable WebGL: professional navigation and ordinary HTML remain usable.
- Mobile, short laptops, no JavaScript and deep links: readable content with no horizontal overflow.

### Task 1: Building, assets, camera and atmosphere

**Files:** `js/clubhouse-scene.js`, `js/clubhouse-objects.js`, `js/study-navigation.mjs`, `assets/study/`, selected `js/vendor/addons/`, `scripts/test-navigation.mjs`.

**Interfaces:** `createScene({canvas,onInteract,onLocation,onReady})` returns `{go(name),useComputer(),setActive(bool),setQuality(bool),setStill(bool),dispose()}`. Named routes: study, desk, corridor, gym, badminton, lounge.

- [x] Implement and test a waypoint graph with routes through real thresholds, including interruption from an in-flight edge.
- [x] Preserve and optimize the downloaded CC0 furniture, PBR textures, HDR environments and computer. Record provenance and licenses.
- [x] Build full-height enclosed rooms with openings, believable furniture scales, directional daylight, contact shadows and optional lower graphics.
- [x] Implement picking, eased travel, reduced motion and a slow 18-minute clear/overcast cycle with Still morning and suspension.
- [x] Capture actual room screenshots at 1440x900 and 1280x720; inspect desk, gym, hall and lounge.

### Task 2: Retro desktop and preserved content

**Files:** `js/desktop.js`, `js/clubhouse.js`, `index.html`, `css/desktop.css`, `css/clubhouse.css`, `js/games/badminton.js`.

**Interfaces:** `createDesktop({onNavigate,onChange,onExit})` returns `{open(name),close(name),hide(),getState(),dispose()}`. Existing section nodes move into windows and return to their exact placeholders on close.

- [x] Build maximized Projects/Experience plus independent About, Notebook, Games, Contact, Sound and Help windows, taskbar, Start and PDF shortcuts.
- [x] Implement minimize, restore, maximize, close, safe dragging, stacking/focus, folder selection and responsive reading layouts.
- [x] Wire direct recruiter routes, history/aliases, lazy games with cancellation, Simple view and accessible keyboard/focus handling.
- [x] Preserve the actual Netlify form and all existing content; verify inputs and window dragging do not consume game/room keys.
- [x] Pause games and room rendering on minimized/hidden/reading surfaces.

### Task 3: Identity, loading and delivery

**Files:** `favicon.svg`, `favicon.ico`, raster icons, root HTML favicon links, `images/study-preview.webp`, `README.md`, `ASSET-CREDITS.md`, `scripts/test-clubhouse.py`.

- [x] Export the original VL mark at actual browser/touch sizes and update pages consistently.
- [x] Use a scene capture for the initial loading/sharing image, preserve lazy 3D and mobile Simple view without layout shifts.
- [x] Adapt browser acceptance coverage for rooms, window state/history, games, audio, forms, responsive layouts, reduced motion, missing assets, no JS and no WebGL.
- [x] Run `node scripts/validate-site.mjs`, `node scripts/test-games.mjs`, `node scripts/test-navigation.mjs`, Playwright and existing Lighthouse thresholds.
- [x] Obtain independent review, resolve material findings, document limitations, commit and push, inspect GitHub CI and the live site.

## Verification record

- Site validator: 15 pages, metadata, JSON-LD, local assets and links passed.
- Poker rules: all nine categories, ties, kickers, deck and opponent strategy passed.
- Camera graph: every room pair and every interrupted edge passed.
- Browser acceptance: production CSP, desktop controls/focus/history, original form, games, audio, aliases/malformed hashes, pending-load cancellation, responsive and reduced-motion paths, scene rendering suspension, missing dependencies/assets, no JavaScript and unavailable WebGL passed.
- Additional browser smoke checks cover lower graphics, light cycle/still mode, hidden-tab resume, Simple view suspension and 44px phone controls.
- Final local Lighthouse: performance 100, accessibility 100, best practices 100, SEO 100.
- Independent reviewer found five issues (keyboard window activation, pending-load rendering, malformed hashes, module-failure fallback and Escape cancellation); all were corrected and checked. Final review has no remaining material findings.
