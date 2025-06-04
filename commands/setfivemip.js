// commands/setfivemip.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { Permissions } = require('discord.js');

module.exports = {
    name: 'setfivemip',
    description: 'Mengatur IP dan Port default server FiveM untuk server ini.',
    category: '<:icons8fivem480:1379420283869462580>FiveM',
    aliases: ['setfivem', 'setfmip'],
    usage: '<ip:port | remove>', // Contoh: !setfivemip 127.0.0.1:30120 atau !setfivemip remove
    async execute(message, args, client, db, lang, currentPrefix) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setFivemIpNoPermission.split('.')[0],
                lang.setFivemIpNoPermission,
                'error'
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const input = args[0];

        if (!input) {
            const invalidEmbed = createSimpleEmbed(
                lang.setFivemIpTitle,
                lang.setFivemIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        if (input.toLowerCase() === 'remove') {
            await db.delete(`fivem_default_ip_${message.guild.id}`);
            await db.delete(`fivem_default_port_${message.guild.id}`);

            const removedEmbed = createSimpleEmbed(
                lang.setFivemIpTitle,
                lang.setFivemIpRemoved,
                'success'
            );
            return message.reply({ embeds: [removedEmbed] });
        }

        const splitIpPort = input.split(':');
        const ip = splitIpPort[0];
        const port = parseInt(splitIpPort[1]);

        if (!ip || !port || isNaN(port) || port < 1 || port > 65535) {
            const invalidEmbed = createSimpleEmbed(
                lang.setFivemIpTitle,
                lang.setFivemIpInvalid.replace('{0}', currentPrefix),
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        // Simpan IP dan Port ke quick.db
        await db.set(`fivem_default_ip_${message.guild.id}`, ip);
        await db.set(`fivem_default_port_${message.guild.id}`, port);

        const successEmbed = createSimpleEmbed(
            lang.setFivemIpTitle,
            lang.setFivemIpSet.replace('{0}', ip).replace('{1}', port),
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};