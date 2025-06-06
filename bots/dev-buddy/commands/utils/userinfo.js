const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Displays user info.")
    .addUserOption((option) => option.setName("user").setDescription("The target member").setRequired(false)),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const user = interaction.options.getUser("user") || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);

    const embed = new EmbedBuilder()
      .setTitle(`User info : ${user.globalName ? user.globalName : user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "ID", value: user.id },
        { name: "Username", value: user.username },
        { name: "Roles", value: member.roles.cache.map((role) => role).join(", ") },
        { name: "Created on", value: `<t:${Math.floor(user.createdTimestamp / 1000)}:D>` },
        { name: "Joined the", value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:D>` },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
