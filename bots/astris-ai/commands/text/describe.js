const { SlashCommandBuilder } = require("discord.js");
const { describeImage } = require("../../helper/textGeneration");

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
        content: `**Requester**\n*@${userTag}*\n\n**Description**\n${description}`,
      });
    } else {
      throw new Error("Invalid image attachment.");
    }
  },
};
