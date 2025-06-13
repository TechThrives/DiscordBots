const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playlist_play")
    .setDescription("Play a custom playlist")
    .addStringOption((option) => option.setName("name").setDescription("Enter playlist name").setRequired(true)),

  async execute(interaction) {
    const client = interaction.client;
    const playlistName = interaction.options.getString("name");
    const userId = interaction.user.id;

    const config = await getCollection("guildConfigs").findOne({ guildId: interaction.guild.id });

    if (!config || !config.channelId) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({
          text: "Enjoy your music",
          iconURL: icons.footerIcon,
        })
        .setDescription("Music channel is not set. Please contact moderator.");

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!interaction.member.voice.channelId || interaction.member.voice.channelId !== config.channelId) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({
          text: "Enjoy your music",
          iconURL: icons.footerIcon,
        })
        .setDescription(`You must be in <#${config.channelId}> voice channel to use this command.`);

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!client.riffy.nodes || client.riffy.nodes.size === 0) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({
          text: "Enjoy your music",
          iconURL: icons.footerIcon,
        })
        .setDescription("No Lavalink nodes are available.");

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const playlist = await getCollection("playlists").findOne({ name: playlistName });

    if (!playlist) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setDescription("Playlist not found.");

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
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setDescription("You do not have permission to play this private playlist.");

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!playlist.songs.length) {
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
        .setDescription("The playlist is empty.");

      await interaction.reply({
        embeds: [embed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const player = client.riffy.createConnection({
      defaultVolume: 50,
      guildId: interaction.guildId,
      voiceChannel: config.channelId,
      textChannel: interaction.channelId,
      deaf: true,
    });

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    for (const song of playlist.songs) {
      const query = song.url || song.name;
      const resolve = await client.riffy.resolve({
        query,
        requester: interaction.user.username,
      });

      if (!resolve || typeof resolve !== "object") {
        throw new TypeError("Resolve response is not an object");
      }

      const { loadType, tracks } = resolve;
      if (loadType === "track" || loadType === "search") {
        const track = resolve.tracks[0];
        if (track) {
          track.info.requester = interaction.user.username;
          player.queue.add(track);
        }
      } else {
        const errorEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setAuthor({
            name: "Error",
            iconURL: icons.headerIcon,
          })
          .setDescription("Failed to resolve one or more songs in the playlist.")
          .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

        await interaction.followUp({ embeds: [errorEmbed] });
        return;
      }
    }

    if (!player.playing && !player.paused) player.play();

    const embed = new EmbedBuilder()
      .setColor("#fe8a7a")
      .setAuthor({
        name: "Playing Custom Playlist",
        iconURL: icons.headerIcon,
      })
      .setDescription(`Now playing **${playlistName}** playlist.`)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

    await interaction.followUp({ embeds: [embed] });
  },
};
