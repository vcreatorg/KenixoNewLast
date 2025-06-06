const {
    MessageActionRow,
    Message,
    MessageEmbed,
    MessageButton,
  } = require("discord.js");
  
  /**
   * Creates a pagination embed
   * @param {Message} msg
   * @param {MessageEmbed[]} pages
   * @param {MessageButton[]} buttonList
   * @param {number} timeout
   * @returns
   */
  const paginationEmbed = async (msg, pages, buttonList, timeout = 120000) => {
    if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
    if (!pages) throw new Error("Pages are not given.");
    if (!buttonList) throw new Error("Buttons are not given.");
    if (buttonList[0].style === "LINK" || buttonList[1].style === "LINK")
      throw new Error(
        "Link buttons are not supported with discordjs-button-pagination"
      );
    if (buttonList.length !== 2) throw new Error("Need two buttons.");

    let page = 0;
  
    const row = new MessageActionRow().addComponents(buttonList);
    const curPage = await msg.reply({
      embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length} - Kenixo © 2025 • Request Intents`})],
      components: [row],
    });
  
    const filter = (i) => {
        i.customId === buttonList[0].customId ||
        i.customId === buttonList[1].customId;
        if (i.user.id === msg.author.id) return true;
         return i.reply({
              content: "Only the owner of these buttons can use them",
              ephemeral: true,
        });
    }
  
    const collector = await curPage.createMessageComponentCollector({
      filter,
      time: timeout,
    });
  
    collector.on("collect", async (i) => {
      switch (i.customId) {
        case buttonList[0].customId:
          page = page > 0 ? --page : pages.length - 1;
          break;
        case buttonList[1].customId:
          page = page + 1 < pages.length ? ++page : 0;
          break;
        default:
          break;
      }
      await i.deferUpdate();
      await i.editReply({
        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length} - Kenixo © 2025 • Request Intents`})],
        components: [row],
      });
      collector.resetTimer();
    });
  
    collector.on("end", (_, reason) => {
      if (reason !== "messageDelete") {
        const disabledRow = new MessageActionRow().addComponents(
          buttonList[0].setDisabled(true),
          buttonList[1].setDisabled(true)
        );
        curPage.edit({
          embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length} - Kenixo © 2025 • Request Intents`})],
          components: [disabledRow],
        });
      }
    });
  
    return curPage;
  };
  module.exports = paginationEmbed;
