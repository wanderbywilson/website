// /api/img — same-origin image proxy for the Studio's social composer.
// Canvas can't export slides if a hotel photo comes from the hotel's own
// domain (cross-origin taint), so external images are drawn through this
// endpoint instead. GET ?u=<https url>. Images only, cached a day.
module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
        const u = (req.query && req.query.u) || '';
        if (!/^https:\/\//i.test(u)) return res.status(400).send('Bad url');
        const r = await fetch(u, {
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (Wander by Wilson Studio image fetch)' }
        });
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.startsWith('image/')) return res.status(502).send('Not an image');
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 15 * 1024 * 1024) return res.status(502).send('Image too large');
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Access-Control-Allow-Origin', '*');
        return res.status(200).send(buf);
    } catch (e) {
        return res.status(502).send('Fetch failed');
    }
};
