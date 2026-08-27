// /api/travelwits — turn a TravelWits "compare" link into proposal hotels.
//
//   POST {passcode, link}  → {ok, trip:{...}, hotels:[...], warnings:[...]}
//
// The compare page at smartflyer.travelwits.com is a JavaScript app, but it
// reads from one public JSON endpoint keyed only on the compare id, so we can
// fetch it straight from the server — no browser, no login.
//
// What comes back is quote data, not story: room categories, rate plans,
// totals and cancellation terms. Descriptions, preferred-partner amenities and
// photos are NOT in the feed (the only description it carries is machine
// written, which the compliance rule forbids us from using), so those stay a
// research job. This endpoint exists to kill the retyping, not the writing.

const SOURCE = 'https://www.travelwitsapi.com/compare/get';
const DEFAULT_AGENCY = 'smartflyer';

function noRobots(res) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
}

// Accepts a full compare URL, or a bare uuid pasted on its own.
function parseLink(link) {
    const s = String(link || '').trim();
    const id = (s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
    if (!id) return null;
    let agency = DEFAULT_AGENCY;
    const fromPath = s.match(/travelwits\.com\/([a-z0-9-]+)\//i);
    const fromQuery = s.match(/[?&]travelAgencyAliasName=([a-z0-9-]+)/i);
    if (fromQuery) agency = fromQuery[1];
    else if (fromPath && fromPath[1] !== 'compare') agency = fromPath[1];
    return { id: id.toLowerCase(), agency: agency.toLowerCase() };
}

const titleCase = (s) => String(s || '').toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());

// Everything here is third-party feed text that a human may never read before
// it lands on a published page, and proposal.html writes these fields as HTML.
// Angle brackets are stripped rather than entity-escaped: entities would show
// up raw in the Studio's editor boxes, and no legitimate hotel field needs one.
function clean(s) {
    return String(s == null ? '' : s)
        .replace(/<[^>]*>/g, ' ')
        .replace(/[<>]/g, '')
        .replace(/[\x00-\x1f\x7f]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function money(n, currency) {
    if (typeof n !== 'number' || !isFinite(n)) return '';
    const whole = Math.round(n) === n;
    const body = n.toLocaleString('en-US', {
        minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2
    });
    return (currency && currency !== 'USD' ? currency + ' ' : '$') + body;
}

// Sabre room strings are spec dumps:
//   "Tranquility Pavilion-King-65 sq. m. -700Sqft Surrounded By Natural Vegetation"
//   "Ocean Cottage-1K-1Bath-Seaviews- Livingrm-Terrace-Free Wi-Fi -Ac-Maxocc2 …"
// The marketing name is the leading run of words before the specs start.
const SPEC = /^(?:\d|king|queen|twin|double|dbl|\d?k\b|\d?q\b|sgl|bath|max ?occ|sq\b|sqm|sqft|approx|free|wi-?fi|a\/?c\b|air ?con|livingrm|living ?room|terrace|balcony|minibar|mini-?bar|tv\b|dvd|cd\b|coffee|tub|shower|vanit|view|views|seaview|oceanview|non-?smoking|smoking|inclusive|bed|beds)/i;

function roomName(raw) {
    let s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    // Sabre delimits with hyphens; keep segments until the specs begin.
    const parts = s.split(/\s*-\s*/);
    const kept = [];
    for (const part of parts) {
        if (kept.length && SPEC.test(part.trim())) break;
        kept.push(part.trim());
        if (kept.join(' ').split(/\s+/).length >= 6) break;
    }
    s = kept.join(' ');
    // Space-separated tails: "One Bedroom Ocean View Suite King Bed Ocean Views"
    s = s.replace(/\s+(?:king|queen|twin|double)\s+bed(?:s)?\b.*$/i, '');
    s = s.replace(/\s+(?:with|w\/)\s+.*$/i, '');
    s = s.replace(/[\s.,;:]+$/, '');
    const words = s.split(/\s+/).slice(0, 6).join(' ');
    return titleCase(words);
}

// "PP ROOM RATE W BKFST" → "Preferred Partner rate with breakfast"
const PLANS = {
    'VIRTUOSO': 'Virtuoso rate',
    'VIRTUOSO PREFERRED RATE': 'Virtuoso Preferred Rate',
    'PP ROOM RATE W BKFST': 'Preferred Partner rate with breakfast',
    'PP ROOM RATE': 'Preferred Partner rate',
    'BELLINI CLUB': 'Bellini Club rate',
    'ROOM WITH BREAKFAST': 'Room with breakfast',
    'ROOM ONLY': 'Room only'
};
function ratePlan(category) {
    const key = String(category || '').trim().toUpperCase();
    if (!key) return '';
    if (PLANS[key]) return PLANS[key];
    return titleCase(key.replace(/\bW\b/g, 'with').replace(/\bBKFST\b/gi, 'breakfast'));
}

// Cancellation text arrives either as plain English or as a GDS ladder with
// <br/> between the tiers and a raw penalty code in brackets. Clients should
// see neither.
function cancellation(raw) {
    let s = String(raw || '').replace(/<br\s*\/?>/gi, '\n').replace(/\s+\n/g, '\n');
    if (!s.trim()) return '';
    s = s.replace(/\([0-9A-Z%\s]*(?:PCT|PRIOR|NIGHT|NGT|D\b)[0-9A-Z%\s]*\)/g, '');
    // "a fixed fee of 9525.00 USD fee" → "a fee of $9,525"
    s = s.replace(/a fixed fee of ([\d,]+(?:\.\d+)?)\s*([A-Z]{3})\s*fee/gi,
        (_, amt, cur) => 'a fee of ' + money(parseFloat(String(amt).replace(/,/g, '')), cur));
    const lines = s.split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
    const simple = lines.map(l => {
        const m = l.match(/made (\d+) days? prior to the check-?in date is refundable/i);
        return m ? `Free cancellation up to ${m[1]} days before arrival.` : l;
    });
    // A ladder reads best oldest-first; the feed sends the harshest tier first.
    const isLadder = simple.length > 1 && simple.every(l => /after \w+ \d+/i.test(l));
    let out = (isLadder ? simple.reverse() : simple).join(' ').replace(/\s+/g, ' ').trim();
    // Each tier repeats the local-time caveat; say it once, at the end.
    const CAVEAT = /\s*Times are based on the property'?s local time\.?/gi;
    if (CAVEAT.test(out)) {
        out = out.replace(CAVEAT, '').replace(/\s+/g, ' ').trim() +
            " Times are based on the property's local time.";
    }
    return out;
}

function deposit(product) {
    if (!product) return '';
    if (product.isPrepaidRate) return 'Prepaid rate — the full stay is charged at booking.';
    if (product.isPaymentRequired) {
        return 'A credit card holds the reservation; nothing is charged at booking.';
    }
    return '';
}

// The feed rarely fills city/state, but fullAddress is a postal string:
// "Long Island, Po Box 243, St Johns AG 00000, AG" → "St Johns, Antigua".
// Anything we cannot read cleanly is left for Wilson rather than guessed at.
// Plain characters throughout, not HTML entities: everything this endpoint
// returns lands in a Studio text input that Wilson reads and edits.
const COUNTRIES = { AG: 'Antigua', AI: 'Anguilla', TC: 'Turks & Caicos', BS: 'Bahamas',
    BB: 'Barbados', JM: 'Jamaica', MX: 'Mexico', DO: 'Dominican Republic', VG: 'British Virgin Islands',
    LC: 'St Lucia', VC: 'St Vincent', KN: 'St Kitts & Nevis', CW: 'Curaçao', AW: 'Aruba' };

// Both city and the address chunk trail the country code and postcode:
// "St Johns AG 00000" and even city itself as "St Johns AG".
const cleanTown = (s) => String(s || '').replace(/\b[A-Z]{2}\b\s*\d{0,6}\s*$/, '').trim();

function hotelLocation(hotel) {
    const country = COUNTRIES[hotel.country] || hotel.country || '';
    const town = cleanTown(hotel.city) || (() => {
        const parts = String(hotel.fullAddress || '').split(',').map(p => p.trim()).filter(Boolean);
        return parts.length >= 2 ? cleanTown(parts[parts.length - 2]) : '';
    })();
    return [town ? titleCase(town) : '', country].filter(Boolean).join(', ');
}

// The feed's one thumbnail per hotel is too small to publish, but it is handy
// in the builder. Only ever hand back a plain http(s) URL — never a javascript:
// or data: URI, which would end up in an src attribute on the client page.
function imageUrl(hotel) {
    const first = (hotel.images || [])[0];
    if (!first) return '';
    const raw = String(first.url || first).trim().replace(/^\/\//, 'https://');
    return /^https?:\/\/[^\s"'<>]+$/i.test(raw) ? raw : '';
}

function pickProduct(hotel, selectedCode) {
    const products = (hotel && hotel.products) || [];
    if (!products.length) return null;
    const chosen = selectedCode && products.find(p => p.code === selectedCode);
    return chosen || products[0];
}

function normalize(payload) {
    const compare = payload.compareTravelOptions || payload;
    const options = compare.hotelOptions || payload.hotelOptions || [];
    const warnings = [];
    const hotels = [];
    let start = '', end = '', nights = 0, adults = 0;

    const room = (compare.roomSearchInput || [])[0];
    if (room) adults = (room.adults || 0) + (room.seniors || 0);

    options.forEach((opt) => {
        const it = opt.hotelItinerary || {};
        const hotel = it.hotel || {};
        const product = pickProduct(hotel, it.selectedRoomCode);
        const price = (product && (product.roomPrice || product.convertedRoomPrice)) || {};
        const bed = (product && product.rooms && product.rooms[0]) || {};

        // Dates are per option in this feed — each stay carries its own
        // start/end and duration, and one compare can hold different stay
        // lengths. Never let the first hotel's length speak for the rest.
        const oStart = String(it.startDateTime || opt.startDateTime || '').slice(0, 10);
        const oEnd = String(it.endDateTime || opt.endDateTime || '').slice(0, 10);
        let oNights = (typeof it.duration === 'number' && it.duration > 0) ? it.duration : 0;
        if (!oNights && oStart && oEnd) {
            oNights = Math.round((new Date(oEnd) - new Date(oStart)) / 86400000);
        }
        if (!start && oStart) { start = oStart; end = oEnd; nights = oNights; }
        else if (oStart && (oStart !== start || oEnd !== end)) {
            warnings.push(`${clean(hotel.name)}: this stay runs ${oStart} to ${oEnd}, not the ${start} to ${end} on the others — the trip dates line only describes the first hotel.`);
        }

        const currency = price.currencyCode || 'USD';
        const total = price.markupPrice != null ? price.markupPrice : price.originalPrice;
        const plan = ratePlan(bed.category);
        const valueAdds = (product && product.valueAdds) || [];
        const alternates = ((hotel.products || []).length) - 1;
        if (alternates > 0) {
            warnings.push(`${clean(hotel.name)}: ${alternates} other rate plan${alternates > 1 ? 's' : ''} quoted — check you are showing the right one.`);
        }
        if (!bed.category) warnings.push(`${clean(hotel.name)}: no rate plan name on the quote.`);
        if (total == null) warnings.push(`${clean(hotel.name)}: no price on the quote — the rate line is empty.`);

        const noteBits = [];
        if (price.markupTaxesAndFees) noteBits.push('Includes taxes & fees');
        if (plan) noteBits.push(plan);
        if (valueAdds.length) noteBits.push(valueAdds.join(', '));

        hotels.push({
            name: clean(hotel.name),
            location: clean(hotelLocation(hotel)),
            address: clean(hotel.fullAddress),
            // chain names arrive as "Oetker Hotels(16551)"
            brand: clean(String(hotel.hotelChainName || hotel.brand || '').replace(/\s*\(\d+\)\s*$/, '')),
            starRating: hotel.starRating || null,
            allInclusive: !!hotel.isAllInclusive || valueAdds.some(v => /all.inclusive/i.test(v)),
            room: clean(roomName(bed.formattedDesc || bed.desc)),
            roomRaw: clean(bed.formattedDesc || bed.desc),
            beds: clean((bed.bedTypes || []).join(', ')),
            ratePlan: clean(plan),
            // The Studio's rate box uses *asterisks* for the gold italic figure.
            rate: total != null
                ? (oNights ? `*${money(total, currency)}* · ${oNights}-night total`
                           : `*${money(total, currency)}* total`)
                : '',
            rateNote: noteBits.join(' · '),
            total, nightly: price.markupAverageNightlyRate != null ? price.markupAverageNightlyRate : null,
            beforeTax: price.amountBeforeTax != null ? price.amountBeforeTax : null,
            taxesAndFees: price.markupTaxesAndFees != null ? price.markupTaxesAndFees : null,
            currency: clean(currency),
            valueAdds: valueAdds.map(clean).filter(Boolean),
            deposit: clean(deposit(product)),
            cancellation: clean(cancellation(product && product.cancellationPolicy)),
            image: imageUrl(hotel)
        });
    });

    if (!hotels.length) warnings.push('No hotels on this compare link.');

    return {
        trip: {
            createdFor: clean(compare.createdFor || payload.createdFor),
            start, end, nights, adults,
            id: clean(payload.id || compare.id)
        },
        hotels,
        warnings
    };
}

module.exports = async (req, res) => {
    noRobots(res);

    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const expected = process.env.STUDIO_PASSCODE;
        if (!expected) return res.status(500).json({ error: 'STUDIO_PASSCODE not configured on the server' });
        if ((body.passcode || '').trim().toUpperCase() !== expected.trim().toUpperCase()) {
            return res.status(401).json({ error: 'Wrong passcode' });
        }

        const link = parseLink(body.link);
        if (!link) {
            return res.status(400).json({ error: 'That does not look like a TravelWits compare link — paste the whole URL.' });
        }

        // The host is fixed and the id/agency are pattern-matched, so there is
        // nothing here a caller can point at another server.
        const url = `${SOURCE}?id=${encodeURIComponent(link.id)}&travelAgencyAliasName=${encodeURIComponent(link.agency)}`;
        const stop = AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined;
        const upstream = await fetch(url, { headers: { Accept: 'application/json' }, signal: stop });
        if (!upstream.ok) {
            return res.status(502).json({ error: `TravelWits returned ${upstream.status}. Check the link is still live.` });
        }
        const text = await upstream.text();
        if (text.length > 8e6) {
            return res.status(502).json({ error: 'That compare link is unexpectedly large — send it to Claude instead.' });
        }
        const payload = JSON.parse(text);

        return res.status(200).json({ ok: true, ...normalize(payload) });
    } catch (err) {
        console.error('travelwits error:', err);
        return res.status(500).json({ error: 'Could not read that compare link — try again in a moment.' });
    }
};

// exported for the offline parser tests
module.exports.normalize = normalize;
module.exports.roomName = roomName;
module.exports.cancellation = cancellation;
module.exports.parseLink = parseLink;
