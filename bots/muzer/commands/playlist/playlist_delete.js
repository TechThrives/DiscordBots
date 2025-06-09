const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_delete")
    .setDescription("Delete one of your playlists")
    .addStringOption((option) =>
      option.setName("name").setDescription("Name of the playlist to delete").setRequired(true),
    ),

  async execute(interaction) {
    const playlistName = interaction.options.getString("name");
    const userId = interaction.user.id;

    const playlist = await getCollection("playlists").findOne({ name: playlistName });

    if (!playlist) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Playlist Not Found",
          iconURL: icons.headerIcon,
        })
        .setDescription("That playlist doesn't exist.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [notFoundEmbed], flags: MessageFlags.Ephemeral });
    }

    if (playlist.userId !== userId) {
      const deniedEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Access Denied",
          iconURL: icons.headerIcon,
        })
        .setDescription("You can only delete playlists you created.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [deniedEmbed], flags: MessageFlags.Ephemeral });
    }

    const result = await getCollection("playlists").deleteOne({ name: playlistName, userId });

    if (result.deletedCount === 0) {
      const notDeletedEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Delete Failed",
          iconURL: icons.headerIcon,
        })
        .setDescription("Could not delete the playlist. Please try again.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [notDeletedEmbed], flags: MessageFlags.Ephemeral });
    }

    const successEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Playlist Deleted",
        iconURL: icons.headerIcon,
      })
      .setDescription(`The playlist **${playlistName}** has been successfully deleted.`)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral });
  },
};
