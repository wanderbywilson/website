// POST /api/inquire-cruise — receives the cruise-specific inquiry form,
// sends a branded email to Wilson via Brevo. Reply-To is set to the client
// so Wilson can hit reply and continue the conversation in their inbox.

const { buildOwnerEmailHTML, buildClientReceiptHTML, sendBrevoEmail } = require('./_brevo');
const { createEnquiryTask } = require('./_asana');

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

  // Build both emails up front. The shared _brevo helper renders any field
  // it receives, so the cruise-specific fields appear automatically.
  const ownerHtml = buildOwnerEmailHTML({
    formType: 'cruise',
    fields: body,
    clientName,
    clientEmail
  });
  const clientHtml = buildClientReceiptHTML({
    formType: 'cruise',
    fields: body,
    clientName
  });

  // Subject summarises the inquiry for at-a-glance triage in Wilson's inbox.
  const style = (body.cruise_style || '').trim();
  const region = (body.region || '').trim();
  const summary = [style, region].filter(Boolean).join(' · ');
  const ownerSubject = `New cruise inquiry — ${clientName || clientEmail}${summary ? ' · ' + summary : ''}`;

  // 1) Notify Wilson (critical)
  const ownerResult = await sendBrevoEmail({
    apiKey,
    to: 'wilson@wanderbywilson.com',
    replyTo: { email: clientEmail, name: clientName || clientEmail },
    subject: ownerSubject,
    html: ownerHtml
  });

  if (!ownerResult.ok) {
    console.error('Brevo owner send failed:', ownerResult.error);
    return res.status(502).json({ error: 'Failed to send. Please try again or email wilson@wanderbywilson.com directly.' });
  }

  // 2) Client receipt (non-fatal)
  const clientResult = await sendBrevoEmail({
    apiKey,
    to: clientEmail,
    toName: clientName || clientEmail,
    sender: { name: 'Wilson Schubert · Wander by Wilson', email: 'forms@wanderbywilson.com' },
    replyTo: { email: 'wilson@wanderbywilson.com', name: 'Wilson Schubert' },
    subject: 'Thank you for reaching out — Wander by Wilson',
    html: clientHtml
  });
  if (!clientResult.ok) {
    console.error('Brevo client receipt send failed (non-fatal):', clientResult.error);
  }

  // 3) Asana task (non-fatal)
  const asanaResult = await createEnquiryTask({
    formType: 'cruise',
    fields: body,
    clientName,
    clientEmail
  });
  if (!asanaResult.ok) {
    console.error('Asana task creation failed (non-fatal):', asanaResult.error);
  }

  return res.status(200).json({ ok: true });
};
