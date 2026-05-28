# Deployment — Wander by Wilson

**Production URL:** https://www.wanderbywilson.com
**Repo:** https://github.com/wanderbywilson/website
**Host:** Vercel (auto-deploys from `main` branch on push)
**Domain registrar:** Squarespace Domains (DNS lives there)

---

## Git author convention

ALL commits to this repo must be authored by:

```
Name:  wanderbywilson
Email: wilson@wanderbywilson.com
```

These are configured in this repo's local git config (run automatically on first clone — see "Re-cloning fresh" below if needed).

To verify the local config is correct:

```bash
git config user.name      # → wanderbywilson
git config user.email     # → wilson@wanderbywilson.com
```

---

## How deploys work

This is a **static site auto-deployed by Vercel from GitHub**. There is no build step.

1. **Edit files locally** (HTML / CSS / JS / data files)
2. **`git add` → `git commit` → `git push origin main`**
3. **Vercel detects the push and deploys within ~30-60 seconds** to `https://www.wanderbywilson.com`
4. **No manual deploy command needed.** No `npm run build`, no Vercel CLI required.

Vercel's deploy config lives in `vercel.json` (redirects + cache headers + security headers). Edit that file like any other and push — Vercel picks up the new config on next deploy.

---

## Cache-busting (CRITICAL)

When editing `styles.css`, `data.js`, or `blog-data.js`, **bump the `?v=N` query string** referenced in every HTML file. Otherwise browsers serve stale cached files for up to 24 hours.

Current versions are documented in `SITE-NOTES.md` (Section 3). Bulk-bump pattern:

```bash
perl -pi -e 's/styles\.css\?v=137/styles.css?v=138/g' *.html
```

HTML files themselves are NOT versioned — append `?cb=N` to URLs when testing in browser.

---

## What's IN vs. OUT of the deploy

| File | In repo? | In deploy? | Why |
|---|---|---|---|
| `*.html`, `*.css`, `*.js` | ✅ | ✅ | Site content |
| `blog-images/` (391 MB) | ✅ | ✅ | All blog hero + body photos (self-hosted, no CDN dependency) |
| `sitemap.xml`, `robots.txt`, `404.html` | ✅ | ✅ | SEO essentials |
| `vercel.json` | ✅ | ✅ | Redirects + headers — Vercel reads this on every deploy |
| `SITE-NOTES.md`, `DEPLOY.md` | ✅ | ❌ (in `.vercelignore`) | Internal project docs, not for public site |
| `brand-kit*.html`, `brandmark-studio.html` | ✅ | ❌ (in `.vercelignore`) | Internal design tools |
| `*.bak*` files | ❌ (in `.gitignore`) | ❌ | Backup snapshots from migration passes |
| `SPL-POOL-30.jpg`, `CAR-ACC-SUI-99.jpg`, etc. | ❌ (in `.gitignore`) | ❌ | Giant unused source originals (~125 MB combined) |

---

## DNS configuration (Squarespace Domains → Vercel)

The `wanderbywilson.com` domain is registered with **Squarespace Domains** but DNS points at Vercel. Records currently set (do NOT change unless you know exactly why):

| Type | Host | Value | Purpose |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Apex domain → Vercel |
| `CNAME` | `www` | `cname.vercel-dns.com` | www → Vercel |
| `TXT` | `@` | `google-site-verification=1dSZRqfKJx3QAYBc0dICTF8PQTqzrePclEmh...` | GSC ownership (DO NOT REMOVE — verification is permanent only as long as this stays) |

In **Vercel Dashboard → Project → Settings → Domains**, both `wanderbywilson.com` and `www.wanderbywilson.com` are added, with `www` set as the primary (apex auto-redirects to www).

---

## Connected accounts

| Service | Account | Purpose | Reference |
|---|---|---|---|
| **GitHub** | `wanderbywilson` | Source repo | https://github.com/wanderbywilson/website |
| **Vercel** | (use the account this repo is linked to in Vercel dashboard) | Hosting + deploy | https://vercel.com/dashboard |
| **Google Search Console** | wilson@wanderbywilson.com | Index monitoring | https://search.google.com/search-console — Domain property: `wanderbywilson.com` |
| **Google Analytics 4** | wilson@wanderbywilson.com | Traffic analytics | https://analytics.google.com — Measurement ID: `G-7QN83N7QQS` (installed on all 13 pages) |
| **Formspree (Trip inquiries)** | wilson@wanderbywilson.com | Form submissions | `xwvzanjd` — see SITE-NOTES §3 v120 |
| **Formspree (Hotel inquiries)** | wilson@wanderbywilson.com | Form submissions | `xnjrlbkq` — see SITE-NOTES §3 v120 |
| **Squarespace Domains** | Wilson's Squarespace login | Domain registrar | https://account.squarespace.com → Domains |

---

## Common workflows

### Make a quick content edit (typo fix, copy tweak)

```bash
cd "/Users/wschubert/Documents/WNDR Website"
# edit the file
git add path/to/file
git commit -m "fix: typo on services page"
git push origin main
# Vercel deploys in ~30-60s. Visit https://www.wanderbywilson.com to verify.
```

### Add a new blog post

1. Edit `/tmp/wbw-blog/convert3.py` if pulling from the old Squarespace source (no longer applicable post-shutdown)
2. OR manually add an entry to `blog-data.js` following the existing structure
3. Add hero + body images to `blog-images/{slug}/`
4. Bump `blog-data.js?v=N` across `inspiration.html` + `post.html`
5. Add the new URL to `sitemap.xml`
6. Commit + push

### Edit a property / hotel page

1. Edit the relevant entry in `data.js` under `PROPERTIES`
2. Add any new images to project root or `blog-images/`
3. Bump `data.js?v=N` across all HTML files that reference it
4. Add to `sitemap.xml` if new
5. Commit + push

### Roll back a bad deploy

In **Vercel Dashboard → Project → Deployments**, find the last good deploy and click the `…` menu → **Promote to Production**. Instant rollback, no rebuild.

---

## Re-cloning fresh (if you ever lose this local copy)

```bash
cd ~/Documents
gh repo clone wanderbywilson/website "WNDR Website"
cd "WNDR Website"

# Set the author for THIS repo only (don't change your global git config)
git config user.name  "wanderbywilson"
git config user.email "wilson@wanderbywilson.com"

# Verify
git config user.name      # → wanderbywilson
git config user.email     # → wilson@wanderbywilson.com

# Start the local dev server
python3 -m http.server 8080
# Site available at http://localhost:8080
```

---

## Production verification checklist

After every meaningful deploy, spot-check:

1. **Visit https://www.wanderbywilson.com** — homepage loads, hero photo renders, globe spins
2. **Click one blog post + one hotel + one journey** — all load cleanly
3. **Vercel Dashboard → Deployments** — green checkmark on the latest deploy
4. **GA4 Realtime report** — confirm your visit is tracked
5. **A random old URL** like `wanderbywilson.com/blog/sugar-beach-hotel-review` should 301 to the new post URL
