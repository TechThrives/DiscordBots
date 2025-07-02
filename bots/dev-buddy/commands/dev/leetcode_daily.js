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
const { leetCodeDaily, solveLeetCode } = require("../../helper/devHelper");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leetcode_daily")
    .setDescription("Send leetcode daily challenge to the configured channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config || !config.leetcodeChannel) {
      await interaction.editReply({
        content: "Leetcode channel is not configured. Use `/setchannel leetcode` to set it first.",
      });
      return;
    }

    const { id: channelId } = config.leetcodeChannel;

    const dailyChallenge = await leetCodeDaily();
    const leetcodeSolution = await solveLeetCode("two-sum");

    const embed = new EmbedBuilder()
      .setTitle("LeetCode Daily Challenge")
      .setColor(store.embedColor)
      .setAuthor({ name: "LeetCode", iconURL: store.headerIcon })
      .setDescription(
        [
          `**Date:** ${dailyChallenge.date}`,
          `**Title:** ${dailyChallenge.title}`,
          `**Link:** ${dailyChallenge.link}`,
          `**Difficulty:** ${dailyChallenge.difficulty}`,
          ``,
          `**Tags:** ${dailyChallenge.topicTags.map((tag) => `\`${tag}\``).join(", ")}`,
        ].join("\n"),
      )
      .setFooter({
        text: `Posted by LeetCode Daily`,
        iconURL: store.footerIcon,
      })
      .setTimestamp();

    const message = await interaction.client.channels.cache.get(channelId).send({
      embeds: [embed],
    });

    await message.react("😎");
    await message.react("🧑‍💻");

    const thread = await message.startThread({
      name: `LeetCode Problem: ${dailyChallenge.title}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      reason: `Discussion on ${dailyChallenge.date} LeetCode challenge`,
      type: ChannelType.PublicThread,
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
      content: `Leetcode daily challenge sent to the <#${config.leetcodeChannel.id}> channel!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
