// Asana integration — creates an "Enquiry: ..." task in the project's
// Enquiries section every time someone submits an inquiry form.
//
// Required env var:
//   ASANA_API_TOKEN     — Wilson's Personal Access Token (starts "2/...")
// Optional env var:
//   ASANA_PROJECT_GID   — defaults to the Wander production project
//
// One-time setup (before the runtime works):
//   ASANA_API_TOKEN="2/..." node scripts/asana-setup.js
// That script creates the 3 tags + 3 custom fields used below.
//
// Behavior on every form submission:
//   - Resolves the "Enquiries" section, tags, and custom field GIDs by
//     NAME (cached per Vercel function instance — first submission per
//     instance does the lookups, all subsequent ones reuse the cache).
//   - Creates the parent task:
//       title:     Enquiry: {Name} - {Destination} - {Month YYYY}
//       assignee:  me (the personal access token's owner = Wilson)
//       due_on:    tomorrow (so it lands in Wilson's "Today" view)
//       tag:       Trip Inquiry / Hotel Inquiry / Cruise Inquiry
//       fields:    Trip Budget, Travel Date, Trip Type
//       notes:     full form payload + welcome guide link
//   - Creates 3 subtasks:
//       1. Reply within 48 hours
//       2. Send Calendly link for intro call
//       3. Send proposal

const DEFAULT_PROJECT_GID = '1211145008392245';
const WORKSPACE_GID       = '1210277980183279';
const SECTION_NAME        = 'Enquiries';
const WELCOME_GUIDE_URL   = 'https://www.wanderbywilson.com/welcome-guide';
const CALENDLY_URL        = 'https://calendly.com/wilson-schubert/30min';

// Form-type → tag-name + label
const TAG_BY_FORM_TYPE = {
  custom_trip:   'Trip Inquiry',
  hotel_booking: 'Hotel Inquiry',
  cruise:        'Cruise Inquiry',
};

// Slugged form values → readable labels for custom field display
const TRIP_TYPE_LABELS = {
  'couples':    'Couples getaway',
  'honeymoon':  'Honeymoon',
  'anniversary':'Anniversary / milestone',
  'family':     'Family vacation',
  'multi-gen':  'Multi-generational',
  'friends':    'Friends group',
  'wedding':    'Wedding or group block',
  'solo':       'Solo',
  'other':      'Other',
};
const BUDGET_LABELS = {
  '5-10':    '$5,000 – $10,000',
  '10-15':   '$10,000 – $15,000',
  '15-20':   '$15,000 – $20,000',
  '20-30':   '$20,000 – $30,000',
  '30-40':   '$30,000 – $40,000',
  '40-50':   '$40,000 – $50,000',
  '50-75':   '$50,000 – $75,000',
  '75-100':  '$75,000 – $100,000',
  '100+':    '$100,000+',
  'discuss': 'Prefer to discuss',
};

// Per-Vercel-instance caches — survive across warm invocations,
// reset on cold start (which is rare on a production project).
let _sectionGidCache = null;
let _tagGidByName    = null;   // { 'trip inquiry': '12345', ... }
let _customFieldGidByName = null;

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
  if (!section) throw new Error(`No "${SECTION_NAME}" section found in project ${projectGid}`);
  _sectionGidCache = section.gid;
  return _sectionGidCache;
}

/** Resolve workspace tags by name (cached). */
async function findTagGids(apiKey) {
  if (_tagGidByName) return _tagGidByName;
  const data = await asanaFetch(`/workspaces/${WORKSPACE_GID}/tags?limit=100`, apiKey);
  _tagGidByName = new Map();
  for (const t of (data.data || [])) {
    _tagGidByName.set((t.name || '').toLowerCase(), t.gid);
  }
  return _tagGidByName;
}

/** Resolve project-attached custom field GIDs by name (cached). */
async function findCustomFieldGids(projectGid, apiKey) {
  if (_customFieldGidByName) return _customFieldGidByName;
  const data = await asanaFetch(
    `/projects/${projectGid}/custom_field_settings?opt_fields=custom_field.name,custom_field.gid`,
    apiKey
  );
  _customFieldGidByName = new Map();
  for (const s of (data.data || [])) {
    if (s.custom_field) {
      _customFieldGidByName.set((s.custom_field.name || '').toLowerCase(), s.custom_field.gid);
    }
  }
  return _customFieldGidByName;
}

/** Format ISO date "2026-06-15" → "June 2026" for task titles. */
function formatMonthYear(isoDate) {
  if (!isoDate) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return isoDate;
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[parseInt(m[2], 10) - 1]} ${m[1]}`;
}

/** Tomorrow as YYYY-MM-DD for the task's due_on. */
function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/** Build the Asana task title to match Wilson's existing pattern. */
function buildTaskTitle({ clientName, fields }) {
  const name = clientName || '(Unknown)';
  const destination = (
    fields.destinations || fields.hotel || fields.region || fields.cruise_style || ''
  ).trim();
  const date = formatMonthYear(fields.departure_date || fields.travel_month || fields.checkin || '');
  const tail = [destination, date].filter(Boolean).join(' - ');
  return tail ? `Enquiry: ${name} - ${tail}` : `Enquiry: ${name}`;
}

/** Build the task notes — full form details + welcome guide + Calendly link. */
function buildTaskNotes({ fields, formType, clientEmail }) {
  const typeLabel =
    formType === 'custom_trip'  ? 'Custom Trip Inquiry' :
    formType === 'cruise'       ? 'Cruise Inquiry' :
    formType === 'hotel_booking' ? 'VIP Hotel Booking Inquiry' :
                                  'Inquiry';

  const lines = [`${typeLabel} — submitted via wanderbywilson.com`, ''];
  if (clientEmail) lines.push(`Reply to: ${clientEmail}`);
  lines.push('');
  lines.push('— Quick send links —');
  lines.push(`Welcome guide: ${WELCOME_GUIDE_URL}`);
  lines.push(`Intro call booking: ${CALENDLY_URL}`);
  lines.push('');
  lines.push('— Form responses —');

  for (const [k, v] of Object.entries(fields)) {
    if (!v) continue;
    if (k.startsWith('_') || k === 'form_type') continue;
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    // Humanise the slug values from the budget/trip_type dropdowns
    let value = String(v);
    if (k === 'budget' && BUDGET_LABELS[value]) value = BUDGET_LABELS[value];
    if (k === 'trip_type' && TRIP_TYPE_LABELS[value]) value = TRIP_TYPE_LABELS[value];
    lines.push(`${label}: ${value}`);
  }
  return lines.join('\n');
}

/**
 * Create the parent enquiry task + its 3 subtasks.
 * Returns { ok, taskGid? , subtaskGids?, error? }.
 * Caller treats failure as non-fatal.
 */
async function createEnquiryTask({ projectGid, fields, clientName, clientEmail, formType }) {
  const apiKey = process.env.ASANA_API_TOKEN;
  if (!apiKey) return { ok: false, error: 'ASANA_API_TOKEN not configured' };
  projectGid = projectGid || process.env.ASANA_PROJECT_GID || DEFAULT_PROJECT_GID;

  try {
    // Resolve everything in parallel on the first cold-start request
    const [sectionGid, tagMap, fieldMap] = await Promise.all([
      findEnquiriesSectionGid(projectGid, apiKey),
      findTagGids(apiKey),
      findCustomFieldGids(projectGid, apiKey),
    ]);

    // Tag for this form type
    const tagName = TAG_BY_FORM_TYPE[formType] || 'Trip Inquiry';
    const tagGid  = tagMap.get(tagName.toLowerCase());

    // Custom field values (only set what we have GIDs for + values for)
    const customFields = {};
    const budgetGid = fieldMap.get('trip budget');
    const dateGid   = fieldMap.get('travel date');
    const typeGid   = fieldMap.get('trip type');
    if (budgetGid && fields.budget) {
      customFields[budgetGid] = BUDGET_LABELS[fields.budget] || fields.budget;
    }
    if (dateGid && fields.departure_date) {
      customFields[dateGid] = fields.departure_date;  // YYYY-MM-DD from <input type="date">
    }
    if (typeGid && fields.trip_type) {
      customFields[typeGid] = TRIP_TYPE_LABELS[fields.trip_type] || fields.trip_type;
    }

    // Build the parent task body
    const taskBody = {
      data: {
        name: buildTaskTitle({ clientName, fields }),
        notes: buildTaskNotes({ fields, formType, clientEmail }),
        assignee: 'me',
        due_on: tomorrowISO(),
        projects: [projectGid],
        memberships: [{ project: projectGid, section: sectionGid }],
        ...(tagGid ? { tags: [tagGid] } : {}),
        ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
      }
    };

    const created = await asanaFetch('/tasks', apiKey, {
      method: 'POST',
      body: JSON.stringify(taskBody)
    });
    const parentGid = created.data && created.data.gid;
    if (!parentGid) return { ok: false, error: 'Asana returned no task GID' };

    // Create the 3 follow-up subtasks. Run in parallel — they're
    // independent. Failure on subtask creation doesn't break the parent.
    const subtasks = [
      { name: 'Reply within 48 hours',                                                       due_on: tomorrowISO() },
      { name: `Send Calendly link for intro call (${CALENDLY_URL})` },
      { name: 'Send proposal' },
    ];

    const subtaskResults = await Promise.allSettled(subtasks.map(st =>
      asanaFetch(`/tasks/${parentGid}/subtasks`, apiKey, {
        method: 'POST',
        body: JSON.stringify({ data: { ...st, assignee: 'me' } })
      })
    ));
    const subtaskGids = subtaskResults
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data && r.value.data.gid);

    return { ok: true, taskGid: parentGid, subtaskGids };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = {
  createEnquiryTask,
  findEnquiriesSectionGid,
  findTagGids,
  findCustomFieldGids,
  buildTaskTitle,
  buildTaskNotes,
};
