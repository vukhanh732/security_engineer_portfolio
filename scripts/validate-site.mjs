import { readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const pages = readdirSync(root).filter((name) => extname(name) === ".html");
const failures = [];
const canonicals = new Map();

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

for (const file of pages) {
  const html = readFileSync(join(root, file), "utf8");
  const noIndex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);

  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, "missing title");
  if (!noIndex && !/<meta\s+name="description"\s+content="[^"]+"/.test(html)) fail(file, "missing meta description");
  if (!/<link\s+rel="icon"/.test(html)) fail(file, "missing favicon");
  if (!/<a\s+href="#main-content"\s+class="skip-link">/.test(html)) fail(file, "missing skip link");
  if (!/id="main-content"/.test(html)) fail(file, "missing skip-link target");
  if (!/<main\b[^>]*id="main-content"/.test(html)) fail(file, "main content is not a landmark");
  if (/fonts\.(googleapis|gstatic)\.com/.test(html)) fail(file, "uses externally hosted fonts");
  if (/[—–]/.test(html)) fail(file, "contains a banned long dash character");
  if (/Five adaptive games/i.test(html)) fail(file, "contains stale BrainTrain game count");

  if (!noIndex) {
    const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1];
    if (!canonical) fail(file, "missing canonical URL");
    else if (canonicals.has(canonical)) fail(file, `duplicates canonical from ${canonicals.get(canonical)}`);
    else canonicals.set(canonical, file);
    for (const property of ["og:title", "og:description", "og:url", "og:image"]) {
      if (!new RegExp(`<meta\\s+property="${property}"\\s+content="[^"]+"`, "i").test(html)) fail(file, `missing ${property}`);
    }
  }

  for (const block of html.matchAll(/<script\s+type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try { JSON.parse(block[1]); } catch { fail(file, "contains invalid JSON-LD"); }
  }

  for (const image of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = image[1];
    const src = attributes.match(/\bsrc="([^"]*)"/)?.[1] ?? "";
    if (!/\balt="[^"]*"/.test(attributes)) fail(file, `image ${src || "without src"} is missing alt text`);
    if (src && (!/\bwidth="\d+"/.test(attributes) || !/\bheight="\d+"/.test(attributes))) {
      fail(file, `image ${src} is missing width or height`);
    }
  }

  for (const match of html.matchAll(/\b(?:href|src|data-full)="([^"]+)"/g)) {
    const reference = match[1];
    if (!reference || reference.startsWith("#") || /^(?:https?:|mailto:|tel:|data:)/.test(reference)) continue;
    const pathname = reference.split(/[?#]/)[0].replace(/^\//, "");
    if (!pathname) continue;
    const target = join(root, pathname);
    try { if (!statSync(target)) fail(file, `missing local asset ${reference}`); } catch { fail(file, `missing local asset ${reference}`); }
  }
}

for (const required of ["favicon.svg", "robots.txt", "sitemap.xml", "resume.pdf", "css/style.css", "js/main.js"]) {
  try { statSync(join(root, required)); } catch { fail("site", `missing ${required}`); }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`Validated ${pages.length} HTML pages, metadata, JSON-LD, images, and local links.`);
