const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const { log } = require("../../utils/common");

const CHANNEL_TYPES = {
  template: {
    dbField: "templateChannel",
    replyMsg: "Template channel set",
    webhook: {
      name: "TemplateDrop",
      avatar: "https://i.postimg.cc/vBCy7F2W/T.png",
    },
  },
  wallpaper: {
    dbField: "wallpaperChannel",
    replyMsg: "Wallpaper channel set",
    webhook: {
      name: "WallpaperDrop",
      avatar: "https://i.postimg.cc/Pf8TXJNK/W.png",
    },
  },
  website: {
    dbField: "websiteChannel",
    replyMsg: "Website channel set",
    webhook: {
      name: "WebsiteNews",
      avatar: "https://i.postimg.cc/Pf8TXJNK/W.png",
    },
  },
  log: {
    dbField: "logChannel",
    replyMsg: "Log channel set",
    webhook: {
      name: "Logger",
      avatar: "https://i.postimg.cc/NftDLpKV/L.png",
    },
  },
  leetcode: {
    dbField: "leetcodeChannel",
    replyMsg: "LeetCode channel set",
  },
};

// Dynamically build the slash command
const command = new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("Set a specific channel to send messages")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

for (const [key] of Object.entries(CHANNEL_TYPES)) {
  command.addSubcommand((sub) =>
    sub
      .setName(key)
      .setDescription(`Set the ${key} channel`)
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription(`Text channel for ${key} messages`)
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText),
      ),
  );
}

async function deleteOldWebhookIfExists(client, existing, dbField, guildId) {
  const webhookId = existing?.[dbField]?.webhook?.id;
  if (!webhookId) return;

  try {
    const oldWebhook = await client.fetchWebhook(webhookId);
    await oldWebhook.delete("Replacing webhook via /setchannel");
    log("INFO", `Deleted webhook ${webhookId} for guild ${guildId}`);
  } catch (err) {
    log("WARN", `Failed to delete old webhook ${webhookId}: ${err.message}`);
  }
}

async function createWebhook(channel, config, reason) {
  if (!config?.webhook) return null;

  return channel.createWebhook({
    name: config.webhook.name,
    avatar: config.webhook.avatar,
    reason,
  });
}

module.exports = {
  data: command,
  permissions: PermissionFlagsBits.ManageGuild,

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const config = CHANNEL_TYPES[subcommand];
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    if (!config) {
      return interaction.editReply({ content: "Invalid subcommand configuration." });
    }

    if (!channel?.isTextBased()) {
      return interaction.editReply({ content: "Please select a valid text channel." });
    }

    const guildConfigs = getCollection("GuildConfigs");

    try {
      const existing = await guildConfigs.findOne({ guildId });

      // Delete previous webhook if needed
      await deleteOldWebhookIfExists(interaction.client, existing, config.dbField, guildId);

      // Create new webhook (if defined)
      const webhook = await createWebhook(channel, config, `Created via /setchannel ${subcommand}`);

      // Update DB
      await guildConfigs.updateOne(
        { guildId },
        {
          $set: {
            guildId,
            [config.dbField]: {
              id: channel.id,
              ...(webhook && {
                webhook: {
                  id: webhook.id,
                  name: webhook.name,
                },
              }),
            },
          },
        },
        { upsert: true },
      );

      log("INFO", `${config.replyMsg} for guild ${guildId} -> #${channel.name}`);

      return interaction.editReply({
        content: `${config.replyMsg} to <#${channel.id}>${webhook ? " and webhook created." : "."}`,
      });
    } catch (err) {
      log("ERROR", `Error setting channel ${subcommand} for guild ${guildId}: ${err.message}`);
      console.error(err);

      return interaction.editReply({ content: "Failed to save config or create webhook." });
    }
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
