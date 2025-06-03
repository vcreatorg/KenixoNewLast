// utils/embedBuilder.js
const { EmbedBuilder } = require('discord.js');

/**
 * Membuat Discord Embed sederhana dengan warna yang sudah ditentukan.
 * @param {string} title - Judul Embed.
 * @param {string} description - Deskripsi Embed.
 * @param {string} [colorType='default'] - Tipe warna Embed ('default', 'success', 'error', 'warning', 'info').
 * @param {string} [thumbnailUrl] - URL Thumbnail Embed.
 * @param {string} [imageUrl] - URL Gambar utama Embed.
 * @returns {EmbedBuilder} Objek EmbedBuilder.
 */
function createSimpleEmbed(title, description, colorType = 'default', thumbnailUrl = null, imageUrl = null) {
    let color;

    switch (colorType.toLowerCase()) {
        case 'success':
            color = 0x2ECC71; // Hijau
            break;
        case 'error':
            color = 0xE74C3C; // Merah
            break;
        case 'warning':
            color = 0xF1C40F; // Kuning
            break;
        case 'info':
            color = 0x3498DB; // Biru
            break;
        case 'default':
        default:
            color = 0x2B2D31; // Warna default Discord (atau bisa juga 0x2C2F33, tergantung preferensi)
            break;
    }

    const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        //.setTimestamp(); // Menambahkan timestamp secara otomatis
        .setFooter({text: 'Kenixo © 2025 • Request Intents'})

    if (thumbnailUrl) {
        embed.setThumbnail(thumbnailUrl);
    }
    if (imageUrl) {
        embed.setImage(imageUrl);
    }

    return embed;
}

module.exports = { createSimpleEmbed };