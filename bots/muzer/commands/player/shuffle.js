const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder().setName("shuffle").setDescription("Shuffle the current queue"),

  async execute(interaction) {
    const client = interaction.client;

    const player = client.riffy.players.get(interaction.guildId);

    if (!player || !player.queue || player.queue.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({ name: "Queue is empty", iconURL: icons.headerIcon })
        .setDescription("There's nothing to shuffle — the queue is empty.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

      return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    for (let i = player.queue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [player.queue[i], player.queue[j]] = [player.queue[j], player.queue[i]];
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({ name: "Queue Shuffled", iconURL: icons.headerIcon })
      .setDescription("The songs in the queue have been shuffled.")
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
