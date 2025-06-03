// commands/setminecraftip.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setminecraftip',
    description: 'Mengatur IP dan Port default server Minecraft untuk server ini.',
    category: '<:icons8minecraftgrasscube480:1379420275925581876>Minecraft',
    aliases: ['setmc', 'setmcip'],
    usage: '<ip:port | remove>',
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setMinecraftIpNoPermission.split('.')[0],
                lang.setMinecraftIpNoPermission,
                'error'
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const input = args[0];

        if (!input) {
            const invalidEmbed = createSimpleEmbed(
                lang.setMinecraftIpTitle,
                lang.setMinecraftIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        if (input.toLowerCase() === 'remove') {
            await db.delete(`minecraft_default_ip_${message.guild.id}`);
            await db.delete(`minecraft_default_port_${message.guild.id}`);

            const removedEmbed = createSimpleEmbed(
                lang.setMinecraftIpTitle,
                lang.setMinecraftIpRemoved,
                'success'
            );
            return message.reply({ embeds: [removedEmbed] });
        }

        const splitIpPort = input.split(':');
        const ip = splitIpPort[0];
        const port = parseInt(splitIpPort[1]);

        if (!ip || !port || isNaN(port) || port < 1 || port > 65565) { // Max port Minecraft is 65565
            const invalidEmbed = createSimpleEmbed(
                lang.setMinecraftIpTitle,
                lang.setMinecraftIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        // Simpan IP dan Port ke quick.db
        await db.set(`minecraft_default_ip_${message.guild.id}`, ip);
        await db.set(`minecraft_default_port_${message.guild.id}`, port);

        const successEmbed = createSimpleEmbed(
            lang.setMinecraftIpTitle,
            lang.setMinecraftIpSet.replace('{0}', ip).replace('{1}', port),
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};