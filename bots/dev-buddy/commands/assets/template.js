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
const { getCollection } = require("../../mongodb");
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
    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config || !config.templateChannel || !config.templateChannel.webhook) {
      await interaction.editReply({
        content: "Template channel is not configured. Use `/setchannel template` to set it first.",
      });
      return;
    }

    const { id: webhookId, token: webhookToken } = config.templateChannel.webhook;

    const webhook = await interaction.client.fetchWebhook(webhookId, webhookToken);

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
          ...(fonts.length > 0 ? ["**Fonts Used in Template**", templateFonts, ``] : []),
          `**Tags:**`,
          `${tags.map((tag) => `\`${tag}\``).join(" ")}`,
          ``,
          `**Give a ⭐ for awesome designs!**`,
          `**React with 🔥 if you're using this!**`,
        ]
          .join("\n")
      )
      .setThumbnail(`attachment://thumbnail.${originalExtension}`)
      .setFooter({
        text: `Posted by ${webhook.name}`,
        iconURL: emojis.footerIcon,
      })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Download").setStyle(ButtonStyle.Link).setURL(downloadUrl)
    );

    const message = await webhook.send({
      embeds: [embed],
      components: [button],
      files: [thumbnailFile],
    });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Template sent to the <#${config.templateChannel.id}> channel!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
