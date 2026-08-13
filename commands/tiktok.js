/**
 * commands/tiktok.js — TikTok downloader (OxBot API)
 * Scotty♤C©
 */
const { reply } = require('./_helper');
const { oxbotDownload } = require('../lib/oxbot');

module.exports = async (sock, chatId, message, args) => {
    const url = args[0]?.trim();
    if (!url || !url.includes('tiktok')) return reply(sock, chatId, '❌ Usage: .tiktok <tiktok URL>', message);
    await reply(sock, chatId, '⏳ Downloading TikTok...', message);
    try {
        const { title, buffer } = await oxbotDownload(url, 'tiktok_video');
        await sock.sendMessage(chatId, { video: buffer, caption: `🎵 *${title || 'TikTok Video'}*\n\n_Scotty_C©_` }, { quoted: message });
    } catch (e) {
        await reply(sock, chatId, `❌ TikTok download failed. ${e.message || 'Try again.'}`, message);
    }
};
