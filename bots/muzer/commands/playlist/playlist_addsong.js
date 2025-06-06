const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_addsong")
    .setDescription("Add a song to a playlist")
    .addStringOption((option) => option.setName("playlist").setDescription("Enter playlist name").setRequired(true))
    .addStringOption((option) => option.setName("input").setDescription("Enter song name or URL").setRequired(true)),

  async execute(interaction) {
    const playlistName = interaction.options.getString("playlist");
    const songInput = interaction.options.getString("input");
    const userId = interaction.user.id;

    const playlist = await getCollection("playlists").findOne({ name: playlistName });

    if (!playlist) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Playlist Not Found",
          iconURL: icons.headerIcon,
        })
        .setDescription("- Playlist not found.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (playlist.userId !== userId) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Access Denied",
          iconURL: icons.headerIcon,
        })
        .setDescription("- You do not have permission to add songs to this playlist.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const urlPattern = /^https?:\/\/[^\s$.?#].[^\s]*$/gm;
    let song;

    if (urlPattern.test(songInput)) {
      song = { url: songInput };
    } else {
      song = { name: songInput };
    }

    await getCollection("playlists").updateOne({ name: playlistName }, { $push: { songs: song } });

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Song Added",
        iconURL: icons.headerIcon,
      })
      .setDescription(`- Song **${songInput}** has been added to playlist **${playlistName}**.`)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
