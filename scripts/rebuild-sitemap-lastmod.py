#!/usr/bin/env python3
"""
rebuild-sitemap-lastmod.py
────────────────────────────────────────────────────────────────────
Rebuild sitemap.xml with per-URL accurate <lastmod> dates.

Data sources (in order of preference per URL type):

  * Blog post (/post/<slug>):
      - "Last Updated: DD Month YYYY" line in the post body (most precise)
      - else the post's `date: "Month YYYY"` field from blog-data-v15.js
      - converted to YYYY-MM-15 (mid-month) when only month is known

  * Static HTML pages (/hotels/<slug>, /journeys/<slug>, top-level
    sections like /services, /cruises, etc.):
      - `git log -1 --format=%cs <file>` — committer date of the last
        commit that touched the file

If the URL maps to a file that doesn't exist, the URL is preserved with
its existing lastmod (no random dates, no removal).

Run:  python3 scripts/rebuild-sitemap-lastmod.py
────────────────────────────────────────────────────────────────────
"""
import re
import subprocess
from pathlib import Path
from datetime import datetime
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
SITEMAP = ROOT / 'sitemap.xml'
BLOG_DATA = ROOT / 'blog-data-v15.js'
BASE_URL = 'https://www.wanderbywilson.com'

MONTH_NAMES = {
    'january': 1, 'february': 2, 'march': 3, 'april': 4,
    'may': 5, 'june': 6, 'july': 7, 'august': 8,
    'september': 9, 'october': 10, 'november': 11, 'december': 12,
}

# ── Parse blog-data-v15.js for slug → date mapping ─────────────────────
def parse_blog_dates():
    src = BLOG_DATA.read_text()
    posts = {}
    # Iterate post blocks: each starts with "    '<slug>': {" and we read
    # until the next post or end of object. Cheap parse — good enough.
    pattern = re.compile(r"\n    '([a-z0-9-]+)':\s*\{", re.MULTILINE)
    matches = list(pattern.finditer(src))
    for i, m in enumerate(matches):
        slug = m.group(1)
        body_start = m.end()
        body_end = matches[i + 1].start() if i + 1 < len(matches) else len(src)
        body = src[body_start:body_end]

        # Try "Last Updated: DD Month YYYY" in the rendered body first
        lu = re.search(r'Last Updated:\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})', body)
        if lu:
            day, month_name, year = lu.group(1), lu.group(2).lower(), lu.group(3)
            mn = MONTH_NAMES.get(month_name)
            if mn:
                posts[slug] = f'{int(year):04d}-{mn:02d}-{int(day):02d}'
                continue

        # Fall back to the `date:` field — "Month YYYY"
        dm = re.search(r"date:\s*\"([A-Za-z]+)\s+(\d{4})\"", body)
        if dm:
            month_name, year = dm.group(1).lower(), dm.group(2)
            mn = MONTH_NAMES.get(month_name)
            if mn:
                # Mid-month — implies we know the month, not the day
                posts[slug] = f'{int(year):04d}-{mn:02d}-15'
                continue

        # No date found — caller will fall back to git
        posts[slug] = None
    return posts

# ── Git last-commit date for any file in the repo ──────────────────────
def git_last_modified(path: Path) -> str:
    if not path.exists():
        return None
    try:
        out = subprocess.run(
            ['git', '-C', str(ROOT), 'log', '-1', '--format=%cs', '--', str(path)],
            capture_output=True, text=True, check=True
        ).stdout.strip()
        # %cs = committer date short, ISO 8601 YYYY-MM-DD
        if re.match(r'^\d{4}-\d{2}-\d{2}$', out):
            return out
    except subprocess.CalledProcessError:
        pass
    return None

# ── Map a sitemap URL to its source file on disk ───────────────────────
def url_to_file(url: str) -> Path:
    """Return the source HTML file path for a given site URL, or None."""
    path = urlparse(url).path.strip('/')
    if path == '':
        return ROOT / 'index.html'
    # Top-level sections — try <name>.html
    candidate = ROOT / f'{path}.html'
    if candidate.exists():
        return candidate
    # Nested paths (hotels/<slug>, journeys/<slug>) — also <path>.html
    candidate = ROOT / f'{path}.html'
    if candidate.exists():
        return candidate
    # /post/<slug> — these are rendered client-side, no static file
    if path.startswith('post/'):
        return None
    return None

# ── Rebuild sitemap ─────────────────────────────────────────────────────
def rebuild():
    src = SITEMAP.read_text()
    blog_dates = parse_blog_dates()
    print(f'  Parsed {len(blog_dates)} blog post date entries')

    # Match each <url> block individually so we can rewrite its <lastmod>
    url_re = re.compile(
        r'(<url>\s*<loc>([^<]+)</loc>\s*<lastmod>)([^<]+)(</lastmod>)',
        re.DOTALL
    )

    stats = {'blog': 0, 'git': 0, 'unchanged': 0, 'missing': 0}
    by_date = {}

    def replace(m):
        prefix, url, old_date, suffix = m.group(1), m.group(2), m.group(3), m.group(4)
        path = urlparse(url).path.strip('/')

        new_date = None
        if path.startswith('post/'):
            slug = path[len('post/'):]
            d = blog_dates.get(slug)
            if d:
                new_date = d
                stats['blog'] += 1

        if new_date is None:
            f = url_to_file(url)
            if f:
                d = git_last_modified(f)
                if d:
                    new_date = d
                    stats['git'] += 1

        if new_date is None:
            # No source of truth — keep the existing date (don't invent)
            new_date = old_date
            stats['unchanged' if path else 'missing'] += 1

        by_date.setdefault(new_date, 0)
        by_date[new_date] += 1
        return f'{prefix}{new_date}{suffix}'

    new_src = url_re.sub(replace, src)
    SITEMAP.write_text(new_src)

    print(f'\n  Updated lastmod sources:')
    print(f'    blog-data dates:  {stats["blog"]}')
    print(f'    git mtime:        {stats["git"]}')
    print(f'    unchanged:        {stats["unchanged"]}')
    print(f'    unmappable:       {stats["missing"]}')
    print(f'\n  Distribution of unique lastmod dates ({len(by_date)} unique):')
    for d in sorted(by_date.keys()):
        print(f'    {d}  ×{by_date[d]}')

if __name__ == '__main__':
    rebuild()
