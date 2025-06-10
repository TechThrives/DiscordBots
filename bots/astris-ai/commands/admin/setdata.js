const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require("discord.js");
const { getCollection } = require("../../mongodb");
const { log } = require("../../utils/common");
const { DATA } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("setdata")
    .setDescription("Add channel for specific bot commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("image_fx_cookie")
        .setDescription("Set the image fx cookie value in database")
        .addStringOption((option) => option.setName("cookie").setDescription("The image fx cookie").setRequired(true)),
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const subcommand = interaction.options.getSubcommand();
    const config = DATA[subcommand];
    const value = interaction.options.getString(config.option);
    const guildId = interaction.guild.id;

    const guildDatas = getCollection("GuildDatas");

    try {
      await guildDatas.updateOne({ guildId }, { $set: { [config.dbField]: value } }, { upsert: true });

      log("INFO", `${config.displayName} updated for guild ${guildId}`);
      await interaction.editReply({
        content: `Successfully updated ${config.displayName}.`,
      });
    } catch (err) {
      log("ERROR", `Failed to update ${config.displayName} for guild ${guildId}: ${err.message}`);
      await interaction.editReply({
        content: "Failed to save configuration to the database.",
      });
    }
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
