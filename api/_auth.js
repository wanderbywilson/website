// Studio sign-in: who does this passcode belong to?
//
//   Owner            — Wilson, full Studio. Her passcode is set on the Team
//                      card ("Change my passcode", stored hashed at
//                      team/_owner.json). Until she sets one, the
//                      STUDIO_PASSCODE Vercel env var is used; once she has,
//                      the env value stops working (it leaked, see SITE-NOTES).
//   Team members     — added by Wilson on the Studio's Team card (api/team.js),
//                      stored in Blob at team/_members.json with the passcode
//                      hashed. Role "manager": blog posts only (write, edit
//                      live posts, publish). No proposals, social, hotel
//                      drafts or AI tools.
//   STUDIO_MANAGERS  — optional env fallback, "Name:CODE,Name:CODE", same role.
//
// Each person has their own code, so removing one never affects anyone else.

const crypto = require('crypto');
const { blobGetJSON, blobPutJSON } = require('./_blob');

const MEMBERS = 'team/_members.json';
const OWNER = 'team/_owner.json';

// Codes are typed by people: ignore case, spaces and dashes.
function norm(s) {
    return (s || '').toUpperCase().replace(/[\s-]+/g, '');
}

function hashCode(code, salt) {
    return crypto.scryptSync(norm(code), salt, 32).toString('hex');
}

// Readable, unambiguous (no 0/O, 1/I/L): 12 characters shown as XXXX-XXXX-XXXX.
function newCode() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    const bytes = crypto.randomBytes(12);
    let out = '';
    for (let i = 0; i < 12; i++) out += chars[bytes[i] % chars.length];
    return out.replace(/(.{4})(.{4})(.{4})/, '$1-$2-$3');
}

async function loadMembers() {
    const data = await blobGetJSON(MEMBERS);
    return (data && Array.isArray(data.members)) ? data.members : [];
}

async function saveMembers(members) {
    await blobPutJSON(MEMBERS, { members });
}

function hashMatches(code, rec) {
    const want = Buffer.from(rec.codeHash, 'hex');
    const got = Buffer.from(hashCode(code, rec.salt), 'hex');
    return want.length === got.length && crypto.timingSafeEqual(want, got);
}

async function setOwnerCode(code) {
    const salt = crypto.randomBytes(16).toString('hex');
    await blobPutJSON(OWNER, { salt, codeHash: hashCode(code, salt), updatedAt: new Date().toISOString() });
}

async function whoIs(passcode) {
    const code = norm(passcode);
    if (!code) return null;
    const ownerRec = await blobGetJSON(OWNER);
    if (ownerRec && ownerRec.codeHash) {
        if (hashMatches(code, ownerRec)) return { role: 'owner', name: 'Wilson' };
    } else {
        const owner = norm(process.env.STUDIO_PASSCODE);
        if (owner && code.length === owner.length &&
            crypto.timingSafeEqual(Buffer.from(code), Buffer.from(owner))) {
            return { role: 'owner', name: 'Wilson' };
        }
    }
    for (const pair of (process.env.STUDIO_MANAGERS || '').split(',')) {
        const i = pair.indexOf(':');
        if (i < 1) continue;
        const managerCode = norm(pair.slice(i + 1));
        if (managerCode.length >= 8 && code === managerCode) return { role: 'manager', name: pair.slice(0, i).trim() };
    }
    for (const m of await loadMembers()) {
        if (hashMatches(code, m)) {
            return { role: m.role || 'manager', name: m.name, memberId: m.id };
        }
    }
    return null;
}

module.exports = { whoIs, newCode, hashCode, loadMembers, saveMembers, setOwnerCode, norm };
