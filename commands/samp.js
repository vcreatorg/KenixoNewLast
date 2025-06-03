// commands/setprefix.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js'); // Pastikan ini diimpor
const { getBorderCharacters, table } = require('table');
//const query = require('samp-query');
const { GameDig } = require('gamedig');

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

        GameDig.query({
            type: 'gtasam', // Tipe game FiveM
            host: split[0],
            port: split[1]
        }).then( async function (state) {
            const yesno = {
                true: "Yes",
                false: "No"
            };
            const serverInfoData = [
                { label: 'Hostname', value: state.name || `-` },
                { label: 'Connect', value: state.connect || `${split[0]}:${split[1]}` },
                { label: 'Ping', value: state.ping || `-`},
                { label: 'Gamemode', value: state.raw.gamemode || `-` }, // Gamemode ada di raw
                { label: 'Language', value: state.raw.map || `-` },
                { label: 'Mapname', value: state.raw.rules.mapname || `-` },
                { label: 'Online', value: `${state.numplayers || '-'} / ${state.maxplayers || '-'}` }, // Players.length adalah jumlah pemain online
                { label: 'Passworded', value: yesno[state.password || false] },
                { label: 'Client', value: state.raw.rules.allowed_clients || `-`},
                { label: 'Time', value: state.raw.rules.worldtime || `-`},
                { label: 'Version', value: state.raw.rules.version || `-` }, // Versi biasanya di raw
                { label: 'Website', value: state.raw.rules.weburl || `-` } // URL web biasanya di raw
            ];

            const maxLabelLength = Math.max(...serverInfoData.map(item => item.label.length));

            let description = '';
            serverInfoData.forEach(item => {
                const paddedLabel = item.label.padEnd(maxLabelLength, ' ');
                description += `${paddedLabel}: ${item.value}\n`;
            });

            // Untuk command 'samp', kita hanya fokus menampilkan info server.
            // Daftar pemain akan ditangani oleh command 'players' terpisah (yang juga akan menggunakan gamedig).
            let playersDescription = '';

            const successEmbed = createSimpleEmbed(
                state.name || `${split[0]}:${split[1]}`,
                `\`\`\`\n${description}\`\`\`\n` + playersDescription,
                'success',
                'https://i.imgur.com/QYeGxrV.png'
            );
            await message.reply({ embeds: [successEmbed] });

        }).catch( async function (error) {
            /*
            // Penanganan error dari Gamedig
            let errorTitle = lang.sampError.split('.')[0] || 'Error';
            let errorMessage = lang.sampError.replace('{0}', `${split[0]}:${split[1]}`);

            if (error.message.includes('No response') || error.message.includes('Timeout')) {
                errorTitle = lang.sampHostNotFound.split('.')[0] || 'Server Not Found';
                errorMessage = lang.sampHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            } else if (error.message.includes('DNS lookup failed')) {
                errorTitle = lang.sampHostNotFound.split('.')[0] || 'IP/Host Not Found';
                errorMessage = lang.sampHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            }
            console.error('SA:MP Query Error (Gamedig):', error);

            const errEmbed = createSimpleEmbed(
                lang.sampInvalidTitle,
                lang.sampInvalidDescription.replace(/\{0\}/g, `${split[0]}:${split[1]}`),
                'error'
            );
            await message.reply({ embeds: [errEmbed] });*/
            console.log(error);
            if (error.message.includes('ENOTFOUND'))
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
        });
        /*
        var options = {
            host: split[0],
            port: split[1]
        }*/

        /*const loadingEmbed = createSimpleEmbed(
            "Mencari Server SA:MP...",
            `Mencoba terhubung ke \`${options.host}:${options.port}\`...`,
            'info'
        );*/
        //const sentMessage = await message.reply({ embeds: [loadingEmbed] });
        
        /*
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
        })*/
    },
};