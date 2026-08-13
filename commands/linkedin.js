/**
 * commands/linkedin.js — LinkedIn video post downloader (OxBot API)
 * Scotty♤C©
 */
const { reply } = require('./_helper');
const { oxbotDownload } = require('../lib/oxbot');

module.exports = async (sock, chatId, message, args) => {
    const url = args[0]?.trim();
    if (!url || !url.includes('linkedin')) return reply(sock, chatId, '❌ Usage: .linkedin <linkedin post URL>', message);
    await reply(sock, chatId, '💼 Downloading from LinkedIn...', message);
    try {
        const { title, buffer } = await oxbotDownload(url, 'linkedin_video');
        await sock.sendMessage(chatId, { video: buffer, caption: `💼 *${title || 'LinkedIn Video'}*\n\n_Scotty_C©_` }, { quoted: message });
    } catch (e) {
        await reply(sock, chatId, `❌ LinkedIn download failed. ${e.message || 'Make sure the post is public.'}`, message);
    }
};
