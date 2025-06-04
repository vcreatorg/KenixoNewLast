// commands/setminecraft.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { Permissions } = require('discord.js');

module.exports = {
    name: 'setminecraft',
    description: 'Mengaktifkan atau menonaktifkan perintah Minecraft untuk server ini.',
    category: '<:icons8minecraftgrasscube480:1379420275925581876>Minecraft',
    aliases: ['enableminecraft', 'disableminecraft', 'setmc'],
    usage: '<on|off>',
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator (gunakan string bahasa yang sudah ada)
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
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
                lang.setMinecraftTitle,
                lang.setMinecraftInvalidArg,
                'warning'
            );
            return message.reply({ embeds: [invalidArgEmbed] });
        }

        const isEnabled = (status === 'on');
        await db.set(`minecraft_enabled_${message.guild.id}`, isEnabled);

        let responseMessage;
        if (isEnabled) {
            responseMessage = lang.setMinecraftEnabled;
        } else {
            responseMessage = lang.setMinecraftDisabled;
        }

        const successEmbed = createSimpleEmbed(
            lang.setMinecraftTitle,
            responseMessage,
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};