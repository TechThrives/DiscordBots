const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");
const { createPlaylistSongPagination } = require("../../helper/pagination");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_show")
    .setDescription("Show all songs in a playlist")
    .addStringOption((option) => option.setName("playlist").setDescription("Enter playlist name").setRequired(true)),

  async execute(interaction) {
    const playlistName = interaction.options.getString("playlist");
    const userId = interaction.user.id;

    const playlist = await getCollection("playlists").findOne({ name: playlistName });
    if (!playlist) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Playlist not found",
          iconURL: icons.headerIcon,
        })
        .setDescription("The playlist you're trying to view does not exist.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (playlist.isPrivate && playlist.userId !== userId) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Access Denied",
          iconURL: icons.headerIcon,
        })
        .setDescription("This playlist is private and you don't have permission to view it.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (playlist.songs.length === 0) {
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setAuthor({
          name: `Playlist: ${playlistName}`,
          iconURL: icons.headerIcon,
        })
        .setDescription("This playlist has no songs.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

      await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
      return;
    }

    await createPlaylistSongPagination(interaction, playlist);
  },
};
