const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const path = require("path");
const { updateJSON } = require("../../utils/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("settemplatechannel")
    .setDescription("Set the channel to send templates")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The new template channel").setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.options.getChannel("channel");

    const configFile = path.join(__dirname, "../../channelsConfig.json");

    updateJSON("templateChannel", channel.id, configFile);

    await interaction.reply({
      content: `Template channel has been set to <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
