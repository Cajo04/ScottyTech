require('dotenv').config();
module.exports = {
    // ── Bot Identity ──────────────────────────────────────────────────
    botName:            process.env.BOT_NAME     || 'Scotty\u2664C',
    botOwner:           'Scotty',
    ownerNumber:        process.env.OWNER_NUMBER || '263788114185',
    prefix:             process.env.PREFIX       || '.',
    packname:           'Scotty\u2664C',
    author:             '\u00a9 Scotty',
    version:            '4.0.0',
    commandMode:        'public',
    storeWriteInterval: 10000,
    warnLimit:          3,

    // ── Bot Image (used in menu / alive / downloads) ──────────────────
    BOT_IMG: process.env.BOT_IMG || 'https://image2url.com/r2/default/images/1775559993680-0002e8ce-ab87-4349-9d60-5af0eb4dfd11.jpg',

    // ── Malvin API (primary download API) ────────────────────────────
    MALVIN_KEY: process.env.MALVIN_KEY || 'mvn_933dad9dfe2769f4e468ca6965e47c06',
    MALVIN_API: process.env.MALVIN_API || 'https://api.malvin.gleeze.com',

    // ── DavidCyril API (secondary download API) ───────────────────────
    DAVID_API: process.env.DAVID_API || 'https://apis.davidcyril.name.ng',

    // ── Links ─────────────────────────────────────────────────────────
    CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VaZGBAFLY6UdyPTRHo3Y',
    GROUP_LINK:   process.env.GROUP_LINK   || 'https://chat.whatsapp.com/invite',
};
