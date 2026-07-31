// /api/proposals — Proposal Studio storage endpoint.
//
//   GET  ?id={id}          → public read of a published proposal (powers /proposals/{id}
//                            for proposals created in the Studio; static ones still live
//                            in proposals-data.js and never hit this endpoint).
//   POST {passcode, action} → Studio operations, all gated by STUDIO_PASSCODE:
//        action:'auth'                  → validate passcode for the Studio gate
//        action:'list'                  → index of proposals (+ viewed flag)
//        action:'load'   {id}           → full proposal JSON for editing
//        action:'save'   {id?, proposal}→ create/update; returns {id, url}
//        action:'delete' {id}           → remove proposal + its view record
//
// Proposal JSON lives at proposals/{id}.json in the private wndr-proposals Blob
// store; a light index at proposals/_index.json powers the Studio list without
// N reads. View records live at views/{id}.json (see proposal-viewed.js).

const { blobPutJSON, blobGetJSON, blobList, blobDelete } = require('./_blob');

const INDEX_PATH = 'proposals/_index.json';
const SITE = 'https://www.wanderbywilson.com';

function noRobots(res) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
}

function cleanId(id) {
    return typeof id === 'string' && /^[a-z0-9-]{1,80}$/.test(id) ? id : null;
}

function slugify(s) {
    return (s || '')
        .toLowerCase()
        .replace(/<[^>]+>/g, '')
        .replace(/&[a-z#0-9]+;/g, ' ')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 48);
}

function randomSuffix() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

module.exports = async (req, res) => {
    noRobots(res);

    try {
        if (req.method === 'GET') {
            const id = cleanId((req.query && req.query.id) || '');
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            const doc = await blobGetJSON(`proposals/${id}.json`);
            if (!doc) return res.status(404).json({ error: 'Not found' });
            return res.status(200).json({ id, proposal: doc.proposal });
        }

        if (req.method !== 'POST') {
            res.setHeader('Allow', 'GET, POST');
            return res.status(405).json({ error: 'Method not allowed' });
        }

        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const expected = process.env.STUDIO_PASSCODE;
        if (!expected) return res.status(500).json({ error: 'STUDIO_PASSCODE not configured on the server' });
        if ((body.passcode || '').trim().toUpperCase() !== expected.trim().toUpperCase()) {
            return res.status(401).json({ error: 'Wrong passcode' });
        }

        const action = body.action || '';

        if (action === 'auth') {
            return res.status(200).json({ ok: true });
        }

        if (action === 'list') {
            const index = (await blobGetJSON(INDEX_PATH)) || {};
            const viewBlobs = await blobList('views/');
            const viewIds = viewBlobs
                .map(b => (b.pathname.match(/^views\/(.+)\.json$/) || [])[1])
                .filter(id => id && index[id]);
            const views = {};
            await Promise.all(viewIds.map(async (id) => {
                views[id] = await blobGetJSON(`views/${id}.json`).catch(() => null);
            }));
            const items = Object.entries(index)
                .map(([id, meta]) => ({
                    id, ...meta,
                    viewed: !!views[id],
                    views: views[id] ? views[id].count || 0 : 0,
                    firstViewedAt: views[id] ? views[id].firstViewedAt || null : null,
                    lastViewedAt: views[id] ? views[id].lastViewedAt || null : null,
                    url: `${SITE}/proposals/${id}`
                }))
                .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
            return res.status(200).json({ ok: true, proposals: items });
        }

        if (action === 'load') {
            const id = cleanId(body.id);
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            const doc = await blobGetJSON(`proposals/${id}.json`);
            if (!doc) return res.status(404).json({ error: 'Not found' });
            return res.status(200).json({ ok: true, id, proposal: doc.proposal });
        }

        if (action === 'save') {
            const proposal = body.proposal;
            if (!proposal || typeof proposal !== 'object' || !Array.isArray(proposal.hotels)) {
                return res.status(400).json({ error: 'Invalid proposal payload' });
            }
            let id = cleanId(body.id);
            if (!id) {
                const base = slugify(proposal.slugBase || proposal.preparedFor || proposal.title) || 'proposal';
                id = `${base}-${randomSuffix()}`;
            }
            delete proposal.slugBase;

            const now = new Date().toISOString();
            const existing = await blobGetJSON(`proposals/${id}.json`);
            await blobPutJSON(`proposals/${id}.json`, {
                proposal,
                createdAt: (existing && existing.createdAt) || now,
                updatedAt: now
            });

            const index = (await blobGetJSON(INDEX_PATH)) || {};
            index[id] = {
                title: (proposal.title || '').replace(/<[^>]+>/g, ''),
                preparedFor: proposal.preparedFor || '',
                dates: (proposal.dates || '').replace(/<[^>]+>/g, ''),
                hotelCount: proposal.hotels.length,
                updatedAt: now
            };
            await blobPutJSON(INDEX_PATH, index);

            return res.status(200).json({ ok: true, id, url: `${SITE}/proposals/${id}` });
        }

        if (action === 'delete') {
            const id = cleanId(body.id);
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            await blobDelete([`proposals/${id}.json`, `views/${id}.json`]);
            const index = (await blobGetJSON(INDEX_PATH)) || {};
            delete index[id];
            await blobPutJSON(INDEX_PATH, index);
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('proposals API error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
