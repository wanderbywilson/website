// /api/studio-content — storage behind the Studio dashboard's non-proposal
// areas. Same Blob store + passcode gate as /api/proposals.
//
//   kinds:
//     social     — saved Instagram carousels ({fields, thumb, proposalId})
//     hoteldraft — hotel-page drafts awaiting Wilson's review
//                  ({name, location, heroImage, images, notes, entryJs, status})
//     destination — destination guides for lookbooks ({entry, status}); "ready" = approved
//     blog       — posts drafted in the Studio ({title, dek, heroImage,
//                  bodyHtml, tags, author, status})
//     outreach   — Email outreach clients (owner only; see _outreach.js).
//                  Listed from the docs themselves, not the index, plus:
//                  gmaildraft {id, step, doc} → save + put email in Gmail drafts
//                  gmailcheck  → drafts no longer in Gmail are marked sent
//                  getsettings / setsettings {settings} → signature
//
//   POST {passcode, action, kind, ...}:
//     list                       → index entries, newest first
//     load    {id}               → full doc
//     save    {id?, doc, meta}   → create/update; meta is what the index shows
//     setstatus {id, status}     → doc.status + index status
//     setstatusMany {ids[], status}
//                  A blog post only takes "published" once it has a liveUrl;
//                  otherwise it's saved as "ready" (see publishedOnlyIfLive).
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
const { loadSettings, hasGmail, gmailSaveDraft, gmailDraftExists } = require('./_google');
const { outreachMeta, buildMessage } = require('./_outreach');

const KINDS = ['social', 'hoteldraft', 'blog', 'destination', 'outreach'];
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
// A blog post is only "published" once the daily run has put it on the site
// and given it a liveUrl. Anything else asking for "published" is queued as
// "ready" instead, so a post can't sit in the Studio marked Published while
// it isn't on the site (2026-10-13: ~45 posts had been stuck that way).
function publishedOnlyIfLive(kind, doc) {
    if (kind === 'blog' && doc.status === 'published' && !doc.liveUrl && !doc.liveSlug) doc.status = 'ready';
}
function randomSuffix() {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

// The index entry for a document, rebuilt from the document itself.
function metaFromDoc(id, doc) {
    return {
        title: doc.title || doc.name || id,
        name: doc.name || '',
        location: doc.location || '',
        region: doc.region || '',
        heroImage: doc.heroImage || (doc.entry && doc.entry.heroImage) || '',
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

// ── Email outreach ────────────────────────────────────────────────────
const OUTREACH_SETTINGS = 'settings/outreach.json';

async function allOutreach(path) {
    const blobs = await blobList('content/outreach/');
    const ids = blobs
        .map(b => (b.pathname.match(/^content\/outreach\/([^/]+)\.json$/) || [])[1])
        .filter(id => id && !id.startsWith('_'));
    const docs = [];
    for (let i = 0; i < ids.length; i += 25) {
        const batch = ids.slice(i, i + 25);
        const got = await Promise.all(batch.map(id => blobGetJSON(path(id)).catch(() => null)));
        got.forEach((doc, j) => { if (doc) docs.push({ id: batch[j], doc }); });
    }
    return docs;
}

async function allClicks() {
    const blobs = await blobList('outreach-clicks/');
    const out = {};
    await Promise.all(blobs.map(async b => {
        const id = (b.pathname.match(/^outreach-clicks\/([^/]+)\.json$/) || [])[1];
        if (!id) return;
        const c = await blobGetJSON(b.pathname).catch(() => null);
        if (c) out[id] = c;
    }));
    return out;
}

// Returns a response when it handled the action, otherwise null (the shared
// load/save/saveMany/delete below then apply as for any kind).
async function outreachAction(action, body, user, res, path) {
    if (action === 'list') {
        const [docs, clicks, g] = await Promise.all([allOutreach(path), allClicks(), loadSettings().catch(() => null)]);
        const items = docs.map(({ id, doc }) => Object.assign(outreachMeta(id, doc), { clicks: clicks[id] || null }));
        return res.status(200).json({ ok: true, items, gmail: hasGmail(g), account: (g && g.account) || '' });
    }
    if (action === 'getsettings') {
        return res.status(200).json({ ok: true, settings: (await blobGetJSON(OUTREACH_SETTINGS)) || {} });
    }
    if (action === 'setsettings') {
        const st = body.settings || {};
        const settings = { signature: String(st.signature || '').slice(0, 20000), updatedAt: new Date().toISOString() };
        await blobPutJSON(OUTREACH_SETTINGS, settings);
        return res.status(200).json({ ok: true, settings });
    }
    if (action === 'gmaildraft') {
        const id = cleanId(body.id);
        const step = Number(body.step);
        const doc = body.doc;
        if (!id || !doc || typeof doc !== 'object' || !Array.isArray(doc.emails) || !(step >= 0 && step < doc.emails.length)) {
            return res.status(400).json({ error: 'Missing client or email' });
        }
        const g = await loadSettings();
        if (!hasGmail(g)) return res.status(409).json({ error: 'Connect Gmail first (button at the top of Email outreach).' });
        const settings = (await blobGetJSON(OUTREACH_SETTINGS)) || {};
        // The browser's copy is what Wilson just approved. The stored copy is
        // only used for the Gmail draft id, in case the browser lacks it.
        const stored = (await blobGetJSON(path(id))) || {};
        const e = doc.emails[step];
        const storedE = (stored.emails || [])[step] || {};
        let built;
        try { built = buildMessage(id, doc, step, settings.signature); }
        catch (err) { return res.status(400).json({ error: err.message }); }
        let saved;
        try { saved = await gmailSaveDraft(g, built.raw, e.gmailDraftId || storedE.gmailDraftId || ''); }
        catch (err) { return res.status(err.status || 502).json({ error: err.message }); }
        const now = new Date().toISOString();
        Object.assign(e, { body: built.body, status: 'in-gmail', gmailDraftId: saved.draftId, gmailMessageId: saved.messageId, links: built.links, approvedAt: now });
        delete e.sentAt;
        doc.createdAt = stored.createdAt || now;
        doc.updatedAt = now;
        doc.lastEditedBy = user.name;
        await blobPutJSON(path(id), doc);
        return res.status(200).json({ ok: true, id, doc, meta: outreachMeta(id, doc), account: g.account || '' });
    }
    if (action === 'gmailcheck') {
        const g = await loadSettings();
        if (!hasGmail(g)) return res.status(409).json({ error: 'Connect Gmail first.' });
        const docs = await allOutreach(path);
        const now = new Date().toISOString();
        const changed = [];
        for (const { id, doc } of docs) {
            let dirty = false;
            for (const e of (doc.emails || [])) {
                if (!e || e.status !== 'in-gmail' || !e.gmailDraftId) continue;
                if (!(await gmailDraftExists(g, e.gmailDraftId))) { e.status = 'sent'; e.sentAt = now; dirty = true; }
            }
            if (dirty) { doc.updatedAt = now; await blobPutJSON(path(id), doc); changed.push({ id, doc, meta: outreachMeta(id, doc) }); }
        }
        return res.status(200).json({ ok: true, changed });
    }
    return null;
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
        const AREA_OF = { blog: 'blog', hoteldraft: 'hotels', social: 'social', destination: 'proposals', outreach: 'proposals' };
        if (!can(user, AREA_OF[kind])) return res.status(403).json({ error: 'You don’t have access to this part of the Studio' });
        // Client emails go into Wilson's own Gmail, so outreach is hers alone.
        if (kind === 'outreach' && user.role !== 'owner') return res.status(403).json({ error: 'Email outreach is Wilson’s only' });
        const INDEX = `content/${kind}/_index.json`;
        const path = (id) => `content/${kind}/${id}.json`;
        const action = body.action || '';

        if (kind === 'outreach') {
            const handled = await outreachAction(action, body, user, res, path);
            if (handled) return handled;
        }

        if (action === 'list') {
            const index = (await blobGetJSON(INDEX)) || {};
            // Self-heal: Blob reads lag writes by up to ~60s, so back-to-back saves
            // can drop each other's index entries. Any draft whose document exists
            // but is missing from the index is added back here (2026-10-03).
            // The index file can read back stale for minutes, so for these small
            // lists every entry is checked against its own document (2026-10-03).
            if (kind === 'hoteldraft' || kind === 'destination') {
                const blobs = await blobList(`content/${kind}/`);
                const ids = blobs
                    .map(b => (b.pathname.match(new RegExp(`^content/${kind}/([^/]+)\\.json$`)) || [])[1])
                    .filter(id => id && !id.startsWith('_'));
                const docs = await Promise.all(ids.map(id => blobGetJSON(path(id)).catch(() => null)));
                let healed = 0;
                ids.forEach((id, i) => {
                    const doc = docs[i]; if (!doc) return;
                    const cur = index[id];
                    if (!cur || (doc.updatedAt || '') > (cur.updatedAt || '') || (doc.status && doc.status !== cur.status)) {
                        index[id] = Object.assign({}, cur || {}, metaFromDoc(id, doc));
                        healed++;
                    }
                });
                if (healed) await blobPutJSON(INDEX, index);
            }
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
                id = (kind === 'hoteldraft' || kind === 'destination') ? base : `${base}-${randomSuffix()}`;
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
            publishedOnlyIfLive(kind, doc);
            doc.createdAt = (existing && existing.createdAt) || now;
            doc.updatedAt = now;
            doc.lastEditedBy = user.name;
            await blobPutJSON(path(id), doc);
            const index = (await blobGetJSON(INDEX)) || {};
            index[id] = Object.assign({}, body.meta || {}, {
                updatedAt: now,
                lastEditedBy: user.name,
                liveUrl: doc.liveUrl || ''
            }, kind === 'blog' ? { status: doc.status } : {});
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, id, status: doc.status });
        }

        if (action === 'setstatus') {
            const id = cleanId(body.id);
            const status = body.status;
            if (!id) return res.status(400).json({ error: 'Missing or invalid id' });
            if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
            const doc = await blobGetJSON(path(id));
            if (!doc) return res.status(404).json({ error: 'Not found' });
            doc.status = status;
            publishedOnlyIfLive(kind, doc);
            doc.updatedAt = new Date().toISOString();
            await blobPutJSON(path(id), doc);
            const index = (await blobGetJSON(INDEX)) || {};
            if (index[id]) { index[id].status = doc.status; index[id].updatedAt = doc.updatedAt; await blobPutJSON(INDEX, index); }
            return res.status(200).json({ ok: true, id, status: doc.status });
        }

        // Several at once (the blog list's "Mark these ready"). One index
        // write at the end, because Blob reads lag writes by up to ~60s.
        if (action === 'setstatusMany') {
            const ids = (Array.isArray(body.ids) ? body.ids : []).map(cleanId).filter(Boolean);
            const status = body.status;
            if (!ids.length) return res.status(400).json({ error: 'ids[] required' });
            if (ids.length > 200) return res.status(400).json({ error: 'Too many items in one call (max 200)' });
            if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Unknown status' });
            const now = new Date().toISOString();
            const index = (await blobGetJSON(INDEX)) || {};
            const changed = [];
            for (const id of ids) {
                const doc = await blobGetJSON(path(id));
                if (!doc) continue;
                doc.status = status;
                publishedOnlyIfLive(kind, doc);
                doc.updatedAt = now;
                await blobPutJSON(path(id), doc);
                if (index[id]) { index[id].status = doc.status; index[id].updatedAt = now; }
                changed.push(id);
            }
            await blobPutJSON(INDEX, index);
            return res.status(200).json({ ok: true, changed: changed.length, ids: changed });
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
                    id = (kind === 'hoteldraft' || kind === 'destination') ? base : `${base}-${randomSuffix()}`;
                }
                const existing = await blobGetJSON(path(id));
                publishedOnlyIfLive(kind, doc);
                doc.createdAt = (existing && existing.createdAt) || now;
                doc.updatedAt = now;
                await blobPutJSON(path(id), doc);
                saved.push({ id, meta: Object.assign({}, it.meta || {}, { updatedAt: now }, kind === 'blog' ? { status: doc.status } : {}) });
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
                .filter(id => id && !id.startsWith('_'));
            const index = {};
            for (const id of ids) {
                const doc = await blobGetJSON(path(id));
                if (!doc) continue;
                index[id] = metaFromDoc(id, doc);
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
