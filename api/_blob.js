// Minimal Vercel Blob REST helper — no npm deps (this repo has no package.json).
// Store: wndr-proposals (private) — created 2026-07-29 for the Proposal Studio.
// Contract verified against the live API: PUT/LIST/DELETE on blob.vercel-storage.com,
// reads on the store host with a Bearer token (403 without — blobs are private).

const STORE_HOST = 'https://a0hhz6oudk0wwlqt.private.blob.vercel-storage.com';
const API_HOST = 'https://blob.vercel-storage.com';

function token() {
    const t = process.env.BLOB_READ_WRITE_TOKEN;
    if (!t) throw new Error('BLOB_READ_WRITE_TOKEN not configured');
    return t;
}

// Write JSON to a fixed pathname (overwrites).
async function blobPutJSON(pathname, obj) {
    const res = await fetch(`${API_HOST}/${pathname}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token()}`,
            'x-api-version': '7',
            'x-add-random-suffix': '0',
            'x-allow-overwrite': '1',
            'x-content-type': 'application/json',
            'x-vercel-blob-access': 'private'
        },
        body: JSON.stringify(obj)
    });
    if (!res.ok) throw new Error(`Blob PUT ${pathname} failed: ${res.status} ${await res.text()}`);
    return res.json();
}

// Read JSON; returns null when the blob doesn't exist.
async function blobGetJSON(pathname) {
    const res = await fetch(`${STORE_HOST}/${pathname}`, {
        headers: { 'Authorization': `Bearer ${token()}` }
    });
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) throw new Error(`Blob GET ${pathname} failed: ${res.status}`);
    return res.json();
}

async function blobList(prefix) {
    const res = await fetch(`${API_HOST}/?prefix=${encodeURIComponent(prefix)}&limit=1000`, {
        headers: { 'Authorization': `Bearer ${token()}`, 'x-api-version': '7' }
    });
    if (!res.ok) throw new Error(`Blob LIST ${prefix} failed: ${res.status}`);
    const data = await res.json();
    return data.blobs || [];
}

async function blobDelete(pathnames) {
    const urls = pathnames.map(p => `${STORE_HOST}/${p}`);
    const res = await fetch(`${API_HOST}/delete`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token()}`,
            'x-api-version': '7',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ urls })
    });
    if (!res.ok) throw new Error(`Blob DELETE failed: ${res.status}`);
}

module.exports = { blobPutJSON, blobGetJSON, blobList, blobDelete };
