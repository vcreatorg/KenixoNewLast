// commands/setfivem.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setfivem',
    description: 'Mengaktifkan atau menonaktifkan perintah FiveM untuk server ini.',
    category: '<:icons8fivem480:1379420283869462580>FiveM',
    aliases: ['enablefivem', 'disablefivem', 'setfm'],
    usage: '<on|off>', // Contoh: !setfivem on
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator (gunakan string bahasa yang sudah ada)
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setSampNoPermission.split('.')[0], // Re-use string from setSampNoPermission
                lang.setSampNoPermission,
                'error'
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const status = args[0] ? args[0].toLowerCase() : null;

        if (!status || (status !== 'on' && status !== 'off')) {
            const invalidArgEmbed = createSimpleEmbed(
                lang.setFivemTitle,
                lang.setFivemInvalidArg,
                'warning'
            );
            return message.reply({ embeds: [invalidArgEmbed] });
        }

        const isEnabled = (status === 'on');
        await db.set(`fivem_enabled_${message.guild.id}`, isEnabled);

        let responseMessage;
        if (isEnabled) {
            responseMessage = lang.setFivemEnabled;
        } else {
            responseMessage = lang.setFivemDisabled;
        }

        const successEmbed = createSimpleEmbed(
            lang.setFivemTitle,
            responseMessage,
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};