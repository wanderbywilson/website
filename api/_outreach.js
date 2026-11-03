// Email outreach (Studio → Email outreach, 2026-11-02): one doc per client at
// content/outreach/{id}.json, saved through /api/studio-content (kind
// "outreach", owner only). Client data is imported from a JSON file Wilson
// keeps on her Mac: it never goes in this repo, which is PUBLIC.
//
// Doc shape:
//   { name, contact, email, cc, campaign, group, sendWeek, sendDate, priority,
//     tripType, lookbook, trip:{title, destination, dates, hotels[], value},
//     otherTrips[], survey, keyDate, status2027, opportunity, notes,
//     emails:[{label, subject, body, status, gmailDraftId, gmailMessageId,
//              links[], approvedAt, sentAt}],
//     response, responseNote }
//   email status: empty → draft → in-gmail → sent
//   response (by hand or the morning routine): '' | replied | planning |
//            call | booked | not-now | archived  (+ responseNote, revisitDate)
//
// Approve builds the message here and Gmail stores it as a draft. Links in the
// body are rewritten to /api/proposal-viewed?o={id}&e={n}&l={n}, which counts
// the click and redirects to the original link (only links saved on the doc,
// so it can't be used as an open redirect).

const SITE = 'https://www.wanderbywilson.com';
const FROM = 'Wilson Schubert <wilson@wanderbywilson.com>';

function stage(doc) {
    const em = Array.isArray(doc.emails) ? doc.emails : [];
    if (doc.response === 'booked') return 'booked';
    if (doc.response === 'call') return 'call';
    if (doc.response === 'planning') return 'planning';
    if (doc.response === 'replied') return 'replied';
    if (doc.response === 'not-now') return 'not-now';
    if (doc.response === 'archived') return 'archived';
    if (em.some(e => e && e.status === 'sent')) return 'sent';
    if (em.some(e => e && e.status === 'in-gmail')) return 'in-gmail';
    if (em.some(e => e && e.status === 'draft' && (e.body || '').trim())) return 'review';
    return 'not-drafted';
}

// Everything the list, filters and funnel need, without the email bodies.
function outreachMeta(id, doc) {
    const em = Array.isArray(doc.emails) ? doc.emails : [];
    return {
        id,
        name: doc.name || '', contact: doc.contact || '', email: doc.email || '',
        campaign: doc.campaign || '', group: doc.group || '', sendWeek: doc.sendWeek || '', sendDate: doc.sendDate || '',
        priority: doc.priority || '', tripType: doc.tripType || '', lookbook: doc.lookbook || '',
        tripTitle: (doc.trip && doc.trip.title) || '', destination: (doc.trip && doc.trip.destination) || '',
        dates: (doc.trip && doc.trip.dates) || '', value: Number((doc.trip && doc.trip.value) || 0),
        keyDate: doc.keyDate || '', opportunity: doc.opportunity || '',
        emails: em.map(e => ({ status: (e && e.status) || 'empty', sentAt: (e && e.sentAt) || '', approvedAt: (e && e.approvedAt) || '' })),
        response: doc.response || '', revisitDate: doc.revisitDate || '', responseNote: String(doc.responseNote || '').slice(0, 160), stage: stage(doc),
        updatedAt: doc.updatedAt || ''
    };
}

// The Studio editor is a contenteditable box, so the body is HTML. Keep only
// the tags an email needs; drop scripts, styles, event handlers and any link
// that isn't http(s)/mailto.
function cleanBody(html) {
    let s = String(html || '');
    s = s.replace(/<(script|style|iframe|object|embed)[\s\S]*?<\/\1>/gi, '');
    s = s.replace(/<(?!\/?(p|br|div|a|b|strong|i|em|u|ul|ol|li|span)\b)[^>]*>/gi, '');
    s = s.replace(/\s(on\w+|style|class|id)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
    s = s.replace(/<a\b([^>]*)>/gi, (m, attrs) => {
        const href = (attrs.match(/href\s*=\s*"([^"]*)"/i) || attrs.match(/href\s*=\s*'([^']*)'/i) || [])[1] || '';
        return /^(https?:|mailto:)/i.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}">` : '<a>';
    });
    return s.trim();
}

function trackUrl(id, step, i) {
    return `${SITE}/api/proposal-viewed?o=${encodeURIComponent(id)}&e=${step}&l=${i}`;
}

// Swap every http(s) link for its tracked version; returns the new HTML and
// the original links in order (stored on the doc for the redirect).
function trackLinks(html, id, step) {
    const links = [];
    const out = html.replace(/<a href="(https?:[^"]+)">/gi, (m, href) => {
        const url = href.replace(/&amp;/g, '&');
        let i = links.indexOf(url);
        if (i < 0) { links.push(url); i = links.length - 1; }
        return `<a href="${trackUrl(id, step, i).replace(/&/g, '&amp;')}">`;
    });
    return { html: out, links };
}

function htmlToText(html) {
    return String(html || '')
        .replace(/<a href="([^"]+)">([\s\S]*?)<\/a>/gi, (m, href, t) => `${t.replace(/<[^>]+>/g, '')} (${href.replace(/&amp;/g, '&')})`)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li)>/gi, '\n\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

function b64(s) { return Buffer.from(s, 'utf8').toString('base64').replace(/(.{76})/g, '$1\r\n'); }
function b64url(s) { return Buffer.from(s, 'utf8').toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function headerWord(s) { return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s, 'utf8').toString('base64')}?=`; }
function addr(s) { return String(s || '').split(/[,;]/).map(x => x.trim()).filter(x => /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i.test(x)); }

// The full RFC 822 message Gmail stores as the draft. Laid out like a message
// Wilson writes in Gmail herself: body, then "-- " and her signature.
function buildMessage(id, doc, step, signature) {
    const e = (doc.emails || [])[step];
    if (!e) throw new Error('No email ' + (step + 1) + ' on this client');
    const to = addr(doc.email);
    if (!to.length) throw new Error('This client has no email address yet');
    const subject = String(e.subject || '').trim();
    if (!subject) throw new Error('Add a subject first');
    const body = cleanBody(e.body);
    if (!body.replace(/<[^>]+>/g, '').trim()) throw new Error('The email is empty');
    const tracked = trackLinks(body, id, step);
    const sig = String(signature || '').trim();
    const html = `<div dir="ltr">${tracked.html}</div>` +
        (sig ? `<br><div><br></div><span class="gmail_signature_prefix">-- </span><br><div dir="ltr" class="gmail_signature">${sig}</div>` : '');
    const text = htmlToText(tracked.html) + (sig ? '\n\n-- \n' + htmlToText(sig) : '');
    const boundary = 'wbw_' + Math.random().toString(36).slice(2);
    const cc = addr(doc.cc);
    const head = [
        `From: ${FROM}`,
        `To: ${to.join(', ')}`,
        cc.length ? `Cc: ${cc.join(', ')}` : '',
        `Subject: ${headerWord(subject)}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/alternative; boundary="${boundary}"`
    ].filter(Boolean).join('\r\n');
    const mime = `${head}\r\n\r\n` +
        `--${boundary}\r\nContent-Type: text/plain; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(text)}\r\n` +
        `--${boundary}\r\nContent-Type: text/html; charset="UTF-8"\r\nContent-Transfer-Encoding: base64\r\n\r\n${b64(html)}\r\n` +
        `--${boundary}--`;
    return { raw: b64url(mime), links: tracked.links, body };
}

// Link checkers in some inboxes (Outlook Safe Links, Mimecast, Proofpoint…)
// open every link before the person does. Those aren't clicks.
function isBot(ua) {
    return !ua || /bot|crawl|spider|preview|scan|safelinks|proofpoint|mimecast|barracuda|urldefense|python|curl|wget|headless|googleimageproxy|bingpreview|slack|facebookexternalhit/i.test(ua);
}

module.exports = { stage, outreachMeta, cleanBody, buildMessage, trackUrl, isBot, SITE };
