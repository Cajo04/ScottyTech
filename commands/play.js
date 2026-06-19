/**
 * .play — YouTube to MP3
 * Chain: drexapp /yta → drexapp /ytmp3 → DavidCyril → Malvin
 * Scotty♤C©
 */
const yts      = require('yt-search');
const axios    = require('axios');
const settings = require('../settings');
const { reply } = require('./_helper');

const DREX   = 'https://api.drexapp.space';
const DAVID  = settings.DAVID_API  || 'https://apis.davidcyril.name.ng';
const MALVIN = settings.MALVIN_API || 'https://api.malvin.gleeze.com';
const MKEY   = settings.MALVIN_KEY || '';

async function get(url, params = {}, timeout = 30000) {
    const { data } = await axios.get(url, { params, timeout, headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }});
    return data;
}

// ── API 1: drexapp /yta ───────────────────────────────────────────────────
// Example: https://api.drexapp.space/downloader/yta?q=Faded
async function tryDrexYta(videoUrl) {
    const data = await get(`${DREX}/downloader/yta`, { q: videoUrl });
    if (!data?.status || !data?.result) throw new Error('drex /yta no result');
    const res = data.result;
    const url = res.dl_url || res.url || res.audio || res.link;
    if (!url) throw new Error('drex /yta no url');
    return { url, title: res.title, duration: res.duration, size: res.size };
}

// ── API 2: drexapp /ytmp3 ─────────────────────────────────────────────────
async function tryDrexYtmp3(videoUrl) {
    const data = await get(`${DREX}/downloader/ytmp3`, { q: videoUrl });
    const res  = data?.result || data;
    const url  = res?.dl_url || res?.url || res?.audio || res?.link;
    if (!url) throw new Error('drex /ytmp3 no url');
    return { url, title: res?.title, duration: res?.duration, size: res?.size };
}

// ── API 3: DavidCyril ─────────────────────────────────────────────────────
async function tryDavid(query) {
    const data = await get(`${DAVID}/download/song`, { query });
    const r    = data?.result || data;
    const url  = r?.audio?.download_url || r?.audio?.url || r?.audio || r?.download_url || r?.url;
    if (!url) throw new Error('david no url');
    return { url, title: r?.title || r?.name || query };
}

// ── API 4: Malvin ─────────────────────────────────────────────────────────
async function tryMalvin(videoUrl) {
    const data = await get(`${MALVIN}/download/ytmp3`, { url: videoUrl, quality: '128k', apikey: MKEY });
    const url  = data?.download || data?.url || data?.link || data?.audio;
    if (!url) throw new Error('malvin no url');
    return { url, title: data?.title };
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

        // ── Try each API in order ─────────────────────────────────────────
        let result = null;
        const errors = [];

        for (const [name, fn] of [
            ['drexapp /yta',   () => tryDrexYta(videoUrl)],
            ['drexapp /ytmp3', () => tryDrexYtmp3(videoUrl)],
            ['DavidCyril',     () => tryDavid(query)],
            ['Malvin',         () => tryMalvin(videoUrl)],
        ]) {
            try {
                result = await fn();
                console.log(`[play] ✅ ${name} succeeded`);
                break;
            } catch (e) {
                console.warn(`[play] ❌ ${name} failed: ${e.message}`);
                errors.push(`${name}: ${e.message}`);
            }
        }

        if (!result?.url) throw new Error('All APIs failed:\n' + errors.join('\n'));

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
