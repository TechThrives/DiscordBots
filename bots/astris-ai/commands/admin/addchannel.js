const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const { log } = require("../../utils/common");
const { CHANNELS } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addchannel")
    .setDescription("Add channel for specific bot commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("img_generation")
        .setDescription("Add an image generation command channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to allow for image generation")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("text_generation")
        .setDescription("Add an text generation command channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to allow for text generation")
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

    if (!channel.isTextBased()) {
      return interaction.editReply({
        content: "Please select a valid text channel.",
      });
    }

    const guildConfigs = getCollection("GuildConfigs");

    try {
      const updateResult = await guildConfigs.updateOne(
        { guildId },
        {
          $addToSet: {
            [config.dbField]: channel.id,
          },
          $setOnInsert: { guildId },
        },
        { upsert: true },
      );

      log("INFO", `${config.displayName} for guild ${guildId} -> #${channel.name}`);

      await interaction.editReply({
        content: `Added <#${channel.id}> to ${config.displayName}.`,
      });
    } catch (err) {
      log("ERROR", `Failed to add ${subcommand} channel for guild ${guildId}: ${err.message}`);

      await interaction.editReply({
        content: "Failed to save configuration to the database.",
      });
    }
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
