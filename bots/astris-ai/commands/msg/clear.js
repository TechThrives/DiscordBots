const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { log } = require("../../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clears messages in the current channel.")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Number of messages to delete (max 100)").setRequired(true)
    ),
  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return interaction.reply({
        content: "❌ You are not authorized to use this command.",
        flags: MessageFlags.Ephemeral,
      });
    }

    const amount = interaction.options.getInteger("amount");
    if (amount > 100 || amount < 1) {
      return interaction.reply({ content: "Amount must be between 1 and 100.", flags: MessageFlags.Ephemeral });
    }

    try {
      await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Deleted ${amount} messages.`, flags: MessageFlags.Ephemeral });
    } catch (error) {
      log("ERROR", "Bulk delete error");
      await interaction.reply({
        content: "Failed to delete messages. Make sure they are recent and I have the right permissions.",
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
