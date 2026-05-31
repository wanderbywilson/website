#!/usr/bin/env python3
"""
generate-post-pages.py
────────────────────────────────────────────────────────────────────
For each post in blog-data-v15.js, generate a static HTML file at
/post/[slug].html that has the post's title + OG/Twitter meta tags
baked in.

Why: social-media crawlers (iMessage, Twitter, Facebook, LinkedIn)
do not execute JavaScript. The original post.html template renders
its <title> and OG meta tags via JS at runtime, so every shared
blog link previewed as "Inspiration" with no description or image.

The generated files still load blog-data-v15.js and let the inline
JS render the article body — only the head metadata is hardcoded.
That gives us correct preview cards everywhere without duplicating
hundreds of KB of article HTML per file.

Run:  python3 scripts/generate-post-pages.py
────────────────────────────────────────────────────────────────────
"""
import re
import json
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'blog-data-v15.js'
TEMPLATE = ROOT / 'post.html'
OUT_DIR = ROOT / 'post'
BASE_URL = 'https://www.wanderbywilson.com'

# ─── Parse blog-data-v15.js (manual regex extraction; not a JS engine) ────
src = DATA.read_text()

# Each post is `'slug': { title: "...", dek: "...", heroImage: "...", ... }` (4-space indent)
posts = {}
for m in re.finditer(r"\n    '([a-z0-9-]+)':\s*\{", src):
    slug = m.group(1)
    body_start = m.end()
    nxt = re.search(r"\n    '[a-z0-9-]+':\s*\{|\n\};\s*$", src[body_start:])
    body_end = body_start + (nxt.start() if nxt else len(src) - body_start)
    body = src[body_start:body_end]

    def grab(field):
        # Handle double-quoted OR single-quoted strings separately so that
        # apostrophes inside double-quoted strings (e.g. "Mexico's Finest")
        # don't get mistaken for closing delimiters.
        for q in ['"', "'"]:
            esc_q = re.escape(q)
            m = re.search(rf"{field}:\s*{esc_q}((?:[^{esc_q}\\]|\\.)*){esc_q}\s*,", body)
            if m:
                return m.group(1)
        return ''

    posts[slug] = {
        'title':     grab('title'),
        'dek':       grab('dek'),
        'heroImage': grab('heroImage'),
        'category':  grab('category'),
        'readMin':   grab('readMin'),
        'date':      grab('date'),
    }

print(f'Parsed {len(posts)} posts from blog-data-v15.js')

# ─── Load template ────
tpl = TEMPLATE.read_text()

OUT_DIR.mkdir(exist_ok=True)

def html_esc(s):
    """Light HTML escape for inside attributes (preserves &amp; etc.)"""
    return escape(s, quote=True).replace('&amp;rsquo;', '&rsquo;').replace('&amp;mdash;', '&mdash;').replace('&amp;amp;', '&amp;')

def replace_head(tpl, post, slug):
    """Replace the relevant <head> meta tags with post-specific values."""
    title = post['title'] or 'Inspiration'
    dek   = post['dek'] or ''
    hero  = post['heroImage'] or ''
    url   = f"{BASE_URL}/post/{slug}"
    # heroImage in data starts with `/blog-images/...` — strip leading slash
    # before joining to avoid double `//` in the URL.
    img   = f"{BASE_URL}/{hero.lstrip('/')}" if hero and not hero.startswith('http') else hero

    full_title = f"{title} | Wander by Wilson"

    out = tpl
    # <title>
    out = re.sub(r'<title>[^<]*</title>',
                 f'<title>{html_esc(full_title)}</title>', out)
    # <meta name="description">
    out = re.sub(r'<meta name="description" content="[^"]*">',
                 f'<meta name="description" content="{html_esc(dek)}">', out)
    # post.html has NO OG/Twitter/canonical tags in the static template
    # (it sets them via JS at runtime, which crawlers can't see). Inject
    # them right after the meta description so social previews work.
    og_block = (
        f'<link rel="canonical" href="{url}">\n'
        f'    <meta property="og:type" content="article">\n'
        f'    <meta property="og:title" content="{html_esc(full_title)}">\n'
        f'    <meta property="og:description" content="{html_esc(dek)}">\n'
        f'    <meta property="og:image" content="{img}">\n'
        f'    <meta property="og:url" content="{url}">\n'
        f'    <meta property="og:site_name" content="Wander by Wilson">\n'
        f'    <meta name="twitter:card" content="summary_large_image">\n'
        f'    <meta name="twitter:title" content="{html_esc(full_title)}">\n'
        f'    <meta name="twitter:description" content="{html_esc(dek)}">\n'
        f'    <meta name="twitter:image" content="{img}">'
    )
    # Inject right after the description meta tag (sits in <head>)
    out = re.sub(
        r'(<meta name="description" content="[^"]*">)',
        r'\1\n    ' + og_block,
        out, count=1
    )
    return out

# ─── Generate one HTML file per post ────
written = 0
for slug, post in posts.items():
    if not post['title']:
        print(f'  ⚠ skipped {slug}: no title')
        continue
    html = replace_head(tpl, post, slug)
    out_path = OUT_DIR / f'{slug}.html'
    out_path.write_text(html)
    written += 1

print(f'Wrote {written} post pages to /post/')
