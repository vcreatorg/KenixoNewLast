// commands/ping.js
const { createSimpleEmbed } = require('../utils/embedBuilder'); // Import fungsi

module.exports = {
    name: 'ping',
    description: 'Membalas dengan Pong!',
    category: '<:icons8settings512:1379424669559554122>Utilitas',
    aliases: ['p'],
    async execute(message, args, client, db, lang) {
        // Menggunakan fungsi createSimpleEmbed
        const pingEmbed = createSimpleEmbed(
            lang.pingTitle,
            lang.pingDescription.replace('{0}', client.ws.ping),
            'success',
        );

        await message.reply({ embeds: [pingEmbed] });
    },
};