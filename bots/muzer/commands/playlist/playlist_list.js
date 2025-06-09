const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");
const { createPlaylistPagination } = require("../../helper/pagination");

module.exports = {
  data: new SlashCommandBuilder().setName("playlist_list").setDescription("View all public playlists"),

  async execute(interaction) {
    const playlists = await getCollection("playlists").find({ isPrivate: false }).toArray();

    if (!playlists.length) {
      const noPlaylistsEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "No Public Playlists",
          iconURL: icons.headerIcon,
        })
        .setDescription("There are currently no public playlists available.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      await interaction.reply({ embeds: [noPlaylistsEmbed], flags: MessageFlags.Ephemeral });
      return;
    }

    await createPlaylistPagination(interaction, playlists);
  },
};
