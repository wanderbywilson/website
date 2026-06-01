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

  const title =
    formType === 'custom_trip' ? 'New trip inquiry' :
    formType === 'cruise'      ? 'New cruise inquiry' :
                                 'New VIP hotel booking inquiry';

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
          <div style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${BRAND_GOLD};margin-bottom:14px;">${formType === 'custom_trip' ? 'Plan Your Trip' : formType === 'cruise' ? 'Plan Your Cruise' : 'VIP Hotel Booking'}</div>
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

/**
 * Build a welcome-guide URL with UTM params for analytics attribution.
 * GA4 will see these as `client-receipt / email / {form}-inquiry` source
 * so we can measure click-through per form type.
 */
function welcomeGuideUrl(formType) {
  const campaign =
    formType === 'hotel_booking' ? 'hotel-inquiry' :
    formType === 'cruise'        ? 'cruise-inquiry' :
                                   'trip-inquiry';
  return `https://www.wanderbywilson.com/welcome-guide?utm_source=client-receipt&utm_medium=email&utm_campaign=${campaign}`;
}

/** Same idea for the Calendly link — Brevo tracks the click, and if
 *  Wilson ever upgrades Calendly the UTMs will surface in booking events. */
function calendlyUrl(formType) {
  const campaign =
    formType === 'cruise' ? 'cruise-inquiry' : 'trip-inquiry';
  return `https://calendly.com/wilson-schubert/30min?utm_source=client-receipt&utm_medium=email&utm_campaign=${campaign}`;
}

/**
 * Per-form-type body content for the client receipt email. Returns an
 * HTML fragment that fills the middle of the standard template (the
 * outer header/greeting/signature/recap/footer is consistent across
 * all three forms). Each form's body is tuned to the client's actual
 * intent — trip planning, hotel-only, or cruise matchmaking.
 */
function buildReceiptBody(formType) {
  const BLUE = BRAND_BLUE, GOLD = BRAND_GOLD, IVORY = BRAND_IVORY;
  const WG_URL = welcomeGuideUrl(formType);
  const CAL_URL = calendlyUrl(formType);

  if (formType === 'hotel_booking') {
    // HOTEL — confirmation-focused, no Calendly CTA (hotel bookings rarely need a call)
    return `
        <tr><td style="padding:24px 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Thank you for reaching out about your hotel booking &mdash; I&rsquo;m so glad you came our way.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            I&rsquo;ve received your details and will personally review them within the next <strong style="color:${BLUE};">48 hours</strong>. From there, I&rsquo;ll confirm availability and apply our exclusive <strong style="color:${BLUE};">preferred-partner perks</strong> to your stay at no additional cost &mdash; these typically include:
          </p>
          <ul style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 22px 0;padding-left:22px;">
            <li style="margin-bottom:6px;">Daily breakfast for two</li>
            <li style="margin-bottom:6px;">$100+ resort or food &amp; beverage credit</li>
            <li style="margin-bottom:6px;">Priority room upgrade on arrival</li>
            <li style="margin-bottom:6px;">Early check-in / late check-out (where available)</li>
            <li style="margin-bottom:6px;">VIP recognition with the property before you arrive</li>
          </ul>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 26px 0;">
            If you have any additional details to share &mdash; preferred room type, anniversary or special occasion, dietary preferences &mdash; just hit reply. Your message will land directly in my inbox.
          </p>
        </td></tr>

        <!-- Secondary CTA: Welcome guide -->
        <tr><td style="padding:0 40px 12px 40px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr><td style="background:${BLUE};padding:18px 44px;">
              <a href="${WG_URL}" style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:${IVORY};text-decoration:none;letter-spacing:0.04em;">Read the welcome guide &nbsp;&rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:14px 40px 0 40px;text-align:center;">
          <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#7A8499;line-height:1.65;margin:0 0 22px 0;">
            A quick read on how we work and the other services we offer beyond hotel bookings.
          </p>
        </td></tr>

        <tr><td style="padding:8px 40px 30px 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 30px 0;">
            I look forward to confirming your stay!
          </p>
        </td></tr>`;
  }

  if (formType === 'cruise') {
    // CRUISE — matchmaking-focused with intro call CTA and cruise-specific prep list
    return `
        <tr><td style="padding:24px 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Thank you so much for taking the time to share your cruise interests!
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Cruise planning is all about the match &mdash; the right cruise line, ship, cabin, and itinerary for the way you love to travel. There&rsquo;s a wide range out there (luxury small ships, ocean liners, river barges, expedition vessels, fully private yacht charters), and the right one depends entirely on the experience you&rsquo;re after.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            I would love to hop on a quick call to walk through your priorities and recommend the best options. These initial calls are short but sweet &mdash; no more than 30 minutes &mdash; and help me understand:
          </p>
          <ul style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 26px 0;padding-left:22px;">
            <li style="margin-bottom:6px;">Your preferred regions or bucket-list ports</li>
            <li style="margin-bottom:6px;">Travel timing and length</li>
            <li style="margin-bottom:6px;">Cruise style: formal vs. casual, large ship vs. intimate yacht</li>
            <li style="margin-bottom:6px;">Cabin preference and any deal-breakers</li>
          </ul>
        </td></tr>

        <!-- PRIMARY CTA: LET'S CHAT! -->
        <tr><td style="padding:0 40px 12px 40px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr><td style="background:${BLUE};padding:18px 44px;">
              <a href="${CAL_URL}" style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:${IVORY};text-decoration:none;letter-spacing:0.04em;">LET&rsquo;S CHAT! &nbsp;&rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 40px 32px 40px;text-align:center;">
          <a href="${WG_URL}" style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:${GOLD};text-decoration:none;border-bottom:1px solid ${GOLD};padding-bottom:3px;">Read the welcome guide &rarr;</a>
        </td></tr>

        <tr><td style="padding:0 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Before the call, take a few minutes to skim our Welcome Guide so you have a sense of how we work and what to expect throughout the planning process.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 30px 0;">
            I can&rsquo;t wait to find the perfect cruise for you!
          </p>
        </td></tr>`;
  }

  // TRIP (default) — Wilson's original approved copy
  return `
        <tr><td style="padding:24px 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Thank you so much for taking the time to send me your trip details!
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Now that I have a high-level overview of what you are looking for, I would love to connect to ensure that I fully understand your vision.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Please click the link below to select a time that works best for us to chat. These initial introduction calls are short but sweet and should take no more than 30 minutes. I will review your &ldquo;must-haves&rdquo;, discuss travel logistics, and answer any specific questions you may have about the trip and our process.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 26px 0;">
            Before the call, please review our <a href="${WG_URL}" style="color:${BLUE};text-decoration:underline;">Welcome Guide</a> to learn about what you can expect when working with us.
          </p>
        </td></tr>

        <!-- PRIMARY CTA: LET'S CHAT! -->
        <tr><td style="padding:0 40px 12px 40px;text-align:center;">
          <table role="presentation" cellpadding="0" cellspacing="0" align="center">
            <tr><td style="background:${BLUE};padding:18px 44px;">
              <a href="${CAL_URL}" style="font-family:Georgia,serif;font-style:italic;font-size:20px;color:${IVORY};text-decoration:none;letter-spacing:0.04em;">LET&rsquo;S CHAT! &nbsp;&rarr;</a>
            </td></tr>
          </table>
        </td></tr>

        <tr><td style="padding:8px 40px 32px 40px;text-align:center;">
          <a href="${WG_URL}" style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.28em;text-transform:uppercase;color:${GOLD};text-decoration:none;border-bottom:1px solid ${GOLD};padding-bottom:3px;">Read the welcome guide &rarr;</a>
        </td></tr>

        <tr><td style="padding:0 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:15px;font-style:italic;color:#7A8499;line-height:1.65;margin:0 0 22px 0;text-align:center;">
            Once you schedule the call, the system will send you a calendar invite.
          </p>
        </td></tr>

        <tr><td style="padding:0 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 12px 0;">
            In preparation for the call, please consider:
          </p>
          <ul style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 22px 0;padding-left:22px;">
            <li style="margin-bottom:6px;">Your main goals for the trip</li>
            <li style="margin-bottom:6px;">Your travel dates (and if they are flexible based on the time of year)</li>
            <li style="margin-bottom:6px;">The overall ideal budget</li>
          </ul>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 16px 0;">
            Our goal is to create a collaborative relationship with each client, and this is most successful when I understand what we will both need from each other.
          </p>
          <p style="font-family:Georgia,serif;font-size:16px;color:#3D4A60;line-height:1.7;margin:0 0 30px 0;">
            I can&rsquo;t wait to get started on an awesome concept for you!
          </p>
        </td></tr>`;
}

/**
 * Build the HTML receipt email the CLIENT receives. The body copy
 * branches by formType (trip / hotel / cruise) so each receipt is
 * specific to the client's actual intent. The outer template
 * (brand header, greeting, signature, submission recap, footer) is
 * consistent across all three.
 *
 * Reply-To goes straight to wilson@ so any reply lands in her inbox.
 */
function buildClientReceiptHTML({ formType, fields, clientName }) {
  // Same labeled-row pattern as the owner email
  const rows = Object.entries(fields)
    .filter(([k, v]) => v && !k.startsWith('_') && k !== 'form_type' && k !== 'email' && k !== 'first_name' && k !== 'last_name')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const value = String(v).replace(/\n/g, '<br>');
      return `
        <tr>
          <td style="padding:12px 0 12px 0;border-bottom:1px solid #E8DFD0;font-family:'Inter',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#7A8499;width:42%;vertical-align:top;">${label}</td>
          <td style="padding:12px 0 12px 0;border-bottom:1px solid #E8DFD0;font-family:'Inter',sans-serif;font-size:14px;color:${BRAND_BLUE};vertical-align:top;line-height:1.55;">${value}</td>
        </tr>`;
    })
    .join('');

  // First-name greeting (falls back gracefully)
  const firstName = (fields.first_name || (clientName || '').split(' ')[0] || '').trim();
  const greeting = firstName ? `Hi ${escapeHtml(firstName)},` : 'Hi there,';

  // Per-form-type kicker + headline so the title band reflects intent
  const kicker =
    formType === 'custom_trip'  ? 'YOUR TRIP INQUIRY' :
    formType === 'cruise'       ? 'YOUR CRUISE INQUIRY' :
                                  'YOUR HOTEL INQUIRY';
  const headline =
    formType === 'hotel_booking'
      ? `Thank you for<br><em style="color:${BRAND_GOLD};font-style:italic;">reaching out.</em>`
      : `Let&rsquo;s plan something<br><em style="color:${BRAND_GOLD};font-style:italic;">extraordinary.</em>`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Thank you for your inquiry — Wander by Wilson</title></head>
<body style="margin:0;padding:0;background:${BRAND_PAPER};font-family:Georgia,serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:${BRAND_PAPER};padding:48px 16px;">
    <tr><td align="center">
      <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#FFFFFF;border:1px solid #E8DFD0;max-width:600px;">

        <!-- Brand header -->
        <tr><td style="background:${BRAND_BLUE};padding:32px 40px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:18px;font-weight:400;letter-spacing:0.18em;color:${BRAND_IVORY};text-transform:uppercase;">Wander by Wilson</div>
        </td></tr>

        <!-- Title band -->
        <tr><td style="padding:40px 40px 12px 40px;">
          <div style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${BRAND_GOLD};margin-bottom:14px;">${kicker}</div>
          <div style="font-family:Georgia,serif;font-size:30px;font-weight:400;color:${BRAND_BLUE};line-height:1.2;">${headline}</div>
        </td></tr>

        <!-- Greeting -->
        <tr><td style="padding:24px 40px 0 40px;">
          <p style="font-family:Georgia,serif;font-size:16px;color:${BRAND_BLUE};line-height:1.65;margin:0 0 4px 0;">${greeting}</p>
        </td></tr>

        <!-- Per-form-type body (long copy + CTA + prep list, varies by form) -->
        ${buildReceiptBody(formType)}

        <!-- Sign-off (consistent across all forms) -->
        <tr><td style="padding:0 40px 30px 40px;">
          <p style="font-family:Georgia,serif;font-size:22px;font-style:italic;color:${BRAND_BLUE};line-height:1.3;margin:0 0 4px 0;">Wilson</p>
          <p style="font-family:'Inter',sans-serif;font-size:11px;font-weight:500;letter-spacing:0.22em;text-transform:uppercase;color:#7A8499;margin:0;">Founder &middot; Wander by Wilson</p>
        </td></tr>

        <!-- Submission recap header -->
        <tr><td style="padding:8px 40px 0 40px;border-top:1px solid #E8DFD0;">
          <div style="font-family:'Inter',sans-serif;font-size:10px;font-weight:500;letter-spacing:0.3em;text-transform:uppercase;color:${BRAND_GOLD};padding-top:28px;margin-bottom:6px;">For your records</div>
          <div style="font-family:Georgia,serif;font-size:14px;font-style:italic;color:#7A8499;margin-bottom:18px;">Here&rsquo;s a copy of what you sent us:</div>
        </td></tr>

        <!-- Submission recap -->
        <tr><td style="padding:0 40px 36px 40px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
            ${rows}
          </table>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:24px 40px 32px 40px;border-top:1px solid #E8DFD0;text-align:center;">
          <div style="font-family:'Inter',sans-serif;font-size:12px;color:#7A8499;letter-spacing:0.02em;line-height:1.6;">
            <a href="mailto:wilson@wanderbywilson.com" style="color:${BRAND_GOLD};text-decoration:none;">wilson@wanderbywilson.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://www.wanderbywilson.com" style="color:${BRAND_GOLD};text-decoration:none;">wanderbywilson.com</a>
            &nbsp;&middot;&nbsp;
            <a href="https://www.instagram.com/wanderbywilson/" style="color:${BRAND_GOLD};text-decoration:none;">@wanderbywilson</a>
          </div>
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
 *
 * Optional overrides:
 *   sender   — { name, email }  default is "Wander by Wilson" <forms@>
 *   toName   — recipient display name (default "Wilson Schubert" for the
 *              owner email; for client receipts pass the client's name)
 */
async function sendBrevoEmail({ apiKey, to, toName, replyTo, sender, subject, html }) {
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        sender: sender || { name: 'Wander by Wilson', email: 'forms@wanderbywilson.com' },
        to: [{ email: to, name: toName || 'Wilson Schubert' }],
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

module.exports = { buildOwnerEmailHTML, buildClientReceiptHTML, sendBrevoEmail, escapeHtml };
