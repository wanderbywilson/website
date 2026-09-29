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
// Sign-in: see _auth.js. Team members reach only the kinds for the areas
// Wilson ticked on the Team card (blog → blog, hoteldraft → hotels,
// social → social). Nobody can delete the Studio copy of a live post.
//
// Blog docs with `liveSlug` are posts already on the site (imported from
// blog-data by scripts/import-live-posts.js). Marking one "ready" makes the
// daily publish run update that live post in place at the same URL.
//
// Docs live at content/{kind}/{id}.json, index at content/{kind}/_index.json.
// Status flow for hoteldraft/blog: idea → draft|in-review → ready → published
// (the daily publish pipeline picks up "ready" and flips to "published").
// "idea" is the blog pipeline's backlog — a title with no copy written yet.

const { blobPutJSON, blobGetJSON, blobDelete, blobList } = require('./_blob');
const { whoIs, can } = require('./_auth');

const KINDS = ['social', 'hoteldraft', 'blog'];
const STATUSES = ['idea', 'draft', 'in-review', 'ready', 'published'];
// Fields a live post has that the Studio editor doesn't show (they came over
// from blog-data): kept on save so the next publish doesn't drop them.
const LIVE_FIELDS = ['date', 'datePublished', 'location', 'tripTypes'];

function cleanId(id) {
    return typeof id === 'string' && /^[a-z0-9-]{1,120}$/.test(id) ? id : null;
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

        const user = await whoIs(body.passcode);
        if (!user) return res.status(401).json({ error: 'Wrong passcode' });

        const kind = body.kind;
        if (!KINDS.includes(kind)) return res.status(400).json({ error: 'Unknown kind' });
        // Team members only reach the Studio areas Wilson gave them on the Team card.
        const AREA_OF = { blog: 'blog', hoteldraft: 'hotels', social: 'social' };
        if (!can(user, AREA_OF[kind])) return res.status(403).json({ error: 'You don’t have access to this part of the Studio' });
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
            // A live post's link to its URL is set by the publish run, never by
            // the editor: carry it over so a save can't re-slug a live page.
            if (existing && existing.liveSlug) {
                doc.liveSlug = existing.liveSlug;
                doc.liveUrl = existing.liveUrl;
                LIVE_FIELDS.forEach(f => { if (!(f in doc) && f in existing) doc[f] = existing[f]; });
            }
            doc.createdAt = (existing && existing.createdAt) || now;
            doc.updatedAt = now;
            doc.lastEditedBy = user.name;
            await blobPutJSON(path(id), doc);
            const index = (await blobGetJSON(INDEX)) || {};
            index[id] = Object.assign({}, body.meta || {}, {
                updatedAt: now,
                lastEditedBy: user.name,
                liveUrl: doc.liveUrl || ''
            });
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

        // Bulk import. One index write at the end — writing the index per item
        // races itself, because Blob reads lag writes by up to ~60s.
        // Author names fixed in bulk (a misspelled writer name across many
        // posts). Rewrites doc.author/lastEditedBy and the index; one index write.
        if (action === 'renameAuthor') {
            const from = (Array.isArray(body.from) ? body.from : []).map(String).filter(Boolean);
            const to = String(body.to || '').replace(/[<>]/g, '').trim().slice(0, 60);
            if (!from.length || !to) return res.status(400).json({ error: 'from[] and to required' });
            const index = (await blobGetJSON(INDEX)) || {};
            let changed = 0;
            for (const [id, meta] of Object.entries(index)) {
                if (!from.includes(meta.author) && !from.includes(meta.lastEditedBy)) continue;
                const doc = await blobGetJSON(path(id));
                if (doc) {
                    if (from.includes(doc.author)) doc.author = to;
                    if (from.includes(doc.lastEditedBy)) doc.lastEditedBy = to;
                    await blobPutJSON(path(id), doc);
                }
                if (from.includes(meta.author)) meta.author = to;
                if (from.includes(meta.lastEditedBy)) meta.lastEditedBy = to;
                changed++;
            }
            if (changed) await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, changed });
        }

        if (action === 'saveMany') {
            const items = Array.isArray(body.items) ? body.items : null;
            if (!items || !items.length) return res.status(400).json({ error: 'items[] required' });
            if (items.length > 200) return res.status(400).json({ error: 'Too many items in one call (max 200)' });
            const now = new Date().toISOString();
            const saved = [];
            for (const it of items) {
                const doc = it.doc;
                if (!doc || typeof doc !== 'object') continue;
                let id = cleanId(it.id);
                if (!id) {
                    const base = slugify(doc.slug || doc.name || doc.title) || kind;
                    id = kind === 'hoteldraft' ? base : `${base}-${randomSuffix()}`;
                }
                const existing = await blobGetJSON(path(id));
                doc.createdAt = (existing && existing.createdAt) || now;
                doc.updatedAt = now;
                await blobPutJSON(path(id), doc);
                saved.push({ id, meta: Object.assign({}, it.meta || {}, { updatedAt: now }) });
            }
            const index = (await blobGetJSON(INDEX)) || {};
            saved.forEach(s => { index[s.id] = s.meta; });
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, saved: saved.length, ids: saved.map(s => s.id) });
        }

        // Rebuild the index from the documents themselves — the recovery path
        // when concurrent writes have dropped entries.
        if (action === 'reindex') {
            const blobs = await blobList(`content/${kind}/`);
            const ids = blobs
                .map(b => (b.pathname.match(new RegExp(`^content/${kind}/(.+)\\.json$`)) || [])[1])
                .filter(id => id && id !== '_index');
            const index = {};
            for (const id of ids) {
                const doc = await blobGetJSON(path(id));
                if (!doc) continue;
                index[id] = {
                    title: doc.title || doc.name || id,
                    name: doc.name || '',
                    location: doc.location || '',
                    heroImage: doc.heroImage || '',
                    thumb: doc.thumb || '',
                    author: doc.author || '',
                    category: doc.category || '',
                    proposalId: doc.proposalId || '',
                    liveUrl: doc.liveUrl || '',
                    lastEditedBy: doc.lastEditedBy || '',
                    status: doc.status || 'draft',
                    updatedAt: doc.updatedAt || doc.createdAt || ''
                };
            }
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, indexed: ids.length });
        }

        if (action === 'delete') {
            const id = cleanId(body.id);
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            // Deleting the Studio copy of a live post wouldn't take it off the
            // site, just orphan it, so it's blocked for everyone.
            const doc = await blobGetJSON(path(id));
            if (doc && doc.liveSlug) return res.status(409).json({ error: 'This post is live on the site. Taking a live post down is Wilson’s call, so ask her.' });
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
