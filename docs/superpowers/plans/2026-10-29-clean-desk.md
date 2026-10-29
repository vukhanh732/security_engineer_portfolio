# Clean Retro Desk Implementation Plan

**Goal:** Ship the clean Henry Heffernan desk/computer style the user requested, with sharp rendering and a small, complete scene.

**Architecture:** Reuse the existing HTML/desktop/game shell. Replace the expensive 3D internals with three MIT-licensed baked meshes and three optimized textures, no real-time lighting pipeline. Secondary destinations are isolated small procedural scenes. Existing scene API remains stable for navigation and cancellation.

**Spec:** `docs/superpowers/specs/2026-10-29-clean-desk-design.md`

**Authorization:** The user requested direct stylistic copying and previously explicitly waived further input/permission. Continue natively. A fresh reviewer checks the final revision before delivery.

- [x] Download the exact source artwork, pin its commit, retain the MIT notice, optimize baked textures without reducing pixel dimensions and enforce a 2 MB desk-artwork budget. Remove the superseded 18 MB production assets.
- [x] Replace `clubhouse-objects.js` with `buildDesk()` plus independent gym/court/lounge groups; adapt the CRT screen with Vu's desktop and attach meaningful interactions.
- [x] Replace `clubhouse-scene.js` with direct MSAA rendering, DPR 2, parallel loading, short camera transitions, distinct scene switching, reduced motion, cancellation and suspension. Simplify `study-navigation.mjs` to named scene compositions and update its tests.
- [x] Simplify the visible controls and neutral palette; remove weather/corridor promises, preserve desktop/content/forms/games, use a sharp actual new loading image and version all modified module imports.
- [x] Update credits and README, measure loaded bytes/requests and first usable 3D under throttling, inspect actual screenshots and run appropriate regression checks and Lighthouse.
- [x] Obtain independent final review, resolve findings, commit/push and verify CI and the live deployment.

## Verification

- Exact old production artwork: 18,226,383 bytes. New six-file desk: 1,361,990 bytes, 92.5% smaller, with all three 4096x4096 texture dimensions preserved.
- Initial loading/sharing image: actual 2880x1800 capture, 78,396 bytes.
- Validator enforces the 2 MB/six-file artwork budget as part of unchanged CI.
- Full browser acceptance passed: immediate computer without 3D, independent windows/folders/history/forms/audio/games, six-artwork requests and byte budget, retina canvas dimensions, isolated scenes, interruption and pending cancellation, changed reduced-motion preference, stale-hover prevention, responsive layouts, missing modules/artwork, no JavaScript and unavailable WebGL.
- Targeted real-browser checks passed for picking before the next render frame, preference changes during the screen approach and mobile scene framing.
- Local Lighthouse: 100 performance, 100 accessibility, 100 best practices, 100 SEO.
- Independent final review: no remaining material findings; exact source license, responsive renderer, performance guards and desktop fast path verified.
