const { SlashCommandBuilder, EmbedBuilder, MessageFlags, PermissionFlagsBits, ChannelType } = require("discord.js");
const { getCollection } = require("../../mongodb");
const icons = require("../../icons");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setchannel")
    .setDescription("Set channel music channel for this server")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Choose a voice channel")
        .addChannelTypes(ChannelType.GuildVoice)
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");
    const guildId = interaction.guild.id;

    await getCollection("guildConfigs").updateOne({ guildId }, { $set: { channelId: channel.id } }, { upsert: true });

    const embed = new EmbedBuilder()
      .setColor("#00ff00")
      .setAuthor({
        name: "Music Channel Updated",
        iconURL: icons.headerIcon,
      })
      .setDescription("The music channel has been set.")
      .setFooter({ text: "Enjoy your music", iconURL: icons.footerIcon })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
