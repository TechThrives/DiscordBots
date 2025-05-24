const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { log } = require("../../utils");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clears messages in the current channel.")
    .addIntegerOption((option) =>
      option.setName("amount").setDescription("Number of messages to delete (max 100)").setRequired(true)
    )
    .addUserOption((option) => option.setName("user").setDescription("User to delete messages from").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({
        content: "You are not authorized to use this command.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const amount = interaction.options.getInteger("amount");
    const targetUser = interaction.options.getUser("user");

    if (amount > 100 || amount < 1) {
      await interaction.reply({ content: "Amount must be between 1 and 100.", flags: MessageFlags.Ephemeral });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let deletedCount = 0;

    if (targetUser) {
      const allMessages = await interaction.channel.messages.fetch();
      const userMessages = await allMessages.filter((msg) => msg.author.id === targetUser.id).first(amount);

      if (userMessages.length === 0) {
        await interaction.editReply({
          content: `No recent messages found from ${targetUser.tag}.`,
        });
        return;
      }

      for (const message of userMessages) {
        try {
          await message.delete();
          deletedCount++;
        } catch (err) {
          continue;
        }
      }

      await interaction.editReply({
        content: `Successfully deleted ${deletedCount} message${deletedCount !== 1 ? "s" : ""} from ${targetUser.tag}.`,
      });

    } else {
      const deletedMessages = await interaction.channel.bulkDelete(amount, true);
      deletedCount = deletedMessages.size;

      await interaction.editReply({
        content: `Successfully deleted ${deletedCount} message${deletedCount !== 1 ? "s" : ""}.`,
      });
    }
    log(
      "INFO",
      `${interaction.user.tag} deleted ${deletedCount} messages in #${interaction.channel.name}${targetUser ? ` from ${targetUser.tag}` : ""}`
    );
  },
};
