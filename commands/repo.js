const { reply } = require('./_helper');
module.exports = async (sock, chatId, message) => {
    await reply(sock, chatId, `📦 *spidert Repository*\n━━━━━━━━━━━━\n🤖 Bot: *spider*\n📝 Version: *2.0*\n⚡ Commands: *100+*\n👤 Author: *Scotty*\n\n_Scotty_C©_`, message);
};
