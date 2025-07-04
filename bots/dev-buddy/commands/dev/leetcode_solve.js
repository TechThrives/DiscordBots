const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  ChannelType,
  ThreadAutoArchiveDuration,
  AttachmentBuilder,
} = require("discord.js");
const { getCollection } = require("../../mongodb");
const store = require("../../store");
const { solveLeetCode } = require("../../helper/devHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leetcode_solve")
    .setDescription("Send leetcode daily challenge to the configured channel")
    .addStringOption((option) => option.setName("title_slug").setDescription("Leetcode title slug").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const titleSlug = interaction.options.getString("title_slug");
    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config || !config.leetcodeChannel) {
      await interaction.editReply({
        content: "Leetcode channel is not configured.",
      });
      return;
    }

    const { id: channelId } = config.leetcodeChannel;

    const leetcodeSolution = await solveLeetCode(titleSlug);

    const embed = new EmbedBuilder()
      .setTitle("LeetCode Solution")
      .setColor(store.embedColor)
      .setAuthor({ name: "LeetCode", iconURL: store.headerIcon })
      .setDescription(
        [
          `**Title:** ${leetcodeSolution.title}`,
          `**Link:** ${leetcodeSolution.link}`,
          `**Difficulty:** ${leetcodeSolution.difficulty}`,
          ``,
          `**Tags:** ${leetcodeSolution.topicTags.map((tag) => `\`${tag}\``).join(", ")}`,
        ].join("\n"),
      )
      .setFooter({
        text: `Posted by LeetCode Solution`,
        iconURL: store.footerIcon,
      })
      .setTimestamp();

    const message = await interaction.client.channels.cache.get(channelId).send({
      embeds: [embed],
    });

    await message.react("😎");
    await message.react("🧑‍💻");

    const thread = await message.startThread({
      name: `LeetCode Problem: ${leetcodeSolution.title}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      reason: `Discussion on ${leetcodeSolution.title} solution`,
      type: ChannelType.PublicThread,
    });

    await thread.send({
      content: `## Problem Statement\n${leetcodeSolution.content}`,
    });

    await thread.send({
      content: `## AI Generated Code Solutions`,
    });

    for (const [key, value] of Object.entries(leetcodeSolution.solution)) {
      if (!value) continue;

      const buffer = Buffer.from(value, "utf-8");
      const file = new AttachmentBuilder(buffer, { name: `${key}_solution.txt` });

      await thread.send({
        content: `**${key[0].toUpperCase() + key.slice(1)} Solution**`,
        files: [file],
      });
    }

    await interaction.editReply({
      content: `Leetcode Solution sent to the <#${config.leetcodeChannel.id}> channel!`,
    });
  },
};
