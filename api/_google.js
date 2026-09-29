// Read-only Google Analytics 4 + Search Console access for the Studio's
// Performance tab. Raw fetch, no npm deps (the repo has no package.json).
//
// Auth is a Google Cloud service account ("the robot"): Wilson pastes its JSON
// key on the Studio's Performance tab (Connect Google). It's kept in the
// private Blob store at settings/google.json, and the robot's email is added
// as a Viewer in GA4 and a user in Search Console. It can only read reports.

const crypto = require('crypto');
const { blobGetJSON, blobPutJSON, blobDelete } = require('./_blob');

const SETTINGS = 'settings/google.json';
const SCOPES = [
    'https://www.googleapis.com/auth/analytics.readonly',
    'https://www.googleapis.com/auth/webmasters.readonly'
].join(' ');

// Wander by Wilson's GA4 property and Search Console domain property.
const DEFAULT_PROPERTY = '539465760';
const DEFAULT_SITE = 'sc-domain:wanderbywilson.com';

async function loadSettings() {
    return blobGetJSON(SETTINGS);
}

async function saveSettings(keyJson, propertyId, siteUrl) {
    let key;
    try { key = typeof keyJson === 'string' ? JSON.parse(keyJson) : keyJson; }
    catch (e) { throw new Error('That isn’t the key file — it should start with { and end with }'); }
    if (!key || key.type !== 'service_account' || !key.client_email || !key.private_key) {
        throw new Error('That file isn’t a service-account key (it needs client_email and private_key)');
    }
    const settings = {
        clientEmail: key.client_email,
        privateKey: key.private_key,
        propertyId: String(propertyId || DEFAULT_PROPERTY).replace(/\D/g, ''),
        siteUrl: siteUrl || DEFAULT_SITE,
        connectedAt: new Date().toISOString()
    };
    await blobPutJSON(SETTINGS, settings);
    return settings;
}

async function clearSettings() {
    await blobDelete([SETTINGS]);
}

function b64url(buf) {
    return Buffer.from(buf).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
}

// Service-account JWT → OAuth access token (valid 1h; cached per instance).
let tokenCache = { key: '', token: '', exp: 0 };
async function accessToken(settings) {
    const now = Math.floor(Date.now() / 1000);
    if (tokenCache.key === settings.clientEmail && tokenCache.exp - 60 > now) return tokenCache.token;
    const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const claims = b64url(JSON.stringify({
        iss: settings.clientEmail, scope: SCOPES,
        aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
    }));
    const signature = b64url(crypto.sign('RSA-SHA256', Buffer.from(`${header}.${claims}`), settings.privateKey));
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: `${header}.${claims}.${signature}`
        })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.access_token) throw new Error('Google sign-in failed: ' + (data.error_description || data.error || res.status));
    tokenCache = { key: settings.clientEmail, token: data.access_token, exp: now + (data.expires_in || 3600) };
    return data.access_token;
}

async function googlePost(settings, url, body, label) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${await accessToken(settings)}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = (data.error && data.error.message) || res.status;
        const err = new Error(`${label}: ${msg}`);
        err.status = res.status;
        throw err;
    }
    return data;
}

// GA4 Data API runReport. Returns rows as plain objects keyed by the
// dimension/metric names asked for.
async function ga4(settings, body) {
    const data = await googlePost(settings,
        `https://analyticsdata.googleapis.com/v1beta/properties/${settings.propertyId}:runReport`, body, 'Google Analytics');
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
async function gsc(settings, body) {
    const data = await googlePost(settings,
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(settings.siteUrl)}/searchAnalytics/query`, body, 'Search Console');
    return data.rows || [];
}

module.exports = { loadSettings, saveSettings, clearSettings, ga4, gsc, DEFAULT_PROPERTY, DEFAULT_SITE };
