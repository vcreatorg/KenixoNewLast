// commands/fivem.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js');
const { GameDig } = require('gamedig'); // Impor pustaka gamedig

module.exports = {
    name: 'fivem',
    description: 'Mengetahui info server FiveM.',
    category: '<:icons8fivem480:1379420283869462580>FiveM',
    aliases: ['fiveminfo', 'fm'],
    usage: '<ip> <port>', // Contoh: !fivem 127.0.0.1 30120 atau tanpa argumen jika sudah diset default
    async execute(message, args, client, db, lang, currentPrefix) {
        const split = args.join(" ").split(":");

        // Logika untuk mengambil IP/Port dari argumen atau database
        if(!split[0] && !split[1]) {
            const invalidEmbed = createSimpleEmbed(
                lang.fivemInvalidInput.split('.')[0] || 'Invalid Input',
                lang.fivemInvalidInput.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        GameDig.query({
            type: 'gta5f', // Tipe game FiveM
            host: split[0],
            port: split[1]
        }).then((state) => {

            const serverInfoData = [
                { label: 'Name', value: state.name || `-` },
                { label: 'Connect', value: state.connect || `${host}:${port}` }, // IP:Port untuk koneksi
                { label: 'Gamemode', value: state.raw.gametype || `-` },
                { label: 'Map', value: state.map || `-` },
                { label: lang.fivemPlayersOnline, value: `${state.players.length} / ${state.maxplayers}` }, // Jumlah pemain
                { label: 'Passworded', value: state.password ? 'Yes' : 'No' },
                { label: 'Resources', value: state.raw.resources ? state.raw.resources.length : `-` }, // Jumlah resources
                { label: 'Onesync', value: state.raw.vars ? (state.raw.vars.onesync || `-`) : `-` }, // Variabel FiveM
                { label: 'Uptime', value: state.raw.upTime ? `${Math.floor(parseInt(state.raw.upTime) / 3600)}h` : `-` }, // Uptime dalam jam
                { label: 'Version', value: state.raw.version || `-` }
            ];

            const maxLabelLength = Math.max(...serverInfoData.map(item => item.label.length));

            let description = '';
            serverInfoData.forEach(item => {
                const paddedLabel = item.label.padEnd(maxLabelLength, ' ');
                description += `${paddedLabel}: ${item.value}\n`;
            });

            const successEmbed = createSimpleEmbed(
                lang.fivemTitle.replace('{0}', state.name || `${host}:${port}`),
                `\`\`\`\n${description}\`\`\``,
                'success',
                'https://media.discordapp.net/attachments/941653687036698644/1379403346971983942/icons8-fivem-480.png?ex=68401cf9&is=683ecb79&hm=14713823f06e6693c484fa6998083b409538612788e0efdf2ee0968bef808555&=&format=webp&quality=lossless'
            );
            return message.reply({ embeds: [successEmbed] });

        }).catch((error) => {
            // Penanganan error dari Gamedig
            let errorTitle = lang.fivemError.split('.')[0] || 'Error';
            let errorMessage = lang.fivemError.replace('{0}', `${split[0]}:${split[1]}`);

            // Gamedig akan melempar error dengan properti yang berbeda
            if (error.message.includes('No response')) { // Gamedig seringkali mengirim pesan ini jika server offline/timeout
                errorTitle = lang.fivemHostNotFound.split('.')[0] || 'Server Not Found';
                errorMessage = lang.fivemHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            } else if (error.message.includes('Timeout')) {
                 errorTitle = lang.fivemHostNotFound.split('.')[0] || 'Timeout';
                 errorMessage = lang.fivemHostNotFound.replace('{0}', `${split[0]}:${split[1]}`);
            }
            console.error('FiveM Query Error:', error); // Log error lengkap untuk debugging

            const errorEmbed = createSimpleEmbed(
                errorTitle,
                errorMessage,
                'error'
            );
            return message.reply({ embeds: [errorEmbed] });
        });

        /*
        try {
            // Melakukan query ke server FiveM menggunakan Gamedig
            const state = await Gamedig.query({
                type: 'gta5f', // Tipe game FiveM
                host: host,
                port: port,
                timeout: 5000 // Timeout dalam ms
            });

            // Gamedig.query() mengembalikan objek state jika berhasil
            const serverInfoData = [
                { label: 'Name', value: state.name || `-` },
                { label: 'Connect', value: state.connect || `${host}:${port}` }, // IP:Port untuk koneksi
                { label: 'Gamemode', value: state.raw.gametype || `-` },
                { label: 'Map', value: state.map || `-` },
                { label: lang.fivemPlayersOnline, value: `${state.players.length} / ${state.maxplayers}` }, // Jumlah pemain
                { label: 'Passworded', value: state.password ? 'Yes' : 'No' },
                { label: 'Resources', value: state.raw.resources ? state.raw.resources.length : `-` }, // Jumlah resources
                { label: 'Onesync', value: state.raw.vars ? (state.raw.vars.onesync || `-`) : `-` }, // Variabel FiveM
                { label: 'Uptime', value: state.raw.upTime ? `${Math.floor(parseInt(state.raw.upTime) / 3600)}h` : `-` }, // Uptime dalam jam
                { label: 'Version', value: state.raw.version || `-` }
            ];

            const maxLabelLength = Math.max(...serverInfoData.map(item => item.label.length));

            let description = '';
            serverInfoData.forEach(item => {
                const paddedLabel = item.label.padEnd(maxLabelLength, ' ');
                description += `${paddedLabel}: \`${item.value}\`\n`;
            });

            const successEmbed = createSimpleEmbed(
                lang.fivemTitle.replace('{0}', state.name || `${host}:${port}`),
                `\`\`\`\n${description}\`\`\``,
                'success'
            );
            return message.reply({ embeds: [successEmbed] });

        } catch (error) {
            // Penanganan error dari Gamedig
            let errorTitle = lang.fivemError.split('.')[0] || 'Error';
            let errorMessage = lang.fivemError.replace('{0}', `${host}:${port}`);

            // Gamedig akan melempar error dengan properti yang berbeda
            if (error.message.includes('No response')) { // Gamedig seringkali mengirim pesan ini jika server offline/timeout
                errorTitle = lang.fivemHostNotFound.split('.')[0] || 'Server Not Found';
                errorMessage = lang.fivemHostNotFound.replace('{0}', `${host}:${port}`);
            } else if (error.message.includes('Timeout')) {
                 errorTitle = lang.fivemHostNotFound.split('.')[0] || 'Timeout';
                 errorMessage = lang.fivemHostNotFound.replace('{0}', `${host}:${port}`);
            }
            console.error('FiveM Query Error:', error); // Log error lengkap untuk debugging

            const errorEmbed = createSimpleEmbed(
                errorTitle,
                errorMessage,
                'error'
            );
            return message.reply({ embeds: [errorEmbed] });
        }*/
    },
};