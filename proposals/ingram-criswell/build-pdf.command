#!/bin/bash
# ============================================================================
# build-pdf.command — Double-click in Finder to regenerate the proposal PDF
# from proposal.html / proposal.css.
#
# What it does:
#   1. Launches Chrome in headless mode pointing at proposal.html
#   2. Uses Chrome's PDF API (DevTools Protocol) to render a 10-page,
#      letter-portrait PDF with all background images, gold rules, etc.
#   3. Overwrites Italy_Proposal_Ingram_Criswell.pdf in this folder.
#
# Requirements: Google Chrome installed in /Applications, Python 3.
# First-run note (macOS Gatekeeper): if you see a "cannot be opened" warning,
# right-click this file in Finder → Open → Open. After that, double-click works.
# ============================================================================

set -e
cd "$(dirname "$0")"

PROPOSAL_DIR="$(pwd)"
HTML_PATH="$PROPOSAL_DIR/proposal.html"
OUT_PATH="$PROPOSAL_DIR/Italy_Proposal_Ingram_Criswell.pdf"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT=9311
USER_DIR="/tmp/chrome-wndr-build-$$"

echo ""
echo "──────────────────────────────────────────────────────────────────"
echo " Wander by Wilson — proposal PDF builder"
echo "──────────────────────────────────────────────────────────────────"
echo ""

# ── Sanity checks ───────────────────────────────────────────────────────────
if [ ! -f "$HTML_PATH" ]; then
  echo "✗ Missing proposal.html in $PROPOSAL_DIR"
  echo "  This script must live in the same folder as proposal.html."
  read -n 1 -s -r -p "Press any key to close..." ; echo ; exit 1
fi

if [ ! -x "$CHROME" ]; then
  echo "✗ Google Chrome not found at $CHROME"
  echo "  Install Chrome from https://www.google.com/chrome/ and try again."
  read -n 1 -s -r -p "Press any key to close..." ; echo ; exit 1
fi

# ── Clean any stale Chrome on our port ──────────────────────────────────────
lsof -ti:$PORT 2>/dev/null | xargs kill -9 2>/dev/null || true
rm -rf "$USER_DIR"

# ── Launch Chrome headless ──────────────────────────────────────────────────
echo "→ Launching headless Chrome..."
"$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --remote-debugging-port=$PORT \
  --remote-allow-origins='*' \
  --user-data-dir="$USER_DIR" \
  "file://$HTML_PATH" </dev/null >/dev/null 2>&1 &
CHROME_PID=$!

# Wait for CDP to come online (up to 15 seconds)
for i in $(seq 1 30); do
  if curl -s "http://localhost:$PORT/json/version" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

if ! curl -s "http://localhost:$PORT/json/version" >/dev/null 2>&1; then
  echo "✗ Chrome failed to start. Check that Chrome isn't already running with --remote-debugging-port=$PORT."
  kill $CHROME_PID 2>/dev/null || true
  read -n 1 -s -r -p "Press any key to close..." ; echo ; exit 1
fi

# ── Drive Chrome via the DevTools Protocol to print the PDF ─────────────────
echo "→ Rendering PDF (this takes a few seconds while fonts and images load)..."

python3 - "$PORT" "$OUT_PATH" <<'PYEOF'
import json, base64, time, urllib.request, sys, subprocess

port = sys.argv[1]
out_path = sys.argv[2]

# Make sure websocket-client is available
try:
    import websocket
except ImportError:
    print("  installing websocket-client (one-time)...")
    subprocess.run([sys.executable, "-m", "pip", "install", "--quiet", "--user", "websocket-client"], check=True)
    import websocket

tabs = json.loads(urllib.request.urlopen(f'http://localhost:{port}/json').read())
tab = next((t for t in tabs if t['type'] == 'page'), None)
if not tab:
    print("ERROR: no page tab found"); sys.exit(1)

ws = websocket.create_connection(
    tab['webSocketDebuggerUrl'],
    max_size=None,
    header=[f'Origin: http://localhost:{port}'],
    timeout=120,
    suppress_origin=True,
)

msg_id = 0
def call(method, params=None):
    global msg_id
    msg_id += 1
    payload = {'id': msg_id, 'method': method}
    if params:
        payload['params'] = params
    ws.send(json.dumps(payload))
    while True:
        try:
            resp = json.loads(ws.recv())
        except Exception:
            continue
        if resp.get('id') == msg_id:
            return resp

call('Page.enable')

# Give the page time to navigate, load images, and pull Google Fonts.
time.sleep(5)

# Block on actual font readiness (catches slow networks).
for _ in range(20):
    r = call('Runtime.evaluate', {'expression': 'document.fonts.status', 'returnByValue': True})
    if r.get('result', {}).get('result', {}).get('value') == 'loaded':
        break
    time.sleep(0.5)

# Switch to print stylesheet rules.
call('Emulation.setEmulatedMedia', {'media': 'print'})
time.sleep(1)

result = call('Page.printToPDF', {
    'paperWidth': 8.5,
    'paperHeight': 11,
    'marginTop': 0,
    'marginBottom': 0,
    'marginLeft': 0,
    'marginRight': 0,
    'printBackground': True,
    'preferCSSPageSize': True,
    'scale': 1.0,
    'transferMode': 'ReturnAsStream',
})

if 'error' in result:
    print(f"ERROR: {result['error']}")
    sys.exit(1)

stream = result['result']['stream']
chunks = []
while True:
    cr = call('IO.read', {'handle': stream, 'size': 524288})['result']
    data = cr['data']
    data = base64.b64decode(data) if cr.get('base64Encoded') else data.encode('latin-1')
    chunks.append(data)
    if cr.get('eof'):
        break
call('IO.close', {'handle': stream})

with open(out_path, 'wb') as f:
    f.write(b''.join(chunks))

ws.close()
total = sum(len(c) for c in chunks)
print(f"  ✓ Wrote {total:,} bytes")
PYEOF

# ── Cleanup ─────────────────────────────────────────────────────────────────
kill $CHROME_PID 2>/dev/null || true
wait $CHROME_PID 2>/dev/null || true
rm -rf "$USER_DIR"

echo ""
echo "✓ PDF saved to:"
echo "  $OUT_PATH"
echo ""
echo "Opening it now..."
open "$OUT_PATH"
echo ""
read -n 1 -s -r -p "Press any key to close this window..." ; echo
