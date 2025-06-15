const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const icons = require("../../icons");
const { getCollection } = require("../../mongodb");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Play a song from a name or link")
    .addStringOption((option) =>
      option.setName("name").setDescription("Enter song name / link or playlist").setRequired(true),
    ),

  async execute(interaction) {
    const client = interaction.client;
    const query = interaction.options.getString("name");

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

    let player = client.riffy.players.get(interaction.guildId);

    if (!player) {
      player = client.riffy.createConnection({
        defaultVolume: 50,
        guildId: interaction.guildId,
        voiceChannel: config.channelId,
        textChannel: interaction.channelId,
        deaf: true,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const resolve = await client.riffy.resolve({
      query,
      requester: interaction.user.username,
    });

    if (!resolve || typeof resolve !== "object" || !Array.isArray(resolve.tracks)) {
      throw new TypeError("Invalid response from Riffy API.");
    }

    let addedTracks = 0;
    let isPlaylist = false;

    if (resolve.loadType === "playlist") {
      isPlaylist = true;
      for (const track of resolve.tracks) {
        track.info.requester = interaction.user.username;
        player.queue.add(track);
        addedTracks++;
      }
    } else if (resolve.loadType === "search" || resolve.loadType === "track") {
      const track = resolve.tracks[0];
      if (track) {
        track.info.requester = interaction.user.username;
        player.queue.add(track);
        addedTracks = 1;
      }
    } else {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setFooter({
          text: "Enjoy your music",
          iconURL: icons.footerIcon,
        })
        .setDescription("No results found.");

      await interaction.followUp({ embeds: [errorEmbed] });
      return;
    }

    if (!player.playing && !player.paused) {
      player.play();
    }

    const successEmbed = new EmbedBuilder()
      .setColor("#fe8a7a")
      .setAuthor({
        name: isPlaylist ? "Playlist added to queue!" : "Song added to queue!",
        iconURL: icons.headerIcon,
      })
      .setDescription(`${addedTracks} song${addedTracks !== 1 ? "s" : ""} added to the queue.`)
      .setFooter({
        text: "Enjoy your music",
        iconURL: icons.footerIcon,
      });

    await interaction.followUp({ embeds: [successEmbed] });
  },
};
