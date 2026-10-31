# Vu's Office

A personal interactive office portfolio, adapting Henry Heffernan's MIT-licensed base artwork with Vu's slate/teal/copper palette, original drawer and books, and custom interactions. Static HTML/CSS/JavaScript, pinned local Three.js 0.186.1, no build step.

**Live:** [security-vu.netlify.app](https://security-vu.netlify.app/)

## Using the site

Projects and Experience open full-screen desktop windows immediately, without loading 3D. Use computer opens the desktop immediately while 3D is still preparing. The desk's computer opens the same wallpaper first, ready to choose an app. Closing the last visible app opened directly from a room returns to that room and its zoom. Apps opened inside the computer close to its desktop. Escape, Back to room and browser Back restore the captured entry view, adapting its framing if the screen size changed. Existing windows are minimized and stay available in the taskbar. Folders, independent windows, drag/minimize/maximize/close and a Start menu remain available. Resume opens the original PDF. Contact uses the original Netlify form.

The office centres the computer on its original baked-light backdrop. Ground contact, soft directional shadows and a continuous background suggest a room without added enclosing walls or a floor platform. A freestanding Hobbies door opens into the separate court/gym/card hall. The scene has no persistent toolbars or repeated descriptions: a small More disclosure keeps room, sound, zoom and keyboard-friendly prop controls available on demand. Recruiter links stay visible. Activity labels and hover highlights keep the games discoverable.

Hold and drag to orbit the desk through 360 degrees, staying above the floor. Scroll or + / − zooms from 80% to 165%; Home restores the composed view. Arrow keys rotate the camera when the canvas has focus. Pick up the coffee cup or Field Notes book, then drag to rotate the object independently; its arrow controls and keyboard also work. Put back/Escape restores the original object transform. Dragging never opens objects on release, including after Escape cancels a held drag. User orbit and zoom survive reading apps and adapt on resize. Reduced motion removes automatic parallax/sway/transitions but permits direct manipulation.

Enter office starts the typed name introduction, typing sounds, quiet office ambience and music by default. There is no sound-choice prompt. The browser requires the initial tap/click; mute and volume controls remain available, and recruiter shortcuts work immediately. Sound volumes/mute and hidden-tab suspension cover all audio layers. Text completes immediately for reduced motion or when leaving/hiding the introduction.

Poker is five-card draw. Badminton is first to seven with bounded movement, deliberate contact timing and left/centre/right aiming. Clear, drop and smash have different depths and speeds. Friendly and Club opponents react and move to reach each shuttle, rather than retrying random misses. Keyboard, pointer and touch controls use the same simulation. Minimizing badminton pauses it; closing a game ends it. Sound starts only after Enable sound. Music/effects volumes are independently remembered; mute and hidden tabs pause playback.

Phones start with the normal scrolling portfolio and a direct Enter office action. More provides the remaining controls without covering the scene. Simple view, unavailable JavaScript, failed scene downloads and unavailable WebGL all preserve the professional content. Existing case-study paths, legacy hash aliases, contact fields and facts remain intact. BrainTrain's redesign remains explicitly unpublished.

## Sharpness and loading

The desk artwork is **1,361,990 bytes across six parallel downloads**, with original **4096×4096 baked textures** preserved in optimized WebP. Rendering uses native-resolution MSAA, up to device pixel ratio 2, with no HDR, SSAO, blur/noise filters, video layers or real-time desk lights/shadows. Phone framing keeps the entire desk visible. Secondary scenes create no additional model/texture requests.

The initial image is a high-resolution capture of the actual open office. Heavy 3D starts on intent; direct portfolio shortcuts do not wait for it. Rendering runs only while mouse/camera/prop motion is settling or for explicit changes, and stops while reading, in Simple view or in hidden tabs. Help offers lower graphics for devices that need it.

## Local preview and verification

```sh
python3 -m http.server 4173
node scripts/validate-site.mjs
node scripts/test-games.mjs
node scripts/test-navigation.mjs
node scripts/test-badminton.mjs
python3 scripts/test-clubhouse.py
python3 scripts/test-room-view.py
python3 scripts/test-office.py
python3 scripts/test-responsive-entry.py
python3 scripts/test-minimal-door.py
```

Browser checks require Python Playwright and Chromium. Set `CLUBHOUSE_TEST_URL` for another local origin. Screenshots go to ignored `.superpowers/build/`. The suite covers the 2 MB artwork budget, six-request limit, retina canvas dimensions, connected rooms, mouse parallax, actual prop picking/inspection/return, interruption after fade swaps, reduced-motion changes, repeated/canceled camera movement, reading suspension, wallpaper-first entry with restorable windows, desktop/focus/history, a complete badminton win, game suspension, landscape court sizing, poker, audio, contact without submission, mobile/short laptops, failed modules/artwork, no JS and no WebGL.

The existing GitHub workflow and Lighthouse thresholds are unchanged. Measure the actual first 3D interaction as well as the untouched homepage; the homepage score alone does not describe room loading.

## Main files

- `index.html`: ordinary portfolio, scene/desktop shells and actual form.
- `css/clubhouse.css`, `css/desktop.css`: scene framing, neutral chrome, reading and games.
- `js/clubhouse.js`, `js/desktop.js`: routing, lazy loading, original-section/window lifecycle.
- `js/clubhouse-scene.js`: direct renderer, camera transitions, picking and suspension.
- `js/clubhouse-objects.js`: licensed baked desk and reusable hobbies furniture.
- `js/clubhouse-rooms.js`: animated Hobbies door and the separate hobbies hall, static batches, cutaways and moving doors.
- `js/drag-view.js`: shared pointer gesture ownership, threshold and cancellation/click suppression.
- `js/office-intro.js`: optional typed name and explicit audio entry.
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
