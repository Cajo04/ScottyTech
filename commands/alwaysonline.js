const fs = require('fs');
const { reply, getSender, getIsOwner } = require('./_helper');
const FILE = './data/alwaysonline.json';
function get() { try { return JSON.parse(fs.readFileSync(FILE,'utf8')); } catch { return {enabled:false}; } }
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d,null,2)); }
const intervals = new Map();

async function alwaysOnlineCommand(sock, chatId, message, args) {
    const sender = getSender(sock, message);
    const isOwner = getIsOwner(sock);
    if (!await isOwner(sender, sock, chatId)) return reply(sock, chatId, '❌ Owner only.', message);
    const sub = args[0]?.toLowerCase();
    const current = get();
    if (!sub) return reply(sock, chatId, `💓 *Always Online*\n\nStatus: ${current.enabled?'✅ ON':'❌ OFF'}\n\n.alwaysonline on\n.alwaysonline off`, message);

    if (sub === 'on') {
        save({ enabled: true });
        initAlwaysOnline(sock);
        return reply(sock, chatId, '✅ Always online *enabled!*', message);
    }

    if (sub === 'off') {
        save({ enabled: false });
        // Clear the ping interval
        const iv = intervals.get('ao');
        if (iv) { clearInterval(iv); intervals.delete('ao'); }
        // ✅ FIX: tell WhatsApp we are now unavailable so the "online" badge clears
        try { await sock.sendPresenceUpdate('unavailable'); } catch {}
        return reply(sock, chatId, '❌ Always online *disabled.*', message);
    }
}

function initAlwaysOnline(sock) {
    const d = get();
    // ✅ FIX: if disabled, send unavailable and bail — don't start interval
    if (!d.enabled) {
        try { sock.sendPresenceUpdate('unavailable'); } catch {}
        return;
    }
    const existing = intervals.get('ao');
    if (existing) clearInterval(existing);
    // Send immediately so presence shows right away
    try { sock.sendPresenceUpdate('available'); } catch {}
    const iv = setInterval(async () => {
        try { await sock.sendPresenceUpdate('available'); } catch {}
    }, 4 * 60 * 1000);
    intervals.set('ao', iv);
}

module.exports = { alwaysOnlineCommand, initAlwaysOnline };
