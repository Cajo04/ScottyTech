/**
 * ScottyC — drexapi.js
 * APIs from api.drexapp.space
 * Commands: .woof .8ball2 .ytplay .ytmp3dl .ytmp4dl .scdl .fbdl2 .gimage .dsai
 * Scotty_C©
 */
const axios  = require('axios');
const { reply } = require('./_helper');

const BASE = 'https://api.drexapp.space';
const SIG  = '\n\n_Scotty_C©_';

// ── helper: fetch with timeout ───────────────────────────────────────────────
async function get(url, params = {}) {
    const { data } = await axios.get(url, { params, timeout: 30000 });
    return data;
}

// ── 1. WOOF — random dog image ───────────────────────────────────────────────
async function woofCmd(sock, chatId, message) {
    await reply(sock, chatId, '🐶 Fetching a doggo...', message);
    try {
        const data = await get(`${BASE}/fun/nekos/woof`);
        const url  = data?.url || data?.image || data?.result;
        if (!url) return reply(sock, chatId, '❌ No dog image returned.', message);
        await sock.sendMessage(chatId, {
            image:   { url },
            caption: '🐶 *Woof Woof!*' + SIG
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ Failed to fetch dog image.', message);
    }
}

// ── 2. 8BALL2 — magic 8-ball via drex ───────────────────────────────────────
async function eightball2Cmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .8ball2 <your question>', message);
    await reply(sock, chatId, '🎱 Asking the Magic Ball...', message);
    try {
        const data = await get(`${BASE}/fun/nekos/8ball`);
        const ans  = data?.response || data?.answer || data?.result || '...';
        await reply(sock, chatId,
            `🎱 *Magic 8-Ball*\n━━━━━━━━━━━\n❓ ${q}\n\n💬 ${ans}`,
            message
        );
    } catch {
        await reply(sock, chatId, '❌ Magic 8-ball is not responding.', message);
    }
}

// ── 3. YTPLAY — YouTube video search & play ──────────────────────────────────
async function ytplayCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .ytplay <search query>', message);
    await sock.sendMessage(chatId, { text: `🎬 Searching YouTube: *${q}*...` }, { quoted: message });
    try {
        const data = await get(`${BASE}/downloader/ytplay`, { q });
        const res  = data?.result || data;
        if (!res) return reply(sock, chatId, '❌ No results found.', message);

        // Send info first
        await reply(sock, chatId,
            `🎬 *${res.title || q}*\n` +
            `⏱️ Duration : ${res.duration || 'N/A'}\n` +
            `👁️ Views    : ${res.views || 'N/A'}\n` +
            `⬇️ Sending video...`,
            message
        );

        await sock.sendMessage(chatId, {
            video:   { url: res.dl_url || res.url },
            caption: `🎬 *${res.title || q}*` + SIG
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ YouTube play failed. Try .song or .video instead.', message);
    }
}

// ── 4. YTMP3DL — YouTube to MP3 via drex ────────────────────────────────────
async function ytmp3dlCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .ytmp3dl <song name or YT link>', message);
    await sock.sendMessage(chatId, { text: `🎵 Finding audio: *${q}*...` }, { quoted: message });
    try {
        const data = await get(`${BASE}/downloader/ytmp3`, { q });
        const res  = data?.result || data;
        if (!res?.dl_url && !res?.url) return reply(sock, chatId, '❌ Could not get audio. Try .yta instead.', message);

        await sock.sendMessage(chatId, {
            text: `🎵 *${res.title || q}*\n⏱️ ${res.duration || ''}\n📦 ${res.size || ''}\n⬇️ Downloading...`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            audio:    { url: res.dl_url || res.url },
            mimetype: 'audio/mpeg',
            fileName: `${res.title || q}.mp3`,
            ptt:      false
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ MP3 download failed. Try .yta or .song instead.', message);
    }
}

// ── 5. YTMP4DL — YouTube to MP4 via drex ────────────────────────────────────
async function ytmp4dlCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .ytmp4dl <video name or YT link>', message);
    await sock.sendMessage(chatId, { text: `🎬 Finding video: *${q}*...` }, { quoted: message });
    try {
        const data = await get(`${BASE}/downloader/ytmp4v1`, { q });
        const res  = data?.result || data;
        if (!res?.dl_url && !res?.url) return reply(sock, chatId, '❌ Could not get video. Try .video instead.', message);

        await sock.sendMessage(chatId, {
            text: `🎬 *${res.title || q}*\n⏱️ ${res.duration || ''}\n📦 ${res.size || ''}\n⬇️ Downloading...`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            video:   { url: res.dl_url || res.url },
            caption: `🎬 *${res.title || q}*` + SIG
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ MP4 download failed. Try .video instead.', message);
    }
}

// ── 6. SCDL — SoundCloud download ───────────────────────────────────────────
async function scdlCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .scdl <song name or SoundCloud link>', message);
    await sock.sendMessage(chatId, { text: `🟠 Searching SoundCloud: *${q}*...` }, { quoted: message });
    try {
        const data = await get(`${BASE}/downloader/soundcloud`, { q });
        const res  = data?.result || data;
        if (!res?.dl_url && !res?.url) return reply(sock, chatId, '❌ Track not found on SoundCloud.', message);

        await sock.sendMessage(chatId, {
            text: `🟠 *${res.title || q}*\n👤 ${res.artist || 'Unknown'}\n⏱️ ${res.duration || ''}\n⬇️ Downloading...`
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            audio:    { url: res.dl_url || res.url },
            mimetype: 'audio/mpeg',
            fileName: `${res.title || q}.mp3`,
            ptt:      false
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ SoundCloud download failed.', message);
    }
}

// ── 7. FBDL2 — Facebook video download via drex ─────────────────────────────
async function fbdl2Cmd(sock, chatId, message, args) {
    const url = args[0]?.trim();
    if (!url || !url.includes('facebook') && !url.includes('fb.watch')) {
        return reply(sock, chatId, '❌ Usage: .fbdl2 <Facebook video URL>', message);
    }
    await reply(sock, chatId, '📘 Downloading Facebook video...', message);
    try {
        const data = await get(`${BASE}/downloader/facebookv2`, { url });
        const res  = data?.result || data;
        const dlUrl = res?.hd || res?.sd || res?.dl_url || res?.url;
        if (!dlUrl) return reply(sock, chatId, '❌ Could not download. Make sure the video is public.', message);

        await sock.sendMessage(chatId, {
            video:   { url: dlUrl },
            caption: `📘 *Facebook Video*` + SIG
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ Facebook download failed. Try .facebook instead.', message);
    }
}

// ── 8. GIMAGE — Google image search ─────────────────────────────────────────
async function gimageCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .gimage <search query>', message);
    await reply(sock, chatId, `🔍 Searching images for: *${q}*...`, message);
    try {
        const data = await get(`${BASE}/search/gimage`, { q });
        const images = data?.results || data?.images || data?.result;
        const imgUrl = Array.isArray(images) ? images[0]?.url || images[0] : images?.url || images;
        if (!imgUrl) return reply(sock, chatId, '❌ No images found.', message);

        await sock.sendMessage(chatId, {
            image:   { url: imgUrl },
            caption: `🖼️ *Google Image: ${q}*` + SIG
        }, { quoted: message });
    } catch {
        await reply(sock, chatId, '❌ Image search failed. Try .image instead.', message);
    }
}

// ── 9. DSAI — DeepSeek AI via drex ──────────────────────────────────────────
async function dsaiCmd(sock, chatId, message, args) {
    const q = args.join(' ').trim();
    if (!q) return reply(sock, chatId, '❌ Usage: .dsai <your question>', message);
    await sock.sendMessage(chatId, { text: '🤖 *DrexAI* thinking...' }, { quoted: message });
    try {
        const data = await get(`${BASE}/ai/deepseek`, { q });
        const ans  = data?.result || data?.response || data?.answer || data?.message;
        if (!ans) return reply(sock, chatId, '❌ No response from AI.', message);
        await reply(sock, chatId,
            `🤖 *DrexAI*\n━━━━━━━━━━━\n❓ ${q}\n\n💬 ${ans}`,
            message
        );
    } catch {
        await reply(sock, chatId, '❌ AI unavailable. Try .ai or .deepseek instead.', message);
    }
}

module.exports = {
    woofCmd,
    eightball2Cmd,
    ytplayCmd,
    ytmp3dlCmd,
    ytmp4dlCmd,
    scdlCmd,
    fbdl2Cmd,
    gimageCmd,
    dsaiCmd
};
