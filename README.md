# vukhanhluu.com — portfolio site

Plain static HTML/CSS/JS, no build step, no framework. Deploys as-is on Netlify.

## Structure

```
index.html                 home page (about, skills, projects, blog preview, experience, extra, contact)
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
js/main.js                 navigation, scroll reveal, filters, and notes lightbox
fonts/                     self-hosted production fonts and licences
images/                    optimised site imagery and full-size study notes
resume.pdf                 downloadable resume
scripts/validate-site.mjs  local and CI site-quality checks
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
```
