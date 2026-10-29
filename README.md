# Vu's Study

A software developer's portfolio inside a morning study, with a working retro computer and separate gym, badminton hall and card lounge connected through a corridor. Plain static HTML/CSS/JavaScript, with pinned self-hosted Three.js 0.186.1. No build step or framework.

**Live site:** [security-vu.netlify.app](https://security-vu.netlify.app/)

## Explore or get straight to the work

Header shortcuts open maximized Projects and Experience immediately, without loading the 3D scene. The computer opens an HTML desktop with independent windows, project folders, a Start menu and taskbar. Windows can be dragged when restored, minimized, maximized and closed. The original page sections move into windows; closing restores them to the ordinary portfolio. Contact remains the actual Netlify form and Resume opens the existing PDF.

Click doors or the Rooms buttons for smooth travel through real openings. Home or Escape returns to the study. Interrupted trips can reverse or continue their current safe path. Reduced motion switches destinations immediately. No avatar, pointer lock or movement keys are needed for the room.

The study's computer opens the desktop, its notebook/books open writing, and the cassette player opens Sound. The gym is a separate training room. A full-sized 6.1m by 13.4m court belongs in the tall badminton hall; the poker table belongs in the card lounge. **Play a match** and **Deal a hand** start the existing games in desktop windows.

Phones start in the ordinary scrolling portfolio and can choose **Explore 3D study** or **Computer**. Simple view, unavailable WebGL and no JavaScript all preserve professional content. Existing case-study URLs, hash aliases, browser history and contact fields remain supported. BrainTrain's redesign is explicitly unpublished.

## Sound and atmosphere

Audio starts only after **Enable sound**. Background music and effects have separate remembered volumes; mute stops both and hidden tabs pause playback. A slow 18-minute clear/overcast lighting cycle affects the room. **Still morning** pauses the cycle and starts enabled for reduced motion. This is an artistic atmosphere, not live weather. Rain is not included.

Heavy 3D starts on intent. The initial image is a real capture of the study. Rendering pauses in the desktop, Simple view and hidden tabs. Still scenes redraw only when needed. Help includes **Use lower graphics** to reduce rendering work. Minimized badminton pauses; closing a game ends it.

## Local preview and checks

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. In another terminal:

```sh
node scripts/validate-site.mjs
node scripts/test-games.mjs
node scripts/test-navigation.mjs
python3 scripts/test-clubhouse.py
```

Browser checks require Python Playwright and its Chromium browser. `CLUBHOUSE_TEST_URL` can select a different local origin. Screenshots go to ignored `.superpowers/build/`. Tests cover production CSP, window states and focus, history, forms without submitting them, both games, audio, rooms and interrupted travel, mobile/short laptops, reduced motion, missing furniture, no JS and unavailable WebGL. The existing GitHub workflow retains its Lighthouse thresholds unchanged.

## Structure

| Path | Responsibility |
| --- | --- |
| `index.html` | Scene shell, source portfolio sections, desktop shell, form |
| `css/clubhouse.css` | Responsive room shell, ordinary portfolio, game styles |
| `css/desktop.css` | Retro desktop, windows, folders, taskbar |
| `js/clubhouse.js` | Routes, lazy scene/games, audio, view switching |
| `js/desktop.js` | Independent windows and original-section lifecycle |
| `js/clubhouse-scene.js` | Rendering, picking, camera travel, atmosphere |
| `js/clubhouse-objects.js` | Enclosed architecture, imported props, equipment |
| `js/study-navigation.mjs` | Pure waypoint graph and safe interrupted routes |
| `js/clubhouse-audio.js` | Explicit audio activation, volumes, hidden-tab pause |
| `js/games/` | Badminton, poker and pure poker rules |
| `js/vendor/` | Pinned Three.js and only needed official helpers |
| `assets/study/` | Self-hosted models, PBR textures, HDRs, provenance |
| `assets/icons/` | Phosphor icons/license and raster VL marks |
| `favicon.svg`, `favicon.ico`, `apple-touch-icon.png` | Original forest/ivory VL identity |
| `images/` | Actual room preview, optimized project evidence, study notes |
| `css/style.css`, `css/editorial.css`, `js/main.js` | Existing reading/case-study pages |
| `docs/superpowers/` | Design brief and implementation plan |
| `design-source/` | Archived design source; not live |

## Deployment

Netlify publishes the repo root directly with no build command, environment variables or backend. The `contact` form in `index.html` uses `data-netlify="true"`; submissions are managed in Netlify Forms. Public origin: `https://security-vu.netlify.app/`. Pushes to the existing `main` branch trigger site-quality CI and hosting deployment.

All production assets are self-hosted. See [ASSET-CREDITS.md](ASSET-CREDITS.md) and `assets/study/provenance.json` for authors, sources, licenses and modifications. Local design tooling under `.superpowers/` stays ignored.
