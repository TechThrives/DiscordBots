const { ChannelType } = require("discord.js");
const { log } = require("../utils/common");
const { getCollection } = require("../mongodb");
const config = require("../config");
const { CHANNELS } = require("../constants");
const { replyUserMessage } = require("../helper/textGeneration");
const { sendLargeTextToMessage } = require("../utils/textHandler");

const getRecentMessages = async (message, limit = 5) => {
  try {
    const allMessages = await message.channel.messages.fetch();

    const userMessages = allMessages.filter((msg) => !msg.author.bot).first(limit);

    if (userMessages.slice(1).length === 0) {
      return "No context available.";
    }

    const userMessagesText = userMessages
      .slice(1)
      .reverse()
      .map((message) => `**${message.author.displayName || message.author.username}**: ${message.content}`)
      .join("\n");

    return userMessagesText;
  } catch (error) {
    log("ERROR", `Failed to fetch recent messages: ${error.message}`);
    return "No context available.";
  }
};

module.exports = {
  name: "messageCreate",
  async execute(message) {
    // Skip bot messages and ignored messages
    if (message.author.bot) return;
    if (message.content.startsWith(config.ignorePrefix)) return;

    const isDM = message.channel.type === ChannelType.DM;

    // Initialize variables
    let isDesignatedChannel = false;
    let guildConfig = null;

    if (!isDM) {
      const guildConfigs = getCollection("GuildConfigs");
      const guildId = message.guild.id;
      guildConfig = await guildConfigs.findOne({ guildId });

      if (guildConfig) {
        const channels = guildConfig[CHANNELS.text_generation.dbField] || [];
        isDesignatedChannel = channels.includes(message.channel.id);
      }
    }

    let botWasMentionedOrRepliedTo = message.mentions.has(config.clientId);

    // Check if message is a reply to the bot
    if (!botWasMentionedOrRepliedTo && message.reference?.messageId) {
      try {
        const repliedToMessage = await message.channel.messages.fetch(message.reference.messageId);
        if (repliedToMessage.author.id === config.clientId) {
          botWasMentionedOrRepliedTo = true;
        }
      } catch (error) {
        log("WARN", `Could not fetch replied-to message (ID: ${message.reference.messageId}): ${error.message}`);
      }
    }

    // Handle DM messages
    if (isDM) {
      log("INFO", `Received DM from ${message.author.username}: ${message.content}`);
      await message.author.send({
        content: "Thank you for your message! I am currently not set up to respond to DMs.",
      });
    }

    // Handle Guild (Server) Messages
    if (isDesignatedChannel) {
      // Reply to ALL messages in designated channels
      log(
        "INFO",
        `Message in designated channel "${message.channel.name}" from ${message.author.displayName}: ${message.content}`,
      );

      message.channel.sendTyping();

      const userMessagesText = await getRecentMessages(message);

      const aiMessage = await replyUserMessage(message.content, userMessagesText);

      await sendLargeTextToMessage(message, aiMessage);
    } else if (botWasMentionedOrRepliedTo) {
      // Reply to mentions/replies in other channels
      log(
        "INFO",
        `Bot was mentioned/replied to in channel "${message.channel.name}" by ${message.author.displayName}: ${message.content}`,
      );

      message.channel.sendTyping();

      const userMessagesText = await getRecentMessages(message);

      const aiMessage = await replyUserMessage(message.content, userMessagesText);

      await sendLargeTextToMessage(message, aiMessage);
    }
  },
};
