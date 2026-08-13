/**
 * commands/twitter.js — Twitter/X video downloader (OxBot API)
 * Scotty♤C©
 */
const { reply } = require('./_helper');
const { oxbotDownload } = require('../lib/oxbot');

module.exports = async (sock, chatId, message, args) => {
    const url = args[0]?.trim();
    if (!url || (!url.includes('twitter') && !url.includes('x.com'))) return reply(sock, chatId, '❌ Usage: .twitter <tweet URL>', message);
    await reply(sock, chatId, '🐦 Downloading from Twitter/X...', message);
    try {
        const { title, buffer } = await oxbotDownload(url, 'twitter_video');
        await sock.sendMessage(chatId, { video: buffer, caption: `🐦 *${title || 'Twitter/X Video'}*\n\n_Scotty_C©_` }, { quoted: message });
    } catch (e) {
        await reply(sock, chatId, `❌ Twitter download failed. ${e.message || 'Make sure the tweet has a video.'}`, message);
    }
};
