const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("autoplay")
    .setDescription("Enable or disable autoplay for this server")
    .addBooleanOption((option) =>
      option.setName("enable").setDescription("Enable autoplay (true) or disable it (false)").setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const enable = interaction.options.getBoolean("enable");
    const guildId = interaction.guild.id;

    await getCollection("autoplay").updateOne({ guildId }, { $set: { autoplay: enable } }, { upsert: true });

    const embed = new EmbedBuilder()
      .setColor(enable ? "#00ff00" : "#ff0000")
      .setAuthor({
        name: "Autoplay Updated",
        iconURL: icons.headerIcon,
      })
      .setDescription(`Autoplay is now **${enable ? "enabled" : "disabled"}**.`)
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
