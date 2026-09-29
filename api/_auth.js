// Studio sign-in: who does this passcode belong to?
//
//   STUDIO_PASSCODE  — Wilson's passcode. Full Studio (role "owner").
//   STUDIO_MANAGERS  — team logins, comma-separated Name:PASSCODE pairs,
//                      e.g. "Sajaad:SOMECODE". Role "manager": blog posts
//                      only (write, edit live posts, publish). No proposals,
//                      social, hotel drafts or AI tools.
//
// Each person gets their own code so one login can be revoked without
// changing anyone else's: remove their pair from STUDIO_MANAGERS and redeploy.

function norm(s) {
    return (s || '').trim().toUpperCase();
}

function whoIs(passcode) {
    const code = norm(passcode);
    if (!code) return null;
    if (process.env.STUDIO_PASSCODE && code === norm(process.env.STUDIO_PASSCODE)) {
        return { role: 'owner', name: 'Wilson' };
    }
    for (const pair of (process.env.STUDIO_MANAGERS || '').split(',')) {
        const i = pair.indexOf(':');
        if (i < 1) continue;
        const name = pair.slice(0, i).trim();
        const managerCode = norm(pair.slice(i + 1));
        // Short codes are too guessable to open anything.
        if (managerCode.length >= 8 && code === managerCode) return { role: 'manager', name };
    }
    return null;
}

module.exports = { whoIs };
