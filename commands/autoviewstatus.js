/**
 * commands/autoviewstatus.js — Auto-view + auto-react to contacts' statuses
 * Scotty♤C©
 */
const fs = require('fs');
const { reply, getSender, getIsOwner } = require('./_helper');

const FILE = './data/autoviewstatus.json';

function get() {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
    catch { return { enabled: false, react: true }; }
}
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }
function isEnabled() { return get().enabled === true; }

// Random emoji pool for status reactions
const STATUS_EMOJIS = ['❤️','🔥','😍','👏','😂','😮','💯','🙌','✨','😎','🥳','💫','👀','😁','🤩'];

// ── Called from index.js whenever a status@broadcast update comes in ───────
async function runAutoViewStatus(sock, mek) {
    try {
        const d = get();
        if (!d.enabled) return;
        if (mek.key?.fromMe) return;

        // Mark the status as viewed
        try { await sock.readMessages([mek.key]); } catch {}

        // React with a random emoji
        if (d.react !== false) {
            const participant = mek.key?.participant || mek.participant;
            if (participant) {
                const emoji = STATUS_EMOJIS[Math.floor(Math.random() * STATUS_EMOJIS.length)];
                try {
                    await sock.sendMessage('status@broadcast', {
                        react: { text: emoji, key: mek.key }
                    }, { statusJidList: [participant, sock.user?.id].filter(Boolean) });
                } catch {}
            }
        }
    } catch {}
}

// ── Command handler — .autoviewstatus on/off/react ─────────────────────────
module.exports = async (sock, chatId, message, args) => {
    const sender = getSender(sock, message);
    if (!await getIsOwner(sock)(sender, sock, chatId))
        return reply(sock, chatId, '❌ Owner only.', message);

    const d   = get();
    const sub = args[0]?.toLowerCase();

    if (!sub) {
        return reply(sock, chatId,
            `👁️ *Auto View Status*\nStatus: ${d.enabled ? '✅ ON' : '❌ OFF'}\nAuto-react: ${d.react !== false ? '✅ ON' : '❌ OFF'}\n\n` +
            `*.autoviewstatus on* — enable\n` +
            `*.autoviewstatus off* — disable\n` +
            `*.autoviewstatus react* — toggle random-emoji reactions\n\n` +
            `_Automatically views everyone's status and reacts with a random emoji_`,
            message
        );
    }
    if (sub === 'on')  { save({ ...d, enabled: true  }); return reply(sock, chatId, '✅ Auto-view status *ON*.', message); }
    if (sub === 'off') { save({ ...d, enabled: false }); return reply(sock, chatId, '❌ Auto-view status *OFF*.', message); }
    if (sub === 'react') {
        const next = d.react === false;
        save({ ...d, react: next });
        return reply(sock, chatId, `${next ? '✅' : '❌'} Auto-react on statuses is now ${next ? 'ON' : 'OFF'}.`, message);
    }
};

module.exports.isEnabled       = isEnabled;
module.exports.runAutoViewStatus = runAutoViewStatus;
