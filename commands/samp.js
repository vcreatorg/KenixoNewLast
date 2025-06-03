// commands/setprefix.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js'); // Pastikan ini diimpor
const { getBorderCharacters, table } = require('table');
const query = require('samp-query');

module.exports = {
    name: 'samp',
    description: 'Mengetahui info server SA:MP.',
    category: '<:gta:1379420280463687731>SA:MP',
    aliases: ['samp'],
    usage: '<ip:port>', // Contoh: ! . -
    async execute(message, args, client, db, lang) {

        const split = args.join(" ").split(":");

        if (!split[0]) {
            const invalidEmbed = createSimpleEmbed(
                lang.setLangInvTitle,
                lang.setLangInvDescription,
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }
        if (!split[1]) {
            const invalidEmbed = createSimpleEmbed(
                lang.setLangInvTitle,
                lang.setLangInvDescription,
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        var options = {
            host: split[0],
            port: split[1]
        }

        /*const loadingEmbed = createSimpleEmbed(
            "Mencari Server SA:MP...",
            `Mencoba terhubung ke \`${options.host}:${options.port}\`...`,
            'info'
        );*/
        //const sentMessage = await message.reply({ embeds: [loadingEmbed] });
        
        query(options, function (error, response) {
            if(error) {
                if (error.code === 'ENOTFOUND' || error.code === 'EHOSTUNREACH')
                {
                    const err1Embed = createSimpleEmbed(
                        lang.sampInvalidTitle,
                        lang.sampInvalidIp,
                        'error'
                    );
                    return message.reply({ embeds: [err1Embed] });
                } else {
                    const errEmbed = createSimpleEmbed(
                        lang.sampInvalidTitle,
                        lang.sampInvalidDescription.replace(/\{0\}/g, `${split[0]}:${split[1]}`),
                        'error'
                    );
                    return message.reply({ embeds: [errEmbed] });
                }

            } else {
                const yesno = {
                    true: "Yes",
                    false: "No"
                }
                let playersDescription = '';
                // Asumsi: response.players adalah array objek seperti [{id: 0, name: "Player1", score: 100, ping: 50}, ...]
                if (response.players && Array.isArray(response.players) && response.players.length > 0) {
                    const playersToShow = response.players.slice(0, 10); // <-- Perubahan ada di sini
                    const totalPlayersOnline = response.players.length; // Jumlah total pemain online
                    // Tentukan lebar kolom maksimum untuk ID, Nama, Skor, Ping
                    const maxIdLength = Math.max(...response.players.map(p => String(p.id).length), 2); // minimal 2 untuk "ID"
                    const maxNameLength = Math.max(...response.players.map(p => p.name.length), 14); // minimal 14 untuk "Name"
                    const maxScoreLength = Math.max(...response.players.map(p => String(p.score).length), 5); // minimal 5 untuk "Score"
                    const maxPingLength = Math.max(...response.players.map(p => String(p.ping).length), 4); // minimal 4 untuk "Ping"

                    // Header Tabel Pemain
                    const header = `${String('ID').padEnd(maxIdLength)} ${String('Name').padEnd(maxNameLength)} ${String('Score').padEnd(maxScoreLength)} ${String('Ping').padEnd(maxPingLength)}`;
                    let playersTitleText = `${lang.sampPlayersTitle.replace('{0}', totalPlayersOnline)}`;
                    if (totalPlayersOnline > 10) {
                        playersTitleText += ` (menampilkan 1-${playersToShow.length})`; // Sesuaikan dengan bahasa Anda
                    }
                    playersDescription += `\n**${playersTitleText}**\n`;
                    playersDescription += `\`\`\`\n${header}\n`;
                    playersDescription += `${'-'.repeat(header.length)}\n`;

                    // Isi Tabel Pemain
                    playersToShow.forEach(player => {
                        const id = String(player.id).padEnd(maxIdLength);
                        const name = player.name.padEnd(maxNameLength);
                        const score = String(player.score).padEnd(maxScoreLength);
                        const ping = String(player.ping).padEnd(maxPingLength);
                        playersDescription += `${id} ${name} ${score} ${ping}\n`;
                    });
                    playersDescription += `\`\`\``;
                } else {
                    playersDescription = `\n${lang.sampNoPlayers}\n`;
                }
                const data = [
                    { label: 'Gamemode', value: response.gamemode },
                    { label: 'Online', value: `${response.online} / ${response.maxplayers}` },
                    { label: 'Passworded', value: yesno[response.passworded] },
                    { label: 'Mapname', value: response.rules.mapname || `-` },
                    { label: 'Version', value: response.rules.version || `-` },
                    { label: 'World time', value: response.rules.worldtime || `-` },
                    { label: 'Weather', value: response.rules.weather || `-` },
                    { label: 'Lagcomp', value: yesno[response.rules.lagcomp] || `-` },
                    { label: 'Website', value: response.rules.weburl || `-` }
                ];

                const maxLabelLength = Math.max(...data.map(item => item.label.length));

                let description = '';
                data.forEach(item => {
                    // Padding label dengan spasi agar rata
                    const paddedLabel = item.label.padEnd(maxLabelLength, ' ');
                    description += `${paddedLabel}: ${item.value}\n`;
                });

                const successEmbed = createSimpleEmbed(
                    `${response.hostname}`,
                    `\`\`\`\n${description}\`\`\`\n` + playersDescription,
                    'success',
                    'https://i.imgur.com/QYeGxrV.png'
                );
                message.reply({ embeds: [successEmbed] });
            }
        })
    },
};