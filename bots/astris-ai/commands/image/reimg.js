const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { reGenerate } = require("../../helper/imgGeneration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reimg")
    .setDescription("Regenerate image using GPT Image")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Prompt for image generation").setRequired(true),
    )
    .addAttachmentOption((option) => option.setName("image").setDescription("Image to regenerate").setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt") || "A random image";
    const userTag = interaction.user.tag;
    const attachment = interaction.options.getAttachment("image");

    if (
      attachment &&
      attachment.contentType?.startsWith("image") &&
      attachment.contentType !== "image/gif" &&
      attachment.url
    ) {
      const imageUrl = attachment.url;

      const generatedImageBuffers = await reGenerate(prompt, imageUrl);

      const attachments = generatedImageBuffers.map((base64Data, i) => {
        const buffer = Buffer.from(base64Data, "base64");
        return new AttachmentBuilder(buffer).setName(`image${i + 1}.jpg`);
      });

      await interaction.editReply({
        content: `**Prompt**\n*${prompt}*\n**Requester**\n*@${userTag}*`,
        files: attachments,
      });
    } else {
      throw new Error("Invalid image attachment.");
    }
  },
};
