/**
 * Audio converter — uses ffmpeg via spawn
 * Fixed for ScottyC: writes temp files to ./temp (created by main.js)
 * Scotty♤C©
 */
const fs   = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Use ./temp which main.js guarantees exists
const TEMP_DIR = path.join(process.cwd(), 'temp');

function ensureTemp() {
    if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function ffmpegConvert(buffer, args = [], inExt = '', outExt = '') {
    return new Promise(async (resolve, reject) => {
        try {
            ensureTemp();
            const base = path.join(TEMP_DIR, `conv_${Date.now()}_${Math.random().toString(36).slice(2)}`);
            const tmpIn  = `${base}.${inExt}`;
            const tmpOut = `${base}.${outExt}`;

            await fs.promises.writeFile(tmpIn, buffer);

            const proc = spawn('ffmpeg', [
                '-y',
                '-i', tmpIn,
                ...args,
                tmpOut
            ]);

            let stderr = '';
            proc.stderr.on('data', d => { stderr += d.toString(); });

            proc.on('error', async (err) => {
                try { await fs.promises.unlink(tmpIn); } catch {}
                reject(new Error(`ffmpeg spawn error: ${err.message}`));
            });

            proc.on('close', async (code) => {
                try { await fs.promises.unlink(tmpIn); } catch {}
                if (code !== 0) {
                    try { await fs.promises.unlink(tmpOut); } catch {}
                    return reject(new Error(`ffmpeg exited ${code}: ${stderr.slice(-200)}`));
                }
                try {
                    const out = await fs.promises.readFile(tmpOut);
                    await fs.promises.unlink(tmpOut);
                    resolve(out);
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Convert any audio buffer to MP3
 * @param {Buffer} buffer - input audio buffer
 * @param {string} ext    - input format extension (mp3, m4a, ogg, wav, etc)
 * @returns {Promise<Buffer>} mp3 buffer
 */
function toAudio(buffer, ext) {
    return ffmpegConvert(buffer, [
        '-vn',
        '-ac', '2',
        '-b:a', '128k',
        '-ar', '44100',
        '-f', 'mp3'
    ], ext, 'mp3');
}

/**
 * Convert any audio buffer to OGG Opus (WhatsApp voice note)
 * @param {Buffer} buffer
 * @param {string} ext
 * @returns {Promise<Buffer>}
 */
function toVoice(buffer, ext) {
    return ffmpegConvert(buffer, [
        '-vn',
        '-c:a', 'libopus',
        '-b:a', '128k',
        '-ar', '48000',
        '-f', 'ogg'
    ], ext, 'ogg');
}

module.exports = { toAudio, toVoice, ffmpegConvert };
