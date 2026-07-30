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
        room: { type: 'string', description: 'Room or suite category name exactly as written, e.g. "Oceanfront One Bedroom". Empty string if not shown.' },
        rate: { type: 'string', description: 'The quoted price with currency symbol and what it covers, concisely, e.g. "$8,128 · 4-night total". Use the exact number shown; drop trailing .00. Empty string if not shown.' },
        rateNote: { type: 'string', description: 'What the rate includes and the rate-plan name, verbatim facts only, e.g. "Includes room, taxes, service charge & facility fee · Beach Escape rate with daily breakfast". Empty string if not shown.' },
        deposit: { type: 'string', description: 'Deposit terms exactly as stated, e.g. "50% of the stay charged at booking." Empty string if not shown.' },
        cancellation: { type: 'string', description: 'Cancellation policy exactly as stated. Empty string if not shown.' },
        dates: { type: 'string', description: 'Stay dates as shown, e.g. "November 11 – 15, 2026". Empty string if not shown.' }
    },
    required: ['room', 'rate', 'rateNote', 'deposit', 'cancellation', 'dates'],
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
                        { type: 'text', text: 'This is a screenshot of a hotel rate quote for a travel advisor. Extract the fields exactly as written in the screenshot — copy values verbatim, never invent, estimate, or embellish anything. If a field is not visible in the screenshot, return an empty string for it.' }
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
