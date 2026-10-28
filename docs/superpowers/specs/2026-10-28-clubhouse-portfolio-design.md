# Vu's Clubhouse: interactive portfolio design

Status: approved on 2026-10-29. The user requested more impressive free movement and both playable badminton and poker, using existing assets where suitable.

## Intent and audience

The website should demonstrate Vu Luu's projects, professional experience, and creativity through an immersive, enjoyable 3D experience. Recruiters must also be able to assess the work immediately through ordinary navigation. Other visitors should discover the person behind the work.

The user chose a combination of Bruno Simon's explorable world and Henry Heffernan's interactive computer, adapted to easy recruiter navigation. Software development remains the primary professional identity, with security experience supporting it. BrainTrain is a priority project; its complete redesign is not published yet. Personal interests are badminton, poker, games, and fitness. Palette and the extent of the redesign are left to the builder. The user subsequently requested existing internet assets wherever suitable, calming background music, and sound effects.

References:
- https://bruno-simon.com/
- https://henryheffernan.com/
- https://github.com/henryjeff/portfolio-website

## Concept: a personal clubhouse

A single compact, deliberately composed cutaway clubhouse replaces the abstract hero and generic section stack. It has a central computer workbench, an adjoining badminton half-court, a poker table, a game cabinet, and a small training corner. This is one continuous environment with enough breathing room to recognize objects, rather than an island per hobby or a large empty map.

The scene is an authored miniature: grounded materials, rounded furniture edges, visible construction details, clean lighting, and tactile objects. It should resemble a thoughtful game environment. Objects must be modeled with enough specificity that the court, net, rackets, monitor, card table, weights, and game cabinet are recognizable. Avoid collections of anonymous cubes, floating abstract geometry, glossy generic 3D icons, green hacker terminals, fake system telemetry, and giant slogans.

Builder's visual choices: pale concrete/silver surroundings, deep bottle-green court and furniture details, warm timber, off-white interface panels, and a vermilion interaction accent. These are scene materials, not six independent interface accent palettes. The UI itself uses charcoal, off-white, and vermilion consistently. Existing self-hosted Space Grotesk and IBM Plex fonts can remain if they suit the mockup. Compact rounded rectangular controls and panels share one radius scale.

Design-taste calibration: DESIGN_VARIANCE 9, MOTION_INTENSITY 7, VISUAL_DENSITY 3. The authored room and actual games carry the unusual composition and motion; professional panels remain spacious and readable. Motion is driven by exploration and game state, with no perpetual decorative movement. Controls use a 7px radius, media 9px, and content panels 14px.

## Arrival and recruiter navigation

On desktop, the clubhouse occupies the main viewport immediately. A short HTML introduction identifies Vu by name and role. A persistent HTML navigation bar offers Projects, Experience, About, Resume, and Contact. A separately labeled Explore action activates movement; visitors can also click labeled landmarks directly without entering movement mode. No loading-screen gate, forced tutorial, or game completion stands between visitors and professional content.

Projects and Experience open readable HTML panels with direct links and substantive information. Resume links to the actual PDF, with the online resume available in the content panel. The panels should be comfortably readable at 1280 x 720, not tiny text squeezed into a 3D screen. The workbench monitor is a second entry point to the same project panel, with a short, optional camera move.

Use ordinary URLs and hash navigation. Existing deep links including #projects, #experience, #about, #contact, #skills, and #education must land on the appropriate content. The browser Back button reverses panel navigation. Panel state lives in the URL, is keyboard operable, restores sensible focus, and supports Escape to return to the room. Scene movement shortcuts are active only while the scene is intentionally focused and no input or content panel is active.

A visible Simple view control provides an ordinary scrolling HTML portfolio. All professional content is present in the initial HTML and remains usable without JavaScript or WebGL. The scene is progressive enhancement over that content, not a separate source of professional facts.

## Exploration and game elements

Use a small original wheeled helper as the controllable visitor marker. This is the builder's choice, not an agreed personal mascot. WASD/arrows move it on the walkable floor in Explore mode, with collision boundaries and a home/reset control. Click-to-move is an alternative. No first-person pointer lock or mandatory driving.

Object interactions have clear affordances and share the professional navigation system:
- Workbench/computer: projects and case studies.
- Noticeboard or shelf: experience, education, and credentials.
- Notebook: existing writing and study notes.
- Badminton area: a short optional rally minigame with actual hit/miss feedback, reset, and an exit. A small 2D accessible game overlay is acceptable; real-time physical simulation is unnecessary.
- Poker table: a complete five-card draw game against a computer opponent. Deal, select cards to keep, draw replacements once, reveal and compare ranked hands, track a local win count, and play again. Use existing card artwork. This quick variant is the builder's choice.
- Game cabinet: introduces BrainTrain and its case study. It does not present the unreleased redesign as playable.
- Training corner: a short object reaction and personal-interest description; a full fitness game is outside this release.

Include calming looping background music and quiet sound effects for navigation, object activation, explorer movement, and badminton hits. Sound starts only after an explicit Enable sound action, which also satisfies browser playback requirements. Provide a master mute plus separate music/effects volume controls, persist the volume preferences, pause audio when the tab is hidden, and resume only if the visitor previously enabled it. Start music quietly around 20% volume. Avoid incessant hover sounds, harsh alarms, or effects competing with the soundtrack. The preview auditions Sunset Walk by Kilua Boy and Kenney interface sounds; these are builder selections that can change based on feedback. Any discovery counter is optional and never locks content. Scope is one room, a badminton match, five-card draw poker, and object interactions.

## Content and release scope

Rebuild the home experience and refresh the shared visual language across existing public pages: project case studies, blog index and articles, study notes, online resume, role-specific pages, and the contact confirmation page. Existing URLs, substantive writing, downloadable files, and contact behavior remain functional.

The projects panel leads with BrainTrain, then includes SentryNode, Wazuh SOC HomeLab, and Gatekeeper. Show the project name, a plain summary, key technical work, and the case study/source links that actually exist. Prefer the existing case study pages as the source of detail. Reuse actual screenshots where accurate and relevant.

BrainTrain must state that its redesign is unpublished. Do not read, copy, publish, or push the sibling BrainTrain repository as part of this work. Do not invent new screenshots, deployment status, metrics, or redesigned features. Existing BrainTrain screenshots can illustrate the previous published version only when explicitly labeled as such. The current case study needs its release wording reviewed so that old-version claims do not masquerade as a deployed redesign. Link to the project case study first; keep existing live-version links only when verified and labeled accurately. New assets can be added after the user supplies them in a later update.

Retain the current experience, degree, certifications, and contact details from the repository. Do not advance dates, job titles, qualifications, or outcomes based on assumptions. Skills should be demonstrated through projects and experience instead of leading with a wall of badges.

## Implementation constraints and builder choices

Preserve static HTML/CSS/JavaScript and root-directory Netlify deployment. Add a self-hosted, pinned official Three.js module and required license to render the actual scene. Do not introduce React, Next.js, a database, or a mandatory build step solely for this redesign. Installation and module handling must follow the current official Three.js documentation: https://threejs.org/docs/ and https://threejs.org/manual/en/installation.html.

Keep dependencies and assets local to fit the existing Content Security Policy. Adjust the policy only if a required local asset mechanism needs it, retaining the existing security headers. Never load executable runtime code from a public CDN. A generated visual concept may guide art direction, but the production scene must be real interactive geometry; an image with pointer parallax is not an acceptable substitute.

Prefer existing, appropriately licensed models, textures, and audio over inventing replacements. Use a coherent visual family and adapt composition, materials, lighting, and scale to this clubhouse. Kenney's Furniture Kit is a candidate for furniture and computers; inspect the actual pack before committing to particular props. Reuse existing project screenshots accurately. Build simple room architecture and custom objects procedurally only where an appropriate asset is unavailable or procedural geometry is substantially simpler. Internet assets must be downloaded, optimized, and self-hosted, with source, author, license, and modifications documented in a repository asset-credits file and a small user-facing credits panel. Do not copy Bruno's or Henry's world assets, branding, or source merely because they are references.

Verified candidate sources:
- Furniture Kit, Kenney, CC0: https://kenney.nl/assets/furniture-kit
- Interface Sounds, Kenney, CC0: https://kenney.nl/assets/interface-sounds and author mirror https://opengameart.org/content/interface-sounds
- Sunset Walk, Kilua Boy, CC0: https://opengameart.org/content/sunset-walk-ambient-quiet-sweet-loop
- Poly Haven textures/HDRIs, CC0, if needed: https://polyhaven.com/license

A lightweight static preview image is appropriate while the renderer loads and when WebGL is unavailable. The user approved browser mockups, which are disposable design artifacts under ignored .superpowers/, not production implementation. The generated clubhouse illustration is art direction only and must not be represented as the finished interactive website or a claim that identical models already exist in a downloaded pack.

## Mobile, accessibility, and performance

Below 768px, lead with direct project navigation and readable content. The room is still available as a tap-to-explore view, with large touch targets and simplified camera framing. Do not make touch users rely on keyboard controls. Hide or simplify hover-only instructions.

Honor reduced motion: skip camera travel and continuous ambient animations, provide immediate panel transitions and access to the static view. Every meaningful scene landmark has an equivalent HTML control. Preserve skip links, heading order, labeled forms, visible focus, sufficient contrast, and normal scrolling inside long content. Panels must not trap pointer or keyboard input incorrectly.

Cap rendering resolution, use modest shadows and repeated geometry, and stop rendering when the document is hidden. Load core HTML and navigation before the scene. Target smooth interaction on a normal laptop with a practical low-quality mode. Retain existing CI quality thresholds and investigate real regressions instead of disabling checks. A visually ambitious scene does not excuse inaccessible or broken navigation.

## Verification and GitHub delivery

After approval and implementation, run the repository validator, browser-test desktop and mobile navigation, scene movement/collisions, object activation, the rally game, hash/history behavior, focus handling, reduced motion, WebGL failure, and JavaScript-disabled content. Verify music and effects independently, master mute, volume persistence, playback failure, background-tab pause, and no audio before user activation. Check local production-policy behavior, rendering errors, the existing contact form markup, and local links across refreshed pages. Run the existing Lighthouse checks or their local equivalent.

Inspect the finished site visually at desktop and mobile sizes. Fix clipping, tiny text, unreadable labels, and unfinished-looking models before delivery. Save representative screenshots for review.

The user has authorized a GitHub push. Once the agreed redesign is complete and verified, commit and push to the existing origin, https://github.com/vukhanh732/security_engineer_portfolio.git, using the current main branch unless repository rules require a branch. Do not force-push or modify unrelated repositories. Report the commit and verification results. Netlify deployment follows the existing repository integration; do not claim a successful deployment without checking it.

## Acceptance

The result succeeds when the room is immediately recognizable and personal; recruiters can open substantive projects and experience in one click and download the resume without exploring; optional exploration and the rally interaction work; BrainTrain's unpublished status is honest; and the entire portfolio remains readable on mobile and without 3D.

The visual direction is approved. Implement the expanded playable games and real free movement, then verify and push the finished site as already authorized.
