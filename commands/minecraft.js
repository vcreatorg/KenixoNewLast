// commands/minecraft.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js');
const { GameDig } = require('gamedig'); // Impor pustaka gamedig

module.exports = {
    name: 'minecraft',
    description: 'Mengetahui info server Minecraft.',
    category: '<:icons8minecraftgrasscube480:1379420275925581876>Minecraft',
    aliases: ['mcinfo', 'mc'],
    usage: '<ip> <port>',
    async execute(message, args, client, db, lang, currentPrefix) {
        let host, port;
        const split = args.join(" ").split(":");

        // Logika untuk mengambil IP/Port dari argumen atau database
        if (!split[0] && split[1]) {
            host = split[0];
            port = split[1];

            if (isNaN(port) || port < 1 || port > 65565) { // Port Minecraft biasanya 25565, tapi bisa sampai 65565
                const invalidEmbed = createSimpleEmbed(
                    lang.minecraftInvalidInput.split('.')[0] || 'Invalid Input',
                    lang.minecraftInvalidInput.replace('{0}', currentPrefix),
                    'warning'
                );
                return message.reply({ embeds: [invalidEmbed] });
            }
        }

        GameDig.query({
            type: 'minecraft', // Tipe game FiveM
            host: split[0],
            port: split[1]
        }).then( async function (state) {
            const serverInfoData = [
                { label: 'Name', value: state.name || `-` },
                { label: 'Connect', value: state.connect || `${split[0]}:${split[1]}` },
                { label: lang.minecraftMOTD, value: state.raw.description.text || `-` }, // MOTD
                { label: lang.minecraftVersion, value: state.raw.version.name || state.raw.version || `-` },
                { label: lang.minecraftPlayers, value: `${state.players.length} / ${state.maxplayers}` },
                { label: 'Map', value: state.map || `-` }
            ];

            const maxLabelLength = Math.max(...serverInfoData.map(item => item.label.length));

            let description = '';
            serverInfoData.forEach(item => {
                const paddedLabel = item.label.padEnd(maxLabelLength, ' ');
                description += `${paddedLabel}: \`${item.value}\`\n`;
            });

            const successEmbed = createSimpleEmbed(
                lang.minecraftTitle.replace('{0}', state.name || `${split[0]}:${split[1]}`),
                `\`\`\`\n${description}\`\`\``,
                'success'
            );
            return message.reply({ embeds: [successEmbed] });
        }).catch((error) => {
            // Penanganan error dari Gamedig
            let errorTitle = lang.minecraftError.split('.')[0] || 'Error';
            let errorMessage = lang.minecraftError.replace('{0}', `${split[0]}:${split[1]}`);

            if (error.message.includes('No response') || error.message.includes('Timeout')) {
                errorTitle = lang.minecraftHostNotFound.split('.')[0] || 'Server Not Found';
                errorMessage = lang.minecraftHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            } else if (error.message.includes('DNS lookup failed')) { // Jika hostname tidak ditemukan
                errorTitle = lang.minecraftHostNotFound.split('.')[0] || 'IP/Host Not Found';
                errorMessage = lang.minecraftHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            }
            console.error('Minecraft Query Error:', error); // Log error lengkap untuk debugging

            const errorEmbed = createSimpleEmbed(
                errorTitle,
                errorMessage,
                'error'
            );
            return message.reply({ embeds: [errorEmbed] });
        });
    },
};