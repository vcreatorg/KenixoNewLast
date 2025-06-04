// commands/setip.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { Permissions } = require('discord.js');

module.exports = {
    name: 'setsampip',
    description: 'Mengatur IP dan Port default server SA:MP untuk server ini.',
    category: '<:gta:1379420280463687731>SA:MP',
    aliases: ['setipserversamp'],
    usage: '<ip:port | remove>', // Contoh: !setip 127.0.0.1:7777 atau !setip remove
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setIpNoPermission.split('.')[0],
                lang.setIpNoPermission,
                'error'
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const input = args[0];

        if (!input) {
            const invalidEmbed = createSimpleEmbed(
                lang.setIpTitle,
                lang.setIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        if (input.toLowerCase() === 'remove') {
            await db.delete(`samp_default_ip_${message.guild.id}`);
            await db.delete(`samp_default_port_${message.guild.id}`);

            const removedEmbed = createSimpleEmbed(
                lang.setIpTitle,
                lang.setIpRemoved,
                'success'
            );
            return message.reply({ embeds: [removedEmbed] });
        }

        const splitIpPort = input.split(':');
        const ip = splitIpPort[0];
        const port = parseInt(splitIpPort[1]);

        if (!ip || !port || isNaN(port)) {
            const invalidEmbed = createSimpleEmbed(
                lang.setIpTitle,
                lang.setIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        // Simpan IP dan Port ke quick.db
        await db.set(`samp_default_ip_${message.guild.id}`, ip);
        await db.set(`samp_default_port_${message.guild.id}`, port);

        const successEmbed = createSimpleEmbed(
            lang.setIpTitle,
            lang.setIpSet.replace('{0}', ip).replace('{1}', port),
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};