#!/usr/bin/env python3
"""
check-booking-links.py
─────────────────────────────────────────────────────────────────────
Pings every hotel's `bookingUrl` (from data.js) once and reports any
that return non-2xx/3xx HTTP statuses.

Designed to run weekly via .github/workflows/check-booking-links.yml
and either:
  - exit 0  + write a clean "all OK" summary  (no notification)
  - exit 1  + write a broken-links summary    (the workflow opens an
              issue, which sends Wilson an email via GitHub)

Virtuoso URLs require cookies to render a full page (they redirect to
a login challenge without them), so we count both:
  - 200, 301, 302, 308           → OK
  - 405 with "virtuoso.com"      → OK (Virtuoso blocks HEAD; we tried)
  - 3xx → login.virtuoso.com     → OK (session-required, expected)

A URL is "broken" if it returns 404, 410, 5xx, or fails to connect.
─────────────────────────────────────────────────────────────────────
"""
import json
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path

DATA_JS = Path(__file__).resolve().parent.parent / "data.js"
TIMEOUT = 15  # seconds per request

# Pull every (slug, bookingUrl) pair out of data.js without parsing JS.
# We look for the pattern that lives just before each entry's closing brace.
src = DATA_JS.read_text(encoding="utf-8")
prop_section = re.search(
    r"const PROPERTIES\s*=\s*\{(.*?)^\};", src, re.MULTILINE | re.DOTALL
)
if not prop_section:
    print("ERROR: could not find PROPERTIES block in data.js", file=sys.stderr)
    sys.exit(2)

# Walk the block: each property starts with `'slug': {` and ends with `},`
# We extract the bookingUrl line within each.
entries = re.findall(
    r"^\s+'([a-z0-9-]+)':\s*\{(.*?)^\s+\},?$",
    prop_section.group(1),
    re.MULTILINE | re.DOTALL,
)

links = []  # list of (slug, name, url)
for slug, body in entries:
    name_m = re.search(r"name:\s*['\"]([^'\"]+)['\"]", body)
    url_m = re.search(r"bookingUrl:\s*['\"]([^'\"]+)['\"]", body)
    if not url_m:
        continue
    url = url_m.group(1)
    if url == "#" or not url.startswith("http"):
        continue  # fallback URL — handled by inquiry form
    links.append((slug, name_m.group(1) if name_m else slug, url))

print(f"Checking {len(links)} hotel booking URLs…\n")

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
broken = []
ok = []
warnings = []


def fetch(url, method, range_header=None):
    """Try one request; return (status, final_url, error)."""
    headers = {
        "User-Agent": UA,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }
    if range_header:
        headers["Range"] = range_header
    try:
        req = urllib.request.Request(url, method=method, headers=headers)
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            return (resp.status, resp.url, None)
    except urllib.error.HTTPError as e:
        return (e.code, url, None)
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        return (None, url, str(e))


for slug, name, url in links:
    # Try HEAD first (cheap), fall back to GET with a small Range
    # (Virtuoso + many anti-bot CDNs return 404/405 on HEAD).
    status, final_url, err = fetch(url, "HEAD")
    if (err or status not in (200, 301, 302, 303, 307, 308)):
        # Retry with GET, only fetching the first 512 bytes
        status, final_url, err = fetch(url, "GET", range_header="bytes=0-512")

    label = f"{name} ({slug})"
    if err:
        broken.append((label, url, f"connection error: {err}"))
        print(f"  X BROKEN: {label}  ->  {err}")
    elif status in (200, 206, 301, 302, 303, 307, 308):
        # 206 = Partial Content (Range request honored)
        ok.append((label, url, status, final_url))
        print(f"  OK ({status}): {label}")
    elif status in (403, 401) and "virtuoso.com" in url:
        # Virtuoso may reject bots entirely — URL likely fine in a real browser
        warnings.append((label, url, f"HTTP {status} (Virtuoso anti-bot; URL likely OK)"))
        print(f"  Warn ({status}, expected for Virtuoso): {label}")
    else:
        broken.append((label, url, f"HTTP {status}"))
        print(f"  X BROKEN ({status}): {label}")

# Write summary file the GitHub workflow will read
summary_lines = [
    f"# Hotel Booking Link Check\n",
    f"Checked: **{len(links)}** booking URLs",
    f"OK: **{len(ok)}** · Warnings: **{len(warnings)}** · Broken: **{len(broken)}**\n",
]
if broken:
    summary_lines.append("## 🚨 Broken links\n")
    for label, url, reason in broken:
        summary_lines.append(f"- **{label}** — {reason}\n  - `{url}`")
if warnings:
    summary_lines.append("\n## ⚠️ Warnings (likely OK)\n")
    for label, url, reason in warnings:
        summary_lines.append(f"- **{label}** — {reason}")
if not broken:
    summary_lines.append("\n## ✅ All booking links are live.\n")

Path("link-check-summary.md").write_text("\n".join(summary_lines), encoding="utf-8")
print(f"\n{'='*60}")
print(f"Result: {len(broken)} broken / {len(warnings)} warnings / {len(ok)} OK")

# Exit code: non-zero only if there are TRULY broken links
sys.exit(1 if broken else 0)
