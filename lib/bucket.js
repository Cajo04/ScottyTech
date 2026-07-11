/**
 * lib/bucket.js — S3-compatible bucket sync for WhatsApp session persistence
 * Keeps auth sessions alive across Render sleeps / restarts / redeploys.
 * Works with Cloudflare R2, Backblaze B2, AWS S3, Supabase Storage, etc.
 * Scotty♤C©
 */
const fs     = require('fs');
const path   = require('path');
const AdmZip = require('adm-zip');
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} = require('@aws-sdk/client-s3');

const ENABLED = !!(
    process.env.S3_ENDPOINT &&
    process.env.S3_BUCKET &&
    process.env.S3_ACCESS_KEY &&
    process.env.S3_SECRET_KEY
);

const BUCKET = process.env.S3_BUCKET;
const PREFIX = 'sessions/';

let s3 = null;
if (ENABLED) {
    s3 = new S3Client({
        region:          process.env.S3_REGION || 'auto',
        endpoint:        process.env.S3_ENDPOINT,
        credentials: {
            accessKeyId:     process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_KEY,
        },
        forcePathStyle: true, // required by R2 / B2 / Supabase
    });
    console.log(`☁️  Session bucket ENABLED — ${BUCKET}`);
} else {
    console.log('☁️  Session bucket DISABLED — set S3_ENDPOINT/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY to enable persistence');
}

function sessionDirOf(phone) {
    return path.join('.', 'sessions', phone);
}

function zipFolder(dir) {
    const zip = new AdmZip();
    zip.addLocalFolder(dir);
    return zip.toBuffer();
}

function unzipToFolder(buffer, dir) {
    fs.mkdirSync(dir, { recursive: true });
    new AdmZip(buffer).extractAllTo(dir, true);
}

function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', c => chunks.push(c));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}

// ── debounced upload — creds.update fires a lot, don't hammer the bucket ───
const pending = new Map(); // phone -> timeout handle

function uploadSession(phone, delayMs = 4000) {
    if (!ENABLED) return;
    if (pending.has(phone)) clearTimeout(pending.get(phone));
    pending.set(phone, setTimeout(() => {
        pending.delete(phone);
        uploadSessionNow(phone).catch(() => {});
    }, delayMs));
}

// ── immediate upload — used on connect + shutdown (SIGTERM) ────────────────
async function uploadSessionNow(phone) {
    if (!ENABLED) return;
    const dir = sessionDirOf(phone);
    if (!fs.existsSync(dir)) return;
    try {
        const buffer = zipFolder(dir);
        await s3.send(new PutObjectCommand({
            Bucket:      BUCKET,
            Key:         `${PREFIX}${phone}.zip`,
            Body:        buffer,
            ContentType: 'application/zip',
        }));
        console.log(`☁️  Synced session → bucket: +${phone}`);
    } catch (e) {
        console.error(`☁️  Upload failed +${phone}:`, e.message);
    }
}

// ── restore a single session from the bucket ────────────────────────────────
async function downloadSession(phone) {
    if (!ENABLED) return false;
    try {
        const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}${phone}.zip` }));
        const buffer = await streamToBuffer(res.Body);
        unzipToFolder(buffer, sessionDirOf(phone));
        console.log(`☁️  Restored session ← bucket: +${phone}`);
        return true;
    } catch (e) {
        if (e.name !== 'NoSuchKey' && e.$metadata?.httpStatusCode !== 404) {
            console.error(`☁️  Download failed +${phone}:`, e.message);
        }
        return false;
    }
}

// ── list every phone that has a saved session in the bucket ────────────────
async function listBucketSessions() {
    if (!ENABLED) return [];
    try {
        const res = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX }));
        return (res.Contents || [])
            .map(o => o.Key.replace(PREFIX, '').replace(/\.zip$/, ''))
            .filter(Boolean);
    } catch (e) {
        console.error('☁️  List failed:', e.message);
        return [];
    }
}

// ── wipe a session from the bucket (on logout / 401) ────────────────────────
async function deleteBucketSession(phone) {
    if (!ENABLED) return;
    if (pending.has(phone)) { clearTimeout(pending.get(phone)); pending.delete(phone); }
    try {
        await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: `${PREFIX}${phone}.zip` }));
        console.log(`☁️  Deleted session from bucket: +${phone}`);
    } catch (e) {
        console.error(`☁️  Bucket delete failed +${phone}:`, e.message);
    }
}

module.exports = {
    ENABLED,
    uploadSession,
    uploadSessionNow,
    downloadSession,
    listBucketSessions,
    deleteBucketSession,
};
