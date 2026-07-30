# Study notes page + archive repo — design

Date: 2026-07-31

## Goal

Publish handwritten study notes (currently: interview-prep networking notes,
3 phone photos in `images/study_notes/`) as a portfolio-facing page on the
site, backed by a separate public GitHub repo that archives the full-res
photos and serves as the source for generated per-topic PDFs.

## Repo: `study-notes` (public, github.com/vukhanh732/study-notes)

```
study-notes/
  README.md
  topics/
    networking/
      01.jpg  02.jpg  03.jpg   # full-res, rotated upright, renamed from timestamps
  pdfs/
    networking.pdf             # built from the full-res rotated images
  scripts/
    build_pdf.py               # Pillow-based rotate + combine-to-PDF
```

`scripts/build_pdf.py` holds two pieces of config that must be edited by hand
when new photos are added: a per-file rotation-override list (phone/EXIF
tagging was inconsistent across shots — see Rotation section) and the
topic → files grouping. There's no metadata to infer topic from, so this
stays a manual step.

## Image pipeline

Source: `images/study_notes/*.jpg` (raw phone photos, ~2.8-3.3MB each,
4000x2252 landscape pixel dimensions regardless of portrait content).

1. `ImageOps.exif_transpose` — respects each file's EXIF orientation tag.
2. Manual extra rotation for files whose EXIF tag doesn't already correct
   them. Verified for this batch: `20260730_221225.jpg` and
   `20260730_221234.jpg` need an additional 90° CW rotation
   (`Image.ROTATE_270`) after step 1; `20260731_005657.jpg` already carries
   a correct `Rotate 90 CW` EXIF tag so step 1 alone is sufficient — do not
   double-rotate it.
3. Full-res rotated output → `study-notes/topics/networking/{01,02,03}.jpg`,
   feeds `build_pdf.py`.
4. Web-optimized output (resize to max 1600px on the long edge, re-encode
   JPEG quality 80) → `images/study_notes/{01,02,03}.jpg` in the portfolio
   repo, replacing the raw timestamped originals.

## Portfolio site: `study-notes.html`

- New standalone page, same nav/hero/footer chrome as `sentrynode.html` /
  `wazuh.html` / `gatekeeper.html`, `page-azure` theme (reuses Education's
  `--hue-azure`).
- One section per topic. Currently: "Networking" — a photo grid of the 3
  optimized images with a click-to-enlarge lightbox (small vanilla-JS
  addition to `js/main.js`, no new dependency), a "Download PDF" button
  linking to `images/study_notes/pdfs/networking.pdf`, and a link out to
  `github.com/vukhanh732/study-notes` (same external-link pattern as project
  cards).
- Assets committed directly into this repo (`images/study_notes/`) so the
  page never depends on the `study-notes` repo being reachable at runtime —
  `study-notes` is the archive/source, not a runtime dependency.

## Site-wide nav update

Add a "Notes" link (`study-notes.html`) between Blog and Contact in both the
desktop `nav-links` and the `mobile-panel` markup, across all seven existing
HTML files (`index.html`, `blog.html`, `blog-log4shell.html`,
`blog-moveit.html`, `sentrynode.html`, `wazuh.html`, `gatekeeper.html`), per
this repo's hand-copied-nav convention (no templating layer).

## Out of scope

- No OCR/text-search of notes — PDFs are image-based scans, not searchable
  text.
- No automated ingestion pipeline for future photos — adding a topic remains
  a manual "run the script, commit both repos" step.
- No build step introduced to the live site; all generated assets are
  pre-built and committed.
