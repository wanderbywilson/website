# Wander by Wilson — Site Build Notes

> Working handoff doc for Claude. Read this before refining the site.
> Last updated: 2026-05-27.

---

## 1. Project at a glance
- **What:** Marketing site for **Wilson Schubert**, a luxury travel advisor. Replaces the current live site `wanderbywilson.com`.
- **Stack:** Vanilla static **HTML + CSS + JS**. No build step, no framework.
- **Serve locally:** `python3 -m http.server 8080` (run from project root). Open `http://localhost:8080/index.html`.
- **Affiliations (real):** SmartFlyer Rising Star '23 & '24 · Virtuoso · Jetset & Travel.
- **Brand name rule:** ALWAYS "**Wander by Wilson**" — **never** "Wander" alone (verb usages in taglines are borderline; avoid).
- **Aesthetic target:** "Travel chic" — younger affluent, design-led boutique-luxe (Borgo Santandrea, Il Pellicano, Le Sereno, Mezzatorre, Palm Heights, Eden Rock energy). NOT traditional/stuffy A&K.

## 2. Files & folders
- `index.html` — homepage (hero → benefits → atlas/globe → services → journal → founder → testimonials → brandmark-close).
- `property.html` — **data-driven** hotel page. `?slug=X` reads `PROPERTIES[X]` from data.js. Slug only in ATLAS_POINTS → interim page. Unknown slug → redirect to `index.html#atlas`.
- `journey.html` — data-driven itinerary page (`?slug=X` reads `ITINERARIES`).
- `post.html` — data-driven blog article (`?slug=X` reads `BLOG_POSTS`).
- `inspiration.html` — searchable blog index (search + tag chips).
- `journeys.html`, `services.html`, `inquire-trip.html`, `inquire-hotel.html`.
- `data.js` — `ATLAS_POINTS[]`, `PROPERTIES{}`, `ITINERARIES{}`.
- `blog-data.js` — `BLOG_POSTS{}`.
- `styles.css` — ALL styles (one file, ~6000+ lines).
- `fonts/` — Blackstone script (`blackstone-webfont.woff2` + `Blackstone.ttf`).
- `property-images/{slug}/`, `itinerary-images/{slug}/`, `blog-images/{slug}/`, `backgrounds/`, `logos/`.

## 3. Cache-busting — CRITICAL
- Every HTML file links assets as `styles.css?v=N`, `data.js?v=N`, `blog-data.js?v=2`.
- **Whenever you edit styles.css / data.js / blog-data.js, BUMP `?v=N` across ALL html**, or the browser serves stale cached files.
  - Pattern: `perl -pi -e 's/styles\.css\?v=110/styles.css?v=111/g;' *.html`
- **HTML files are NOT versioned.** When testing in the browser, append a throwaway `?cb=N` to the URL to force fresh HTML.
- **Current versions (at this save):** `styles.css?v=269`, `data.js?v=92`, `blog-data-v17.js`.
  - **Note:** blog data is now cache-busted by FILENAME (`blog-data-v15.js` → `blog-data-v17.js`), not `?v=N`. Bumping it means `git mv` + a perl sweep across all HTML: `grep -rl "blog-data-v17.js" --include="*.html" . | xargs perl -pi -e 's/blog-data-v17\.js/blog-data-v18.js/g'` (48 files).

## 🚀 SEO foundation (2026-05-28) — DEPLOY-READY FILES

Critical-tier SEO work done. Four new files at the project root + canonical tags + per-post OG injection.

- **`sitemap.xml`** — 85 URLs: 9 static + 44 blog posts + 29 properties + 3 journeys. Generated from data.js + blog-data.js (re-runnable: see `/tmp/wbw-slugs.json`). lastmod = today; priorities tiered (homepage 1.0, main nav 0.9, posts/hotels 0.7, legal 0.3).
- **`robots.txt`** — Allows all crawlers; disallows `SITE-NOTES.md`, `.bak*`, `brand-kit*.html`, `brandmark-studio.html`. References sitemap.xml URL.
- **`vercel.json`** — 99 × 301 redirects from old Squarespace URLs: each blog post (`/blog/SLUG` + trailing-slash variant → `/post.html?slug=SLUG`), `/blog` → `/inspiration.html`, `/contact` → `/inquire-trip.html`, `/work-with-me*` → `/services.html`, `/about` → `/index.html#about`. Plus catch-all `/blog/:slug*` for unknown old posts → `/inspiration.html`. Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) + 1yr immutable cache on `/blog-images/*` and static assets.
- **`404.html`** — Branded "page wandered off" — large 404 numeral, italic title, primary "Back to home" + secondary "Get in touch" CTAs, quicklinks row. `<meta robots="noindex">`. Vercel auto-serves this for unmatched routes.
- **Canonical tags** added to all 9 static pages (`<link rel="canonical">` after `<title>`). Dynamic pages (`post.html` / `property.html` / `journey.html`) inject per-slug canonical + Open Graph + Twitter Card tags via JS in their load functions.
- **Per-post OG tags** for social sharing: `og:title`, `og:description`, `og:image` (full hero URL), `og:url`, `og:type`, `twitter:card="summary_large_image"`. Now every blog/hotel/journey link shared in iMessage/WhatsApp/FB/LinkedIn shows a rich preview.

**Domain decision: `www.wanderbywilson.com` is the canonical** (matches old Squarespace exactly — lowest backlink-loss risk). Apex (`wanderbywilson.com`) → www enforced via Vercel Dashboard's domain settings, not vercel.json.

**Still pending (Wilson):**
- ✅ ~~Create Vercel account~~ — DONE
- ✅ ~~Set up GA4 → send Measurement ID~~ — DONE (G-7QN83N7QQS), gtag installed on all 13 pages with `anonymize_ip: true` (GDPR-friendly)
- ✅ ~~Verify Google Search Console~~ — DONE via DNS TXT record (Domain property, permanent verification — survives all hosting changes)
- Bing Webmaster Tools (one-click import from GSC) — do anytime
- DNS update: point `wanderbywilson.com` and `www.` records at Vercel (do this at cutover)
- After deploy: submit sitemap.xml in GSC; spot-check 10 random redirects work

**GA4 install details (2026-05-28):** Measurement ID `G-7QN83N7QQS` installed via the standard gtag snippet (async load) placed right before `</head>` on all 13 user-facing pages (excludes brand-kit*, brandmark-studio — internal tools). Used `anonymize_ip: true` for GDPR friendliness. **NOT** installed via Squarespace's integration (which would die at cutover) — manual install means tracking starts the moment the Vercel deploy goes live and survives the DNS switch seamlessly. Pages tracked: index, hotels, journeys, inspiration, services, inquire-trip, inquire-hotel, privacy, terms, post (dynamic), property (dynamic), journey (dynamic), 404.

  - styles v137: **Blog-post heading size harmonization.** The audit revealed two real font-sizing inconsistencies: (1) **same content type at different sizes across posts** — hotel names render as h2 in the "20-Best Caribbean" flat-list post but as h3 in destination roundups (Norway/Tuscany/etc. are the h2 there), so the SAME hotel could appear at 40px in one post and 25px in another (1.6× ratio); (2) **h3 was only ~4px above body copy** (25px vs 21px), so sub-section headings felt underpowered. Tightened the scale: `.article-body h2` 28→38px max (was 40), `.article-body h3` 22→30px max (was 20→25). New h2/h3 ratio is 1.27× instead of 1.6× — much more uniform across posts. Bumped h3 weight via `font-variation-settings: "opsz" 80` for a hair more presence at the larger size. Added `letter-spacing: -0.01em` and `text-wrap: balance` to h3 for parity with h2. Added `.article-body h2 + h3 { margin-top: 18px }` so a section heading immediately followed by a sub-section heading reads as a single typographic unit. Top margins bumped (h2 52→56, h3 36→42) for cleaner section breathing room.
  - blog-data v10: **Pseudo-heading promotion** — fixed the second wave of heading inconsistency the v9 pass missed. Squarespace had inconsistently saved many hotel section headings + sub-section headings as `<p><strong>X</strong></p>` (or `<p><a><strong>X</strong></a></p>`) instead of `<h3>X</h3>`. The screenshot example was 'Cheval Blanc Seychelles' rendering as a big gold h3 right next to 'Four Seasons Seychelles (Mahé)' rendering as a small bold paragraph — same role, different tag. New `promote_pseudo_headings()` step in convert3.py promotes a `<p>` to `<h3>` when it CLEARLY acts as a heading: (1) `<p><a><strong>X</strong></a></p>` — bold link, no other content; (2) `<p><strong>X</strong></p>` starting with 'N. ' (numbered hotels: "1. Royal Mansour", "2. Naviva..."); (3) `<p><strong>X</strong></p>` whose next sibling is a substantive `<p>` (>=40 chars) OR a `<ul>`/`<ol>` (heading-before-list pattern). **Skips** sequences of bold lines (perk lists like "Complimentary Wi-Fi" / "$100 Resort Credit"). Net: **125 paragraphs promoted to h3.** After-state: "How to Get There" 0 p / 15 h3 (was 2/13), "Why We Love It" 0 p / 5 h3 (was 5/0), "Top Activities to Do" 0 p / 6 h3 (was 6/0). 38 bold paragraphs remain — all are genuine perk-list items, Day X labels (inside `<ol>`), or single emphasized lines. Posts now have visually uniform heading rhythm across all 44.
  - styles v136: **Inspiration grid card readability fix.** White-on-image titles were getting lost over bright skies + beaches (April, May, July, February, Caribbean roundup, etc.). Rebuilt `.inspo-card-scrim` from a soft 2-stop (`rgba(20,16,12,0)` 38%→`rgba(20,16,12,0.72)` 100%) into a 6-stop eased gradient (0→0.04→0.22→0.55→0.82→0.92, darker base color `rgba(10,8,6,*)`) so the dark band reaches near-black where the title sits while the top of the photo stays open. Added layered text-shadows to `.inspo-card-title` (`0 2px 4px rgba(0,0,0,0.55), 0 4px 24px rgba(0,0,0,0.45)`) and `.inspo-card-eyebrow` (`0 1px 3px rgba(0,0,0,0.55), 0 0 12px rgba(0,0,0,0.35)`) — the tight drop sharpens letterforms on busy backgrounds, the long blur carves contrast against bright skies. Eyebrow opacity nudged 0.85→0.92. **Belt-and-suspenders: even if a photo is fully white, the text-shadow halo alone keeps the title legible.**
  - blog-data v9: **Heading-typography cleanup across all 44 blog posts.** Three Squarespace artifacts were degrading heading rendering: (1) **386 headings** were fully wrapped in `<strong>` even though h2/h3 already have heading font-weight — created inconsistent letterform weight; (2) **14 headings contained inquire-trip.html / services.html CTA links** (e.g. `<h2>Why Book with <a>WANDER BY WILSON</a>? Exclusive Perks…</h2>` — the all-caps text + link underline made the heading look broken); (3) **133 headings had partial `<strong>` mixed with anchors** (e.g. `<h2><strong>Book With </strong><a><strong>WANDER BY WILSON</strong></a><strong> for Perks</strong></h2>`). Fix added to `/tmp/wbw-blog/convert3.py` as `clean_heading_typography()`: walks every h2/h3/h4/h5, replaces inquire-trip/services links with their plain text (title-casing `WANDER BY WILSON` → `Wander by Wilson`), then `drop_tag()`s every `<strong>`/`<b>` inside the heading. **Virtuoso hotel links (147) preserved as-is** — they're intentional booking CTAs (e.g. `<h3><a>COMO Castello Del Nero</a></h3>` now clean, single-element). Audit after: 0 fully-strong-wrapped headings, 0 partial-strong, 0 inquire-trip in headings, 0 'WANDER BY WILSON' all-caps. File: 691 KB → 680 KB.
  - blog-data v8: **Stripped Squarespace's visible "image-description" captions** (370 italic `<p><em>…</em></p>` paragraphs that immediately followed `<figure>` and duplicated the alt text). They weren't real editorial captions — Squarespace was rendering its image-block description *both* as `alt=""` *and* as a visible italic paragraph below the image. The alt text (428 imgs, all preserved) is what serves SEO + screen readers; the duplicated visible text just looked like AI-generated SEO noise. After: 0 italic-only paragraphs follow figures, 428 alt attrs intact, 428 figures intact, 141 *real* paragraphs that follow figures preserved (those are body copy, not captions). Cleanup also applied to `/tmp/wbw-blog/convert3.py` via a new `remove_image_caption_paragraphs()` step so re-running migration won't bring them back.
  - blog-data v7 + styles v135: **Blog filter system redesigned** — replaced the messy single tag-chip bar (~25–40 mixed chips like "2024", "Anguilla", "ULTIMATE GUIDE…") with **two clean filter rows on `inspiration.html`**. Each BLOG_POSTS entry now carries `location` (single, one of: Worldwide / Caribbean / Mexico / United States / Italy / Greece / France / Asia) and `tripTypes` (array, any of: Honeymoon / Babymoon / Family / Hotel Review / Travel Guide / Itinerary / Travel Inspiration). Derivation: per-slug `LOC_OVERRIDE` for ambiguous ones (round-ups → Worldwide, etc.), then Squarespace category match, then title-keyword match (in `/tmp/wbw-blog/convert3.py`). Distribution: Worldwide 18 / Caribbean 8 / United States 5 / Greece 3 / Italy 3 / Asia 3 / France 2 / Mexico 2 — trip types led by Honeymoon 16, Hotel Review 11, Travel Inspiration 10, Travel Guide 7. UI: two `.inspo-filter-row`s, each with a small uppercase label + the existing `.inspo-chip` chips; both filters AND together; existing search box still narrows further. Card eyebrow now shows `location` (was first tag). URL params `?location=` and `?type=` honored. Verified: All 44 → Caribbean 8 → Caribbean+Honeymoon 2.
  - blog-data v6: **CTA cleanup + hero image refresh.** Regenerated from source via `/tmp/wbw-blog/convert3.py` with two additions: (1) **All 109 Squarespace button-blocks removed** (every one pointed to /contact or /work-with-me — variants: "Get a Quote", "Book Now", "Start Planning Today", "Plan Your Honeymoon Today", "Book With Perks", etc.). Detector matches any element whose own class contains `button-block`/`sqs-block-button`/`sqs-button-element` (don't walk descendants — that would nuke parent containers). Also dropped 30 "soft" CTA paragraphs whose content was dominated by an inquire-trip.html link. (2) **Hero images swapped from Pinterest-style collages → first inline body photo** (all 44 posts now have a clean photographic hero matching the site aesthetic; e.g., June honeymoon hero is now `main-pool.png` instead of the "Top Honeymoon Destinations for June 2026" text-on-image collage). Inquire-trip.html hrefs dropped 186→62 (kept only inline editorial mentions). Verified June post: 0 CTA phrases remaining, clean photo hero, body intact.
  - blog-data v5: **Cleaner pass + link repoint** (because Squarespace is being shut down). Regenerated from source (script `/tmp/wbw-blog/convert2.py`) with three fixes: (1) `<style>/<script>/<noscript>/<iframe>` etc. are now REMOVED entirely (v4 only "unwrapped" them, which kept the CSS text — that's why `#block-… { --tweak-text-block-… }` was visible at the end of posts); (2) all `wanderbywilson.com/contact` URLs (76) → `inquire-trip.html`; (3) all internal `wanderbywilson.com/blog/X` cross-links (132) → `post.html?slug=X` (gracefully falls back to `inspiration.html` for any slug not in our 44); `/work-with-me-1` → `services.html`; catch-all any other wanderbywilson.com URL → `inquire-trip.html`. **Final audit: 0 wanderbywilson.com hrefs, 0 squarespace-cdn refs, 0 leaked CSS, 0 `<style>/<script>` tags.** File trimmed 1208 KB → 734 KB. Verified on June-honeymoon post (the original CSS-leak example): clean.
  - blog-data v4: **All blog images downloaded locally** (Squarespace site is being shut down — site is now fully self-contained). 474 unique CDN images → `blog-images/{slug}/{file}` (~391 MB across 520 files). Every `images.squarespace-cdn.com` URL in blog-data.js was rewritten to the local relative path; **zero remaining CDN references**. Re-runnable download script at `/tmp/wbw-blog/download.py` (idempotent — skips already-present files). Verified: sugar-beach post loads hero + all 9 body imgs from `localhost`. **Heads-up: blog-images dir is large (391 MB).** Worth optimizing before deploy — running these through Pillow at max-width 1800px + WebP/JPEG q≈82 would likely drop it to ~70–100 MB with no perceptible quality loss. Easy follow-up.
  - blog-data v3: **MIGRATED ALL 44 BLOG POSTS** from wanderbywilson.com → blog-data.js (1.2 MB). Pulled via Squarespace JSON feed (`/blog?format=json-pretty` + pagination). Each entry: `slug` = source `urlId`, hero from `assetUrl`, date from `publishOn` (ms→"Month YYYY"), readTime estimated from word count, tags = source tags+categories. **Body HTML cleaned with lxml** (script `/tmp/wbw-blog/convert.py`): stripped `sqs-block` wrappers / inline styles / data-* attrs; kept only semantic `<h2>/<h3>/<p>/<ul>/<li>/<a>/<strong>/<em>/<img>`; `<img>` rewrapped in `<figure>`; external `<a>` get `target=_blank rel=noopener`. **Images served from `images.squarespace-cdn.com` (originals preserved, NOT re-hosted)**, links preserved. Homepage journal cards repointed to new source slugs (`25-of-the-best-honeymoon-destinations-around-the-world`, `sugar-beach-hotel-review`, `top-babymoon-destinations-for-every-month-of-the-year`). Verified: inspiration index renders 44 cards; sugar-beach post = 4 h2 / 10 h3 / 32 p / 9 imgs / 5 links, hero+body on CDN.
  - v131/v132: **SITE-WIDE TYPE SCALE-UP rolled out** (matches the approved services-page sizing). Added a single "type scale-up" layer at the TRUE END of `styles.css` (after the last `body.is-home` color block) — must be at the end so it wins by source order over rules defined later. Covers: homepage (partners/atlas/services/journal ledes 20→22 / 22→24; founder-prose p 18→20; testimonial quote 17→20), property (prose 19→20, perks-list 17→19, perks-note 16→17, rate-value clamp max 34→38, tooltip 13→14, fallback/interim ledes 18→20), journey (overview-prose / bestfor clamp max 22→24, tailor-body 18→21, leg-title 26→28, leg-stay/leg-desc 17→18/19, leg-tags 15→16, stay-name 22→24, stay-nights/stay-desc 14→15 / 13→15, highlight-label 20→22, inclusions-heading 26→28, inclusions-list 16→18, close-lede 19→20, why-body 18→20, whybook intro/list 17→18), index pages (journeys-index-lede clamp max 22→24, name clamp max 34→38, stats 15→16 — also covers `hotels.html` via shared classes), inspiration (hero-lede 18→20, card-title clamp max 27→30, card-dek 15→16, search 14→15), inquire forms (hero-lede clamp max 20→23, input/textarea 16→17, check-text 15→16, field-note 14→15, submit-note 13→14), legal (prose p/li 16→18; intro 19 kept). **Big display titles untouched** (hero-bleed, atlas-title, founder-title, property-title, journal-title, journeys-index-title, etc.). **Gotcha encountered & fixed**: initially appended the layer after the services block (~line 4900), but many target rules are defined later (journal-lede 5285, inspo-* 5335, journey-whybook 5868, etc.) and won on source order. Moved the whole layer to the true file end (after line 6576) so all overrides win. Verified on services / homepage / property / journey / legal / inspiration.
  - v130: **Whole-page type scale-up — SERVICES PAGE (reference for a planned site-wide pass).** The v129 body-only bump was replaced with a comprehensive scoped override block (after `.is-services-page .package--signature`) that enlarges EVERYTHING, ratios preserved: body copy → 18–20px (package-desc/list/faq-a/process/alacarte 19, value-copy/faq-list 18, tagline 20); ledes → intro `clamp(20,1.9vw,26)`, close `clamp(19,1.7vw,23)`; headings → package-name `clamp(30,2.9vw,40)`, pullquote `clamp(23,2.2vw,30)`, faq-q / value-headline / price-value `clamp(21,1.9vw,26)`, compare-name 22; uppercase labels +1px (9–10→11, 11→12). **Hero title left at clamp(52,6.4vw,92) — already display-scale.** Verified @~1336px: intro-lede 26, package-name 40, descriptions 19, faq-q 26. **TODO: roll the same scale-up across the other pages once Wilson confirms the services magnitude.**
  - v127/v128: **Services page reskinned to the homepage's crisp white.** `.is-services-page` bg `#FFFFFF`→`#FCFCFB` (+`--paper` #FCFCFB); the former cream bands (`.packages`, `.process`, `.services-close`, `.package-partners` were `#F7F2EB`) → `transparent` (uniform crisp white); testimonial cards → solid `#FFFFFF` (homepage style). **Full-Service package (`#package-03 .package--signature`) kept distinct**: champagne tint deepened (`rgba(195,162,106,0.12→0.04)`) + restored its **bold 3px gold top border** (the `.is-services-page .package` hairline rule was muting it — fixed with `.is-services-page .package--signature { border-top-color: var(--gold) }`). Did NOT add the homepage's line texture (kept clean for this table/content-heavy page) — can add for exact parity if wanted.
  - v126: Blog post → **best-in-class "full-bleed grid" layout** (Wilson wanted it wider; posts are image-rich, ~26 photos each). `.article-body` is now a 3-col grid `minmax(0,1fr) min(100%,780px) minmax(0,1fr)`: body text holds an optimal **780px (~73ch)** reading measure (centered), while `> figure` spans `1/-1` and **breaks out to the full frame (~1256px on large desktops)** — big immersive photos. Frame (`.article-container` + `.article-hero-inner`) widened to `clamp(900px, 86vw, 1400px)`; hero-inner got the SAME grid so the hero title aligns with the body text column. Verified @2331px: text 780 / figure 1256 / hero-title aligned. **Rationale: reading measure capped ~73ch for readability (best practice ≤75ch); the "wider" is delivered by the imagery, not line length.**
  - v125: Blog post column was still too narrow on large desktops (820px max-width MINUS 72px container padding each side = only ~676px of actual text). Widened both `.article-container` AND `.article-hero-inner` to a shared `max-width: clamp(820px, 64vw, 1120px)` (+ gave hero-inner `width:100%` since it's a flex item that was shrink-wrapping to the title). Now at ~2070px viewport: column 1120px, text measure ~976px (~80 chars @ 21px), hero title + body left edges aligned. Floors at 820px on laptops/tablets. **Gotcha: `.article-container` carries the 72px `--container-pad` on each side, so real text width = max-width − 144px.**
  - v124: Blog post (`.article-*`) responsive sizing pass — was fixed 18px body in a 760px column (looked small/sparse on large desktops). Now FLUID: `.article-body p` `clamp(18px, 0.65vw + 0.78rem, 21px)`, `li` `clamp(17px, 0.6vw + 0.74rem, 20px)`, `.article-container` max-width 760→**820px**, `h2` clamp max 34→40px, `h3` 22→25px, `.article-hero-title` clamp max 66→78px, `.article-section` padding now fluid clamps. Removed the old `@media(max-width:720px){ .article-body p{font-size:17px} }` (fluid floor of 18px handles mobile). Verified @1188px: body 20.2px, column 820px (clamp parses, no fallback). **Reusable fluid-type formula here if other pages need the same treatment.**
  - v123: Homepage testimonials — bumped box text (`.testimonial-quote` 18→20px, `.testimonial-name` 15→16px, `.testimonial-context` 11→12px; mobile quote 17→18px) AND made the carousel **auto-advance** (index.html inline JS, the `.testimonials-carousel` IIFE): advances one card every 5.5s, loops, pauses on hover + when tab hidden, respects reduced-motion, resets timer on manual arrow nav. (Note: this autoplay only runs because the v-fix wrapped the globe init in try/catch — otherwise a globe throw aborts this IIFE too.)
  - v122: property-page booking microcopy (`.property-perks-note`, "Bookings are completed on our preferred booking portal…") bumped 14px → 16px (line-height 1.6, max-width 480px).
  - 🔴 CRITICAL BUGFIX (index.html inline script, HTML-only — no cache bump): **Homepage sections rendered BLANK when WebGL was unavailable.** Root cause: the `initAtlas()` globe init calls `Globe()(el)` (creates a WebGL context). If WebGL fails (dead GPU / disabled / locked-down device), it threw an *uncaught* error — and because the globe, testimonials carousel, and the scroll-reveal observer all live in ONE big `<script>`, the throw aborted everything after it. The scroll-reveal system never ran, so all `[data-reveal]` elements stayed at `opacity:0` → blank. Fix: (1) wrapped the whole `initAtlas` body in `try/catch` so a globe failure is contained; (2) added a **failsafe backstop** to the reveal IIFE — on scroll/resize/load it reveals any in-view `[data-reveal]` the observer missed, plus an `IntersectionObserver`-unsupported guard. Verified: before fix scrolling revealed 0/10 sections, after fix 10/10 (opacity→1). **Gotcha: don't put fragile third-party/WebGL init in the same `<script>` as critical render logic without a try/catch.** (This session's MCP Chrome had a GPU-process crash, which is how it surfaced.)
  - v121 / NEW PAGES `privacy.html` + `terms.html` + **site-wide footer**: Added a `.site-footer` (Deep Yacht Blue `#1E3552`, ivory text) to ALL 12 pages — wordmark + tagline, quick links (Hotels/Journeys/Services/Inspiration/About), an **Instagram link** (`@wanderbywilson` → https://www.instagram.com/wanderbywilson/), and a base row with `© 2026` + **Privacy Policy / Terms & Conditions** links. Footer was bulk-injected before `</body>` via perl (idempotent — guards on `<footer class="site-footer"`). The two legal pages (`.is-legal-page` + `.legal-*` CSS) use Wilson's OWN finalized text pulled from the Drive "WNDR Website" folder (Privacy = 14 sections, Terms = 23 sections; Atlanta GA, SmartFlyer/Virtuoso, planning-fee non-refundable, CCPA/GDPR). Legal contact email unified to **`wilson@wanderbywilson.com`** (changed from the docs' original `hello@`, to match the forms). NOTE: the decorative `brandmark-close` (big WW) still sits above the footer on index/post/inspiration — left as-is; could be removed if it reads redundant.
  - v120: **Inquiry forms now wired to Formspree** (live, replaces `action="#"`). Trip → `https://formspree.io/f/xwvzanjd`; Hotel → `https://formspree.io/f/xnjrlbkq`. Each form: `method="POST"`, a hidden `_subject`, a hidden `_gotcha` honeypot (`.inquire-hp`, off-screen), checkboxes given `value="yes"` (readable in the email), and an AJAX submit handler (fetch + `Accept: application/json`) that shows an inline `.inquire-success` card and hides the form (graceful fallback to a normal POST if JS is off). Errors surface in `.inquire-error` (coral). Reply-to is auto-set by Formspree from the `email` field. **Formspree free tier = 50 submissions/mo. Wilson must do the FIRST real submission on each form and click Formspree's activation email to turn it on.** Newsletter opt-in currently just arrives as a field ("newsletter: yes") — not yet wired to a mailing tool.
  - v119 / NEW PAGE `hotels.html`: a searchable hotel directory. Iterates `PROPERTIES` (29 hotels, sorted A→Z by name) into cards (reusing `.journeys-index-*` grid/card classes) that link to `property.html?slug=KEY`. Live text search (`#hotelsSearch`) filters on name+location (entities decoded + punctuation/apostrophes normalized so "claridges" matches "Claridge's"); shows a live "N of 29 hotels" count (`.hotels-index-count`) and an `.inspo-no-results` empty state. Reached via a **"Browse all hotels" button** (`.atlas-browse`, reuses `.cta-primary`) added under the homepage atlas globe (in `#atlas` / the Destinations section). New CSS: `.journeys-index-hero .inspo-search`, `.hotels-index-count`, `.atlas-browse`. NOT added to the top nav (per Wilson's choice).
  - Top nav: renamed **"Destinations" → "Hotels"** across all pages. **UPDATE: the "Hotels" link (top nav AND footer, all 24 instances) now points to `hotels.html`** (the searchable collection page) — changed from the earlier `#atlas` globe anchor per Wilson. The globe section (`#atlas`) still exists on the homepage (reachable by scrolling + via property pages' "back to atlas" links) and still has its "Browse all hotels" button → `hotels.html`; it's just no longer the nav target. HTML-only change, no cache bump.
  - v118: Advisor-tip box on property pages (`.property-agent-tip`) background `--bone` (muddy sand) → `--ivory` (#F7F2EB champagne), matching the form inputs / journey bands.
  - v117 — BUGFIX (property pages): the "?" rate-info button showed blank on every property, not just converted-currency ones. Root cause: `.property-rate-info { display: inline-flex }` (an author rule) overrides the UA `[hidden]{display:none}`, so the JS `hidden` attribute didn't actually hide it. Fix: added `.property-rate[hidden], .property-rate-lines[hidden], .property-rate-info[hidden] { display:none; }`. **Gotcha to remember: if you toggle an element via the `hidden` attribute in JS but the element also has a `display` rule in CSS, you MUST add a `selector[hidden]{display:none}` override or `hidden` is silently ignored.** Only `southern-ocean-lodge` has `rateInfo` (AUD→USD), so only it shows the button now.
  - v116: Hotel inquiry form — hero lede reworded ("Tell us where you'd like to stay and we will attach our…", + matching meta). "Have you already booked directly?" → "Yes" option now reads "…please add your complimentary preferred-partner perks!"; added `#bookedNote` (`.inquire-field-note`) under the select that reveals via JS only when "already_booked" is chosen, telling them to forward the confirmation to wilson@wanderbywilson.com (mailto). New CSS `.inquire-field-note` (+ gold link).
  - v114: journey-template band sections (`.journey-itinerary`, `.journey-inclusions`, `.journey-why`) changed from Soft Sand `--bone` (#D9CBB6 — too dark, gold text unreadable) → Ivory `--ivory` (#F7F2EB). Keeps the warm white↔ivory alternating rhythm; gold accents went 1.5:1→2.2:1, navy titles 11:1. `.journey-leg-image`/`.journey-stay-image` left `--bone-warm` (they're photo placeholders, hidden behind images).
  - v115 / data v59: (1) Africa journey (`safari-and-beach`) — removed the "Why we love this journey" pull-quote (deleted `wilsonNote`/`wilsonNoteLabel` from data.js; added a guard in journey.html so an empty `wilsonNote` hides `#journeyPullquote` entirely — Japan & Greece still use it). (2) Journey whybook heading "Why book this **through** Wander by Wilson?" → "**with**" (both data.js instances: Japan + Greece). (3) Inquiry forms: budget dropdown now 5k/10k increments; Full-Service package option now "$500+ design fee, depends on scope of the trip — our most popular service"; added a required planning-fees acknowledgment checkbox (trip form only), a "who referred you" text field (both forms), and a newsletter opt-in checkbox (both forms). New checkbox CSS: `.inquire-checks` / `.inquire-check` / `.inquire-check-text`. (4) Form shaded inputs (`.inquire-input`/`.inquire-textarea`) recolored from `--bone` (muddy sand) → `--ivory` (#F7F2EB champagne) for readability.

## 4. Verification workflow & environment gotchas
- Browser automation = Chrome MCP. Flow: `tabs_context_mcp` (get/create tab) → `navigate` → `javascript_tool` (DOM checks) → `computer` screenshot.
- **SCREENSHOT GLITCH (important):** cream/white text-heavy sections — **services, benefits text/collage, testimonials, founder** — frequently capture **blank white** on this localhost. Photo/video sections (hero, journal, property hero) usually capture fine. **→ Verify those sections with DOM reads (getComputedStyle, getBoundingClientRect), not screenshots.**
- **Scroll drift:** programmatic `scrollIntoView`/`scrollTo` can drift before a screenshot fires. Set `document.documentElement.style.scrollBehavior='auto'` first; re-check position.
- **Query-string URL filter:** tool RESULTS containing query-string URLs (`?itok=`, `?format=`) can be blocked by a harness filter. When testing external/CDN image URLs in JS, **return booleans/short strings, not the full URL.**
- **Linter races:** `index.html` is frequently re-touched by a linter between Read and Edit → "File has been modified since read." **Re-Read the region immediately before editing.**
- **:hover/:focus can't be triggered via JS** (automated tab lacks OS focus) → can't screenshot hover states. Verify the CSS rule is present and trust it; tell the user to hover.
- **No Node, no ImageMagick.** Python3 + **Pillow 11.3.0 IS available** (use it for image optimization). `sips` exists but its JPEG quality control is unreliable.

## 5. Design system

### Brand palette (official — provided by Wilson, 2026-05)
| Name | Hex |
|---|---|
| Deep Yacht Blue | `#1E3552` |
| Vintage Gold | `#C3A26A` |
| Ivory | `#F7F2EB` |
| Seafoam | `#A9C6C3` |
| Coral | `#D78161` |
| Soft Sand | `#D9CBB6` |
| White | `#FFFFFF` |

### How the palette is applied (homepage "skin")
- Done by **overriding design tokens inside `body.is-home {}`** (appended at the END of styles.css). This catches every `var()`-driven element on the homepage:
  - `--ink: #1E3552` (dark = navy), `--gold: #C3A26A`, `--gold-soft: #D3B98C`, `--sea` & `--sea-soft: #A9C6C3`, `--sea-deep: #1E3552`, `--sun` & `--terracotta: #D78161`, `--bone` & `--bone-warm: #D9CBB6`, `--paper` & `--ivory: #F7F2EB`, `--shell: #FFFFFF`.
- Plus a body-copy navy override: `.is-home .partners-lede, .atlas-lede, .journal-lede, .services-lede, .founder-prose, .testimonial-quote { color: rgba(30,53,82,0.86); }`.
- **Hardcoded near-blacks were converted (2026-05-27):** `rgba(14, 13, 12, ...)` and `#0E0D0C` → Deep Yacht Blue (`rgba(30, 53, 82, ...)` / `#1E3552`) site-wide, so body text/borders/shadows are navy-toned. The hero video scrims (`rgba(14, 12, 10, ...)`, ~28 instances) were intentionally LEFT neutral-dark — don't navy those.
- **Globe sphere** is hardcoded `#103D44` in the globe JS (NOT skinned) — left teal-blue because Wilson likes it.
- **Palette is now SITE-WIDE (2026-05-27):** `:root` carries the brand palette, so ALL inner pages (property/journey/services/blog/inquire) use it; the homepage additionally keeps matching `body.is-home` overrides. The "Original `:root` tokens" listed below are HISTORICAL (pre-reskin) — `:root` now holds the brand hexes.

### Original `:root` tokens (still used by inner pages)
- `--paper #F4EFE3`, `--ivory #FBF7EE`, `--ink #0E0D0C`, `--gold #B79770`, `--gold-soft #C9B08B`, `--bone #EDE6D6`, `--bone-warm #E4DAC6`.
- Coastal: `--sea #2E97A3`, `--sea-deep #18626B`, `--sea-soft #7FC4CB`, `--sea-wash rgba(46,151,163,0.07)`, `--sun #E3A53A`, `--terracotta #C2633C`, `--shell #FCFAF4`.

### Fonts
- `--font-serif: 'Fraunces'` (variable serif). `--font-sans: 'Inter'`. `--font-script: 'Blackstone'`.
- **Blackstone** = a **custom/commercial** script (Wilson's licensed file). Loaded via local `@font-face` (`fonts/blackstone-webfont.woff2`). **Do NOT reference from a CDN** — it's not a web font. Used for editorial script flourishes over photo corners.
- Earlier we tried **Parisienne** (Google script) — Wilson rejected it. Blackstone is the chosen one.

## 6. Homepage section state (current)
- **Hero:** dark crossfading video stack. 7 clips curated to the coastal/Med mood board: Capri · Amalfi · Caribbean · Lake Como · Maldives · Santorini · Tuscany (Safari + Machu Picchu were swapped OUT for fit; their URLs are archived in index.html comments). Left rail "N° 01 / [place]" kept; **right rail "Volume MMXXVI" removed.** CTA "Begin Planning" → inquire-trip.html; **hover LIGHTENS** (ivory fill, ink text) — was dark, changed for the crisp look.
- **Benefits ("The Benefits of Booking With Us"):** crisp white. Left = copy (kicker "Why book with us" + serif title + lede + CTA **"Book a Hotel With Perks" → `services.html#package-01`**). Right = **clean photo collage** (2-col offset mosaic, rounded corners, clickable → property pages, hover lift+zoom): Cap Juluca, Canaves Ena/Santorini, Hotel Esencia/Riviera Maya, Caruso. **Blackstone script "same rate. better outcome."** in Deep Yacht Blue straddling the top-left collage corner. Partner logo marquee below (full-bleed, looping, on the same white — no boxed strip).
- **Atlas/globe:** globe.gl. Dark-blue sphere `#103D44`, sandy markers, seafoam wash. **"Click any pin to explore" hint now STAYS** (auto-dismiss removed). `atlas-lede` is 22px.
- **Services ("What Booking Online Can't Do" / kicker "How We Work"):** faint **Amanzoe** villa bg (`backgrounds/amanzoe-villa.jpg`, opacity 0.12). **Normal height** — the sticky text-lock/scrolling-bg effect was built then REMOVED (Wilson found the tall section too thick).
- **Journal** ("From the Journal" — 3 blog cards). 
- **Founder** (`#about`): Wilson portrait (`wilson.jpg`) in left column. **Blackstone tagline "elevated itineraries. / effortless travel."** (two lines) in Deep Yacht Blue, straddling the photo's **top-left corner** (matched to the benefits-script placement: `top:-0.62em; left:-6px; transform-origin:left top; rotate(-9deg)`).
- **Testimonials ("In their own words" / "From our travelers"):** white cards w/ soft shadow + 3px radius (was cream — Wilson disliked cream). Faint **Splendido/Portofino pool** bg (`backgrounds/splendido-pool.jpg`, opacity 0.14). Carousel of 5 text quotes. **PENDING:** image+quote layout (waiting on Wilson to drop happy-traveler photos in — see §8 facial policy).
- **Brandmark-close:** "Wander by Wilson" (Volume MMXXVI removed).
- **Section subtext sizes** bumped: section ledes 18→20px; atlas/globe lede →22px.
- **Scroll-reveal:** `[data-reveal]` (fade+rise) + `[data-reveal-group]` (staggered children) via IntersectionObserver in index.html. Respects prefers-reduced-motion. Homepage-only.
- **Kicker hairline:** single fine `var(--gold)` line (52×1px). An earlier "awning stripe" (sun/sea repeating gradient) was rejected as "cheap."

## 7. Data templates
### PROPERTIES{} entry (data.js)
```js
'slug': {
  name, location,
  rateFrom: '$X / night' | '€X / night',   // estimate; flagged
  rateNote: 'All-inclusive',               // optional
  rateInfo: '...converted to USD...',      // optional → shows a "?" tooltip
  rateLines: [{label:'Resort',value:'$X / night'}, ...], // optional, instead of rateFrom
  heroImage: 'property-images/slug/00-hero.jpg',
  brandBadge: 'logos/bellini-club.png', brandBadgeAlt: '...', // optional
  description: "HTML string (original prose, &rsquo; &mdash; ok)",
  perks: ['...', ...],
  gallery: ['property-images/slug/01.jpg', ...],  // optional; hidden if absent
  idealFor: "...",   // optional ("Best for")
  agentTip: "...",   // optional (advisor tip)
  bookingUrl: '#'    // '#' or absent → routes to inquiry; else Virtuoso/Belmond URL → new tab
}
```
- **Currency rule:** USD/EUR/GBP shown native. Any OTHER currency → convert to USD + add `rateInfo` note. **Use literal `€`/`£` chars in data.js** (rates are set via `textContent`, which does NOT decode `&euro;`).
- `document.title` and `img.alt` are decoded via a temp-textarea helper in property.html (handles `&mdash;` etc.), but prefer literal chars in `name`.
- ALL ~28 researched hotel rates are **flagged estimates** — verify against rate cards before going public.
- **Caruso** entry exists (`caruso`, Belmond/Ravello) but has only 1 photo (hero, no gallery), `€1,800` estimate, `bookingUrl:'#'` — needs more photos + a real booking link.

## 8. Mistakes made → fixes (LEARNINGS)
- **`overflow:hidden` silently breaks `position:sticky`.** `body` had `overflow-x:hidden`; `.services` had `overflow:hidden` → sticky children wouldn't pin. **FIX: use `overflow-x: clip` / `overflow: clip`** (clips the same but does NOT create a scroll container). Remember this for ANY future sticky work.
- **HTML entities rendered literally in `document.title`** (e.g. "Eden Rock &mdash; St Barths"). FIX: decode via a throwaway `<textarea>` element before setting title + alt.
- **`&euro;` showed literally** when set via `textContent` → use the literal `€` character.
- **Color clashes:** Wilson dislikes red/orange that fights the coastal palette (rejected the Il Pellicano red-lounger shot; caught Eden Rock's red-striped loungers). **Always Read (view) candidate images to vet colors before using.** Palette = turquoise / white / sand / seafoam / sunny yellow; **coral is OK** as an intentional palette accent.
- **Gimmicky > chic = rejected:** Parisienne + polaroid frames (with handwritten captions) → rejected; pivoted to a clean frameless photo collage. The "awning stripe" kicker → rejected ("cheap"). Wilson wants restrained/editorial.
- **Over-tall pinned section rejected:** sticky lock needs big extra height (≈150vh) → reads as a "thick banner." Removed.
- **Huge source images:** Wilson drops full-res files (28–53 MB). **MUST optimize.** Use Pillow:
  ```python
  from PIL import Image
  im = Image.open(src).convert('RGB')
  im.thumbnail((MAXW, MAXW), Image.LANCZOS)
  im.save(dst, 'JPEG', quality=72, optimize=True, progressive=True)
  ```
  Targets: section bg ~2000px wide / ~600KB; collage/foreground ~1200px wide / ~400KB.
- **Facial-image policy:** Do **not** scrape/download photos of people from the web (even Wilson's own site) — privacy/safety line. For client/testimonial photos, **ask Wilson to drop the files into the project** (he's done this for fonts + hotel photos). The testimonials image+quote layout is blocked on this.
- **CSS perl gotcha:** `font-size` is usually NOT the first declaration in a rule (font-family/weight come first). Use a non-greedy span anchored to the class: `s/(\.class \{[^}]*?font-size: )18px/${1}20px/`. Always class-anchor when a value (e.g. `18px`) appears many times.
- **Duplicate selectors:** there are MULTIPLE `.testimonial-card` and `.atlas-lede` rules; the **later one wins.** If a change "doesn't take," grep for all rules of that selector and edit the effective (last/most-specific) one. (Was bitten by this on the testimonial card bg.)
- **External hotlinks:** the Amanzoe bg was first hotlinked from aman.com (worked), then downloaded locally for reliability. Prefer local copies; downloading requires explicit user OK (it was given).

## 9. Open items / TODO
- [x] ~~Roll the brand palette site-wide~~ — **DONE (2026-05-27):** `:root` reskinned to brand palette + near-blacks → Deep Yacht Blue. Whole site unified.
- [ ] Decide globe sphere color: keep `#103D44` (Wilson likes) or align to Deep Yacht Blue `#1E3552`.
- [ ] Navy body text (`rgba(30,53,82,...)`) — can revert to near-black if Wilson prefers crisper.
- [ ] Testimonials **image + quote** layout — needs Wilson's happy-traveler photos dropped into the project.
- [ ] **Caruso** — add more photos (gallery) + a real booking link; confirm the €1,800 rate.
- [ ] Verify ALL hotel rate estimates against supplier/Virtuoso rate cards (esp. low-confidence ones + converted-currency ones).
- [ ] Delete giant unused originals in project root: `SPL-POOL-30.jpg`, `CAR-ACC-SUI-99.jpg`, `SPL-DEST-07.jpg` (~125MB; SPL-DEST-07 not used anywhere).
- [x] ~~Wire inquiry forms to a backend~~ — **DONE (2026-05-27):** both forms POST to Formspree via AJAX (trip `xwvzanjd`, hotel `xnjrlbkq`), inline thank-you, honeypot, custom subjects. See §3 v120.
- [ ] **★ GET THE SITE LIVE (host/deploy to the real domain) — do this FIRST.** Prerequisite for the items below: the Formspree forms only complete a real submission from the live domain, not the local preview.
- [ ] After live: Wilson does the **first real submission on each form** + clicks Formspree's **activation email** to switch submissions on.
- [ ] **Formspree client auto-reply** — set up a branded "thanks, we've got your inquiry — we respond within 48 hours" confirmation email sent to the inquirer (Formspree dashboard setting). Do after the forms are activated.
- [ ] Wire the **newsletter opt-in** to a real mailing tool (Mailchimp/Flodesk/etc.); right now it just arrives as a field ("newsletter: yes").
- [ ] `SITE-NOTES.md` (this file) should probably be excluded from any deploy.

## 10. Brand voice / copy rules
- Never "Wander" alone — always "Wander by Wilson."
- Original copy only; **don't reproduce large chunks** of copyrighted text. Short quotes (<15 words, in quotes) at most.
- Wilson wordsmiths copy himself — **flag any new copy I write as placeholder**.
- Script taglines are **lowercase** ("same rate. better outcome.", "elevated itineraries. effortless travel.").

## 11. Client proposal workflow (separate from the website)
- When Wilson asks for a **client proposal**, save it as a **native Google Doc** in the matching client folder inside the **Client Trips** shared drive (`0ABKIQIUtEhG6Uk9PVA`); use `contentMimeType=text/plain` for auto-conversion to a Google Doc. No "advisor on-call" phrasing; vague flavor only; put hotel links on the inclusions.

## 12. Proposal Studio (2026-07-29) — team-built client proposal pages

**What it is:** `/studio` (passcode `WANDER26`, stored server-side as the `STUDIO_PASSCODE` Vercel env var) lets Wilson + team build `/proposals/{id}` hotel-proposal pages without touching code or Claude. Pick hotels from the PROPERTIES library (photos/desc/gallery/booking link auto-pull), fill room/rate/dates, watch a live preview, hit Publish → instant client link (no deploy; stored in the **wndr-proposals** private Vercel Blob store, `store_a0Hhz6oudk0wWLQT`).

**Files:** `studio.html` (builder), `proposal.html` (renders static PROPOSALS first, then falls back to `GET /api/proposals?id=`), `api/proposals.js` (auth/list/load/save/delete, passcode-gated), `api/proposal-viewed.js` (first-open Brevo email to wilson@), `api/_blob.js` (raw Blob REST helper — repo has NO package.json; do not add npm deps).

**Features:** Prepared-for hero line, rates-valid-until note, per-hotel "Book this rate" toggle, per-hotel ✈ flight note (added 2026-07-29 — Wilson sometimes includes flight quotes), custom (non-library) hotels, Save-as-PDF (print CSS), draft autosave (localStorage), edit-after-publish (same link), "Your proposals" list with ✓ Opened flag. First real proposal: `apfel-caribbean-uf47` (Rock House imagery lives in `proposals/apfel-caribbean-images/`).

**Privacy model:** `X-Robots-Tag: noindex, nofollow` headers (vercel.json) on `/proposals/*`, `/proposal.html`, `/studio`, `/studio.html`, `/api/*` + meta noindex. robots.txt `Disallow: /proposals/` was deliberately REMOVED — blocking crawl would hide the noindex from Google (URL-only indexing risk). Never add proposals to the sitemap. Slugs get a random 4-char suffix (not enumerable). Blob store is private (403 without token).

**Beacon logic:** first open of a Studio proposal emails Wilson via Brevo. Suppressed for: browsers that have opened /studio (`localStorage wndr-team=1`), `?preview=1` links, and repeat views in the same session. Views tracked in `views/{id}.json` blobs.

**Gotchas:** vercel dev doesn't apply vercel.json headers locally (verify on prod). Studio and proposal.html reference `data.js?v=91` / `proposals-data.js?v=92` — bump on edits like everything else. Legacy Charleston/Caribbean entries in proposals-data.js are commented out (retired; kept as data-shape reference).

### §12 addendum (2026-07-29, round 2) — compliance + quote screenshots
- **CONTENT COMPLIANCE (Wilson, non-negotiable):** proposal descriptions/room copy must be VERBATIM from the hotel's site, its Virtuoso page, or our website library — never written or embellished (liability if a client books on an inaccurate claim). Hotel names = official names, plain text. Wilson's personal notes go in her email, not the page. Template auto-renders a photos-are-representative disclaimer.
- Per-hotel **amenities** (checkbox + editable list, prefilled from PROPERTIES perks), **deposit/cancellation fine-print block**, and **✈ flight note** now render on each hotel card; the global perks band is optional (empty list = hidden).
- **Quote-screenshot reader:** drop a screenshot on a hotel card in /studio → `api/parse-quote.js` (Claude `claude-opus-5` via raw fetch — NO SDK/package.json) extracts room/rate/rateNote/deposit/cancellation/dates verbatim. Requires `ANTHROPIC_API_KEY` env var on Vercel (returns a friendly 501 until added).
- Proposal pages now pin the site header visible (`is-scrolled` applied permanently).

### §12 addendum (2026-07-29, round 3) — lookbook layout, click-to-edit, AI writer
- **Lookbook layout** (Safari Portal-style, Wilson's request): each hotel is a split section — full-bleed photo sticky on the LEFT (100vh, "No. 0N" + name overlaid on a scrim), content scrolling on the RIGHT; the photo hands off to the next option as you scroll. Right panel shows a **3-photo click-through carousel** (gallery capped at 3 — "don't overwhelm"). Mobile (<980px) stacks. Print unsticks.
- **Click-to-edit preview:** in `?draft=1` mode the template marks fields `contenteditable` + `data-edit="path"`; blur → postMessage `wndr-edit {path,value}` → studio `applyEdit()` syncs state/form + autosaves WITHOUT re-pushing the iframe (no caret loss). Editable: title, prepared-for, lede, dates, valid-until, close title/lede, per-hotel room/rate/rateNote/flight/desc/roomDesc/deposit/cancellation.
- **AI writing assistant:** sticky bar at the bottom of the Studio form → `api/studio-ai.js` (claude-opus-5, raw fetch). WbW voice, TRIP-LEVEL COPY ONLY — system prompt refuses hotel-description writing (compliance). Insert buttons: title/intro/closing. Needs the same `ANTHROPIC_API_KEY` as parse-quote.
- ⚠️ **2026-07-29: Wilson's Mac hit 100% disk (< 500MB free)** during this session — flagged to her; avoid image-heavy work until cleared.

## 13. Book With Perks (2026-08-19) — the DIY hotel booking portal

**What it is:** Wilson's TravelWits self-book portal at `https://wanderbywilson.travelwits.com/`, password `WANDER`. Clients browse and book preferred-partner hotel rates themselves, confirm instantly, and manage/cancel their own booking; Wilson is notified on every booking so she can VIP the client before arrival. Complimentary — no planning fee. Goal: drive hotel-only booking volume.

**New page:** `book.html` → served at `/book` (rewrite in vercel.json). Sections: text hero ("Same rate. / Better arrival.") → access card (the code + the handoff button) → perks list → 3-step how-it-works → "Can't find your hotel?" close that falls back to `/inquire-hotel`.

**Password is published openly on the page** — Wilson's decision. The two advisors she cited as references both do the same (JetsetChristina publishes `JETSETTERS`, Go With Gray publishes `VIPTRAVELER`). The alternative pattern in the field is an email-gated form that delivers the code instantly (La Jolla Mom) — that captures leads but adds friction. If Wilson ever wants to switch, the swap is confined to `.book-access-card` plus a new API endpoint.

**Where it's linked from:**
- Top nav, **first slot**, label "Book With Perks" → `/book`. Added to all 119 nav-bearing pages (+ footer nav on the same 119, + the 404 quicklinks row).
- Homepage: `.portal-band` inserted between `.benefits` and `.atlas` — right after the perks pitch, where "so how do I get those?" lands.
- `hotels.html`: same `.portal-band` between the grid and the closing CTA.
- All 52 property pages (`hotels/*.html` + `property.html`): a `.property-portal-line` under the perks note — "Prefer to book it yourself? Use our booking portal →". Deliberately a SIBLING of `.property-perks-note`, because that note is JS-hidden for inquiry-only properties and this link should survive that.

**Routing (vercel.json):** rewrite `/book` → `/book.html`; 301 `/book.html` → `/book`; 302 alias group `/(book-hotels|book-a-hotel|booking-portal|portal|perks)` → `/book` for Instagram-bio links. In sitemap.xml at priority 0.9. Crawlable on purpose (it's a lead-gen page) — which does mean Google will index the word WANDER.

**Gotchas hit:**
- **`.cta-primary` already renders its own `→` via `::after`.** Adding an inline `<svg>` arrow gives you a double arrow. Use `<a class="cta-primary"><span class="cta-primary-label">…</span></a>` and nothing else.
- **The nav is now 7 items and overflows into two-line labels** without help. Fixed with `white-space: nowrap` on `.nav-primary a` + `.brand-wordmark`, plus a `@media (max-width:1320px){ gap: 34px }` step. Verified 1200/1280/1440 — 32px clearance at the tightest point, no wrap, no horizontal overflow.
- Preview pane can't navigate to subdirectory paths (`/hotels/x.html`) or to files it hasn't seen; only root-level known files load. Verify property-page CSS by injecting the markup into a page that does load, or check markup with `curl`.

**TODO for Wilson (not a website change):** her TravelWits gate screen is still on stock defaults — it reads only "PASSWORD PROTECTED" with an empty field, no explanation of what's behind it. That's customisable in TravelWits settings (Go With Gray has custom heading/body/background there). Worth filling in so the handoff isn't a dead end. Do NOT copy Go With Gray's "TRAVEL ADVISOR LOGIN" caption — it reads as trade-only and will bounce travelers.

**Copy status:** all copy on `/book` and in both bands is **placeholder pending Wilson's wordsmithing**, per §10.

### §13 addendum (2026-08-19) — imagery on /book

Wilson's note: *"NEED AMAZING HOTEL IMAGERY HERE — PHOTOS OF INCREDIBLE HOTELS / HOTEL ROOMS (PRIVATE POOLS - EXPANSIVE VIEWS ETC) FOR THE WANDERLUST."* The page shipped text-only on cream, which was wrong for a wanderlust pitch. Two additions, both sourced **entirely from the existing `property-images/` library** — nothing new downloaded, nothing scraped.

- **Hero is now full-bleed photography** — `passalacqua/00-hero-pool.jpg` (Lake Como, 2000×1334). Reuses the `.property-hero` bg/grain/gradient stack under `.book-hero-*` names, so type legibility is the already-proven treatment. Type is bottom-anchored and left-aligned to match the hotel pages this page feeds. Carries a "Pictured: …" credit linking to the property.
- **New `.book-gallery` band** between the perks list and the how-it-works steps: 4 tall tiles (3:4, `object-fit: cover`), full-bleed past the container, captions on a bottom scrim, each tile linking to its hotel page — so it feeds internal traffic instead of being decoration. Wymara (private pool) · Caruso (Amalfi view) · Borgo Santandrea (the room shot) · Villa San Michele (infinity pool + Florence). Deliberate mix: 2 pools, 1 view, 1 interior. Collapses 4→2 columns at 860px.

**Hero filter was tuned twice.** First pass copied the property-hero values (`saturate .82 / brightness .76`) and read too muted — the lake went grey. Now `saturate .94 / contrast 1.04 / brightness .86` with a softer gradient (top stop .52→.42, mid .12→.06). **If you reuse the property-hero stack on a marketing page, expect to lift brightness — those values are tuned for text over a busy hotel hero, not for wanderlust.**

**Verification gotcha:** the documented blank-screenshot glitch (§4) hits the gallery band hard — it sits on `#FCFCFB` and captured pure white at every scroll position, through repaint forcing and `zoom`. Verified by DOM instead (all 4 images `naturalWidth > 0`, tiles 293×391 = exact 3:4, captions pinned, no overflow at 375/860/1280), plus a Pillow composite of the real crops to eye the imagery. Photo-backed sections (the hero) screenshot fine; light sections do not.

All four photos were **viewed before use** per §8 — no people, no red/orange clashes, all inside the coastal palette.

### §13 addendum 2 (2026-08-19) — width bug + gallery reshuffle

**🔴 The `/book` sections were locked to a fixed width and never scaled.** Wilson flagged the margins on a 1920px screen. Two separate causes:

1. **`max-width` was set on divs that also carry `.container`.** `.container` adds `--container-pad` (72px) *each side*, so a `max-width: 780px` section rendered only **636px of actual content** — and being a fixed px value, it was 636px at 1280px and at 2560px alike. **Rule: when you put a max-width on a `.container` element, the content width is `max-width − 2×--container-pad`. Budget for the 144px.** All four now use `clamp()`: perks/gallery `clamp(720px, 70vw, 1050px)`, steps `clamp(880px, 82vw, 1300px)`, access card `clamp(560px, 46vw, 840px)`. Perks list measured 636→906px at 1920, and now moves with the window (658 @1100 · 864 @1440 · 906 @1920).
2. **`.book-hero-inner` was shrink-wrapping to 764px** despite `max-width: 1480px`. Same flex bug already recorded for the blog hero in §3 v125: `.container` brings `margin: 0 auto`, and an `auto`-margined item in a **column** flex container shrink-wraps instead of filling. Fix is `width: 100%`. **This bit us twice now — check it on any `.container` placed inside a flex-column section.**

**Gallery reshuffled** (Wilson: too Italian, feature Kokomo + Cali Mykonos). Now Wymara (Turks & Caicos) · Kokomo (Fiji) · Cali Mykonos (Greece) · Borgo Santandrea (Italy) — Caruso and Villa San Michele dropped. Wymara now uses its own page hero (`01-villa-slide-into-sea.jpg`, matching `heroImage` in data.js) per Wilson's request.

**New `data-focal` hook:** `.book-gallery-tile[data-focal="left"|"right"] img` shifts `object-position` to 30%/70%. Added because Cali Mykonos' pool suite puts its subject off-centre and the default centred 3:4 cover-crop cut the plunge pool out. Compare crops with a Pillow contact sheet before choosing a photo — quicker than reloading.

**The `/hotels/<slug>` 404 Wilson hit is localhost-only, not a bug.** `python3 -m http.server` doesn't serve extensionless URLs; Vercel's `"/hotels/:slug([a-z0-9-]+)" -> "/hotels/:slug.html"` rewrite does. The whole site already uses this pattern (hotels.html builds `a.href = '/hotels/' + slug`), so if it were broken every hotel link everywhere would be. Audited all 24 hrefs on /book against real files: **0 broken.** To test clean URLs locally you need a server that falls back to `.html`.

### §13 addendum 3 (2026-08-19) — steps moved up, access band goes navy

Wilson: *"WE SHOULD MOVE THE STEPS TO BOOK UP TO THE TOP WHERE THE PASSWORD IS - MAKE THE PASSWORD SECTION BLUE OR DIFFERENT COLOR TO STAND OUT."*

**New page order:** hero → **access band (navy)** → perks → gallery → close. The standalone "How it works" section is gone; its three steps now live inside the access band, below the card. One block answers "how does this work / where's the code / go".

**The access band is now the only saturated block on the page** — `background: var(--ink)` (Deep Yacht Blue `#1E3552`) with a 3px `--gold` top border. The code card stays `--ivory` and gained `box-shadow: 0 24px 60px rgba(6,14,26,0.34)` so it reads as a ticket floating on the navy. Steps below it: gold `--gold-soft` numerals, ivory titles, `rgba(255,251,240,0.8)` body. Kicker inverted to ivory (the default kicker is ink and vanishes on navy — invert `.kicker` AND `.kicker-line` on any dark band).

**Gotcha — orphaned section padding.** `.book-steps` was a top-level section with `padding: clamp(56px,6vw,88px) 0`. After it moved inside the band, that bottom padding was still firing and left **87px of dead navy** under the last step (band was 1252px tall instead of 1165px). Now `.book-steps { padding: 0 }` — the band owns the vertical rhythm. **When you relocate a section into another section, hunt its old `padding`/`margin` rule; it does not stop applying just because the element moved.** Also removed `.book-steps-inner`, which no longer exists in the markup.

Verified after restructure: gap card→steps 65px, gap last-step→band-end 87px (= the band's own 86.4px padding, nothing extra), 3-col grid at desktop / 1-col under 900px, copy button still binds and flips to "Copied", CTA target/rel intact, exactly one `<h1>`, no overflow at 375/1100/1440.

**Screenshot glitch note:** desktop captures on this page are now failing *entirely* (full-white frames at every scroll position, including over the navy band) while **375px mobile captures work fine every time**. When verifying this page, resize to mobile for visual proof and use DOM reads for desktop geometry.

### §13 addendum 4 (2026-08-19) — champagne band, quick-hit steps, Amangiri

Wilson rejected the navy access band ("more aesthetic to match the rest of the site"), asked for JetsetChristina-style **quick-hit steps**, replaced the Borgo room photo, and added an after-you-book note.

**Navy → champagne.** The band now uses the site's OWN "this one matters" vocabulary — the `.package--signature` treatment from /services: `linear-gradient(180deg, rgba(195,162,106,0.14), rgba(195,162,106,0.04))` + 3px `--gold` top border + a `::before` hairline inset. The card inside went `--ivory` → **`#FFFFFF`** with a soft navy-tinted shadow. **Lesson: the site has an established way to make one block stand out; reach for that before inventing a saturated colour block.** (Same instinct as §3 v127 — Wilson chose white cards over cream on the homepage testimonials.) Steps reverted to `--ink` text; the ivory kicker/`--gold-soft` overrides for dark backgrounds were removed.

**Steps → quick hits, 3 → 4.** Reference: `jetsetchristina.com/hotels` — numbered steps, a 2–4 word bold title, then ONE short line. Ours were 30–40 word paragraphs; now 8–10 words each: Open the portal · Search your stay · Book it · We take it from there. Grid went `repeat(3,1fr)` → `repeat(4,1fr)` (2-col ≤900px, 1-col ≤560px), type tightened to 19–23px titles / 15–16px bodies. **Tune copy so every cell wraps to the same line count** — step 3 was 3 lines against the others' 2 until shortened; check `height / lineHeight` per body, don't eyeball it.

**New `.book-steps-note`** under the steps: confirmation arrives instantly, we follow up within 24 hours with the official hotel confirmation and to confirm perks/VIP status. Written fresh in WbW voice, NOT copied from JetsetChristina's wording, and it says "by email" rather than naming Virtuoso (our portal is TravelWits). The card note was trimmed so the two don't repeat each other. **⚠️ The "within 24 hours" line is a public service commitment — Wilson should confirm she wants to be held to it.**

**Gallery tile 4: Borgo Santandrea room → Amangiri** (`00-hero.jpg`, Canyon Point Utah, `data-focal="mid-left"` = `object-position: 42%`). Wilson: the Borgo room "isn't aspirational enough". Amangiri also breaks a run of three turquoise tiles — set is now Turks & Caicos · Fiji · Greece · Utah, with sand/ochre against the blues. New `mid-left` focal preset added alongside `left`/`right`.

**Screenshot glitch is now width-gated:** blank at 1000px AND 1440px, reliable at 375px mobile. Verify this page's desktop geometry by DOM and its look at mobile.

### §13 addendum 5 (2026-08-19) — conversion pass on /book + entry points

Reference Wilson gave: `jetsetchristina.com/hotels`. Her page carries **four** portal CTAs (hero, after the intro, after the steps, in the perks list) and holds every outbound link back until a "Not Sure Where to Go?" block at the very bottom. We now mirror that.

**Page order:** hero → access (champagne: card + 4 quick-hit steps + follow-up note) → perks → **partner marquee** → gallery → "Still deciding?" paths.

**4 portal CTAs**, all `target="_blank" rel="noopener noreferrer"`: hero · access card · under the perks list · under the gallery. **Every one carries an "Access code WANDER" callout** via the shared `.portal-code-note` (+ `--onphoto` modifier for light-on-photo). Wilson's rule: never show a portal button without the code beside it.

**Removed the mid-page leak.** The gallery foot used to link to `/hotels` ("See the whole collection") — that sent the highest-intent reader away mid-conversion. It's now a portal CTA. The collection link survives in the bottom paths block, which is the right place for it.

**New `.book-paths`** ("Still deciding where to go?") — 3 white cards on ivory: See the collection → `/hotels` · Read the journal → `/inspiration` · Let us handle it → `/inquire-hotel`. Replaces the old single-CTA `journey-close`. **This is deliberately the only place on the page that sends people anywhere but the portal** (aside from the gallery tiles and the hero photo credit).

**Partner marquee added** (`.book-partners`), lifted verbatim from index.html so the two never drift — same 19 logos, same `.marquee`/`.marquee-track` CSS, same clone-children JS (the loop needs the duplicate or the 0→-50% translate jumps). Sits after the perks list so it reads as proof of the perks just claimed, matching the homepage's placement after its "why book with us" pitch.

**Entry points repointed:**
- Homepage "Book a Hotel With Perks" → was `/services#package-01`, now **`/book`**.
- `/hotels` hero is now a decision: **"Book with perks, instantly" → `/book`** (filled ivory) + "Have us book it" → `/inquire-hotel` (ivory outline), with the code callout under.
- **Gotcha:** the `/hotels` hero sits on a photo (`.is-hotels-index-page .journeys-index-hero::before` = borgo aerial). The default `.cta-primary`/`.cta-secondary` are ink-on-light and were *invisible* there. Any CTA added to that hero needs light overrides — check against the photo, not the DOM.

Audited after: 0 broken links on book/hotels/index, 4 portal CTAs each with a code callout, marquee 19→38 items with all 34 logos loading, no horizontal overflow at 375/1000/1440.

### §13 addendum 6 (2026-08-19) — SEO audit + filled portal buttons

Audited /book properly rather than assuming. **Six real defects found and fixed:**

1. **`og:image` was still `borgo-santandrea/02-aerial-coastal.jpg`** — a leftover from copying hotels.html's `<head>`. Every share of /book showed the wrong hotel. Now the Passalacqua hero + `og:image:alt`. **⚠️ When you build a page by copying another page's head, re-check EVERY og/twitter value, not just title and description.**
2. **Meta description was 228 chars** (Google truncates ~160) → 145.
3. **Title was 72 chars** (truncates ~60) → 58: "Book Luxury Hotels Yourself, With Perks | Wander by Wilson".
4. **Flat heading hierarchy** — the four step titles were `<h2>`, level-equal with the section headings. The card label `<p class="book-access-label">` became the section's `<h2>` and the steps dropped to `<h3>`. Outline is now H1 → H2 → H3×4 → H2 → H2 → H2. No visual change.
5. **No width/height on any of 22 images** → layout shift (CLS). All 39 rendered imgs now carry intrinsic dimensions (pulled from the files with Pillow).
6. **Marquee logos were eager-loaded** below the fold — now `loading="lazy"` (38 of 39 imgs lazy; the hero keeps `fetchpriority="high"`).

**Added JSON-LD** (`@graph`: WebPage + **HowTo** + Service). The 4 steps map cleanly to HowTo, which is a real rich-result opportunity for "how to book hotels with perks" queries; step anchors `#step-1..4` were added to the `<li>`s so the schema URLs resolve. Service carries `price: 0` to reinforce "no planning fee".

**`.cta-portal`** — new filled treatment for every button leading to the portal (gold fill, ink italic label, gold shadow; hover flips to ink/ivory). The outlined `.cta-primary` was too quiet for the conversion action. Applied to 4 CTAs on /book, 1 on /hotels, 2 on the homepage. **Gotcha:** the page-scoped `.book-hero .cta-primary` and `.is-hotels-index-page … .cta-primary` overrides sit later in the file and were un-filling it — needed explicit `.cta-primary.cta-portal` rules to win on specificity.

**Copy (Wilson):** H1 "Better arrival." → **"Better outcome."** to match the homepage script tagline. Hero lede "Complimentary, always." → **"You pay nothing extra."**, reusing the phrasing already on /services so the two pages agree.

**Still open / judgement calls:** ~535 visible words is thin for competitive SEO — the page is built to convert, not to rank for broad terms; if ranking matters, the honest lever is an FAQ block (which would also earn FAQPage schema). The published WANDER code will be indexed — inherent to the open-password decision.

### §13 addendum 7 (2026-08-19) — 🔴 REGRESSION from the SEO pass: width/height broke the gallery

Adding `width`/`height` attributes to every `<img>` for CLS (addendum 6) **silently broke the /book gallery**. The four tiles rendered at their raw pixel heights — 788 / 1066 / 1000 / 1200px — instead of a uniform 3:4 row. Wilson caught it visually; my DOM checks had only verified the grid columns and image loading, not the rendered tile heights, so it passed my own audit.

**Cause:** the HTML `height` attribute is a *presentational hint* that sets the used height. `.book-gallery-figure img` had `width: 100%` + `aspect-ratio: 3 / 4` but **no explicit height**, so the attribute won and `aspect-ratio` was ignored. Computed height came back as literally `788px`, `1066px`, etc.

**Fix:** `height: auto` on `.book-gallery-figure img`. That's the standard companion to adding width/height attributes to responsive images.

**RULE — whenever you add `width`/`height` attributes to an `<img>`, the CSS must set an explicit height (`auto`, `100%`, or a value).** Any rule relying on `aspect-ratio` alone, or on the intrinsic ratio, will break. Audit every image rule on the page, not just the one you were thinking about. Here `.book-hero-bg img` (`height: 100%`) and `.marquee-item img` (`height: auto`) were already safe — the gallery was the only casualty, but that was luck, not design.

**Verification lesson:** "all 4 images loaded, grid has 4 equal columns, no overflow" was true AND the layout was still visibly broken. When a change touches image sizing, assert on **rendered width×height and the resulting ratio per element**, not just presence and column count. Confirmed after fix: 4 × 367×490 at 1600px, 4 × 168×223 at 375px, ratio 0.750 on every tile.

### §13 addendum 8 (2026-08-19) — FAQ, steps-first reorder, large-screen type

**🔴 FAQ RICH RESULTS NO LONGER EXIST.** Not the Aug-2023 restriction — **fully removed**. FAQ rich results stopped appearing 2026-05-07; the search appearance, Rich Results Test support and Search Console report were dropped in June 2026; Google deleted the FAQPage documentation page on 2026-06-15. **Nobody can earn them.** Same story for the `HowTo` schema already on /book (deprecated 2023, renders nothing). Both are inert but harmless — Google says unused structured data causes no problems. **Never report FAQ/HowTo schema as an SEO win again.** We keep `FAQPage` only because Bingbot, PerplexityBot and RAG crawlers still parse Q&A, and the value is entirely in the *visible* copy — never schema-only.

**FAQ block added** (`.book-faq`, 8 questions) between `.book-gallery` and `.book-paths`, using the site's existing `<details class="faq-item">` component from services/cruises. Order is objection-strength, not topic: free? → rate parity → who are you → who charges/can I cancel → points & elite → perks guaranteed → after you book → why a code. **Includes a 5th portal CTA at its foot** — without it the FAQ resolves every doubt and then hands the reader straight to the exit block below.

Questions chosen from real evidence, not invention: La Jolla Mom's live advisor FAQ (lajollamom.com/help) and the H2s of the OMAAT Virtuoso guide that ranks #1 for the cluster. **JetsetChristina, Go With Gray and La Jolla Mom's portal pages answer no objections at all** — "who bills me", "can I cancel myself", "are perks guaranteed", "is this a real consortium booking" are unclaimed. The 24-hour human follow-up is a genuine differentiator none of them state.

**Vocabulary gap the FAQ fixes:** the page previously never said *travel advisor*, *travel agent*, *commission*, *points*, *loyalty*, *elite* or *complimentary*, and said *Virtuoso* exactly once — it was written entirely in brand vocabulary and none of the searcher's. Realistic keyword targets are the thin-SERP cluster (self-book with advisor perks · travelwits access code · luxury hotel booking portal access code · cancelling an advisor booking), **not** "virtuoso hotel benefits" — OMAAT/UpgradedPoints own that and a small domain won't take it.

**Steps now lead the access band** (Wilson's call, asked twice — I'd recommended card-first). The "How it works" kicker became an `<h2>` so the four `<h3>` steps sit under a heading instead of preceding one; the top rule moved from the steps onto the card, which is now the divider between "how" and "here's the code".

**Large-screen type scale-up.** Every clamp on the page hit its ceiling around 1400px and then froze — at 2400px the hero title was stuck at 88px and body copy at 16–18px in columns capped at 1050px while the site's container is 1480px. Raised ~20 ceilings (hero title 88→104, section titles 46→56, ledes 19→22, body 16→18/21) and widened the column caps to 1240/1480.

**🔴 GOTCHA I WALKED STRAIGHT INTO — the one §8 already warns about.** I did bare `s.replace('font-size: clamp(...)', ...)` on shared clamp values. Three landed on the wrong rules and silently restyled other pages: `.article-body h3` (undoing the v137 blog heading harmonisation), `.journey-tailor-body`, `.cruise-style-want`. Caught only because a DOM check showed `.book-perks-list li` had not changed. All three reverted and reapplied class-anchored. **ALWAYS anchor to the selector — `re.compile(re.escape(sel) + r'\s*\{[^}]*?font-size:\s*' + re.escape(old))` — and afterwards verify which rule each value actually landed in, don't assume the edit hit the intended one.**

### §13 addendum 9 (2026-08-19) — Wilson's corrections

- **CTA locked below the code box.** `.book-access-code` was `display: inline-flex`, so on wide cards the gold CTA rode up beside it instead of sitting under it. Now `display: flex; width: max-content; margin: 0 auto` — block-level, so nothing can share its line. Verified stacked at 1680 and 2400px.
- **Type raised again.** /book's ledes already matched the homepage's *section* ledes (22px), but the homepage's own smaller text (services lede 18, founder 17, testimonial 15) is not the bar to hit. Everything went up another step: hero lede →27, access lede →26, section ledes →25, perks →23, FAQ Q →23 / A →20, step body →20, notes →19. Mins raised too so mid-size screens benefit, not just 2400px.
- **FAQ corrected on Wilson's instruction:** *booking through the portal is a reservation made directly with the hotel, with the client as our client — that is what lets us pass the preferred-partner perks through.* The "Who am I actually booking with?" answer now says exactly that. **This is the accurate description of the model — don't describe the portal as an intermediary or reseller.**
- **Removed** "Are the perks guaranteed?" and "Why is there an access code?". Down to 7 questions.
- **"Who charges my card, and can I cancel?" → "Who charges my card?"** — cancellation stays in the answer as reassurance but is no longer a headline. Wilson explicitly does NOT want the page optimised for "how to cancel an advisor booking"; that was my SEO agent's suggestion and it's the wrong intent for this business.

**🔴 SEO POSITIONING — Wilson's direction, overrides the agent's keyword list.** The target is not people researching travel advisors. It is **people who would otherwise use a credit-card hotel program** — searching *best credit cards for travel perks*, *best credit cards with hotel perks*. **The competitor is Amex Fine Hotels + Resorts.** Acted on so far: a new FAQ "How is this different from Amex Fine Hotels + Resorts?" (honest — similar perks; FHR needs an eligible card and covers only its own list; ours needs no card and reaches more; they don't stack), and the meta description now leads with the comparison.

**Reality check to give Wilson before she expects rankings:** head terms like "best credit cards for hotel perks" are owned by points/card affiliate sites (The Points Guy, NerdWallet, Upgraded Points, OMAAT) with enormous authority and affiliate revenue behind them — a 1,000-word conversion page on this domain will not rank there. What IS winnable is the comparison long tail — *amex fhr vs virtuoso*, *hotel perks without amex platinum*, *virtuoso vs fine hotels and resorts* — where advisor sites already rank today. That deserves a dedicated blog post on /inspiration targeting the comparison, internally linked to /book. **Recommend this rather than trying to make /book rank for card queries it structurally can't win.**

### §13 addendum 10 (2026-08-19) — pre-publish QA: NOT ready, then fixed

Two review agents (technical QA + fact-check/compliance). Verdict was **SHIP WITH FIXES**, not ship. Everything below is now applied unless marked ESCALATED.

**Content accuracy — these were liability issues under Wilson's own no-embellishment rule:**
- **"The perks travel with every booking"** was the single biggest overclaim. TravelWits portals return **standard public rates alongside preferred-partner rates**, so some portal bookings carry no perks at all. Heading → "The perks travel with you", and the fineprint now says outright that a handful of properties book at the standard public rate. **Never state or imply that every portal booking earns perks.**
- **"comes out of the hotel's budget, not the rate you pay"** — mechanism was wrong. Commission is a percentage of room revenue the hotel nets out, not a separate marketing budget. Reworded to "the hotel pays us a commission on the booking… and your rate is the same either way" — same payoff, defensible mechanism.
- **Amex FHR comparison** — "the perks are similar" understated FHR (its credit and 4pm checkout are *guaranteed and uniform*; ours are property-specific and our own copy hedges them). "Reaches hotels FHR doesn't" was one-directional and unprovable — Amex publishes only a combined FHR + Hotel Collection figure (3,400+/116 countries), never FHR alone, and Virtuoso's count is login-gated. Now symmetric: "Each list has hotels the other doesn't." **Do NOT add the widely-repeated "FHR breakfast is only continental" claim — it is absent from Amex's own language and is easy to knock down.**
- **Rate parity** — caveat list was incomplete. Loyalty-member and AAA rates are *flexible* rates that can undercut BAR; that's the complaint clients actually hit. Both caveats now stated, plus the honest upside that ours is sometimes lower.
- **Points** — "apply as normal" is true at the chains but meaningless at Four Seasons, Aman, Belmond, Oetker and Dorchester, which run **no loyalty program at all**. Now hedged and named.
- **Third-party outcomes we can't control:** "the front desk knows who you are" → "we make sure the hotel knows who you are"; "make sure your amenities… are in place" → "confirm… on the reservation"; "We VIP you" → "We look after you". **Promise our own action, never the hotel's behavior.**
- **Unqualified absolutes removed:** "cancel at any time" / "whenever you like" → "under the hotel's own policy". Every flexible rate has a deadline.
- **"within 24 hours" → "within one business day"** everywhere. The old wording was an unconditional SLA covering weekends and holidays, and it also conflicted with the 48-hour promise on inquire-hotel.html and services.html.

**Technical fixes:** marquee kicker was rendering hard-left (`margin: 0 auto` does nothing on an `inline-flex` box — needed `text-align: center` on the parent); copy button's "Copied" state was white-on-gold at **2.41:1** → ink-on-gold **5.16:1**; five muted greys were below AA (3.69–4.40:1) → raised to 0.78 alpha; the copy button's static `aria-label` was suppressing its own state change → removed, with `aria-live="polite"` on the label; the clipboard fallback claimed "Copied" when it had only selected the text → now says "Press ⌘C"; `aria-controls="primaryNav"` pointed at a non-existent id **on all 119 pages** → `id` added; `hotels.html`'s portal-band CTA was missing `cta-portal` so the highest-intent button on the site was the quiet outline one.

**🔴 GOTCHA — the JSON-LD block sits ABOVE the visible FAQ in the file.** A bare `s.replace(old, new, 1)` on an FAQ answer hits the **schema copy**, not the DOM. Five of six FAQ edits landed correctly; one silently patched only the schema, and rebuilding the schema from the DOM then *reverted* it. **Always anchor FAQ answer edits to their markup (`<p class="faq-a">…</p>`), and always re-verify the visible body separately from the schema.**

**ESCALATED — Wilson must decide, cannot be resolved from code:**
1. **Publishing the access code.** Removed from the JSON-LD (it was being fed to crawlers) and the "share it with the people you travel with" line is gone. But whether the code may be public at all is a **SmartFlyer / TravelWits contract question** — preferred-partner rates are contractually not publicly bookable. Ask before launch.
2. **The partner marquee.** ~15 programs named by trademark (Four Seasons Preferred Partner, Marriott STARS | Luminous, Hyatt Privé, Bellini Club…) under "Our partner programs" — those agreements are held by **SmartFlyer, not Wander by Wilson**, and several restrict consumer-facing use of the marks. Confirm before launch.
3. **Seller-of-travel disclosure.** The page takes bookings but never names SmartFlyer as agency of record. CA/FL/WA/HI/IA have registration and disclosure rules. Confirm /terms covers it and is reachable.
4. **Amex marks** — "American Express" and "Fine Hotels + Resorts" now appear in the copy, meta description and social previews. A one-line non-affiliation note in the footer is cheap insurance.

**Verification note:** the in-app preview browser gave a false reading on `.book-access-copy.is-copied` (reported the rule as not applying when the served CSS is correct and balanced). Contrast was confirmed by computing from the hex values instead. This browser has been unreliable all session — blank screenshots above 375px, timeouts, failed navigations. **Verify colour and layout arithmetically or against the served file, not only through the pane.**
