// POST /api/proposal-viewed — first-open notification beacon.
//
// proposal.html fires this when a client opens a Studio-published proposal.
// First open → email Wilson via Brevo; every open bumps the count in
// views/{id}.json. Team browsers are excluded client-side (localStorage flag
// set by the Studio + ?preview=1 links never fire the beacon).

//
// GET ?o={client}&e={email}&l={link} — Email outreach link clicks (2026-11-02).
// Links in outreach emails point here; the click is counted in
// outreach-clicks/{client}.json and the visitor is sent on to the original
// link saved on that client's doc (never to a URL taken from the request).
// Lives in this file because the Vercel plan caps the number of functions.

const { blobPutJSON, blobGetJSON } = require('./_blob');
const { sendBrevoEmail } = require('./_brevo');
const { isBot, SITE } = require('./_outreach');

async function outreachClick(req, res) {
    const q = req.query || {};
    const id = /^[a-z0-9-]{1,120}$/.test(String(q.o || '')) ? String(q.o) : '';
    const step = Number(q.e), li = Number(q.l);
    let target = SITE;
    try {
        const doc = id ? await blobGetJSON(`content/outreach/${id}.json`) : null;
        const e = doc && Array.isArray(doc.emails) ? doc.emails[step] : null;
        const url = e && Array.isArray(e.links) ? e.links[li] : '';
        if (/^https?:\/\//i.test(url || '')) target = url;
        if (doc && url && req.method === 'GET' && !isBot(req.headers['user-agent'])) {
            const key = `outreach-clicks/${id}.json`;
            const c = (await blobGetJSON(key)) || { count: 0, links: {} };
            const now = new Date().toISOString();
            c.count = (c.count || 0) + 1;
            c.firstAt = c.firstAt || now;
            c.lastAt = now;
            const lk = `${step}:${li}`;
            c.links = c.links || {};
            c.links[lk] = { url, count: ((c.links[lk] || {}).count || 0) + 1 };
            await blobPutJSON(key, c);
        }
    } catch (err) {
        console.error('outreach click error:', err);
    }
    res.setHeader('Location', target);
    return res.status(302).end();
}

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    if ((req.method === 'GET' || req.method === 'HEAD') && req.query && req.query.o) return outreachClick(req, res);
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const id = typeof body.id === 'string' && /^[a-z0-9-]{1,80}$/.test(body.id) ? body.id : null;
        if (!id) return res.status(400).json({ error: 'Missing or invalid id' });

        // Only track proposals that actually exist (and grab the title for the email).
        const doc = await blobGetJSON(`proposals/${id}.json`);
        if (!doc) return res.status(200).json({ ok: true }); // static or unknown id — ignore quietly

        const now = new Date().toISOString();
        const views = await blobGetJSON(`views/${id}.json`);
        const isFirst = !views;

        await blobPutJSON(`views/${id}.json`, {
            count: (views ? views.count : 0) + 1,
            firstViewedAt: views ? views.firstViewedAt : now,
            lastViewedAt: now
        });

        if (isFirst && process.env.BREVO_API_KEY) {
            const title = ((doc.proposal && doc.proposal.title) || id).replace(/<[^>]+>/g, '');
            const preparedFor = (doc.proposal && doc.proposal.preparedFor) || '';
            const url = `https://www.wanderbywilson.com/proposals/${id}`;
            const html = `
                <div style="font-family: Georgia, serif; color: #1e3552; line-height: 1.6;">
                    <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #b08d4f;">Proposal opened</p>
                    <h2 style="font-weight: normal; margin: 0 0 12px;">${title}</h2>
                    ${preparedFor ? `<p style="margin: 0 0 12px;">Prepared for <strong>${preparedFor}</strong></p>` : ''}
                    <p style="margin: 0 0 12px;">Your proposal was just opened for the first time — a good moment for a follow-up.</p>
                    <p><a href="${url}" style="color: #1e3552;">${url}</a></p>
                </div>`;
            const result = await sendBrevoEmail({
                apiKey: process.env.BREVO_API_KEY,
                to: 'wilson@wanderbywilson.com',
                toName: 'Wilson Schubert',
                subject: `Proposal opened — ${preparedFor || title}`,
                html
            });
            if (!result.ok) console.error('Brevo viewed-notification failed (non-fatal):', result.error);
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        console.error('proposal-viewed error:', err);
        return res.status(200).json({ ok: true }); // never break the client page over analytics
    }
};
