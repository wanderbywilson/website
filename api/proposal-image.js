// /api/proposal-image — serves photos uploaded through the Studio's photo
// manager. They live in the private wndr-proposals Blob store (like the
// proposals themselves), so client pages read them through here.
//   GET ?k={key}   key = the filename returned by action:'uploadImage'
const { blobGetRaw } = require('./_blob');

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    try {
        const k = String((req.query && req.query.k) || '');
        if (!/^[a-z0-9-]{1,120}\.jpg$/.test(k)) return res.status(400).send('Bad key');
        const img = await blobGetRaw(`proposal-images/${k}`);
        if (!img || !img.type.startsWith('image/')) return res.status(404).send('Not found');
        res.setHeader('Content-Type', img.type);
        // Keys are unique and never overwritten, so they can cache for a long time.
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.status(200).send(img.buf);
    } catch (e) {
        return res.status(502).send('Fetch failed');
    }
};
