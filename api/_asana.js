// Asana integration — creates an "Enquiry: ..." task in the project's
// Enquiries section every time someone submits an inquiry form.
//
// Required env vars:
//   ASANA_API_TOKEN       — Wilson's Personal Access Token (starts "2/...")
//   ASANA_PROJECT_GID     — defaults to the Wander production project
//                           if not set
//
// Behavior:
//   - Looks up the "Enquiries" section once per Vercel function instance
//     and caches the GID in memory (no repeat API calls per submission)
//   - Assigns the task to "me" — which is whichever user generated the
//     Personal Access Token (i.e. Wilson)
//   - Task title follows the pattern Wilson's existing tasks use:
//       Enquiry: {Name} - {Destination} - {Date}
//   - Task notes carry the full form payload as a readable block

const DEFAULT_PROJECT_GID = '1211145008392245';   // Client Trips - Booking C... > Enquiries
const SECTION_NAME = 'Enquiries';

// Per-Vercel-instance cache so we don't re-hit /projects/<gid>/sections
// every form submission. Cold starts incur ~200ms first lookup, all
// subsequent submissions to the same warm instance are free.
let _sectionGidCache = null;

async function asanaFetch(endpoint, apiKey, opts = {}) {
  const r = await fetch(`https://app.asana.com/api/1.0${endpoint}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(opts.headers || {})
    }
  });
  if (!r.ok) {
    const errText = await r.text();
    throw new Error(`Asana ${r.status} on ${endpoint}: ${errText}`);
  }
  return r.json();
}

/** Resolve the "Enquiries" section GID for the project, with cache. */
async function findEnquiriesSectionGid(projectGid, apiKey) {
  if (_sectionGidCache) return _sectionGidCache;
  const data = await asanaFetch(`/projects/${projectGid}/sections`, apiKey);
  const section = (data.data || []).find(s =>
    (s.name || '').trim().toLowerCase() === SECTION_NAME.toLowerCase()
  );
  if (!section) {
    throw new Error(`No "${SECTION_NAME}" section found in project ${projectGid}`);
  }
  _sectionGidCache = section.gid;
  return _sectionGidCache;
}

/** Format ISO date "2026-06-15" → "June 2026" for task titles. */
function formatMonthYear(isoDate) {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

/** Build the Asana task title to match Wilson's existing pattern. */
function buildTaskTitle({ clientName, fields, formType }) {
  const name = clientName || '(Unknown)';
  // Destination-like field varies by form type
  const destination = (
    fields.destinations ||           // trip form
    fields.hotel ||                  // hotel form (if present)
    fields.region ||                 // cruise form
    fields.cruise_style ||           // cruise form fallback
    ''
  ).trim();
  // Date-like field
  const date = formatMonthYear(fields.departure_date || fields.travel_month || fields.checkin || '');

  const tail = [destination, date].filter(Boolean).join(' - ');
  return tail ? `Enquiry: ${name} - ${tail}` : `Enquiry: ${name}`;
}

/** Build the Asana task notes — full form details in a readable form. */
function buildTaskNotes({ fields, formType, clientEmail }) {
  const typeLabel =
    formType === 'custom_trip'  ? 'Custom Trip Inquiry' :
    formType === 'cruise'       ? 'Cruise Inquiry' :
    formType === 'hotel_booking' ? 'VIP Hotel Booking Inquiry' :
                                  'Inquiry';

  const lines = [`${typeLabel} — submitted via wanderbywilson.com`, ''];
  if (clientEmail) lines.push(`Reply to: ${clientEmail}`);
  lines.push('');

  for (const [k, v] of Object.entries(fields)) {
    if (!v) continue;
    if (k.startsWith('_') || k === 'form_type') continue;
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    lines.push(`${label}: ${v}`);
  }
  return lines.join('\n');
}

/**
 * Create the Asana enquiry task. Returns { ok, taskGid? , error? }.
 * Caller treats failure as non-fatal — the email already went out,
 * Wilson can manually create the task if Asana is down.
 */
async function createEnquiryTask({ projectGid, fields, clientName, clientEmail, formType }) {
  const apiKey = process.env.ASANA_API_TOKEN;
  if (!apiKey) {
    return { ok: false, error: 'ASANA_API_TOKEN not configured' };
  }
  projectGid = projectGid || process.env.ASANA_PROJECT_GID || DEFAULT_PROJECT_GID;

  try {
    const sectionGid = await findEnquiriesSectionGid(projectGid, apiKey);

    const title = buildTaskTitle({ clientName, fields, formType });
    const notes = buildTaskNotes({ fields, formType, clientEmail });

    const body = {
      data: {
        name: title,
        notes,
        assignee: 'me',  // resolves to whichever user generated the token (Wilson)
        projects: [projectGid],
        memberships: [{ project: projectGid, section: sectionGid }]
      }
    };

    const created = await asanaFetch('/tasks', apiKey, {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return { ok: true, taskGid: created.data && created.data.gid };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = { createEnquiryTask, findEnquiriesSectionGid, buildTaskTitle, buildTaskNotes };
