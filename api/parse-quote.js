// POST /api/parse-quote — Proposal Studio screenshot reader.
//
// The team drops a screenshot of a hotel quote (room, rate, deposit &
// cancellation terms) and this endpoint extracts the fields with Claude so
// nothing has to be retyped. Extraction is verbatim-only — the prompt forbids
// inventing or embellishing anything (compliance rule: proposal content must
// come from the actual quote / hotel materials).
//
// Body: { passcode, image: <base64>, mediaType: "image/png" | "image/jpeg" }
// Returns: { ok, fields: { room, rate, rateNote, deposit, cancellation, dates } }
//
// Requires ANTHROPIC_API_KEY on the Vercel project. No SDK — this repo has no
// package.json, so we speak raw HTTP to the Messages API.

const SCHEMA = {
    type: 'object',
    properties: {
        room: { type: 'string', description: 'The room category MARKETING NAME ONLY, e.g. "Prestige Suite Borgo" or "Oceanfront One Bedroom" — never the GDS spec dump ("1 Double Bed-50-70SQM-Minibar-..."). Empty string if not shown.' },
        roomDesc: { type: 'string', description: 'If the screenshot lists room features/size: one readable sentence with those exact features, e.g. "50–70 sqm with a living room, sofa, fireplace and desk; bath and/or shower; one extra bed possible (charges apply)." Facts verbatim, prose readable. Empty string otherwise.' },
        rate: { type: 'string', description: 'Final total + stay length ONLY, e.g. "$4,340.09 · 3-night total". Nothing else. Empty string if not shown.' },
        rateNote: { type: 'string', description: 'ONE short line: taxes/fees status, rate-plan name if any, property-currency total if shown, e.g. "Includes taxes & fees · property-currency total €3,815.00". NOT the amenities list. Empty string if not shown.' },
        perks: { type: 'array', items: { type: 'string' }, description: 'Included amenities as short elegant bullets, e.g. "Upgrade on arrival (subject to availability)", "Daily breakfast for up to two guests per bedroom", "$100 USD hotel credit toward wine tours, tastings & spa". NEVER include a personalized note/amenity from the agent or advisor (it is a surprise). Empty array if none.' },
        deposit: { type: 'string', description: 'Deposit terms decoded into plain English with exact terms, e.g. "Guarantee required — a credit card holds the reservation; nothing is charged at booking." Empty string if not shown.' },
        cancellation: { type: 'string', description: 'Cancellation policy decoded from GDS shorthand into plain English with the exact deadline and penalty, e.g. "Free cancellation until 6:00 PM hotel time on September 14, 2026; after that the full stay, including taxes and fees, is charged." Facts unchanged. Empty string if not shown.' },
        dates: { type: 'string', description: 'Stay dates as shown, e.g. "November 11 – 15, 2026". Empty string if not shown.' },
        flight: { type: 'string', description: 'ONLY for flight screenshots (e.g. Google Flights): a one-line summary, e.g. "DFW ⇄ Providenciales · American · 1 stop (MIA) · ≈6–7 hrs · from $795 pp round-trip". Empty string for hotel quotes.' },
        flightDetails: { type: 'string', description: 'ONLY for flight screenshots: the full itinerary in this exact multiline format (blank line between sections; NEVER include emissions/CO2 info):\n"Outbound · Wed, Nov 11\nAmerican · DFW 5:00 AM – AXA 2:57 PM\n7 hr 57 min · 1 stop · 1 hr 56 min layover in Miami (MIA)\n\nReturn · Sun, Nov 15\nAmerican · AXA 3:37 PM – DFW 9:50 PM\n8 hr 13 min · 1 stop · 1 hr 36 min layover in Miami (MIA)\n\nFares\nMain Cabin $1,526 pp · Main Plus $1,768 pp"\nInclude the exact layover duration and airport when shown. All values verbatim from the screenshot. Empty string for hotel quotes.' }
    },
    required: ['room', 'roomDesc', 'rate', 'rateNote', 'perks', 'deposit', 'cancellation', 'dates', 'flight', 'flightDetails'],
    additionalProperties: false
};

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const expected = process.env.STUDIO_PASSCODE;
        if (!expected || (body.passcode || '').trim().toUpperCase() !== expected.trim().toUpperCase()) {
            return res.status(401).json({ error: 'Wrong passcode' });
        }

        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(501).json({ error: 'Screenshot reading isn’t set up yet — add an ANTHROPIC_API_KEY to the Vercel project to enable it. You can still type the fields in manually.' });
        }

        const image = body.image;
        const mediaType = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(body.mediaType) ? body.mediaType : 'image/jpeg';
        if (!image || typeof image !== 'string' || image.length > 6_000_000) {
            return res.status(400).json({ error: 'Missing or oversized image' });
        }

        const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-5',
                max_tokens: 4096,
                output_config: { effort: 'low', format: { type: 'json_schema', schema: SCHEMA } },
                messages: [{
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: mediaType, data: image } },
                        { type: 'text', text: 'This is a screenshot for a luxury travel advisor — either a HOTEL rate quote (often GDS/Virtuoso system output) or a FLIGHT itinerary/pricing screenshot (e.g. Google Flights). Two rules: (1) every FACT — number, date, name, term, inclusion — must come from the screenshot exactly; never invent, estimate, or embellish. (2) The FORMATTING must be client-ready: decode GDS/system shorthand into clear, elegant English; change notation, never facts. Amenities go in the perks array, not the rate note. For hotel quotes leave the flight fields empty; for flight screenshots fill flight + flightDetails and leave hotel fields and perks empty. Empty string/array for anything not visible.' }
                    ]
                }]
            })
        });

        if (!apiRes.ok) {
            const errText = await apiRes.text();
            console.error('Anthropic API error:', apiRes.status, errText.slice(0, 500));
            return res.status(502).json({ error: 'Couldn’t read the screenshot — try again, or type the fields in manually.' });
        }

        const data = await apiRes.json();
        if (data.stop_reason === 'refusal' || !Array.isArray(data.content)) {
            return res.status(422).json({ error: 'Couldn’t read that screenshot — type the fields in manually.' });
        }
        const textBlock = data.content.find(b => b.type === 'text');
        let fields;
        try { fields = JSON.parse(textBlock.text); } catch (e) {
            return res.status(422).json({ error: 'Couldn’t read that screenshot — type the fields in manually.' });
        }

        return res.status(200).json({ ok: true, fields });
    } catch (err) {
        console.error('parse-quote error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
