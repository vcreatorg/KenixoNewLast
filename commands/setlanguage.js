// commands/setlanguage.js
const { createSimpleEmbed } = require('../utils/embedBuilder');
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'setlanguage',
    description: 'Mengatur bahasa bot untuk server ini.',
    category: '<:icons8settings512:1379424669559554122>Utilitas',
    aliases: ['setlang', 'lang'],
    usage: '<id/en>', // Contoh: en, id
    async execute(message, args, client, db, lang) {
        // Periksa izin Administrator
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            const noPermsEmbed = createSimpleEmbed(
                lang.setLangNoPermission.split('.')[0], // Mengambil bagian pertama kalimat sebagai judul
                lang.setLangNoPermission,
                'error',
                lang.footerText,
                client.user.displayAvatarURL()
            );
            return message.reply({ embeds: [noPermsEmbed] });
        }

        const newLangCode = args[0] ? args[0].toLowerCase() : null;

        if (!newLangCode) {
            const availableLangs = Array.from(client.languages.keys()).join(', ');
            const infoEmbed = createSimpleEmbed(
                lang.setLangTitle,
                `${lang.setLangDescription.replace('{0}', `\`${lang.name}\``)}.\n\n${lang.setLangInvalid.replace('{0}', `\`${availableLangs}\``)}`,
                'info'
            );
            return message.reply({ embeds: [infoEmbed] });
        }

        if (!client.languages.has(newLangCode)) {
            const availableLangs = Array.from(client.languages.keys()).join(', ');
            const invalidLangEmbed = createSimpleEmbed(
                lang.setLangTitle,
                lang.setLangInvalid.replace('{0}', `\`${availableLangs}\``),
                'error'
            );
            return message.reply({ embeds: [invalidLangEmbed] });
        }

        await db.set(`lang_${message.guild.id}`, newLangCode);
        const newLang = client.languages.get(newLangCode); // Ambil objek bahasa yang baru

        const successEmbed = createSimpleEmbed(
            newLang.setLangTitle,
            newLang.setLangDescription.replace('{0}', `\`${newLangCode}\``),
            'success'
        );
        await message.reply({ embeds: [successEmbed] });
    },
};