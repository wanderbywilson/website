// POST /api/studio-ai — Proposal Studio writing assistant.
//
// Writes TRIP-LEVEL copy only (titles, intro lines, closing lines, date
// lines) in the Wander by Wilson voice. It is explicitly forbidden from
// writing or embellishing hotel/property descriptions, amenities, rates, or
// policies — those must be pasted verbatim from official sources (see the
// compliance rule in SITE-NOTES §12).
//
// Body: { passcode, request, proposal }  →  { ok, text }
// Requires ANTHROPIC_API_KEY. Raw HTTP — this repo has no package.json.

const SYSTEM = `You are the in-house copywriter for Wander by Wilson, a luxury travel advisory founded by Wilson Schubert (SmartFlyer, Virtuoso). You write short, elegant, trip-level copy for private client proposal pages: proposal titles, intro lines (ledes), closing lines, and date lines.

Voice: warm, editorial, understated luxury. Serif-magazine energy — think Condé Nast Traveler, not a booking engine. Em dashes welcome. No exclamation marks, no "dream vacation" clichés, no emoji. Titles are short (2–6 words) and may wrap exactly ONE word in *asterisks* — it renders as gold italic (e.g. "Your Italian *summer.*"). Titles usually end with a period. Intros are 1–3 sentences. Closings are warm and low-pressure, inviting a reply.

HARD RULES:
- You write trip-level copy ONLY. If asked to write or "improve" a hotel/property description, room description, amenity list, rate, or policy text, decline in one friendly sentence and remind them that hotel copy must be pasted verbatim from the hotel's website or its Virtuoso page (compliance).
- Never invent factual claims (hotel features, awards, distances, inclusions). Trip-level copy sets mood; facts live elsewhere on the page.
- Return ONLY the requested copy — no preamble, no quotation marks around it, no options list unless the user asks for options.`;

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
            return res.status(501).json({ error: 'AI writing isn’t set up yet — add an ANTHROPIC_API_KEY to the Vercel project to enable it.' });
        }
        const request = (body.request || '').toString().slice(0, 2000);
        if (!request.trim()) return res.status(400).json({ error: 'Ask me something first.' });

        // Compact context: what's on the proposal so the copy fits the trip.
        const p = body.proposal || {};
        const strip = (s) => (s || '').toString().replace(/<[^>]+>/g, '');
        const context = [
            p.preparedFor ? `Prepared for: ${strip(p.preparedFor)}` : '',
            p.title ? `Current title: ${strip(p.title)}` : '',
            p.dates ? `Dates: ${strip(p.dates)}` : '',
            Array.isArray(p.hotels) && p.hotels.length
                ? 'Hotels: ' + p.hotels.map(h => strip(h.name || h.slug || '')).filter(Boolean).join('; ')
                : ''
        ].filter(Boolean).join('\n');

        const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-opus-5',
                max_tokens: 2048,
                system: SYSTEM,
                messages: [{
                    role: 'user',
                    content: `Proposal context:\n${context || '(new, empty proposal)'}\n\nRequest: ${request}`
                }]
            })
        });

        if (!apiRes.ok) {
            const errText = await apiRes.text();
            console.error('Anthropic API error:', apiRes.status, errText.slice(0, 500));
            return res.status(502).json({ error: 'The AI didn’t answer — try again in a moment.' });
        }
        const data = await apiRes.json();
        if (data.stop_reason === 'refusal' || !Array.isArray(data.content)) {
            return res.status(422).json({ error: 'The AI declined that request.' });
        }
        const text = (data.content.find(b => b.type === 'text') || {}).text || '';
        return res.status(200).json({ ok: true, text: text.trim().replace(/^["“]|["”]$/g, '') });
    } catch (err) {
        console.error('studio-ai error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
