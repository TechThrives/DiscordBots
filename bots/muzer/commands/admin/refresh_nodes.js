const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const icons = require("../../icons");
const config = require("../../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("refresh_nodes")
    .setDescription("Refresh Lavalink nodes")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const nodes = config.nodes.map((nodeConfig) => ({
      host: nodeConfig.host,
      port: nodeConfig.port,
      password: nodeConfig.password,
      secure: nodeConfig.secure,
      reconnectTimeout: 5000,
      reconnectTries: Infinity,
    }));

    for (const node of nodes) {
      await interaction.client.riffy.createNode(node);
    }

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Nodes Refreshed",
        iconURL: icons.headerIcon,
      })
      .setDescription("All Lavalink nodes have been refreshed.")
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
