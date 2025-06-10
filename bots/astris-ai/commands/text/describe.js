const { SlashCommandBuilder } = require("discord.js");
const { describeImage } = require("../../helper/textGeneration");
const { CHANNELS } = require("../../constants");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("describe")
    .setDescription("Describe Image")
    .addAttachmentOption((option) => option.setName("image").setDescription("Image to regenerate").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const userTag = interaction.user.tag;
    const attachment = interaction.options.getAttachment("image");

    if (
      attachment &&
      attachment.contentType?.startsWith("image") &&
      attachment.contentType !== "image/gif" &&
      attachment.url
    ) {
      const imageUrl = attachment.url;

      const description = await describeImage(imageUrl);

      await interaction.editReply({
        files: [attachment],
      });

      await interaction.followUp({
        content: `**Description**\n*${description}*\n**Requester**\n*@${userTag}*`,
      });
    } else {
      throw new Error("Invalid image attachment.");
    }
  },
  requiresSpecificChannel: CHANNELS.text_generation.dbField,
};
