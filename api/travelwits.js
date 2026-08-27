// /api/travelwits — turn a TravelWits share link into proposal hotels.
//
//   POST {passcode, link}  → {ok, trip:{...}, hotels:[...], warnings:[...]}
//
// Handles both link shapes: a /compare on smartflyer.travelwits.com and a
// /brochure on Wilson's own wanderbywilson.travelwits.com portal. Both pages
// are JavaScript apps, but each reads from one public JSON endpoint keyed only
// on the id, so we fetch server-side — no browser, no login. The alias must
// match the agency that owns the record, so candidates are tried in turn.
//
// What comes back is quote data, not story: room categories, rate plans,
// totals and cancellation terms. Descriptions, preferred-partner amenities and
// photos are NOT in the feed (the only description it carries is machine
// written, which the compliance rule forbids us from using), so those stay a
// research job. This endpoint exists to kill the retyping, not the writing.

const API = 'https://www.travelwitsapi.com';
const KINDS = ['compare', 'brochure'];   // both endpoints hold the same shape
const DEFAULT_AGENCY = 'smartflyer';

function noRobots(res) {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
}

// Accepts any TravelWits share link — a /compare or a /brochure, on the
// SmartFlyer site or on Wilson's own wanderbywilson.travelwits.com portal —
// or a bare uuid. The alias has to match the agency that owns the record
// (asking for a SmartFlyer compare as "wanderbywilson" returns a 500), so the
// candidates are ordered best-guess first and tried in turn.
function parseLink(link) {
    const s = String(link || '').trim();
    const id = (s.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i) || [])[0];
    if (!id) return null;

    const agencies = [];
    const add = (a) => {
        const v = String(a || '').toLowerCase();
        if (v && v !== 'compare' && v !== 'brochure' && !agencies.includes(v)) agencies.push(v);
    };
    add((s.match(/[?&]travelAgencyAliasName=([a-z0-9-]+)/i) || [])[1]);
    add((s.match(/travelwits\.com\/([a-z0-9-]+)/i) || [])[1]);   // /{agency}/compare
    add((s.match(/https?:\/\/([a-z0-9-]+)\.travelwits\.com/i) || [])[1]);  // agency subdomain
    add(DEFAULT_AGENCY);

    // Whichever kind the link names goes first; the other is the fallback.
    const named = /\/brochure\b/i.test(s) ? 'brochure' : (/\/compare\b/i.test(s) ? 'compare' : null);
    const kinds = named ? [named, ...KINDS.filter(k => k !== named)] : KINDS.slice();

    return { id: id.toLowerCase(), agencies, kinds };
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

// A room name has to name a room. Some rate loads prefix the string with the
// rate's inclusions instead — Jumby Bay's begins "Usd100 Spa Credit Per Suite -
// Vip Welcome Amenity…" and only reaches "Ocean Cottage" 480 characters in.
const ROOM_NOUN = /\b(suite|room|villa|pavilion|cottage|bungalow|casita|residence|studio|penthouse|cabana|chalet|lodge|tent|apartment|loft|house)\b/i;
// If any of these appear we are reading an inclusions blurb, not a room. The
// welcome-card wording matters most: the advisor's welcome note is meant to be
// a surprise and must never appear anywhere a client can read it.
const NOT_A_ROOM = /\b(credit|amenity|welcome|upgrad|tax|service charge|subject to|breakfast|lunch|dinner|beverage|cocktail|wine|champagne|water sports|fitness|croquet|tennis|party|excluded|complimentary|per (?:suite|room|night|person))\b/i;

function roomSegment(chunk) {
    const parts = String(chunk).split(/\s*-\s*/);
    const kept = [];
    for (const part of parts) {
        if (kept.length && SPEC.test(part.trim())) break;
        kept.push(part.trim());
        if (kept.join(' ').split(/\s+/).length >= 6) break;
    }
    let s = kept.join(' ');
    // Space-separated tails: "One Bedroom Ocean View Suite King Bed Ocean Views"
    s = s.replace(/\s+(?:king|queen|twin|double)\s+bed(?:s)?\b.*$/i, '');
    s = s.replace(/\s+(?:with|w\/)\s+.*$/i, '');
    s = s.replace(/[\s.,;:]+$/, '');
    return s.split(/\s+/).slice(0, 6).join(' ');
}

function roomName(raw) {
    const s = String(raw || '').replace(/\s+/g, ' ').trim();
    if (!s) return '';
    // Walk sentence-ish chunks and take the first that actually names a room.
    for (const chunk of s.split(/(?<=\.)\s+/)) {
        if (!chunk.trim()) continue;
        const candidate = roomSegment(chunk);
        if (candidate && ROOM_NOUN.test(candidate) && !NOT_A_ROOM.test(candidate)) {
            return titleCase(candidate);
        }
    }
    // Nothing named a room — better an empty box Wilson fills than an
    // inclusions blurb printed to a client as their room category.
    return '';
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
// Case varies by feed: "St Johns AG 00000" from a compare, "St johns ag" from
// a brochure. Only strip the trailing pair when it is this hotel's country code.
function cleanTown(s, code) {
    let t = String(s || '').trim();
    if (code) t = t.replace(new RegExp('\\b' + code + '\\b\\s*\\d{0,6}\\s*$', 'i'), '');
    return t.replace(/\b[A-Z]{2}\b\s*\d{0,6}\s*$/, '').trim();
}

function hotelLocation(hotel) {
    const code = String(hotel.country || '').trim();
    const country = COUNTRIES[hotel.country] || hotel.country || '';
    const town = cleanTown(hotel.city, code) || (() => {
        const parts = String(hotel.fullAddress || '').split(',').map(p => p.trim()).filter(Boolean);
        return parts.length >= 2 ? cleanTown(parts[parts.length - 2], code) : '';
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

// A compare keeps its hotels at compareTravelOptions.hotelOptions, and the
// top-level hotelOptions is an empty decoy. A brochure may nest them somewhere
// else again, so find the first non-empty hotelOptions array wherever it is and
// treat its parent as the trip container.
function findHotelOptions(payload, depth = 0) {
    const empty = { options: [], container: payload || {} };
    if (!payload || typeof payload !== 'object' || depth > 4) return empty;
    if (Array.isArray(payload.hotelOptions) && payload.hotelOptions.length) {
        return { options: payload.hotelOptions, container: payload };
    }
    if (depth === 0 && Array.isArray(payload.trips) && payload.trips.length) {
        const options = optionsFromBrochure(payload);
        if (options.length) {
            return {
                options,
                container: Object.assign({}, payload, {
                    roomSearchInput: (payload.trips[0] || {}).roomSearchInput
                })
            };
        }
    }
    for (const value of Object.values(payload)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const found = findHotelOptions(value, depth + 1);
            if (found.options.length) return found;
        }
    }
    return empty;
}

// A brochure is shaped differently from a compare: one "trip" per hotel option,
// each holding tripSegments[].itinerary, which is the same object a compare
// calls hotelItinerary. Reshape so one normalizer serves both.
function optionsFromBrochure(payload) {
    const options = [];
    (payload.trips || []).forEach((trip) => {
        (trip.tripSegments || []).forEach((seg) => {
            const it = seg && seg.itinerary;
            if (!it || !it.hotel) return;
            options.push({
                startDateTime: seg.startDateTime || trip.tripStartDate || '',
                endDateTime: seg.endDateTime || trip.tripEndDate || '',
                hotelItinerary: Object.assign({}, it, {
                    startDateTime: it.startDateTime || seg.startDateTime || trip.tripStartDate || '',
                    endDateTime: it.endDateTime || seg.endDateTime || trip.tripEndDate || ''
                })
            });
        });
    });
    return options;
}

function normalize(payload) {
    const found = findHotelOptions(payload);
    const options = found.options;
    // Trip-level fields can sit on the container or at the top of the payload.
    const compare = Object.assign({}, payload, found.container);
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
        if (!roomName(bed.formattedDesc || bed.desc)) {
            warnings.push(`${clean(hotel.name)}: the quote's room field is a rate-inclusions blurb, not a room name — add the room category by hand.`);
        }
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
        // nothing here a caller can point at another server. TravelWits 500s
        // rather than 404s when the kind or the agency is wrong, so walk the
        // candidates until one answers.
        let payload = null, lastStatus = 0;
        outer:
        for (const kind of link.kinds) {
            for (const agency of link.agencies) {
                const url = `${API}/${kind}/get?id=${encodeURIComponent(link.id)}` +
                            `&travelAgencyAliasName=${encodeURIComponent(agency)}`;
                let upstream;
                try {
                    upstream = await fetch(url, {
                        headers: { Accept: 'application/json' },
                        signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined
                    });
                } catch (e) { lastStatus = 504; continue; }
                if (!upstream.ok) { lastStatus = upstream.status; continue; }
                const text = await upstream.text();
                if (text.length > 8e6) {
                    return res.status(502).json({ error: 'That link is unexpectedly large — send it to Claude instead.' });
                }
                try { payload = JSON.parse(text); } catch (e) { lastStatus = 502; continue; }
                if (findHotelOptions(payload).options.length) break outer;
                payload = null;   // right shape, wrong record — keep looking
            }
        }

        if (!payload) {
            return res.status(502).json({
                error: lastStatus
                    ? `TravelWits had nothing for that link (${lastStatus}). Check it is still live, and that it is a compare or brochure link.`
                    : 'TravelWits had no hotels on that link.'
            });
        }

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
module.exports.findHotelOptions = findHotelOptions;
