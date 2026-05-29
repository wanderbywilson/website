// Shared helper for both inquiry endpoints.
// Builds + sends a branded email via Brevo's transactional API.

const BRAND_BLUE = '#1E3552';
const BRAND_GOLD = '#B79770';
const BRAND_IVORY = '#FFFBF0';
const BRAND_PAPER = '#FAF7F0';

/**
 * Build the HTML email Wilson receives.
 * Reply-To is set to the client's email, so when Wilson hits "Reply"
 * his message goes to the client directly. The client never sees Brevo.
 */
function buildOwnerEmailHTML({ formType, fields, clientName, clientEmail }) {
  // Render each field as a labeled row in a clean two-column table
  const rows = Object.entries(fields)
    .filter(([k, v]) => v && !k.startsWith('_') && k !== 'form_type')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const value = String(v).replace(/\n/g, '<br>');
      return `
        <tr>
          <td style="padding:14px 0 14px 0;border-bottom:1px solid #E8DFD0;font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#7A8499;width:42%;vertical-align:top;">${label}</td>
          <td style="padding:14px 0 14px 0;border-bottom:1px solid #E8DFD0;font-family:'Inter',sans-serif;font-size:15px;color:${BRAND_BLUE};vertical-align:top;line-height:1.5;">${value}</td>
        </tr>`;
    })
    .join('');

  const title = formType === 'custom_trip'
    ? 'New trip inquiry'
    : 'New VIP hotel booking inquiry';

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${BRAND_PAPER};font-family:Georgia,serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND_PAPER};padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#FFFFFF;border:1px solid #E8DFD0;max-width:600px;">

        <!-- Brand header -->
        <tr><td style="background:${BRAND_BLUE};padding:32px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:400;letter-spacing:0.18em;color:${BRAND_IVORY};text-transform:uppercase;">Wander by Wilson</div>
        </td></tr>

        <!-- Title band -->
        <tr><td style="padding:36px 40px 12px 40px;">
          <div style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${BRAND_GOLD};margin-bottom:14px;">${formType === 'custom_trip' ? 'Plan Your Trip' : 'VIP Hotel Booking'}</div>
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:400;color:${BRAND_BLUE};line-height:1.2;">${title}<br><em style="color:${BRAND_GOLD};font-style:italic;">from ${escapeHtml(clientName) || 'a new client'}.</em></div>
        </td></tr>

        <!-- Quick reply prompt -->
        <tr><td style="padding:18px 40px 0 40px;">
          <div style="font-family:Georgia,serif;font-size:15px;color:#5A6478;line-height:1.65;">Hit reply to respond directly to <strong>${escapeHtml(clientEmail || 'them')}</strong>. They'll see your reply in the inbox they used to submit this inquiry.</div>
        </td></tr>

        <!-- Form responses -->
        <tr><td style="padding:32px 40px 16px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${rows}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 40px 40px 40px;text-align:center;">
          <div style="font-family:'Inter',sans-serif;font-size:11px;color:#9AA0AE;letter-spacing:0.05em;">Submitted via <a href="https://www.wanderbywilson.com" style="color:${BRAND_GOLD};text-decoration:none;">wanderbywilson.com</a></div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/** Tiny HTML-escape so user input can't break the markup */
function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Send the email via Brevo's transactional API.
 * Returns { ok: true } on success or { ok: false, error: '...' } on failure.
 */
async function sendBrevoEmail({ apiKey, to, replyTo, subject, html }) {
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Wander by Wilson', email: 'forms@wanderbywilson.com' },
        to: [{ email: to, name: 'Wilson Schubert' }],
        replyTo: replyTo ? { email: replyTo.email, name: replyTo.name } : undefined,
        subject,
        htmlContent: html
      })
    });
    if (!r.ok) {
      const errText = await r.text();
      return { ok: false, error: `Brevo ${r.status}: ${errText}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { buildOwnerEmailHTML, sendBrevoEmail, escapeHtml };
