#!/usr/bin/env python3
"""
generate-journey-pages.py
────────────────────────────────────────────────────────────────────
For each itinerary in ITINERARIES (data.js), generate a static HTML
file at /journeys/[slug].html with title + OG/Twitter meta tags baked
into the head.

Same pattern as the post + property generators. journey.html sets meta
tags via JS at runtime — non-Apple social platforms see "A Journey"
generic preview otherwise.

Run:  python3 scripts/generate-journey-pages.py
────────────────────────────────────────────────────────────────────
"""
import re
from pathlib import Path
from html import escape

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / 'data.js'
TEMPLATE = ROOT / 'journey.html'
OUT_DIR = ROOT / 'journeys'
BASE_URL = 'https://www.wanderbywilson.com'

src = DATA.read_text()
tpl = TEMPLATE.read_text()

start = src.find('const ITINERARIES')
if start == -1:
    raise SystemExit('ITINERARIES not found in data.js')

itineraries = {}
for m in re.finditer(r"\n    '([a-z0-9-]+)':\s*\{", src[start:]):
    slug = m.group(1)
    body_start = start + m.end()
    nxt = re.search(r"\n    '[a-z0-9-]+':\s*\{|\n\};\s*\n", src[body_start:])
    body_end = body_start + (nxt.start() if nxt else len(src) - body_start)
    body = src[body_start:body_end]

    def grab(field):
        for q in ['"', "'"]:
            esc_q = re.escape(q)
            mm = re.search(rf"{field}:\s*{esc_q}((?:[^{esc_q}\\]|\\.)*){esc_q}\s*,", body)
            if mm:
                return mm.group(1)
        return ''

    # countries is an array — special parse
    countries = []
    cm = re.search(r"countries:\s*\[(.*?)\]", body, re.DOTALL)
    if cm:
        countries = [m.group(1) or m.group(2) for m in re.finditer(r"['\"]([^'\"]+)['\"]", cm.group(1))]

    # priceFrom number
    pf = ''
    pfm = re.search(r"priceFrom:\s*([0-9]+)", body)
    if pfm:
        pf = pfm.group(1)

    itineraries[slug] = {
        'title':     grab('title'),
        'subtitle':  grab('subtitle'),
        'heroImage': grab('heroImage'),
        'duration':  grab('duration'),
        'kicker':    grab('kicker'),
        'countries': countries,
        'priceFrom': pf,
    }

print(f'Parsed {len(itineraries)} itineraries from data.js')

OUT_DIR.mkdir(exist_ok=True)

def html_esc(s):
    return escape(s, quote=True).replace('&amp;rsquo;', '&rsquo;').replace('&amp;mdash;', '&mdash;').replace('&amp;amp;', '&amp;')

def replace_head(tpl, j, slug):
    title = j['title'] or 'A Journey'
    subtitle = j['subtitle'] or ''
    hero = j['heroImage'] or ''
    url = f"{BASE_URL}/journeys/{slug}"
    img = f"{BASE_URL}/{hero.lstrip('/')}" if hero and not hero.startswith('http') else hero

    # Description built from duration + countries + priceFrom (matches the JS pattern)
    countries_str = ' & '.join(j['countries']) if j['countries'] else ''
    duration = j['duration'] or ''
    price = f"${int(j['priceFrom']):,}" if j['priceFrom'] else ''
    desc = ''
    if duration:
        desc = f"{duration} luxury journey by Wander by Wilson."
    if countries_str:
        desc += f" {countries_str}."
    if price:
        desc += f" From {price} per person."

    full_title = f"{title}{' — ' + subtitle if subtitle else ''} | Wander by Wilson"
    # Strip HTML entities/tags from title for clean preview
    clean_title = re.sub(r'<[^>]+>', '', full_title)
    clean_desc  = re.sub(r'<[^>]+>', '', desc)

    out = tpl
    out = re.sub(r'<title[^>]*>[^<]*</title>',
                 f'<title id="journeyTitle">{html_esc(clean_title)}</title>', out)
    out = re.sub(r'<meta name="description"[^>]*content="[^"]*"\s*/?>',
                 f'<meta name="description" id="journeyMetaDesc" content="{html_esc(clean_desc)}">', out)
    og_block = (
        f'<link rel="canonical" href="{url}">\n'
        f'    <meta property="og:type" content="website">\n'
        f'    <meta property="og:title" content="{html_esc(clean_title)}">\n'
        f'    <meta property="og:description" content="{html_esc(clean_desc)}">\n'
        f'    <meta property="og:image" content="{img}">\n'
        f'    <meta property="og:url" content="{url}">\n'
        f'    <meta property="og:site_name" content="Wander by Wilson">\n'
        f'    <meta name="twitter:card" content="summary_large_image">\n'
        f'    <meta name="twitter:title" content="{html_esc(clean_title)}">\n'
        f'    <meta name="twitter:description" content="{html_esc(clean_desc)}">\n'
        f'    <meta name="twitter:image" content="{img}">'
    )
    out = re.sub(
        r'(<meta name="description"[^>]*content="[^"]*"\s*/?>)',
        r'\1\n    ' + og_block,
        out, count=1
    )
    return out

written = 0
for slug, j in itineraries.items():
    if not j['title']:
        print(f'  ⚠ skipped {slug}: no title')
        continue
    (OUT_DIR / f'{slug}.html').write_text(replace_head(tpl, j, slug))
    written += 1

print(f'Wrote {written} journey pages to /journeys/')
