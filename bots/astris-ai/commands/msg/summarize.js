const { SlashCommandBuilder } = require("discord.js");
const { summarizeText } = require("../../helper/textGeneration");
const { sendLargeText } = require("../../utils/textHandler");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("summarize")
    .setDescription("Summarizes messages in the current channel (Default: 4).")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Amount of messages to summarize")
        .setRequired(false)
        .setMinValue(4)
        .setMaxValue(16)
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const amount = interaction.options.getInteger("amount") || 4;
    const allMessages = await interaction.channel.messages.fetch();

    const userMessages = allMessages.filter((msg) => !msg.author.bot).first(amount);

    if (userMessages.length === 0) {
      throw new Error("No recent messages found.");
    }

    const allMessagesText = userMessages
      .reverse()
      .map((message) => `**${message.author.displayName}**: ${message.content}`)
      .join("\n");

    const summary = await summarizeText(allMessagesText);

    const headerText = `**Summary of last ${userMessages.length} user messages:**\n\n`;

    await sendLargeText(interaction, summary, {
      prefix: headerText,
    });
  },
};
