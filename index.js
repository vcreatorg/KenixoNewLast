// index.js
const { Client, Intents, Collection, WebhookClient, ActivityType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config.json');
const { QuickDB } = require('quick.db');
const { createSimpleEmbed } = require('./utils/embedBuilder');

const hook = new WebhookClient({ url: 'https://discord.com/api/webhooks/1379406051958460426/ocI2yZMeCbhIzI4uS_JqdvzbaRnRLDn42pqoqKgBjNaZz1XVPFE3Jl_fubB7_D34wg-q' })

const db = new QuickDB();
const client = new Client({ // <-- Tambahkan 'const client =' di sini
    intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.MESSAGE_CONTENT
            // Untuk Discord.js v13, jika Anda ingin bot membaca konten pesan secara penuh,
            // dan jika bot Anda tidak di atas 100 server, Anda TIDAK PERLU Intents.FLAGS.MESSAGE_CONTENT.
            // Jika Anda ingin membaca konten pesan yang diawali dengan prefix,
            // pastikan bot Anda memiliki izin 'Read Message History' dan 'View Channel'.
            // Jika bot Anda di atas 100 server, Anda mungkin perlu mengaktifkan Privileged Intent 'MESSAGE CONTENT'
            // di Discord Developer Portal dan menambahkannya di sini.
            // Untuk contoh ini, saya akan meninggalkan Intents.FLAGS.MESSAGE_CONTENT yang dikomentari karena tidak ada di v13.
     ],
    });

client.commands = new Collection();
client.commandAliases = new Collection();
client.languages = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        if (command.aliases && Array.isArray(command.aliases)) {
            command.aliases.forEach(alias => client.commandAliases.set(alias, command.name));
        }
    } else {
        console.warn(`[WARNING] Perintah di ${filePath} kehilangan properti "name" atau "execute" yang diperlukan.`);
    }
}

// --- Pemuatan File Bahasa ---
const languagesPath = path.join(__dirname, 'languages');
const languageFiles = fs.readdirSync(languagesPath).filter(file => file.endsWith('.json'));

for (const file of languageFiles) {
    const langName = file.replace('.json', '');
    const langData = require(path.join(languagesPath, file));
    client.languages.set(langName, langData);
    console.log(`[LANGUAGE] Bahasa "${langName}" dimuat.`);
}
// --- Akhir Pemuatan File Bahasa ---

client.once('ready', () => {
    console.log(`Bot siap! Masuk sebagai ${client.user.tag}`);
    console.log(`Total perintah terdaftar: ${client.commands.size}`);

    const updateActivity = () => {
        const totalGuilds = client.guilds.cache.size;
        client.user.setActivity(`?help | ${totalGuilds} servers`, { type: ActivityType.Watching });
        console.log(`Aktivitas bot diperbarui: Watching ?help | ${totalGuilds} servers`);
    };

    // Panggil sekali saat bot siap
    updateActivity();
    // Lalu perbarui setiap 1 menit (60000 ms)
    setInterval(updateActivity, 60000);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;
    if (!message.guild) return; // Abaikan pesan di DM

    // Dapatkan prefix server atau gunakan default dari config.json
    const guildPrefix = await db.get(`prefix_${message.guild.id}`) || config.prefix;

    // Dapatkan bahasa server atau gunakan default
    const guildLanguage = await db.get(`lang_${message.guild.id}`) || 'en';
    const lang = client.languages.get(guildLanguage) || client.languages.get('en');

    if (message.mentions.users.has(client.user.id) && !message.content.startsWith(guildPrefix)) {
        // Balas dengan pesan yang memberitahu prefix
        const replyMessage = lang.mentionReply.replace(/\{0\}/g, `${guildPrefix}`);
        return message.reply(replyMessage);
    }

    // Gunakan prefix yang sudah didapatkan
    if (!message.content.startsWith(guildPrefix)) return;

    const args = message.content.slice(guildPrefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName) || client.commands.get(client.commandAliases.get(commandName));

    if (!command) {
        return message.reply(lang.commandNotFound.replace('{0}', `\`${commandName}\``).replace('{1}', guildPrefix)); // Gunakan guildPrefix
    }

    if (command.name === 'samp') { // Hanya berlaku untuk perintah 'samp'
        const isSampEnabled = await db.get(`samp_enabled_${message.guild.id}`); // Defaultnya akan null (falsey)
        if (isSampEnabled === false) { // Periksa secara eksplisit false
            const disabledEmbed = createSimpleEmbed(
                lang.setSampTitle, // Judul dari string setSampTitle
                lang.sampCommandDisabled,
                'warning'
            );
            return message.reply({ embeds: [disabledEmbed] });
        }
    }

    // --- PEMERIKSAAN FITUR `fivem` AKTIF/TIDAK ---
    if (command.name === 'fivem' || command.name === 'playersfivem') {
        const isFivemEnabled = await db.get(`fivem_enabled_${message.guild.id}`);
        if (isFivemEnabled === false) {
            const disabledEmbed = createSimpleEmbed(
                lang.setFivemTitle,
                lang.fivemCommandDisabled,
                'warning'
            );
            return message.reply({ embeds: [disabledEmbed] });
        }
    }
    // --- AKHIR PEMERIKSAAN FITUR `fivem` ---

    // --- PEMERIKSAAN FITUR `minecraft` AKTIF/TIDAK ---
    if (command.name === 'minecraft') { // tambahkan 'playersminecraft' jika Anda membuatnya
        const isMinecraftEnabled = await db.get(`minecraft_enabled_${message.guild.id}`);
        if (isMinecraftEnabled === false) {
            const disabledEmbed = createSimpleEmbed(
                lang.setMinecraftTitle,
                lang.minecraftCommandDisabled,
                'warning'
            );
            return message.reply({ embeds: [disabledEmbed] });
        }
    }

    try {
        // Teruskan 'db' dan 'lang' ke perintah, serta prefix saat ini untuk konteks
        await command.execute(message, args, client, db, lang, guildPrefix);
    } catch (error) {
        console.error(error);
        message.reply(lang.errorExecutingCommand);
    }
});

process.on('unhandledRejection', (error) => {
    hook.send(`\`\`\`js\n${error.stack}\`\`\``)
 })
 
 process.on('uncaughtException', (err, origin) => {
    hook.send(`\`\`\`js\n${err.stack}\`\`\``)
 })
 
 process.on('uncaughtExceptionMonitor', (err, origin) => {
   hook.send(`\`\`\`js\n${err.stack}\`\`\``)
 })
 
 process.on('beforeExit', (code) => {
   hook.send(`\`\`\`js\n${code}\`\`\``)
 })
 
 process.on('exit', (code) => {
   hook.send(`\`\`\`js\n${code}\`\`\``)
 })
 
 process.on('multipleResolves', (type, promise, reason) => {
 })

client.login(config.token);