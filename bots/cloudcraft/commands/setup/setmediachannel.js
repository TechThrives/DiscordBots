const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const path = require("path");
const { updateJSON } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setmediachannel")
    .setDescription("Set the channel to send media")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The new media channel").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const configFile = path.join(__dirname, "../../channelsConfig.json");

    updateJSON("mediaChannel", channel.id, configFile);

    await interaction.reply({
      content: `Media channel has been set to <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
