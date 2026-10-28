# Clubhouse Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Ship an original, explorable 3D personal portfolio with recruiter shortcuts, playable badminton/poker, calming audio, and a complete static alternative.

**Architecture:** Keep static HTML and Netlify hosting. Enhance the ordinary portfolio with self-hosted Three.js, a small scene controller, URL-driven content panels, independent game modules and an audio controller. Reuse existing licensed furniture/card/audio assets.

**Tech Stack:** HTML, CSS, JavaScript ES modules, Three.js 0.186.1, native Canvas, Node tests, Python Playwright.

**Spec:** `docs/superpowers/specs/2026-10-28-clubhouse-portfolio-design.md`

**Execution:** Native implementation in this session, with independent final review. The two named execution subskills are not installed; use the documented tasks directly under the user's existing build/push authorization.

## Global Constraints

- Preserve static HTML/CSS/JavaScript and root-directory Netlify deployment.
- All professional content is present in the initial HTML and remains usable without JavaScript or WebGL.
- Internet assets must be downloaded, optimized, and self-hosted, with source, author, license, and modifications documented.
- BrainTrain must state that its redesign is unpublished.
- Existing URLs, substantive writing, downloadable files, and contact behavior remain functional.
- Sound starts only after an explicit Enable sound action.
- Keep the existing CI quality thresholds; do not force-push or modify unrelated repositories.

## Review Focus

- WebGL, model, or audio loading failure must preserve readable content and navigation.
- Keyboard movement must not intercept forms, panels, or ordinary page scrolling.
- Hash aliases, browser Back, and Simple view must retain correct content and focus.
- Poker needs correct wheel straights, ties, tiebreakers, unique cards, and one draw per hand.
- Mobile resizing, hidden tabs, and closing a game must stop stale timers and audio.

## Files and interfaces

- `index.html`: server-readable portfolio, scene shell, game/sound/help/credits sections.
- `css/clubhouse.css`: home layout, panels, game controls, explicit mobile and reduced-motion rules.
- `css/editorial.css`: coherent clubhouse visual language for existing inner pages.
- `js/clubhouse.js`: URL/panel/simple-view orchestration, dynamic game/scene activation.
- `js/clubhouse-audio.js`: `createAudio(): {enable(), mute(), play(name), setVolume(kind, value), getState()}`.
- `js/clubhouse-scene.js`: `createScene({canvas, labels, onOpen, audio, onReady}): Promise<{explore(), home(), setActive(value), setQuality(value), dispose()}>`.
- `js/clubhouse-objects.js`: `buildClubhouse(scene): {robot, obstacles, anchors, animated}` plus asset loading.
- `js/games/poker-engine.mjs`: `makeDeck(), shuffle(deck, random), evaluateHand(cards), compareHands(a,b), chooseHolds(cards)`.
- `js/games/poker.js`: `mountPoker(container, audio): () => void`.
- `js/games/badminton.js`: `mountBadminton(container, audio): () => void`.
- `assets/`: selected furniture, cards, audio, license records; `js/vendor/`: pinned Three.js and only required addons.
- `scripts/test-games.mjs`, `scripts/test-clubhouse.py`: game correctness and browser acceptance checks.
- `ASSET-CREDITS.md`, `README.md`: provenance and operating instructions.

### Task 1: Licensed assets and runtime

- [x] Download and inspect Kenney Furniture Kit, Boardgame Pack, and the existing preview audio. Select relevant models and cards, preserving licenses.
- [x] Vendor Three.js 0.186.1 and the required OBJ/MTL/OrbitControls addons with their license. Use a local import map.
- [x] Add credits and allow local asset fetches in CSP (`connect-src 'self'`), with no external runtime dependencies.
- [x] Check selected asset references resolve; inspect at least one imported model in the browser.

### Task 2: Professional portfolio and content panels

- [x] Replace the home layout with the scene shell and ordinary HTML project/experience/about/writing/contact sections; preserve source facts and Netlify form.
- [x] Implement `js/clubhouse.js` so native hash links progressively enhance into readable dialogs, browser history works, Escape returns focus, and Simple view exposes the original sections.
- [x] Add the new responsive CSS and coherent styling to every existing inner page without removing content.
- [x] Correct BrainTrain's release wording and link the existing case study first.
- [x] Check navigation with no JS, hash aliases, desktop, touch-sized viewport, keyboard focus, and form entry.

### Task 3: Actual explorable 3D clubhouse

- [x] Build cutaway architecture, badminton court, poker table, and recognizable details using existing models plus simple architectural geometry.
- [x] Add controllable explorer, frame-rate independent motion, obstacle bounds, click-to-move, touch direction controls, orbit/zoom, Home reset, and visible landmark labels.
- [x] Render with soft shadows, consistent materials, capped pixel ratio, reduced-motion handling, low-quality control, and hidden-tab pause.
- [x] Test movement changes position, walls/objects block traversal, the camera rotates/zooms, landmarks open the right content, and context failure exposes the static portfolio.

### Task 4: Playable games and audio

- [x] First write Node assertions for poker hand categories, wheel straight, ties, kickers, duplicate-free shuffle/deal, and opponent holds; run against the unimplemented module to confirm failure.
- [x] Implement and verify the pure poker engine, then the five-card draw UI using downloaded card images; allow one draw, compare hands, reset, and track wins.
- [x] Implement a badminton match to seven points with a moving opponent, shuttle trajectory, serves/returns, hit feedback, scoring, keyboard/pointer/touch controls, pause, and reset.
- [x] Add imported music and effects with explicit activation, separate persistent volumes, master mute, graceful errors, and background-tab pause.
- [x] Browser-test a complete poker round, card holding, restart, a badminton point and reset, audio activation/mute, and game cleanup on dialog close.

### Task 5: Verification, review, and delivery

- [x] Run `node scripts/validate-site.mjs`, `node scripts/test-games.mjs`, and browser acceptance checks.
- [x] Inspect desktop/mobile screenshots; use the actual scene screenshot as the loading/fallback preview and sharing image.
- [x] Run Lighthouse with the repository's thresholds, fix material failures, and verify production CSP.
- [x] Obtain an independent review of the completed changes; resolve actionable findings and retest only the affected paths.
- [x] Commit and push to the existing GitHub origin/main, inspect CI/deployment status, and report links and validation honestly.

## Verification record

All 15 HTML pages pass the site validator. Poker logic passes all nine category, wheel, tie, kicker, unique-deck and opponent-hold checks. Playwright verifies movement/collisions/orbit, panels/history/focus, both games, actual audio, volume persistence, mobile menus, production CSP, no JavaScript and failed WebGL. A separate full badminton match reaches seven points and resets. Final local Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100. Independent review findings on poker focus, modal navigation, mobile-menu contrast and preserved contact details were resolved.
