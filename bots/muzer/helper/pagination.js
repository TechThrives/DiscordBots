const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
} = require("discord.js");
const icons = require("../icons");

const COLLECTOR_TIMEOUT = 300000;

async function createQueuePagination(interaction, player) {
  const chunkSize = 1;
  const chunks = [];
  const currentTrack = player.current;
  const queue = player.queue;

  // Split playlists into chunks
  for (let i = 0; i < queue.length; i += chunkSize) {
    chunks.push(queue.slice(i, i + chunkSize));
  }

  if (chunks.length === 0) {
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription("No Songs found.")
      .setAuthor({ name: "Public Playlists", iconURL: icons.headerIcon })
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });
    return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  }

  let currentPage = 0;

  // Create embed for current page
  const createEmbed = (pageIndex) => {
    const chunk = chunks[pageIndex];
    const description = currentTrack
      ? `**Now Playing**\n` +
        `[${currentTrack.info.title}](${currentTrack.info.uri}) - Requested by: ${currentTrack.info.requester || "Autoplay"}\n\n` +
        `**Up Next**\n` +
        `${chunk.map((song, idx) => `${pageIndex * chunkSize + idx + 1}. [${song.info.title}](${song.info.uri}) - Requested by: ${song.info.requester || "Autoplay"}`).join("\n")}`
      : `**Up Next**\n` +
        `${chunk.map((song, idx) => `${pageIndex * chunkSize + idx + 1}. [${song.info.title}](${song.info.uri}) - Requested by: ${song.info.requester || "Autoplay"}`).join("\n")}`;

    return new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: `Queue Songs • Page ${pageIndex + 1} of ${chunks.length}`,
        iconURL: icons.headerIcon,
      })
      .setDescription(description)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();
  };

  // Create navigation buttons
  const createButtons = (pageIndex) => {
    return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`queue_previous`)
        .setEmoji("◀️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === 0),

      new ButtonBuilder()
        .setCustomId(`queue_next`)
        .setEmoji("▶️")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(pageIndex === chunks.length - 1),
    );
  };

  // Send initial message
  const embed = createEmbed(currentPage);
  const buttons = createButtons(currentPage);

  const response = await interaction.reply({
    embeds: [embed],
    components: chunks.length > 1 ? [buttons] : [],
    flags: MessageFlags.Ephemeral,
  });

  // If only one page, stop here
  if (chunks.length <= 1) return;

  // Handle button clicks
  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: COLLECTOR_TIMEOUT,
  });

  collector.on("collect", async (buttonInteraction) => {
    if (buttonInteraction.user.id !== interaction.user.id) {
      return buttonInteraction.reply({ content: "Only the command user can navigate.", flags: MessageFlags.Ephemeral });
    }

    if (buttonInteraction.customId === `queue_previous`) {
      currentPage--;
    } else if (buttonInteraction.customId === `queue_next`) {
      currentPage++;
    }

    const newEmbed = createEmbed(currentPage);
    const newButtons = createButtons(currentPage);

    await buttonInteraction.update({
      embeds: [newEmbed],
      components: [newButtons],
    });
  });

  collector.on("end", () => {
    // Disable buttons when time expires
    const disabledButtons = createButtons(currentPage);
    disabledButtons.components.forEach((button) => button.setDisabled(true));
    response.edit({ components: [disabledButtons] }).catch(() => {});
  });
}

module.exports = {
  createQueuePagination,
};
