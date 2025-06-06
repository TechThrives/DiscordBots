const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");
const { createMyPlaylistPagination } = require("../../helper/pagination");

module.exports = {
  data: new SlashCommandBuilder().setName("playlist_mine").setDescription("View your list of playlists you have created"),

  async execute(interaction) {
    const userId = interaction.user.id;

    const playlists = await getCollection("playlists").find({ userId }).toArray();

    if (!playlists.length) {
      const noPlaylistsEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "No Playlists Found",
          iconURL: icons.headerIcon,
        })
        .setDescription("You haven’t created any playlists yet.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      await interaction.reply({
        embeds: [noPlaylistsEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await createMyPlaylistPagination(interaction, playlists);
  },
};
