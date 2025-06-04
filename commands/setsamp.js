// commands/setsamp.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { Permissions } = require('discord.js');

module.exports = {
    name: 'setsamp',
    description: 'Mengaktifkan atau menonaktifkan perintah SA:MP untuk server ini.',
    category: '<:gta:1379420280463687731>SA:MP',
    aliases: ['enablesamp', 'disablesamp'],
    usage: '<on|off>', // Contoh: !setsamp on
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setSampNoPermission.split('.')[0],
                lang.setSampNoPermission,
                'error',
                lang.footerText,
                client.user.displayAvatarURL()
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const status = args[0] ? args[0].toLowerCase() : null;

        if (!status || (status !== 'on' && status !== 'off')) {
            const invalidArgEmbed = createSimpleEmbed(
                lang.setSampTitle,
                lang.setSampInvalidArg,
                'warning'
            );
            return message.reply({ embeds: [invalidArgEmbed] });
        }

        const isEnabled = (status === 'on');
        await db.set(`samp_enabled_${message.guild.id}`, isEnabled);

        let responseMessage;
        if (isEnabled) {
            responseMessage = lang.setSampEnabled;
        } else {
            responseMessage = lang.setSampDisabled;
        }

        const successEmbed = createSimpleEmbed(
            lang.setSampTitle,
            responseMessage,
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};