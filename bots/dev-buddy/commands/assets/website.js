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
const { websiteInfo } = require("../../helper/assetsHelper");
const store = require("../../store");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("website")
    .setDescription("Send website to the configured channel")
    .addStringOption((option) => option.setName("url").setDescription("URL of the website").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const webUrl = interaction.options.getString("url");
    const guildId = interaction.guild.id;

    const guildConfigs = getCollection("GuildConfigs");
    const config = await guildConfigs.findOne({ guildId });

    if (!config || !config.websiteChannel || !config.websiteChannel.webhook) {
      await interaction.editReply({
        content: "Website channel is not configured. Use `/setchannel website` to set it first.",
      });
      return;
    }

    const { id: webhookId, token: webhookToken } = config.websiteChannel.webhook;

    const webhook = await interaction.client.fetchWebhook(webhookId, webhookToken);

    const parsedUrl = new URL(webUrl);

    const { title, description, screenshotUrl } = await websiteInfo(parsedUrl.href);

    const response = await axios.get(screenshotUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data);

    const originalExtension = screenshotUrl.split(".").pop().split("?")[0] || "jpg";

    const thumbnailFile = new AttachmentBuilder(buffer, {
      name: `thumbnail.${originalExtension}`,
      description: "Website thumbnail",
    });

    const embed = new EmbedBuilder()
      .setTitle("NEW WEBSITE")
      .setColor(store.embedColor)
      .setAuthor({ name: "Visit Now", iconURL: store.headerIcon })
      .setDescription(
        [
          `**${title}**`,
          ``,
          `**${description}**`,
          ``,
          `**Give a ⭐ for favourite!**`,
          `**React with 🔥 if already know!**`,
        ].join("\n"),
      )
      .setThumbnail(`attachment://thumbnail.${originalExtension}`)
      .setFooter({
        text: `Posted by ${webhook.name}`,
        iconURL: store.footerIcon,
      })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("Visit").setStyle(ButtonStyle.Link).setURL(parsedUrl.href),
    );

    const message = await webhook.send({
      embeds: [embed],
      components: [button],
      files: [thumbnailFile],
    });

    await message.react("⭐");
    await message.react("🔥");

    await interaction.editReply({
      content: `Website sent to the <#${config.websiteChannel.id}> channel!`,
    });
  },
  permissions: PermissionFlagsBits.ManageGuild,
};
