# Vu's Desk

A clean retro computer portfolio, closely following Henry Heffernan's desk style using his MIT-licensed original artwork. Static HTML/CSS/JavaScript, pinned local Three.js 0.186.1, no build step.

**Live:** [security-vu.netlify.app](https://security-vu.netlify.app/)

## Using the site

Projects and Experience open full-screen desktop windows immediately, without loading 3D. Use computer opens the desktop immediately while 3D is still preparing. The desk's computer opens the same desktop, with folders, independent windows, drag/minimize/maximize/close, a taskbar and Start menu. Resume opens the original PDF. Contact uses the original Netlify form.

Desk, Gym, Badminton and Card lounge are separate composed destinations. The primary scene is the complete desk/chair/plant arrangement; sports and card furniture never appear there. Click the computer, binders, game surface or destination buttons. Home and Escape return to the desk. Reduced motion switches immediately.

Poker is five-card draw. Badminton is first to seven against the bot, with keyboard and touch controls. Minimizing badminton pauses it; closing a game ends it. Sound starts only after Enable sound. Music/effects volumes are independently remembered; mute and hidden tabs pause playback.

Phones start with the normal scrolling portfolio, with optional Computer and Explore 3D desk controls. Simple view, unavailable JavaScript, failed scene downloads and unavailable WebGL all preserve the professional content. Existing case-study paths, legacy hash aliases, contact fields and facts remain intact. BrainTrain's redesign remains explicitly unpublished.

## Sharpness and loading

The desk artwork is **1,361,990 bytes across six parallel downloads**, with original **4096×4096 baked textures** preserved in optimized WebP. Rendering uses native-resolution MSAA, up to device pixel ratio 2, with no HDR, SSAO, blur/noise filters, video layers or real-time desk lights/shadows. Phone framing keeps the entire desk visible. Secondary scenes create no additional model/texture requests.

The initial image is a high-resolution capture of the actual desk. Heavy 3D starts on intent; direct portfolio shortcuts do not wait for it. Rendering runs only for camera motion and explicit changes, and stops while reading, in Simple view or in hidden tabs. Help offers lower graphics for devices that need it.

## Local preview and verification

```sh
python3 -m http.server 4173
node scripts/validate-site.mjs
node scripts/test-games.mjs
node scripts/test-navigation.mjs
python3 scripts/test-clubhouse.py
```

Browser checks require Python Playwright and Chromium. Set `CLUBHOUSE_TEST_URL` for another local origin. Screenshots go to ignored `.superpowers/build/`. The suite covers the 2 MB artwork budget, six-request limit, retina canvas dimensions, separate destinations, repeated/canceled camera movement, reading suspension, desktop/focus/history, both games, audio, contact without submission, mobile/short laptops, failed modules/artwork, no JS and no WebGL.

The existing GitHub workflow and Lighthouse thresholds are unchanged. Measure the actual first 3D interaction as well as the untouched homepage; the homepage score alone does not describe room loading.

## Main files

- `index.html`: ordinary portfolio, scene/desktop shells and actual form.
- `css/clubhouse.css`, `css/desktop.css`: scene framing, neutral chrome, reading and games.
- `js/clubhouse.js`, `js/desktop.js`: routing, lazy loading, original-section/window lifecycle.
- `js/clubhouse-scene.js`: direct renderer, camera transitions, picking and suspension.
- `js/clubhouse-objects.js`: licensed baked desk and isolated procedural destinations.
- `js/study-navigation.mjs`: named scene compositions and legacy aliases.
- `assets/desk/`: optimized artwork, exact MIT notice and pinned provenance.
- `js/games/`, `js/clubhouse-audio.js`: working games and explicit audio controls.
- Existing reading pages, URLs, `resume.pdf`, self-hosted fonts and study notes are preserved.

## Deployment and attribution

Netlify publishes the repo root with no build command or backend. Pushes to the existing `main` branch run site-quality CI and deploy. The `contact` form is detected from its ordinary HTML markup.

Desk artwork: **Henry Heffernan**, MIT. See [ASSET-CREDITS.md](ASSET-CREDITS.md), [original license](assets/desk/LICENSE-Henry-Heffernan.txt) and `assets/desk/provenance.json`. The source artwork is self-hosted and adapted to Vu's own portfolio; no analytics, remote iframe, source artist's personal content, video or unnecessary assets are loaded from the reference site.
