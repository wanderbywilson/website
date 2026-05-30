// POST /api/inquire-cruise — receives the cruise-specific inquiry form,
// sends a branded email to Wilson via Brevo. Reply-To is set to the client
// so Wilson can hit reply and continue the conversation in their inbox.

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

  // Honeypot
  if (body._gotcha) {
    return res.status(200).json({ ok: true });
  }

  const clientName = [body.first_name, body.last_name].filter(Boolean).join(' ').trim();
  const clientEmail = (body.email || '').trim();
  if (!clientEmail) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  // Build branded HTML email. The shared _brevo helper renders any field
  // it receives, so the new cruise-specific fields will appear automatically.
  const html = buildOwnerEmailHTML({
    formType: 'cruise',
    fields: body,
    clientName,
    clientEmail
  });

  // Subject summarises the inquiry for at-a-glance triage in Wilson's inbox.
  const style = (body.cruise_style || '').trim();
  const region = (body.region || '').trim();
  const summary = [style, region].filter(Boolean).join(' · ');
  const subject = `New cruise inquiry — ${clientName || clientEmail}${summary ? ' · ' + summary : ''}`;

  const result = await sendBrevoEmail({
    apiKey,
    to: 'wilson@wanderbywilson.com',
    replyTo: { email: clientEmail, name: clientName || clientEmail },
    subject,
    html
  });

  if (!result.ok) {
    console.error('Brevo send failed:', result.error);
    return res.status(502).json({ error: 'Failed to send. Please try again or email wilson@wanderbywilson.com directly.' });
  }

  return res.status(200).json({ ok: true });
};
