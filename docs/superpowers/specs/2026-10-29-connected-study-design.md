# Connected study and retro desktop

Superseded by `2026-10-29-clean-desk-design.md`: the user rejected this realistic revision as blurry and slow, and requested Henry Heffernan's clean desk style.
Status: implementation authorized. On 2026-10-29 the user explicitly instructed completion, testing and delivery without further permission or input. This supersedes the open-floor clubhouse concept.

## What the user decided

The first release is roughly 6/10 to the user: its assets feel unpolished and flat, its open room is cluttered and architecturally implausible, and the narrow Projects/Experience panels are hard to read. The requested reference is Henry Heffernan's atmosphere, working computer, realism, and polished assets.

The user selected click-to-destination movement with smooth camera travel; a study, gym, and badminton hall connected by doors and corridors; a morning setting with slowly changing weather and lighting if feasible; and a full-screen retro desktop with windows and folders when using the computer. Desk objects and the favicon are explicitly left to the builder. Recruiters and personally curious visitors remain the audience. The existing music, sound controls, games, professional content, and GitHub/Netlify delivery remain in scope.

## Intent

Create an inhabited, believable interior seen from human height. The environment should reward looking closely: real surface texture, rounded edges, glass, convincing contact shadows, useful objects, and readable room proportions. The user enters a study and discovers the building through connected rooms. The design must avoid the miniature floor/platform, floating outside camera, controllable robot, and activities crowded around the work desk that define the first version.

Design read: a personal portfolio as a realistic morning study and connected leisure spaces, using a working retro computer as the reading interface. DESIGN_VARIANCE 8, MOTION_INTENSITY 6, VISUAL_DENSITY 3. Motion explains travel and object use. Professional reading surfaces are still and spacious.

## Room and visual direction

Builder choices: warm morning daylight, pale plaster, a wood parquet floor, muted timber and metal furniture, cream computer hardware, and a restrained forest/ivory identity. No glossy neon, floating status labels, or generic abstract shapes.

The study has a dedicated work desk, a detailed chair, a tall side window, a bookcase, and a clear walking route to its door. Chosen desk objects are an adjustable task lamp, notebook, a small plant, a short row of books, and a compact cassette player to connect the music interaction to an actual object. These are art-direction choices, not claimed possessions or hobbies.

Use detailed, appropriately licensed existing models and PBR textures. Actual candidate assets in the preview come from Poly Haven: Metal Office Desk, Mid Century Lounge Chair, Desk Lamp Arm 01, Binder Notebook, Potted Plant 02, Wooden Bookshelf Worn, and Portable Cassette Player. The existing-assets preference applies to the computer and later gym/card-room furniture too. Inspect the actual meshes, materials, scale, and silhouette before adopting any asset. Matching material treatment and believable composition matter more than sheer prop count.

A shaded garden/landscape is visible through the study window. Light should have a clear source and direction, soft shadow edges, subtle reflective highlights, ambient occlusion, and contact with the floor. Do not achieve realism by darkening everything or adding heavy blur/noise. Screens remain sharp enough to understand as screens.

## Architecture and movement

One building contains four distinct destinations: Study, Gym, Badminton Hall, and Card Lounge. A corridor joins them through actual openings and doors. Rooms are not arranged on a floating platform or displayed simultaneously as a dollhouse. The badminton hall has a tall ceiling and a correctly proportioned court with circulation space; the gym is a separate human-scale room. Poker belongs in the card lounge.

On arrival, show a composed interior view of the study from near its entrance. Clicking the desk approaches the computer. Clicking the study door travels into the corridor. The corridor's doors lead to the separate rooms. A small Rooms control provides equivalent text destinations and a way home; professional shortcuts are always available.

Use named camera positions and targets, with eased transitions through explicit waypoints that pass through door openings. Do not fly through walls or furniture. No WASD avatar, robot, first-person pointer lock, or mandatory gamepad/joystick controls in this revision. Repeated destination clicks replace the current destination cleanly; Escape or a visible Home control returns to the study. Camera motion is immediate under reduced motion, and room navigation is available to keyboard/touch users as ordinary controls.

## Working computer and readable desktop

The computer is an actual model in the study, with a convincing screen and keyboard. Its screen shows the portfolio desktop. Selecting it moves the camera toward the monitor, then presents a full-screen HTML retro desktop with usable folders and windows. This transition joins the object to its interface; it never requires reading body text inside a small perspective-distorted texture.

Use an original Windows-95-inspired interface: quiet teal/forest wallpaper, cream/grey window chrome, restrained bevels, clear title bars, file/folder icons, and a functioning taskbar. It is an aesthetic reference, not an official Microsoft interface or a copy of Henry's branding/source/artwork.

Desktop applications: Projects, Experience, About, Notebook, Games, Resume, and Sound. Projects and Experience open maximized by default with comfortable 16-18px body text, generous line spacing, and layouts that use the available screen width. Folder navigation, close, minimize, restore/maximize, and dragging must work. Title-bar movement does not accidentally select body text or intercept form inputs. Minimized applications can be restored from the taskbar, and inactive windows retain sensible stacking and focus.

Projects can use a folder/file list and a large preview pane, with real project screenshots and existing descriptions. Experience can be a clear document view. This release fixes fullscreen readability and integrates the desktop; substantial rewriting of these pages remains deferred, as the user requested.

Header recruiter shortcuts open the relevant maximized desktop application immediately, bypassing room travel. Resume opens the actual existing PDF. The normal scrolling portfolio remains available through Simple view and without JavaScript/WebGL. Existing hash aliases, browser history, contact form behavior, case-study URLs, and source facts remain functional. BrainTrain's redesign stays explicitly unpublished.

## Atmosphere and sound

Start in morning light. Builder default is a slow artistic clear-to-overcast cycle over roughly 15-20 minutes, with small changes in sunlight direction/intensity and ambient color. If light rain is included, it appears outside the windows and has a subtle optional sound. Do not imply this is live local weather or call a location/weather service.

Provide a Still morning setting that pauses atmospheric changes. Reduced motion starts in this state. Continuous weather rendering is low frequency or suspended when hidden, in the desktop, or in Simple view. A user does not lose reading contrast or find the room suddenly dark because of the cycle.

Keep explicit Enable sound activation, separate remembered music/effects volumes, mute, and hidden-tab pause. Existing CC0 music and card/interface sounds remain suitable. Optional ambience needs a real licensed source and the same controls.

## Favicon and identity

Create an original VL monogram using simple vector geometry. Use ivory on deep forest, with enough negative space to read at 16px. Prepare SVG plus the practical raster/favicon sizes for browser tabs and touch icons. Preview the mark at actual tab size and update the public pages consistently in the eventual implementation. The favicon is part of this revision, not a separate permission gate.

## Technical and delivery constraints

Keep the static HTML/CSS/JavaScript architecture and pinned local Three.js runtime. Add only the needed official loaders/postprocessing helpers, with licenses. Download and optimize source models/textures and self-host them; runtime must not depend on third-party asset APIs or CDNs. Record authors, source pages, licensing, and modifications. Poly Haven's live API is used only for asset discovery/download during development; their downloaded assets are CC0.

Use a static preview from the actual new room as its loading image. Load heavy 3D on visitor intent while professional navigation works immediately. Add rendering resolution/quality controls and avoid continuous high-cost rendering for reading. Optimize textures and geometry, and measure both visual and interaction quality; do not remove the requested realism merely to chase an audit number.

The existing GitHub OAuth token cannot update workflow files. Keep the existing workflow and thresholds intact; run additional tests locally. The public site origin is https://security-vu.netlify.app/ and the repository is https://github.com/vukhanh732/security_engineer_portfolio. Push remains authorized after the accepted revision is implemented and tested. Do not force-push or change unrelated repositories.

## What the local preview demonstrates

An isolated, disposable preview under ignored `.superpowers/study-preview/` uses actual downloaded furniture and texture assets to test a human-height study composition, desk approach, morning/overcast lighting, the full-screen retro reading surface, a room-connection diagram, and the favicon candidate. It is not a claim that every new room, game integration, and desktop behavior has already shipped.

## Acceptance and verification

The study must look inhabited and convincingly lit at 1280x720 and 1440x900. The camera enters and moves between distinct rooms through doors; there is no badminton court or gym equipment in the study. A computer interaction opens readable, maximized desktop applications. Existing games work from their proper rooms and desktop shortcuts. The favicon remains recognizable at 16px.

Verify camera interruption/repeated clicks, reduced motion, room and desktop keyboard navigation, app minimize/maximize/restore/close, project and experience readability, history/deep links, forms, both games, audio controls, atmospheric pause and hidden tabs, mobile/touch fallbacks, missing assets, WebGL failure, and no-JavaScript professional content. Run the existing site validator, poker rules, adapted Playwright checks, and Lighthouse thresholds. Inspect real browser screenshots and obtain an independent review before committing and pushing the implementation.
