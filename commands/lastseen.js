const { reply, getSender, getIsOwner } = require('./_helper');

module.exports = async (sock, chatId, message, args) => {
    const sender = getSender(sock, message);
    if (!await getIsOwner(sock)(sender, sock, chatId)) return reply(sock, chatId, '❌ Owner only.', message);

    const valid = ['all', 'contacts', 'contact_blacklist', 'none'];
    const sub = args[0]?.toLowerCase();

    if (!sub || !valid.includes(sub)) {
        return reply(sock, chatId, '❌ Usage: .lastseen all / contacts / contact_blacklist / none', message);
    }

    try {
        await sock.updateLastSeenPrivacy(sub);
        await reply(sock, chatId, `✅ Last seen set to: *${sub}*`, message);
    } catch (e) {
        await reply(sock, chatId, `❌ Failed: ${e?.message || 'Unknown error'}`, message);
    }
};