const { SlashCommandBuilder, AttachmentBuilder, flatten, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Shows a user's avatar.")
    .addUserOption((option) => option.setName("user").setDescription("Choose a user").setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser("user") || interaction.user;

    const avatarURL = user.displayAvatarURL({ dynamic: true });

    const originalExtension = avatarURL.split(".").pop().split("?")[0];

    const file = new AttachmentBuilder(avatarURL, {
      name: `${user.username}.${originalExtension}`,
    });
    await interaction.editReply({ files: [file] });
  },
};
