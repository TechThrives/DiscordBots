const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { generateFlux } = require("../../helper/imgGeneration");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("flux")
    .setDescription("Image Generation using Flux")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Prompt for image generation").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("aspect-ratio")
        .setDescription("Aspect ratio for the generated images")
        .setRequired(false)
        .addChoices(
          { name: "Square", value: "1024:1024" },
          { name: "Portrait (9:16)", value: "768:1366" },
          { name: "Landscape (16:9)", value: "1366:768" }
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt") || "A random image";
    const aspectRatio = interaction.options.getString("aspect-ratio") || "1024:1024";
    const userTag = interaction.user.tag;

    const generatedImageBuffers = await generateFlux(prompt, aspectRatio);

    const attachments = generatedImageBuffers.map((base64Data, i) => {
      const buffer = Buffer.from(base64Data, "base64");
      return new AttachmentBuilder(buffer).setName(`image${i + 1}.jpg`);
    });

    if (attachments.length === 0) {
      await interaction.editReply({
        content: "Failed to generate images. Please try again.",
      });

      setTimeout(async () => {
        await interaction.deleteReply();
      }, 5000);
      return;
    }

    await interaction.editReply({
      content: `**Prompt**\n*${prompt}*\n**Requester**\n*@${userTag}*`,
      files: attachments,
    });
  },
};
