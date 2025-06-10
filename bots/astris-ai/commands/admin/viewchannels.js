const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const { CHANNELS } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewchannels")
    .setDescription("View the list of configured channels for commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;
    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config) {
      return interaction.editReply("No configured channels found for this guild.");
    }

    let responseLines = [];

    for (const [key, value] of Object.entries(CHANNELS)) {
      const channels = config[value.dbField];

      if (!channels || channels.length === 0) {
        responseLines.push(`**${value.displayName}s**\n None configured.`);
        continue;
      }

      const channelMentions = channels.map((id) => `<#${id}>`).join(" ");

      responseLines.push(`**${value.displayName}s**\n ${channelMentions}`);
    }

    await interaction.editReply(responseLines.join("\n\n"));
  },
  permissions: [PermissionFlagsBits.ManageGuild],
};
