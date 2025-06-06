const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_create")
    .setDescription("Create a new playlist")
    .addStringOption((option) => option.setName("name").setDescription("Playlist name").setRequired(true))
    .addBooleanOption((option) => option.setName("private").setDescription("Make playlist private?").setRequired(true)),

  async execute(interaction) {
    const playlistName = interaction.options.getString("name");
    const isPrivate = interaction.options.getBoolean("private");
    const userId = interaction.user.id;

    const existing = await getCollection("playlists").findOne({
      name: playlistName,
    });

    if (existing) {
      const existsEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Playlist Already Exists",
          iconURL: icons.headerIcon,
        })
        .setDescription("A playlist with that name already exists in this server.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setTimestamp();

      return interaction.reply({ embeds: [existsEmbed], flags: MessageFlags.Ephemeral });
    }

    await getCollection("playlists").insertOne({
      name: playlistName,
      songs: [],
      isPrivate,
      userId,
    });

    const createdEmbed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Playlist Created",
        iconURL: icons.headerIcon,
      })
      .setDescription(
        `Playlist **${playlistName}** has been created and set as **${isPrivate ? "private" : "public"}**.`,
      )
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [createdEmbed], flags: MessageFlags.Ephemeral });
  },
};
