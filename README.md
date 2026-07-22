# vukhanhluu.com — portfolio site

Plain static HTML/CSS/JS, no build step, no framework. Deploys as-is on Netlify.

## Structure

```
index.html                 home page (about, skills, projects, blog preview, experience, extra, contact)
blog.html                  blog index
blog-log4shell.html        post
blog-moveit.html           post
sentrynode.html            project case study
wazuh.html                 project case study
gatekeeper.html            project case study
css/style.css              shared design system
js/main.js                 mobile nav toggle + scroll-reveal
images/                    Wazuh dashboard evidence screenshots
resume.pdf                 ⚠️ not included — add your resume PDF here (see below)
design-source/             original Claude Design output (.dc.html files), kept for reference only — not deployed
```

## Before deploying

- **Add `resume.pdf`** to the project root. Every "Download résumé" link points at `/resume.pdf`; without the file those links 404.
- Update the phone number in `index.html` if `0424 725 899` shouldn't be public — it's currently used in a `tel:` link in the hero and contact section.

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
