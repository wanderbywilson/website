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
//     hotels   {days}               → hotel pages: how visits that land on them
//                                     arrive (channel, source / medium, per hotel),
//                                     which site pages lead to them, booking-button
//                                     clicks (cta_click) and inquiries (generate_lead)
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

// ── Hotel pages ───────────────────────────────────────────────────────────
// Hotel pages live at /hotels/{slug}; older links used /property.html?slug=…
// (now redirected, but still in GA history). GA4's landingPage / pagePath are
// path only, so the per-hotel queries use the …PlusQueryString versions to
// recover the slug from old property.html URLs.
function hotelSlugOf(path) {
    const s = String(path || '');
    let m = s.match(/^\/hotels\/([a-z0-9-]+)(?:\.html)?\/?(?:[?#]|$)/i);
    if (m) return m[1].toLowerCase();
    m = s.match(/^\/property(?:\.html)?\?(?:.*&)?slug=([a-z0-9-]+)/i);
    return m ? m[1].toLowerCase() : null;
}
const isHotelPath = (p) => /^\/hotels\/[^/?#]+/i.test(p || '') || /^\/property(\.html)?(\?|$)/i.test(p || '');
function hotelPageFilter(field) {
    return { orGroup: { expressions: [
        { filter: { fieldName: field, stringFilter: { matchType: 'BEGINS_WITH', value: '/hotels/' } } },
        { filter: { fieldName: field, stringFilter: { matchType: 'BEGINS_WITH', value: '/property' } } }
    ] } };
}
const eventIs = (name) => ({ filter: { fieldName: 'eventName', stringFilter: { matchType: 'EXACT', value: name } } });

// Where a visit started, in groups Wilson recognises.
function startGroup(landing) {
    const p = String(landing || '').replace(/\/$/, '') || '/';
    if (p === '/' || p === '/index.html') return 'home';
    if (p === '/hotels' || p === '/hotels.html') return 'directory';
    if (isHotelPath(p)) return 'hotel';
    if (p.startsWith('/post')) return 'blog';
    if (p === '/book' || p === '/book.html') return 'book';
    if (p.startsWith('/journey')) return 'journeys';
    if (p.startsWith('/inspiration')) return 'inspiration';
    return 'other';
}

async function hotelsReport(settings, days) {
    const ga = windows(days, 0);
    const out = { days, ranges: { analytics: ga.cur } };
    const LANDED = hotelPageFilter('landingPage');
    const VIEWED = hotelPageFilter('pagePath');

    // 1. Visits that started on a hotel page: channel, source / medium, per hotel.
    try {
        const [channels, sourceMedium, perHotel] = await Promise.all([
            ga4(settings, {
                dateRanges: [ga.cur, ga.prev],
                dimensions: [{ name: 'sessionDefaultChannelGroup' }],
                metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
                dimensionFilter: LANDED, limit: 50
            }),
            ga4(settings, {
                dateRanges: [ga.cur],
                dimensions: [{ name: 'sessionSourceMedium' }],
                metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
                dimensionFilter: LANDED,
                orderBys: [{ metric: { metricName: 'sessions' }, desc: true }], limit: 15
            }),
            ga4(settings, {
                dateRanges: [ga.cur],
                dimensions: [{ name: 'landingPagePlusQueryString' }, { name: 'sessionDefaultChannelGroup' }],
                metrics: [{ name: 'sessions' }, { name: 'engagedSessions' }],
                dimensionFilter: LANDED, limit: 5000
            })
        ]);
        const totals = { sessions: 0, sessionsPrev: 0, engaged: 0 };
        const ch = {};
        for (const r of channels) {
            if (r.dateRange === 'date_range_1') { totals.sessionsPrev += r.sessions; continue; }
            totals.sessions += r.sessions; totals.engaged += r.engagedSessions;
            const c = ch[r.sessionDefaultChannelGroup] || (ch[r.sessionDefaultChannelGroup] = { channel: r.sessionDefaultChannelGroup, sessions: 0, engaged: 0 });
            c.sessions += r.sessions; c.engaged += r.engagedSessions;
        }
        out.totals = totals;
        out.channels = Object.values(ch).sort((a, b) => b.sessions - a.sessions);
        out.sourceMedium = sourceMedium.map(r => ({ source: r.sessionSourceMedium, sessions: r.sessions, engaged: r.engagedSessions }));

        const hotels = {};
        for (const r of perHotel) {
            const slug = hotelSlugOf(r.landingPagePlusQueryString);
            if (!slug) continue;
            const h = hotels[slug] || (hotels[slug] = { slug, sessions: 0, engaged: 0, byChannel: {} });
            h.sessions += r.sessions; h.engaged += r.engagedSessions;
            h.byChannel[r.sessionDefaultChannelGroup] = (h.byChannel[r.sessionDefaultChannelGroup] || 0) + r.sessions;
        }
        Object.values(hotels).forEach(h => {
            const top = Object.entries(h.byChannel).sort((a, b) => b[1] - a[1])[0];
            h.topChannel = top ? top[0] : null;
            h.topChannelSessions = top ? top[1] : 0;
            delete h.byChannel;
        });
        out.hotels = hotels;
    } catch (e) {
        out.analyticsError = explain(e, settings);
        out.hotels = {};
    }

    if (!out.analyticsError) {
        // 2. Reached from inside the site: hotel page views, by where that visit
        //    started (landingPage) and by the page just before (pageReferrer).
        try {
            const [byStart, byReferrer] = await Promise.all([
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'landingPage' }, { name: 'pagePath' }],
                    metrics: [{ name: 'screenPageViews' }],
                    dimensionFilter: VIEWED, limit: 5000
                }),
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'pageReferrer' }],
                    metrics: [{ name: 'screenPageViews' }],
                    dimensionFilter: VIEWED,
                    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }], limit: 200
                })
            ]);
            const groups = {}, starts = {};
            for (const r of byStart) {
                // The landing view itself (and reloads of it) isn't an internal arrival.
                if (r.landingPage === r.pagePath) continue;
                const g = startGroup(r.landingPage);
                groups[g] = (groups[g] || 0) + r.screenPageViews;
                const s = starts[r.landingPage] || (starts[r.landingPage] = { page: r.landingPage, group: g, views: 0 });
                s.views += r.screenPageViews;
            }
            out.internalStarts = Object.entries(groups).map(([group, views]) => ({ group, views })).sort((a, b) => b.views - a.views);
            out.internalStartPages = Object.values(starts).sort((a, b) => b.views - a.views).slice(0, 15);

            const prev = {};
            for (const r of byReferrer) {
                let page = r.pageReferrer, internal = false;
                try {
                    const u = new URL(r.pageReferrer);
                    internal = /(^|\.)wanderbywilson\.com$/i.test(u.hostname);
                    page = internal ? (u.pathname.replace(/\/$/, '') || '/') : u.hostname.replace(/^www\./, '');
                } catch (e) { page = r.pageReferrer && r.pageReferrer !== '(not set)' ? r.pageReferrer : '(none: typed or bookmarked)'; }
                const k = (internal ? 'i:' : 'x:') + page;
                const p = prev[k] || (prev[k] = { page, internal, group: internal ? startGroup(page) : 'external', views: 0 });
                p.views += r.screenPageViews;
            }
            out.previousPages = Object.values(prev).sort((a, b) => b.views - a.views).slice(0, 15);
        } catch (e) { out.internalError = explain(e, settings); }

        // 3. Booking-button clicks (cta_click, sent by every hotel page) and
        //    inquiries sent (generate_lead) in visits that started on a hotel page.
        try {
            const [ctaByPage, leads] = await Promise.all([
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'pagePathPlusQueryString' }],
                    metrics: [{ name: 'eventCount' }],
                    dimensionFilter: { andGroup: { expressions: [eventIs('cta_click'), VIEWED] } }, limit: 5000
                }),
                ga4(settings, {
                    dateRanges: [ga.cur],
                    dimensions: [{ name: 'landingPagePlusQueryString' }],
                    metrics: [{ name: 'eventCount' }],
                    dimensionFilter: { andGroup: { expressions: [eventIs('generate_lead'), LANDED] } }, limit: 5000
                })
            ]);
            const cta = { clicks: 0, leads: 0 };
            for (const r of ctaByPage) {
                cta.clicks += r.eventCount;
                const slug = hotelSlugOf(r.pagePathPlusQueryString);
                if (!slug) continue;
                const h = out.hotels[slug] || (out.hotels[slug] = { slug, sessions: 0, engaged: 0, topChannel: null });
                h.ctaClicks = (h.ctaClicks || 0) + r.eventCount;
            }
            for (const r of leads) {
                cta.leads += r.eventCount;
                const slug = hotelSlugOf(r.landingPagePlusQueryString);
                if (!slug) continue;
                const h = out.hotels[slug] || (out.hotels[slug] = { slug, sessions: 0, engaged: 0, topChannel: null });
                h.leads = (h.leads || 0) + r.eventCount;
            }
            out.cta = cta;
        } catch (e) { out.ctaError = explain(e, settings); }

        // Which button and where on the page. cta_type / cta_location are event
        // parameters; GA4 only reports them once Wilson registers them as
        // EVENT-scoped custom dimensions (GA4 Admin → Custom definitions →
        // Create custom dimension, parameter names cta_type, cta_location, hotel).
        // Until then this query fails with a 400 and the tab says so.
        try {
            const rows = await ga4(settings, {
                dateRanges: [ga.cur],
                dimensions: [{ name: 'customEvent:cta_type' }, { name: 'customEvent:cta_location' }],
                metrics: [{ name: 'eventCount' }],
                dimensionFilter: { andGroup: { expressions: [eventIs('cta_click'), VIEWED] } },
                orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }], limit: 50
            });
            out.ctaBreakdown = rows.map(r => ({ type: r['customEvent:cta_type'], location: r['customEvent:cta_location'], clicks: r.eventCount }));
        } catch (e) {
            out.ctaBreakdown = null;
            out.ctaNeedsSetup = e.status === 400;
            if (!out.ctaNeedsSetup) out.ctaBreakdownError = explain(e, settings);
        }
    }

    out.hotels = Object.values(out.hotels).sort((a, b) => b.sessions - a.sessions || (b.ctaClicks || 0) - (a.ctaClicks || 0));
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
        if (action === 'hotels') {
            const data = await cached(`hotels-${days}`, !!body.refresh, () => hotelsReport(settings, days));
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
