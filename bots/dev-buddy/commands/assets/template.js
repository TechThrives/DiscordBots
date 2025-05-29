const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  AttachmentBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const axios = require("axios");
const path = require("path");
const { loadJSON } = require("../../utils/common");
const { scrapeTemplate } = require("../../helper/assetsHelper");
const emojis = require("../../emojis");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("template")
    .setDescription("Send template to the configured channel")
    .addStringOption((option) => option.setName("url").setDescription("URL of the template").setRequired(true))
    .addStringOption((option) => option.setName("thumbnail").setDescription("URL of the thumbnail").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const templateUrl = interaction.options.getString("url");
    const thumbnailUrl = interaction.options.getString("thumbnail");
    const configFile = path.join(__dirname, "../../channelsConfig.json");
    const config = loadJSON(configFile);
    const channelId = config.templateChannel;

    if (!channelId) {
      await interaction.editReply({
        content: "Template channel is not configured. Use `/settemplatechannel` to set it first.",
      });
      return;
    }

    const channel = await interaction.client.channels.fetch(channelId);

    const parsedUrl = new URL(thumbnailUrl);
    const pathname = parsedUrl.pathname.toLowerCase();

    if (
      !pathname.endsWith(".jpg") &&
      !pathname.endsWith(".png") &&
      !pathname.endsWith(".jpeg") &&
      !pathname.endsWith(".gif")
    ) {
      await interaction.editReply({
        content:
          "Thumbnail URL is not a valid image URL. Please provide a valid image URL ending with .jpg, .png, .jpeg, or .gif.",
      });
      return;
    }

    const { title, fonts, tags, downloadUrl } = await scrapeTemplate(templateUrl);

    const response = await axios.get(thumbnailUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const originalExtension = thumbnailUrl.split(".").pop().split("?")[0] || "jpg";

    const thumbnailFile = new AttachmentBuilder(buffer, {
      name: `thumbnail.${originalExtension}`,
      description: "Template thumbnail",
    });

    const templateFonts = fonts.map((f) => `[${f.name}](${f.url})`).join("\n");

    const embed = new EmbedBuilder()
      .setTitle("NEW TEMPLATE DROP")
      .setDescription(
        [
          `**${title}**`,
          ``,
          `${fonts.length > 0 && "**Fonts Used in Template**"}`,
          fonts.length > 0 && templateFonts,
          ``,
          `**Tags:**`,
          `${tags.map((tag) => `\`${tag}\``).join(" ")}`,
          ``,
          `**Give a ⭐ for awesome designs!**`,
          `**React with 🔥 if you’re using this!**`,
        ].join("\n")
      )
      .setThumbnail(`attachment://thumbnail.${originalExtension}`)
      .setFooter({
        text: `Shared by Free-PSD-Templates.com`,
        iconURL: emojis.footerIcon,
      })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(downloadUrl)
    );

    const message = await channel.send({
      embeds: [embed],
      components: [button],
      files: [thumbnailFile],
    });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Template sent to <#${channelId}>!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
