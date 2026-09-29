// /api/stats — the Blog "Performance" tab. Reads Google Analytics 4 (views,
// readers, time on page, traffic sources) and Search Console (Google clicks,
// impressions, ranking, search queries) for /post/* pages.
//
//   POST {passcode, action}:
//     status                        → {connected, hasClient, account}
//     overview {days}               → totals, daily views, per-post table, sources,
//                                     site-wide Google searches, and which posts
//                                     lead to the inquiry pages (and sent inquiries)
//     post     {slug, days}         → one post: daily views, totals, top searches
//     setclient {clientId, clientSecret}   owner: step 1 of Sign in with Google
//     authurl                              owner: step 2, returns Google's consent URL
//     disconnect                           owner
//
// Anyone with the Performance area can read stats. Results are cached in Blob for a
// few hours so the tab is quick and Google's quotas stay untouched; pass
// {refresh:true} to skip the cache. Search Console runs ~3 days behind, so
// its window ends 3 days ago (same as in Search Console itself).

const { whoIs, can } = require('./_auth');
const { blobGetJSON, blobPutJSON } = require('./_blob');
const { loadSettings, clearSettings, isConnected, saveClient, authUrl, ga4, gsc } = require('./_google');

const SITE = 'https://www.wanderbywilson.com';
const CACHE_MS = 3 * 60 * 60 * 1000;
const GSC_LAG_DAYS = 3;
const POST_FILTER = { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/post/' } } };

function slugOf(path) {
    const m = String(path || '').match(/\/post\/([a-z0-9-]+)/);
    return m ? m[1] : null;
}

function isoDay(offsetDays) {
    const d = new Date(Date.now() - offsetDays * 86400000);
    return d.toISOString().slice(0, 10);
}

// Current and previous windows of equal length, for "vs previous period".
function windows(days, lag) {
    return {
        cur: { startDate: isoDay(lag + days - 1), endDate: isoDay(lag) },
        prev: { startDate: isoDay(lag + 2 * days - 1), endDate: isoDay(lag + days) }
    };
}

// Friendlier text for the two setup mistakes that will actually happen.
function explain(err, settings) {
    const who = (settings && (settings.account || settings.clientEmail)) || 'the connected Google account';
    if (err.status === 403 && /has not been used|is disabled|SERVICE_DISABLED/i.test(err.message)) {
        return /Analytics/.test(err.message)
            ? 'Turn on the “Google Analytics Data API” in Google Cloud (APIs & Services → Library), then refresh.'
            : 'Turn on the “Google Search Console API” in Google Cloud (APIs & Services → Library), then refresh.';
    }
    if (err.status === 403 && /Analytics/.test(err.message)) {
        return `${who} can’t see the Wander by Wilson Analytics property. Sign in with the Google account that owns it.`;
    }
    if (err.status === 403 && /Search Console/.test(err.message)) {
        return `${who} can’t see wanderbywilson.com in Search Console. Sign in with the Google account that owns it.`;
    }
    return err.message;
}

async function cached(key, refresh, build) {
    const path = `stats/cache/${key}.json`;
    if (!refresh) {
        const hit = await blobGetJSON(path);
        if (hit && hit.fetchedAt && Date.now() - Date.parse(hit.fetchedAt) < CACHE_MS) return hit;
    }
    const fresh = await build();
    fresh.fetchedAt = new Date().toISOString();
    await blobPutJSON(path, fresh);
    return fresh;
}

async function overview(settings, days) {
    const ga = windows(days, 0);
    const gs = windows(days, GSC_LAG_DAYS);
    const out = { days, ranges: { analytics: ga.cur, search: gs.cur } };

    try {
        const [byPost, daily, sources] = await Promise.all([
            ga4(settings, {
                dateRanges: [ga.cur, ga.prev],
                dimensions: [{ name: 'pagePath' }],
                metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'userEngagementDuration' }],
                dimensionFilter: POST_FILTER, limit: 1000
            }),
            ga4(settings, {
                dateRanges: [ga.cur],
                dimensions: [{ name: 'date' }],
                metrics: [{ name: 'screenPageViews' }],
                dimensionFilter: POST_FILTER,
                orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400
            }),
            ga4(settings, {
                dateRanges: [ga.cur],
                dimensions: [{ name: 'sessionDefaultChannelGroup' }],
                metrics: [{ name: 'screenPageViews' }],
                dimensionFilter: POST_FILTER, limit: 12
            })
        ]);
        const posts = {};
        const totals = { views: 0, viewsPrev: 0, readers: 0, readersPrev: 0 };
        for (const r of byPost) {
            const slug = slugOf(r.pagePath);
            if (!slug) continue;
            const p = posts[slug] || (posts[slug] = { slug, views: 0, viewsPrev: 0, readers: 0, engagement: 0 });
            if (r.dateRange === 'date_range_1') { p.viewsPrev += r.screenPageViews; totals.viewsPrev += r.screenPageViews; totals.readersPrev += r.activeUsers; }
            else { p.views += r.screenPageViews; p.readers += r.activeUsers; p.engagement += r.userEngagementDuration; totals.views += r.screenPageViews; totals.readers += r.activeUsers; }
        }
        Object.values(posts).forEach(p => {
            p.avgTime = p.readers ? Math.round(p.engagement / p.readers) : 0;
            delete p.engagement;
        });
        out.posts = posts;
        out.totals = totals;
        out.daily = daily.map(r => ({ date: `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`, views: r.screenPageViews }));
        out.sources = sources.map(r => ({ channel: r.sessionDefaultChannelGroup, views: r.screenPageViews }))
            .sort((a, b) => b.views - a.views);
    } catch (e) {
        out.analyticsError = explain(e, settings);
        out.posts = {};
    }

    // Inquiry pages reached (and inquiries sent, via the forms' generate_lead
    // event) in sessions that started on each post.
    if (!out.analyticsError) {
        try {
            const [visits, leads] = await Promise.all([
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'landingPage' }],
                    metrics: [{ name: 'sessions' }],
                    dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/inquire' } } },
                    limit: 1000
                }),
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'landingPage' }],
                    metrics: [{ name: 'eventCount' }],
                    dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: 'generate_lead' } } },
                    limit: 1000
                })
            ]);
            const inq = { visitsFromPosts: 0, visitsAll: 0, leadsFromPosts: 0, leadsAll: 0 };
            for (const r of visits) {
                inq.visitsAll += r.sessions;
                const slug = slugOf(r.landingPage);
                if (!slug) continue;
                const p = out.posts[slug] || (out.posts[slug] = { slug, views: 0, viewsPrev: 0, readers: 0, avgTime: 0 });
                p.inquiryVisits = (p.inquiryVisits || 0) + r.sessions;
                inq.visitsFromPosts += r.sessions;
            }
            for (const r of leads) {
                inq.leadsAll += r.eventCount;
                const slug = slugOf(r.landingPage);
                if (!slug) continue;
                const p = out.posts[slug] || (out.posts[slug] = { slug, views: 0, viewsPrev: 0, readers: 0, avgTime: 0 });
                p.leads = (p.leads || 0) + r.eventCount;
                inq.leadsFromPosts += r.eventCount;
            }
            out.inquiries = inq;
        } catch (e) { out.inquiryError = explain(e, settings); }
    }

    try {
        const pageFilter = { dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'contains', expression: '/post/' }] }] };
        const [cur, prev] = await Promise.all([
            gsc(settings, Object.assign({ startDate: gs.cur.startDate, endDate: gs.cur.endDate, dimensions: ['page'], rowLimit: 1000 }, pageFilter)),
            gsc(settings, Object.assign({ startDate: gs.prev.startDate, endDate: gs.prev.endDate, dimensions: ['page'], rowLimit: 1000 }, pageFilter))
        ]);
        const search = { clicks: 0, clicksPrev: 0, impressions: 0, impressionsPrev: 0 };
        let posW = 0;
        for (const r of cur) {
            const slug = slugOf(r.keys[0]);
            if (!slug) continue;
            const p = out.posts[slug] || (out.posts[slug] = { slug, views: 0, viewsPrev: 0, readers: 0, avgTime: 0 });
            p.clicks = (p.clicks || 0) + r.clicks;
            p.impressions = (p.impressions || 0) + r.impressions;
            p.position = Math.round(r.position * 10) / 10;
            search.clicks += r.clicks; search.impressions += r.impressions; posW += r.position * r.impressions;
        }
        for (const r of prev) {
            const slug = slugOf(r.keys[0]);
            if (!slug) continue;
            search.clicksPrev += r.clicks; search.impressionsPrev += r.impressions;
            if (out.posts[slug]) out.posts[slug].clicksPrev = (out.posts[slug].clicksPrev || 0) + r.clicks;
        }
        search.position = search.impressions ? Math.round(posW / search.impressions * 10) / 10 : null;
        out.search = search;

        // What people type into Google to find the site — every page, not just posts.
        const q = await gsc(settings, { startDate: gs.cur.startDate, endDate: gs.cur.endDate, dimensions: ['query'], rowLimit: 50 });
        out.siteQueries = q.map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10 }));
    } catch (e) {
        out.searchError = explain(e, settings);
    }

    out.posts = Object.values(out.posts).sort((a, b) => b.views - a.views);
    return out;
}

async function postDetail(settings, slug, days) {
    const ga = windows(days, 0);
    const gs = windows(days, GSC_LAG_DAYS);
    const out = { slug, days, ranges: { analytics: ga.cur, search: gs.cur } };
    const pathRe = `^/post/${slug}/?(\\?.*)?$`;
    try {
        const daily = await ga4(settings, {
            dateRanges: [ga.cur],
            dimensions: [{ name: 'date' }],
            metrics: [{ name: 'screenPageViews' }, { name: 'activeUsers' }, { name: 'userEngagementDuration' }],
            dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'FULL_REGEXP', value: pathRe } } },
            orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400
        });
        out.daily = daily.map(r => ({ date: `${r.date.slice(0, 4)}-${r.date.slice(4, 6)}-${r.date.slice(6, 8)}`, views: r.screenPageViews }));
        const readers = daily.reduce((n, r) => n + r.activeUsers, 0);
        out.totals = {
            views: daily.reduce((n, r) => n + r.screenPageViews, 0),
            readers,
            avgTime: readers ? Math.round(daily.reduce((n, r) => n + r.userEngagementDuration, 0) / readers) : 0
        };
    } catch (e) { out.analyticsError = explain(e, settings); }
    try {
        const rows = await gsc(settings, {
            startDate: gs.cur.startDate, endDate: gs.cur.endDate, dimensions: ['query'], rowLimit: 25,
            dimensionFilterGroups: [{ filters: [{ dimension: 'page', operator: 'equals', expression: `${SITE}/post/${slug}` }] }]
        });
        out.queries = rows.map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: Math.round(r.position * 10) / 10 }));
    } catch (e) { out.searchError = explain(e, settings); }
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
        if (!can(user, 'performance')) return res.status(403).json({ error: 'You don’t have access to Performance' });
        const action = body.action || '';

        if (['setclient', 'authurl', 'disconnect'].includes(action)) {
            if (user.role !== 'owner') return res.status(403).json({ error: 'Only Wilson can connect Google' });
            try {
                if (action === 'disconnect') { await clearSettings(); return res.status(200).json({ ok: true, connected: false }); }
                if (action === 'setclient') { await saveClient(body.clientId, body.clientSecret); return res.status(200).json({ ok: true, hasClient: true }); }
                return res.status(200).json({ ok: true, url: await authUrl() });
            } catch (e) { return res.status(400).json({ error: e.message }); }
        }

        const settings = await loadSettings();
        const notConnected = { ok: true, connected: false, hasClient: !!(settings && settings.clientId) };
        if (action === 'status') {
            return res.status(200).json(isConnected(settings)
                ? { ok: true, connected: true, hasClient: true, account: settings.account || settings.clientEmail || '' }
                : notConnected);
        }
        if (!isConnected(settings)) return res.status(200).json(notConnected);

        const days = [7, 28, 90].includes(Number(body.days)) ? Number(body.days) : 28;
        if (action === 'overview') {
            const data = await cached(`overview-${days}`, !!body.refresh, () => overview(settings, days));
            return res.status(200).json(Object.assign({ ok: true, connected: true, account: settings.account || '' }, data));
        }
        if (action === 'post') {
            const slug = typeof body.slug === 'string' && /^[a-z0-9-]{1,120}$/.test(body.slug) ? body.slug : null;
            if (!slug) return res.status(400).json({ error: 'Missing or invalid slug' });
            const data = await cached(`post-${slug}-${days}`, !!body.refresh, () => postDetail(settings, slug, days));
            return res.status(200).json(Object.assign({ ok: true, connected: true }, data));
        }
        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('stats API error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
