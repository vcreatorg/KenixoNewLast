// commands/help.js
const config = require('../config.json'); // Tetap import ini untuk fallback default prefix (jika perlu)
const { createSimpleEmbed } = require('../utils/embedBuilder');

module.exports = {
    name: 'help',
    description: 'Menampilkan semua perintah yang tersedia, dikelompokkan berdasarkan kategori, atau informasi tentang perintah tertentu.',
    category: '<:icons8general91:1379426006544416829>General',
    aliases: ['h'],
    async execute(message, args, client, db, lang, currentPrefix) { // <-- Tambahkan currentPrefix di sini
        const { commands } = client;

        if (!args.length) {
            const categorizedCommands = new Map();

            commands.forEach(command => {
                if (!command.name || !command.execute) return;
                const category = command.category || lang.helpCategoryOther;
                if (!categorizedCommands.has(category)) {
                    categorizedCommands.set(category, []);
                }
                categorizedCommands.get(category).push(`\`${command.name}\``);
            });

            let description = lang.helpListDescription.replace('{0}', currentPrefix); // <-- Gunakan currentPrefix di sini

            const sortedCategories = Array.from(categorizedCommands.keys()).sort();

            sortedCategories.forEach(category => {
                description += `**__${category}__**\n`;
                description += `${categorizedCommands.get(category).join(', ')}\n\n`;
            });

            const helpEmbed = createSimpleEmbed(
                lang.helpListTitle.replace('{0}', commands.size),
                description,
                'default'
            );

            return message.reply({ embeds: [helpEmbed] });
        }

        const name = args[0].toLowerCase();
        const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));

        if (!command || !command.name || !command.execute) {
            const notFoundEmbed = createSimpleEmbed(
                lang.helpCommandNotFound.replace('{0}', `\`${name}\``),
                lang.helpCommandNotFound.replace('{0}', `\`${name}\``) + ` ${lang.commandNotFound.replace('{0}', '').replace('{1}', currentPrefix)}`, // <-- Gunakan currentPrefix
                'error'
            );
            return message.reply({ embeds: [notFoundEmbed] });
        }

        let cmdDescription = `**${lang.helpCommandName}** ${command.name}\n`;
        if (command.aliases && command.aliases.length > 0) {
            cmdDescription += `**${lang.helpCommandAliases}** ${command.aliases.join(', ')}\n`;
        }
        if (command.category) {
            cmdDescription += `**${lang.helpCommandCategory}** ${command.category}\n`;
        }
        if (command.description) {
            cmdDescription += `**${lang.helpCommandDescription}** ${command.description}\n`;
        }
        if (command.usage) {
            cmdDescription += `**${lang.helpCommandUsage}** \`${currentPrefix}${command.name} ${command.usage}\`\n`; // <-- Gunakan currentPrefix
        }

        const specificHelpEmbed = createSimpleEmbed(
            lang.helpCommandInfoTitle.replace('{0}', command.name),
            cmdDescription,
            'info'
        );

        message.reply({ embeds: [specificHelpEmbed] });
    },
};