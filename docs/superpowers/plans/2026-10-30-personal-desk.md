# Personal Desk Implementation Plan

**Goal:** Personalize the clean desk with mouse parallax, working props, a wallpaper-first computer and evidence-led project copy.

**Spec:** `docs/superpowers/specs/2026-10-30-personal-desk-design.md`

**Architecture:** Keep the licensed, lightweight base and current static site. `clubhouse-objects.js` creates original drawer/book/details and exposes prop references; new `desk-interactions.js` owns prop state and tweens; the scene owns parallax/render scheduling. The desktop adds a wallpaper landing operation. Original HTML remains the source of project and form content.

- [x] Customize materials, remove source top-drawer front/handle, build original drawer tray/book/VL details and register meaningful prop hit targets.
- [x] Implement inspect/return/drawer/sway state with interruption, reduced motion and cleanup in a focused interaction module.
- [x] Integrate eased mouse parallax and active-only rendering; provide accessible prop controls/inspection panel and dismissal paths.
- [x] Make computer opens land on wallpaper while preserving direct professional shortcuts and restorable windows.
- [x] Rewrite project previews/case-study context using verified local/source evidence, without invented adoption or metrics.
- [x] Capture/inspect desktop and mobile screenshots, regenerate the actual loading image, update credits/docs and verify budget, behavior, accessibility and fallbacks.
- [x] Obtain independent review, resolve findings, run checks, commit/push and verify CI/live deployment.

## Verification notes

The independent review identified two interruption problems: a stale camera baseline after a fade had already revealed the next scene, and prop controls being ignored during a computer/destination approach. Both are fixed and covered by browser regressions. Phone inspection now fits its object between the header and panel; short screens use a compact panel, and resizing returns held objects safely.

Validated all 15 HTML pages and local links. Poker and navigation checks pass. Browser checks cover the real prop meshes, keyboard controls, camera following/settling, motion preference changes, drawer persistence, inspection return, hidden/reading suspension, desktop landing with restored windows, games/audio/forms/history, 1280×720, phones, production CSP and failed enhancement paths. Local Lighthouse: performance 99, accessibility 100, best practices 100, SEO 100. Artwork remains six files / 1,361,990 bytes; the new 2880×1800 loading capture is 76,192 bytes.

Project source context checked on 2026-10-30: `vukhanh732/BrainTrain`, `vukhanh732/sentrynode`, `vukhanh732/Wazuh-SOC-HomeLab`, and `vukhanh732/gatekeeper-devsecops`. Gatekeeper's diagram and metadata now correctly distinguish the Bandit/Safety gate from the non-blocking ZAP report.
