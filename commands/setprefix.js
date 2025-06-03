// commands/setprefix.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js'); // Pastikan ini diimpor

module.exports = {
    name: 'setprefix',
    description: 'Mengatur prefix bot untuk server ini.',
    category: '<:icons8settings512:1379424669559554122>Utilitas',
    aliases: ['prefix'],
    usage: '<input>', // Contoh: ! . -
    async execute(message, args, client, db, lang) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setPrefixNoPermission.split('.')[0], // Mengambil bagian pertama kalimat sebagai judul
                lang.setPrefixNoPermission,
                'error'
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const newPrefix = args[0];

        if (!newPrefix) {
            const invalidEmbed = createSimpleEmbed(
                lang.setPrefixTitle,
                lang.setPrefixInvalid,
                'warning'
            );
            return message.reply({ embeds: [invalidEmbed] });
        }

        // Simpan prefix baru ke quick.db
        await db.set(`prefix_${message.guild.id}`, newPrefix);

        const successEmbed = createSimpleEmbed(
            lang.setPrefixTitle,
            lang.setPrefixDescription.replace('{0}', `\`${newPrefix}\``),
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};