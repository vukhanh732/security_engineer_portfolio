# Portfolio site — context for future sessions

Security-engineering portfolio for Vu Luu (vukhanhluu@gmail.com). Plain static
HTML/CSS/JS, no build step, no framework. Deploys as-is on Netlify.

Repo: https://github.com/vukhanh732/security_engineer_portfolio (branch `main`)

## Origin

Originally designed in Claude Design, which produced `.dc.html` files using a
proprietary preview-only component runtime (`x-dc`, `dc-import`, `sc-for`,
`support.js`) that cannot run standalone. Those files were ported to real
static HTML/CSS/JS and archived under `design-source/` for reference only —
**never edit or deploy files in `design-source/`, they are not live**.

## File map

```
index.html                 home page: hero, about, skills, education, experience,
                            projects, blog preview, extracurricular, contact
blog.html                  blog index
blog-log4shell.html        post (page-rose)
blog-moveit.html           post (page-azure)
blog-ai-gym-waitlist.html  post (page-violet)
sentrynode.html            project case study (page-violet)
wazuh.html                 project case study (page-teal)
gatekeeper.html            project case study (page-coral)
braintrain.html            project case study
resume.html                accessible online resume
software-engineer.html     role-specific landing page
security-engineer.html     role-specific landing page
it-support.html            role-specific landing page
css/style.css              shared design system (single file, no preprocessor)
js/main.js                 navigation, filters, lightbox, and scroll-reveal
fonts/                     self-hosted Space Grotesk and IBM Plex families
images/                    optimised imagery and full-size study notes
resume.pdf                 must stay lowercase — Netlify's Linux build is
                            case-sensitive, every download link points to
                            "resume.pdf" exactly
netlify.toml                publish = "." (repo root), no build command
design-source/             archived Claude Design output, not deployed
```

Pages share nav/footer markup by hand, with intentionally simpler navigation
on conversion-focused role, resume, and confirmation pages. Search all root
HTML files when changing shared markup; there is no templating layer.

## Design system (css/style.css)

- Dark theme only, single locked theme (no light mode). Base `#12151b`,
  cards `#171b22`, borders `#262b35`, body text `#f2f3f5`/`#c7cbd3`.
- Fonts: Space Grotesk (headings), IBM Plex Sans (body), IBM Plex Mono
  (labels/eyebrows/mono accents). Self-hosted as WOFF2 files in `fonts/`.
- **Global brand color stays amber (`--accent`, `#e8b93a`)** for all
  functional/interactive elements: nav hover, primary/secondary buttons,
  hero, footer links, form. Do not vary these per section — that was a
  deliberate choice to keep the CTA color recognizable site-wide.
- **Section identity colors** (`--accent-section`, decorative only): About
  and Contact = amber, Skills = teal, Education = azure, Experience = coral,
  Projects = violet, Blog = rose, Extracurricular = sage. Implemented via
  scoped CSS custom properties on `.section--<name>` classes (index.html) and
  `.page-<color>` body classes (subpages) — see the block right after
  `.section-label` in style.css. Used on: section labels, big background
  numerals, project/blog card hover borders+glow, tags, timeline company
  name, project-page eyebrows/labels/diagram arrows/GitHub link, blog-post
  eyebrows/MITRE IDs/inline links.
- Touch targets are 44px minimum throughout (mobile a11y requirement from
  the original brief). Mobile nav collapses under 880px via `.nav-toggle` /
  `.mobile-panel`, driven by `js/main.js`.

## Content facts (don't re-derive, don't invent)

- UNSW Computer Science (Security Engineering) grad, Feb 2021 – Mar 2025.
  CompTIA Security+ (2025), ISC2 CC (2023).
- Current role: Software Developer at Cybercore Solutions (Jan 2025–present),
  building toward a dedicated Security Engineer role.
- Positioning is deliberately hybrid, not security-only: user is a software
  developer first, with security as the area he's gone deepest in — don't
  reintroduce "building toward Security Engineer" or similar language that
  undercuts his actual current Software Developer title. Hero/About copy
  (index.html) and the Skills section's lead "Software Engineering" card
  were reworked for this on 2026-07-28; keep new additions consistent with
  a hybrid dev+security identity rather than folding everything back into
  security framing.
- Three declared security focus areas (still always name these three when
  talking about security depth specifically): detection engineering &
  SIEM/monitoring, identity & Microsoft security, DevSecOps automation.
- Projects section heading is deliberately count-agnostic ("Selected builds,
  verified code, real evidence") — more projects will be added over time, so
  don't reintroduce a hardcoded number like "Three builds"/"Four builds".
- Core three security projects, each a real repo with a case study page:
  SentryNode (SIEM, solo build, RabbitMQ backpressure war story),
  Wazuh-SOC-HomeLab (SOC lab, real dashboard screenshots in `images/`),
  Gatekeeper (CI/CD security gate, HIGH-severity-only blocking policy —
  MEDIUM findings are logged, not blocking, keep this distinction accurate).
- BrainTrain (github.com/vukhanh732/BrainTrain) is a 4th project, added
  as a deliberate exception to the security-only lineup: a gamified
  brain-training web app (Next.js/Supabase/TypeScript/Vitest), framed on
  engineering rigor (Elo system replayed from session history, adaptive
  difficulty, E2E-verified against a live DB) rather than security. It has an
  internal case-study page and links to the live app at braintrain.space.
  Future non-security projects added the same way should follow this pattern:
  distinct project-tag
  (not SIEM/SOC/DEVSECOPS-styled), hook framed on engineering/testing merit.
- Full career history (Cybercore, Labourpower, Zonda) lives in the
  Experience section of index.html — do not trim the Labourpower phishing
  campaign / SAP bullets, they're deliberate differentiators.
- Nothing on the site may imply unauthorized access or client/professional
  engagement work — everything is personal lab work or authorised training.

## Known gotchas

- **Filename case matters on Netlify** (Linux build) even though this repo
  lives on a case-insensitive WSL mount. Renaming case-only on this
  filesystem requires a two-step `mv` (`a.pdf` → `tmp.pdf` → `a.pdf`) or git
  won't see the change either.
- **`git push` over plain HTTPS fails in this sandbox** ("could not read
  Username"). Fix once per environment: `gh auth setup-git` (gh is already
  authenticated as `vukhanh732`), then normal `git push` works.
- No env vars, database, or serverless functions — everything is static.
  Don't introduce a build step unless there's a real reason.

## Working agreement

- Keep copy tight — user wants skimmable sections (3-4 sentences), not
  paragraphs. When editing prose, default to cutting, not expanding.
- The user has asked for completed website changes to be committed and pushed
  directly to `main` unless they explicitly say otherwise.
- After any HTML/CSS change, run `node scripts/validate-site.mjs` and a local
  browser smoke test before calling it done. Case-sensitivity and cross-page
  nav sync have both bitten before.
