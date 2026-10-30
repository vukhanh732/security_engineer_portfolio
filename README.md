# Vu's Study

A personal interactive study portfolio, adapting Henry Heffernan's MIT-licensed base artwork with Vu's slate/teal/copper palette, original drawer and books, and custom interactions. Static HTML/CSS/JavaScript, pinned local Three.js 0.186.1, no build step.

**Live:** [security-vu.netlify.app](https://security-vu.netlify.app/)

## Using the site

Projects and Experience open full-screen desktop windows immediately, without loading 3D. Use computer opens the desktop immediately while 3D is still preparing. The desk's computer opens the same wallpaper first, ready to choose an app. Closing the last visible app opened directly from a room returns to that room and its zoom. Apps opened inside the computer close to its desktop. Escape, Back to room and browser Back restore the captured entry view, adapting its framing if the screen size changed. Existing windows are minimized and stay available in the taskbar. Folders, independent windows, drag/minimize/maximize/close and a Start menu remain available. Resume opens the original PDF. Contact uses the original Netlify form.

The study surrounds the licensed desk with windows, a bookshelf and a clickable door. The door opens into a hobbies hall containing a badminton court, gym equipment and a partitioned card room. Court, Gym and Card room controls move around that same hall. Activity labels offer the same actions over the scene (in a compact tray on smaller screens); clickable objects brighten on hover or label focus. Recessed windows, glazing, divided daylight, trims and court/card-room details finish the architecture. Door travel approaches the opening and fades across the threshold; reduced motion changes rooms immediately. Sports and card furniture stay out of the study. Move the mouse for an eased change of angle; Mouse look can turn this off. Scroll over the room or use + / − to zoom from 80% to 165%; Home resets the view. Reduced motion starts with mouse look off. Open the actual top drawer, pick up the coffee cup or custom Field Notes textbook, and nudge the plant for a brief sway. Desk objects exposes the same actions to keyboard/touch users. Put back or Escape returns held objects; Home returns to the desk. Reduced motion removes parallax/sway and finishes object movement immediately. Phone close-ups fit between the header and inspection panel.

Poker is five-card draw. Badminton is first to seven with bounded movement, deliberate contact timing and left/centre/right aiming. Clear, drop and smash have different depths and speeds. Friendly and Club opponents react and move to reach each shuttle, rather than retrying random misses. Keyboard, pointer and touch controls use the same simulation. Minimizing badminton pauses it; closing a game ends it. Sound starts only after Enable sound. Music/effects volumes are independently remembered; mute and hidden tabs pause playback.

Phones start with the normal scrolling portfolio, with optional Computer and Explore 3D desk controls. Simple view, unavailable JavaScript, failed scene downloads and unavailable WebGL all preserve the professional content. Existing case-study paths, legacy hash aliases, contact fields and facts remain intact. BrainTrain's redesign remains explicitly unpublished.

## Sharpness and loading

The desk artwork is **1,361,990 bytes across six parallel downloads**, with original **4096×4096 baked textures** preserved in optimized WebP. Rendering uses native-resolution MSAA, up to device pixel ratio 2, with no HDR, SSAO, blur/noise filters, video layers or real-time desk lights/shadows. Phone framing keeps the entire desk visible. Secondary scenes create no additional model/texture requests.

The initial image is a high-resolution capture of the actual furnished study. Heavy 3D starts on intent; direct portfolio shortcuts do not wait for it. Rendering runs only while mouse/camera/prop motion is settling or for explicit changes, and stops while reading, in Simple view or in hidden tabs. Help offers lower graphics for devices that need it.

## Local preview and verification

```sh
python3 -m http.server 4173
node scripts/validate-site.mjs
node scripts/test-games.mjs
node scripts/test-navigation.mjs
node scripts/test-badminton.mjs
python3 scripts/test-clubhouse.py
python3 scripts/test-room-view.py
```

Browser checks require Python Playwright and Chromium. Set `CLUBHOUSE_TEST_URL` for another local origin. Screenshots go to ignored `.superpowers/build/`. The suite covers the 2 MB artwork budget, six-request limit, retina canvas dimensions, connected rooms, mouse parallax, actual prop picking/inspection/return, interruption after fade swaps, reduced-motion changes, repeated/canceled camera movement, reading suspension, wallpaper-first entry with restorable windows, desktop/focus/history, a complete badminton win, game suspension, landscape court sizing, poker, audio, contact without submission, mobile/short laptops, failed modules/artwork, no JS and no WebGL.

The existing GitHub workflow and Lighthouse thresholds are unchanged. Measure the actual first 3D interaction as well as the untouched homepage; the homepage score alone does not describe room loading.

## Main files

- `index.html`: ordinary portfolio, scene/desktop shells and actual form.
- `css/clubhouse.css`, `css/desktop.css`: scene framing, neutral chrome, reading and games.
- `js/clubhouse.js`, `js/desktop.js`: routing, lazy loading, original-section/window lifecycle.
- `js/clubhouse-scene.js`: direct renderer, camera transitions, picking and suspension.
- `js/clubhouse-objects.js`: licensed baked desk and reusable hobbies furniture.
- `js/clubhouse-rooms.js`: original study/hall architecture, static batches, cutaways and moving doors.
- `js/desk-props.js`: runtime palette, original drawer, books, stationery and prop hit targets.
- `js/desk-interactions.js`: object inspection, return, drawer and plant motion lifecycle.
- `js/study-navigation.mjs`: named scene compositions and legacy aliases.
- `assets/desk/`: optimized artwork, exact MIT notice and pinned provenance.
- `js/games/badminton-engine.mjs`: deterministic fixed-step match simulation.
- `js/games/`, `js/clubhouse-audio.js`: game interfaces and explicit audio controls.
- Existing reading pages, URLs, `resume.pdf`, self-hosted fonts and study notes are preserved.

## Deployment and attribution

Netlify publishes the repo root with no build command or backend. Pushes to the existing `main` branch run site-quality CI and deploy. The `contact` form is detected from its ordinary HTML markup.

Desk artwork: **Henry Heffernan**, MIT. See [ASSET-CREDITS.md](ASSET-CREDITS.md), [original license](assets/desk/LICENSE-Henry-Heffernan.txt) and `assets/desk/provenance.json`. The source artwork is self-hosted and adapted to Vu's own portfolio; no analytics, remote iframe, source artist's personal content, video or unnecessary assets are loaded from the reference site.

## Project evidence

Project previews and case studies describe practical use, the working result, supporting evidence and the next improvement. Scope was checked against the project repositories: SentryNode is a deployed in-memory phase-one API, Wazuh is a three-endpoint personal lab, Gatekeeper enforces its HIGH-Bandit / Safety policy but still needs report-error hardening, and BrainTrain's redesign is unpublished. No adoption or business-impact metrics are invented.
