/**
 * commands/song.js — YouTube to MP3 downloader (multi-API fallback chain)
 * Scotty♤C©
 */
const axios = require('axios');
const yts   = require('yt-search');
const { reply } = require('./_helper');
const { toAudio } = require('../lib/converter');

const HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':     'application/json, text/plain, */*'
};

async function tryRequest(fn, attempts = 3) {
    let lastErr;
    for (let i = 1; i <= attempts; i++) {
        try { return await fn(); } catch (e) {
            lastErr = e;
            if (i < attempts) await new Promise(r => setTimeout(r, 1000 * i));
        }
    }
    throw lastErr;
}

async function apiEliteProTech(url) {
    const res = await tryRequest(() => axios.get(`https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(url)}&format=mp3`, { timeout: 60000, headers: HEADERS }));
    if (res?.data?.success && res?.data?.downloadURL) return { download: res.data.downloadURL, title: res.data.title };
    throw new Error('No URL');
}

async function apiYupra(url) {
    const res = await tryRequest(() => axios.get(`https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 60000, headers: HEADERS }));
    if (res?.data?.success && res?.data?.data?.download_url) return { download: res.data.data.download_url, title: res.data.data.title };
    throw new Error('No URL');
}

async function apiOkatsu(url) {
    const res = await tryRequest(() => axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(url)}`, { timeout: 60000, headers: HEADERS }));
    if (res?.data?.dl) return { download: res.data.dl, title: res.data.title };
    throw new Error('No URL');
}

async function downloadBuffer(audioUrl) {
    try {
        const res = await axios.get(audioUrl, {
            responseType: 'arraybuffer', timeout: 90000,
            maxContentLength: Infinity, maxBodyLength: Infinity,
            validateStatus: s => s >= 200 && s < 400,
            headers: { 'User-Agent': HEADERS['User-Agent'], 'Accept': '*/*', 'Accept-Encoding': 'identity' }
        });
        const buf = Buffer.from(res.data);
        if (buf.length > 0) return buf;
    } catch {}

    const res = await axios.get(audioUrl, {
        responseType: 'stream', timeout: 90000,
        maxContentLength: Infinity, maxBodyLength: Infinity,
        validateStatus: s => s >= 200 && s < 400,
        headers: { 'User-Agent': HEADERS['User-Agent'], 'Accept': '*/*', 'Accept-Encoding': 'identity' }
    });
    const chunks = [];
    await new Promise((resolve, reject) => {
        res.data.on('data', c => chunks.push(c));
        res.data.on('end', resolve);
        res.data.on('error', reject);
    });
    const buf = Buffer.concat(chunks);
    if (buf.length === 0) throw new Error('Empty buffer');
    return buf;
}

module.exports = async (sock, chatId, message, args) => {
    const query = (args || []).join(' ').trim();
    if (!query) return reply(sock, chatId, '🎵 *Song Download*\n\nUsage: *.song <song name or link>*', message);

    try {
        let video;
        if (/youtube\.com|youtu\.be/.test(query)) {
            video = { url: query, title: query, timestamp: '?' };
        } else {
            const search = await yts(query);
            if (!search?.videos?.length) return reply(sock, chatId, `❌ No results for: *${query}*`, message);
            video = search.videos[0];
        }

        await sock.sendMessage(chatId, {
            text: `🎵 *Downloading:*\n${video.title || query}\n\n⏱ ${video.timestamp || '?'}\n📥 Fetching audio...`
        }, { quoted: message });

        const APIS = [
            { name: 'EliteProTech', fn: () => apiEliteProTech(video.url) },
            { name: 'Yupra',        fn: () => apiYupra(video.url) },
            { name: 'Okatsu',       fn: () => apiOkatsu(video.url) }
        ];

        let audioData = null;
        let rawBuffer = null;

        for (const api of APIS) {
            try {
                audioData = await api.fn();
                rawBuffer = await downloadBuffer(audioData.download);

                // Reject error pages disguised as audio
                const headStr = rawBuffer.toString('utf8', 0, Math.min(200, rawBuffer.length));
                if (headStr.includes('<!DOCTYPE') || headStr.includes('<html') || (headStr.trim().startsWith('{') && headStr.includes('"error"'))) {
                    rawBuffer = null;
                    throw new Error('Fake audio');
                }
                break;
            } catch (err) {
                rawBuffer = null;
            }
        }

        if (!rawBuffer || rawBuffer.length === 0) {
            return reply(sock, chatId, '❌ All APIs failed. The song might be unavailable or region-locked.', message);
        }

        const title = (audioData?.title || video.title || 'Song').replace(/[^\w\s\-()']/g, '').trim();
        let finalBuffer;
        try {
            finalBuffer = await toAudio(rawBuffer, 'ignore');
        } catch (err) {
            return reply(sock, chatId, `❌ Audio conversion failed.\n\n*Reason:* ${err.message}`, message);
        }

        await sock.sendMessage(chatId, {
            audio:    finalBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${title}.mp3`,
            ptt:      false
        }, { quoted: message });

    } catch (err) {
        await reply(sock, chatId, `❌ Error: ${err.message}`, message);
    }
};
