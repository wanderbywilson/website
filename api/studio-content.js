// /api/studio-content — storage behind the Studio dashboard's non-proposal
// areas. Same Blob store + passcode gate as /api/proposals.
//
//   kinds:
//     social     — saved Instagram carousels ({fields, thumb, proposalId})
//     hoteldraft — hotel-page drafts awaiting Wilson's review
//                  ({name, location, heroImage, images, notes, entryJs, status})
//     blog       — posts drafted in the Studio ({title, dek, heroImage,
//                  bodyHtml, tags, author, status})
//
//   POST {passcode, action, kind, ...}:
//     list                       → index entries, newest first
//     load    {id}               → full doc
//     save    {id?, doc, meta}   → create/update; meta is what the index shows
//     setstatus {id, status}     → doc.status + index status
//     delete  {id}
//
// Docs live at content/{kind}/{id}.json, index at content/{kind}/_index.json.
// Status flow for hoteldraft/blog: idea → draft|in-review → ready → published
// (the daily publish pipeline picks up "ready" and flips to "published").
// "idea" is the blog pipeline's backlog — a title with no copy written yet.

const { blobPutJSON, blobGetJSON, blobDelete } = require('./_blob');

const KINDS = ['social', 'hoteldraft', 'blog'];
const STATUSES = ['idea', 'draft', 'in-review', 'ready', 'published'];

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
        .slice(0, 60);
}
function randomSuffix() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ error: 'Method not allowed' });
        }
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const expected = process.env.STUDIO_PASSCODE;
        if (!expected) return res.status(500).json({ error: 'STUDIO_PASSCODE not configured' });
        if ((body.passcode || '').trim().toUpperCase() !== expected.trim().toUpperCase()) {
            return res.status(401).json({ error: 'Wrong passcode' });
        }

        const kind = body.kind;
        if (!KINDS.includes(kind)) return res.status(400).json({ error: 'Unknown kind' });
        const INDEX = `content/${kind}/_index.json`;
        const path = (id) => `content/${kind}/${id}.json`;
        const action = body.action || '';

        if (action === 'list') {
            const index = (await blobGetJSON(INDEX)) || {};
            const items = Object.entries(index)
                .map(([id, meta]) => ({ id, ...meta }))
                .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
            return res.status(200).json({ ok: true, items });
        }

        if (action === 'load') {
            const id = cleanId(body.id);
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            const doc = await blobGetJSON(path(id));
            if (!doc) return res.status(404).json({ error: 'Not found' });
            return res.status(200).json({ ok: true, id, doc });
        }

        if (action === 'save') {
            const doc = body.doc;
            if (!doc || typeof doc !== 'object') return res.status(400).json({ error: 'Invalid doc' });
            let id = cleanId(body.id);
            if (!id) {
                const base = slugify(doc.slug || doc.name || doc.title) || kind;
                id = kind === 'hoteldraft' ? base : `${base}-${randomSuffix()}`;
            }
            const now = new Date().toISOString();
            const existing = await blobGetJSON(path(id));
            doc.createdAt = (existing && existing.createdAt) || now;
            doc.updatedAt = now;
            await blobPutJSON(path(id), doc);
            const index = (await blobGetJSON(INDEX)) || {};
            index[id] = Object.assign({}, body.meta || {}, { updatedAt: now });
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, id });
        }

        if (action === 'setstatus') {
            const id = cleanId(body.id);
            const status = body.status;
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
            const doc = await blobGetJSON(path(id));
            if (!doc) return res.status(404).json({ error: 'Not found' });
            doc.status = status;
            doc.updatedAt = new Date().toISOString();
            await blobPutJSON(path(id), doc);
            const index = (await blobGetJSON(INDEX)) || {};
            if (index[id]) { index[id].status = status; index[id].updatedAt = doc.updatedAt; await blobPutJSON(INDEX, index); }
            return res.status(200).json({ ok: true, id, status });
        }

        if (action === 'delete') {
            const id = cleanId(body.id);
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            await blobDelete([path(id)]);
            const index = (await blobGetJSON(INDEX)) || {};
            delete index[id];
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('studio-content API error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
