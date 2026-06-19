const fs   = require('fs');
const { reply, getSender, getIsOwner } = require('./_helper');

const FILE = './data/autoreact.json';

function get() {
    try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); }
    catch { return { enabled: false, mode: 'smart' }; }
}
function save(d) { fs.writeFileSync(FILE, JSON.stringify(d, null, 2)); }

// ── Emoji pools per message type ─────────────────────────────────────────────
const EMOJI_MAP = {
    image:    ['😍','🔥','💯','👀','🤩','😮','💥','🫶'],
    video:    ['🎬','🔥','👀','🤩','🎥','💯','😲','🍿'],
    audio:    ['🎵','🎶','🎧','🔊','🎤','🎼','💃','🕺'],
    sticker:  ['😂','💀','🤣','😭','👏','🫡','🤙','💅'],
    document: ['📄','📎','📂','🗂️','📋','📑','🔖','✅'],
    reaction: ['🫂','❤️','🥰','😌','😇','🙏','💫','✨'],
    text:     ['❤️','🔥','💯','😂','👏','🤙','💪','🫡','⚡','👑','😎','🙌'],
    default:  ['❤️','🔥','💯','👏','⚡','🤙','😎','💥']
};

function pickEmoji(message) {
    const msg = message.message || {};
    let pool;
    if      (msg.imageMessage)        pool = EMOJI_MAP.image;
    else if (msg.videoMessage)        pool = EMOJI_MAP.video;
    else if (msg.audioMessage || msg.pttMessage) pool = EMOJI_MAP.audio;
    else if (msg.stickerMessage)      pool = EMOJI_MAP.sticker;
    else if (msg.documentMessage)     pool = EMOJI_MAP.document;
    else if (msg.reactionMessage)     pool = EMOJI_MAP.reaction;
    else if (msg.conversation || msg.extendedTextMessage) pool = EMOJI_MAP.text;
    else                              pool = EMOJI_MAP.default;
    return pool[Math.floor(Math.random() * pool.length)];
}

// ── Exported trigger — called from main.js on every message ──────────────────
async function runAutoReact(sock, message) {
    try {
        // ✅ Skip bot's own messages and reaction messages to prevent infinite loop
        if (message.key.fromMe) return;
        if (message.message?.reactionMessage) return;

        const d = get();
        if (!d.enabled) return;
        const emoji = pickEmoji(message);
        await sock.sendMessage(message.key.remoteJid, {
            react: { text: emoji, key: message.key }
        });
    } catch {}
}

// ── Command handler — .autoreact on/off/status ────────────────────────────────
module.exports = async (sock, chatId, message, args) => {
    const sender = getSender(sock, message);
    if (!await getIsOwner(sock)(sender, sock, chatId))
        return reply(sock, chatId, '❌ Owner only.', message);

    const d   = get();
    const sub = args[0]?.toLowerCase();

    if (!sub) {
        return reply(sock, chatId,
            `⚡ *Auto-React*\nStatus: ${d.enabled ? '✅ ON' : '❌ OFF'}\nMode: Smart (by message type)\n\n` +
            `*.autoreact on* — enable\n` +
            `*.autoreact off* — disable\n\n` +
            `_Reacts with different emojis based on what was sent_`,
            message
        );
    }
    if (sub === 'on')  { save({ ...d, enabled: true  }); return reply(sock, chatId, '✅ Auto-react *ON* — smart emoji mode active ⚡', message); }
    if (sub === 'off') { save({ ...d, enabled: false }); return reply(sock, chatId, '❌ Auto-react *OFF*', message); }
};

module.exports.runAutoReact = runAutoReact;
