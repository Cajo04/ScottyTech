/**
 * commands/instagram.js — Instagram reel/video downloader (OxBot API)
 * Scotty♤C©
 */
const { reply } = require('./_helper');
const { oxbotDownload } = require('../lib/oxbot');

module.exports = async (sock, chatId, message, args) => {
    const url = args[0]?.trim();
    if (!url || !url.includes('instagram')) return reply(sock, chatId, '❌ Usage: .instagram <instagram URL>', message);
    await reply(sock, chatId, '📸 Downloading from Instagram...', message);
    try {
        const { title, buffer } = await oxbotDownload(url, 'instagram_video');
        await sock.sendMessage(chatId, { video: buffer, caption: `📸 *${title || 'Instagram'}*\n\n_Scotty_C©_` }, { quoted: message });
    } catch (e) {
        await reply(sock, chatId, `❌ Instagram download failed. ${e.message || 'Make sure the post is public.'}`, message);
    }
};
