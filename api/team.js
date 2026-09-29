// /api/team — the Studio's Team card: who else can sign in. Owner only.
//
//   POST {passcode, action}:
//     list                → [{id, name, role, createdAt, lastSeenAt}]
//     add    {name}       → {id, passcode}   (passcode shown once, never stored)
//     reset  {id}         → {passcode}       (the old one stops working)
//     remove {id}
//     setowner {newPasscode}  → Wilson's own passcode (replaces STUDIO_PASSCODE)
//
// Passcodes are stored only as salted scrypt hashes (see _auth.js).

const crypto = require('crypto');
const { whoIs, newCode, hashCode, loadMembers, saveMembers, setOwnerCode, norm } = require('./_auth');

function publicView(m) {
    return { id: m.id, name: m.name, role: m.role, createdAt: m.createdAt, lastSeenAt: m.lastSeenAt || '' };
}

module.exports = async (req, res) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    res.setHeader('Cache-Control', 'no-store');
    try {
        if (req.method !== 'POST') {
            res.setHeader('Allow', 'POST');
            return res.status(405).json({ error: 'Method not allowed' });
        }
        let body = req.body;
        if (typeof body === 'string') { try { body = JSON.parse(body); } catch (e) { body = {}; } }
        body = body || {};

        const user = await whoIs(body.passcode);
        if (!user) return res.status(401).json({ error: 'Wrong passcode' });
        if (user.role !== 'owner') return res.status(403).json({ error: 'Only Wilson can manage the team' });

        const action = body.action || '';

        // Wilson's own passcode. Letters and numbers, 10+ characters, and not
        // one a team member already uses.
        if (action === 'setowner') {
            const next = String(body.newPasscode || '');
            if (norm(next).length < 10 || !/^[A-Za-z0-9 -]+$/.test(next)) {
                return res.status(400).json({ error: 'Use at least 10 letters and numbers' });
            }
            const clash = await whoIs(next);
            if (clash && clash.role !== 'owner') return res.status(400).json({ error: 'Pick a different one' });
            await setOwnerCode(next);
            return res.status(200).json({ ok: true });
        }

        const members = await loadMembers();

        if (action === 'list') {
            return res.status(200).json({ ok: true, members: members.map(publicView) });
        }

        if (action === 'add') {
            const name = String(body.name || '').replace(/[<>]/g, '').trim().slice(0, 60);
            if (!name) return res.status(400).json({ error: 'Add a name first' });
            const passcode = newCode();
            const salt = crypto.randomBytes(16).toString('hex');
            const m = { id: crypto.randomBytes(6).toString('hex'), name, role: 'manager',
                        salt, codeHash: hashCode(passcode, salt), createdAt: new Date().toISOString() };
            members.push(m);
            await saveMembers(members);
            return res.status(200).json({ ok: true, member: publicView(m), passcode });
        }

        const m = members.find(x => x.id === body.id);
        if (!m) return res.status(404).json({ error: 'Not found' });

        if (action === 'reset') {
            const passcode = newCode();
            m.salt = crypto.randomBytes(16).toString('hex');
            m.codeHash = hashCode(passcode, m.salt);
            await saveMembers(members);
            return res.status(200).json({ ok: true, passcode });
        }

        if (action === 'remove') {
            await saveMembers(members.filter(x => x.id !== m.id));
            return res.status(200).json({ ok: true });
        }

        return res.status(400).json({ error: `Unknown action: ${action}` });
    } catch (err) {
        console.error('team API error:', err);
        return res.status(500).json({ error: 'Server error — please try again' });
    }
};
