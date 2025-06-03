// commands/playersfivem.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { GameDig } = require('gamedig'); // Impor pustaka gamedig

// Fungsi untuk membagi array menjadi bagian-bagian (halaman)
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Fungsi untuk membuat embed pemain FiveM untuk halaman tertentu
function createFivemPlayersEmbed(players, pageIndex, totalPages, serverName, lang, botIcon) {
    const playersOnPage = players[pageIndex];
    const totalPlayersOnline = players.flat().length;

    // Tentukan lebar kolom maksimum untuk ID, Nama, Skor, Ping
    const maxIdLength = Math.max(...playersOnPage.map((p, idx) => String(idx + (pageIndex * 10)).length), 2);
    const maxNameLength = Math.max(...playersOnPage.map(p => p.name.length), 14);
    // PERBAIKAN: Akses score dan ping dari player.raw
    const maxScoreLength = Math.max(...playersOnPage.map(p => String(p.raw.score || '-').length), 5);
    const maxPingLength = Math.max(...playersOnPage.map(p => String(p.raw.ping || '-').length), 4);

    const header = `${String('ID').padEnd(maxIdLength)} ${String('Name').padEnd(maxNameLength)} ${String('Score').padEnd(maxScoreLength)} ${String('Ping').padEnd(maxPingLength)}`;
    let playerList = `\`\`\`\n${header}\n${'-'.repeat(header.length)}\n`;

    playersOnPage.forEach((player, idx) => {
        const id = String(idx + (pageIndex * 10)).padEnd(maxIdLength);
        const name = player.name.padEnd(maxNameLength);
        // PERBAIKAN: Akses score dan ping dari player.raw
        const score = String(player.raw.score || '-').padEnd(maxScoreLength); // Gunakan '-' jika undefined
        const ping = String(player.raw.ping || '-').padEnd(maxPingLength); // Gunakan '-' jika undefined
        playerList += `${id} ${name} ${score} ${ping}\n`;
    });
    playerList += `\`\`\``;

    const embed = createSimpleEmbed(
        lang.fivemPlayersTitle.replace('{0}', serverName).replace('{1}', pageIndex + 1).replace('{2}', totalPages),
        `${playerList}\n\nTotal ${lang.fivemPlayersOnline}: ${totalPlayersOnline}`,
        'info',
        'https://media.discordapp.net/attachments/941653687036698644/1379403346971983942/icons8-fivem-480.png?ex=68401cf9&is=683ecb79&hm=14713823f06e6693c484fa6998083b409538612788e0efdf2ee0968bef808555&=&format=webp&quality=lossless'
    );
    return embed;
}

module.exports = {
    name: 'playersfivem',
    description: 'Menampilkan daftar pemain dari server FiveM default dengan paginasi.',
    category: '<:icons8fivem480:1379420283869462580>FiveM',
    aliases: ['fmplayers', 'fmlist'],
    usage: '',
    async execute(message, args, client, db, lang, currentPrefix) {

        // Ambil IP dan Port default dari database FiveM
        const host = await db.get(`fivem_default_ip_${message.guild.id}`);
        const port = await db.get(`fivem_default_port_${message.guild.id}`);

        if (!host || !port) {
            const noIpSetEmbed = createSimpleEmbed(
                lang.setFivemIpTitle,
                lang.fivemPlayersNoDefaultIp.replace(/\{0\}/g, currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [noIpSetEmbed] });
        }

        // Kirim pesan "loading"
        const loadingEmbed = createSimpleEmbed(
            lang.fivemPlayersLoading.replace('{0}', host).replace('{1}', port),
            `Mencoba mengambil daftar pemain dari \`${host}:${port}\`...`,
            'info'
        );
        const sentMessage = await message.reply({ embeds: [loadingEmbed] });

        GameDig.query({
            type: 'gta5f', // Tipe game FiveM
            host: host,
            port: port
        }).then( async function (state) {
            if (!state.players || !Array.isArray(state.players) || state.players.length === 0) {
                const noPlayersEmbed = createSimpleEmbed(
                    lang.fivemPlayersTitle.replace('{0}', state.name || `${host}:${port}`).replace('{1}', 1).replace('{2}', 1),
                    lang.fivemNoPlayersOnline,
                    'info'
                );
                return sentMessage.edit({ embeds: [noPlayersEmbed] });
            }

            const pages = chunkArray(state.players, 10); // 10 pemain per halaman
            let currentPageIndex = 0;
            const totalPages = pages.length;

            const getButtons = (currentPage, total) => {
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous_page_fivem') // Custom ID yang unik
                            .setLabel(lang.buttonPrevious)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === 0),
                        new ButtonBuilder()
                            .setCustomId('next_page_fivem') // Custom ID yang unik
                            .setLabel(lang.buttonNext)
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(currentPage === total - 1)
                    );
                return row;
            };

            const initialEmbed = createFivemPlayersEmbed(pages, currentPageIndex, totalPages, state.name || `${host}:${port}`, lang);
            const replyMessage = await sentMessage.edit({
                embeds: [initialEmbed],
                components: [getButtons(currentPageIndex, totalPages)]
            });

            const collector = replyMessage.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 60000,
            });

            collector.on('collect', async (i) => {
                if (i.customId === 'previous_page_fivem') {
                    currentPageIndex--;
                } else if (i.customId === 'next_page_fivem') {
                    currentPageIndex++;
                }

                const newEmbed = createFivemPlayersEmbed(pages, currentPageIndex, totalPages, state.name || `${host}:${port}`, lang);
                await i.update({
                    embeds: [newEmbed],
                    components: [getButtons(currentPageIndex, totalPages)]
                });
            });

            collector.on('end', async () => {
                const disabledButtonsRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('previous_page_fivem_disabled')
                            .setLabel(lang.buttonPrevious)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('next_page_fivem_disabled')
                            .setLabel(lang.buttonNext)
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );
                try {
                    await replyMessage.edit({ components: [disabledButtonsRow] });
                } catch (err) {
                    console.error('Could not disable FiveM players buttons:', err);
                }
            });
        }).catch((error) => {
            let errorTitle = lang.fivemPlayersError.split('.')[0] || 'Error';
            let errorMessage = lang.fivemPlayersError.replace('{0}', host).replace('{1}', port);

            if (error.message.includes('No response') || error.message.includes('Timeout')) {
                errorTitle = lang.fivemHostNotFound.split('.')[0] || 'Server Not Found';
                errorMessage = lang.fivemHostNotFound.replace('{0}', host).replace('{1}', port);
            }
            console.error('FiveM Players Query Error:', error);

            const errorEmbed = createSimpleEmbed(
                errorTitle,
                errorMessage,
                'error'
            );
            return sentMessage.edit({ embeds: [errorEmbed] });
        });
    },
};