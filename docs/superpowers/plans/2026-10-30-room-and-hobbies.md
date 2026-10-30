# Room and Hobbies Implementation Plan

**Goal:** Turn Vu's desk into a study connected to a hobbies hall, and make badminton a fair game of positioning, timing and placement.

**Architecture:** Original procedural rooms wrap the licensed desk. A small room-building module owns shells/door state/static batching. Navigation defines composed endpoints and portal approach/entry poses; the scene schedules camera/door/prop motion and culls inactive rooms. A pure badminton engine owns simulation, while the existing mount module owns canvas/UI/input/audio/lifecycle.

**Tech stack:** Static HTML/CSS, local Three.js 0.186.1, native canvas, Node assertions and Python Playwright. No dependencies/build changes.

**Spec:** `docs/superpowers/specs/2026-10-30-room-and-hobbies-design.md`

## Constraints and review focus

Keep the six desk-artwork requests / <2 MB, high-DPI rendering, original license, actual portfolio content/routes/form fields, accessible fallback and idle suspension. Preserve Projects/Experience shortcuts and wallpaper-first computer entry. Cover travel interrupted before/after the portal switch, prop selection during travel, resize/reduced-motion/visibility changes, game input losing focus, and a full legitimate player win.

- [x] Build `js/clubhouse-rooms.js`: original study/bookshelf/windows/door and shared hobbies hall, with static batching and `userData.portal` (`setOpen`, `update`, `finishMotion`) on each room. Reuse `buildDestination` only for furniture, remove its standalone floors/walls. Inspect actual views.
- [x] Update `js/study-navigation.mjs` and `js/clubhouse-scene.js`: study/hobbies rooms, shared hall viewpoints, staged portal travel, picking and safe cancellation/reduced motion. Update toolbar/help/labels in `index.html`, `js/clubhouse.js`, `css/clubhouse.css`; test routes and real door picks.
- [x] Create `js/games/badminton-engine.mjs` and `scripts/test-badminton.mjs`: bounded movement, aim/shot choices, single swing/cooldown, deterministic bot, scoring/reset and full strategy-win tests. Run Node tests.
- [x] Rework `js/games/badminton.js` and game CSS around the engine: visible aiming/timing feedback, keyboard/touch controls, audio and pause/visibility cleanup. Browser-play and adjust fairness using actual results.
- [x] Extend browser coverage for room travel/game skill while preserving props, games, portfolio/desktop, phone and fallback tests. Capture a new actual study poster at a fresh immutable path and update docs/credits.
- [ ] Get independent review, resolve findings, run validation/behavior/performance checks, commit/push main and confirm CI/live deployment.

## Validation completed

All 15 HTML pages passed metadata/local-link validation. Poker, navigation and badminton Node checks passed. The complete Playwright suite passed under the production CSP, including a 7:0 player win through normal controls, explicit game suspension/resume, room travel/interruption, props, mobile/landscape reading, and no-JS/WebGL/artwork failure fallbacks. The independent reviewer verified actual door/court/gym/table clicks and found one blocking short-landscape court collapse; the 320px minimum and regression check resolve it. No other blocking findings remain.

Lighthouse 13.4.1: performance 100, accessibility 100, best practices 100, SEO 100; LCP 1.6s, CLS 0.006. The new actual-room poster is 78,038 bytes; desk artwork remains six requests / 1,361,990 bytes.
