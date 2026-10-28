# Vu's Clubhouse

An explorable 3D portfolio with direct recruiter navigation, a playable badminton match, five-card draw poker, and a quiet ambient soundtrack. Plain static HTML/CSS/JavaScript, with a pinned, self-hosted Three.js runtime. No build step or framework. Deploys as-is on Netlify.

**Live site:** [security-vu.netlify.app](https://security-vu.netlify.app/)

## Structure

```
index.html                 clubhouse, ordinary HTML portfolio, content panels, games, contact
blog.html                  blog index
blog-log4shell.html        post
blog-moveit.html           post
blog-ai-gym-waitlist.html  post
sentrynode.html            project case study
wazuh.html                 project case study
gatekeeper.html            project case study
braintrain.html            project case study
resume.html                accessible online resume
software-engineer.html     software engineering landing page
security-engineer.html     security engineering landing page
it-support.html            IT support landing page
css/style.css              shared design system
css/clubhouse.css           responsive clubhouse, portfolio, panels, game controls
css/editorial.css           shared clubhouse styling for reading pages
js/clubhouse.js             URL navigation, panels, static view, lazy scene/game activation
js/clubhouse-scene.js       movement, orbit camera, collisions, landmark projection
js/clubhouse-objects.js     room architecture and imported furniture
js/clubhouse-audio.js       explicit audio activation, volumes, mute, background pause
js/games/                  badminton match, poker UI, pure poker rules
js/vendor/                 Three.js 0.186.1, required loaders/controls, MIT license
js/main.js                 inner-page navigation, filters, and notes lightbox
assets/                    selected furniture, cards, audio, and original licenses
fonts/                     self-hosted production fonts and licences
images/                    optimised site imagery and full-size study notes
resume.pdf                 downloadable resume
scripts/validate-site.mjs  local and CI site-quality checks
scripts/test-games.mjs     poker ranking, tie, deck, and opponent strategy checks
scripts/test-clubhouse.py  browser acceptance checks with Python Playwright
design-source/             archived design source, kept for reference only and not deployed
```

## Deploying to Netlify

1. Push this repo to GitHub.
2. In Netlify: **Add new site → Import an existing project**, connect the GitHub repo.
3. Build command: leave blank. Publish directory: `.` (repo root) — already set in `netlify.toml`.
4. Deploy. Netlify auto-detects the `<form name="contact" data-netlify="true">` in `index.html` on the first deploy and starts capturing submissions — check **Site configuration → Forms** in the Netlify dashboard afterward, and optionally add an email notification there.
5. (Optional) Add a custom domain under **Domain management** — free HTTPS is provisioned automatically.

No environment variables, database, or serverless functions are required.

## Local preview

Any static file server works, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000`.

Run the site validator before pushing:

```
node scripts/validate-site.mjs
node scripts/test-games.mjs
```

For browser checks, install Python Playwright and its Chromium browser, start the static server on port 4173, and run `python3 scripts/test-clubhouse.py`. Set `CLUBHOUSE_TEST_URL` to test another local origin. Screenshots go into ignored `.superpowers/build/`. The checks apply the production CSP and cover navigation/history, movement/collisions/orbit, both games, audio, mobile menus, no JavaScript, and unavailable WebGL. They never submit the contact form.

## Exploring and playing

The real scene preview appears immediately. Moving over the room, focusing its canvas, or choosing **Explore the room** loads the 3D controls. Then use WASD/arrows to move, Shift for faster movement, and E near an object. Click the floor to move there. Drag to orbit, scroll/pinch to zoom, and use **Follow explorer** for a closer view. **Home** resets the camera and explorer. Touch exploration has direction buttons.

Projects, Experience, Contact and Resume are available without exploring. Panels contain their own recruiter navigation. **Simple view** restores the ordinary scrolling portfolio. Phone visitors start in that view and can choose **Explore 3D clubhouse**. Professional content remains available without JavaScript or WebGL.

Badminton is first to seven against the clubhouse bot: move with arrows/WASD or drag on your half, then Space or **Serve / swing** to hit. Poker is five-card draw: choose cards to keep, draw once, compare hands, and start another round. Each game stops when its panel closes.

Sound starts only after **Enable sound**. Music and effects have separate remembered volumes; mute stops both, and audio pauses in a hidden tab. The room renders on demand instead of continuously redrawing an idle scene.

## Assets

See [ASSET-CREDITS.md](ASSET-CREDITS.md) for source links, authors, licenses, and modifications. Furniture, cards and interface sounds are from Kenney; the ambient loop is *Sunset Walk* by Kilua Boy. Assets are downloaded and self-hosted. The preview/sharing image is a capture of the actual room.

BrainTrain's redesign is explicitly marked as unpublished. Its existing screenshot and case study describe the earlier published version.
