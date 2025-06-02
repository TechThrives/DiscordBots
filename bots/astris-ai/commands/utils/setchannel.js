const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");

const { getCollection } = require("../../mongodb");
const { log } = require("../../utils/common");

const CHANNEL_TYPES = {
  log: {
    webhookName: "Logger",
    webhookAvatar: "https://i.postimg.cc/NftDLpKV/L.png",
    dbField: "logChannel",
    replyMsg: "Log channel set",
  },
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set a specific channel to send messages via webhook")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("log")
        .setDescription("Set the log channel")
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("The text channel to send logs")
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText),
        ),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const config = CHANNEL_TYPES[subcommand];
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    if (!channel.isTextBased()) {
      await interaction.editReply({
        content: "Please select a valid text channel.",
      });
      return;
    }

    const guildConfigs = getCollection("GuildConfigs");

    try {
      // Get existing config for this guild
      const existingConfig = await guildConfigs.findOne({ guildId });

      // If webhook exists in DB for this channel type, delete the old webhook
      if (existingConfig && existingConfig[config.dbField]?.webhook?.id) {
        const oldWebhookId = existingConfig[config.dbField].webhook.id;
        try {
          // Fetch webhook and delete it
          const oldWebhook = await interaction.client.fetchWebhook(oldWebhookId);
          await oldWebhook.delete("Updating webhook via /setchannel command");
          log("INFO", `Deleted old webhook ${oldWebhookId} for guild ${guildId}`);
        } catch (deleteErr) {
          // Might fail if webhook was deleted externally, just log
          log("WARN", `Failed to delete old webhook ${oldWebhookId}: ${deleteErr.message}`);
        }
      }

      // Create new webhook
      const webhook = await channel.createWebhook({
        name: config.webhookName,
        avatar: config.webhookAvatar,
        reason: `Created via /setchannel ${subcommand}`,
      });

      // Update DB with new webhook info
      await guildConfigs.updateOne(
        { guildId },
        {
          $set: {
            guildId,
            [config.dbField]: {
              id: channel.id,
              webhook: {
                id: webhook.id,
                token: webhook.token,
              },
            },
          },
        },
        { upsert: true },
      );

      log("INFO", `${config.replyMsg} for guild ${guildId} -> #${channel.name}`);

      await interaction.editReply({
        content: `${config.replyMsg} to <#${channel.id}> and webhook created.`,
      });
    } catch (err) {
      log("ERROR", `Failed to set ${subcommand} channel for guild ${guildId}: ${err.message}`);
      console.error(err);

      await interaction.editReply({
        content: `Failed to create webhook or save config.`,
      });
    }
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
