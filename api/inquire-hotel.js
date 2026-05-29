// POST /api/inquire-hotel — VIP hotel booking inquiry endpoint.
// Same pattern as inquire-trip but with hotel-specific labeling.

const { buildOwnerEmailHTML, sendBrevoEmail } = require('./_brevo');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'BREVO_API_KEY not configured on the server' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (e) {
      const params = new URLSearchParams(body);
      body = Object.fromEntries(params.entries());
    }
  }
  body = body || {};

  if (body._gotcha) {
    return res.status(200).json({ ok: true });
  }

  const clientName = [body.first_name, body.last_name].filter(Boolean).join(' ').trim();
  const clientEmail = (body.email || '').trim();
  if (!clientEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const html = buildOwnerEmailHTML({
    formType: 'hotel_booking',
    fields: body,
    clientName,
    clientEmail
  });

  const result = await sendBrevoEmail({
    apiKey,
    to: 'wilson@wanderbywilson.com',
    replyTo: { email: clientEmail, name: clientName || clientEmail },
    subject: `New VIP hotel booking inquiry — ${clientName || clientEmail}`,
    html
  });

  if (!result.ok) {
    console.error('Brevo send failed:', result.error);
    return res.status(502).json({ error: 'Failed to send. Please try again or email wilson@wanderbywilson.com directly.' });
  }

  return res.status(200).json({ ok: true });
};
