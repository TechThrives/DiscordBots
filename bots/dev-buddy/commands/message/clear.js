const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { log } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clears messages in the current channel.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete (max 50)")
        .setMinValue(1)
        .setMaxValue(50)
        .setRequired(true),
    )
    .addUserOption((option) => option.setName("user").setDescription("User to delete messages from").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    const amount = interaction.options.getInteger("amount");
    const targetUser = interaction.options.getUser("user");

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
      `${interaction.user.tag} deleted ${deletedCount} messages in #${interaction.channel.name}${targetUser ? ` from ${targetUser.tag}` : ""}`,
    );
  },
  permissions: PermissionFlagsBits.ManageMessages,
};
