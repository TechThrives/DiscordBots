const { ApplicationCommandOptionType, EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../config.js");
const musicIcons = require("../ui/icons/musicicons.js");

async function volume(client, interaction, lang) {
  try {
    const player = client.riffy.players.get(interaction.guildId);
    const volume = interaction.options.getInteger("level");

    if (!player) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: lang.volume.embed.noActivePlayer,
          iconURL: musicIcons.alertIcon,
        })
        .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
        .setDescription(lang.volume.embed.noActivePlayerDescription);

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (volume < 0 || volume > 100) {
      return interaction.reply({
        content: lang.volume.volumeRangeError,
        flags: MessageFlags.Ephemeral,
      });
    }

    player.setVolume(volume);

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setAuthor({
        name: lang.volume.embed.volumeUpdated,
        iconURL: musicIcons.volumeIcon,
      })
      .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
      .setDescription(lang.volume.embed.volumeUpdatedDescription.replace("{volume}", volume));

    return interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error setting volume:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setAuthor({
        name: lang.volume.embed.error,
        iconURL: musicIcons.alertIcon,
      })
      .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
      .setDescription(lang.volume.embed.errorDescription);

    await interaction.reply({
      embeds: [errorEmbed],
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = {
  name: "volume",
  description: "Set the volume of the current song",
  permissions: "0x0000000000000800",
  options: [
    {
      name: "level",
      description: "Volume level (0-100)",
      type: ApplicationCommandOptionType.Integer,
      required: true,
    },
  ],
  run: volume,
};
