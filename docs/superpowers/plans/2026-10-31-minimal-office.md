# Minimal office controls and hobbies door

User direction: replace the small Hobbies sign with an actual door and remove the crowded control boxes/descriptions. Keep the open office and recruiter shortcuts. Existing authorization covers implementation and publishing.

- [x] Reuse the existing door geometry/animation for a freestanding, inset-labelled Hobbies door. Add contact shadow and align study approach/threshold camera poses with it. Keep return travel, cancellation and reduced-motion behavior.
- [x] Replace persistent room/zoom/sound/computer toolbars with one unboxed More disclosure. Secondary controls stay available only on demand. Remove duplicate on-scene instructions, descriptions and action buttons; keep typed name, entry and activity affordances. Give the ordinary mobile view its own clear Enter office action.
- [x] Verify default minimal composition, actual door picking/open/travel/return, menu keyboard/touch behavior, retained reading/inspection/audio controls, phone layout and no-JS/WebGL fallback. Refresh poster/credits/docs, validate, independently review, push and verify live/CI.

Validation: all 15 HTML pages and poker/badminton/navigation checks pass. The minimal-door, responsive-entry, office, room-view and full site browser suites pass. The browser helpers explicitly open More before secondary controls, matching the new interaction. Independent review verified actual door picking/opening/return, readable plaque, menu auto-close and Escape behavior, cold computer entry/exit without artwork, and reachable mute/Put back while inspecting at320x568/390x844/844x390/1440x900; no remaining blocking findings.

Lighthouse13.4.1: performance99, accessibility100, best practices100, SEO100; LCP1.9s, CLS0.015. The actual door-scene poster is78,550 bytes; the six original desk artwork requests remain unchanged.
