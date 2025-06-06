const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require("discord.js");
const icons = require("../../icons");

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0')
  ].join(':');
}

function createProgressBar(current, total, length = 20) {
  const progress = Math.round((current / total) * length);
  const empty = length - progress;

  const progressText = "#".repeat(progress);
  const emptyText = "-".repeat(empty);

  const currentTime = formatTime(current);
  const totalTime = formatTime(total);

  return `\`${currentTime}\` ${progressText}${emptyText} \`${totalTime}\``;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("now_playing")
    .setDescription("Shows the currently playing song with a progress bar"),

  async execute(interaction) {
    const { client, guildId } = interaction;

    try {
      const player = client.riffy.players.get(guildId);

      if (!player || !player.current) {
        const noSongEmbed = new EmbedBuilder()
          .setColor("#ff0000")
          .setAuthor({
            name: "Nothing is playing right now",
            iconURL: icons.headerIcon,
          })
          .setDescription("There is no song currently playing.")
          .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

        return interaction.reply({
          embeds: [noSongEmbed],
          flags: MessageFlags.Ephemeral,
        });
      }

      const currentSeconds = player.position / 1000;
      const totalSeconds = player.current.info.length / 1000;
      const progressBar = createProgressBar(currentSeconds, totalSeconds);

      const nowPlayingEmbed = new EmbedBuilder()
        .setColor("#fe8a7a")
        .setAuthor({
          name: "Now Playing",
          iconURL: icons.headerIcon,
        })
        .setDescription(
          `**[${player.current.info.title}](${player.current.info.uri})**\n` +
            `*by ${player.current.info.author}*\n\n` +
            `${progressBar}` +
            `\n\nRequested by: ${player.current.info.requester || "Autoplay"}` +
            `\nVolume: ${player.volume}%`
        )
        .setThumbnail(player.current.info.thumbnail)
        .setFooter({ text: "Enjoy your music!", iconURL: icons.footerIcon });

      await interaction.reply({ embeds: [nowPlayingEmbed], flags: MessageFlags.Ephemeral });
    } catch (error) {
      console.error("Error handling now playing command:", error);

      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: "Error",
          iconURL: icons.headerIcon,
        })
        .setDescription("Something went wrong while fetching the current song.")
        .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon });

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};
