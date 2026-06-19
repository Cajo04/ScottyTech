/**
 * ScottyC — bc.js  (Marketing Broadcast) 
 * ✅ DMs every member across all groups 1 by 1
 * ✅ Also sends to every group chat
 * ✅ Skips bots, duplicates & the bot itself
 * ✅ Owner only
 * Scotty_C©
 */

const { reply, getSender, getIsOwner } = require('./_helper');

// ─── delay helper ───────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── progress bar builder ───────────────────────────────────────────────────
function bar(done, total, size = 10) {
    const filled = Math.round((done / total) * size);
    return '█'.repeat(filled) + '░'.repeat(size - filled);
}

// ─── main command ───────────────────────────────────────────────────────────
async function bcCommand(sock, chatId, message, args) {
    const sender  = getSender(sock, message);
    const isOwner = getIsOwner(sock);

    if (!await isOwner(sender, sock, chatId)) {
        return reply(sock, chatId, '❌ Owner only command.', message);
    }

    const text = args.join(' ').trim();

    if (!text) {
        return reply(sock, chatId,
            `📢 *Marketing Broadcast*\n\n` +
            `Usage: *.bc <your message>*\n\n` +
            `What it does:\n` +
            `▸ DMs every member in all your groups\n` +
            `▸ Sends to every group chat too\n` +
            `▸ Skips duplicates automatically\n\n` +
            `Example:\n_.bc 🔥 New drop available! Check it out now_`,
            message
        );
    }

    // ── Step 1: fetch all groups ─────────────────────────────────────────────
    await reply(sock, chatId, '🔍 Scanning all groups...', message);

    let allGroups = [];
    try {
        const groupMap = await sock.groupFetchAllParticipating();
        allGroups = Object.values(groupMap);
    } catch (e) {
        return reply(sock, chatId, '❌ Failed to fetch groups: ' + e.message, message);
    }

    if (!allGroups.length) {
        return reply(sock, chatId, '❌ Bot is not in any groups.', message);
    }

    // ── Step 2: collect unique member JIDs across all groups ─────────────────
    const botJid   = (sock.user?.id || '').replace(/:\d+@/, '@').toLowerCase();
    const seenDMs  = new Set([botJid]); // never DM ourselves
    const dmQueue  = [];
    const groupIds = [];

    for (const g of allGroups) {
        groupIds.push(g.id);
        for (const p of (g.participants || [])) {
            const jid = (p.id || '').replace(/:\d+@/, '@').toLowerCase();
            if (!jid || seenDMs.has(jid)) continue;
            // skip likely bots / broadcast lists
            if (jid.includes('@broadcast') || jid.includes('@newsletter')) continue;
            seenDMs.add(jid);
            dmQueue.push(jid);
        }
    }

    const totalGroups  = groupIds.length;
    const totalMembers = dmQueue.length;
    const grandTotal   = totalGroups + totalMembers;

    await reply(sock, chatId,
        `📊 *Broadcast Summary*\n\n` +
        `👥 Unique members to DM : *${totalMembers}*\n` +
        `💬 Groups to message    : *${totalGroups}*\n` +
        `📨 Total sends          : *${grandTotal}*\n\n` +
        `⏳ Starting now... please wait.`,
        message
    );

    // ── Step 3: craft the promo message ──────────────────────────────────────
    const promoMsg = `╔══════════════════╗\n` +
                     `║  📢  BROADCAST   ║\n` +
                     `╚══════════════════╝\n\n` +
                     `${text}\n\n` +
                     `━━━━━━━━━━━━━━━━━━━━\n` +
                     `_Powered by Scotty_C©_`;

    let dmSent = 0, dmFail = 0;
    let grpSent = 0, grpFail = 0;
    let done = 0;

    // ── Step 4: DM every member 1 by 1 ───────────────────────────────────────
    for (const jid of dmQueue) {
        try {
            await sock.sendMessage(jid, { text: promoMsg });
            dmSent++;
        } catch {
            dmFail++;
        }
        done++;

        // live progress update every 20 sends
        if (done % 20 === 0) {
            await reply(sock, chatId,
                `📤 *Progress* [${bar(done, grandTotal)}]\n` +
                `${done} / ${grandTotal} sent`,
                message
            ).catch(() => {});
        }

        await sleep(1200); // 1.2s gap — safe from WA spam detection
    }

    // ── Step 5: send to every group chat ─────────────────────────────────────
    for (const gid of groupIds) {
        try {
            await sock.sendMessage(gid, { text: promoMsg });
            grpSent++;
        } catch {
            grpFail++;
        }
        done++;
        await sleep(1500); // slightly longer gap for groups
    }

    // ── Step 6: final report ─────────────────────────────────────────────────
    const successRate = Math.round(((dmSent + grpSent) / grandTotal) * 100);

    await reply(sock, chatId,
        `✅ *Broadcast Complete!*\n\n` +
        `👤 DMs\n` +
        `   ✔️ Sent   : ${dmSent}\n` +
        `   ❌ Failed : ${dmFail}\n\n` +
        `💬 Groups\n` +
        `   ✔️ Sent   : ${grpSent}\n` +
        `   ❌ Failed : ${grpFail}\n\n` +
        `📈 Success rate : *${successRate}%*\n` +
        `📨 Total reached: *${dmSent + grpSent}* people/chats`,
        message
    );
}

module.exports = { bcCommand };
