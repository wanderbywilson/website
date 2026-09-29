// /api/google-oauth — where Google sends Wilson back after "Sign in with
// Google" on the Studio's Performance page. Stores the read-only refresh
// token (see _google.js), then returns her to the Performance page.

const { finishAuth } = require('./_google');

function back(res, status, message) {
    const q = new URLSearchParams({ view: 'performance', google: status });
    if (message) q.set('msg', message.slice(0, 300));
    res.setHeader('Location', '/studio?' + q);
    return res.status(302).end();
}

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    const q = req.query || {};
    if (q.error) return back(res, 'error', q.error === 'access_denied' ? 'Google access wasn’t approved.' : String(q.error));
    if (!q.code || !q.state) return back(res, 'error', 'Google didn’t send a sign-in code back.');
    try {
        await finishAuth(String(q.code), String(q.state));
        return back(res, 'connected');
    } catch (err) {
        console.error('google-oauth error:', err);
        return back(res, 'error', err.message);
    }
};
