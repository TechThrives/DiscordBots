const { ChannelType } = require("discord.js");
const { log } = require("../utils/common");
const { getCollection } = require("../mongodb");
const config = require("../config");
const axios = require("axios");
const { CHANNELS } = require("../constants");
const { replyUserMessage } = require("../helper/textGeneration");
const { sendLargeTextToMessage } = require("../utils/textHandler");

const urlToBase64 = (url) =>
  axios.get(url, { responseType: "arraybuffer" }).then((res) => {
    if (res.status !== 200) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    return Buffer.from(res.data, "binary").toString("base64");
  });

async function buildContents(msgs) {
  const THRESHOLD = 2 * 1000_000; // inline ≤2MB

  return Promise.all(
    msgs.map(async (msg) => {
      const role = msg.author.id === config.clientId ? "model" : "user";
      const parts = [];

      // 1) Text part
      if (msg.cleanContent?.trim()) {
        const text = role === "model" ? msg.cleanContent : `${msg.author.username}: ${msg.cleanContent}`;
        parts.push({ text });
      } else if (msg.content?.trim()) {
        const text = role === "model" ? msg.content : `${msg.author.username}: ${msg.content}`;
        parts.push({ text });
      }

      // 2) Embeds
      if (msg.embeds.length > 0) {
        for (const embed of msg.embeds) {
          if (embed.description) {
            parts.push({ text: embed.description });
          }
        }
      }

      // 3) Attachments
      for (const att of msg.attachments.values()) {
        const mimeType = att.contentType || "application/octet-stream";

        if (att.size && att.size <= THRESHOLD) {
          // try inline
          try {
            const data = await urlToBase64(att.url);
            parts.push({ inlineData: { mimeType, data } });
            continue;
          } catch (err) {
            console.warn(`Inlining failed for ${att.url}:`, err);
          }
        }

        // fallback to fileData
        const fallbackText = "Unable to load inline attachment: [Attachment: " + att.name + "] So here is the link: " + att.url;
        parts.push({ text: fallbackText });
      }

      return { role, parts };
    }),
  );
}

async function getRecentMessages(message, limit = 10) {
  try {
    const fetched = await message.channel.messages.fetch({ limit });
    const msgs = fetched.filter((m) => !m.system).sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    return await buildContents(msgs);
  } catch (error) {
    log("ERROR", `Failed to fetch recent messages: ${error.message}`);
    return [];
  }
}

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

      const userMessagesContent = await getRecentMessages(message);

      const aiMessage = await replyUserMessage(userMessagesContent);

      await sendLargeTextToMessage(message, aiMessage);
    } else if (botWasMentionedOrRepliedTo) {
      // Reply to mentions/replies in other channels
      log(
        "INFO",
        `Bot was mentioned/replied to in channel "${message.channel.name}" by ${message.author.displayName}: ${message.content}`,
      );

      message.channel.sendTyping();

      const userMessagesContent = await getRecentMessages(message);
      
      const aiMessage = await replyUserMessage(userMessagesContent);

      await sendLargeTextToMessage(message, aiMessage);
    }
  },
};
