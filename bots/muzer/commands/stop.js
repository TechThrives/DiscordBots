const { EmbedBuilder, MessageFlags } = require("discord.js");
const config = require("../config.js");
const musicIcons = require("../ui/icons/musicicons.js");

async function stop(client, interaction, lang) {
  try {
    const player = client.riffy.players.get(interaction.guildId);

    if (!player) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setAuthor({
          name: lang.stop.embed.noActivePlayer,
          iconURL: musicIcons.alertIcon,
        })
        .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
        .setDescription(lang.stop.embed.noActivePlayerDescription);

      await interaction.reply({
        embeds: [errorEmbed],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    player.stop();
    player.destroy();

    const embed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setAuthor({
        name: lang.stop.embed.musicHalted,
        iconURL: musicIcons.stopIcon,
      })
      .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
      .setDescription(lang.stop.embed.musicHaltedDescription);

    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error processing stop command:", error);
    const errorEmbed = new EmbedBuilder()
      .setColor("#ff0000")
      .setAuthor({
        name: lang.stop.embed.error,
        iconURL: musicIcons.alertIcon,
      })
      .setFooter({ text: lang.footer, iconURL: musicIcons.heartIcon })
      .setDescription(lang.stop.embed.errorDescription);

    await interaction.reply({
      embeds: [errorEmbed],
      flags: MessageFlags.Ephemeral,
    });
  }
}

module.exports = {
  name: "stop",
  description: "Stop the current song and destroy the player",
  permissions: "0x0000000000000800",
  options: [],
  run: stop,
};
