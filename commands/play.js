/**
 * .play — YouTube to MP3
 * Chain: Madrin YTDL
 * Scotty♤C©
 */
const yts      = require('yt-search');
const axios    = require('axios');
const settings = require('../settings');
const { reply } = require('./_helper');

const MADRIN     = 'https://api-madrin.zone.id';
const MADRIN_KEY = settings.MADRIN_KEY || 'test';

async function get(url, params = {}, timeout = 30000) {
    const { data } = await axios.get(url, { params, timeout, headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }});
    return data;
}

// ── API: Madrin YTDL ──────────────────────────────────────────────────────
// Example: https://api-madrin.zone.id/download/ytdl?apikey=test&url=...
async function tryMadrin(videoUrl) {
    const data = await get(`${MADRIN}/download/ytdl`, { apikey: MADRIN_KEY, url: videoUrl });
    const res  = data?.result || data;
    const url  = res?.dl_url || res?.download_url || res?.audio || res?.url || res?.link;
    if (!url) throw new Error('madrin no url');
    return { url, title: res?.title, duration: res?.duration, size: res?.size };
}

module.exports = async (sock, chatId, message, args) => {
    const query = args.join(' ').trim();
    if (!query) return reply(sock, chatId, '❌ Usage: .play <song name or YouTube link>', message);

    let loadingKey = null;

    try {
        const loadingMsg = await sock.sendMessage(chatId,
            { text: `🎵 Searching: *${query}*...` },
            { quoted: message }
        );
        loadingKey = loadingMsg?.key;

        // Resolve YouTube URL
        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
        let videoUrl, videoTitle;

        if (ytRegex.test(query)) {
            videoUrl   = query;
            videoTitle = query;
        } else {
            const { videos } = await yts(query);
            if (!videos?.length) throw new Error('No results found. Try a different name.');
            videoUrl   = videos[0].url;
            videoTitle = videos[0].title;
        }

        // ── Try Madrin YTDL ───────────────────────────────────────────────
        let result = null;

        try {
            result = await tryMadrin(videoUrl);
            console.log(`[play] ✅ Madrin succeeded`);
        } catch (e) {
            console.warn(`[play] ❌ Madrin failed: ${e.message}`);
            throw new Error(`Madrin API failed: ${e.message}`);
        }

        if (!result?.url) throw new Error('Madrin API returned no download URL');

        const title = result.title || videoTitle || query;

        // Delete loading msg
        if (loadingKey) {
            try { await sock.sendMessage(chatId, { delete: loadingKey }); } catch {}
        }

        // Info card
        await sock.sendMessage(chatId, {
            text:
                `🎵 *${title}*\n` +
                (result.duration ? `⏱️ ${result.duration}\n` : '') +
                (result.size     ? `📦 ${result.size}\n`     : '') +
                `⬇️ Sending...`
        }, { quoted: message });

        // Send audio via URL
        await sock.sendMessage(chatId, {
            audio:    { url: result.url },
            mimetype: 'audio/mpeg',
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            ptt:      false
        }, { quoted: message });

    } catch (e) {
        if (loadingKey) {
            try { await sock.sendMessage(chatId, { delete: loadingKey }); } catch {}
        }
        console.error('[play] fatal:', e.message);
        await reply(sock, chatId,
            `❌ Download failed. Try: *.song ${args.join(' ')}*`,
            message
        );
    }
};
