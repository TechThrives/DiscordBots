const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_removesong")
    .setDescription("Remove a song from a playlist you created")
    .addStringOption((option) => option.setName("playlist").setDescription("Name of the playlist").setRequired(true))
    .addStringOption((option) => option.setName("song").setDescription("Name of the song to remove").setRequired(true)),

  async execute(interaction) {
    const playlistName = interaction.options.getString("playlist");
    const songName = interaction.options.getString("song");
    const userId = interaction.user.id;

    const playlist = await getCollection("playlists").findOne({ name: playlistName });

    if (!playlist) {
      const notFoundEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Playlist Not Found",
          iconURL: icons.headerIcon,
        })
        .setDescription(`No playlist named **${playlistName}** was found.`)
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
        .setDescription("You can only modify your own playlists.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [deniedEmbed], flags: MessageFlags.Ephemeral });
    }

    const songIndex = playlist.songs.findIndex((song) => song.name.toLowerCase() === songName.toLowerCase());
    if (songIndex === -1) {
      const noSongEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Song Not Found",
          iconURL: icons.headerIcon,
        })
        .setDescription(`No song named **${songName}** found in **${playlistName}**.`)
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [noSongEmbed], flags: MessageFlags.Ephemeral });
    }

    await getCollection("playlists").updateOne(
      { name: playlistName, userId },
      { $pull: { songs: { name: songName } } },
    );

    const successEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Song Removed",
        iconURL: icons.headerIcon,
      })
      .setDescription(`**${songName}** has been removed from **${playlistName}**.`)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], flags: MessageFlags.Ephemeral, });
  },
};
