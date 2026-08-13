/**
 * Scotty♤C — KingVon Style Menu
 * Scotty_C©
 */
const os = require('os');
const settings = require('../settings');
const { reply, getSender } = require('./_helper');

function formatUptime(ms) {
    const s = Math.floor(ms / 1000), d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600), mn = Math.floor((s % 3600) / 60), sc = s % 60;
    if (d > 0) return `${d}d ${h}h ${mn}m`;
    if (h > 0) return `${h}h ${mn}m ${sc}s`;
    return `${mn}m ${sc}s`;
}

const MENU_CATEGORIES = [
    {
        icon: '🫧', name: 'ɢᴇɴᴇʀᴀʟ',
        cmds: ['help','menu','ping','alive','uptime','runtime','owner','repo','pair',
               'session','deviceinfo','disk','botstatus','time','today','age',
               'whoami','setbotname','setprefix','qr','weather','wiki','news',
               'define','define2','urban','country','github','currency','remind',
               'encode','decode','reverse','upper','lower','calc','translate',
               'translate2','tinyurl','ssweb','browse','say','fancy','fliptext',
               'texttopdf','genpass','password','myip','tempmail']
    },
    {
        icon: '🫧', name: 'ᴅᴏᴡɴʟᴏᴀᴅs',
        cmds: ['song','music','song2','play','play2','ytmp3','ytmp3dl','ytmp4','ytmp4dl',
               'ytplay','ytv','yta','video','tiktok','tiktokaudio','tiktok2',
               'instagram','twitter','facebook','fb','fbvideo','fbdl2','linkedin','spotify',
               'spotifydl','scdl','pinterest','mediafire','terabox','apk',
               'gitclone','savestatus','image','pin','snackvideo']
    },
    {
        icon: '🫧', name: 'ɢʀᴏᴜᴘ',
        cmds: ['kick','kickall','kickinactive','promote','demote','add','ban','unban',
               'mute','unmute','lock','unlock','warn','warnings','clearwarn','listwarn',
               'setwarn','resetwarn','del','tagall','hidetag','tagadmin','groupinfo',
               'admins','totalmembers','resetlink','invite','setwelcome','setgoodbye',
               'welcome','goodbye','antilink','antispam','poll','topmembers',
               'groupid','open','close','link']
    },
    {
        icon: '🫧', name: 'ᴀɪ & ᴄʜᴀᴛ',
        cmds: ['ai','deepseek','dsai','chatbot','tts','ocr']
    },
    {
        icon: '🫧', name: 'ᴀᴜᴅɪᴏ ғx',
        cmds: ['tomp3','toaudio','tovideo','bass','robot','earrape','deep',
               'voiceai','blown','toptt','volaudio','volvideo']
    },
    {
        icon: '🫧', name: 'ᴍᴇᴅɪᴀ ᴛᴏᴏʟs',
        cmds: ['sticker','steal','toimg','tourl','toviewonce','tostatus',
               'vv','vv2','remini','removebg','wallpaper','profile','getdp',
               'emojimix','stickermeme']
    },
    {
        icon: '🫧', name: 'ғᴜɴ & ɢᴀᴍᴇs',
        cmds: ['joke','dadjoke','funfact','fact','quote','motivate','advice',
               '8ball','8ball2','woof','flip','dice','choose','roast','insult',
               'compliment','compliment2','ship','love','rate','rizz','pickup',
               'truth','dare','truthordare','zodiac','horoscope','tictactoe',
               'trivia','memes','wouldyourather','confession','hack','cashapp',
               'slot','rps','mathquiz','xxqc','animereact','animeimg','animesearch']
    },
    {
        icon: '🫧', name: 'sᴇᴀʀᴄʜ',
        cmds: ['google','gsearch','gimage','yts','shazam','imdb','lyrics',
               'tenor','spotifysearch','pixabay','tiktoksearch']
    },
    {
        icon: '🫧', name: 'ᴛᴇxᴛ ᴇғғᴇᴄᴛs',
        cmds: ['styletext','aesthetic','bold','italic','fliptext']
    },
    {
        icon: '🫧', name: 'ʀᴇʟɪɢɪᴏɴ',
        cmds: ['bible','quran']
    },
    {
        icon: '🫧', name: 'ᴏᴡɴᴇʀ / sᴇᴛᴛɪɴɢs',
        cmds: ['mode','public','private','anticall','antidelete','antiviewonce',
               'autoreact','autoread','autosavestatus','autoviewstatus','alwaysonline','lastseen',
               'readreceipts','freezelastseen','setpp','setbio','setname',
               'react','online','restart','tostatus','toviewonce','join','leave',
               'block','unblock','unblockall','dm','groupid','afk','bc','broadcast']
    },
];

module.exports = async (sock, chatId, message) => {
    const uptime  = formatUptime(Date.now() - (global.botStartTime || Date.now()));
    const totalCmds = MENU_CATEGORIES.reduce((a, c) => a + c.cmds.length, 0);
    const prefix  = settings.prefix;

    let out = `╭═══〘 *${settings.botName}* 〙═══⊷\n`;
    out += `┃✦╭─────────\n`;
    out += `┃✦│🫧 ᴘʀᴇғɪx : ${prefix}\n`;
    out += `┃✦│🫧 ᴄᴍᴅs   : ${totalCmds}+\n`;
    out += `┃✦│🫧 ᴅᴇᴠ    : Scotty\n`;
    out += `┃✦│🫧 ᴜᴘᴛɪᴍᴇ : ${uptime}\n`;
    out += `┃✦│🫧 ɴᴏᴅᴇ   : ${process.version}\n`;
    out += `┃✦╰─────────\n`;
    out += `╰══════════════⊷\n`;

    for (const cat of MENU_CATEGORIES) {
        out += `\n╭════〘 ${cat.icon} ${cat.name} 〙════⊷\n`;
        for (const cmd of cat.cmds) {
            out += `┃✦│ .${cmd}\n`;
        }
        out += `┃✦╰──────────❍\n`;
        out += `╰═══════════════⊷\n`;
    }

    out += `\n📢 *Channel:* ${settings.CHANNEL_LINK}\n`;
    out += `\n©Copyright Scotty — Scotty♤C v4.0\n_Scotty♤C© — Always On, Always Ready_`;

    try {
        await sock.sendMessage(chatId, {
            image:   { url: settings.BOT_IMG },
            caption: out
        }, { quoted: message });
    } catch {
        await sock.sendMessage(chatId, { text: out }, { quoted: message });
    }
};
