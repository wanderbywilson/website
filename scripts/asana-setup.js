#!/usr/bin/env node
/**
 * asana-setup.js
 * ────────────────────────────────────────────────────────────────────
 * ONE-TIME setup script. Creates the tags + custom fields in Asana
 * that the form-submission integration uses, and attaches the custom
 * fields to the project. Idempotent — safe to re-run; it skips
 * anything that already exists.
 *
 * Usage:
 *   ASANA_API_TOKEN="2/..."  node scripts/asana-setup.js
 *
 * What it creates:
 *   Tags (workspace-wide):
 *     - Trip Inquiry           (gold-ish)
 *     - Hotel Inquiry          (blue)
 *     - Cruise Inquiry         (purple)
 *
 *   Custom fields (text, attached to the Client Trips project):
 *     - Trip Budget            (from form's budget dropdown)
 *     - Travel Date            (date type — from form's departure_date)
 *     - Trip Type              (from form's trip_type dropdown)
 * ────────────────────────────────────────────────────────────────────
 */

const PROJECT_GID   = '1211145008392245';
const WORKSPACE_GID = '1210277980183279';

const TAGS = [
  { name: 'Trip Inquiry',   color: 'dark-orange' },
  { name: 'Hotel Inquiry',  color: 'dark-teal' },
  { name: 'Cruise Inquiry', color: 'dark-purple' },
];

const CUSTOM_FIELDS = [
  { name: 'Trip Budget',  type: 'text', description: 'Approximate budget the client indicated on the inquiry form.' },
  { name: 'Travel Date',  type: 'date', description: 'Approximate departure date from the inquiry form.' },
  { name: 'Trip Type',    type: 'text', description: 'Honeymoon / family / anniversary / etc. — from the inquiry form.' },
];

const apiKey = process.env.ASANA_API_TOKEN;
if (!apiKey) {
  console.error('✗  ASANA_API_TOKEN env var is required.');
  console.error('   Run: ASANA_API_TOKEN="2/..." node scripts/asana-setup.js');
  process.exit(1);
}

async function asana(endpoint, opts = {}) {
  const r = await fetch(`https://app.asana.com/api/1.0${endpoint}`, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(opts.headers || {})
    }
  });
  const body = await r.json();
  if (!r.ok) {
    throw new Error(`Asana ${r.status} on ${endpoint}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function ensureTags() {
  console.log('\n— Tags —');
  const existing = await asana(`/workspaces/${WORKSPACE_GID}/tags?limit=100`);
  const byName = new Map((existing.data || []).map(t => [t.name.toLowerCase(), t]));

  for (const want of TAGS) {
    const found = byName.get(want.name.toLowerCase());
    if (found) {
      console.log(`  ✓ exists       ${want.name.padEnd(20)} (gid ${found.gid})`);
      continue;
    }
    const r = await asana('/tags', {
      method: 'POST',
      body: JSON.stringify({ data: { name: want.name, color: want.color, workspace: WORKSPACE_GID } })
    });
    console.log(`  + created      ${want.name.padEnd(20)} (gid ${r.data.gid})`);
  }
}

async function ensureCustomFields() {
  console.log('\n— Custom fields —');
  // Fetch fields currently attached to the project (cheaper than scanning all workspace fields)
  let projectFields;
  try {
    const settings = await asana(`/projects/${PROJECT_GID}/custom_field_settings?opt_fields=custom_field.name,custom_field.gid,custom_field.resource_subtype`);
    projectFields = new Map();
    for (const s of (settings.data || [])) {
      if (s.custom_field) projectFields.set(s.custom_field.name.toLowerCase(), s.custom_field);
    }
  } catch (e) {
    if (/402|not available for free users/i.test(e.message)) {
      console.log('  ⊘ skipped      Custom Fields require a paid Asana plan ($13.49/mo Starter+).');
      console.log('                Tags + task notes still give you everything else you need.');
      console.log('                Re-run this script after upgrading if you want to add them later.');
      return;
    }
    throw e;
  }

  for (const want of CUSTOM_FIELDS) {
    const attached = projectFields.get(want.name.toLowerCase());
    if (attached) {
      console.log(`  ✓ attached     ${want.name.padEnd(15)} (gid ${attached.gid}, type ${attached.resource_subtype})`);
      continue;
    }
    try {
      // Create the custom field at workspace level
      const r = await asana('/custom_fields', {
        method: 'POST',
        body: JSON.stringify({ data: {
          name: want.name,
          resource_subtype: want.type,
          description: want.description,
          workspace: WORKSPACE_GID
        } })
      });
      const newGid = r.data.gid;
      // Then attach to the project
      await asana(`/projects/${PROJECT_GID}/addCustomFieldSetting`, {
        method: 'POST',
        body: JSON.stringify({ data: { custom_field: newGid } })
      });
      console.log(`  + created      ${want.name.padEnd(15)} (gid ${newGid}) and attached to project`);
    } catch (e) {
      if (/402|not available for free users/i.test(e.message)) {
        console.log(`  ⊘ skipped      ${want.name.padEnd(15)} (paid Asana required)`);
      } else {
        throw e;
      }
    }
  }
}

async function main() {
  console.log('Asana setup — Wander by Wilson');
  console.log(`Workspace: ${WORKSPACE_GID}`);
  console.log(`Project:   ${PROJECT_GID}`);
  try {
    await ensureTags();
    await ensureCustomFields();
    console.log('\n✓ Done. The runtime integration discovers these by name and caches the GIDs — nothing else to configure.');
  } catch (e) {
    console.error('\n✗ Failed:', e.message);
    process.exit(1);
  }
}

main();
