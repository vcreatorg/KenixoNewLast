// commands/ping.js
const { createSimpleEmbed } = require('../utils/embedBuilder.js'); // Import fungsi
const { MessageActionRow, MessageButton } = require("discord.js");
const { getBorderCharacters, table } = require('table');
const paginationEmbed = require('../pagination.js');
const query = require('samp-query');
const { GameDig } = require('gamedig'); // Impor pustaka gamedig

// Fungsi untuk membagi array menjadi bagian-bagian (halaman)
function chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

function createPlayersEmbed(players, pageIndex, totalPages, serverHostname, lang, botIcon) {
    const playersOnPage = players[pageIndex];
    const totalPlayersOnline = players.flat().length;

    // Tentukan lebar kolom maksimum untuk ID, Nama, Skor, Ping
    // Gamedig player objects untuk SA:MP: {id, name, score, ping}
    const maxIdLength = Math.max(...playersOnPage.map(p => String(p.id).length), 2);
    const maxNameLength = Math.max(...playersOnPage.map(p => p.name.length), 14);
    const maxScoreLength = Math.max(...playersOnPage.map(p => String(p.score).length), 5);
    const maxPingLength = Math.max(...playersOnPage.map(p => String(p.ping).length), 4);

    const header = `${String('ID').padEnd(maxIdLength)} ${String('Name').padEnd(maxNameLength)} ${String('Score').padEnd(maxScoreLength)} ${String('Ping').padEnd(maxPingLength)}`;
    let playerList = `\`\`\`\n${header}\n${'-'.repeat(header.length)}\n`;

    playersOnPage.forEach(player => {
        const id = String(player.id).padEnd(maxIdLength);
        const name = player.name.padEnd(maxNameLength);
        const score = String(player.score).padEnd(maxScoreLength);
        const ping = String(player.ping).padEnd(maxPingLength);
        playerList += `${id} ${name} ${score} ${ping}\n`;
    });
    playerList += `\`\`\``;

    const embed = createSimpleEmbed(
        lang.playersTitle.replace('{0}', serverHostname).replace('{1}', pageIndex + 1).replace('{2}', totalPages),
        `${playerList}\n\nTotal ${lang.playersOnline}: ${totalPlayersOnline}`,
        'info',
        'https://i.imgur.com/QYeGxrV.png'

    );
    return embed;
}

module.exports = {
    name: 'playerssamp',
    description: 'Menampilkan player online SA:MP',
    category: '<:gta:1379420280463687731>SA:MP',
    aliases: ['playersamp'],
    async execute(message, args, client, db, lang, currentPrefix) {
        const host = await db.get(`samp_default_ip_${message.guild.id}`);
        const port = await db.get(`samp_default_port_${message.guild.id}`);

        if (!host || !port) {
            const noIpSetEmbed = createSimpleEmbed(
                lang.setIpTitle, // Judul dari string setIpTitle
                lang.sampNoIpSet.replace(/\{0\}/g, currentPrefix), // Gunakan string dari lang
                'warning'
            );
            return message.reply({ embeds: [noIpSetEmbed] });
        }

        GameDig.query({
            type: 'gtasam', // Tipe game FiveM
            host: host,
            port: port
        }).then( async function (state) {

            if (!state.players || !Array.isArray(state.players) || state.players.length === 0) {
                const noPlayersEmbed = createSimpleEmbed(
                    lang.playersNoPlayersOnlineT,
                    lang.playersNoPlayersOnline,
                    'error'
                );
                return message.reply({ embeds: [noPlayersEmbed] });
            }

            const pages = chunkArray(state.players, 10); // 10 pemain per halaman
            let currentPageIndex = 0;
            const totalPages = pages.length;

            const getButtons = (currentPage, total) => {
                const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('previous_page_samp') // Custom ID yang unik
                            .setLabel(lang.buttonPrevious)
                            .setStyle('PRIMARY')
                            .setDisabled(currentPage === 0),
                        new MessageButton()
                            .setCustomId('next_page_samp') // Custom ID yang unik
                            .setLabel(lang.buttonNext)
                            .setStyle('PRIMARY')
                            .setDisabled(currentPage === total - 1),
                    );
                return row;
            };

            const initialEmbed = createPlayersEmbed(pages, currentPageIndex, totalPages, state.name || `${host}:${port}`, lang);
            const replyMessage = await message.reply({
                embeds: [initialEmbed],
                components: [getButtons(currentPageIndex, totalPages)]
            });

            const collector = replyMessage.createMessageComponentCollector({
                filter: i => i.user.id === message.author.id,
                time: 60000,
            });

            collector.on('collect', async i => {
                if (i.customId === 'previous_page_samp') {
                    currentPageIndex--;
                } else if (i.customId === 'next_page_samp') {
                    currentPageIndex++;
                }

                const newEmbed = createPlayersEmbed(pages, currentPageIndex, totalPages, state.name || `${host}:${port}`, lang);
                await i.update({
                    embeds: [newEmbed],
                    components: [getButtons(currentPageIndex, totalPages)]
                });
            });

            collector.on('end', async () => {
                const disabledButtonsRow = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                            .setCustomId('previous_page_samp_disabled')
                            .setLabel(lang.buttonPrevious)
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                        new MessageButton()
                            .setCustomId('next_page_samp_disabled')
                            .setLabel(lang.buttonNext)
                            .setStyle('SECONDARY')
                            .setDisabled(true),
                    );
                try {
                    await replyMessage.edit({ components: [disabledButtonsRow] });
                } catch (err) {
                    console.error('Could not disable SA:MP players buttons:', err);
                }
            });

        }).catch( async function (error) {
        });
        /*

        // Kirim pesan "loading"
        const loadingEmbed = createSimpleEmbed(
            lang.playersLoading.replace('{0}', host).replace('{1}', port),
            `Mencoba terhubung ke \`${host}:${port}\`...`,
            'info'
        );
        const sentMessage = await message.reply({ embeds: [loadingEmbed] });

        var options = {
            host: host,
            port: port
        };

        query(options, async function (error, response) { // Tambahkan async di sini jika perlu await di dalam callback
            if (error) {
                const errorEmbed = createSimpleEmbed(
                    lang.playersNoPlayersOnlineT, // Use generic error title if not specific
                    lang.playersError.replace('{0}', host).replace('{1}', port),
                    'error'
                );
                return sentMessage.edit({ embeds: [errorEmbed] });
            } else {
                // *** PENTING: response.players HARUS ada dan berisi daftar pemain ***
                if (!response.players || !Array.isArray(response.players) || response.players.length === 0) {
                    const noPlayersEmbed = createSimpleEmbed(
                        lang.playersNoPlayersOnlineT, // Page 1/1 if no players
                        lang.playersNoPlayersOnline,
                        'success'
                    );
                    return sentMessage.edit({ embeds: [noPlayersEmbed] });
                }

                // Bagi daftar pemain menjadi halaman-halaman (10 pemain per halaman)
                const pages = chunkArray(response.players, 10);
                let currentPageIndex = 0;
                const totalPages = pages.length;

                // Buat tombol navigasi
                const getButtons = (currentPage, total) => {
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous_page')
                                .setLabel(lang.buttonPrevious)
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage === 0), // Disable jika di halaman pertama
                            new ButtonBuilder()
                                .setCustomId('next_page')
                                .setLabel(lang.buttonNext)
                                .setStyle('PRIMARY')
                                .setDisabled(currentPage === total - 1), // Disable jika di halaman terakhir
                        );
                    return row;
                };

                // Kirim embed halaman pertama dengan tombol
                const initialEmbed = createPlayersEmbed(pages, currentPageIndex, totalPages, response.hostname, lang);
                const replyMessage = await sentMessage.edit({
                    embeds: [initialEmbed],
                    components: [getButtons(currentPageIndex, totalPages)]
                });

                // Buat kolektor untuk tombol
                const collector = replyMessage.createMessageComponentCollector({
                    filter: i => i.user.id === message.author.id, // Hanya pemrakarsa yang bisa interaksi
                    time: 60000, // Kolektor aktif selama 60 detik
                });

                collector.on('collect', async i => {
                    if (i.customId === 'previous_page') {
                        currentPageIndex--;
                    } else if (i.customId === 'next_page') {
                        currentPageIndex++;
                    }

                    const newEmbed = createPlayersEmbed(pages, currentPageIndex, totalPages, response.hostname, lang);
                    await i.update({
                        embeds: [newEmbed],
                        components: [getButtons(currentPageIndex, totalPages)]
                    });
                });

                collector.on('end', async () => {
                    // Nonaktifkan tombol setelah waktu habis
                    const disabledButtonsRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('previous_page_disabled')
                                .setLabel(lang.buttonPrevious)
                                .setStyle('SECONDARY')
                                .setDisabled(true),
                            new ButtonBuilder()
                                .setCustomId('next_page_disabled')
                                .setLabel(lang.buttonNext)
                                .setStyle('SECONDARY')
                                .setDisabled(true),
                        );
                    // Coba edit pesan terakhir, bisa saja pesan sudah terhapus
                    try {
                        await replyMessage.edit({ components: [disabledButtonsRow] });
                    } catch (err) {
                        console.error('Could not disable buttons:', err);
                    }
                    message.channel.send({ content: `_${lang.buttonDisabled}_`, ephemeral: true }); // Mengirim pesan sementara ke pengguna
                });
            }
        });*/
    },
};