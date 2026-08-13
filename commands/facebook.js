/**
 * commands/facebook.js — Facebook video/reel downloader (OxBot API)
 * Scotty♤C©
 */
const { reply } = require('./_helper');
const { oxbotDownload } = require('../lib/oxbot');

module.exports = async (sock, chatId, message, args) => {
    const url = args[0]?.trim();
    if (!url || (!url.includes('facebook') && !url.includes('fb.watch'))) return reply(sock, chatId, '❌ Usage: .facebook <facebook video URL>', message);
    await reply(sock, chatId, '📘 Downloading from Facebook...', message);
    try {
        const { title, buffer } = await oxbotDownload(url, 'facebook_video');
        await sock.sendMessage(chatId, { video: buffer, caption: `📘 *${title || 'Facebook Video'}*\n\n_Scotty_C©_` }, { quoted: message });
    } catch (e) {
        await reply(sock, chatId, `❌ Facebook download failed. ${e.message || 'Make sure the video is public.'}`, message);
    }
};
