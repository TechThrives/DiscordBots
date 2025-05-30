const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("serverinfo").setDescription("Displays server info."),
  async execute(interaction) {
    await interaction.deferReply();

    const { guild } = interaction;

    const embed = new EmbedBuilder()
      .setTitle(`Server info : ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>` },
        { name: "Members", value: `${guild.memberCount}` },
        { name: "ID", value: `${guild.id}` },
        { name: "Created on", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:D>` },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
