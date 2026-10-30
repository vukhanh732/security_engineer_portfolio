# Room interaction and lighting refinements

Goal: preserve where visitors were when leaving an activity, offer visible mouse look and bounded zoom, and finish the window/hobbies details without changing the established study direction or artwork budget.

Use the current static Three.js renderer and native desktop. Existing user authorization covers implementation, tests and GitHub publishing. Continue native implementation with a final independent review.

- [x] Capture a room view when entering the computer or a direct app. Close the final visible app back to that view when the session began directly in the room; computer-launched apps retain the desktop. Escape/Back to room restores the entry view, including zoom. Keep minimized apps and reading state.
- [x] Add bounded wheel and +/- zoom, camera-relative eased mouse orbit, and an explicit mouse-look toggle. Keep inspection stable, skip automatic motion under reduced motion, settle/stop idle rendering, reset zoom with Home, and clean up input/listeners.
- [x] Deepen window reveals/glass/sills, add warm divided sunlight patches, and finish the hobbies architecture with wall/skirting details, court seating/equipment and card-room furniture. Preserve actual court/gym/table picks and the cutaways.
- [x] Add three always-readable anchored activity buttons and an action tooltip. Hover/focus gives the relevant mesh a restrained warm sheen; no idle pulsing. All activities remain keyboard/touch accessible.
- [x] Verify direct-app close vs computer close, entry-view/zoom restoration, cursor/zoom/reduced-motion/idle behavior, actual labels and mesh picking, responsive layouts and failures. Refresh the actual scene poster, run existing unit/browser/site checks and Lighthouse, independently review. Publish through the existing main-branch pipeline and verify CI/live after the commit.

Validation: all 15 HTML pages and the poker/navigation/badminton Node suites pass. The full existing Playwright suite and the focused room-view suite pass, including room-vs-computer close origins, exact zoom restoration, browser Back, resizing while reading, zoom limits/wheel, effective-FOV inspection, mouse-look settling and reduced-motion preference synchronization. Controls are hit-tested against actual overlapping chrome at 390x568, 844x390 and 1024x768. Independent review found and verified fixes for history zoom, resize framing, small-screen overlap and a room-state attribute collision; no remaining blocking findings.

Lighthouse 13.4.1: 100 performance, accessibility, best practices and SEO; LCP 1.7s, CLS 0.006. Artwork remains six requests / 1,361,990 bytes; refreshed actual-room poster is 81,350 bytes.
