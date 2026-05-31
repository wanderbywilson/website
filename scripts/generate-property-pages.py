#!/usr/bin/env python3
"""
generate-property-pages.py
────────────────────────────────────────────────────────────────────
For each property in PROPERTIES (data.js), generate a static HTML
file at /hotels/[slug].html with title + OG/Twitter meta tags baked
into the head.

Same problem as the blog post generator: property.html sets meta tags
via JS at runtime, so non-Apple social platforms (Twitter, FB, LinkedIn,
WhatsApp on Android) see a generic "Property — Wander by Wilson" preview.

The generated files still load data.js and let the inline JS render
the page body — only the head metadata is hardcoded.

Run:  python3 scripts/generate-property-pages.py
────────────────────────────────────────────────────────────────────
"""
import re
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data.js'
TEMPLATE = ROOT / 'property.html'
OUT_DIR = ROOT / 'hotels'
BASE_URL = 'https://www.wanderbywilson.com'

src = DATA.read_text()
tpl = TEMPLATE.read_text()

# ─── Parse PROPERTIES from data.js ────
# Find the start of `const PROPERTIES = {`  AND bound to its closing `};`
# so we don't accidentally iterate into ITINERARIES below.
start = src.find('const PROPERTIES')
if start == -1:
    raise SystemExit('PROPERTIES not found in data.js')
end_block = src.find('\n};', start)
if end_block == -1:
    raise SystemExit("Could not find PROPERTIES closing '};'")
scope = src[start:end_block]

properties = {}
for m in re.finditer(r"\n    '([a-z0-9-]+)':\s*\{", scope):
    slug = m.group(1)
    body_start = m.end()
    nxt = re.search(r"\n    '[a-z0-9-]+':\s*\{", scope[body_start:])
    body_end = body_start + (nxt.start() if nxt else len(scope) - body_start)
    body = scope[body_start:body_end]

    def grab(field):
        # Try double-quoted, then single-quoted strings
        for q in ['"', "'"]:
            esc_q = re.escape(q)
            mm = re.search(rf"{field}:\s*{esc_q}((?:[^{esc_q}\\]|\\.)*){esc_q}\s*,", body)
            if mm:
                return mm.group(1)
        return ''

    properties[slug] = {
        'name':        grab('name'),
        'location':    grab('location'),
        'heroImage':   grab('heroImage'),
        'description': grab('description'),
        'rateFrom':    grab('rateFrom'),
    }

print(f'Parsed {len(properties)} properties from data.js')

OUT_DIR.mkdir(exist_ok=True)

def html_esc(s):
    return escape(s, quote=True).replace('&amp;rsquo;', '&rsquo;').replace('&amp;mdash;', '&mdash;').replace('&amp;amp;', '&amp;')

def short_desc(s, max_chars=160):
    """Trim long description to first sentence or ~155 chars for og:description."""
    if not s: return ''
    # Strip basic HTML entities/tags for cleaner preview
    clean = re.sub(r'<[^>]+>', '', s)
    if len(clean) <= max_chars:
        return clean
    # Try to break at sentence boundary
    sent = re.match(r'^[^.!?]*[.!?]', clean)
    if sent and len(sent.group(0)) <= max_chars + 20:
        return sent.group(0)
    # Fall back to char truncation at last space
    truncated = clean[:max_chars].rsplit(' ', 1)[0]
    return truncated + '…'

def replace_head(tpl, prop, slug):
    name = prop['name'] or 'Property'
    location = prop['location'] or ''
    desc_raw = prop['description'] or ''
    desc = short_desc(desc_raw)
    hero = prop['heroImage'] or ''
    url = f"{BASE_URL}/hotels/{slug}"
    img = f"{BASE_URL}/{hero.lstrip('/')}" if hero and not hero.startswith('http') else hero
    title_with_loc = f"{name} — {location}" if location else name
    full_title = f"{title_with_loc} | Wander by Wilson"

    out = tpl
    # <title id="propertyTitle">
    out = re.sub(r'<title[^>]*>[^<]*</title>',
                 f'<title id="propertyTitle">{html_esc(full_title)}</title>', out)
    # <meta name="description">
    out = re.sub(r'<meta name="description" content="[^"]*">',
                 f'<meta name="description" content="{html_esc(desc)}">', out)
    # Inject the OG/Twitter block right after meta description
    og_block = (
        f'<link rel="canonical" href="{url}">\n'
        f'    <meta property="og:type" content="website">\n'
        f'    <meta property="og:title" content="{html_esc(full_title)}">\n'
        f'    <meta property="og:description" content="{html_esc(desc)}">\n'
        f'    <meta property="og:image" content="{img}">\n'
        f'    <meta property="og:url" content="{url}">\n'
        f'    <meta property="og:site_name" content="Wander by Wilson">\n'
        f'    <meta name="twitter:card" content="summary_large_image">\n'
        f'    <meta name="twitter:title" content="{html_esc(full_title)}">\n'
        f'    <meta name="twitter:description" content="{html_esc(desc)}">\n'
        f'    <meta name="twitter:image" content="{img}">'
    )
    out = re.sub(
        r'(<meta name="description" content="[^"]*">)',
        r'\1\n    ' + og_block,
        out, count=1
    )
    return out

written = 0
for slug, prop in properties.items():
    if not prop['name']:
        print(f'  ⚠ skipped {slug}: no name')
        continue
    html = replace_head(tpl, prop, slug)
    (OUT_DIR / f'{slug}.html').write_text(html)
    written += 1

print(f'Wrote {written} property pages to /hotels/')
