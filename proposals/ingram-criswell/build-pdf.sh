#!/usr/bin/env bash
#
# build-pdf.sh — render proposal.html to Italy_Proposal_Ingram_Criswell.pdf
#
# Uses Chrome's headless mode + DevTools Protocol so the @page CSS rules,
# background colours, and images all render exactly as designed (no scaling,
# no extra margins).  Output is full-bleed Letter (8.5x11in), 12 pages.
#
# Requires: macOS with Google Chrome, /usr/bin/ruby, python3 + websocket-client
#           (the script installs websocket-client if missing).
#
# Usage:  ./build-pdf.sh
#

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="${ROOT}/Italy_Proposal_Ingram_Criswell.pdf"
PORT=8765
CDP_PORT=9876
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SERVE_TMP="$(mktemp -d -t proposal_serve)"
trap 'rm -rf "$SERVE_TMP"' EXIT

if [ ! -x "$CHROME" ]; then
  echo "Google Chrome not found at $CHROME" >&2
  exit 1
fi

# Ensure python websocket-client is installed (one-time)
python3 -c "import websocket" 2>/dev/null || pip3 install --quiet --user websocket-client

# Small Ruby static server — pinned to absolute path to avoid sandbox quirks
cat > "${SERVE_TMP}/serve.rb" <<RUBY
require 'webrick'
server = WEBrick::HTTPServer.new(
  Port: ${PORT}, DocumentRoot: '${ROOT}',
  Logger: WEBrick::Log.new(nil, WEBrick::Log::WARN), AccessLog: []
)
trap('INT')  { server.shutdown }
trap('TERM') { server.shutdown }
server.start
RUBY

# Stop anything currently using our ports
lsof -ti:${PORT} 2>/dev/null | xargs -I{} kill -9 {} 2>/dev/null || true
lsof -ti:${CDP_PORT} 2>/dev/null | xargs -I{} kill -9 {} 2>/dev/null || true

echo "> starting local server on :${PORT}"
ruby "${SERVE_TMP}/serve.rb" &
SERVE_PID=$!
trap 'kill $SERVE_PID 2>/dev/null; rm -rf "$SERVE_TMP"' EXIT

sleep 1.5

# Launch headless Chrome with DevTools enabled, loading the proposal
echo "> launching headless Chrome on :${CDP_PORT}"
nohup "$CHROME" \
  --headless=new \
  --disable-gpu \
  --no-sandbox \
  --hide-scrollbars \
  --remote-debugging-port=${CDP_PORT} \
  '--remote-allow-origins=*' \
  --user-data-dir="${SERVE_TMP}/chrome-profile" \
  "http://localhost:${PORT}/proposal.html" </dev/null >/dev/null 2>&1 &
CHROME_PID=$!
trap 'kill $CHROME_PID 2>/dev/null; kill $SERVE_PID 2>/dev/null; rm -rf "$SERVE_TMP"' EXIT

# Wait for CDP to be ready
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fs -o /dev/null "http://localhost:${CDP_PORT}/json/version"; then break; fi
  sleep 1
done

echo "> generating PDF via Page.printToPDF"
python3 - "${OUT}" "${CDP_PORT}" <<'PY'
import sys, json, base64, time, urllib.request, websocket
out_path, cdp_port = sys.argv[1], sys.argv[2]
tabs = json.loads(urllib.request.urlopen(f'http://localhost:{cdp_port}/json').read())
tab = next(t for t in tabs if t['type'] == 'page' and 'proposal' in t.get('url',''))
ws = websocket.create_connection(tab['webSocketDebuggerUrl'], max_size=None,
        header=[f'Origin: http://localhost:{cdp_port}'], timeout=180, suppress_origin=True)
_id = 0
def call(method, params=None):
    global _id; _id += 1
    p = {'id': _id, 'method': method}
    if params: p['params'] = params
    ws.send(json.dumps(p))
    while True:
        try: r = json.loads(ws.recv())
        except: continue
        if r.get('id') == _id: return r
call('Page.enable')
call('Page.reload', {'ignoreCache': True})
time.sleep(4)
call('Emulation.setEmulatedMedia', {'media': 'print'})
time.sleep(1)
result = call('Page.printToPDF', {
    'paperWidth': 8.5, 'paperHeight': 11,
    'marginTop': 0, 'marginBottom': 0, 'marginLeft': 0, 'marginRight': 0,
    'printBackground': True, 'preferCSSPageSize': True, 'scale': 1.0,
    'transferMode': 'ReturnAsStream',
})
stream = result['result']['stream']
chunks = []
while True:
    cr = call('IO.read', {'handle': stream, 'size': 524288})['result']
    d = cr['data']
    d = base64.b64decode(d) if cr.get('base64Encoded') else d.encode('latin-1')
    chunks.append(d)
    if cr.get('eof'): break
call('IO.close', {'handle': stream})
with open(out_path, 'wb') as f:
    f.write(b''.join(chunks))
print(f'  wrote {out_path} ({sum(len(c) for c in chunks)//1024} KB)')
ws.close()
PY

kill $CHROME_PID 2>/dev/null || true
kill $SERVE_PID  2>/dev/null || true

echo
echo "done.  open with:  open '${OUT}'"
