const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const { log } = require("../../utils/common");
const { CHANNELS } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("removechannel")
    .setDescription("Remove a channel from the allowed list for a command")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("img_generation")
        .setDescription("Remove a channel from the allowed list for image generation")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The channel to remove")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const config = CHANNELS[subcommand];
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");

    try {
      const result = await guildConfigs.updateOne(
        { guildId },
        {
          $pull: {
            [config.dbField]: channel.id,
          },
        },
      );

      if (result.modifiedCount > 0) {
        log("INFO", `${config.displayName} for guild ${guildId} -> #${channel.name}`);
        await interaction.editReply({
          content: `Removed <#${channel.id}> from ${config.displayName}.`,
        });
      } else {
        await interaction.editReply({
          content: `Channel <#${channel.id}> was not in the allowed list.`,
        });
      }
    } catch (err) {
      log("ERROR", `Failed to remove ${subcommand} channel for guild ${guildId}: ${err.message}`);

      await interaction.editReply({
        content: "Failed to save configuration to the database.",
      });
    }
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
