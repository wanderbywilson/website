// Read-only Google Analytics 4 + Search Console access for the Studio's
// Performance page. Raw fetch, no npm deps (the repo has no package.json).
//
// Wilson connects it with "Sign in with Google" on the Performance page:
//   1. She creates an OAuth client (Web application) in Google Cloud with the
//      redirect URI below and pastes its Client ID + secret into the Studio.
//   2. She clicks "Sign in with Google" and approves read-only access;
//      /api/google-oauth stores the refresh token.
// Everything lives in the private Blob store at settings/google.json. It reads
// with Wilson's own Google access, so no robot account needs adding anywhere.
//
// (Service-account key files are blocked by her Workspace's security policy,
// so that route isn't used; the code still accepts one if that ever changes.)

const crypto = require('crypto');
const { blobGetJSON, blobPutJSON, blobDelete } = require('./_blob');

const SETTINGS = 'settings/google.json';
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'openid', 'email'
].join(' ');
const REDIRECT_URI = 'https://www.wanderbywilson.com/api/google-oauth';

// Wander by Wilson's GA4 property and Search Console domain property.
const DEFAULT_PROPERTY = '539465760';
const DEFAULT_SITE = 'sc-domain:wanderbywilson.com';

async function loadSettings() {
    return blobGetJSON(SETTINGS);
}

async function saveSettings(settings) {
    await blobPutJSON(SETTINGS, settings);
    return settings;
}

async function clearSettings() {
    await blobDelete([SETTINGS]);
}

function isConnected(s) {
    return !!(s && (s.refreshToken || s.privateKey));
}

// Step 1: the OAuth client Wilson made in Google Cloud.
async function saveClient(clientId, clientSecret) {
    clientId = String(clientId || '').trim();
    clientSecret = String(clientSecret || '').trim();
    if (!/\.apps\.googleusercontent\.com$/.test(clientId)) throw new Error('The Client ID should end in .apps.googleusercontent.com');
    if (clientSecret.length < 10) throw new Error('Paste the Client secret too');
    return saveSettings({ mode: 'oauth', clientId, clientSecret, propertyId: DEFAULT_PROPERTY, siteUrl: DEFAULT_SITE });
}

// Blob reads can lag a fresh write by up to ~60s, so nothing in the sign-in
// round trip may depend on reading back what was just written. The `state`
// Google echoes back is therefore self-checking: an expiry plus an HMAC keyed
// by a server-only secret (the Blob token never leaves the server).
function stateKey() {
    return crypto.createHash('sha256').update('studio-google-oauth:' + (process.env.BLOB_READ_WRITE_TOKEN || '')).digest();
}
function makeState() {
    const payload = `${Date.now() + 15 * 60 * 1000}.${crypto.randomBytes(8).toString('hex')}`;
    return payload + '.' + crypto.createHmac('sha256', stateKey()).update(payload).digest('hex');
}
function checkState(state) {
    const parts = String(state || '').split('.');
    if (parts.length !== 3) return false;
    const payload = parts[0] + '.' + parts[1];
    const want = Buffer.from(crypto.createHmac('sha256', stateKey()).update(payload).digest('hex'));
    const got = Buffer.from(parts[2]);
    return want.length === got.length && crypto.timingSafeEqual(want, got) && Number(parts[0]) > Date.now();
}

// Settings with the OAuth client in them, allowing for that read lag right
// after "Save" (a few short retries rather than a false failure).
async function loadClientSettings() {
    for (let i = 0; i < 6; i++) {
        const s = await loadSettings();
        if (s && s.clientId && s.clientSecret) return s;
        await new Promise(r => setTimeout(r, 1500));
    }
    return null;
}

// Step 2: send Wilson to Google's consent screen.
async function authUrl() {
    const s = await loadClientSettings();
    if (!s) throw new Error('Add the Client ID and secret first');
    const state = makeState();
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id: s.clientId, redirect_uri: REDIRECT_URI, response_type: 'code',
        scope: SCOPES, access_type: 'offline', prompt: 'consent', state
    });
}

// Google sends her back with ?code&state: swap the code for a refresh token.
async function finishAuth(code, state) {
    if (!checkState(state)) {
        throw new Error('That sign-in link expired. Go back to the Studio and click Sign in with Google again.');
    }
    const s = await loadClientSettings();
    if (!s) throw new Error('The Studio’s sign-in codes weren’t found. Enter them again on the Performance page.');
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ code, client_id: s.clientId, client_secret: s.clientSecret, redirect_uri: REDIRECT_URI, grant_type: 'authorization_code' })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.refresh_token) throw new Error('Google didn’t finish the sign-in: ' + (data.error_description || data.error || res.status));
    let account = '';
    try { account = JSON.parse(Buffer.from(data.id_token.split('.')[1], 'base64').toString()).email || ''; } catch (e) {}
    delete s.oauthState;   // left over from the first version
    Object.assign(s, { refreshToken: data.refresh_token, account, connectedAt: new Date().toISOString() });
    await saveSettings(s);
    return s;
}

function b64url(buf) {
    return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Short-lived access token (1h), cached per server instance.
let tokenCache = { key: '', token: '', exp: 0 };
async function accessToken(s) {
    const now = Math.floor(Date.now() / 1000);
    const key = s.refreshToken || s.clientEmail;
    if (tokenCache.key === key && tokenCache.exp - 60 > now) return tokenCache.token;
    let body;
    if (s.refreshToken) {
        body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: s.refreshToken, client_id: s.clientId, client_secret: s.clientSecret });
    } else {
        const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
        const claims = b64url(JSON.stringify({ iss: s.clientEmail, scope: SCOPES, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 }));
        const sig = b64url(crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), s.privateKey));
        body = new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${sig}` });
    }
    const res = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) {
        const err = new Error(data.error === 'invalid_grant'
            ? 'Google access was removed or expired. Sign in with Google again on the Performance page.'
            : 'Google sign-in failed: ' + (data.error_description || data.error || res.status));
        err.status = 401;
        throw err;
    }
    tokenCache = { key, token: data.access_token, exp: now + (data.expires_in || 3600) };
    return data.access_token;
}

async function googlePost(s, url, body, label) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await accessToken(s)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(`${label}: ${(data.error && data.error.message) || res.status}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

// GA4 Data API runReport → rows as plain objects keyed by dimension/metric name.
async function ga4(s, body) {
    const data = await googlePost(s, `https://analyticsdata.googleapis.com/v1beta/properties/${s.propertyId}:runReport`, body, 'Google Analytics');
    const dims = (data.dimensionHeaders || []).map(h => h.name);
    const mets = (data.metricHeaders || []).map(h => h.name);
    return (data.rows || []).map(r => {
        const o = {};
        dims.forEach((d, i) => { o[d] = r.dimensionValues[i].value; });
        mets.forEach((m, i) => { o[m] = Number(r.metricValues[i].value) || 0; });
        return o;
    });
}

// Search Console searchAnalytics.query. Rows: {keys[], clicks, impressions, ctr, position}.
async function gsc(s, body) {
    const data = await googlePost(s, `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(s.siteUrl)}/searchAnalytics/query`, body, 'Search Console');
    return data.rows || [];
}

module.exports = { loadSettings, clearSettings, isConnected, saveClient, authUrl, finishAuth, ga4, gsc, REDIRECT_URI };
