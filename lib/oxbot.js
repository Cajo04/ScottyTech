/**
 * lib/oxbot.js — OxBot Download API client
 * Docs: https://lecay.oxbot.name.ng/docs.php
 * Supports: TikTok, Instagram, Facebook, Twitter/X, LinkedIn
 * Scotty♤C©
 */
const axios    = require('axios');
const settings = require('../settings');

const OXBOT_KEY  = settings.OXBOT_KEY;
const OXBOT_BASE = settings.OXBOT_API;

// Step 1: fetch metadata (title, platform, uploader, duration...)
async function oxbotInfo(url) {
    const { data } = await axios.get(`${OXBOT_BASE}/download.php`, {
        params:  { api_key: OXBOT_KEY, url },
        timeout: 20000
    });
    if (!data?.ok) {
        const err = new Error(data?.error || 'Could not fetch that link.');
        err.code  = data?.error_code;
        throw err;
    }
    return data;
}

// Step 2: stream the actual file through OxBot's yt-dlp proxy (bypasses CDN 403s)
async function oxbotStream(url, filename) {
    const res = await axios.get(`${OXBOT_BASE}/stream.php`, {
        params:       { api_key: OXBOT_KEY, video_url: url, filename },
        responseType: 'arraybuffer',
        timeout:      180000 // yt-dlp needs time server-side
    });

    const contentType = res.headers['content-type'] || '';
    if (contentType.includes('application/json')) {
        const err = JSON.parse(Buffer.from(res.data).toString());
        throw new Error(err.error || 'Download failed.');
    }
    return Buffer.from(res.data);
}

// Convenience: metadata + file buffer in one call
async function oxbotDownload(url, filename = 'video') {
    const meta   = await oxbotInfo(url);
    const buffer = await oxbotStream(url, filename);
    return { ...meta, buffer };
}

module.exports = { oxbotInfo, oxbotStream, oxbotDownload, OXBOT_KEY, OXBOT_BASE };
